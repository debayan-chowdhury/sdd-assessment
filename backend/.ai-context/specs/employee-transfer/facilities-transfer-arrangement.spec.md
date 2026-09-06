# Spec: Facilities Transfer Arrangement

## Spec ID
facilities-transfer-arrangement

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-009

## Intent
Let any Employee holding a Facilities-category Role see the worklist of transfer requests waiting on a new physical workspace arrangement and report back `Done`, within a 5-business-day window of being triggered — applicable only when the transfer changes Location.

**Amendment (Need Information removed):** same removal as payroll-transfer-update.spec.md and it-transfer-provisioning.spec.md — the report/reply "Need Information" mechanism is gone. Facilities now only ever reports `"Done"`. `facilitiesStatus` values are just `Pending | Done | Not Applicable | null`.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity this spec reads/updates), .ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md (sets `facilitiesStatus` to `"Pending"` or `"Not Applicable"` at trigger time, based on whether Location changed), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token), .ai-context/specs/admin/role-crud.spec.md (the `Facilities` category this spec's caller must hold), .ai-context/specs/employee-transfer/payroll-transfer-update.spec.md and .ai-context/specs/employee-transfer/it-transfer-provisioning.spec.md (identical mechanics — read together).

**Flagged assumption — org-wide scope:** same reasoning as the other two fulfillment specs: Facilities is treated as a department-agnostic function, not scoped to the request's Location/Department.

**Applicability — the one condition this system can compute:** unlike Payroll/IT, BRD-009's condition ("only when location changes") is directly derivable by receiving-hr-transfer-gatekeeping.spec.md at trigger time by comparing `currentLocationId` and `newLocationId`. This spec never receives a `facilitiesStatus: "Pending"` item for a request where the location didn't change — those are `"Not Applicable"` from the start and never appear in this spec's worklist.

## API Contract

### facilities-transfer-arrangement.API01 — GET /api/v1/transfer-requests/pending/facilities
**Success response (200):** array of `TransferRequest` objects where `facilitiesStatus` is `"Pending"`.
**Exceptions:** `401 UNAUTHORIZED`, `403 FORBIDDEN` (caller does not hold a `Facilities`-category Role).

### facilities-transfer-arrangement.API02 — POST /api/v1/transfer-requests/:id/facilities-status
**Request payload:**
```json
{ "status": "Done" }
```

**Success response (200):** updated `TransferRequest` with `facilitiesStatus` set to `"Done"`.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `status` missing or not `"Done"` | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller does not hold a `Facilities`-category Role | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `facilitiesStatus` is not `"Pending"` (e.g. `"Not Applicable"` — the request's location didn't change) | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

## Acceptance Criteria
1. facilities-transfer-arrangement.AC1 — Given a request with `facilitiesStatus: "Pending"`, when POST .../facilities-status is called by a Facilities-category Employee with `status: "Done"`, then `facilitiesStatus` becomes `"Done"` and the response is 200.
2. facilities-transfer-arrangement.AC2 — Given `status` missing or not `"Done"`, when POST .../facilities-status is called, then the response is 400 `VALIDATION_ERROR`.
3. facilities-transfer-arrangement.AC3 — Given a request with `facilitiesStatus: "Not Applicable"` (location unchanged) or `"Done"`, when POST .../facilities-status is called, then the response is 409 `INVALID_STATUS_TRANSITION`.
4. facilities-transfer-arrangement.AC4 — Given the caller does not hold a `Facilities`-category Role, when either endpoint in this spec is called, then the response is 403 `FORBIDDEN`.
5. facilities-transfer-arrangement.AC5 — Given a nonexistent `id`, when POST .../facilities-status is called, then the response is 404 `NOT_FOUND`.
6. facilities-transfer-arrangement.AC6 — Given no valid token, when either endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
7. facilities-transfer-arrangement.AC7 — Given a request has had `facilitiesStatus: "Pending"` for more than 5 business days with no report, then it is flagged `escalated: true` — `facilitiesStatus` is unchanged.
8. facilities-transfer-arrangement.AC8 — Given requests exist with a mix of `facilitiesStatus` values, when GET /api/v1/transfer-requests/pending/facilities is called, then only `"Pending"` ones are returned — a request whose location didn't change never appears.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| facilities-transfer-arrangement.UT01 | AC1 | Report Done on a Pending item | 200, `facilitiesStatus: "Done"` |
| facilities-transfer-arrangement.UT02 | AC2 | Report status missing/invalid | 400 `VALIDATION_ERROR` |
| facilities-transfer-arrangement.UT03 | AC3 | Report status on a `"Not Applicable"` item (location unchanged) | 409 `INVALID_STATUS_TRANSITION` |
| facilities-transfer-arrangement.UT04 | AC4 | Call either endpoint as a non-Facilities Employee | 403 `FORBIDDEN` |
| facilities-transfer-arrangement.UT05 | AC5 | Report status on a nonexistent request id | 404 `NOT_FOUND` |
| facilities-transfer-arrangement.UT06 | AC6 | Call either endpoint with no token | 401 `UNAUTHORIZED` |
| facilities-transfer-arrangement.UT07 | AC7 | Advance a fake clock past 5 business days with no report | `escalated: true` |
| facilities-transfer-arrangement.UT08 | AC8 | List worklist including a location-unchanged (`Not Applicable`) request | That request excluded |

## Explicitly Out of Scope
- Building or integrating with Facilities' actual workspace-management system (BRD-009, explicit) — this is a status-reporting worklist only.
- Any accept/reject action, or arrangement logic beyond the 5-business-day response window (BRD-009, explicit).
- Resolution mechanics for an escalated item — flag-only, consistent with every other spec in this journey.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
