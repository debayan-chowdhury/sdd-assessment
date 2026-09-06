# Spec: Department CRUD

## Spec ID
department-crud

## Status
In Development

## Linked BRD
.ai-context/BRD_Admin_Panel.md#BRD-002

## Intent
Provide the Admin with full CRUD over Department records (`{id, name, code, isActive}`), including activate/deactivate (soft delete) and, as of the amendment below, a real hard delete, plus management of the Department↔Role mapping — which of the globally-defined Roles (role-crud.spec.md) are enabled for a given Department.

## Context
- Builds on: .ai-context/architecture.md — not yet populated (skeleton only); no section to cite.
- Related: .ai-context/specs/admin/admin-static-login.spec.md (all endpoints below require a valid admin token), .ai-context/specs/admin/location-crud.spec.md (the Location side of the Location↔Department mapping), .ai-context/specs/admin/role-crud.spec.md (Role entity, owned/CRUD'd there — this spec only maps which Roles are enabled per Department), .ai-context/specs/admin/employee-crud-mapping.spec.md (a Department cannot be deactivated or hard-deleted while Employees are mapped to it).

**Amended (2026-09-04, user-directed):** adds a real hard-delete endpoint, per BRD-002's amendment. Blocked while any Employee (active or inactive) still references this Department — `DEPARTMENT_HAS_EMPLOYEES`. On success, this Department's LocationDepartment and DepartmentRole mappings are cascade-removed (they carry no independent meaning once the Department is gone).

## API Contract

### department-crud.API01 — POST /api/v1/departments
**Request payload:**
```json
{ "name": "string", "code": "string" }
```
**Success response (201):**
```json
{ "id": "string", "name": "string", "code": "string", "isActive": true }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `name` or `code` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 409 | `code` already exists on another Department | `{ "error": { "message": "...", "code": "DUPLICATE_CODE" } }` |

*Ratified at Gate 1 (2026-09-03): `code` uniqueness per entity type, though not explicitly stated in BRD-002, is confirmed correct business behavior, consistent with location-crud.spec.md.*

### department-crud.API02 — GET /api/v1/departments
**Request payload:** none (optional query param `isActive=true|false`)
**Success response (200):**
```json
[ { "id": "string", "name": "string", "code": "string", "isActive": true } ]
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### department-crud.API03 — GET /api/v1/departments/:id
**Success response (200):** Department object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Department with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### department-crud.API04 — PUT /api/v1/departments/:id
**Request payload:**
```json
{ "name": "string", "code": "string" }
```
**Success response (200):** updated Department object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `name` or `code` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Department with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `code` already exists on another Department | `{ "error": { "message": "...", "code": "DUPLICATE_CODE" } }` |

### department-crud.API05 — PATCH /api/v1/departments/:id/status
Implements both soft delete (`isActive: false`) and reactivation (`isActive: true`) per BRD-002. See API09 for the separate real hard-delete endpoint.

**Request payload:**
```json
{ "isActive": false }
```
**Success response (200):** updated Department object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Department with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | Setting `isActive: false` while one or more active Employees are mapped to this Department | `{ "error": { "message": "...", "code": "DEPARTMENT_HAS_ACTIVE_EMPLOYEES" } }` |

### department-crud.API06 — POST /api/v1/departments/:id/roles
Enables an existing (global) Role for this Department.

**Request payload:**
```json
{ "roleId": "string" }
```
**Success response (201):**
```json
{ "departmentId": "string", "roleId": "string" }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | Department or Role not found | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | This Department↔Role pairing already exists | `{ "error": { "message": "...", "code": "MAPPING_ALREADY_EXISTS" } }` |

### department-crud.API07 — DELETE /api/v1/departments/:id/roles/:roleId
Disables (removes) a Role from this Department.

**Success response (204):** no content.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | Mapping does not exist | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### department-crud.API08 — GET /api/v1/departments/:id/roles
Lists Roles enabled for this Department.

**Success response (200):**
```json
[ { "id": "string", "name": "string", "code": "string", "isActive": true, "category": "HR | Manager | null" } ]
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | Department not found | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### department-crud.API09 — DELETE /api/v1/departments/:id
Permanently removes the Department record. Cascade-removes its LocationDepartment and DepartmentRole mappings on success. Distinct from API05's soft delete — this is irreversible.

**Success response (204):** no content.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Department with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | One or more Employees (active or inactive) are mapped to this Department | `{ "error": { "message": "...", "code": "DEPARTMENT_HAS_EMPLOYEES" } }` |

## Acceptance Criteria
1. department-crud.AC1 — Given valid `name` and `code`, when POST /api/v1/departments is called, then a Department is created with `isActive: true` and returned with 201.
2. department-crud.AC2 — Given `name` or `code` is missing, when POST /api/v1/departments is called, then the response is 400 `VALIDATION_ERROR`.
3. department-crud.AC3 — Given a Department already exists with the given `code`, when POST /api/v1/departments is called with that same `code`, then the response is 409 `DUPLICATE_CODE`.
4. department-crud.AC4 — Given Departments exist with both statuses, when GET /api/v1/departments is called with no filter, then all Departments are returned regardless of status.
5. department-crud.AC5 — Given Departments exist with both statuses, when GET /api/v1/departments?isActive=true is called, then only active Departments are returned.
6. department-crud.AC6 — Given a Department exists, when GET /api/v1/departments/:id is called with its `id`, then that Department is returned with 200.
7. department-crud.AC7 — Given no Department exists with the given `id`, when GET /api/v1/departments/:id is called, then the response is 404 `NOT_FOUND`.
8. department-crud.AC8 — Given a Department exists, when PUT /api/v1/departments/:id is called with valid new `name`/`code`, then the Department is updated and returned with 200.
9. department-crud.AC9 — Given a Department exists, when PUT /api/v1/departments/:id is called with a `code` already used by a different Department, then the response is 409 `DUPLICATE_CODE`.
10. department-crud.AC10 — Given a Department has no active Employees mapped to it, when PATCH /api/v1/departments/:id/status is called with `isActive: false`, then the Department is deactivated (soft-deleted) and returned with 200.
11. department-crud.AC11 — Given a Department has one or more active Employees mapped to it, when PATCH /api/v1/departments/:id/status is called with `isActive: false`, then the response is 409 `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` and the Department is not deactivated.
12. department-crud.AC12 — Given a deactivated Department, when PATCH /api/v1/departments/:id/status is called with `isActive: true`, then the Department is reactivated and returned with 200.
13. department-crud.AC13 — Given a Department and a Role both exist and are not already mapped, when POST /api/v1/departments/:id/roles is called with that `roleId`, then the mapping is created and returned with 201.
14. department-crud.AC14 — Given a Department and Role are already mapped, when POST /api/v1/departments/:id/roles is called with the same `roleId` again, then the response is 409 `MAPPING_ALREADY_EXISTS`.
15. department-crud.AC15 — Given a Department↔Role mapping exists, when DELETE /api/v1/departments/:id/roles/:roleId is called, then the mapping is removed and 204 is returned.
16. department-crud.AC16 — Given a Department has one or more Roles enabled, when GET /api/v1/departments/:id/roles is called, then those Roles (with their `category`) are returned with 200.
17. department-crud.AC17 — Given no valid admin token is presented, when any endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
18. department-crud.AC18 — Given a Department has no Employees mapped to it (active or inactive), when DELETE /api/v1/departments/:id is called, then the Department and its LocationDepartment/DepartmentRole mappings are permanently removed and 204 is returned.
19. department-crud.AC19 — Given a Department has one or more Employees mapped to it (active or inactive), when DELETE /api/v1/departments/:id is called, then the response is 409 `DEPARTMENT_HAS_EMPLOYEES` and nothing is deleted.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| department-crud.UT01 | AC1 | Create with valid name/code | 201, `isActive: true` |
| department-crud.UT02 | AC2 | Create with missing `name` | 400 `VALIDATION_ERROR` |
| department-crud.UT03 | AC3 | Create with duplicate `code` | 409 `DUPLICATE_CODE` |
| department-crud.UT04 | AC4 | List with no filter | All Departments returned |
| department-crud.UT05 | AC5 | List with `isActive=true` | Only active Departments returned |
| department-crud.UT06 | AC6 | Get existing Department by id | 200, matching Department |
| department-crud.UT07 | AC7 | Get nonexistent id | 404 `NOT_FOUND` |
| department-crud.UT08 | AC8 | Update name/code | 200, updated fields persisted |
| department-crud.UT09 | AC9 | Update to a duplicate code | 409 `DUPLICATE_CODE` |
| department-crud.UT10 | AC10 | Deactivate Department with no mapped Employees | 200, `isActive: false` |
| department-crud.UT11 | AC11 | Deactivate Department with an active mapped Employee | 409 `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` |
| department-crud.UT12 | AC12 | Reactivate a deactivated Department | 200, `isActive: true` |
| department-crud.UT13 | AC13 | Enable an unmapped Role on a Department | 201, mapping created |
| department-crud.UT14 | AC14 | Enable an already-mapped Role again | 409 `MAPPING_ALREADY_EXISTS` |
| department-crud.UT15 | AC15 | Disable an existing Role mapping | 204 |
| department-crud.UT16 | AC16 | List Roles enabled for a Department | 200, mapped Roles with `category` returned |
| department-crud.UT17 | AC17 | Call any endpoint with no token | 401 `UNAUTHORIZED` |
| department-crud.UT18 | AC18 | Delete a Department with no mapped Employees | 204, Department and its mappings gone |
| department-crud.UT19 | AC19 | Delete a Department with an inactive (not just active) mapped Employee | 409 `DEPARTMENT_HAS_EMPLOYEES` |

## Explicitly Out of Scope
- Audit trail / change history for edits (BRD-002).
- Bulk create/import of Departments or Department↔Role mappings.
- Pagination and filtering beyond the `isActive` query param — not specified.
- Creating/editing Role records themselves — see role-crud.spec.md; this spec only toggles which existing Roles are enabled for a Department.

## Non-Functional Constraints (from constitution.md)
- `.ai-context/constitution.md` is currently an unfilled skeleton — no baseline is yet stated to bind against. Flagged gap until `constitution-generation` runs.
