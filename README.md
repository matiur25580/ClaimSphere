# ClaimSphere

**AI-assisted Enterprise Insurance Claims Intelligence & Automation Platform**

ClaimSphere is a multi-tenant insurance operations platform for the complete claims lifecycle: FNOL, policy and coverage validation, evidence collection, adjuster assignment, investigation, approvals, settlement, and recovery. Consequential claim decisions remain with authorized human reviewers.

## Implemented capabilities
- TypeScript npm-workspaces monorepo with React, Express, and shared contracts.
- MongoDB-backed user, organization, membership, and refresh-session models.
- bcrypt password hashing and validated registration/login endpoints.
- Short-lived access JWTs and HttpOnly refresh cookies with rotation and token-family reuse revocation.
- Per-request checks for active user, organization, membership, and session.
- Role-aware API middleware and authenticated organization listing/creation.
- Secure baseline middleware, versioned API, health endpoint, and CI typecheck/build workflow.

## Technology
- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MongoDB, Mongoose
- Testing: Vitest; integration and browser suites will be added as modules mature
- Delivery: Docker and GitHub Actions

## Local development
Requirements: Node.js 20.11+ and npm 10.2+.

    cp .env.example .env
    docker compose up -d mongodb
    npm install
    npm run dev

The React app runs at http://localhost:5173 and the API at http://localhost:4000.

## Authentication API
All endpoints are under /api/v1.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /auth/register | Create user, organization, owner membership, and session |
| POST | /auth/login | Authenticate and select an active organization |
| POST | /auth/refresh | Rotate HttpOnly refresh cookie and issue a new access token |
| POST | /auth/logout | Revoke the refresh-token family |
| GET | /auth/me | Return authenticated principal and active organization |
| GET | /organizations | List active organization memberships |
| POST | /organizations | Create an organization (organization admin only) |

Registration requires a valid email, password of at least 12 characters, first/last name, and organization name. Send access tokens using Authorization: Bearer. Browser refresh/logout calls must include credentials. Refresh cookies are HttpOnly, SameSite=Lax, scoped to auth routes, and Secure in production.

Configure JWT_ACCESS_SECRET to a unique random value of at least 32 characters in every deployed environment. The built-in rate limiter uses in-memory storage and must be replaced with a shared store for multi-instance deployments.

The dashboard still contains illustrative demo data and is not connected to live insurance systems. This is a portfolio engineering project, not a licensed insurance product; production use requires jurisdiction-specific compliance, security review, operational controls, and integration certification.
