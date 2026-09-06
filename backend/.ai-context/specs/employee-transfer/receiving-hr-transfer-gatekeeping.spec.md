# Spec: Receiving HR Transfer Gatekeeping

## Spec ID
receiving-hr-transfer-gatekeeping

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-005

**Revised (v1.1, 2026-09-03):** Gate 1 finding — API04/06/07/08 used condensed inline exception lists instead of the full `Code | Condition | Response body` table format used by every other endpoint in this journey. Reformatted to tables; no behavioral change.

## Intent
Let Receiving HR (the Employee referenced by a `TransferRequest`'s `receivingHrId`) act at every point the BRD assigns to that role: the third approval gate (assigning a Receiving Manager and updating the employee's organisational data on accept), reassigning a new candidate manager after a Receiving Manager rejects, triggering Payroll/IT/Facilities once the Receiving Manager accepts, confirming completion once all three finish, and reopening a `Hold` request within its 6-month window.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity and status machine this spec advances at multiple points), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token), .ai-context/specs/employee-transfer/receiving-manager-transfer-approval.spec.md (the gate this spec routes into and receives rejections/silence from), .ai-context/specs/employee-transfer/payroll-transfer-update.spec.md, .ai-context/specs/employee-transfer/it-transfer-provisioning.spec.md, .ai-context/specs/employee-transfer/facilities-transfer-arrangement.spec.md (the three fulfillment specs this spec triggers and reads from), .ai-context/specs/admin/employee-crud-mapping.spec.md (the Employee record this spec updates on gate-accept).

