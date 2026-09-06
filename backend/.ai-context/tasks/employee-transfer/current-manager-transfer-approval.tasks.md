# Tasks: Current Manager Transfer Approval

## Derived From
.ai-context/plans/employee-transfer/current-manager-transfer-approval.plan.md

## Sequence
- [x] current-manager-transfer-approval.T01 — Implement `currentManagerApproval.controller.js`'s pending-list handler (`GET .../pending/current-manager`) — test-first — Acceptance: AC9
- [x] current-manager-transfer-approval.T02 — Implement `currentManagerApproval.controller.js`'s decision handler (`POST .../current-manager-decision`): accept, reject with `REASON_REQUIRED` validation, `FORBIDDEN`, `INVALID_STATUS_TRANSITION`, `NOT_FOUND` — test-first — Acceptance: AC1, AC2, AC3, AC4, AC5, AC6
- [x] current-manager-transfer-approval.T03 — Add both routes to `transferRequest.routes.js` (transfer-request-submission.T06), gated by `employeeAuth.middleware.js` — test-first, including the no-token 401 case — Acceptance: AC7
- [x] current-manager-transfer-approval.T04 — Apply `transferRequestWorkflow.service.js`'s `computeEscalation` (2-day threshold) in T01/T02's handlers — test-first, including a fake-clock scenario past the 2-day threshold — Acceptance: AC8
- [x] current-manager-transfer-approval.T05 — Confirm ≥80% line coverage for T01–T04, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC9 (coverage verification, not new behavior)
