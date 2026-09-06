# Tasks: Receiving Manager Transfer Approval

## Derived From
.ai-context/plans/employee-transfer/receiving-manager-transfer-approval.plan.md

## Sequence
- [x] receiving-manager-transfer-approval.T01 — Implement `receivingManagerApproval.controller.js`'s pending-list handler (`GET .../pending/receiving-manager`) — test-first — Acceptance: AC11
- [x] receiving-manager-transfer-approval.T02 — Implement the decision handler's accept branch (`status: 'Pending Fulfillment Trigger'`) — test-first — Acceptance: AC1
- [x] receiving-manager-transfer-approval.T03 — Implement the decision handler's reject branch: append to `rejectedManagerIds`, call `transferRequestWorkflow.service.js`'s `findCandidateManagers` — reassign path if candidates remain, auto-`Hold` if none (one code path covering both the single-manager and multi-manager-exhausted cases) — test-first, covering both cases explicitly — Acceptance: AC2, AC3, AC4, AC5
- [x] receiving-manager-transfer-approval.T04 — Add the `reasonCode` enum validation, `FORBIDDEN`, `INVALID_STATUS_TRANSITION`, and `NOT_FOUND` guards to the decision handler — test-first — Acceptance: AC6, AC7, AC8
- [x] receiving-manager-transfer-approval.T05 — Add both routes to `transferRequest.routes.js` (transfer-request-submission.T06), gated by `employeeAuth.middleware.js` — test-first, including the no-token 401 case — Acceptance: AC9
- [x] receiving-manager-transfer-approval.T06 — Apply `transferRequestWorkflow.service.js`'s `computeEscalation` (2-day threshold) in T01's handler — test-first, including a fake-clock scenario past the 2-day threshold — Acceptance: AC10
- [x] receiving-manager-transfer-approval.T07 — Add an integration test confirming a `Hold` request's `status`/`holdReason` are visible via transfer-request-submission's `GET .../me`/`GET .../:id` (no new production code — cross-spec verification only) — Acceptance: AC12
- [x] receiving-manager-transfer-approval.T08 — Confirm ≥80% line coverage for T01–T06, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC12 (coverage verification, not new behavior)
