# Spec: Transfer Request Option Lists

## Spec ID
transfer-options

## Status
Released (implemented 2026-09-04, retroactively documented — see `.ai-context/tasks/employee-transfer/transfer-options.tasks.md`). Note: like transfer-request-submission.spec.md, this skipped Gate 1 peer review, plan review, and task review by explicit user direction; Status reflects actual code state, not that those gates were run.

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-002 — supporting infrastructure, not a BRD-stated requirement itself. BRD-002 says the Employee "captures new department/business unit, new location, new role/position" but never specifies how valid options are presented; this spec fills that gap.

## Intent
Give a logged-in Employee three read-only endpoints to populate the "new request" form's Location, Department, and Role selectors from transfer-request-submission.spec.md (AC1/AC2's "valid target Location/Department/Role"). Locations are a flat active-only list. Roles are active-only, and further restricted to `category: null` (see amendment below). Departments are filtered by a given Location to only those actually staffed with a Receiving HR and at least one candidate Receiving Manager — the two conditions transfer-request-submission.AC7 (`NO_RECEIVING_HR`) and receiving-manager-transfer-approval.spec.md's candidate-manager selection already require downstream — so the form never offers a Location+Department combination that submission or receiving-HR gatekeeping would immediately reject or stall on.

**Amendment (Roles restricted to `category: null`):** Per product decision, an Employee can only self-service transfer into a regular (`category: null`) Role — Manager/HR/IT/Payroll/Facilities are functional categories assigned by an Admin, not something an Employee selects for themselves via this form. `GET /api/v1/options/roles` now excludes them, and `transfer-request-submission.spec.md`'s submission endpoint independently rejects `newRoleId`s holding any of those categories (`400 ROLE_CATEGORY_NOT_ALLOWED`) as defense in depth.

## Context
- Builds on: .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (every endpoint here requires a valid Employee token, not an Admin token).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (the consumer; owns `resolveReceivingHr`, reused here), .ai-context/specs/employee-transfer/receiving-manager-transfer-approval.spec.md (owns `findCandidateManagers`, the Manager-category staffing signal reused here), .ai-context/specs/admin/location-crud.spec.md, .ai-context/specs/admin/department-crud.spec.md, .ai-context/specs/admin/role-crud.spec.md, .ai-context/specs/admin/employee-crud-mapping.spec.md (own the underlying Location/Department/Role/Employee records; this spec only adds read-only, Employee-scoped views over them).

**Flagged gap — why this spec exists at all:** the Admin Panel already exposes `GET /api/v1/locations`, `/departments`, `/roles` (location-crud.spec.md, department-crud.spec.md, role-crud.spec.md), but all three sit behind `adminAuth`, not `employeeAuth` — an Employee's own token cannot call them. The Admin Panel also has a Location↔Department mapping (`LocationDepartment`, via location-crud.spec.md's `POST/GET /locations/:id/departments`), which would have been the natural source for the Department filter, but in practice this mapping is never populated by any admin workflow observed in this environment — it exists as a feature with no data behind it. This spec's Department filter therefore derives "which Departments are usable at a Location" from Employee staffing (who is actually assigned there) rather than from the unused mapping table, per explicit user direction.

## API Contract

### transfer-options.API01 — GET /api/v1/options/locations
**Request payload:** none.
**Success response (200):** array of `{ "_id": "string", "name": "string", "code": "string", "isActive": true, "createdAt": "string", "updatedAt": "string" }`, active Locations only, sorted by `name` ascending.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### transfer-options.API02 — GET /api/v1/options/departments?locationId=:locationId
**Request payload:** none. `locationId` is a required query parameter.
**Success response (200):** array of Department objects (same shape as API01's Locations), restricted to active Departments that have, at `locationId`: at least one active HR-category Employee (per `resolveReceivingHr`) **and** at least one active Manager-category Employee (per `findCandidateManagers`). Sorted by `name` ascending.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `locationId` query parameter missing | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### transfer-options.API03 — GET /api/v1/options/roles
**Request payload:** none.
**Success response (200):** array of `{ "_id": "string", "name": "string", "code": "string", "isActive": true, "category": null, "createdAt": "string", "updatedAt": "string" }` — active Roles with `category: null` only (Manager/HR/IT/Payroll/Facilities Roles are excluded, see amendment above), sorted by `name` ascending. Not filtered by Location or Department — Department-enablement is auto-created at submit time (transfer-request-submission.spec.md's amendment), not pre-filtered here.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

## Acceptance Criteria
1. transfer-options.AC1 — Given active and inactive Locations exist, when GET /api/v1/options/locations is called with a valid Employee token, then only active Locations are returned, sorted by name.
2. transfer-options.AC2 — Given no `locationId` query parameter, when GET /api/v1/options/departments is called, then the response is 400 `VALIDATION_ERROR`.
3. transfer-options.AC3 — Given a Location with a Department that has both an active HR-category and an active Manager-category Employee, when GET /api/v1/options/departments?locationId=... is called, then that Department is included in the response.
4. transfer-options.AC4 — Given a Location with a Department that has only an active HR-category Employee (no Manager-category Employee), when GET /api/v1/options/departments?locationId=... is called, then that Department is excluded from the response.
5. transfer-options.AC5 — Given a Department that would otherwise qualify (AC3) but is itself inactive, when GET /api/v1/options/departments?locationId=... is called, then that Department is excluded from the response.
6. transfer-options.AC6 — Given an inactive Employee holding an HR-category or Manager-category Role at a Location+Department, when GET /api/v1/options/departments?locationId=... is called, then that Employee does not count toward the Department qualifying.
7. transfer-options.AC7 — Given active Roles exist with a mix of `category` values (including `null`), when GET /api/v1/options/roles is called with a valid Employee token, then only active Roles with `category: null` are returned, sorted by name, regardless of any Location or Department.
8. transfer-options.AC8 — Given no valid Employee token, when any of the three endpoints is called, then the response is 401 `UNAUTHORIZED`.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| transfer-options.UT01 | AC1 | One active + one inactive Location | Only the active one returned |
| transfer-options.UT02 | AC2 | GET /options/departments with no `locationId` | 400 `VALIDATION_ERROR` |
| transfer-options.UT03 | AC3 | Department with HR + Manager Employee at the Location | Department included |
| transfer-options.UT04 | AC4 | Department with only an HR Employee at the Location | Department excluded |
| transfer-options.UT05 | AC5 | Otherwise-qualifying Department marked inactive | Department excluded |
| transfer-options.UT06 | AC6 | Qualifying Manager Employee marked `isActive: false` | Department excluded |
| transfer-options.UT07 | AC7 | Roles with categories null/Manager/HR/IT/Payroll/Facilities, all active | Only the `category: null` one returned |
| transfer-options.UT08 | AC8 | Any of the three endpoints, no token | 401 `UNAUTHORIZED` |

## Explicitly Out of Scope
- Writing/managing Locations, Departments, Roles, or their mappings — that's the Admin Panel's `location-crud`/`department-crud`/`role-crud` specs; this spec is read-only.
- Populating or otherwise using the Admin Panel's `LocationDepartment` mapping table — flagged above as unused in this environment; this spec derives Department availability from Employee staffing instead.
- Filtering Roles by Location or Department — Department-enablement is auto-created at submit time (transfer-request-submission.spec.md's amendment), not pre-filtered here.
- Any option list beyond Location/Department/Role for this journey's form (e.g. no options endpoint for Employee-picking, which no part of BRD-002's submission step requires).

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture), same as transfer-request-submission.spec.md.
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
- `/api/v1` versioned prefix (Versioning Rules) — new surface area, not a breaking change.
