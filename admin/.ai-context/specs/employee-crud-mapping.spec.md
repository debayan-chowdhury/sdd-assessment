# Spec: Employee CRUD and Manager/HR Mapping (UI)

## Spec ID
employee-crud-mapping

## Status
Changes Requested ⟲

## Linked BRD
.ai-context/BRD.md#BRD-004

## Intent
Provide the Admin Panel screens for full CRUD over Employee records —
create, filterable list, view, edit, and activate/deactivate (soft
delete) — including the Location+Department+Role mapping and the
conditional Manager/HR mapping driven by the assigned Role's `category`,
all backed by the backend's `employee-crud-mapping` API.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `employees`
  feature; Data Model — Employee)
- Related: .ai-context/specs/admin-static-login.spec.md (every screen here
  requires a valid session — see that spec's AC1/AC6),
  .ai-context/specs/location-crud.spec.md, .ai-context/specs/department-crud.spec.md,
  .ai-context/specs/role-crud.spec.md (the Location/Department/Role
  dropdowns on the Employee form source their options from these three
  entities' active records; the Role dropdown is **not** scoped to Roles
  enabled for the selected Department as of the v1.1 amendment below —
  Role and Department carry no relation to each other in this form).
- Consumes: backend spec `employee-crud-mapping.spec.md`
  (`employee-crud-mapping.API01`–`API06`) — full request/response/error
  shape owned there, not duplicated here; only the parts that drive UI
  behavior are restated below.

**Amended (2026-09-04):** user-directed change, tracking the backend's v1.3
amendment — `code` is removed from the Employee create/update contract;
`email` replaces it as the identifier, and the Admin now sets the
Employee's initial `password` directly on the create form (no more
system-generated password). This spec was never `Approved` (still
`Changes Requested ⟲`), so this is a direct content edit, not a
versioned Case A amendment.

**Amended (2026-09-04, user-directed):** adds a real "Delete" action (hard
delete, irreversible), consuming the backend's new
`employee-crud-mapping.API06`. Additive alongside the existing
Deactivate/Reactivate soft-delete toggle — neither replaces the other.

**Amended (v1.1, 2026-09-04, user-directed):** the Role selector on the
Employee create/edit form is no longer scoped to Roles enabled for the
selected Department (`department-crud.API08`) — it now lists all active
Roles regardless of Department, tracking the backend's v1.4 amendment to
`employee-crud-mapping.spec.md`. Root cause: after a full data reset, no
Department↔Role enablement mappings existed for any Department, leaving
this selector empty for every Department. The Department↔Role
"Enable/Disable Role" feature itself (`department-crud.API08`, its mapping
panel on the Department detail screen) is **not** removed — it is simply
no longer consulted here. AC9/UT08 (the `ROLE_NOT_ENABLED_FOR_DEPARTMENT`
fallback) are marked removed below rather than renumbered, to avoid
churning every other AC/UT cross-reference in this still-`Changes
Requested ⟲` spec.

## API Contract

### employee-crud-mapping.API01–API06 — Consumes (see backend `employee-crud-mapping.spec.md`)
| Backend endpoint | Used by this UI for |
|---|---|
| `POST /api/v1/employees` | Create-Employee form submit |
| `GET /api/v1/employees` (`isActive`, `locationId`, `departmentId`, `roleId` filters) | List screen + filter controls |
| `GET /api/v1/employees/:id` | Detail/edit screen load |
| `PUT /api/v1/employees/:id` | Edit form submit |
| `PATCH /api/v1/employees/:id/status` | Deactivate/reactivate action |
| `DELETE /api/v1/employees/:id` | "Delete" action (hard delete, irreversible) |

**Error codes this UI must render distinct messages for:**
`VALIDATION_ERROR` (400), `MANAGER_REQUIRED` (400), `HR_REQUIRED` (400),
`MAPPING_NOT_ALLOWED` (400), `INVALID_MANAGER_ROLE` (400),
`INVALID_HR_ROLE` (400), `MAPPING_SCOPE_MISMATCH` (400), `UNAUTHORIZED`
(401 — handled globally per `admin-static-login` AC6/AC7, not per-screen),
`NOT_FOUND` / `MANAGER_NOT_FOUND` / `HR_NOT_FOUND` (404), `DUPLICATE_EMAIL`
(409). `ROLE_NOT_ENABLED_FOR_DEPARTMENT` removed by the v1.1 amendment —
the backend no longer returns it from this API as of its own v1.4
amendment.

