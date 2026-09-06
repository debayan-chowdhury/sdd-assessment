# Spec: Payroll Transfer Update

## Spec ID
payroll-transfer-update

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-007

## Intent
Let a logged-in user holding a Payroll-category role see the worklist of transfer requests waiting on Payroll and report back `Done`.

**Amendment (Need Information removed):** This spec originally let Payroll report an intermediate `"Need Information"` sub-status with a required message, which Receiving HR could reply to. Per product decision, that whole report/reply mechanism is removed — Payroll now only ever reports `"Done"`.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/updates), .ai-context/specs/receiving-hr-transfer-gatekeeping.spec.md (triggers this worklist's items), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session — `roleCategory: "Payroll"`), .ai-context/specs/it-transfer-provisioning.spec.md and .ai-context/specs/facilities-transfer-arrangement.spec.md (identical mechanics — read together; the three worklists can share one screen component, a plan.md decision).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/payroll-transfer-update.spec.md`
  - `payroll-transfer-update.API01` — `GET /api/v1/transfer-requests/pending/payroll`
  - `payroll-transfer-update.API02` — `POST /api/v1/transfer-requests/:id/payroll-status`

**Design note — role gate.** Unlike the approval-gate specs (per-request assignment), this worklist's access is governed by the logged-in user's own `roleCategory: "Payroll"` from their session profile — the `/approvals` screen should only render this section for users with that `roleCategory`, in addition to the backend's own `403 FORBIDDEN` enforcement.

## Acceptance Criteria
1. payroll-transfer-update.AC1 — Given a logged-in user with `roleCategory: "Payroll"`, when they navigate to `/approvals`, then a "Payroll" worklist section is shown; for any other `roleCategory`, the section is not rendered at all (client-side role gate, in addition to the backend's own check).
2. payroll-transfer-update.AC2 — Given the Payroll worklist, when API01 returns one or more requests, then each is listed with the employee's name and target Department/Location/Role, and its current `payrollStatus` (`"Pending"`).
3. payroll-transfer-update.AC3 — Given a worklist item, when the user clicks "Mark Done" and API02 returns 200, then the item is removed from the worklist with a success confirmation.
4. payroll-transfer-update.AC4 — Given API01 returns an empty array, when the user views the Payroll worklist, then an explicit empty state is shown.
5. payroll-transfer-update.AC5 — Given an action is submitted and API02 returns 409 `INVALID_STATUS_TRANSITION` (e.g. the item became `"Not Applicable"`/`"Done"` via another session), then a message explains the item is no longer actionable and it's removed from the local worklist view.
6. payroll-transfer-update.AC6 — Given a worklist item with `escalated: true`, when displayed, then an escalation indicator is shown alongside it.
7. payroll-transfer-update.AC7 — Given "Mark Done" is in flight, when the user views the control, then it shows a loading/disabled state to prevent a double-submit.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| payroll-transfer-update.UT01 | AC1 | Render `/approvals` as `roleCategory: "HR"` | Payroll section not rendered |
| payroll-transfer-update.UT02 | AC2 | Mock API01 with 1 item, `payrollStatus: "Pending"` | Rendered with employee/target/status |
| payroll-transfer-update.UT03 | AC3 | Click Mark Done, mock API02 200 | Item removed, success confirmation |
| payroll-transfer-update.UT04 | AC4 | Mock API01 empty array | Empty state shown |
| payroll-transfer-update.UT05 | AC5 | Mock API02 409 `INVALID_STATUS_TRANSITION` | Explanatory message, item removed |
| payroll-transfer-update.UT06 | AC6 | Mock a worklist item with `escalated: true` | Escalation indicator rendered |

## Explicitly Out of Scope
- Any UI implying integration with Payroll's actual external portal/system (BRD-007, explicit) — this is a status-reporting worklist only.
- Any accept/reject action.
- Any UI attempting to determine whether pay is actually affected — left entirely to the reporting user's judgment (backend spec, explicit).
- Any UI for resolving an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
