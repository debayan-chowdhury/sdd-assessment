# Spec: Facilities Transfer Arrangement

## Spec ID
facilities-transfer-arrangement

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-009

## Intent
Let a logged-in user holding a Facilities-category role see the worklist of transfer requests waiting on a new physical workspace arrangement and report back `Done` — worklist items only ever appear when the transfer changes Location.

**Amendment (Need Information removed):** same removal as payroll-transfer-update.spec.md and it-transfer-provisioning.spec.md — the report/reply "Need Information" mechanism is gone. Facilities now only ever reports `"Done"`.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/updates), .ai-context/specs/receiving-hr-transfer-gatekeeping.spec.md (sets `facilitiesStatus` to `"Pending"`/`"Not Applicable"` at trigger time based on whether Location changed), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session — `roleCategory: "Facilities"`), .ai-context/specs/payroll-transfer-update.spec.md and .ai-context/specs/it-transfer-provisioning.spec.md (identical mechanics — read together; the three worklists can share one screen component, a plan.md decision).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/facilities-transfer-arrangement.spec.md`
  - `facilities-transfer-arrangement.API01` — `GET /api/v1/transfer-requests/pending/facilities`
  - `facilities-transfer-arrangement.API02` — `POST /api/v1/transfer-requests/:id/facilities-status`

**Design note — role gate.** Same as the other two fulfillment specs: the `/approvals` screen renders this section only for `roleCategory: "Facilities"`, in addition to the backend's own `403 FORBIDDEN` enforcement.

## Acceptance Criteria
1. facilities-transfer-arrangement.AC1 — Given a logged-in user with `roleCategory: "Facilities"`, when they navigate to `/approvals`, then a "Facilities" worklist section is shown; for any other `roleCategory`, the section is not rendered at all.
2. facilities-transfer-arrangement.AC2 — Given the Facilities worklist, when API01 returns one or more requests, then each is listed with the employee's name and target Department/Location/Role, and its current `facilitiesStatus` (`"Pending"`) — a request whose Location didn't change never appears here (it's `"Not Applicable"` from the start and API01 excludes it).
3. facilities-transfer-arrangement.AC3 — Given a worklist item, when the user clicks "Mark Done" and API02 returns 200, then the item is removed from the worklist with a success confirmation.
4. facilities-transfer-arrangement.AC4 — Given API01 returns an empty array, when the user views the Facilities worklist, then an explicit empty state is shown.
5. facilities-transfer-arrangement.AC5 — Given an action is submitted and API02 returns 409 `INVALID_STATUS_TRANSITION`, then a message explains the item is no longer actionable and it's removed from the local worklist view.
6. facilities-transfer-arrangement.AC6 — Given a worklist item with `escalated: true`, when displayed, then an escalation indicator is shown alongside it.
7. facilities-transfer-arrangement.AC7 — Given "Mark Done" is in flight, when the user views the control, then it shows a loading/disabled state to prevent a double-submit.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| facilities-transfer-arrangement.UT01 | AC1 | Render `/approvals` as `roleCategory: "Payroll"` | Facilities section not rendered |
| facilities-transfer-arrangement.UT02 | AC2 | Mock API01 with 1 item, `facilitiesStatus: "Pending"` | Rendered with employee/target/status |
| facilities-transfer-arrangement.UT03 | AC3 | Click Mark Done, mock API02 200 | Item removed, success confirmation |
| facilities-transfer-arrangement.UT04 | AC4 | Mock API01 empty array | Empty state shown |
| facilities-transfer-arrangement.UT05 | AC5 | Mock API02 409 `INVALID_STATUS_TRANSITION` | Explanatory message, item removed |
| facilities-transfer-arrangement.UT06 | AC6 | Mock a worklist item with `escalated: true` | Escalation indicator rendered |

## Explicitly Out of Scope
- Any UI implying integration with Facilities' actual workspace-management system (BRD-009, explicit) — this is a status-reporting worklist only.
- Any accept/reject action.
- Any UI for resolving an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
