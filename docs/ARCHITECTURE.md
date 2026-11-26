# Architecture Overview

ClaimSphere uses a modular-monolith architecture: a React client, Express API, and MongoDB persistence with bounded modules.

## Trust boundaries
- The browser is untrusted. All input is validated by the API.
- Authentication identifies a principal; authorization separately checks organization membership, role, and resource access.
- Tenant context is derived from authenticated membership, never trusted from request payloads.
- Uploaded files are stored outside MongoDB; database records retain metadata, ownership, checksums, and storage references.
- AI output is untrusted data and must be schema-validated and reviewed before it influences a claim workflow.

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

## Authentication and tenant security
- Passwords are hashed with bcrypt; plaintext passwords are never persisted.
- Access tokens are short-lived JWTs. Refresh tokens are opaque, stored only as SHA-256 hashes, and delivered in HttpOnly cookies.
- Refresh rotation revokes the previous token. Reuse of a revoked token revokes its complete token family.
- Each authenticated request checks the active user, organization, membership, and session against MongoDB.
- Organization scope and role are derived from the verified membership. Client-supplied organization IDs never grant access.
- Memberships have a unique user/organization compound index and organization slugs are globally unique.
- Production must use a unique JWT_ACCESS_SECRET, HTTPS, and a shared rate-limit store when horizontally scaled.

## API conventions
- Versioned routes under /api/v1; success envelope { data }; error envelope { error: { code, message } }.
- Validate request bodies, parameters, and query strings at module boundaries.
- Use stable machine-readable error codes and pagination for collections.
- Logs must avoid credentials, tokens, document contents, and unnecessary personal data.
