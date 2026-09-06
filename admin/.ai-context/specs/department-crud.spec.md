# Spec: Department CRUD (UI)

## Spec ID
department-crud

## Status
Changes Requested ⟲

## Linked BRD
.ai-context/BRD.md#BRD-002

## Intent
Provide the Admin Panel screens for full CRUD over Department records —
create, list (with active/inactive filter), view, edit, and
activate/deactivate (soft delete) — plus a screen/section to manage which
of the global Roles are enabled for a given Department, all backed by the
backend's `department-crud` API.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `departments`
  feature; Data Model — Department)
- Related: .ai-context/specs/admin-static-login.spec.md (every screen here
  requires a valid session — see that spec's AC1/AC6),
  .ai-context/specs/location-crud.spec.md (the Location side of the
  Location↔Department mapping is managed there, not here),
  .ai-context/specs/role-crud.spec.md (Roles referenced in the mapping UI
  here are the same entity CRUD'd there),
  .ai-context/specs/employee-crud-mapping.spec.md (a Department cannot be
  deactivated while Employees are mapped to it — enforced by the backend,
  surfaced here as a UI error state).
- Consumes: backend spec `department-crud.spec.md`
  (`department-crud.API01`–`API09`) — full request/response/error shape
  owned there, not duplicated here; only the parts that drive UI behavior
  are restated below.

**Amended (2026-09-04, user-directed):** adds a real "Delete" action (hard
delete, irreversible), consuming the backend's new `department-crud.API09`.
Additive alongside the existing Deactivate/Reactivate soft-delete toggle —
neither replaces the other.

## API Contract

### department-crud.API01–API09 — Consumes (see backend `department-crud.spec.md`)
| Backend endpoint | Used by this UI for |
|---|---|
| `POST /api/v1/departments` | Create-Department form submit |
| `GET /api/v1/departments` (`isActive` filter) | List screen + status filter toggle |
| `GET /api/v1/departments/:id` | Detail/edit screen load |
| `PUT /api/v1/departments/:id` | Edit form submit |
| `PATCH /api/v1/departments/:id/status` | Deactivate/reactivate action |
| `POST /api/v1/departments/:id/roles` | "Enable Role" mapping action |
| `DELETE /api/v1/departments/:id/roles/:roleId` | "Disable Role" mapping action |
| `GET /api/v1/departments/:id/roles` | Enabled-Roles list on the detail screen |
| `DELETE /api/v1/departments/:id` | "Delete" action (hard delete, irreversible) |

**Error codes this UI must render distinct messages for:** `VALIDATION_ERROR`
(400), `UNAUTHORIZED` (401 — handled globally per `admin-static-login`
AC6/AC7, not per-screen), `NOT_FOUND` (404), `DUPLICATE_CODE` (409),
`DEPARTMENT_HAS_ACTIVE_EMPLOYEES` (409), `MAPPING_ALREADY_EXISTS` (409),
`DEPARTMENT_HAS_EMPLOYEES` (409).

## Acceptance Criteria
1. department-crud.AC1 — Given valid `name` and `code` are entered, when
   the create form is submitted, then a new Department row appears in the
   list with an "Active" status badge.
2. department-crud.AC2 — Given `name` or `code` is left empty, when the
   create form is submitted, then the `VALIDATION_ERROR` message is shown
   inline on the relevant field(s) and no row is created.
3. department-crud.AC3 — Given a Department already exists with a given
   `code`, when the create form is submitted with that same `code`, then
   the `DUPLICATE_CODE` message is shown inline on the `code` field.
4. department-crud.AC4 — Given Departments exist with both statuses, when
   the list screen loads with no filter applied, then all Departments are
   shown regardless of status.
5. department-crud.AC5 — Given the Admin selects the "Active only" filter,
   when the list re-renders, then only active Departments are shown.
6. department-crud.AC6 — Given a Department row is selected, when its
   detail screen loads, then its current `name`, `code`, status, and
   enabled Roles (with each Role's `category`) are displayed.
7. department-crud.AC7 — Given the edit form is submitted with valid new
   `name`/`code`, then the Department's row/detail reflects the updated
   values.
8. department-crud.AC8 — Given the edit form is submitted with a `code`
   already used by a different Department, then the `DUPLICATE_CODE`
   message is shown inline on the `code` field and no update occurs.
9. department-crud.AC9 — Given a Department has no Employees mapped to it,
   when the Admin triggers "Deactivate," then the Department's status
   updates to inactive without further confirmation of a blocking
   condition.
10. department-crud.AC10 — Given a Department has one or more active
    Employees mapped to it, when the Admin triggers "Deactivate," then the
    `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` message is shown and the status is
    not changed.
11. department-crud.AC11 — Given a deactivated Department, when the Admin
    triggers "Reactivate," then the Department's status updates to active.
12. department-crud.AC12 — Given a Role not yet enabled for this
    Department is selected in the "Enable Role" control, when confirmed,
    then that Role appears in the Department's enabled-Roles list with its
    `category`.
13. department-crud.AC13 — Given a Role is already enabled for this
    Department, when the Admin attempts to enable it again, then the
    `MAPPING_ALREADY_EXISTS` message is shown and no duplicate row appears.
14. department-crud.AC14 — Given an enabled Role, when the Admin triggers
    "Disable" on that mapping, then it is removed from the enabled-Roles
    list.
15. department-crud.AC15 — Given a Department has no Employees mapped to it, when the Admin triggers "Delete" and confirms in the dialog, then the Department is permanently removed and the Admin is returned to the list screen.
16. department-crud.AC16 — Given a Department has one or more Employees mapped to it, when the Admin triggers "Delete" and confirms, then the `DEPARTMENT_HAS_EMPLOYEES` message is shown and the Department is not removed.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| department-crud.UT01 | AC1 | Submit create form with valid name/code | New row rendered, Active badge |
| department-crud.UT02 | AC2 | Submit create form with empty `name` | Inline `VALIDATION_ERROR`, no new row |
| department-crud.UT03 | AC3 | Submit create form with duplicate `code` | Inline `DUPLICATE_CODE` |
| department-crud.UT04 | AC4 | Load list with mixed-status Departments, no filter | All rows shown |
| department-crud.UT05 | AC5 | Toggle "Active only" filter | Only active rows shown |
| department-crud.UT06 | AC6 | Open detail screen for existing Department | Fields + enabled Roles (with category) populated |
| department-crud.UT07 | AC7 | Submit edit form with new name/code | Row/detail reflects update |
| department-crud.UT08 | AC8 | Submit edit form with a duplicate code | Inline `DUPLICATE_CODE`, no update |
| department-crud.UT09 | AC9 | Deactivate Department with no mapped Employees | Status becomes inactive |
| department-crud.UT10 | AC10 | Deactivate Department with a mapped active Employee | `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` shown, status unchanged |
| department-crud.UT11 | AC11 | Reactivate an inactive Department | Status becomes active |
| department-crud.UT12 | AC12 | Enable a not-yet-enabled Role | Appears in enabled list with category |
| department-crud.UT13 | AC13 | Enable an already-enabled Role | `MAPPING_ALREADY_EXISTS` shown |
| department-crud.UT14 | AC14 | Disable an enabled Role | Removed from enabled list |
| department-crud.UT15 | AC15 | Delete a Department with no mapped Employees, confirm dialog | Department gone, redirected to list |
| department-crud.UT16 | AC16 | Delete a Department with a mapped Employee | `DEPARTMENT_HAS_EMPLOYEES` shown |

## Explicitly Out of Scope
- Audit trail / change history display (BRD-002).
- Bulk create/import of Departments or Department↔Role mappings.
- Pagination controls beyond the active/inactive filter — the backend
  contract has no pagination parameters to build against.
- Creating/editing Role records from this screen — Roles are only selected
  here, not authored; see `role-crud.spec.md`.

## Non-Functional Constraints (from constitution.md)
- Server-state caching/synchronization for this screen's data must use
  TanStack Query only (`constitution.md` → Architectural Constraints); no
  component holds fetched Department/Role data in local `useState`.
- HTTP calls go through the single shared Axios instance only.
- Route files under `src/app/departments/**` stay thin, per
  `constitution.md` → Architectural Constraints and `architecture.md` →
  Folder Structure; the actual screens live in `src/screens/departments/`.
- Test framework is Vitest + React Testing Library; test-first scope and
  coverage floor are an open gap in `constitution.md` — not yet enforceable
  at Gate 1.
