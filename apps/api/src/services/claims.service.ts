import { randomBytes } from "node:crypto";
import mongoose, { Types } from "mongoose";
import { Claim } from "../models/claim.model.js";
import { ClaimEvidence } from "../models/claim-evidence.model.js";
import { ClaimEvent } from "../models/claim-event.model.js";
import { Membership } from "../models/membership.model.js";
import { Policy } from "../models/policy.model.js";
import { canRoleTransition, canTransitionClaim, isEvidenceMetadataSafe, isLossCovered } from "./claims.rules.js";
type ClaimStatus = "submitted" | "triage" | "under_review" | "awaiting_documents" | "investigation" | "approved" | "rejected" | "settled" | "closed";

export class ClaimsError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}
function fail(status: number, code: string, message: string): never { throw new ClaimsError(status, code, message); }
const validId = (value: string) => Types.ObjectId.isValid(value);
const claimNumber = () => "CLM-" + new Date().toISOString().slice(0,10).replaceAll("-","") + "-" + randomBytes(4).toString("hex").toUpperCase();
async function appendEvent(input: { organizationId: string; claimId: string; actorId: string; action: string; fromStatus?: string | null; toStatus?: string | null; metadata?: Record<string, unknown> }, session?: mongoose.ClientSession) {
  const payload = { ...input, ...(input.fromStatus !== undefined ? { fromStatus: input.fromStatus } : {}), ...(input.toStatus !== undefined ? { toStatus: input.toStatus } : {}) };
  if (session) await ClaimEvent.create([payload], { session });
  else await ClaimEvent.create(payload);
}

export async function createPolicy(org: string, actor: string, input: {
  policyNumber: string; policyholderUserId: string; productLine: string; insuredItem: string; coverageSummary: string;
  coverageLimitMinor: number; deductibleMinor: number; currency: string; effectiveAt: string; expiresAt: string;
}) {
  if (!validId(input.policyholderUserId)) fail(400, "INVALID_POLICYHOLDER", "A valid policyholder user identifier is required.");
  const member = await Membership.findOne({ userId: input.policyholderUserId, organizationId: org, status: "active", role: "policyholder" }).select("_id");
  if (!member) fail(400, "POLICYHOLDER_MEMBERSHIP_REQUIRED", "The policyholder must have an active policyholder membership in this organization.");
  const effectiveAt = new Date(input.effectiveAt), expiresAt = new Date(input.expiresAt), now = new Date();
  if (!Number.isFinite(effectiveAt.getTime()) || !Number.isFinite(expiresAt.getTime()) || expiresAt <= effectiveAt || expiresAt <= now) fail(400, "INVALID_POLICY_TERM", "Policy expiry must be after its effective date and in the future.");
  if (input.deductibleMinor > input.coverageLimitMinor) fail(400, "INVALID_POLICY_LIMITS", "The deductible cannot exceed the coverage limit.");
  const status = effectiveAt <= now && expiresAt >= now ? "active" : "draft";
  return Policy.create({ ...input, organizationId: org, policyNumber: input.policyNumber.toUpperCase(), currency: input.currency.toUpperCase(), effectiveAt, expiresAt, status, createdBy: actor, updatedBy: actor });
}

export async function listPolicies(org: string, actor: string, role: string, filters: { status?: string | undefined; page: number; limit: number }) {
  const query: Record<string, unknown> = { organizationId: org };
  if (role === "policyholder") query.policyholderUserId = actor;
  if (filters.status) query.status = filters.status;
  const [policies, total] = await Promise.all([
    Policy.find(query).sort({ createdAt: -1, _id: 1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
    Policy.countDocuments(query)
  ]);
  return { policies, pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) } };
}

