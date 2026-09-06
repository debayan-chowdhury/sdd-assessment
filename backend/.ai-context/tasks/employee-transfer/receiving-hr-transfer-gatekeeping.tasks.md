# Tasks: Receiving HR Transfer Gatekeeping

## Derived From
.ai-context/plans/employee-transfer/receiving-hr-transfer-gatekeeping.plan.md

## Sequence
- [x] receiving-hr-transfer-gatekeeping.T01 — Add `validateManagerAssignment(managerId, locationId, departmentId)` to `transferRequestWorkflow.service.js` (active, `Manager`-category, at the given Department+Location) — test-first — Acceptance: AC3
- [x] receiving-hr-transfer-gatekeeping.T02 — Implement `receivingHrGatekeeping.controller.js`'s gate-decision handler (`POST .../receiving-hr-gate-decision`): accept (using T01, updates the target Employee's `locationId`/`departmentId`/`roleId`), reject — test-first — Acceptance: AC1, AC2, AC3
- [x] receiving-hr-transfer-gatekeeping.T03 — Implement the gate pending-list handler (`GET .../pending/receiving-hr-gate`) — test-first — Acceptance: AC14
- [x] receiving-hr-transfer-gatekeeping.T04 — Implement the reassign-manager handler (`POST .../reassign-manager`), reusing T01 — test-first — Acceptance: AC4
- [x] receiving-hr-transfer-gatekeeping.T05 — Implement the trigger-fulfillment handler (`POST .../trigger-fulfillment`): sets `payrollStatus`/`itStatus` to `Pending`, `facilitiesStatus` per the `newLocationId !== currentLocationId` comparison — test-first — Acceptance: AC5
- [x] receiving-hr-transfer-gatekeeping.T06 — Implement the fulfillment pending-list handler (`GET .../pending/receiving-hr-fulfillment`) — test-first — Acceptance: AC14
- [x] receiving-hr-transfer-gatekeeping.T07 — Implement the respond-need-information handler (`POST .../respond-need-information`), appending a `direction: 'reply'` entry to `TransferRequest.fulfillmentMessages` — test-first — Acceptance: AC6
- [x] receiving-hr-transfer-gatekeeping.T08 — Implement the confirm-completion handler (`POST .../confirm-completion`) — test-first — Acceptance: AC7, AC8
- [x] receiving-hr-transfer-gatekeeping.T09 — Implement the reopen-hold handler (`POST .../reopen-hold`), reusing T01, including the 6-month `HOLD_WINDOW_EXPIRED` check against `holdStartedAt` — test-first — Acceptance: AC9, AC10
- [x] receiving-hr-transfer-gatekeeping.T10 — Add all 8 routes (T02–T09) to `transferRequest.routes.js` (transfer-request-submission.T06), gated by `employeeAuth.middleware.js` — test-first, covering the no-token 401 and wrong-caller 403 cases across the set — Acceptance: AC11, AC12, AC13
- [x] receiving-hr-transfer-gatekeeping.T11 — Confirm ≥80% line coverage for T01–T10, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC14 (coverage verification, not new behavior)
