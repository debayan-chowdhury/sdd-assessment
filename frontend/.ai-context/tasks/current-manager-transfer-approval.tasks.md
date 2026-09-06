# Tasks: Current Manager Transfer Approval

## Derived From
.ai-context/plans/current-manager-transfer-approval.plan.md (spec Status: Draft, plan not `Plan Reviewed` — Gate 1/plan-review skipped by explicit user direction, 2026-09-04. These tasks are speculative until the spec/plan are actually reviewed.)

## Sequence
- [x] current-manager-transfer-approval.T01 — Create `src/components/ui/RejectReasonDialog.tsx` (a reason-entry confirmation dialog, parameterized by whether the reason is mandatory or optional — this spec uses mandatory mode) — Acceptance: AC4
- [x] current-manager-transfer-approval.T02 — Extend `transfer-request.queries.ts` with `useCurrentManagerQueue` (API01) — Acceptance: AC1, AC2
- [x] current-manager-transfer-approval.T03 — Extend `transfer-request.mutations.ts` with `useCurrentManagerDecision` (API02), invalidating the queue query on success, surfacing 409 `INVALID_STATUS_TRANSITION` / 403 `FORBIDDEN` — Acceptance: AC3, AC5, AC6, AC7
- [x] current-manager-transfer-approval.T04 — Build `src/screens/approvals/ApprovalsInboxScreen.tsx` shell (composition container — first spec in this journey to need it) and `src/app/approvals/page.tsx` — Acceptance: AC1
- [x] current-manager-transfer-approval.T05 — Build `src/screens/approvals/CurrentManagerQueue.tsx` (list with employee/target/date details, Accept, Reject via `RejectReasonDialog` in mandatory mode, empty state, escalation indicator, loading/disabled state on submit), composed into `ApprovalsInboxScreen`, with tests — Acceptance: AC1, AC2, AC3, AC5, AC6, AC7, AC8, AC9

## AC Coverage Check
AC1 (T02, T04, T05) · AC2 (T02, T05) · AC3 (T03, T05) · AC4 (T01) · AC5 (T03, T05) · AC6 (T03, T05) · AC7 (T03, T05) · AC8 (T05) · AC9 (T05) — all 9 covered.

## Open Item Carried Forward
**Employee-name resolution gap (2026-09-05, applies journey-wide, not just this spec).** API01 returns raw `employeeId`/`newLocationId`/`newDepartmentId`/`newRoleId` only, and AC1 requires showing the employee's name — but no Employee-token-accessible endpoint resolved an id to a name (the Admin Panel's `GET /employees/:id` is admin-only). Resolved the same way as transfer-request-submission.T05's option-list gap: added a bounded, id-list `GET /api/v1/options/employees?ids=...` endpoint (`backend/src/controllers/options.controller.js#listEmployeesByIds`, name+id only, not a full roster) plus `useEmployeeNames`. A shared `src/screens/approvals/useTransferRequestDisplay.ts` hook (used by every queue screen across this journey) resolves employee/location/department/role ids to names, also using an unfiltered `GET /options/departments` (locationId now optional) for department-name resolution.
