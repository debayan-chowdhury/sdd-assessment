# Spec: Role CRUD

## Spec ID
role-crud

## Status
In Development

## Linked BRD
.ai-context/BRD_Admin_Panel.md#BRD-003

## Intent
Provide the Admin with full CRUD over Role records (`{id, name, code, isActive, category}`), including activate/deactivate (soft delete, never hard delete). Role is a single global list, not scoped per Department (Department↔Role enablement is managed separately — see department-crud.spec.md). `category` is an optional field, one of `HR`, `Manager`, `Payroll`, `IT`, or `Facilities` (or absent/null for a regular Role), and determines whether an Employee holding that Role is treated as a Manager, HR, Payroll, IT, or Facilities contact (see employee-crud-mapping.spec.md and the Internal Transfer journey specs).

## Context
- Builds on: .ai-context/architecture.md (Data Model, Coding Rules & Instructions).
- Related: .ai-context/specs/admin/admin-static-login.spec.md (all endpoints below require a valid admin token), .ai-context/specs/admin/department-crud.spec.md (Department↔Role enablement mapping is exposed there, not here), .ai-context/specs/admin/employee-crud-mapping.spec.md (a Role cannot be deactivated while Employees are mapped to it; `category` drives Manager/HR mapping rules), .ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md, .ai-context/specs/employee-transfer/payroll-transfer-update.spec.md, .ai-context/specs/employee-transfer/it-transfer-provisioning.spec.md, .ai-context/specs/employee-transfer/facilities-transfer-arrangement.spec.md (the `Payroll`/`IT`/`Facilities` categories added in this amendment identify which Employees can act in those roles in the Internal Transfer journey).

**Amended (v1.1, 2026-09-03):** `category` enum extended from `{HR, Manager}` to `{HR, Manager, Payroll, IT, Facilities}`, per `.ai-context/BRD_Employee_Transfer.md`#BRD-005/007/008/009, which requires Payroll, IT, and Facilities to be identifiable Employee roles (the Internal Transfer journey's Receiving HR routes fulfillment work to Employees holding these categories). This is a still-in-flight spec (not yet Released), so the change is made in place per the Case A change-management rule rather than as a new spec. This amendment touches only the enum and its validation; it does not change CRUD mechanics, and downstream code/tests must be updated to match (tracked via task-generation).

**Amended (2026-09-04, user-directed):** adds a real hard-delete endpoint, per BRD-003's amendment. Blocked while any Employee (active or inactive) still holds this Role — `ROLE_HAS_EMPLOYEES`. On success, this Role's DepartmentRole mappings are cascade-removed (they carry no independent meaning once the Role is gone).

## API Contract

### role-crud.API01 — POST /api/v1/roles
**Request payload:**
```json
{ "name": "string", "code": "string", "category": "HR | Manager | Payroll | IT | Facilities | null" }
```
**Success response (201):**
```json
{ "id": "string", "name": "string", "code": "string", "isActive": true, "category": "HR | Manager | Payroll | IT | Facilities | null" }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `name` or `code` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 400 | `category` provided but not one of `HR`, `Manager`, `Payroll`, `IT`, `Facilities`, or omitted/null | `{ "error": { "message": "...", "code": "INVALID_CATEGORY" } }` |
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 409 | `code` already exists on another Role | `{ "error": { "message": "...", "code": "DUPLICATE_CODE" } }` |

*Ratified at Gate 1 (2026-09-03): `code` uniqueness per entity type, though not explicitly stated in BRD-003, is confirmed correct business behavior, consistent with location-crud.spec.md and department-crud.spec.md.*

### role-crud.API02 — GET /api/v1/roles
**Request payload:** none (optional query params `isActive=true|false`, `category=HR|Manager|Payroll|IT|Facilities`)
**Success response (200):**
```json
[ { "id": "string", "name": "string", "code": "string", "isActive": true, "category": "HR | Manager | Payroll | IT | Facilities | null" } ]
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### role-crud.API03 — GET /api/v1/roles/:id
**Success response (200):** Role object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Role with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### role-crud.API04 — PUT /api/v1/roles/:id
**Request payload:**
```json
{ "name": "string", "code": "string", "category": "HR | Manager | Payroll | IT | Facilities | null" }
```
**Success response (200):** updated Role object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `name` or `code` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 400 | `category` provided but not one of `HR`, `Manager`, `Payroll`, `IT`, `Facilities`, or omitted/null | `{ "error": { "message": "...", "code": "INVALID_CATEGORY" } }` |
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Role with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `code` already exists on another Role | `{ "error": { "message": "...", "code": "DUPLICATE_CODE" } }` |

