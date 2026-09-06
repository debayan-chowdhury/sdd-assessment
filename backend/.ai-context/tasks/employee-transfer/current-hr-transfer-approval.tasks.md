# Tasks: Current HR Transfer Approval

## Derived From
.ai-context/plans/employee-transfer/current-hr-transfer-approval.plan.md

## Sequence
- [x] current-hr-transfer-approval.T01 — Implement `computeTenureDays(employee)` helper (the flagged `Employee.createdAt`-based approximation) — test-first, including the exactly-6-months boundary case — Acceptance: AC1, AC2
- [x] current-hr-transfer-approval.T02 — Implement `currentHrApproval.controller.js`'s pending-list handler, surfacing `employeeTenureDays`/`meetsMinimumTenure` via T01 — test-first — Acceptance: AC9
- [x] current-hr-transfer-approval.T03 — Implement `currentHrApproval.controller.js`'s decision handler: accept with T01's `INELIGIBLE_TENURE` guard, reject (no reason required), `FORBIDDEN`, `INVALID_STATUS_TRANSITION`, `NOT_FOUND` — test-first — Acceptance: AC1, AC2, AC3, AC4, AC5, AC6
- [x] current-hr-transfer-approval.T04 — Add both routes to `transferRequest.routes.js` (transfer-request-submission.T06), gated by `employeeAuth.middleware.js` — test-first, including the no-token 401 case — Acceptance: AC7
- [x] current-hr-transfer-approval.T05 — Apply `transferRequestWorkflow.service.js`'s `computeEscalation` (2-day threshold) in T02/T03's handlers — test-first, including a fake-clock scenario past the 2-day threshold — Acceptance: AC8
- [x] current-hr-transfer-approval.T06 — Confirm ≥80% line coverage for T01–T05, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC9 (coverage verification, not new behavior)
