# Project Constitution — SDD Assessment Backend

## Testing Discipline
- Test-first is mandatory for every API endpoint and every state-changing operation (create, update, delete, status-toggle); no exceptions for "simple" endpoints.
- Minimum 80% line coverage, project-wide. Coverage is a floor, not a target to write to.
- Node services: Jest. Not yet installed — add `jest` to `package.json` devDependencies before the first test is written.

## Security Posture
- PII (name, date of birth, phone number, email address, government ID, payment instrument) never appears in logs at any log level, including `morgan`'s request logs or debug output.
- Credentials and any signing secrets or issued auth tokens never appear in logs at any log level, regardless of which feature issues or verifies them.
- Every authenticated route sits behind JWT verification. No new route ships without an explicit auth decision documented for it — including a decision to leave a route public, with a stated reason.
- Secrets (signing secrets, database connection strings) are read from environment variables only, never hardcoded in source. `.env` files are gitignored and never committed. No dedicated secret-manager service (e.g. AWS Secrets Manager, Vault) is in use — acceptable at current scale (single environment, no shared/production deployment yet); revisit before that changes.

## Architectural Constraints
- Approved datastore: MongoDB, accessed exclusively via Mongoose. No other datastore (cache, search index, queue) is approved. Introducing one requires an ADR.
- Approved integration pattern: synchronous REST only. No messaging/event-driven layer exists or is approved.
- Frontend state management: not applicable — this is a backend-only service; no frontend code exists in this repository.

## Non-Functional Baselines
- Latency, availability, and RPO/RTO targets: not yet decided. This is currently an internal admin tool with no stated customer-facing SLA. Flagged gap, not an invented number — needs Tech Lead/Architect sign-off before this section can be considered complete.

## Versioning Rules
- REST APIs are versioned via URL path prefix (currently `/api/v1/...`). A breaking change — a removed/renamed field, a changed success/error status code, a changed auth requirement on an existing endpoint — requires bumping to a new prefix (e.g. `/api/v2/...`), never an in-place change to the existing one.
- No fixed deprecation-window policy is set yet — there are no external consumers of this API today. Set a concrete window once a real consumer/integration exists.
