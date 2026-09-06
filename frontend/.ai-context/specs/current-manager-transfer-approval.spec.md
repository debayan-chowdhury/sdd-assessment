# Spec: Current Manager Transfer Approval

## Spec ID
current-manager-transfer-approval

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-003

## Intent
Let a logged-in user who is the Current Manager on one or more pending transfer requests see their queue and accept or reject each one (reject requires a reason), as the first approval gate.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/advances), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/current-manager-transfer-approval.spec.md`
  - `current-manager-transfer-approval.API01` — `GET /api/v1/transfer-requests/pending/current-manager`
  - `current-manager-transfer-approval.API02` — `POST /api/v1/transfer-requests/:id/current-manager-decision`

**Design note — role gate is per-request, not per-login-role.** "Current Manager" isn't a `roleCategory` value; any Employee whose id matches a given request's `currentManagerId` can act on it. The `/approvals` screen's Current Manager queue is simply whatever API01 returns for the logged-in user — there is no separate client-side role check beyond "is logged in," since the backend's own `403 FORBIDDEN`/scoped-query behavior is the actual authorization boundary.

## Acceptance Criteria
1. current-manager-transfer-approval.AC1 — Given a logged-in user, when they navigate to `/approvals` and API01 returns one or more requests, then a "Current Manager" queue section lists each with the requesting employee's name, target Department/Location/Role, and effective date.
2. current-manager-transfer-approval.AC2 — Given API01 returns an empty array, when the user views `/approvals`, then the Current Manager queue section is either hidden or shows an explicit empty state — never a blank gap.
3. current-manager-transfer-approval.AC3 — Given a queued request, when the user clicks Accept and API02 returns 200, then the request is removed from the queue and a success confirmation is shown.
4. current-manager-transfer-approval.AC4 — Given a queued request, when the user clicks Reject, then a reason field is required before the Reject action can be submitted — the UI never allows submitting `decision: "reject"` with an empty reason (BRD-003: "a reason is captured").
5. current-manager-transfer-approval.AC5 — Given the reject dialog with a non-empty reason, when submitted and API02 returns 200, then the request is removed from the queue and a success confirmation is shown.
6. current-manager-transfer-approval.AC6 — Given a queued request, when Accept or Reject is submitted and API02 returns 409 `INVALID_STATUS_TRANSITION` (already decided elsewhere, e.g. by another device/tab), then a message explains the request is no longer pending and it's removed from the local queue view.
7. current-manager-transfer-approval.AC7 — Given a queued request, when Accept or Reject is submitted and API02 returns 403 `FORBIDDEN`, then a generic error is shown and the queue is refetched (defensive — should not occur given AC1's scoping, but not assumed impossible).
8. current-manager-transfer-approval.AC8 — Given a request in the queue with `escalated: true`, when displayed, then an escalation indicator is shown alongside it — the item remains actionable (BRD-002/003: escalation doesn't block the Current Manager from still deciding it).
9. current-manager-transfer-approval.AC9 — Given the Accept/Reject action is in flight, when the user views the button, then it shows a loading/disabled state to prevent a double-submit.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| current-manager-transfer-approval.UT01 | AC1 | Mock API01 with 2 pending requests | Both rendered with employee/target/date details |
| current-manager-transfer-approval.UT02 | AC2 | Mock API01 with empty array | Empty state shown, no blank section |
| current-manager-transfer-approval.UT03 | AC3 | Click Accept, mock API02 200 | Item removed, success confirmation shown |
| current-manager-transfer-approval.UT04 | AC4 | Open reject dialog, attempt submit with empty reason | Submit blocked, inline validation error |
| current-manager-transfer-approval.UT05 | AC5 | Submit reject with a reason, mock API02 200 | Item removed, success confirmation shown |
| current-manager-transfer-approval.UT06 | AC6 | Accept, mock API02 409 `INVALID_STATUS_TRANSITION` | Explanatory message, item removed from view |
| current-manager-transfer-approval.UT07 | AC8 | Mock a queued item with `escalated: true` | Escalation indicator rendered, Accept/Reject still enabled |
| current-manager-transfer-approval.UT08 | AC9 | Click Accept, before API02 resolves | Button shows disabled/loading state |

## Explicitly Out of Scope
- Team-continuity/handover administration beyond the Accept/Reject gate itself (BRD-003, explicit).
- Any UI distinguishing the case where the employee's current manager is also changing as part of the transfer (BRD-003, explicit — not a case this journey handles).
- Any UI for resolving an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
