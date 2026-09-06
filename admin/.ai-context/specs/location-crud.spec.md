# Spec: Location CRUD (UI)

## Spec ID
location-crud

## Status
Changes Requested ⟲

## Linked BRD
.ai-context/BRD.md#BRD-001

## Intent
Provide the Admin Panel screens for full CRUD over Location records —
create, list (with active/inactive filter), view, edit, and
activate/deactivate (soft delete) — plus a screen/section to manage which
Departments are mapped to a given Location, all backed by the backend's
`location-crud` API.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `locations`
  feature; Data Model — Location)
- Related: .ai-context/specs/admin-static-login.spec.md (every screen here
  requires a valid session — see that spec's AC1/AC6),
  .ai-context/specs/department-crud.spec.md (Departments referenced in the
  mapping UI here are the same entity CRUD'd there),
  .ai-context/specs/employee-crud-mapping.spec.md (a Location cannot be
  deactivated while Employees are mapped to it — enforced by the backend,
  surfaced here as a UI error state).
- Consumes: backend spec `location-crud.spec.md` (`location-crud.API01`–
  `API09`) — full request/response/error shape owned there, not duplicated
  here; only the parts that drive UI behavior are restated below.

**Amended (2026-09-04, user-directed):** adds a real "Delete" action (hard
delete, irreversible), consuming the backend's new `location-crud.API09`.
Additive alongside the existing Deactivate/Reactivate soft-delete toggle —
neither replaces the other.

## API Contract

### location-crud.API01–API08 — Consumes (see backend `location-crud.spec.md`)
| Backend endpoint | Used by this UI for |
|---|---|
| `POST /api/v1/locations` | Create-Location form submit |
| `GET /api/v1/locations` (`isActive` filter) | List screen + status filter toggle |
| `GET /api/v1/locations/:id` | Detail/edit screen load |
| `PUT /api/v1/locations/:id` | Edit form submit |
| `PATCH /api/v1/locations/:id/status` | Deactivate/reactivate action |
| `POST /api/v1/locations/:id/departments` | "Add Department" mapping action |
| `DELETE /api/v1/locations/:id/departments/:departmentId` | "Remove Department" mapping action |
| `GET /api/v1/locations/:id/departments` | Mapped-Departments list on the detail screen |
| `DELETE /api/v1/locations/:id` | "Delete" action (hard delete, irreversible) |

**Error codes this UI must render distinct messages for:** `VALIDATION_ERROR`
(400), `UNAUTHORIZED` (401 — handled globally per `admin-static-login`
AC6/AC7, not per-screen), `NOT_FOUND` (404), `DUPLICATE_CODE` (409),
`LOCATION_HAS_ACTIVE_EMPLOYEES` (409), `MAPPING_ALREADY_EXISTS` (409),
`LOCATION_HAS_EMPLOYEES` (409).

## Acceptance Criteria
1. location-crud.AC1 — Given valid `name` and `code` are entered, when the
   create form is submitted, then a new Location row appears in the list
   with an "Active" status badge.
2. location-crud.AC2 — Given `name` or `code` is left empty, when the
   create form is submitted, then the `VALIDATION_ERROR` message is shown
   inline on the relevant field(s) and no row is created.
3. location-crud.AC3 — Given a Location already exists with a given `code`,
   when the create form is submitted with that same `code`, then the
   `DUPLICATE_CODE` message is shown inline on the `code` field.
4. location-crud.AC4 — Given Locations exist with both statuses, when the
   list screen loads with no filter applied, then all Locations are shown
   regardless of status.
5. location-crud.AC5 — Given the Admin selects the "Active only" filter,
   when the list re-renders, then only active Locations are shown.
6. location-crud.AC6 — Given a Location row is selected, when its detail
   screen loads, then its current `name`, `code`, status, and mapped
   Departments are displayed.
7. location-crud.AC7 — Given the edit form is submitted with valid new
   `name`/`code`, then the Location's row/detail reflects the updated
   values.
8. location-crud.AC8 — Given the edit form is submitted with a `code`
   already used by a different Location, then the `DUPLICATE_CODE` message
   is shown inline on the `code` field and no update occurs.
9. location-crud.AC9 — Given a Location has no Employees mapped to it, when
   the Admin triggers "Deactivate," then the Location's status updates to
   inactive without further confirmation of a blocking condition.
10. location-crud.AC10 — Given a Location has one or more active Employees
    mapped to it, when the Admin triggers "Deactivate," then the
    `LOCATION_HAS_ACTIVE_EMPLOYEES` message is shown and the status is not
    changed.
11. location-crud.AC11 — Given a deactivated Location, when the Admin
    triggers "Reactivate," then the Location's status updates to active.
12. location-crud.AC12 — Given an unmapped Department is selected in the
    "Add Department" control, when confirmed, then that Department appears
    in the Location's mapped-Departments list.
13. location-crud.AC13 — Given a Department is already mapped to this
    Location, when the Admin attempts to add it again, then the
    `MAPPING_ALREADY_EXISTS` message is shown and no duplicate mapping row
    appears.
14. location-crud.AC14 — Given a mapped Department, when the Admin triggers
    "Remove" on that mapping, then it is removed from the mapped-Departments
    list.
15. location-crud.AC15 — Given a Location has no Employees mapped to it, when the Admin triggers "Delete" and confirms in the dialog, then the Location is permanently removed and the Admin is returned to the list screen.
16. location-crud.AC16 — Given a Location has one or more Employees mapped to it, when the Admin triggers "Delete" and confirms, then the `LOCATION_HAS_EMPLOYEES` message is shown and the Location is not removed.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| location-crud.UT01 | AC1 | Submit create form with valid name/code | New row rendered, Active badge |
| location-crud.UT02 | AC2 | Submit create form with empty `code` | Inline `VALIDATION_ERROR`, no new row |
| location-crud.UT03 | AC3 | Submit create form with duplicate `code` | Inline `DUPLICATE_CODE` |
| location-crud.UT04 | AC4 | Load list with mixed-status Locations, no filter | All rows shown |
| location-crud.UT05 | AC5 | Toggle "Active only" filter | Only active rows shown |
| location-crud.UT06 | AC6 | Open detail screen for existing Location | Fields + mapped Departments populated |
| location-crud.UT07 | AC7 | Submit edit form with new name/code | Row/detail reflects update |
| location-crud.UT08 | AC8 | Submit edit form with a duplicate code | Inline `DUPLICATE_CODE`, no update |
| location-crud.UT09 | AC9 | Deactivate Location with no mapped Employees | Status becomes inactive |
| location-crud.UT10 | AC10 | Deactivate Location with a mapped active Employee | `LOCATION_HAS_ACTIVE_EMPLOYEES` shown, status unchanged |
| location-crud.UT11 | AC11 | Reactivate an inactive Location | Status becomes active |
| location-crud.UT12 | AC12 | Add an unmapped Department | Appears in mapped list |
| location-crud.UT13 | AC13 | Add an already-mapped Department | `MAPPING_ALREADY_EXISTS` shown |
| location-crud.UT14 | AC14 | Remove a mapped Department | Removed from mapped list |
| location-crud.UT15 | AC15 | Delete a Location with no mapped Employees, confirm dialog | Location gone, redirected to list |
| location-crud.UT16 | AC16 | Delete a Location with a mapped Employee | `LOCATION_HAS_EMPLOYEES` shown |

## Explicitly Out of Scope
- Audit trail / change history display (BRD-001).
- Bulk create/import of Locations or Location↔Department mappings.
- Pagination controls beyond the active/inactive filter — the backend
  contract has no pagination parameters to build against.
- Creating/editing Department records from this screen — Departments are
  only selected here, not authored; see `department-crud.spec.md`.

## Non-Functional Constraints (from constitution.md)
- Server-state caching/synchronization for this screen's data must use
  TanStack Query only (`constitution.md` → Architectural Constraints); no
  component holds fetched Location/Department data in local `useState`.
- HTTP calls go through the single shared Axios instance only.
- Route files under `src/app/locations/**` stay thin, per
  `constitution.md` → Architectural Constraints and `architecture.md` →
  Folder Structure; the actual screens live in `src/screens/locations/`.
- Test framework is Vitest + React Testing Library; test-first scope and
  coverage floor are an open gap in `constitution.md` — not yet enforceable
  at Gate 1.
