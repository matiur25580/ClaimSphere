# Policy registry, FNOL and claims intake

This milestone introduces the first operational insurance domain APIs under `/api/v1`. All policy, claim, evidence metadata and event queries are scoped to the authenticated organization.

## Policy registry

- Organization admins and claims managers can create policies for active policyholder memberships in the same organization.
- Policy records include policy number, product line, insured item, coverage summary, coverage limit, deductible, currency and effective dates.
- A policy is active only when the current time falls inside its effective window. Future-effective policies start as drafts and can be activated once the effective date is reached.
- Policy numbers are unique within an organization.
- Policyholders can list only their own policies; claims staff can list the organization portfolio.

## First Notice of Loss (FNOL)

- A claim must reference a tenant-owned policy that is active and covers the date of loss.
- Policyholders can report losses only against their own policies.
- Loss dates cannot be in the future.
- Estimated loss is stored as integer minor currency units, must use the policy currency, and cannot exceed the policy coverage limit.
- Claims start in `submitted` and receive a collision-resistant claim number.
- Claim status changes are checked against a finite transition map and role-specific permissions, then recorded as actor-attributed events.
- Claim creation, status transitions, assignment, evidence registration/review and settlement commit together with their corresponding audit event in a MongoDB transaction.
- Claim creators cannot approve/reject their own claims.
- Claims managers/admins can assign only active tenant members with the claims-adjuster role.
- Finance officers/admins can settle only approved claims and settlement cannot exceed the policy limit after deductible.

## Evidence metadata boundary

The evidence endpoint records metadata only: file name, allowed MIME type, byte size, SHA-256 checksum, category and opaque storage reference. The storage reference must not be a path or URL. It represents an object already placed in a private external storage adapter.

- Maximum declared size: 25 MiB.
- Allowed declared MIME types: PDF, JPEG, PNG, WebP and plain text.
- SHA-256 must be a 64-character hexadecimal digest.
- Evidence is pending review until an authorized adjuster/claims manager accepts or rejects it.
- Rejection requires a reason.

**No file upload, object-storage provider, malware scanner, or download endpoint is implemented in this milestone.** Never treat client-supplied metadata as proof that a file is safe or exists. A production adapter must verify the actual object, checksum, MIME signature, authorization, malware scan result, retention policy and encryption before accepting a storage reference.

## Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/policies` | Claims staff/auditor/policyholder | List tenant policies (policyholder sees own only) |
| POST | `/policies` | Organization admin/claims manager | Create policy for active policyholder membership |
| POST | `/policies/:policyId/activate` | Organization admin/claims manager | Activate a draft inside its effective window |
| GET | `/claims` | Claims staff/auditor/policyholder | Filtered paginated claims |
| POST | `/claims` | Claims staff/policyholder | Submit FNOL against an in-force policy |
| GET | `/claims/:claimId` | Claims staff/auditor/policyholder | Read claim, evidence metadata and event history |
| POST | `/claims/:claimId/transition` | Claims manager/adjuster/investigator/finance/admin | Move through allowed triage/review states |
| POST | `/claims/:claimId/assign` | Organization admin/claims manager | Assign active claims adjuster |
| POST | `/claims/:claimId/evidence` | Policyholder/claims staff | Register evidence metadata |
| PATCH | `/claims/:claimId/evidence/:evidenceId/review` | Organization admin/claims manager/adjuster | Accept or reject evidence metadata |
| POST | `/claims/:claimId/settle` | Organization admin/finance officer | Record settlement amount and note |

## Claim lifecycle

```text
submitted -> triage -> under_review -> investigation -> approved -> settled -> closed
                       |                 |
                       v                 v
                awaiting_documents <-----+
                       |
                       +-> under_review

under_review / investigation -> rejected -> closed
```

## Known limitations and next hardening

- MongoDB transactions keep claim mutations and their event records atomic; deploy on a replica set. A tamper-evident external audit export and outbox are still recommended for production.
- Evidence metadata is not an upload mechanism. Add private object storage, server-side checksum/MIME verification, malware scanning, retention and authorized downloads.
- Policyholder onboarding/invitations, policy endorsements, renewals, claims SLA scheduling, notifications, inspection assignments and document extraction are future milestones.
- No fraud score or AI decision is generated. Any future risk signals must be explainable and reviewed by an authorized human.
- Cross-tenant integration tests, concurrent workflow tests, privacy review and jurisdiction-specific insurance compliance review are required before real use.
