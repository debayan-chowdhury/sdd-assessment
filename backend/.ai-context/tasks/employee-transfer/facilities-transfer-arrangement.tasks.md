# Tasks: Facilities Transfer Arrangement

## Derived From
.ai-context/plans/employee-transfer/facilities-transfer-arrangement.plan.md

## Sequence
- [x] facilities-transfer-arrangement.T01 — Implement `facilitiesArrangement.controller.js`'s status-report handler (`POST .../facilities-status`): `Done`/`Need Information` branches (appending to `TransferRequest.fulfillmentMessages` with `target: 'facilities', direction: 'report'`), `message`-required-on-Need-Information validation, `INVALID_STATUS_TRANSITION` guard (including the `'Not Applicable'` location-unchanged case), `NOT_FOUND` — test-first — Acceptance: AC1, AC2, AC3, AC4, AC5, AC7
- [x] facilities-transfer-arrangement.T02 — Implement the pending-list handler (`GET .../pending/facilities`) — test-first — Acceptance: AC10
- [x] facilities-transfer-arrangement.T03 — Add the `req.employee.roleCategory === 'Facilities'` check (403 `FORBIDDEN`) to both T01/T02's handlers — test-first — Acceptance: AC6
- [x] facilities-transfer-arrangement.T04 — Add both routes to `transferRequest.routes.js` (transfer-request-submission.T06), gated by `employeeAuth.middleware.js` — test-first, including the no-token 401 case — Acceptance: AC8
- [x] facilities-transfer-arrangement.T05 — Apply `transferRequestWorkflow.service.js`'s `computeEscalation` (5-business-day threshold) in T02's handler — test-first, including a fake-clock scenario past the 5-business-day threshold — Acceptance: AC9
- [x] facilities-transfer-arrangement.T06 — Confirm ≥80% line coverage for T01–T05, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC10 (coverage verification, not new behavior)

## Note
T01/T02 depend on receiving-hr-transfer-gatekeeping.T05 (trigger-fulfillment, which sets `facilitiesStatus` to `Pending` or `Not Applicable` based on the location-change comparison) for end-to-end testability, per the plan's Sequencing.