### role-crud.API05 — PATCH /api/v1/roles/:id/status
Implements both soft delete (`isActive: false`) and reactivation (`isActive: true`) per BRD-003. See API06 for the separate real hard-delete endpoint.

**Request payload:**
```json
{ "isActive": false }
```
**Success response (200):** updated Role object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Role with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | Setting `isActive: false` while one or more active Employees hold this Role | `{ "error": { "message": "...", "code": "ROLE_HAS_ACTIVE_EMPLOYEES" } }` |

### role-crud.API06 — DELETE /api/v1/roles/:id
Permanently removes the Role record. Cascade-removes its DepartmentRole mappings on success. Distinct from API05's soft delete — this is irreversible.

**Success response (204):** no content.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Role with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | One or more Employees (active or inactive) hold this Role | `{ "error": { "message": "...", "code": "ROLE_HAS_EMPLOYEES" } }` |

## Acceptance Criteria
1. role-crud.AC1 — Given valid `name` and `code` with no `category`, when POST /api/v1/roles is called, then a Role is created with `isActive: true`, `category: null`, and returned with 201.
2. role-crud.AC2 — Given valid `name`, `code`, and `category: "Manager"`, when POST /api/v1/roles is called, then a Role is created with `category: "Manager"` and returned with 201.
3. role-crud.AC3 — Given valid `name`, `code`, and `category: "HR"`, when POST /api/v1/roles is called, then a Role is created with `category: "HR"` and returned with 201.
4. role-crud.AC4 — Given `category` is provided as a value other than `HR`, `Manager`, `Payroll`, `IT`, `Facilities`, or null, when POST /api/v1/roles is called, then the response is 400 `INVALID_CATEGORY`.
5. role-crud.AC5 — Given `name` or `code` is missing, when POST /api/v1/roles is called, then the response is 400 `VALIDATION_ERROR`.
6. role-crud.AC6 — Given a Role already exists with the given `code`, when POST /api/v1/roles is called with that same `code`, then the response is 409 `DUPLICATE_CODE`.
7. role-crud.AC7 — Given Roles exist with various statuses, when GET /api/v1/roles is called with no filter, then all Roles are returned regardless of status.
8. role-crud.AC8 — Given Roles exist with both statuses, when GET /api/v1/roles?isActive=true is called, then only active Roles are returned.
9. role-crud.AC9 — Given Roles exist with different categories, when GET /api/v1/roles?category=HR is called, then only Roles with `category: "HR"` are returned.
10. role-crud.AC10 — Given a Role exists, when GET /api/v1/roles/:id is called with its `id`, then that Role is returned with 200.
11. role-crud.AC11 — Given no Role exists with the given `id`, when GET /api/v1/roles/:id is called, then the response is 404 `NOT_FOUND`.
12. role-crud.AC12 — Given a Role exists, when PUT /api/v1/roles/:id is called with valid new `name`/`code`/`category`, then the Role is updated and returned with 200.
13. role-crud.AC13 — Given a Role exists, when PUT /api/v1/roles/:id is called with a `code` already used by a different Role, then the response is 409 `DUPLICATE_CODE`.
14. role-crud.AC14 — Given a Role has no active Employees holding it, when PATCH /api/v1/roles/:id/status is called with `isActive: false`, then the Role is deactivated (soft-deleted) and returned with 200.
15. role-crud.AC15 — Given a Role has one or more active Employees holding it, when PATCH /api/v1/roles/:id/status is called with `isActive: false`, then the response is 409 `ROLE_HAS_ACTIVE_EMPLOYEES` and the Role is not deactivated.
16. role-crud.AC16 — Given a deactivated Role, when PATCH /api/v1/roles/:id/status is called with `isActive: true`, then the Role is reactivated and returned with 200.
17. role-crud.AC17 — Given no valid admin token is presented, when any endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
18. role-crud.AC18 — Given valid `name`, `code`, and `category` set to `Payroll`, `IT`, or `Facilities`, when POST /api/v1/roles is called, then a Role is created with that `category` and returned with 201.
19. role-crud.AC19 — Given a Role has no Employees holding it (active or inactive), when DELETE /api/v1/roles/:id is called, then the Role and its DepartmentRole mappings are permanently removed and 204 is returned.
20. role-crud.AC20 — Given a Role has one or more Employees holding it (active or inactive), when DELETE /api/v1/roles/:id is called, then the response is 409 `ROLE_HAS_EMPLOYEES` and nothing is deleted.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| role-crud.UT01 | AC1 | Create with no category | 201, `category: null` |
| role-crud.UT02 | AC2 | Create with `category: "Manager"` | 201, `category: "Manager"` |
| role-crud.UT03 | AC3 | Create with `category: "HR"` | 201, `category: "HR"` |
| role-crud.UT04 | AC4 | Create with `category: "Admin"` (invalid) | 400 `INVALID_CATEGORY` |
| role-crud.UT18 | AC18 | Create with `category: "Payroll"`, then `"IT"`, then `"Facilities"` | 201 for each, `category` persisted |
| role-crud.UT05 | AC5 | Create with missing `code` | 400 `VALIDATION_ERROR` |
| role-crud.UT06 | AC6 | Create with duplicate `code` | 409 `DUPLICATE_CODE` |
| role-crud.UT07 | AC7 | List with no filter | All Roles returned |
| role-crud.UT08 | AC8 | List with `isActive=true` | Only active Roles returned |
| role-crud.UT09 | AC9 | List with `category=HR` | Only HR-category Roles returned |
| role-crud.UT10 | AC10 | Get existing Role by id | 200, matching Role |
| role-crud.UT11 | AC11 | Get nonexistent id | 404 `NOT_FOUND` |
| role-crud.UT12 | AC12 | Update name/code/category | 200, updated fields persisted |
| role-crud.UT13 | AC13 | Update to a duplicate code | 409 `DUPLICATE_CODE` |
| role-crud.UT14 | AC14 | Deactivate Role with no Employees holding it | 200, `isActive: false` |
| role-crud.UT15 | AC15 | Deactivate Role with an active Employee holding it | 409 `ROLE_HAS_ACTIVE_EMPLOYEES` |
| role-crud.UT16 | AC16 | Reactivate a deactivated Role | 200, `isActive: true` |
| role-crud.UT17 | AC17 | Call any endpoint with no token | 401 `UNAUTHORIZED` |
| role-crud.UT19 | AC19 | Delete a Role with no Employees holding it | 204, Role and its mappings gone |
| role-crud.UT20 | AC20 | Delete a Role with an inactive (not just active) Employee holding it | 409 `ROLE_HAS_EMPLOYEES` |

## Explicitly Out of Scope
- Audit trail / change history for edits (BRD-003).
- Bulk create/import of Roles.
- Pagination and filtering beyond the `isActive`/`category` query params — not specified.
- Behavior when a Role's `category` is changed or removed after Employees already hold Manager/HR mappings derived from it — not addressed in BRD-003 or BRD-004. Flagged as an open item, not resolved here (no cascading update/reassignment is implemented by this spec).

## Non-Functional Constraints (from constitution.md)
- Test-first is mandatory for every endpoint in this spec, including the amended `category` validation; minimum 80% line coverage (Testing Discipline).
- Every endpoint sits behind JWT verification (Security Posture) — already satisfied via admin-static-login.spec.md; no new auth decision introduced by this amendment.
- `/api/v1` versioned prefix is retained; the `category` enum extension is additive (existing values unchanged, new values added) and does not require a version bump per the Versioning Rules.
