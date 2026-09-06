# Spec: IT Transfer Provisioning

## Spec ID
it-transfer-provisioning

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-008

## Intent
Let a logged-in user holding an IT-category role see the worklist of transfer requests waiting on IT provisioning/deprovisioning and report back `Done`.

**Amendment (Need Information removed):** same removal as payroll-transfer-update.spec.md — the report/reply "Need Information" mechanism is gone. IT now only ever reports `"Done"`.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/updates), .ai-context/specs/receiving-hr-transfer-gatekeeping.spec.md (triggers this worklist's items), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session — `roleCategory: "IT"`), .ai-context/specs/payroll-transfer-update.spec.md (identical mechanics — read together; the two worklists can share one screen component, a plan.md decision).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/it-transfer-provisioning.spec.md`
  - `it-transfer-provisioning.API01` — `GET /api/v1/transfer-requests/pending/it`
  - `it-transfer-provisioning.API02` — `POST /api/v1/transfer-requests/:id/it-status`

**Design note — role gate.** Same as payroll-transfer-update.spec.md: the `/approvals` screen renders this section only for `roleCategory: "IT"`, in addition to the backend's own `403 FORBIDDEN` enforcement.

## Acceptance Criteria
1. it-transfer-provisioning.AC1 — Given a logged-in user with `roleCategory: "IT"`, when they navigate to `/approvals`, then an "IT" worklist section is shown; for any other `roleCategory`, the section is not rendered at all.
2. it-transfer-provisioning.AC2 — Given the IT worklist, when API01 returns one or more requests, then each is listed with the employee's name and target Department/Location/Role, and its current `itStatus` (`"Pending"`).
3. it-transfer-provisioning.AC3 — Given a worklist item, when the user clicks "Mark Done" and API02 returns 200, then the item is removed from the worklist with a success confirmation.
4. it-transfer-provisioning.AC4 — Given API01 returns an empty array, when the user views the IT worklist, then an explicit empty state is shown.
5. it-transfer-provisioning.AC5 — Given an action is submitted and API02 returns 409 `INVALID_STATUS_TRANSITION`, then a message explains the item is no longer actionable and it's removed from the local worklist view.
6. it-transfer-provisioning.AC6 — Given a worklist item with `escalated: true`, when displayed, then an escalation indicator is shown alongside it.
7. it-transfer-provisioning.AC7 — Given "Mark Done" is in flight, when the user views the control, then it shows a loading/disabled state to prevent a double-submit.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| it-transfer-provisioning.UT01 | AC1 | Render `/approvals` as `roleCategory: "Facilities"` | IT section not rendered |
| it-transfer-provisioning.UT02 | AC2 | Mock API01 with 1 item, `itStatus: "Pending"` | Rendered with employee/target/status |
| it-transfer-provisioning.UT03 | AC3 | Click Mark Done, mock API02 200 | Item removed, success confirmation |
| it-transfer-provisioning.UT04 | AC4 | Mock API01 empty array | Empty state shown |
| it-transfer-provisioning.UT05 | AC5 | Mock API02 409 `INVALID_STATUS_TRANSITION` | Explanatory message, item removed |
| it-transfer-provisioning.UT06 | AC6 | Mock a worklist item with `escalated: true` | Escalation indicator rendered |

## Explicitly Out of Scope
- Any UI implying integration with IT's actual provisioning system (BRD-008, explicit) — this is a status-reporting worklist only.
- Any accept/reject action.
- Any UI defining what triggers IT applicability — the backend itself flags this as an undefined gap; not resolved here.
- Any UI for resolving an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
