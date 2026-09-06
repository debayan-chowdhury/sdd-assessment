# Spec: Location CRUD

## Spec ID
location-crud

## Status
In Development

## Linked BRD
.ai-context/BRD_Admin_Panel.md#BRD-001

## Intent
Provide the Admin with full CRUD over Location records (`{id, name, code, isActive}`), including activate/deactivate (soft delete) and, as of the amendment below, a real hard delete, plus management of the Location↔Department mapping — each Location may have multiple Departments mapped to it, each pairing unique, and the same Department may be mapped to many Locations.

## Context
- Builds on: .ai-context/architecture.md — not yet populated (skeleton only); no section to cite.
- Related: .ai-context/specs/admin/admin-static-login.spec.md (all endpoints below require a valid admin token), .ai-context/specs/admin/department-crud.spec.md (the Department side of the mapping), .ai-context/specs/admin/employee-crud-mapping.spec.md (a Location cannot be deactivated or hard-deleted while Employees are mapped to it).

**Amended (2026-09-04, user-directed):** adds a real hard-delete endpoint, per BRD-001's amendment. Blocked while any Employee (active or inactive) still references this Location — `LOCATION_HAS_EMPLOYEES`, deliberately not scoped to active-only like the deactivation guard (AC11), since a hard delete would otherwise leave a dangling reference from an inactive Employee too. On success, this Location's LocationDepartment mappings are cascade-removed (they carry no independent meaning once the Location is gone).

## API Contract

### location-crud.API01 — POST /api/v1/locations
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
| 409 | `code` already exists on another Location | `{ "error": { "message": "...", "code": "DUPLICATE_CODE" } }` |

*Ratified at Gate 1 (2026-09-03): `code` uniqueness per entity type, though not explicitly stated in BRD-001, is confirmed correct business behavior.*

### location-crud.API02 — GET /api/v1/locations
**Request payload:** none (optional query param `isActive=true|false` to filter)
**Success response (200):**
```json
[ { "id": "string", "name": "string", "code": "string", "isActive": true } ]
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### location-crud.API03 — GET /api/v1/locations/:id
**Success response (200):**
```json
{ "id": "string", "name": "string", "code": "string", "isActive": true }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Location with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### location-crud.API04 — PUT /api/v1/locations/:id
**Request payload:**
```json
{ "name": "string", "code": "string" }
```
**Success response (200):** updated Location object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `name` or `code` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Location with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `code` already exists on another Location | `{ "error": { "message": "...", "code": "DUPLICATE_CODE" } }` |

### location-crud.API05 — PATCH /api/v1/locations/:id/status
Implements both soft delete (`isActive: false`) and reactivation (`isActive: true`) per BRD-001. See API09 for the separate real hard-delete endpoint.

**Request payload:**
```json
{ "isActive": false }
```
**Success response (200):** updated Location object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Location with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | Setting `isActive: false` while one or more active Employees are mapped to this Location | `{ "error": { "message": "...", "code": "LOCATION_HAS_ACTIVE_EMPLOYEES" } }` |

### location-crud.API06 — POST /api/v1/locations/:id/departments
Maps an existing Department to this Location.

**Request payload:**
```json
{ "departmentId": "string" }
```
**Success response (201):**
```json
{ "locationId": "string", "departmentId": "string" }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | Location or Department not found | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | This Location↔Department pairing already exists | `{ "error": { "message": "...", "code": "MAPPING_ALREADY_EXISTS" } }` |

### location-crud.API07 — DELETE /api/v1/locations/:id/departments/:departmentId
Removes an existing Location↔Department mapping.

**Success response (204):** no content.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | Mapping does not exist | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### location-crud.API08 — GET /api/v1/locations/:id/departments
Lists Departments mapped to this Location.

**Success response (200):**
```json
[ { "id": "string", "name": "string", "code": "string", "isActive": true } ]
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | Location not found | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### location-crud.API09 — DELETE /api/v1/locations/:id
Permanently removes the Location record. Cascade-removes its LocationDepartment mappings on success. Distinct from API05's soft delete — this is irreversible.

**Success response (204):** no content.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Location with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | One or more Employees (active or inactive) are mapped to this Location | `{ "error": { "message": "...", "code": "LOCATION_HAS_EMPLOYEES" } }` |

