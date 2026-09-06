# Spec: Employee CRUD and Manager/HR Mapping

## Spec ID
employee-crud-mapping

## Status
In Development

## Linked BRD
.ai-context/BRD_Admin_Panel.md#BRD-004

## Intent
Provide the Admin with full CRUD over Employee records (`{id, name, email, isActive, mustChangePassword}`), each mapped to exactly one active Location+Department+Role combination, plus Manager and/or HR mapping to other Employees, per the rules driven by the mapped Employee's own Role `category` (see role-crud.spec.md). On creation, the Admin also directly sets the Employee's initial portal login password (see the v1.3 amendment below and portal-login-password-change.spec.md).

## Context
- Builds on: .ai-context/architecture.md (Data Model, Security Posture pointer under Coding Rules & Instructions).
- Related: .ai-context/specs/admin/admin-static-login.spec.md (all endpoints below require a valid admin token), .ai-context/specs/admin/location-crud.spec.md, .ai-context/specs/admin/department-crud.spec.md, .ai-context/specs/admin/role-crud.spec.md (an Employee's Location/Department/Role mapping must reference existing, active records; Department↔Role enablement (department-crud.API08) is **not** enforced here as of the v1.4 amendment below), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (consumes the credentials provisioned here).

**Resolved at Gate 1 — `isActive` vs. soft delete:** BRD-004 originally decided that Employee "soft delete" (treated as not existing) is a *distinct* concept from the Employee "Active/Inactive" status (which blocks portal login), implying two separate states. The shape used for this spec, `{id, name, code, isActive}`, mirrors the other three admin-panel entities and provides only one status field. Ratified at Gate 1 (2026-09-03): `isActive` means soft-delete/existence only, consistent with Location/Department/Role. **Superseded by the v1.2 amendment below** — BRD-004's "Inactive blocks login" behavior now has a real effect, since employee-facing login exists as of `.ai-context/BRD_Employee_Transfer.md`#BRD-001: an Employee with `isActive: false` is rejected at login (see portal-login-password-change.spec.md).

**Amended (v1.2, 2026-09-03):** Adds portal login credentials to the Employee record, per `.ai-context/BRD_Employee_Transfer.md`#BRD-001 ("the Admin Panel...sets a default password when creating any employee record"). Design decisions made to fill gaps the BRD leaves open:
- **Username = existing `code` field.** BRD-001 doesn't introduce a separate username; `code` is already unique per Employee, so it is reused rather than adding a redundant identifier.
- **Password storage:** a `passwordHash` field (bcrypt) is added to the Employee schema. `passwordHash` is never included in any API response body, at any endpoint, at any time (Security Posture — credentials never appear in logs or responses).
- **Default password delivery:** no notification/email system exists anywhere in this project (architecture.md's Integration Points lists none). Since the Admin has no other channel to hand the employee their default password, the system generates one at creation time and returns it once, in the POST /api/v1/employees response only, as `temporaryPassword` — never persisted in plaintext, never returned again on any subsequent GET. The Admin is responsible for relaying it to the employee out-of-band. This is a flagged assumption, not a BRD-stated mechanism — revisit if a notification channel is added later.
- **Forced change:** `mustChangePassword: true` is set at creation, matching BRD-001 ("required on first login"), and is cleared by portal-login-password-change.spec.md's password-change endpoint.
- This is a still-in-flight spec (not yet Released), so the change is made in place per the Case A change-management rule. Downstream code/tests must be updated to match (tracked via task-generation).

**Amended (v1.3, 2026-09-04):** User-directed change: `code` is removed from the Employee identity model; `email` replaces it as both the unique business identifier and the portal login identifier. The Admin now supplies the Employee's initial password directly in the create request, rather than the system generating one — this reverses the v1.2 `temporaryPassword` mechanism, which existed only because the BRD didn't specify who sets the password; now that the Admin sets it explicitly, there is no delivery-channel gap to solve, and `temporaryPassword` is removed from the API entirely.
- **Portal login field renamed accordingly** — portal-login-password-change.spec.md's `username` field is renamed to `email` (see that spec's own v1.1 amendment).
- **Breaking change, not versioned:** removing `code`, renaming the create/update request shape, and dropping `temporaryPassword` from the response are all breaking per constitution.md's Versioning Rules (a removed/renamed field normally requires a new `/api/v2` prefix). No version bump is made here because — per constitution.md's own Versioning Rules note — there are no external consumers of this API today; this spec has never left `In Development`. Revisit this reasoning the moment a real external consumer exists.
- This is again a Case A in-place edit (still not Released).

**Amended (2026-09-04, user-directed):** adds a real hard-delete endpoint, per BRD-004's amendment. Blocked while any *other* Employee still references this one as `managerId` or `hrId` — `EMPLOYEE_HAS_DEPENDENTS` — since deleting it would otherwise leave that mapping dangling. No cascade/reassignment is attempted (matching the pre-existing, still-unresolved deferral on this exact scenario for deactivation). Behavior when a hard-deleted Employee is referenced by an Internal Transfer request (`TransferRequest.employeeId`/`currentManagerId`/`currentHrId`/`receivingHrId`/`receivingManagerId`) is explicitly not checked by this guard — flagged gap, not resolved here; out of the requested scope (Admin Panel CRUD only).

**Amended (v1.4, 2026-09-04, user-directed):** removes the Department↔Role enablement check (`ROLE_NOT_ENABLED_FOR_DEPARTMENT`, formerly AC11/UT11) from POST/PUT `/api/v1/employees`. Root cause: after a full data reset, no `DepartmentRole` enablement mappings existed for any Department, leaving the Admin Panel's Role selector empty for every Employee creation attempt. User-directed resolution: Role and Department carry **no relation** in the Employee mapping — any active Role may be assigned to an Employee in any Department, regardless of `DepartmentRole` enablement. The Department↔Role "Enable/Disable Role" feature itself (department-crud.API08, the mapping panel in both the backend and admin UI) is **not removed** — it continues to exist and function on the Department detail screen — it is simply no longer consulted by Employee create/update. AC11/UT11 are marked removed below rather than renumbered, to avoid churning every other AC/UT/task cross-reference in this still-`In Development` spec; no other AC or UT changes meaning. The equivalent check in `transfer-request-submission.spec.md` (AC5/UT05, a separate, independently-implemented check in `transferRequest.controller.js` — not shared code) is explicitly **not** touched by this amendment; that is a different feature (the employee-facing Internal Transfer journey) outside the Admin Panel CRUD scope this change was requested for.

## API Contract

### employee-crud-mapping.API01 — POST /api/v1/employees
**Request payload:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "locationId": "string",
  "departmentId": "string",
  "roleId": "string",
  "managerId": "string | null",
  "hrId": "string | null"
}
```
**Success response (201):**
```json
{
  "id": "string", "name": "string", "email": "string", "isActive": true,
  "locationId": "string", "departmentId": "string", "roleId": "string",
  "managerId": "string | null", "hrId": "string | null",
  "mustChangePassword": true
}
```
`password` is set by the Admin, hashed (bcrypt) before storage, and never echoed back in this or any response. `passwordHash` is never included in any response, ever.

**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `name`, `email`, `password`, `locationId`, `departmentId`, or `roleId` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | `locationId`, `departmentId`, or `roleId` does not reference an existing record | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `email` already exists on another Employee | `{ "error": { "message": "...", "code": "DUPLICATE_EMAIL" } }` |
| 400 | Role `category` is `null` (regular Employee) and `managerId` is missing | `{ "error": { "message": "...", "code": "MANAGER_REQUIRED" } }` |
| 400 | Role `category` is `null` or `Manager` and `hrId` is missing | `{ "error": { "message": "...", "code": "HR_REQUIRED" } }` |
| 400 | Role `category` is `HR` and `managerId` and/or `hrId` is provided | `{ "error": { "message": "...", "code": "MAPPING_NOT_ALLOWED" } }` |
| 404 | `managerId` does not reference an existing Employee | `{ "error": { "message": "...", "code": "MANAGER_NOT_FOUND" } }` |
| 404 | `hrId` does not reference an existing Employee | `{ "error": { "message": "...", "code": "HR_NOT_FOUND" } }` |
| 400 | The Employee referenced by `managerId` does not hold a Role with `category: "Manager"` | `{ "error": { "message": "...", "code": "INVALID_MANAGER_ROLE" } }` |
| 400 | The Employee referenced by `hrId` does not hold a Role with `category: "HR"` | `{ "error": { "message": "...", "code": "INVALID_HR_ROLE" } }` |
| 400 | The referenced `managerId`/`hrId` Employee is not in the same Location+Department as the Employee being created | `{ "error": { "message": "...", "code": "MAPPING_SCOPE_MISMATCH" } }` |

### employee-crud-mapping.API02 — GET /api/v1/employees
**Request payload:** none (optional query params `isActive`, `locationId`, `departmentId`, `roleId`)
**Success response (200):** array of Employee objects, in the GET shape (API01's response shape).
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### employee-crud-mapping.API03 — GET /api/v1/employees/:id
**Success response (200):** Employee object, in the GET shape (API01's response shape).
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Employee with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### employee-crud-mapping.API04 — PUT /api/v1/employees/:id
**Request payload:** `{ name, email, locationId, departmentId, roleId, managerId, hrId }` — no `password` field; this endpoint never touches credentials.
**Success response (200):** updated Employee object, in the GET shape. All validation and mapping rules from API01 apply identically on update.
**Exceptions:** same set as API01 (excluding any password-related ones, since none exist), plus:

| Code | Condition | Response body |
|---|---|---|
| 404 | No Employee with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### employee-crud-mapping.API05 — PATCH /api/v1/employees/:id/status
Implements both soft delete (`isActive: false`) and reactivation (`isActive: true`) per BRD-004. See API06 for the separate real hard-delete endpoint.

**Request payload:**
```json
{ "isActive": false }
```
**Success response (200):** updated Employee object.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Employee with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |

### employee-crud-mapping.API06 — DELETE /api/v1/employees/:id
Permanently removes the Employee record. Distinct from API05's soft delete — this is irreversible.

**Success response (204):** no content.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid admin token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 404 | No Employee with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | One or more other Employees reference this one as `managerId` or `hrId` | `{ "error": { "message": "...", "code": "EMPLOYEE_HAS_DEPENDENTS" } }` |

## Acceptance Criteria
1. employee-crud-mapping.AC1 — Given a regular Employee (Role `category: null`) with a valid `managerId` and `hrId` both in the same Location+Department, when POST /api/v1/employees is called, then the Employee is created with 201 and both mappings persisted.
2. employee-crud-mapping.AC2 — Given a Manager-category Employee with a valid `hrId` in the same Location+Department and no `managerId`, when POST /api/v1/employees is called, then the Employee is created with 201, `hrId` set and `managerId: null`.
3. employee-crud-mapping.AC3 — Given an HR-category Employee with no `managerId` and no `hrId` provided, when POST /api/v1/employees is called, then the Employee is created with 201, `managerId: null`, `hrId: null`.
4. employee-crud-mapping.AC4 — Given a regular Employee (Role `category: null`) with `managerId` omitted, when POST /api/v1/employees is called, then the response is 400 `MANAGER_REQUIRED`.
5. employee-crud-mapping.AC5 — Given a regular or Manager-category Employee with `hrId` omitted, when POST /api/v1/employees is called, then the response is 400 `HR_REQUIRED`.
6. employee-crud-mapping.AC6 — Given an HR-category Employee with a `managerId` or `hrId` provided, when POST /api/v1/employees is called, then the response is 400 `MAPPING_NOT_ALLOWED`.
7. employee-crud-mapping.AC7 — Given a `managerId` or `hrId` that does not reference an existing Employee, when POST /api/v1/employees is called, then the response is 404 `MANAGER_NOT_FOUND` or `HR_NOT_FOUND` respectively, matching which field failed to resolve.
8. employee-crud-mapping.AC8 — Given a `managerId` referencing an Employee whose Role `category` is not `Manager`, when POST /api/v1/employees is called, then the response is 400 `INVALID_MANAGER_ROLE`.
9. employee-crud-mapping.AC9 — Given an `hrId` referencing an Employee whose Role `category` is not `HR`, when POST /api/v1/employees is called, then the response is 400 `INVALID_HR_ROLE`.
10. employee-crud-mapping.AC10 — Given a `managerId` or `hrId` referencing an Employee in a different Location or Department than the Employee being created, when POST /api/v1/employees is called, then the response is 400 `MAPPING_SCOPE_MISMATCH`.
11. ~~employee-crud-mapping.AC11~~ — **Removed (v1.4, 2026-09-04):** formerly "given `roleId` is not enabled for `departmentId`, 409 `ROLE_NOT_ENABLED_FOR_DEPARTMENT`." Role and Department now carry no relation in this spec; see the v1.4 amendment note above. Number retained as a gap, not reused.
12. employee-crud-mapping.AC12 — Given required fields are valid, when POST /api/v1/employees is called with an `email` already used by another Employee, then the response is 409 `DUPLICATE_EMAIL`.
13. employee-crud-mapping.AC13 — Given Employees exist across Locations/Departments/Roles, when GET /api/v1/employees is called with a combination of `locationId`/`departmentId`/`roleId`/`isActive` filters, then only matching Employees are returned.
14. employee-crud-mapping.AC14 — Given an Employee exists, when GET /api/v1/employees/:id is called, then that Employee is returned with 200; given no Employee exists with that `id`, the response is 404 `NOT_FOUND`.
15. employee-crud-mapping.AC15 — Given an Employee exists, when PUT /api/v1/employees/:id is called with a valid new mapping, then the Employee is updated and returned with 200, subject to the same validation as AC1–AC10 and AC12 (AC11 removed, v1.4).
16. employee-crud-mapping.AC16 — Given an Employee exists, when PATCH /api/v1/employees/:id/status is called with `isActive: false`, then the Employee is soft-deleted and returned with 200.
17. employee-crud-mapping.AC17 — Given a soft-deleted Employee, when PATCH /api/v1/employees/:id/status is called with `isActive: true`, then the Employee is reactivated and returned with 200.
18. employee-crud-mapping.AC18 — Given no valid admin token is presented, when any endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
19. employee-crud-mapping.AC19 — Given a valid Employee-creation payload including an Admin-chosen `password`, when POST /api/v1/employees is called, then the response includes `mustChangePassword: true`, and the Employee's stored credential is a bcrypt hash of the supplied `password`, never the plaintext value.
20. employee-crud-mapping.AC20 — Given any Employee record, when it is returned by any endpoint in this spec (POST, GET list, GET by id, PUT), then the response body never includes a `passwordHash` field.
21. employee-crud-mapping.AC21 — Given an Employee is not referenced as any other Employee's `managerId` or `hrId`, when DELETE /api/v1/employees/:id is called, then the Employee is permanently removed and 204 is returned.
22. employee-crud-mapping.AC22 — Given an Employee is referenced as another Employee's `managerId` or `hrId`, when DELETE /api/v1/employees/:id is called, then the response is 409 `EMPLOYEE_HAS_DEPENDENTS` and nothing is deleted.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| employee-crud-mapping.UT01 | AC1 | Create regular Employee with valid manager + HR in scope | 201, both mappings set |
| employee-crud-mapping.UT02 | AC2 | Create Manager-category Employee with valid HR, no manager | 201, `managerId: null` |
| employee-crud-mapping.UT03 | AC3 | Create HR-category Employee with no mappings | 201, both mappings null |
| employee-crud-mapping.UT04 | AC4 | Create regular Employee with no `managerId` | 400 `MANAGER_REQUIRED` |
| employee-crud-mapping.UT05 | AC5 | Create Manager-category Employee with no `hrId` | 400 `HR_REQUIRED` |
| employee-crud-mapping.UT06 | AC6 | Create HR-category Employee with a `managerId` provided | 400 `MAPPING_NOT_ALLOWED` |
| employee-crud-mapping.UT07 | AC7 | Create with `managerId` pointing to a nonexistent Employee | 404 `MANAGER_NOT_FOUND` |
| employee-crud-mapping.UT08 | AC8 | Create with `managerId` pointing to a non-Manager-category Employee | 400 `INVALID_MANAGER_ROLE` |
| employee-crud-mapping.UT09 | AC9 | Create with `hrId` pointing to a non-HR-category Employee | 400 `INVALID_HR_ROLE` |
| employee-crud-mapping.UT10 | AC10 | Create with `hrId` pointing to an HR Employee in a different Department | 400 `MAPPING_SCOPE_MISMATCH` |
| ~~employee-crud-mapping.UT11~~ | ~~AC11~~ | **Removed (v1.4, 2026-09-04)** — formerly: create with `roleId` not enabled for `departmentId` | — |
| employee-crud-mapping.UT12 | AC12 | Create with duplicate `email` | 409 `DUPLICATE_EMAIL` |
| employee-crud-mapping.UT13 | AC13 | List filtered by `departmentId` and `isActive=true` | Only matching Employees returned |
| employee-crud-mapping.UT14 | AC14 | Get nonexistent Employee id | 404 `NOT_FOUND` |
| employee-crud-mapping.UT15 | AC15 | Update Employee's manager mapping to a different valid Manager | 200, mapping updated |
| employee-crud-mapping.UT16 | AC16 | Deactivate (soft-delete) an Employee | 200, `isActive: false` |
| employee-crud-mapping.UT17 | AC17 | Reactivate a soft-deleted Employee | 200, `isActive: true` |
| employee-crud-mapping.UT18 | AC18 | Call any endpoint with no token | 401 `UNAUTHORIZED` |
| employee-crud-mapping.UT19 | AC19 | Create an Employee with a chosen password, inspect the raw stored document | `passwordHash` present, bcrypt-formatted, matches the supplied password; response has `mustChangePassword: true` |
| employee-crud-mapping.UT20 | AC20 | Create an Employee, then GET it by id and GET the list | Neither response includes `passwordHash` |
| employee-crud-mapping.UT21 | AC21 | Delete an Employee referenced by no one | 204, Employee gone |
| employee-crud-mapping.UT22 | AC22 | Delete an Employee who is another Employee's `hrId` | 409 `EMPLOYEE_HAS_DEPENDENTS` |

## Explicitly Out of Scope
- Enforcing Department↔Role enablement (department-crud.API08) when creating/updating an Employee — removed by the v1.4 amendment above, user-directed. Any active Role may be assigned in any Department.
- Audit trail / change history for edits (BRD-004).
- Bulk import/export of Employees or mappings — single-record-at-a-time only (BRD-004).
- Actual login and password-change endpoints — covered by portal-login-password-change.spec.md, not this spec. This spec only provisions the credential fields at creation.
- Resetting/regenerating an Employee's password after creation (e.g. "forgot password", or an Admin-initiated reset) — no such endpoint exists; not addressed in BRD-004 or BRD_Employee_Transfer.md#BRD-001 (which explicitly excludes forgot-password flows). Flagged gap.
- Password strength/complexity validation on the Admin-supplied `password` — BRD-001 states no complexity rule applies; only presence is validated.
- Behavior when an Employee referenced as another Employee's `managerId`/`hrId` is deactivated or has their Role/Department changed — not addressed in BRD-004. Flagged as an open item, not resolved here (no cascading reassignment or block is implemented).
- Checking whether a hard-deleted Employee is referenced by any `TransferRequest` (the Internal Transfer journey) before allowing the delete — flagged gap, not resolved here; out of this spec's Admin-Panel-CRUD scope.
- Pagination beyond the listed filter query params — not specified.

## Non-Functional Constraints (from constitution.md)
- Credentials never appear in logs at any log level (Security Posture) — `passwordHash` and `temporaryPassword` must be excluded from any request/response logging, including `morgan`.
- PII (`name`) never appears in logs at any log level (Security Posture) — pre-existing constraint, restated here since this amendment touches the same model.
- Test-first is mandatory for the new credential-provisioning behavior; minimum 80% line coverage (Testing Discipline).
- Every endpoint sits behind JWT verification (Security Posture) — already satisfied via admin-static-login.spec.md.
- `/api/v1` versioned prefix is retained; adding `mustChangePassword`/`temporaryPassword` fields is additive (no field removed/renamed, no status/auth-requirement change on the existing endpoints), so no version bump is required per the Versioning Rules.
