# Architecture Overview

## Initial deployment shape

ClaimSphere starts as a modular monolith: one Express API organized around bounded business modules, one React client, and MongoDB as the primary datastore. This keeps early delivery understandable while preserving clear module boundaries for future extraction when scale and operational evidence justify it.

## Trust boundaries

- The browser is untrusted. All input is validated by the API.
- Authentication identifies a principal; authorization separately checks organization membership, role, and resource access.
- Tenant context must be derived from authenticated membership, never accepted as authority from request payloads.
- Uploaded files are stored outside MongoDB. Database records retain metadata, ownership, checksums, and storage references.
- AI output is untrusted data and must be schema-validated and reviewed before it can influence a claim workflow.

## Core domain boundaries

- Identity & Organizations: users, organizations, memberships, invitations, sessions.
- Policyholders & Policies: customer identity, policy lifecycle, coverage and deductible rules.
- Claims: FNOL, claim lifecycle, assignments, reserves, and status transitions.
- Evidence: documents, files, provenance, versions, and access grants.
- Inspections: adjuster schedules, assessments, estimates, and findings.
- Investigations: review queues, explainable risk indicators, case notes, and outcomes.
- Workflow: task routing, approval policies, escalations, and SLA clocks.
- Settlement: approved amounts, payment instructions, reconciliation, and recovery.
- Audit & Analytics: append-only business events, operational metrics, and reporting.

## API conventions

- Versioned routes under /api/v1.
- Success envelope: { data }; error envelope: { error: { code, message } }.
- Validate request bodies, parameters, and query strings at module boundaries.
- Use stable machine-readable error codes and pagination for collections.
- Use idempotency keys for externally retried financial or state-changing operations.

## Security principles

- Every tenant-owned document carries an organization identifier and is queried with tenant scope.
- Tenant-specific unique indexes include the organization identifier.
- Critical transitions use transactions where supported and emit audit events.
- Sensitive evidence access uses short-lived signed URLs and explicit authorization.
- Secrets are injected through environment configuration and never committed.
- Logs must avoid credentials, tokens, document contents, and unnecessary personal data.