## Acceptance Criteria
1. location-crud.AC1 — Given valid `name` and `code`, when POST /api/v1/locations is called, then a Location is created with `isActive: true` and returned with 201.
2. location-crud.AC2 — Given `name` or `code` is missing, when POST /api/v1/locations is called, then the response is 400 `VALIDATION_ERROR`.
3. location-crud.AC3 — Given a Location already exists with the given `code`, when POST /api/v1/locations is called with that same `code`, then the response is 409 `DUPLICATE_CODE`.
4. location-crud.AC4 — Given Locations exist with both `isActive: true` and `isActive: false`, when GET /api/v1/locations is called with no filter, then all Locations are returned regardless of status.
5. location-crud.AC5 — Given Locations exist with both statuses, when GET /api/v1/locations?isActive=true is called, then only active Locations are returned.
6. location-crud.AC6 — Given a Location exists, when GET /api/v1/locations/:id is called with its `id`, then that Location is returned with 200.
7. location-crud.AC7 — Given no Location exists with the given `id`, when GET /api/v1/locations/:id is called, then the response is 404 `NOT_FOUND`.
8. location-crud.AC8 — Given a Location exists, when PUT /api/v1/locations/:id is called with valid new `name`/`code`, then the Location is updated and returned with 200.
9. location-crud.AC9 — Given a Location exists, when PUT /api/v1/locations/:id is called with a `code` already used by a different Location, then the response is 409 `DUPLICATE_CODE`.
10. location-crud.AC10 — Given a Location has no active Employees mapped to it, when PATCH /api/v1/locations/:id/status is called with `isActive: false`, then the Location is deactivated (soft-deleted) and returned with 200.
11. location-crud.AC11 — Given a Location has one or more active Employees mapped to it, when PATCH /api/v1/locations/:id/status is called with `isActive: false`, then the response is 409 `LOCATION_HAS_ACTIVE_EMPLOYEES` and the Location is not deactivated.
12. location-crud.AC12 — Given a deactivated Location, when PATCH /api/v1/locations/:id/status is called with `isActive: true`, then the Location is reactivated and returned with 200.
13. location-crud.AC13 — Given a Location and a Department both exist and are not already mapped, when POST /api/v1/locations/:id/departments is called with that `departmentId`, then the mapping is created and returned with 201.
14. location-crud.AC14 — Given a Location and Department are already mapped, when POST /api/v1/locations/:id/departments is called with the same `departmentId` again, then the response is 409 `MAPPING_ALREADY_EXISTS`.
15. location-crud.AC15 — Given a Location↔Department mapping exists, when DELETE /api/v1/locations/:id/departments/:departmentId is called, then the mapping is removed and 204 is returned.
16. location-crud.AC16 — Given a Location has one or more Departments mapped to it, when GET /api/v1/locations/:id/departments is called, then those Departments are returned with 200.
17. location-crud.AC17 — Given no valid admin token is presented, when any endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
18. location-crud.AC18 — Given a Location has no Employees mapped to it (active or inactive), when DELETE /api/v1/locations/:id is called, then the Location and its LocationDepartment mappings are permanently removed and 204 is returned.
19. location-crud.AC19 — Given a Location has one or more Employees mapped to it (active or inactive), when DELETE /api/v1/locations/:id is called, then the response is 409 `LOCATION_HAS_EMPLOYEES` and nothing is deleted.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| location-crud.UT01 | AC1 | Create with valid name/code | 201, `isActive: true` |
| location-crud.UT02 | AC2 | Create with missing `code` | 400 `VALIDATION_ERROR` |
| location-crud.UT03 | AC3 | Create with duplicate `code` | 409 `DUPLICATE_CODE` |
| location-crud.UT04 | AC4 | List with no filter | All Locations returned |
| location-crud.UT05 | AC5 | List with `isActive=true` | Only active Locations returned |
| location-crud.UT06 | AC6 | Get existing Location by id | 200, matching Location |
| location-crud.UT07 | AC7 | Get nonexistent id | 404 `NOT_FOUND` |
| location-crud.UT08 | AC8 | Update name/code | 200, updated fields persisted |
| location-crud.UT09 | AC9 | Update to a duplicate code | 409 `DUPLICATE_CODE` |
| location-crud.UT10 | AC10 | Deactivate Location with no mapped Employees | 200, `isActive: false` |
| location-crud.UT11 | AC11 | Deactivate Location with an active mapped Employee | 409 `LOCATION_HAS_ACTIVE_EMPLOYEES` |
| location-crud.UT12 | AC12 | Reactivate a deactivated Location | 200, `isActive: true` |
| location-crud.UT13 | AC13 | Map an unmapped Department to a Location | 201, mapping created |
| location-crud.UT14 | AC14 | Map an already-mapped Department again | 409 `MAPPING_ALREADY_EXISTS` |
| location-crud.UT15 | AC15 | Unmap an existing mapping | 204 |
| location-crud.UT16 | AC16 | List Departments for a Location with mappings | 200, mapped Departments returned |
| location-crud.UT17 | AC17 | Call any endpoint with no token | 401 `UNAUTHORIZED` |
| location-crud.UT18 | AC18 | Delete a Location with no mapped Employees | 204, Location and its LocationDepartment mappings gone |
| location-crud.UT19 | AC19 | Delete a Location with an inactive (not just active) mapped Employee | 409 `LOCATION_HAS_EMPLOYEES` |

## Explicitly Out of Scope
- Audit trail / change history for edits (BRD-001).
- Bulk create/import of Locations or Location↔Department mappings.
- Pagination and filtering beyond the `isActive` query param — not specified.

## Non-Functional Constraints (from constitution.md)
- `.ai-context/constitution.md` is currently an unfilled skeleton — no baseline is yet stated to bind against. Flagged gap until `constitution-generation` runs.
