# Tasks: Transfer Request Submission

## Derived From
.ai-context/plans/employee-transfer/transfer-request-submission.plan.md

## Sequence
- [x] transfer-request-submission.T01 — Implement `TransferRequest` Mongoose model (full shape: status enum, snapshot fields, `rejectedManagerIds`, `fulfillmentMessages`, `escalated`/`escalatedAt`, `statusEnteredAt`) and the `{employeeId, status}` index — test-first — Acceptance: AC1
- [x] transfer-request-submission.T02 — Implement `transferRequestWorkflow.service.js`'s `resolveReceivingHr(locationId, departmentId)` and `findCandidateManagers(locationId, departmentId, excludeIds)` — test-first — Acceptance: AC6, AC7
- [x] transfer-request-submission.T03 — Implement `transferRequestWorkflow.service.js`'s `computeEscalation(request, thresholdDays, businessDaysOnly)` — test-first, including a business-day-only threshold case — Acceptance: no dedicated AC in this spec (BRD-002 doesn't define escalation itself); this shared utility is what current-manager-transfer-approval.AC8, current-hr-transfer-approval.AC8, receiving-manager-transfer-approval.AC10, and payroll/it/facilities-transfer-*.AC9 each depend on and cite directly
- [x] transfer-request-submission.T04 — Implement `transferRequest.controller.js`'s create handler (30-day check, active-request check, Location/Department/Role validation, `ROLE_NOT_ENABLED_FOR_DEPARTMENT`, Receiving HR resolution via T02, Current Manager/HR snapshot from the Employee record) — test-first — Acceptance: AC1, AC2, AC3, AC4, AC5, AC8
- [x] transfer-request-submission.T05 — Implement `transferRequest.controller.js`'s `GET .../me` and `GET .../:id` handlers, applying T03's `computeEscalation` to every returned request, and the ownership check (403 `FORBIDDEN`) on `GET .../:id` — test-first — Acceptance: AC10, AC11
- [x] transfer-request-submission.T06 — Implement `transferRequest.routes.js`, mounted at `/api/v1/transfer-requests` in `src/index.js`, gated by `employeeAuth.middleware.js` (portal-login-password-change.T02) — test-first, including the no-token 401 case — Acceptance: AC9
- [x] transfer-request-submission.T07 — Confirm ≥80% line coverage for T01–T06, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC11 (coverage verification, not new behavior)

## Note
This plan's `transferRequest.routes.js` (T06) is the shared route file every other Employee Transfer journey plan appends its own routes to — it must exist before any downstream journey plan's routing task runs, though each downstream plan adds its own routes independently rather than modifying T06 itself.
