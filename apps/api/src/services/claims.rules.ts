export const CLAIM_TRANSITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  submitted: ["triage"],
  triage: ["under_review", "awaiting_documents", "investigation"],
  under_review: ["awaiting_documents", "investigation", "approved", "rejected"],
  awaiting_documents: ["under_review", "investigation"],
  investigation: ["under_review", "approved", "rejected"],
  approved: ["settled"],
  rejected: ["closed"],
  settled: ["closed"],
  closed: []
});

export function isLossCovered(status: string, effectiveAt: Date | string, expiresAt: Date | string, lossDate: Date | string): boolean {
  const loss = new Date(lossDate).getTime();
  return status === "active" && loss >= new Date(effectiveAt).getTime() && loss <= new Date(expiresAt).getTime();
}

export function canTransitionClaim(from: string, to: string): boolean {
  return (CLAIM_TRANSITIONS[from] ?? []).includes(to);
}

export function isEvidenceMetadataSafe(input: { sizeBytes: number; sha256: string; storageRef: string }): boolean {
  return Number.isSafeInteger(input.sizeBytes) && input.sizeBytes > 0 && input.sizeBytes <= 25 * 1024 * 1024
    && /^[a-f0-9]{64}$/i.test(input.sha256)
    && /^[A-Za-z0-9_-]{12,180}$/.test(input.storageRef);
}
