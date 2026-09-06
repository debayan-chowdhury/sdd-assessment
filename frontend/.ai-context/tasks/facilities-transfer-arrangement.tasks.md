# Tasks: Facilities Transfer Arrangement

## Derived From
.ai-context/plans/facilities-transfer-arrangement.plan.md (spec Status: Draft, plan not `Plan Reviewed` — Gate 1/plan-review skipped by explicit user direction, 2026-09-04. These tasks are speculative until the spec/plan are actually reviewed.)

## Sequence
- [x] facilities-transfer-arrangement.T01 — Extend `transfer-request.queries.ts` with `useFacilitiesWorklist` (API01) — Acceptance: AC2, AC6
- [x] facilities-transfer-arrangement.T02 — Extend `transfer-request.mutations.ts` with `useFacilitiesStatusUpdate` (API02), invalidating the worklist on success, surfacing 409 `INVALID_STATUS_TRANSITION` — Acceptance: AC3, AC4, AC5, AC7
- [x] facilities-transfer-arrangement.T03 — Build `src/screens/approvals/FacilitiesWorklist.tsx` (thin wrapper instantiating the existing `FulfillmentWorklist` from payroll-transfer-update.tasks.md's T03 with Facilities' hooks, `roleCategory === "Facilities"` client-side gate), composed into `ApprovalsInboxScreen`, with tests — Acceptance: AC1, AC8, AC9

## AC Coverage Check
AC1 (T03) · AC2 (T01) · AC3 (T02) · AC4 (T02) · AC5 (T02) · AC6 (T01) · AC7 (T02) · AC8 (T03, inherited from `FulfillmentWorklist`, verified via this wrapper's own test) · AC9 (T03) — all 9 covered.