## Acceptance Criteria
1. employee-crud-mapping.AC1 — Given a Location, Department, and a Role
   with `category: null` are selected, when the form is shown, then both
   Manager and HR selector fields are displayed and required.
2. employee-crud-mapping.AC2 — Given a Role with `category: "Manager"` is
   selected, when the form re-renders, then only the HR selector field is
   displayed and required; no Manager selector is shown.
3. employee-crud-mapping.AC3 — Given a Role with `category: "HR"` is
   selected, when the form re-renders, then neither the Manager nor the HR
   selector field is displayed.
4. employee-crud-mapping.AC4 — Given a regular Employee (Role
   `category: null`) with valid Manager and HR selections both in the same
   Location+Department, when the form is submitted, then the Employee is
   created and appears in the list with both mappings shown on its detail
   screen.
5. employee-crud-mapping.AC5 — Given the Role selected has `category: null`
   and the Manager selector is left empty, when the form is submitted,
   then the `MANAGER_REQUIRED` message is shown inline on that field and no
   Employee is created.
6. employee-crud-mapping.AC6 — Given the Role selected has `category: null`
   or `"Manager"` and the HR selector is left empty, when the form is
   submitted, then the `HR_REQUIRED` message is shown inline on that field
   and no Employee is created.
7. employee-crud-mapping.AC7 — Given `name`, `email`, `password` (create
   form only), `locationId`, `departmentId`, or `roleId` is left empty,
   when the form is submitted, then the `VALIDATION_ERROR` message is
   shown inline on the relevant field(s) and no Employee is created.
