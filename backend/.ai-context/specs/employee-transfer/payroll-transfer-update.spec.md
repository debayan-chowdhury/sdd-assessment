# Spec: Payroll Transfer Update

## Spec ID
payroll-transfer-update

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-007

## Intent
Let any Employee holding a Payroll-category Role see the worklist of transfer requests waiting on Payroll and report back `Done`, within a 5-business-day window of being triggered.

**Amendment (Need Information removed):** This spec originally let Payroll report an intermediate `"Need Information"` sub-status with a message, which Receiving HR could reply to (see the removed `respond-need-information` endpoint in receiving-hr-transfer-gatekeeping.spec.md). Per product decision, that whole report/reply mechanism is removed — Payroll now only ever reports `"Done"`. `payrollStatus` values are just `Pending | Done | Not Applicable | null`.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/updates), .ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md (triggers `payrollStatus` to `"Pending"`), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token), .ai-context/specs/admin/role-crud.spec.md (the `Payroll` category this spec's caller must hold).

**Flagged assumption — org-wide scope:** Payroll "operates in its own separate portal/system" per BRD-007 and is not described as scoped to a specific Location/Department the way Manager/HR are. This spec treats Payroll as a department-agnostic function: any active Employee holding a Role with `category: "Payroll"` can see and act on any request with `payrollStatus` pending or needing information, regardless of the request's Department/Location. Not explicitly stated in the BRD; flagged for confirmation.

**Flagged assumption — applicability:** BRD-007 says Payroll "applies conditionally, only where pay is actually affected," but this system holds no compensation/pay-band data to compute that condition. `payrollStatus` is always set to `"Pending"` at trigger time (receiving-hr-transfer-gatekeeping.spec.md); a Payroll user who determines pay isn't actually affected simply reports `"Done"` immediately — the conditionality is resolved by Payroll's own judgment, not by this system.

## API Contract

### payroll-transfer-update.API01 — GET /api/v1/transfer-requests/pending/payroll
**Success response (200):** array of `TransferRequest` objects where `payrollStatus` is `"Pending"`.
**Exceptions:** `401 UNAUTHORIZED`, `403 FORBIDDEN` (caller does not hold a `Payroll`-category Role).

### payroll-transfer-update.API02 — POST /api/v1/transfer-requests/:id/payroll-status
**Request payload:**
```json
{ "status": "Done" }
```

**Success response (200):** updated `TransferRequest` with `payrollStatus` set to `"Done"`.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `status` missing or not `"Done"` | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller does not hold a `Payroll`-category Role | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `payrollStatus` is not `"Pending"` (e.g. `"Not Applicable"`, `"Done"`, or `null`) | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

## Acceptance Criteria
1. payroll-transfer-update.AC1 — Given a request with `payrollStatus: "Pending"`, when POST .../payroll-status is called by a Payroll-category Employee with `status: "Done"`, then `payrollStatus` becomes `"Done"` and the response is 200.
2. payroll-transfer-update.AC2 — Given `status` missing or not `"Done"`, when POST .../payroll-status is called, then the response is 400 `VALIDATION_ERROR`.
3. payroll-transfer-update.AC3 — Given a request with `payrollStatus: "Not Applicable"` or `"Done"`, when POST .../payroll-status is called, then the response is 409 `INVALID_STATUS_TRANSITION`.
4. payroll-transfer-update.AC4 — Given the caller does not hold a `Payroll`-category Role, when either endpoint in this spec is called, then the response is 403 `FORBIDDEN`.
5. payroll-transfer-update.AC5 — Given a nonexistent `id`, when POST .../payroll-status is called, then the response is 404 `NOT_FOUND`.
6. payroll-transfer-update.AC6 — Given no valid token, when either endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
7. payroll-transfer-update.AC7 — Given a request has had `payrollStatus: "Pending"` for more than 5 business days with no report, then it is flagged `escalated: true` — `payrollStatus` is unchanged.
8. payroll-transfer-update.AC8 — Given requests exist with a mix of `payrollStatus` values, when GET /api/v1/transfer-requests/pending/payroll is called, then only `"Pending"` ones are returned.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| payroll-transfer-update.UT01 | AC1 | Report Done on a Pending item | 200, `payrollStatus: "Done"` |
| payroll-transfer-update.UT02 | AC2 | Report status missing/invalid | 400 `VALIDATION_ERROR` |
| payroll-transfer-update.UT03 | AC3 | Report status on a `"Not Applicable"` item | 409 `INVALID_STATUS_TRANSITION` |
| payroll-transfer-update.UT04 | AC4 | Call either endpoint as a non-Payroll Employee | 403 `FORBIDDEN` |
| payroll-transfer-update.UT05 | AC5 | Report status on a nonexistent request id | 404 `NOT_FOUND` |
| payroll-transfer-update.UT06 | AC6 | Call either endpoint with no token | 401 `UNAUTHORIZED` |
| payroll-transfer-update.UT07 | AC7 | Advance a fake clock past 5 business days with no report | `escalated: true` |
| payroll-transfer-update.UT08 | AC8 | List worklist with Pending/Done/Not Applicable mixed | Only Pending returned |

## Explicitly Out of Scope
- Building or integrating with Payroll's actual external portal/system (BRD-007, explicit) — this is a status-reporting worklist only.
- Any accept/reject action, or triggering logic beyond the 5-business-day response window (BRD-007, explicit).
- Determining whether pay is actually affected — left entirely to the reporting Payroll Employee's judgment (see flagged assumption above).
- Resolution mechanics for an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
