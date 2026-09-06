# Tasks: Payroll Transfer Update

## Derived From
.ai-context/plans/payroll-transfer-update.plan.md (spec Status: Draft, plan not `Plan Reviewed` — Gate 1/plan-review skipped by explicit user direction, 2026-09-04. These tasks are speculative until the spec/plan are actually reviewed.)

## Sequence
- [x] payroll-transfer-update.T01 — Extend `transfer-request.queries.ts` with `usePayrollWorklist` (API01) — Acceptance: AC2, AC6
- [x] payroll-transfer-update.T02 — Extend `transfer-request.mutations.ts` with `usePayrollStatusUpdate` (API02), invalidating the worklist on success, surfacing 409 `INVALID_STATUS_TRANSITION` — Acceptance: AC3, AC4, AC5, AC7
- [x] payroll-transfer-update.T03 — Build the generic `src/screens/approvals/components/FulfillmentWorklist.tsx` (props: `target`, a queue query hook, a status-update mutation hook; renders the list, Mark Done, Need Information with required-message validation, empty state, escalation indicator, loading/disabled state) — first of three fulfillment specs, built here for reuse by it-transfer-provisioning and facilities-transfer-arrangement — with tests — Acceptance: AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9
- [x] payroll-transfer-update.T04 — Build `src/screens/approvals/PayrollWorklist.tsx` (thin wrapper instantiating `FulfillmentWorklist` with Payroll's hooks, `roleCategory === "Payroll"` client-side gate), composed into `ApprovalsInboxScreen`, with a test confirming the section is hidden for other roles — Acceptance: AC1

## AC Coverage Check
AC1 (T04) · AC2 (T01, T03) · AC3 (T02, T03) · AC4 (T02, T03) · AC5 (T02, T03) · AC6 (T01, T03) · AC7 (T02, T03) · AC8 (T03) · AC9 (T03) — all 9 covered.
