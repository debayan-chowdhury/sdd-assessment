# Spec: Current HR Transfer Approval

## Spec ID
current-hr-transfer-approval

## Status
Draft

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-004

## Intent
Let a logged-in user who is the Current HR on one or more pending transfer requests see their queue — including each employee's computed tenure and whether it meets the 6-month minimum — and accept or reject each request as the second approval gate.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/approvals/`).
- Related: .ai-context/specs/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec advances), .ai-context/specs/current-manager-transfer-approval.spec.md (the gate immediately before this one), .ai-context/specs/portal-login-password-change.spec.md (requires a valid session).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/current-hr-transfer-approval.spec.md`
  - `current-hr-transfer-approval.API01` — `GET /api/v1/transfer-requests/pending/current-hr`
  - `current-hr-transfer-approval.API02` — `POST /api/v1/transfer-requests/:id/current-hr-decision`

**Design note — tenure is backend-computed, not re-derived here.** `employeeTenureDays`/`meetsMinimumTenure` come pre-computed from API01 (per the backend spec's flagged tenure-approximation gap); this frontend spec only renders them, it does not recompute tenure client-side.

## Acceptance Criteria
1. current-hr-transfer-approval.AC1 — Given a logged-in user, when they navigate to `/approvals` and API01 returns one or more requests, then a "Current HR" queue section lists each with the employee's name, target Department/Location/Role, `employeeTenureDays`, and a visible eligibility indicator derived from `meetsMinimumTenure`.
2. current-hr-transfer-approval.AC2 — Given a queued request with `meetsMinimumTenure: false`, when the user views it, then an ineligibility indicator is shown and attempting Accept surfaces a client-side warning before submission (the backend still enforces this via 409 `INELIGIBLE_TENURE` regardless).
3. current-hr-transfer-approval.AC3 — Given a request with `meetsMinimumTenure: false`, when Accept is submitted anyway and API02 returns 409 `INELIGIBLE_TENURE`, then an inline error explains the tenure requirement isn't met and the item remains in the queue.
4. current-hr-transfer-approval.AC4 — Given a queued request with `meetsMinimumTenure: true`, when Accept is submitted and API02 returns 200, then the request is removed from the queue and a success confirmation is shown.
5. current-hr-transfer-approval.AC5 — Given a queued request, when Reject is submitted (with or without a reason — BRD-004 does not require one, unlike Current Manager) and API02 returns 200, then the request is removed from the queue and a success confirmation is shown.
6. current-hr-transfer-approval.AC6 — Given API01 returns an empty array, when the user views `/approvals`, then the Current HR queue section shows an explicit empty state.
7. current-hr-transfer-approval.AC7 — Given Accept or Reject is submitted and API02 returns 409 `INVALID_STATUS_TRANSITION`, then a message explains the request is no longer pending and it's removed from the local queue view.
8. current-hr-transfer-approval.AC8 — Given a request in the queue with `escalated: true`, when displayed, then an escalation indicator is shown alongside it — the item remains actionable.
9. current-hr-transfer-approval.AC9 — Given the Accept/Reject action is in flight, when the user views the button, then it shows a loading/disabled state to prevent a double-submit.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| current-hr-transfer-approval.UT01 | AC1 | Mock API01 with a request, `meetsMinimumTenure: true` | Tenure and eligible indicator rendered |
| current-hr-transfer-approval.UT02 | AC2 | Mock API01 with `meetsMinimumTenure: false`, click Accept | Client-side warning shown before submit |
| current-hr-transfer-approval.UT03 | AC3 | Force-submit Accept anyway, mock API02 409 `INELIGIBLE_TENURE` | Inline error, item remains in queue |
| current-hr-transfer-approval.UT04 | AC4 | Accept an eligible request, mock API02 200 | Item removed, success confirmation |
| current-hr-transfer-approval.UT05 | AC5 | Reject with no reason field filled | Submits successfully (no reason required) |
| current-hr-transfer-approval.UT06 | AC6 | Mock API01 empty array | Empty state shown |
| current-hr-transfer-approval.UT07 | AC7 | Accept, mock API02 409 `INVALID_STATUS_TRANSITION` | Explanatory message, item removed |
| current-hr-transfer-approval.UT08 | AC8 | Mock a queued item with `escalated: true` | Escalation indicator rendered |

## Explicitly Out of Scope
- Disciplinary/investigation status, performance ratings, PIP status, probation completion, or prior-transfer cool-off — none of these are shown; only the tenure figure the backend computes (BRD-004, explicit).
- Any client-side recomputation or correction of tenure — the flagged backend approximation is displayed as-is, not second-guessed.
- Any UI for resolving an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/mutation via TanStack Query only — Architectural Constraints.
- Employee names/PII never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
