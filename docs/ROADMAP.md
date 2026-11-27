# Development Roadmap

- [x] Repository product definition and initial architecture
- [x] TypeScript monorepo skeleton
- [x] Express API bootstrap, validated environment, MongoDB connection, health endpoint
- [x] React operations dashboard shell with clearly marked demo data
- [x] Docker Compose MongoDB development service
- [x] Enterprise authentication foundation: bcrypt credentials, short-lived access JWTs, refresh rotation and revocation
- [x] Organization and membership foundation with tenant-derived request context and role authorization
- [x] Browser registration/login and authenticated session lifecycle
- [x] MongoDB-backed authentication integration tests and production dependency audit gate
- [ ] Organization invitations and membership administration
- [ ] Customer and policy management
- [ ] FNOL and claims lifecycle
- [ ] Evidence upload and document metadata
- [ ] Adjuster assignment and inspections
- [ ] Workflow, approvals, and SLA engine
- [ ] Explainable fraud indicators and investigation cases
- [ ] Settlement, reconciliation, and recovery
- [ ] Realtime notifications and operational analytics
- [ ] AI-assisted document extraction with human verification
- [ ] Catastrophe response intelligence and operational simulation
- [ ] Production hardening, observability, backup, and deployment

## Milestone acceptance policy
A milestone is complete only when documented behavior exists in code, authorization and validation are implemented, tests cover important success and failure paths, and README/API documentation is updated. Roadmap checkboxes are not proof of implementation by themselves.
