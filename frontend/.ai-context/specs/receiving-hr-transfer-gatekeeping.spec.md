# Spec: Receiving HR Transfer Gatekeeping

## Spec ID
receiving-hr-transfer-gatekeeping

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-005

## Intent
Let a logged-in user who is the Receiving HR on one or more transfer requests act at every point the BRD assigns to that role, across two distinct queues: the approval gate (accept-with-manager-assignment or reject), and the fulfillment queue (trigger Payroll/IT/Facilities, confirm completion) — plus two standalone actions reachable from a request's detail view: reassigning a new candidate manager after a Receiving Manager rejects, and reopening a `Hold` request.

**Amendment (Need Information removed):** the fulfillment queue's "respond to Need Information" action (backend API06) is removed — see payroll-transfer-update.spec.md, it-transfer-provisioning.spec.md, facilities-transfer-arrangement.spec.md. Payroll/IT/Facilities now only ever report `"Done"`, so there is nothing for Receiving HR to reply to.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec advances at multiple points), .ai-context/specs/receiving-manager-transfer-approval.spec.md (the gate this spec routes into and receives rejections/silence from), .ai-context/specs/payroll-transfer-update.spec.md, .ai-context/specs/it-transfer-provisioning.spec.md, .ai-context/specs/facilities-transfer-arrangement.spec.md (the three fulfillment specs this spec triggers and reads status from), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md`
  - `.API01` — `GET /api/v1/transfer-requests/pending/receiving-hr-gate`
  - `.API02` — `POST /api/v1/transfer-requests/:id/receiving-hr-gate-decision`
  - `.API03` — `POST /api/v1/transfer-requests/:id/reassign-manager`
  - `.API04` — `POST /api/v1/transfer-requests/:id/trigger-fulfillment`
  - `.API05` — `GET /api/v1/transfer-requests/pending/receiving-hr-fulfillment`
  - `.API06` — retired (was `respond-need-information`, removed)
  - `.API07` — `POST /api/v1/transfer-requests/:id/confirm-completion`
  - `.API08` — `POST /api/v1/transfer-requests/:id/reopen-hold`

**Design note — no manager picker data source specified.** Accepting a gate item (API02) or reassigning (API03) requires an `assignedManagerId`. Neither this journey's BRD nor the backend spec defines an endpoint for "list candidate Manager-category Employees at Department+Location X" — the backend spec's `INVALID_MANAGER_ROLE` check is server-side validation on submission, not a way to populate a picker. This is a flagged gap: the manager-selection UI needs a data source (likely an Admin Panel employee-lookup endpoint) that isn't part of this journey's contract. Deferred to plan.md.

## Acceptance Criteria