export async function createClaim(org: string, actor: string, role: string, input: {
  policyId: string; lossDate: string; lossType: string; lossDescription: string; estimatedLossMinor: number; severity: string;
}) {
  if (!validId(input.policyId)) fail(400, "INVALID_POLICY_ID", "A valid policy identifier is required.");
  const policy = await Policy.findOne({ _id: input.policyId, organizationId: org }).lean();
  if (!policy) fail(404, "POLICY_NOT_FOUND", "The policy was not found in this organization.");
  if (role === "policyholder" && String(policy.policyholderUserId) !== actor) fail(403, "POLICYHOLDER_ACCESS_DENIED", "You can only report a loss against your own policy.");
  if (new Date(input.lossDate) > new Date()) fail(400, "FUTURE_LOSS_DATE", "The date of loss cannot be in the future.");
  if (!isLossCovered(policy.status, policy.effectiveAt, policy.expiresAt, input.lossDate)) fail(409, "POLICY_NOT_IN_FORCE", "The policy must be active and the loss date must fall within its effective coverage period.");
  if (input.estimatedLossMinor > policy.coverageLimitMinor) fail(400, "ESTIMATE_EXCEEDS_COVERAGE", "The estimated loss cannot exceed the policy coverage limit.");
  const session = await mongoose.startSession();
  let claimId: Types.ObjectId | undefined;
  try {
    await session.withTransaction(async () => {
      const [claim] = await Claim.create([{
        organizationId: org, claimNumber: claimNumber(), policyId: policy._id,
        policyholderUserId: policy.policyholderUserId, lossDate: new Date(input.lossDate),
        lossType: input.lossType, lossDescription: input.lossDescription,
        estimatedLossMinor: input.estimatedLossMinor, currency: policy.currency,
        severity: input.severity, status: "submitted", createdBy: actor, updatedBy: actor
      }], { session });
      if (!claim) fail(500, "CLAIM_CREATE_FAILED", "The claim could not be created.");
      claimId = claim._id;
      await appendEvent({ organizationId: org, claimId: String(claim._id), actorId: actor, action: "claim_submitted", toStatus: "submitted", metadata: { claimNumber: claim.claimNumber, policyId: String(policy._id) } }, session);
    });
  } finally { await session.endSession(); }
  if (!claimId) fail(500, "CLAIM_CREATE_FAILED", "The claim could not be created.");
  return getClaim(org, String(claimId), actor, role);
}

export async function listClaims(org: string, actor: string, role: string, filters: { status?: string | undefined; severity?: string | undefined; page: number; limit: number }) {
  const query: Record<string, unknown> = { organizationId: org };
  if (role === "policyholder") query.policyholderUserId = actor;
  if (filters.status) query.status = filters.status;
  if (filters.severity) query.severity = filters.severity;
  const [claims, total] = await Promise.all([
    Claim.find(query).populate("policyId", "policyNumber productLine currency coverageLimitMinor").populate("assignedAdjusterId", "firstName lastName email")
      .sort({ reportedAt: -1, _id: 1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
    Claim.countDocuments(query)
  ]);
  return { claims, pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) } };
}

export async function getClaim(org: string, id: string, actor: string, role: string) {
  if (!validId(id)) fail(400, "INVALID_CLAIM_ID", "A valid claim identifier is required.");
  const query: Record<string, unknown> = { _id: id, organizationId: org };
  if (role === "policyholder") query.policyholderUserId = actor;
  const claim = await Claim.findOne(query).populate("policyId", "policyNumber productLine insuredItem coverageSummary coverageLimitMinor deductibleMinor currency effectiveAt expiresAt")
    .populate("assignedAdjusterId", "firstName lastName email").lean();
  if (!claim) fail(404, "CLAIM_NOT_FOUND", "The claim was not found in this organization.");
  const [evidence, events] = await Promise.all([
    ClaimEvidence.find({ claimId: id, organizationId: org }).sort({ createdAt: -1 }).lean(),
    ClaimEvent.find({ claimId: id, organizationId: org }).populate("actorId", "firstName lastName email").sort({ occurredAt: 1 }).lean()
  ]);
  return { claim, evidence, events };
}

