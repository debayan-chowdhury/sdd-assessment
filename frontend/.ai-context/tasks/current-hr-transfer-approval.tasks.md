# Tasks: Current HR Transfer Approval

## Derived From
.ai-context/plans/current-hr-transfer-approval.plan.md (spec Status: Draft, plan not `Plan Reviewed` — Gate 1/plan-review skipped by explicit user direction, 2026-09-04. These tasks are speculative until the spec/plan are actually reviewed.)

## Sequence
- [x] current-hr-transfer-approval.T01 — Extend `src/types/transferRequest.ts` with `CurrentHrQueueItem` (`employeeTenureDays: number`, `meetsMinimumTenure: boolean`) — Acceptance: AC1
- [x] current-hr-transfer-approval.T02 — Extend `transfer-request.queries.ts` with `useCurrentHrQueue` (API01) — Acceptance: AC1, AC6
- [x] current-hr-transfer-approval.T03 — Extend `transfer-request.mutations.ts` with `useCurrentHrDecision` (API02), invalidating the queue on success, surfacing 409 `INELIGIBLE_TENURE` / `INVALID_STATUS_TRANSITION` — Acceptance: AC3, AC4, AC5, AC7
- [x] current-hr-transfer-approval.T04 — Build `src/screens/approvals/CurrentHrQueue.tsx` (list with tenure/eligibility indicator, Accept with a client-side ineligibility warning per AC2 before submit, Reject via the existing `RejectReasonDialog` in optional-reason mode, empty state, escalation indicator, loading/disabled state), composed into `ApprovalsInboxScreen`, with tests — Acceptance: AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9

## AC Coverage Check
AC1 (T01, T02, T04) · AC2 (T04) · AC3 (T03, T04) · AC4 (T03, T04) · AC5 (T03, T04) · AC6 (T02, T04) · AC7 (T03, T04) · AC8 (T04) · AC9 (T04) — all 9 covered.
