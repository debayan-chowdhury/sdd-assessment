# Plan: Current Manager Transfer Approval

## Derived From
.ai-context/specs/employee-transfer/current-manager-transfer-approval.spec.md

## Architecture Approach
New module:
- `src/controllers/currentManagerApproval.controller.js` — handlers for current-manager-transfer-approval.API01–API02, using `transferRequestWorkflow.service.js`'s `computeEscalation` on every read.

**Adds to `transferRequest.routes.js`** (owned by transfer-request-submission.plan.md, which must land first): `GET /api/v1/transfer-requests/pending/current-manager` and `POST /api/v1/transfer-requests/:id/current-manager-decision`, both gated by `employeeAuth.middleware.js`.

No new middleware — `403 FORBIDDEN` (caller isn't this request's `currentManagerId`) is an in-controller check, not a generic authorization middleware, since "am I the assigned actor for *this specific document*" isn't expressible as a route-level role check the way `employeeAuth.middleware.js`'s JWT verification is.

## Data Model
No schema change. Reads/writes `TransferRequest.status` (→ `Pending Current HR Approval` or `Rejected`), `rejectionReason`, `escalated`/`escalatedAt`, and resets `statusEnteredAt` on every transition (transfer-request-submission.plan.md's field, reused here).

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor.
- [x] Security Posture — no new PII/credential field. Every endpoint sits behind `employeeAuth.middleware.js` — no public route in this plan.
- [x] Architectural Constraints — no new datastore, no messaging; reuses the existing `TransferRequest` collection and the lazy-escalation pattern from transfer-request-submission.plan.md.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Team-continuity/handover administration beyond the accept/reject gate — per spec, no BRD-003 requirement to build against.
- The case where the employee's own manager changes as part of the same transfer — BRD-003, explicit, permanent.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md (model + service) and portal-login-password-change.plan.md (auth middleware) already landing.
1. `currentManagerApproval.controller.js` — pending-list handler (AC9).
2. `currentManagerApproval.controller.js` — decision handler (AC1–AC8), including the `REASON_REQUIRED` check on reject and the `INVALID_STATUS_TRANSITION` guard.
3. Add both routes to `transferRequest.routes.js`.
4. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