export async function transitionClaim(org: string, actor: string, role: string, id: string, toStatus: ClaimStatus, note = "") {
  if (!validId(id)) fail(400, "INVALID_CLAIM_ID", "A valid claim identifier is required.");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const claim = await Claim.findOne({ _id: id, organizationId: org }).session(session);
      if (!claim) fail(404, "CLAIM_NOT_FOUND", "The claim was not found in this organization.");
      const fromStatus = claim.status;
      if (!canTransitionClaim(fromStatus, toStatus)) fail(409, "INVALID_CLAIM_TRANSITION", `A claim cannot move from ${fromStatus} to ${toStatus}.`);
      if (!canRoleTransition(role, toStatus)) fail(403, "CLAIM_TRANSITION_PERMISSION_REQUIRED", "Your organization role cannot perform this claim transition.");
      if (["approved", "rejected"].includes(toStatus)) {
        if (!["organization_admin", "claims_manager", "finance_officer"].includes(role)) fail(403, "CLAIM_DECISION_PERMISSION_REQUIRED", "Only an authorized claims or finance reviewer can decide this claim.");
        if (String(claim.createdBy) === actor) fail(403, "SELF_REVIEW_BLOCKED", "The claim creator cannot approve or reject their own claim.");
        if (note.trim().length < 5) fail(400, "DECISION_NOTE_REQUIRED", "An approval or rejection rationale of at least five characters is required.");
        claim.decision = note;
        claim.decisionBy = new Types.ObjectId(actor);
        claim.decidedAt = new Date();
      }
      claim.status = toStatus;
      claim.updatedBy = new Types.ObjectId(actor);
      await claim.save({ session });
      await appendEvent({ organizationId: org, claimId: id, actorId: actor, action: "claim_status_changed", fromStatus, toStatus, metadata: { note } }, session);
    });
  } finally { await session.endSession(); }
  return getClaim(org, id, actor, role);
}

export async function assignClaim(org: string, actor: string, id: string, adjusterUserId: string) {
  if (!validId(id) || !validId(adjusterUserId)) fail(400, "INVALID_CLAIM_ASSIGNMENT", "Valid claim and adjuster identifiers are required.");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const adjuster = await Membership.findOne({ userId: adjusterUserId, organizationId: org, status: "active", role: "claims_adjuster" }).select("_id").session(session);
      if (!adjuster) fail(400, "ADJUSTER_MEMBERSHIP_REQUIRED", "The adjuster must have an active claims-adjuster membership in this organization.");
      const claim = await Claim.findOne({ _id: id, organizationId: org, status: { $nin: ["closed", "rejected", "settled"] } }).session(session);
      if (!claim) fail(404, "CLAIM_NOT_ASSIGNABLE", "The claim was not found or is no longer assignable.");
      const previous = claim.assignedAdjusterId ? String(claim.assignedAdjusterId) : null;
      claim.assignedAdjusterId = new Types.ObjectId(adjusterUserId);
      claim.updatedBy = new Types.ObjectId(actor);
      await claim.save({ session });
      await appendEvent({ organizationId: org, claimId: id, actorId: actor, action: "claim_assigned", metadata: { previousAdjusterId: previous, adjusterUserId } }, session);
    });
  } finally { await session.endSession(); }
  return getClaim(org, id, actor, "claims_manager");
}

export async function addClaimEvidence(org: string, actor: string, role: string, id: string, input: {
  fileName: string; mimeType: string; sizeBytes: number; sha256: string; storageRef: string; category: string;
}) {
  if (!validId(id)) fail(400, "INVALID_CLAIM_ID", "A valid claim identifier is required.");
  if (!isEvidenceMetadataSafe(input)) fail(400, "UNSAFE_EVIDENCE_METADATA", "Evidence metadata must include a SHA-256 checksum, opaque storage reference and a file size up to 25 MB.");
  const session = await mongoose.startSession();
  let evidenceId: Types.ObjectId | undefined;
  try {
    await session.withTransaction(async () => {
      const claim = await Claim.findOne({ _id: id, organizationId: org, status: { $nin: ["closed", "rejected", "settled"] }, ...(role === "policyholder" ? { policyholderUserId: actor } : {}) }).session(session);
      if (!claim) fail(404, "CLAIM_NOT_FOUND", "The claim was not found or is not available for evidence submission.");
      const [evidence] = await ClaimEvidence.create([{ ...input, organizationId: org, claimId: id, uploadedBy: actor }], { session });
      if (!evidence) fail(500, "EVIDENCE_CREATE_FAILED", "Evidence metadata could not be registered.");
      evidenceId = evidence._id;
      await appendEvent({ organizationId: org, claimId: id, actorId: actor, action: "claim_evidence_metadata_added", metadata: { evidenceId: evidence.id, category: input.category, sizeBytes: input.sizeBytes } }, session);
    });
  } finally { await session.endSession(); }
  if (!evidenceId) fail(500, "EVIDENCE_CREATE_FAILED", "Evidence metadata could not be registered.");
  return ClaimEvidence.findOne({ _id: evidenceId, organizationId: org }).lean();
}

