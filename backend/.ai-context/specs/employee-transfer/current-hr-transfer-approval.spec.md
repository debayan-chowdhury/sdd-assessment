# Spec: Current HR Transfer Approval

## Spec ID
current-hr-transfer-approval

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-004

## Intent
Let the Current HR (the Employee referenced by a `TransferRequest`'s `currentHrId`) review the requesting Employee's 6-month minimum tenure and accept or reject the request as the second approval gate, moving it to Receiving HR on accept or closing it on reject.

**Amendment (tenure rule softened to a warning):** BRD-004's 6-month tenure rule was originally enforced as a hard block on accept (409 `INELIGIBLE_TENURE`). Per product decision, this is now advisory only — the pending-queue response still surfaces `employeeTenureDays`/`meetsMinimumTenure` so Current HR sees the warning before deciding, but accepting an under-tenure Employee is Current HR's judgment call and always succeeds. The `INELIGIBLE_TENURE` error code no longer exists.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity and status machine this spec advances), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token), .ai-context/specs/employee-transfer/current-manager-transfer-approval.spec.md (the gate immediately before this one).

**Flagged gap — tenure source:** BRD-004 requires "at least 6 months in the employee's current role," but the Employee model (employee-crud-mapping.spec.md) has no field marking when the employee started their *current* role — only Mongoose `createdAt`/`updatedAt` on the whole record, which reflects original record creation, not the last role/department/location change. This spec computes tenure as `now - Employee.createdAt`, a flagged approximation. It will overstate tenure for an employee who has already transferred once via this journey (their role changed in place without resetting a clock) — recommend adding a dedicated `roleAssignedAt` field to the Employee model at plan.md stage; not decided here.

## API Contract

### current-hr-transfer-approval.API01 — GET /api/v1/transfer-requests/pending/current-hr
**Request payload:** none.
**Success response (200):** array of `TransferRequest` objects where `status = "Pending Current HR Approval"` and `currentHrId` equals the calling Employee's id, each annotated with `employeeTenureDays` and `meetsMinimumTenure` (computed per the flagged approximation above).
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### current-hr-transfer-approval.API02 — POST /api/v1/transfer-requests/:id/current-hr-decision
**Request payload:**
```json
{ "decision": "accept | reject", "reason": "string | omitted" }
```
**Success response (200):** updated `TransferRequest` object — `status: "Pending Receiving HR Approval"` on accept, `status: "Rejected"` on reject.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `decision` missing or not one of `accept`/`reject` | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | The calling Employee is not this request's `currentHrId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `status` is not `Pending Current HR Approval` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

## Acceptance Criteria
1. current-hr-transfer-approval.AC1 — Given a request in `Pending Current HR Approval` assigned to the caller, and the employee has ≥6 months' tenure, when POST .../current-hr-decision is called with `decision: "accept"`, then `status` becomes `Pending Receiving HR Approval` and the response is 200.
2. current-hr-transfer-approval.AC2 — Given the same precondition but the employee has <6 months' tenure, when called with `decision: "accept"`, then `status` still becomes `Pending Receiving HR Approval` and the response is 200 (tenure is advisory, not blocking).
3. current-hr-transfer-approval.AC3 — Given a request in `Pending Current HR Approval` assigned to the caller, when called with `decision: "reject"` (with or without `reason`), then `status` becomes `Rejected` and the response is 200 — BRD-004 does not require a captured reason, unlike BRD-003.
4. current-hr-transfer-approval.AC4 — Given a request not assigned to the caller as `currentHrId`, when POST .../current-hr-decision is called, then the response is 403 `FORBIDDEN`.
5. current-hr-transfer-approval.AC5 — Given a request whose `status` is not `Pending Current HR Approval`, when POST .../current-hr-decision is called, then the response is 409 `INVALID_STATUS_TRANSITION`.
6. current-hr-transfer-approval.AC6 — Given a nonexistent `id`, when POST .../current-hr-decision is called, then the response is 404 `NOT_FOUND`.
7. current-hr-transfer-approval.AC7 — Given no valid token, when either endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
8. current-hr-transfer-approval.AC8 — Given a request has remained in `Pending Current HR Approval` for more than 2 days without a decision, then it is flagged `escalated: true` with `escalatedAt` set — `status` is unchanged.
9. current-hr-transfer-approval.AC9 — Given a request is assigned to the caller and in the correct status, when GET /api/v1/transfer-requests/pending/current-hr is called, then it appears in the list with `employeeTenureDays` and `meetsMinimumTenure` computed.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| current-hr-transfer-approval.UT01 | AC1 | Accept for an employee with 8 months' tenure | 200, `status: "Pending Receiving HR Approval"` |
| current-hr-transfer-approval.UT02 | AC2 | Accept for an employee with 2 months' tenure | 200, `status: "Pending Receiving HR Approval"` (warning surfaced in the queue GET, not blocking) |
| current-hr-transfer-approval.UT03 | AC3 | Reject with no reason | 200, `status: "Rejected"` |
| current-hr-transfer-approval.UT04 | AC4 | Decide a request assigned to a different HR Employee | 403 `FORBIDDEN` |
| current-hr-transfer-approval.UT05 | AC5 | Decide a request already `Pending Receiving HR Approval` | 409 `INVALID_STATUS_TRANSITION` |
| current-hr-transfer-approval.UT06 | AC6 | Decide a nonexistent request id | 404 `NOT_FOUND` |
| current-hr-transfer-approval.UT07 | AC7 | Call either endpoint with no token | 401 `UNAUTHORIZED` |
| current-hr-transfer-approval.UT08 | AC8 | Advance a fake clock past 2 days with no decision | `escalated: true`, `status` unchanged |
| current-hr-transfer-approval.UT09 | AC9 | List pending queue for an HR Employee with 2 assigned requests | Both returned with tenure fields |

## Explicitly Out of Scope
- Disciplinary/investigation status, performance ratings, PIP status, probation completion, or any cool-off period since a prior transfer — Current HR's validation in this journey checks only the 6-month tenure rule (BRD-004, explicit).
- Any correction/backfill of historical tenure data — the `roleAssignedAt` gap above is flagged, not resolved.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
