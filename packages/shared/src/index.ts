export type ClaimStatus = "draft" | "submitted" | "triage" | "under_review" | "investigation" | "awaiting_documents" | "approved" | "rejected" | "settled" | "closed";
export type UserRole = "platform_admin" | "organization_admin" | "claims_manager" | "claims_adjuster" | "fraud_investigator" | "finance_officer" | "auditor" | "policyholder" | "repair_partner";
export interface ApiSuccess<T> { data: T; }
export interface ApiFailure { error: { code: string; message: string; requestId?: string }; }