export async function reviewClaimEvidence(org: string, actor: string, claimId: string, evidenceId: string, status: "accepted" | "rejected", note: string) {
  if (!validId(claimId) || !validId(evidenceId)) fail(400, "INVALID_EVIDENCE_ID", "Valid claim and evidence identifiers are required.");
  if (status === "rejected" && note.trim().length < 5) fail(400, "EVIDENCE_REJECTION_REASON_REQUIRED", "A reason is required to reject evidence.");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const evidence = await ClaimEvidence.findOne({ _id: evidenceId, claimId, organizationId: org, status: "pending_review" }).session(session);
      if (!evidence) fail(404, "EVIDENCE_NOT_FOUND", "Pending evidence metadata was not found in this organization.");
      evidence.status = status;
      evidence.reviewedBy = new Types.ObjectId(actor);
      evidence.reviewedAt = new Date();
      evidence.reviewNote = note;
      await evidence.save({ session });
      await appendEvent({ organizationId: org, claimId, actorId: actor, action: "claim_evidence_reviewed", metadata: { evidenceId, status, note } }, session);
    });
  } finally { await session.endSession(); }
  return ClaimEvidence.findOne({ _id: evidenceId, claimId, organizationId: org }).lean();
}

export async function settleClaim(org: string, actor: string, id: string, settlementAmountMinor: number, note: string) {
  if (!validId(id)) fail(400, "INVALID_CLAIM_ID", "A valid claim identifier is required.");
  if (!Number.isSafeInteger(settlementAmountMinor) || settlementAmountMinor < 0) fail(400, "INVALID_SETTLEMENT_AMOUNT", "Settlement amount must be a non-negative integer in minor currency units.");
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const claim = await Claim.findOne({ _id: id, organizationId: org, status: "approved" }).session(session);
      if (!claim) fail(409, "CLAIM_NOT_APPROVED", "Only an approved claim can be settled.");
      const policy = await Policy.findOne({ _id: claim.policyId, organizationId: org }).select("coverageLimitMinor deductibleMinor currency").session(session);
      if (!policy || policy.currency !== claim.currency || settlementAmountMinor > Math.max(0, policy.coverageLimitMinor - policy.deductibleMinor)) fail(400, "SETTLEMENT_LIMIT_EXCEEDED", "Settlement must use the policy currency and cannot exceed the policy limit after deductible.");
      claim.status = "settled";
      claim.settlementAmountMinor = settlementAmountMinor;
      claim.settledAt = new Date();
      claim.decision = note;
      claim.updatedBy = new Types.ObjectId(actor);
      await claim.save({ session });
      await appendEvent({ organizationId: org, claimId: id, actorId: actor, action: "claim_settled", fromStatus: "approved", toStatus: "settled", metadata: { settlementAmountMinor, currency: claim.currency, note } }, session);
    });
  } finally { await session.endSession(); }
  return getClaim(org, id, actor, "finance_officer");
}

export async function activatePolicy(org: string, actor: string, id: string) {
  if (!validId(id)) fail(400, "INVALID_POLICY_ID", "A valid policy identifier is required.");
  const now = new Date();
  const policy = await Policy.findOneAndUpdate(
    { _id: id, organizationId: org, status: "draft", effectiveAt: { $lte: now }, expiresAt: { $gt: now } },
    { $set: { status: "active", updatedBy: actor } },
    { new: true, runValidators: true }
  );
  if (!policy) fail(409, "POLICY_NOT_ACTIVATABLE", "Only a draft policy within its effective date window can be activated.");
  return policy;
}
