# ClaimSphere

**AI-assisted Enterprise Insurance Claims Intelligence & Automation Platform**

ClaimSphere is a multi-tenant insurance operations platform designed to coordinate the complete claims lifecycle: first notice of loss (FNOL), policy and coverage validation, evidence collection, adjuster assignment, investigation, approvals, settlement, and recovery.

The platform is built with the MERN stack and TypeScript. AI capabilities are designed as decision-support tools: consequential claim decisions remain with authorized human reviewers.

## Product goals

- Give policyholders a transparent, accessible claims experience.
- Help claims teams coordinate work, evidence, deadlines, and approvals.
- Give investigators explainable signals for prioritizing suspicious cases.
- Give managers operational visibility into workload, service levels, and exposure.
- Provide strong tenant isolation, authorization, and auditable business events.

## Planned capabilities

1. Enterprise identity, organizations, memberships, and tenant-aware authorization.
2. Customer, policy, coverage, and claims records.
3. FNOL intake and secure evidence/document handling.
4. Adjuster assignment, inspections, and damage assessments.
5. Configurable workflows, approvals, escalations, and SLA tracking.
6. Explainable fraud indicators and investigation case management.
7. Settlement, reconciliation, and recovery tracking.
8. Operational analytics, real-time notifications, and catastrophe response.
9. AI-assisted document extraction with human verification.
10. Audit, governance, observability, and production deployment.

## Technology direction

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB, Mongoose
- **Async processing:** Redis and BullMQ (introduced in later milestones)
- **Realtime:** Socket.IO (introduced in later milestones)
- **Testing:** Vitest, Supertest, and Playwright (as modules mature)
- **Delivery:** Docker and GitHub Actions

## Repository layout

```text
apps/
  web/       React application
  api/       Express API
packages/
  shared/    Shared contracts and utilities
docs/        Architecture and product documentation
infrastructure/
```

## Development principles

- Secure-by-default authorization and tenant scoping.
- Validate all external input at system boundaries.
- Keep domain logic out of HTTP controllers.
- Never trust client-provided organization identifiers without membership checks.
- Treat AI output as untrusted, reviewable suggestions.
- Record sensitive state transitions in an auditable event history.
- Prefer explicit, tested business rules over hidden automation.

## Local development

Requirements: Node.js 20.11+ and npm 10.2+.

```bash
cp .env.example .env
docker compose up -d mongodb
npm install
npm run dev
```

The React app runs at http://localhost:5173 and the API runs at http://localhost:4000. The API health endpoint is http://localhost:4000/api/v1/health. The API currently expects MongoDB to be available before it starts.

The dashboard currently uses illustrative demo data; it is not yet connected to claims APIs or a live insurance provider.

## Project status

The repository is being developed incrementally. See [docs/ROADMAP.md](docs/ROADMAP.md) for milestones and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the initial system design.

## Disclaimer

ClaimSphere is a portfolio engineering project, not a licensed insurance product or a substitute for legal, regulatory, actuarial, or professional claims advice. Production use would require jurisdiction-specific compliance, security review, operational controls, and integration certification.
