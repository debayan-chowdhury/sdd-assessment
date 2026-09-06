# Spec: Transfer Request Submission

## Spec ID
transfer-request-submission

## Status
In Development (implementation complete, 2026-09-04 — see `.ai-context/tasks/transfer-request-submission.tasks.md`; T05 now checked, form's Location/Department/Role dropdowns are wired to new Employee-token-accessible `GET /api/v1/options/{locations,departments,roles}` backend endpoints, added to resolve the plan's Open Question). Note: this skipped Gate 1 peer review, plan review, and task review by explicit user direction — the status reflects actual code state, not that those gates were run.

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-002

## Intent
Let a logged-in Employee submit one Internal Transfer request (new Location/Department/Role, effective date, optional reason) through a form, and track its status — including per-target Payroll/IT/Facilities progress once it reaches fulfillment — on a status view, without any edit/withdraw/cancel action once submitted.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `screens/transfer-request/`, Data Model — `TransferRequest`).
- Related: .ai-context/specs/portal-login-password-change.spec.md (requires a valid session), .ai-context/specs/current-manager-transfer-approval.spec.md through .ai-context/specs/facilities-transfer-arrangement.spec.md (this screen's status view reflects every stage those specs advance).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/transfer-request-submission.spec.md`
  - `transfer-request-submission.API01` — `POST /api/v1/transfer-requests`
  - `transfer-request-submission.API02` — `GET /api/v1/transfer-requests/me`
  - `transfer-request-submission.API03` — `GET /api/v1/transfer-requests/:id`
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/transfer-options.spec.md` — added later (2026-09-04) to populate the "new request" form's selectors; see AC15 below.
  - `transfer-options.API01` — `GET /api/v1/options/locations`
  - `transfer-options.API02` — `GET /api/v1/options/departments?locationId=:locationId`
  - `transfer-options.API03` — `GET /api/v1/options/roles`

**Design note — status vocabulary rendered here:** the full `TransferRequest.status` state machine (`Pending Current Manager Approval` → … → `Completed`, plus `Rejected`/`Hold`/`Pending Receiving HR Reassignment` branches) is owned by the backend spec above; this frontend spec renders whatever status string it receives rather than redefining the state machine. A human-readable label map (e.g. `Pending Current Manager Approval` → "Waiting on your manager") is a plan.md-level presentation detail, not decided here.

## Acceptance Criteria
1. transfer-request-submission.AC1 — Given a logged-in user, when they navigate to `/transfer-request`, then the screen is reachable regardless of `roleCategory` — every role is also an Employee capable of submitting their own transfer (BRD-002 doesn't restrict submission to a "plain Employee" subset).
2. transfer-request-submission.AC2 — Given the "new request" form, when the user submits with a target Location, Department, Role, and an `effectiveDate` ≥30 days out, and API01 returns 201, then the user is redirected to the new request's status view.
3. transfer-request-submission.AC3 — Given the "new request" form, when `effectiveDate` is fewer than 30 days from today, then an inline validation error is shown before submission (client-side mirror of the backend's 30-day rule) — the date picker also disables dates within that window.
4. transfer-request-submission.AC4 — Given the "new request" form, when required fields (Location/Department/Role/effective date) are empty and the user submits, then inline validation errors are shown per field and no request is sent.
5. transfer-request-submission.AC5 — Given the user already has a non-terminal request, when they navigate to `/transfer-request`, then the "new request" form is not shown — instead their active request's status view is shown directly (mirrors API01's 409 `ACTIVE_REQUEST_EXISTS`, checked proactively via API02 rather than waiting for a submit-time error).
6. transfer-request-submission.AC6 — Given the form is submitted anyway and API01 returns 409 `ACTIVE_REQUEST_EXISTS` (race condition), then a message explains an active request already exists and links to its status view.
7. transfer-request-submission.AC7 — Given API01 returns 404 `NOT_FOUND` (stale Location/Department/Role option), then a message asks the user to re-select and the option lists are refetched.
**AC8 retired** — the backend's `ROLE_NOT_ENABLED_FOR_DEPARTMENT` no longer occurs on this endpoint; submission now auto-enables an unmapped Role for the chosen Department instead of rejecting (see the backend spec's amendment). No client-side handling needed for it.
9. transfer-request-submission.AC9 — Given API01 returns 404 `NO_RECEIVING_HR`, then a message explains no HR contact exists yet for that Department+Location and submission cannot proceed there.
10. transfer-request-submission.AC10 — Given the status view for the user's own active or past request(s), when API02 is called, then all requests are listed newest first, each showing its `status`, and — once past `Pending Fulfillment Trigger` — the individual `payrollStatus`/`itStatus`/`facilitiesStatus` values (incremental visibility, not one final confirmation only — BRD-002).
11. transfer-request-submission.AC11 — Given a request's `status: "Rejected"`, when shown on the status view, then `rejectionReason` (if present) is displayed and no further action is offered — the user is directed to submit a brand-new request instead (BRD-002).
12. transfer-request-submission.AC12 — Given a request's `status: "Hold"`, when shown on the status view, then `holdReason` is displayed with an explanation that Receiving HR can reopen it within a 6-month window, with no action available to the Employee themselves.
13. transfer-request-submission.AC13 — Given the status view is opened for a specific request id not belonging to the logged-in user, when API03 returns 403 `FORBIDDEN`, then a "not found" state is shown (no distinction is surfaced between "doesn't exist" and "not yours," matching the backend's own 403 vs 404 split without leaking which applies).
14. transfer-request-submission.AC14 — Given a request has `escalated: true`, when shown in either the list or the detail status view, then an escalation indicator is shown alongside its current status (no action is offered — resolution is out of scope, see below).
15. transfer-request-submission.AC15 — Given the "new request" form, when no Location is yet selected, then the Department field is disabled and shows no options; when a Location is selected, then the Department field is enabled and populated from `transfer-options.API02` scoped to that Location; when the selected Location changes, then any previously selected Department is cleared. The Role field is never filtered by Location or Department (see transfer-options.spec.md's Explicitly Out of Scope).
16. transfer-request-submission.AC16 — *(added, backend `NO_CHANGE_REQUESTED`)* Given the form is submitted and API01 returns 400 `NO_CHANGE_REQUESTED` (selected Location, Department, and Role all match the user's current values), then a message explains that at least one of the three must change, and no redirect occurs.
17. transfer-request-submission.AC17 — *(added, Role field restricted to `category: null`)* The Role selector (`transfer-options.API03`) only ever offers `category: null` Roles — Manager/HR/IT/Payroll/Facilities Roles are never shown as options, so a user cannot normally select one. If the form is submitted anyway (e.g. a stale cached option list) and API01 returns 400 `ROLE_CATEGORY_NOT_ALLOWED`, then an inline error on the Role field explains it isn't available for self-service transfer, and the option lists are refetched.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-request-submission.UT01 | AC1 | Render `/transfer-request` as a Payroll-category user with no active request | New-request form renders |
| transfer-request-submission.UT02 | AC2 | Submit valid form, mock API01 201 | Redirect to status view for new id |
| transfer-request-submission.UT03 | AC3 | Pick an effective date 10 days out | Inline validation error, submit blocked |
| transfer-request-submission.UT04 | AC4 | Submit with Department unselected | Inline field error, no request fired |
| transfer-request-submission.UT05 | AC5 | Mock API02 returning one `Hold` request | Status view shown directly, form not shown |
| transfer-request-submission.UT06 | AC6 | Mock API01 409 `ACTIVE_REQUEST_EXISTS` | Message + link to active request |
| transfer-request-submission.UT08 | AC9 | Mock API01 404 `NO_RECEIVING_HR` | Explanatory message, submit blocked |
| transfer-request-submission.UT09 | AC10 | Mock API02 with 2 requests, one mid-fulfillment | Newest-first list, sub-statuses shown |
| transfer-request-submission.UT10 | AC11 | Mock a `Rejected` request with `rejectionReason` | Reason shown, no action buttons |
| transfer-request-submission.UT11 | AC12 | Mock a `Hold` request with `holdReason` | Reason + 6-month explanation shown |
| transfer-request-submission.UT12 | AC13 | Mock API03 403 `FORBIDDEN` | Generic not-found state shown |
| transfer-request-submission.UT13 | AC14 | Mock a request with `escalated: true` | Escalation indicator rendered |
| transfer-request-submission.UT14 | AC15 | No Location selected, then select one, then change it after picking a Department | Department disabled → enabled with options → cleared on Location change |
| transfer-request-submission.UT15 | AC16 | Mock API01 400 `NO_CHANGE_REQUESTED` | Explanatory message, no redirect |
| transfer-request-submission.UT16 | AC17 | Mock API01 400 `ROLE_CATEGORY_NOT_ALLOWED` | Inline Role field error, options refetched |

## Explicitly Out of Scope
- Editing, withdrawing, or cancelling a submitted request — no such UI exists (BRD-002, explicit).
- Any UI for the 6-month tenure eligibility check — that's Current HR's gate, not shown at submission time (see current-hr-transfer-approval.spec.md).
- Appeal handling for a rejected request (BRD-002, explicit).
- Any UI for resolving an escalated ("HR Operations / Portal Admin queue") item — no such action exists anywhere in the backend contract; this spec only displays the flag.
- A human-readable status label map beyond raw status strings — deferred to plan.md as a presentation detail.

## Non-Functional Constraints (from constitution.md)
- Server-state fetching/caching via TanStack Query only, no ad hoc `useEffect` fetches — Architectural Constraints.
- Employee data (name, department/location/role) never logged to console in production — Security Posture.
- Test framework: Vitest + React Testing Library — Testing Discipline.