**Amendment (organisational update deferred to `effectiveDate`, no longer immediate):** BRD-005 touchpoint 1 states "the organisational information update happens at this touchpoint" — i.e., when Receiving HR accepts and assigns a manager. This spec originally implemented that literally (AC1 updated the Employee's `locationId`/`departmentId`/`roleId`/`managerId`/`hrId` immediately on accept). Per product decision, that update is now deferred until the request's `effectiveDate`: `gateDecision` only sets `receivingManagerId` and advances `status` — the Employee record itself is left untouched until `effectiveDate` arrives. Three paths apply it once due (all sharing the same `receivingManagerId set + orgDataAppliedAt null + effectiveDate <= now` condition, via `transferRequestWorkflow.service.js`):
  1. `applyDueOrgUpdate(employeeId)` — a fast-path check for one Employee, run on every `employeeAuth`-authenticated request and at login (which doesn't pass through that middleware).
  2. `applyAllDueOrgUpdates()` — a sweep across every Employee, run every 15 minutes by `jobs/dueOrgUpdates.job.js` (a `node-cron` schedule started in `src/index.js`), so the update lands close to `effectiveDate` even if the affected Employee never logs in around that time.
  3. `POST /api/v1/admin/jobs/due-org-updates/trigger` (Admin-authenticated, `jobs.controller.js`) — an on-demand manual trigger of the same sweep as (2), for testing or not wanting to wait for the next scheduled run; returns `{ appliedCount }`.

  As before, no rollback is implemented if the assigned Receiving Manager subsequently rejects and the request is reassigned or put on `Hold` before `effectiveDate` — application always uses whatever `receivingManagerId`/`newLocationId` etc. are current on the request at the moment it's applied, which self-corrects for reassignment but not for the accepted-then-abandoned case.

**Flagged assumption — Payroll/IT applicability:** BRD-007 says Payroll "applies conditionally, only where pay is actually affected"; BRD-008 says IT "applies conditionally" with no stated condition. Neither condition is computable by this system (no compensation/pay-band or access-scope data exists here). This spec always sets `payrollStatus`/`itStatus` to `"Pending"` at trigger time — real-world conditionality is left to Payroll/IT's own judgment when they report back (they may report `Done` immediately if not affected). `facilitiesStatus` is the one condition this system *can* compute: `"Pending"` if `newLocationId !== currentLocationId`, else `"Not Applicable"` (BRD-009: "only when location changes").

## API Contract

### receiving-hr-transfer-gatekeeping.API01 — GET /api/v1/transfer-requests/pending/receiving-hr-gate
**Success response (200):** array of `TransferRequest` objects where `status = "Pending Receiving HR Approval"` and `receivingHrId` equals the caller.
**Exceptions:** `401 UNAUTHORIZED` (no valid token).

### receiving-hr-transfer-gatekeeping.API02 — POST /api/v1/transfer-requests/:id/receiving-hr-gate-decision
**Request payload:**
```json
{ "decision": "accept", "assignedManagerId": "string" }
```
or
```json
{ "decision": "reject", "reason": "string | omitted" }
```
**Success response (200):** updated `TransferRequest`. On accept: `status: "Pending Receiving Manager Approval"`, `receivingManagerId` set, and the target Employee's `locationId`/`departmentId`/`roleId`/`managerId`/`hrId` updated to `newLocationId`/`newDepartmentId`/`newRoleId`/`assignedManagerId`/`receivingHrId` (see the flagged reading above). On reject: `status: "Rejected"`.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `decision` missing/invalid, or `decision: "accept"` with `assignedManagerId` missing | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller is not this request's `receivingHrId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 404 | `assignedManagerId` does not reference an existing Employee | `{ "error": { "message": "...", "code": "MANAGER_NOT_FOUND" } }` |
| 400 | `assignedManagerId` does not hold a Role with `category: "Manager"`, or is not at `newLocationId`+`newDepartmentId` | `{ "error": { "message": "...", "code": "INVALID_MANAGER_ROLE" } }` |
| 409 | `status` is not `Pending Receiving HR Approval` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

### receiving-hr-transfer-gatekeeping.API03 — POST /api/v1/transfer-requests/:id/reassign-manager
Used after a Receiving Manager rejects and another untried candidate exists (see receiving-manager-transfer-approval.spec.md) — `status` is `Pending Receiving HR Reassignment` at this point.

**Request payload:**
```json
{ "assignedManagerId": "string" }
```
**Success response (200):** `status: "Pending Receiving Manager Approval"`, `receivingManagerId` updated to the new candidate.
**Exceptions:** same shape as API02's `assignedManagerId` exceptions, plus `409 INVALID_STATUS_TRANSITION` if `status` is not `Pending Receiving HR Reassignment`.

### receiving-hr-transfer-gatekeeping.API04 — POST /api/v1/transfer-requests/:id/trigger-fulfillment
Valid only when `status = "Pending Fulfillment Trigger"` (Receiving Manager has accepted).

**Request payload:** none.
**Success response (200):** `status: "Pending Fulfillment"`, `payrollStatus`/`itStatus` set to `"Pending"`, `facilitiesStatus` set per the location-change rule above.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller is not this request's `receivingHrId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `status` is not `Pending Fulfillment Trigger` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

### receiving-hr-transfer-gatekeeping.API05 — GET /api/v1/transfer-requests/pending/receiving-hr-fulfillment
**Success response (200):** array of `TransferRequest` objects where `status = "Pending Fulfillment"` and `receivingHrId` equals the caller, including all three sub-statuses.
**Exceptions:** `401 UNAUTHORIZED`.

**Amendment (API06 removed):** `POST /api/v1/transfer-requests/:id/respond-need-information` (Receiving HR replying to a Payroll/IT/Facilities "Need Information" report) is removed — the whole "Need Information" report/reply mechanism was removed per product decision (see payroll-transfer-update.spec.md, it-transfer-provisioning.spec.md, facilities-transfer-arrangement.spec.md). Payroll/IT/Facilities now only ever report `"Done"`, so there is nothing for Receiving HR to reply to. The API06 id is retired, not reused.

### receiving-hr-transfer-gatekeeping.API07 — POST /api/v1/transfer-requests/:id/confirm-completion
Valid only when every non-`"Not Applicable"` sub-status is `"Done"`.

**Request payload:** none.
**Success response (200):** `status: "Completed"`.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller is not this request's `receivingHrId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | One or more applicable sub-statuses are not yet `"Done"` | `{ "error": { "message": "...", "code": "FULFILLMENT_INCOMPLETE" } }` |

### receiving-hr-transfer-gatekeeping.API08 — POST /api/v1/transfer-requests/:id/reopen-hold
**Request payload:**
```json
{ "assignedManagerId": "string" }
```
**Success response (200):** `status: "Pending Receiving Manager Approval"`, `receivingManagerId` set, `holdReason` cleared.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller is not this request's `receivingHrId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `status` is not `Hold` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |
| 409 | More than 6 months have elapsed since `holdStartedAt` | `{ "error": { "message": "...", "code": "HOLD_WINDOW_EXPIRED" } }` |
| 404 | `assignedManagerId` does not reference an existing Employee | `{ "error": { "message": "...", "code": "MANAGER_NOT_FOUND" } }` |
| 400 | `assignedManagerId` does not hold a Role with `category: "Manager"`, or is not at `newLocationId`+`newDepartmentId` | `{ "error": { "message": "...", "code": "INVALID_MANAGER_ROLE" } }` |

## Acceptance Criteria
1. receiving-hr-transfer-gatekeeping.AC1 — Given a request in `Pending Receiving HR Approval` assigned to the caller and a valid `assignedManagerId` (Manager-category, at the target Department+Location), when POST .../receiving-hr-gate-decision is called with `decision: "accept"`, then `status` becomes `Pending Receiving Manager Approval`, `receivingManagerId` is set — and the target Employee's record is left unchanged (see the deferred-update amendment above; AC1a below covers when the update actually lands).
2. receiving-hr-transfer-gatekeeping.AC1a — *(added)* Given an accepted request (`receivingManagerId` set, `orgDataAppliedAt` still `null`) whose `effectiveDate` has passed, when the affected Employee next makes any `employeeAuth`-authenticated request (or logs in), then their Location/Department/Role/`managerId`/`hrId` are updated to the request's `newLocationId`/`newDepartmentId`/`newRoleId`/`receivingManagerId`/`receivingHrId`, and `orgDataAppliedAt` is stamped so it is never re-applied.
3. receiving-hr-transfer-gatekeeping.AC1b — *(added)* Given an accepted request whose `effectiveDate` has not yet passed, when the affected Employee makes any authenticated request, then their Employee record is left unchanged.
2. receiving-hr-transfer-gatekeeping.AC2 — Given the same precondition, when called with `decision: "reject"`, then `status` becomes `Rejected` and the Employee's record is unchanged.
3. receiving-hr-transfer-gatekeeping.AC3 — Given `assignedManagerId` does not reference a Manager-category Employee at the target Department+Location, when POST .../receiving-hr-gate-decision is called, then the response is 400 `INVALID_MANAGER_ROLE`.
4. receiving-hr-transfer-gatekeeping.AC4 — Given a request in `Pending Receiving HR Reassignment` and a valid new `assignedManagerId`, when POST .../reassign-manager is called, then `status` becomes `Pending Receiving Manager Approval` with the new `receivingManagerId`.
5. receiving-hr-transfer-gatekeeping.AC5 — Given a request in `Pending Fulfillment Trigger`, when POST .../trigger-fulfillment is called, then `status` becomes `Pending Fulfillment`, `payrollStatus`/`itStatus` are `"Pending"`, and `facilitiesStatus` is `"Pending"` if the location changed or `"Not Applicable"` otherwise.
**AC6 retired** along with API06 (see the amendment above) — it tested the removed `respond-need-information` endpoint.

7. receiving-hr-transfer-gatekeeping.AC7 — Given all applicable sub-statuses are `"Done"`, when POST .../confirm-completion is called, then `status` becomes `Completed`.
8. receiving-hr-transfer-gatekeeping.AC8 — Given at least one applicable sub-status is not yet `"Done"`, when POST .../confirm-completion is called, then the response is 409 `FULFILLMENT_INCOMPLETE` and `status` is unchanged.
9. receiving-hr-transfer-gatekeeping.AC9 — Given a request in `Hold` with `holdStartedAt` less than 6 months ago, when POST .../reopen-hold is called with a valid `assignedManagerId`, then `status` becomes `Pending Receiving Manager Approval`.
10. receiving-hr-transfer-gatekeeping.AC10 — Given a request in `Hold` with `holdStartedAt` more than 6 months ago, when POST .../reopen-hold is called, then the response is 409 `HOLD_WINDOW_EXPIRED`.
11. receiving-hr-transfer-gatekeeping.AC11 — Given any endpoint in this spec is called on a request whose `receivingHrId` is not the caller, then the response is 403 `FORBIDDEN`.
12. receiving-hr-transfer-gatekeeping.AC12 — Given any endpoint in this spec is called with an `id` in the wrong `status` for that endpoint, then the response is 409 `INVALID_STATUS_TRANSITION`.
13. receiving-hr-transfer-gatekeeping.AC13 — Given no valid token, when any endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
14. receiving-hr-transfer-gatekeeping.AC14 — Given a request assigned to the caller in the right status, when the corresponding GET queue endpoint (API01 or API05) is called, then it appears in the list; otherwise it does not.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| receiving-hr-transfer-gatekeeping.UT01 | AC1 | Accept with a valid manager | 200, `status: "Pending Receiving Manager Approval"`, Employee unchanged |
| receiving-hr-transfer-gatekeeping.UT01a | AC1a | Accepted request, `effectiveDate` in the past, affected Employee makes an authenticated request | Employee updated, `orgDataAppliedAt` stamped |
| receiving-hr-transfer-gatekeeping.UT01b | AC1b | Accepted request, `effectiveDate` in the future, affected Employee makes an authenticated request | Employee unchanged |
| receiving-hr-transfer-gatekeeping.UT02 | AC2 | Reject | 200, `status: "Rejected"`, Employee unchanged |
| receiving-hr-transfer-gatekeeping.UT03 | AC3 | Accept with a non-Manager-category `assignedManagerId` | 400 `INVALID_MANAGER_ROLE` |
| receiving-hr-transfer-gatekeeping.UT04 | AC4 | Reassign to a second candidate manager | 200, `status: "Pending Receiving Manager Approval"` |
| receiving-hr-transfer-gatekeeping.UT05 | AC5 | Trigger fulfillment, location unchanged | `facilitiesStatus: "Not Applicable"` |
| receiving-hr-transfer-gatekeeping.UT06 | — | Retired along with AC6/API06 (see amendment above) | — |
| receiving-hr-transfer-gatekeeping.UT05b | AC5 | Trigger fulfillment, location changed | `facilitiesStatus: "Pending"` |
| receiving-hr-transfer-gatekeeping.UT07 | AC7 | Confirm when all applicable are `"Done"` | 200, `status: "Completed"` |
| receiving-hr-transfer-gatekeeping.UT08 | AC8 | Confirm when IT is still `"Pending"` | 409 `FULFILLMENT_INCOMPLETE` |
| receiving-hr-transfer-gatekeeping.UT09 | AC9 | Reopen a 3-month-old hold | 200, `status: "Pending Receiving Manager Approval"` |
| receiving-hr-transfer-gatekeeping.UT10 | AC10 | Reopen a 7-month-old hold | 409 `HOLD_WINDOW_EXPIRED` |
| receiving-hr-transfer-gatekeeping.UT11 | AC11 | Call any decision endpoint as a different HR Employee | 403 `FORBIDDEN` |
| receiving-hr-transfer-gatekeeping.UT12 | AC12 | Call trigger-fulfillment on a request still `Pending Receiving Manager Approval` | 409 `INVALID_STATUS_TRANSITION` |
| receiving-hr-transfer-gatekeeping.UT13 | AC13 | Call any endpoint with no token | 401 `UNAUTHORIZED` |
| receiving-hr-transfer-gatekeeping.UT14 | AC14 | List gate and fulfillment queues with mixed-status requests | Only correctly-scoped requests returned |

## Explicitly Out of Scope
- Actually sending a confirmation email to the employee (BRD-005 touchpoint 3) — no notification/email system exists in this project (see employee-crud-mapping.spec.md's v1.2 amendment); `confirm-completion` only changes `status`.
- Resolution mechanics for an escalated item (2-day silence at this gate) — flag-only, same as every other approval-gate spec; no dedicated action defined.
- Enforcing that a reassigned or reopened manager wasn't already tried and rejected on this same request — BRD-006 says Receiving HR selects "the next remaining manager" but doesn't state this as a system-enforced constraint; not implemented here, flagged gap.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- PII (`name`) never appears in logs.
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
