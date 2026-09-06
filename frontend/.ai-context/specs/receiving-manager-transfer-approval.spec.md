# Spec: Receiving Manager Transfer Approval

## Spec ID
receiving-manager-transfer-approval

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-006

## Intent
Let a logged-in user who is the assigned Receiving Manager on one or more transfer requests see their queue and accept or reject each one as the fourth and final approval gate — reject requires a structured reason code, with an optional free-text detail.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec advances), .ai-context/specs/receiving-hr-transfer-gatekeeping.spec.md (assigns this gate's manager and handles reassignment/hold-reopen after this spec's reject), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/receiving-manager-transfer-approval.spec.md`
  - `receiving-manager-transfer-approval.API01` — `GET /api/v1/transfer-requests/pending/receiving-manager`
  - `receiving-manager-transfer-approval.API02` — `POST /api/v1/transfer-requests/:id/receiving-manager-decision`

## Acceptance Criteria
1. receiving-manager-transfer-approval.AC1 — Given a logged-in user, when they navigate to `/approvals` and API01 returns one or more requests, then a "Receiving Manager" queue section lists each with the employee's name and target Department/Location/Role.
2. receiving-manager-transfer-approval.AC2 — Given a queued request, when the user clicks Accept and API02 returns 200, then the request is removed from the queue with a success confirmation.
3. receiving-manager-transfer-approval.AC3 — Given a queued request, when the user chooses Reject, then a reason-code selector (`NO_HEADCOUNT` / `ROLE_SKILL_MISMATCH` / `TIMING_CONFLICT` / `OTHER`, labeled in plain language: "No open headcount," "Role/skill mismatch," "Timing conflict," "Other") is required before submission, with an optional free-text detail field — matching the valid grounds named in BRD-006.
4. receiving-manager-transfer-approval.AC4 — Given the reject control with no reason code selected, when the user attempts to submit, then an inline validation error blocks submission client-side.
5. receiving-manager-transfer-approval.AC5 — Given Reject is submitted with a reason code and API02 returns 200 with `status: "Pending Receiving HR Reassignment"`, then a message explains the request has been sent back to Receiving HR to pick another candidate manager, and the item is removed from this queue.
6. receiving-manager-transfer-approval.AC6 — Given Reject is submitted and API02 returns 200 with `status: "Hold"`, then a message explains no other candidate manager remains and the request is now on hold, and the item is removed from this queue.
7. receiving-manager-transfer-approval.AC7 — Given the two reject outcomes (AC5/AC6) return the same 200 shape distinguished only by the resulting `status`, then the UI branches its confirmation message on that returned `status` rather than assuming one outcome.
8. receiving-manager-transfer-approval.AC8 — Given Accept or Reject is submitted and API02 returns 409 `INVALID_STATUS_TRANSITION`, then a message explains the request is no longer pending and it's removed from the local queue view.
9. receiving-manager-transfer-approval.AC9 — Given a request in the queue with `escalated: true`, when displayed, then an escalation indicator is shown alongside it — the item remains actionable (this is the silence path, separate from an explicit reject).
10. receiving-manager-transfer-approval.AC10 — Given the Accept/Reject action is in flight, when the user views the button, then it shows a loading/disabled state to prevent a double-submit.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| receiving-manager-transfer-approval.UT01 | AC1 | Mock API01 with 1 pending request | Rendered with employee/target details |
| receiving-manager-transfer-approval.UT02 | AC2 | Accept, mock API02 200 | Item removed, success confirmation |
| receiving-manager-transfer-approval.UT03 | AC4 | Submit reject with no reason code | Blocked client-side |
| receiving-manager-transfer-approval.UT04 | AC5 | Reject, mock API02 200 `status: "Pending Receiving HR Reassignment"` | Reassignment-explanation message shown |
| receiving-manager-transfer-approval.UT05 | AC6 | Reject, mock API02 200 `status: "Hold"` | Hold-explanation message shown |
| receiving-manager-transfer-approval.UT06 | AC8 | Accept, mock API02 409 `INVALID_STATUS_TRANSITION` | Explanatory message, item removed |
| receiving-manager-transfer-approval.UT07 | AC9 | Mock a queued item with `escalated: true` | Escalation indicator, still actionable |
| receiving-manager-transfer-approval.UT08 | AC10 | Click Accept before API02 resolves | Button shows disabled/loading state |

## Explicitly Out of Scope
- Any UI/notification informing candidate managers their turn has come — out of this journey's scope; they see it via their own pending-queue GET when it's their turn (BRD-006, backend spec explicit).
- Resolution mechanics for an escalated item — flag-only, consistent with every other spec in this journey.
- Enforcing exclusion of previously-rejecting managers on reassignment/reopen — not enforced by the backend either; see receiving-hr-transfer-gatekeeping.spec.md.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
