# Tasks: Receiving Manager Transfer Approval

## Derived From
.ai-context/plans/receiving-manager-transfer-approval.plan.md (spec Status: Draft, plan not `Plan Reviewed` — Gate 1/plan-review skipped by explicit user direction, 2026-09-04. These tasks are speculative until the spec/plan are actually reviewed.)

## Sequence
- [x] receiving-manager-transfer-approval.T01 — Create `src/components/ui/ReasonCodeDialog.tsx` (required reason-code selector — `NO_HEADCOUNT` / `ROLE_SKILL_MISMATCH` / `TIMING_CONFLICT` / `OTHER`, plain-language labels, optional free-text detail) — Acceptance: AC3, AC4
- [x] receiving-manager-transfer-approval.T02 — Extend `transfer-request.queries.ts` with `useReceivingManagerQueue` (API01) — Acceptance: AC1
- [x] receiving-manager-transfer-approval.T03 — Extend `transfer-request.mutations.ts` with `useReceivingManagerDecision` (API02), invalidating the queue on success, surfacing 409 `INVALID_STATUS_TRANSITION` — Acceptance: AC2, AC5, AC6, AC7, AC8
- [x] receiving-manager-transfer-approval.T04 — Build `src/screens/approvals/ReceivingManagerQueue.tsx` (list, Accept, Reject via `ReasonCodeDialog`, branches the success message on the returned `status` — `Pending Receiving HR Reassignment` vs. `Hold` — per AC7, empty/escalation/loading states), composed into `ApprovalsInboxScreen`, with tests — Acceptance: AC1, AC2, AC5, AC6, AC7, AC8, AC9, AC10

## AC Coverage Check
AC1 (T02, T04) · AC2 (T03, T04) · AC3 (T01) · AC4 (T01) · AC5 (T03, T04) · AC6 (T03, T04) · AC7 (T03, T04) · AC8 (T03, T04) · AC9 (T04) · AC10 (T04) — all 10 covered.