### Approval gate (API01/API02)
1. receiving-hr-transfer-gatekeeping.AC1 — Given a logged-in user, when they navigate to `/approvals` and API01 returns one or more requests, then a "Receiving HR — Approval Gate" queue section lists each with the employee's name, target Department/Location/Role.
2. receiving-hr-transfer-gatekeeping.AC2 — Given a gate-queue request, when the user chooses Accept, then a manager-selection control is required before the Accept action can be submitted — the UI never allows submitting `decision: "accept"` without `assignedManagerId` (see the flagged gap above for the picker's data source).
3. receiving-hr-transfer-gatekeeping.AC3 — Given Accept with a selected manager, when API02 returns 200, then the request moves out of this queue and a success confirmation is shown, noting the employee's organisational record has been updated (per the backend's literal early-update behavior — see the backend spec's flagged reading).
4. receiving-hr-transfer-gatekeeping.AC4 — Given Accept is submitted and API02 returns 400 `INVALID_MANAGER_ROLE`, then an inline error on the manager-selection control explains the chosen person isn't a valid Manager for that Department+Location.
5. receiving-hr-transfer-gatekeeping.AC5 — Given a gate-queue request, when the user chooses Reject (with or without a reason), then API02 is called with `decision: "reject"`; on 200 the request is removed from the queue with a success confirmation.

### Fulfillment queue (API04–API07)
6. receiving-hr-transfer-gatekeeping.AC6 — Given a logged-in user, when they navigate to `/approvals` and API05 returns one or more requests, then a "Receiving HR — Fulfillment" queue section lists each with its `payrollStatus`/`itStatus`/`facilitiesStatus` (including `"Not Applicable"` items shown as such, not hidden).
7. receiving-hr-transfer-gatekeeping.AC7 — Given a request whose `status: "Pending Fulfillment Trigger"`, when the user clicks "Trigger Fulfillment" and API04 returns 200, then the three sub-statuses update in place to reflect the new `"Pending"`/`"Not Applicable"` values and a confirmation is shown.
**AC8/AC9 retired** along with API06 (see the amendment above) — they tested the removed "respond to Need Information" reply control.

10. receiving-hr-transfer-gatekeeping.AC10 — Given a request where every applicable sub-status is `"Done"`, when the user clicks "Confirm Completion" and API07 returns 200, then the request moves out of the fulfillment queue with a success confirmation, and no email/notification claim is made in the UI (BRD-005 touchpoint 3's confirmation email is explicitly out of scope on the backend — see Explicitly Out of Scope).
11. receiving-hr-transfer-gatekeeping.AC11 — Given a request where at least one applicable sub-status is not yet `"Done"`, when the user attempts to click "Confirm Completion", then the control is disabled client-side (mirrors the backend's 409 `FULFILLMENT_INCOMPLETE`) rather than only surfacing the error after a failed submit.

### Reassignment and hold-reopen (API03/API08)
12. receiving-hr-transfer-gatekeeping.AC12 — Given a request with `status: "Pending Receiving HR Reassignment"`, when shown on the requesting user's Receiving HR view, then a "Reassign Manager" action is available requiring a new `assignedManagerId` before submission — same picker-requirement discipline as AC2.
13. receiving-hr-transfer-gatekeeping.AC13 — Given a request with `status: "Hold"` and `holdStartedAt` within 6 months, when shown on the Receiving HR view, then a "Reopen" action is available requiring a new `assignedManagerId`; on API08 200, the request moves to the active queue with a success confirmation.
14. receiving-hr-transfer-gatekeeping.AC14 — Given "Reopen" is submitted and API08 returns 409 `HOLD_WINDOW_EXPIRED`, then a message explains the 6-month window has passed and no further reopen action is offered for that request.

### Cross-cutting
15. receiving-hr-transfer-gatekeeping.AC15 — Given any action in this spec returns 403 `FORBIDDEN` (caller isn't the request's `receivingHrId`), then a generic error is shown and the relevant queue is refetched.
16. receiving-hr-transfer-gatekeeping.AC16 — Given any action in this spec returns 409 `INVALID_STATUS_TRANSITION`, then a message explains the request has moved on already and the local view is refreshed from the server.
17. receiving-hr-transfer-gatekeeping.AC17 — Given a request in either queue with `escalated: true`, when displayed, then an escalation indicator is shown alongside it.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| receiving-hr-transfer-gatekeeping.UT01 | AC1 | Mock API01 with 1 gate item | Rendered with employee/target details |
| receiving-hr-transfer-gatekeeping.UT02 | AC2 | Click Accept with no manager selected | Submit blocked, inline validation error |
| receiving-hr-transfer-gatekeeping.UT03 | AC3 | Accept with manager selected, mock API02 200 | Item removed, success confirmation |
| receiving-hr-transfer-gatekeeping.UT04 | AC4 | Mock API02 400 `INVALID_MANAGER_ROLE` | Inline error on manager control |
| receiving-hr-transfer-gatekeeping.UT05 | AC5 | Reject with no reason | Submits, item removed on 200 |
| receiving-hr-transfer-gatekeeping.UT06 | AC6 | Mock API05 with mixed sub-statuses incl. Not Applicable | All shown, none hidden |
| receiving-hr-transfer-gatekeeping.UT07 | AC7 | Trigger fulfillment, mock API04 200 | Sub-statuses update in place |
| receiving-hr-transfer-gatekeeping.UT10 | AC10 | All sub-statuses Done, click Confirm Completion, mock API07 200 | Item removed, success confirmation |
| receiving-hr-transfer-gatekeeping.UT11 | AC11 | One sub-status still Pending | Confirm Completion button disabled |
| receiving-hr-transfer-gatekeeping.UT12 | AC13 | Reopen a Hold request within window, mock API08 200 | Request moves to active queue |
| receiving-hr-transfer-gatekeeping.UT13 | AC14 | Mock API08 409 `HOLD_WINDOW_EXPIRED` | Explanatory message, reopen hidden |
| receiving-hr-transfer-gatekeeping.UT14 | AC17 | Mock a queue item with `escalated: true` | Escalation indicator rendered |

## Explicitly Out of Scope
- Any claim or UI element implying a confirmation email is sent to the employee (BRD-005 touchpoint 3) — no notification system exists; "Confirm Completion" only changes status (backend spec, explicit).
- Any UI for resolving an escalated item — flag-only, consistent with every other spec in this journey.
- A manager-selection picker's actual data source — flagged gap above, deferred to plan.md; this spec only states the control must require a selection before submission.
- Enforcing (client-side or otherwise) that a reassigned/reopened manager wasn't already tried and rejected on this same request — the backend doesn't enforce this either (flagged gap in its own spec); not implemented here.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
