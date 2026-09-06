# Spec: Transfer Request Submission

## Spec ID
transfer-request-submission

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-002

## Intent
Let a logged-in Employee submit one Internal Transfer request (new Location/Department/Role, effective date, optional reason), which snapshots their Current Manager/HR and resolves the target's Receiving HR, then enters the approval chain at "Pending Current Manager Approval." This spec owns the `TransferRequest` entity and its status vocabulary, which every other Employee Transfer journey spec (BRD-003 through BRD-009) reads and advances.

**Amendment (auto-enable Department↔Role mapping):** Submission previously required an Admin to have pre-mapped `newRoleId` to `newDepartmentId` (via department-crud.spec.md's mapping endpoint), rejecting with 409 `ROLE_NOT_ENABLED_FOR_DEPARTMENT` otherwise. Per product decision, submission now creates that `DepartmentRole` mapping automatically if it doesn't already exist, rather than blocking the request — see AC5.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (submission requires a valid Employee token), .ai-context/specs/admin/employee-crud-mapping.spec.md (an Employee's existing `managerId`/`hrId`/`locationId`/`departmentId` mapping is the source for Current Manager/Current HR and the departmental structure a request routes through), .ai-context/specs/employee-transfer/current-manager-transfer-approval.spec.md, .ai-context/specs/employee-transfer/current-hr-transfer-approval.spec.md, .ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md, .ai-context/specs/employee-transfer/receiving-manager-transfer-approval.spec.md, .ai-context/specs/employee-transfer/payroll-transfer-update.spec.md, .ai-context/specs/employee-transfer/it-transfer-provisioning.spec.md, .ai-context/specs/employee-transfer/facilities-transfer-arrangement.spec.md (all advance the entity defined here), .ai-context/specs/employee-transfer/transfer-options.spec.md (added later — the Location/Department/Role selectors this spec's submission form (AC1/AC2) reads its valid options from; this spec's own API Contract never included an options-listing endpoint, which was a flagged gap until transfer-options.spec.md closed it).

**`TransferRequest.status` — the full state machine (defined here, referenced by every other journey spec):**
```
Pending Current Manager Approval
  → Pending Current HR Approval
    → Pending Receiving HR Approval
      → Pending Receiving Manager Approval
        → Pending Fulfillment Trigger        (Receiving Manager accepted; awaiting Receiving HR to trigger Payroll/IT/Facilities)
          → Pending Fulfillment              (Payroll/IT/Facilities running in parallel)
            → Completed
      ⇄ Pending Receiving HR Reassignment    (Receiving Manager rejected, another candidate manager exists — see receiving-manager-transfer-approval.spec.md)
→ Rejected   (from any of the four approval gates — terminal)
→ Hold       (all candidate Receiving Managers for the target Department+Location have rejected — see receiving-manager-transfer-approval.spec.md)
```
An `escalated: boolean` flag (with `escalatedAt`) is layered on top of whichever status a request is in when the cross-cutting 2-day (approval gates) or 5-business-day (Payroll/IT/Facilities) no-response window elapses — see each downstream spec. Resolving an escalated item (the "HR Operations / Portal Admin queue") has no defined action or endpoint anywhere in the BRD; it is flagged as out of scope across every spec in this journey, not just here.

**Flagged assumption — snapshotting:** `currentLocationId`/`currentDepartmentId`/`currentRoleId`/`currentManagerId`/`currentHrId` are copied from the Employee record onto the `TransferRequest` at submission time and are not re-read live afterward, since BRD-002 fixes "Current Manager"/"Current HR" as the actors who approve — if the source Employee record changed mid-flight (e.g. via an unrelated Admin edit), the request should still resolve against who was current at submission. Not explicitly stated in the BRD; grounded in the "Current Manager"/"Current HR" naming being about a point-in-time snapshot, not a live reference.

**Flagged gap — Receiving HR uniqueness:** BRD-002 states "Receiving HR is unique per department+location combination," but nothing in the Admin Panel BRD/spec enforces that at most one active HR-category Employee exists per Location+Department. This spec's Receiving HR resolution (AC6) assumes that invariant holds; if it doesn't (zero or more than one HR-category Employee at the target Department+Location), see AC6/AC7 below.

## API Contract

### transfer-request-submission.API01 — POST /api/v1/transfer-requests
**Request payload:**
```json
{
  "newLocationId": "string", "newDepartmentId": "string", "newRoleId": "string",
  "effectiveDate": "string (ISO date)", "reason": "string | omitted"
}
```
**Success response (201):**
```json
{
  "id": "string", "employeeId": "string",
  "currentLocationId": "string", "currentDepartmentId": "string", "currentRoleId": "string",
  "newLocationId": "string", "newDepartmentId": "string", "newRoleId": "string",
  "effectiveDate": "string", "reason": "string | null",
  "status": "Pending Current Manager Approval",
  "currentManagerId": "string", "currentHrId": "string",
  "receivingHrId": "string", "receivingManagerId": null,
  "payrollStatus": null, "itStatus": null, "facilitiesStatus": null,
  "rejectionReason": null, "holdReason": null,
  "escalated": false, "createdAt": "string"
}
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `newLocationId`, `newDepartmentId`, `newRoleId`, or `effectiveDate` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | `newLocationId`, `newDepartmentId`, or `newRoleId` does not reference an existing, active record | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 400 | `newRoleId` references a Role whose `category` is not `null` (Manager/HR/IT/Payroll/Facilities) | `{ "error": { "message": "...", "code": "ROLE_CATEGORY_NOT_ALLOWED" } }` |
| 404 | No active HR-category Employee exists at `newLocationId`+`newDepartmentId` | `{ "error": { "message": "...", "code": "NO_RECEIVING_HR" } }` |
| 400 | `effectiveDate` is less than 30 days from the submission date | `{ "error": { "message": "...", "code": "EFFECTIVE_DATE_TOO_SOON" } }` |
| 409 | The calling Employee already has a non-terminal `TransferRequest` (any status other than `Rejected`/`Completed`) | `{ "error": { "message": "...", "code": "ACTIVE_REQUEST_EXISTS" } }` |
| 400 | `newLocationId`, `newDepartmentId`, AND `newRoleId` all equal the Employee's current values — a request must change at least one of the three | `{ "error": { "message": "...", "code": "NO_CHANGE_REQUESTED" } }` |

### transfer-request-submission.API02 — GET /api/v1/transfer-requests/me
**Request payload:** none.
**Success response (200):** array of `TransferRequest` objects (shape above) belonging to the calling Employee, newest first, each additionally annotated with `currentManagerName`/`currentHrName` (string | null, resolved from `currentManagerId`/`currentHrId`) and `receivingManagerName`/`receivingHrName` (string | null, resolved from `receivingManagerId`/`receivingHrId` — `receivingManagerName` is `null` until Receiving HR's gate-accept sets `receivingManagerId`) — so the caller's own history view doesn't need a separate name lookup for either side.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### transfer-request-submission.API03 — GET /api/v1/transfer-requests/:id
**Success response (200):** `TransferRequest` object, only if `employeeId` matches the calling Employee.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | The request exists but does not belong to the calling Employee | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

## Acceptance Criteria
1. transfer-request-submission.AC1 — Given an Employee with no active `TransferRequest`, a valid target Location/Department/Role, and `effectiveDate` at least 30 days out, when POST /api/v1/transfer-requests is called, then the request is created with 201, status `Pending Current Manager Approval`, and `currentManagerId`/`currentHrId` snapshotted from the Employee's own mapping.
2. transfer-request-submission.AC2 — Given `effectiveDate` is fewer than 30 days from submission, when POST /api/v1/transfer-requests is called, then the response is 400 `EFFECTIVE_DATE_TOO_SOON`.
3. transfer-request-submission.AC3 — Given the calling Employee already has a `TransferRequest` in any non-terminal status (including `Hold`), when POST /api/v1/transfer-requests is called, then the response is 409 `ACTIVE_REQUEST_EXISTS`.
4. transfer-request-submission.AC4 — Given `newLocationId`, `newDepartmentId`, or `newRoleId` does not reference an existing active record, when POST /api/v1/transfer-requests is called, then the response is 404 `NOT_FOUND`.
5. transfer-request-submission.AC5 — Given `newRoleId` is not yet enabled for `newDepartmentId`, when POST /api/v1/transfer-requests is called, then the mapping is created automatically (see amendment above) and submission proceeds as normal — `ROLE_NOT_ENABLED_FOR_DEPARTMENT` no longer occurs on this endpoint.
6. transfer-request-submission.AC6 — Given exactly one active HR-category Employee exists at `newLocationId`+`newDepartmentId`, when POST /api/v1/transfer-requests is called, then `receivingHrId` is set to that Employee's id.
7. transfer-request-submission.AC7 — Given no active HR-category Employee exists at `newLocationId`+`newDepartmentId`, when POST /api/v1/transfer-requests is called, then the response is 404 `NO_RECEIVING_HR`.
8. transfer-request-submission.AC8 — Given required fields are missing, when POST /api/v1/transfer-requests is called, then the response is 400 `VALIDATION_ERROR`.
9. transfer-request-submission.AC9 — Given no valid Employee token, when POST /api/v1/transfer-requests is called, then the response is 401 `UNAUTHORIZED`.
10. transfer-request-submission.AC10 — Given an Employee has one or more `TransferRequest`s, when GET /api/v1/transfer-requests/me is called, then all of them are returned, newest first, each showing its current `status` and per-target (`payrollStatus`/`itStatus`/`facilitiesStatus`) detail.
11. transfer-request-submission.AC11 — Given a `TransferRequest` belonging to a different Employee, when GET /api/v1/transfer-requests/:id is called by the calling Employee, then the response is 403 `FORBIDDEN`.
12. transfer-request-submission.AC12 — Given `newLocationId`, `newDepartmentId`, and `newRoleId` all equal the Employee's current `locationId`/`departmentId`/`roleId`, when POST /api/v1/transfer-requests is called, then the response is 400 `NO_CHANGE_REQUESTED` and no `TransferRequest` is created.
13. transfer-request-submission.AC13 — Given at least one of `newLocationId`/`newDepartmentId`/`newRoleId` differs from the Employee's current values (even if the other two match), when POST /api/v1/transfer-requests is called, then submission proceeds normally.
14. transfer-request-submission.AC14 — *(added)* Given `newRoleId` references a Role with `category` set to `"Manager"`, `"HR"`, `"IT"`, `"Payroll"`, or `"Facilities"`, when POST /api/v1/transfer-requests is called, then the response is 400 `ROLE_CATEGORY_NOT_ALLOWED` and no `TransferRequest` is created — an Employee can only self-service transfer into a regular (`category: null`) Role.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-request-submission.UT01 | AC1 | Submit valid request, 45 days out | 201, status `Pending Current Manager Approval` |
| transfer-request-submission.UT02 | AC2 | Submit with `effectiveDate` 10 days out | 400 `EFFECTIVE_DATE_TOO_SOON` |
| transfer-request-submission.UT03 | AC3 | Submit while an existing request is `Hold` | 409 `ACTIVE_REQUEST_EXISTS` |
| transfer-request-submission.UT04 | AC4 | Submit with nonexistent `newDepartmentId` | 404 `NOT_FOUND` |
| transfer-request-submission.UT05 | AC5 | Submit with `newRoleId` not yet enabled for `newDepartmentId` | 201, mapping created, request created normally |
| transfer-request-submission.UT06 | AC6 | Submit to a Department+Location with one active HR Employee | `receivingHrId` set correctly |
| transfer-request-submission.UT07 | AC7 | Submit to a Department+Location with no HR Employee | 404 `NO_RECEIVING_HR` |
| transfer-request-submission.UT08 | AC8 | Submit with `newLocationId` missing | 400 `VALIDATION_ERROR` |
| transfer-request-submission.UT09 | AC9 | Submit with no token | 401 `UNAUTHORIZED` |
| transfer-request-submission.UT10 | AC10 | Employee with 2 prior (terminal) requests submits a 3rd, then lists | All 3 returned, newest first |
| transfer-request-submission.UT11 | AC11 | Employee A requests Employee B's `TransferRequest` by id | 403 `FORBIDDEN` |
| transfer-request-submission.UT12 | AC12 | Submit with `newLocationId`/`newDepartmentId`/`newRoleId` all identical to current | 400 `NO_CHANGE_REQUESTED` |
| transfer-request-submission.UT13 | AC13 | Submit with `newLocationId`/`newDepartmentId` identical to current but `newRoleId` different | 201, created normally |
| transfer-request-submission.UT14 | AC13 | Submit with `newLocationId` identical to current but `newDepartmentId` different | 201, created normally |
| transfer-request-submission.UT15 | AC14 | Submit with `newRoleId` referencing a `category: "Manager"` Role | 400 `ROLE_CATEGORY_NOT_ALLOWED` |

## Explicitly Out of Scope
- Editing, withdrawing, or cancelling a submitted request (BRD-002, explicit — none of these actions exist).
- Eligibility criteria beyond the 30-day minimum notice (6-month tenure is Current HR's check — see current-hr-transfer-approval.spec.md).
- Appeal handling for a rejected request (BRD-002, explicit).
- External/cross-company transfers, new-hire onboarding, resignation/termination, compensation negotiation, international relocation/visa (BRD-002, explicit).
- Any integration with the Payroll, IT, or Facilities systems themselves (BRD-002, explicit).
- Automatic detection/expiry of a `Hold` request once its 6-month window lapses without reopening — BRD-006 states the employee "would need to submit a new request" after lapse, but doesn't specify whether the system auto-transitions the stale `Hold` request out of the way or simply lets a new submission proceed once the old one is past the window. Flagged gap, deferred to plan.md.
- Resolution mechanics for an escalated ("HR Operations / Portal Admin queue") item — no action or endpoint is defined by the BRD for any journey spec.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture) via portal-login-password-change.spec.md.
- PII (`name`, on the populated Employee references) never appears in logs at any log level.
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
- `/api/v1` versioned prefix (Versioning Rules) — this is new surface area under the existing prefix, not a breaking change to it.
