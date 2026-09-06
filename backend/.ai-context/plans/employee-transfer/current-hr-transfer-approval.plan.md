# Plan: Current HR Transfer Approval

## Derived From
.ai-context/specs/employee-transfer/current-hr-transfer-approval.spec.md

## Architecture Approach
New module:
- `src/controllers/currentHrApproval.controller.js` — handlers for current-hr-transfer-approval.API01–API02, plus a small `computeTenureDays(employee)` helper (this plan's own, not shared — it's the only spec that needs it) implementing the spec's flagged `Employee.createdAt`-based approximation.

**Adds to `transferRequest.routes.js`**: `GET /api/v1/transfer-requests/pending/current-hr` and `POST /api/v1/transfer-requests/:id/current-hr-decision`, gated by `employeeAuth.middleware.js`.

## Data Model
No schema change. Reads `Employee.createdAt` (existing field, per the spec's flagged tenure approximation — no new `roleAssignedAt` field is added by this plan; that remains the spec's open recommendation, not built here). Reads/writes `TransferRequest.status` (→ `Pending Receiving HR Approval` or `Rejected`), `escalated`/`escalatedAt`, `statusEnteredAt`.

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. `computeTenureDays` gets its own unit tests independent of the controller (boundary case: exactly 6 months).
- [x] Security Posture — no new PII/credential field; reads `Employee.createdAt`, not `name`, for the tenure computation, so no PII touches this plan's logic beyond what's already covered by employee-crud-mapping.plan.md. Every endpoint sits behind `employeeAuth.middleware.js`.
- [x] Architectural Constraints — no new datastore, no messaging.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Adding a dedicated `roleAssignedAt` field to `Employee` to replace the `createdAt` approximation — the spec recommends this but doesn't require it for v1; re-derived tenure accuracy from a real "role start date" field is deferred until a BRD entry or a Gate 1 amendment asks for it.
- Disciplinary/investigation/performance/PIP/probation/cool-off checks — BRD-004, explicit, permanent; not implemented.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md and portal-login-password-change.plan.md.
1. `computeTenureDays` helper, tested independently (including the 6-month boundary).
2. `currentHrApproval.controller.js` — pending-list handler (AC9), surfacing `employeeTenureDays`/`meetsMinimumTenure`.
3. `currentHrApproval.controller.js` — decision handler (AC1–AC8), including the `INELIGIBLE_TENURE` guard on accept.
4. Add both routes to `transferRequest.routes.js`.
5. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