8. employee-crud-mapping.AC8 — Given the Manager or HR selector options are
   sourced only from Employees already in the selected Location+Department
   with the matching Role `category` (per AC1/AC2's field visibility), then
   the `INVALID_MANAGER_ROLE`, `INVALID_HR_ROLE`, and
   `MAPPING_SCOPE_MISMATCH` errors are not reachable through normal UI
   interaction — this AC documents that the constraint is enforced by
   selector option scoping, with the corresponding backend error message
   still rendered inline as a fallback if the API rejects the submission
   for any reason (e.g. stale selector data).
9. ~~employee-crud-mapping.AC9~~ — **Removed (v1.1, 2026-09-04):** formerly
   "given the Role selected is not enabled for the selected Department,
   the `ROLE_NOT_ENABLED_FOR_DEPARTMENT` message is shown inline." Role and
   Department now carry no relation on this form; see the v1.1 amendment
   note above. Number retained as a gap, not reused.
10. employee-crud-mapping.AC10 — Given required fields are valid, when the
    form is submitted with an `email` already used by another Employee,
    then the `DUPLICATE_EMAIL` message is shown inline on the `email`
    field.
11. employee-crud-mapping.AC11 — Given Employees exist across multiple
    Locations/Departments/Roles, when the list screen's filters are set to
    a combination of `locationId`/`departmentId`/`roleId`/`isActive`, then
    only matching Employees are shown.
12. employee-crud-mapping.AC12 — Given an Employee row is selected, when
    its detail screen loads, then its `name`, `email`, status,
    Location/Department/Role, and Manager/HR mapping (if any) are
    displayed.
13. employee-crud-mapping.AC13 — Given the edit form is submitted with a
    valid new mapping, then the Employee's row/detail reflects the update,
    subject to the same field-visibility and validation rules as AC1–AC8
    and AC10 (AC9 removed, v1.1).
14. employee-crud-mapping.AC14 — Given an Employee, when the Admin triggers
    "Deactivate," then the Employee's status updates to inactive.
15. employee-crud-mapping.AC15 — Given a deactivated Employee, when the
    Admin triggers "Reactivate," then the Employee's status updates to
    active.
16. employee-crud-mapping.AC16 — Given an Employee is not referenced as another Employee's Manager or HR, when the Admin triggers "Delete" and confirms in the dialog, then the Employee is permanently removed and the Admin is returned to the list screen.
17. employee-crud-mapping.AC17 — Given an Employee is referenced as another Employee's Manager or HR, when the Admin triggers "Delete" and confirms, then the `EMPLOYEE_HAS_DEPENDENTS` message is shown and the Employee is not removed.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| employee-crud-mapping.UT01 | AC1 | Select a `category: null` Role | Manager + HR fields shown and required |
| employee-crud-mapping.UT02 | AC2 | Select a `category: "Manager"` Role | Only HR field shown and required |
| employee-crud-mapping.UT03 | AC3 | Select a `category: "HR"` Role | Neither Manager nor HR field shown |
| employee-crud-mapping.UT04 | AC4 | Submit regular Employee with valid Manager + HR in scope | 201 equivalent: row created, mappings shown |
| employee-crud-mapping.UT05 | AC5 | Submit regular Employee with Manager field empty | Inline `MANAGER_REQUIRED`, no row created |
| employee-crud-mapping.UT06 | AC6 | Submit Manager-category Employee with HR field empty | Inline `HR_REQUIRED`, no row created |
| employee-crud-mapping.UT07 | AC7 | Submit create form with `email` or `password` empty | Inline `VALIDATION_ERROR`, no row created |
| ~~employee-crud-mapping.UT08~~ | ~~AC9~~ | **Removed (v1.1, 2026-09-04)** — formerly: force-submit with a Role not enabled for the Department (mocked API rejection) | — |
| employee-crud-mapping.UT09 | AC10 | Submit with duplicate `email` | Inline `DUPLICATE_EMAIL` |
| employee-crud-mapping.UT10 | AC11 | Apply `departmentId` + `isActive=true` filters | Only matching Employees listed |
| employee-crud-mapping.UT11 | AC12 | Open detail screen for existing Employee | Fields + mapping populated |
| employee-crud-mapping.UT12 | AC13 | Submit edit form changing Manager mapping | Row/detail reflects update |
| employee-crud-mapping.UT13 | AC14 | Deactivate an Employee | Status becomes inactive |
| employee-crud-mapping.UT14 | AC15 | Reactivate an inactive Employee | Status becomes active |
| employee-crud-mapping.UT15 | AC16 | Delete an Employee referenced by no one, confirm dialog | Employee gone, redirected to list |
| employee-crud-mapping.UT16 | AC17 | Delete an Employee who is another's Manager or HR | `EMPLOYEE_HAS_DEPENDENTS` shown |

## Explicitly Out of Scope
- Scoping the Role selector to Roles enabled for the selected Department
  (`department-crud.API08`) — removed by the v1.1 amendment above,
  user-directed. Any active Role may be selected in any Department.
- Audit trail / change history display (BRD-004).
- Bulk import/export of Employees or mappings — single-record-at-a-time
  only, per BRD-004; no CSV/bulk UI.
- Employee-facing login/authentication UI — no such feature exists
  anywhere in this system; only the Admin login (`admin-static-login.spec.md`).
- Displaying, editing, or resetting an Employee's password after creation —
  the `password` field appears only on the create form; the edit form
  never shows or sends it, and no backend endpoint exists for an
  Admin-initiated reset.
- Any UI reflecting cascading effects when an Employee referenced as
  another's `managerId`/`hrId` is deactivated or has their Role/Department
  changed — the backend spec explicitly leaves this unresolved; this UI
  does not attempt to surface or resolve it either.
- Pagination beyond the listed filter query params — the backend contract
  has no pagination parameters to build against.

## Non-Functional Constraints (from constitution.md)
- Server-state caching/synchronization for this screen's data (including
  cross-entity dropdown options from Locations/Departments/Roles) must use
  TanStack Query only (`constitution.md` → Architectural Constraints); no
  component holds fetched data in local `useState`.
- HTTP calls go through the single shared Axios instance only.
- Route files under `src/app/employees/**` stay thin, per
  `constitution.md` → Architectural Constraints and `architecture.md` →
  Folder Structure; the actual screens live in `src/screens/employees/`.
- Employee data is the sensitive-data category named in `constitution.md`
  → Security Posture — never logged client-side in production builds.
- Test framework is Vitest + React Testing Library; test-first scope and
  coverage floor are an open gap in `constitution.md` — not yet enforceable
  at Gate 1.
