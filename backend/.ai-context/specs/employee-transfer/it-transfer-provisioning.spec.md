# Spec: IT Transfer Provisioning

## Spec ID
it-transfer-provisioning

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-008

## Intent
Let any Employee holding an IT-category Role see the worklist of transfer requests waiting on IT provisioning/deprovisioning and report back `Done`, within a 5-business-day window of being triggered.

**Amendment (Need Information removed):** same removal as payroll-transfer-update.spec.md — the report/reply "Need Information" mechanism is gone. IT now only ever reports `"Done"`. `itStatus` values are just `Pending | Done | Not Applicable | null`.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/updates), .ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md (triggers `itStatus` to `"Pending"`), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token), .ai-context/specs/admin/role-crud.spec.md (the `IT` category this spec's caller must hold), .ai-context/specs/employee-transfer/payroll-transfer-update.spec.md (identical mechanics — read together).

**Flagged assumption — org-wide scope:** same reasoning as payroll-transfer-update.spec.md: IT is treated as a department-agnostic function, not scoped to the request's Location/Department.

**Flagged gap — applicability condition:** BRD-008 says IT "applies conditionally" but, unlike Payroll (pay affected) and Facilities (location changed), states no condition at all. `itStatus` is always set to `"Pending"` at trigger time (receiving-hr-transfer-gatekeeping.spec.md); if provisioning genuinely isn't needed, the IT user reports `"Done"` immediately. This is a flagged gap in the source BRD, not resolved here.

## API Contract

### it-transfer-provisioning.API01 — GET /api/v1/transfer-requests/pending/it
**Success response (200):** array of `TransferRequest` objects where `itStatus` is `"Pending"`.
**Exceptions:** `401 UNAUTHORIZED`, `403 FORBIDDEN` (caller does not hold an `IT`-category Role).

### it-transfer-provisioning.API02 — POST /api/v1/transfer-requests/:id/it-status
**Request payload:**
```json
{ "status": "Done" }
```

**Success response (200):** updated `TransferRequest` with `itStatus` set to `"Done"`.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `status` missing or not `"Done"` | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller does not hold an `IT`-category Role | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `itStatus` is not `"Pending"` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

## Acceptance Criteria
1. it-transfer-provisioning.AC1 — Given a request with `itStatus: "Pending"`, when POST .../it-status is called by an IT-category Employee with `status: "Done"`, then `itStatus` becomes `"Done"` and the response is 200.
2. it-transfer-provisioning.AC2 — Given `status` missing or not `"Done"`, when POST .../it-status is called, then the response is 400 `VALIDATION_ERROR`.
3. it-transfer-provisioning.AC3 — Given a request with `itStatus: "Not Applicable"` or `"Done"`, when POST .../it-status is called, then the response is 409 `INVALID_STATUS_TRANSITION`.
4. it-transfer-provisioning.AC4 — Given the caller does not hold an `IT`-category Role, when either endpoint in this spec is called, then the response is 403 `FORBIDDEN`.
5. it-transfer-provisioning.AC5 — Given a nonexistent `id`, when POST .../it-status is called, then the response is 404 `NOT_FOUND`.
6. it-transfer-provisioning.AC6 — Given no valid token, when either endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
7. it-transfer-provisioning.AC7 — Given a request has had `itStatus: "Pending"` for more than 5 business days with no report, then it is flagged `escalated: true` — `itStatus` is unchanged.
8. it-transfer-provisioning.AC8 — Given requests exist with a mix of `itStatus` values, when GET /api/v1/transfer-requests/pending/it is called, then only `"Pending"` ones are returned.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| it-transfer-provisioning.UT01 | AC1 | Report Done on a Pending item | 200, `itStatus: "Done"` |
| it-transfer-provisioning.UT02 | AC2 | Report status missing/invalid | 400 `VALIDATION_ERROR` |
| it-transfer-provisioning.UT03 | AC3 | Report status on a `"Not Applicable"` item | 409 `INVALID_STATUS_TRANSITION` |
| it-transfer-provisioning.UT04 | AC4 | Call either endpoint as a non-IT Employee | 403 `FORBIDDEN` |
| it-transfer-provisioning.UT05 | AC5 | Report status on a nonexistent request id | 404 `NOT_FOUND` |
| it-transfer-provisioning.UT06 | AC6 | Call either endpoint with no token | 401 `UNAUTHORIZED` |
| it-transfer-provisioning.UT07 | AC7 | Advance a fake clock past 5 business days with no report | `escalated: true` |
| it-transfer-provisioning.UT08 | AC8 | List worklist with Pending/Done/Not Applicable mixed | Only Pending returned |

## Explicitly Out of Scope
- Building or integrating with IT's actual provisioning system (BRD-008, explicit) — this is a status-reporting worklist only.
- Any accept/reject action, or provisioning logic beyond the 5-business-day response window (BRD-008, explicit).
- Defining what triggers IT applicability at all — flagged gap, see above.
- Resolution mechanics for an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
