# Spec: Role CRUD (UI)

## Spec ID
role-crud

## Status
Changes Requested ⟲

## Linked BRD
.ai-context/BRD.md#BRD-003

## Intent
Provide the Admin Panel screens for full CRUD over Role records — create,
list (with active/inactive and category filters), view, edit, and
activate/deactivate (soft delete) — including the optional `category`
(`HR`/`Manager`/none) field, all backed by the backend's `role-crud` API.
Role is a single global list here; which Roles are enabled per Department
is managed on the Department screen, not this one.

## Context
- Builds on: .ai-context/architecture.md (Folder Structure — `roles`
  feature; Data Model — Role)
- Related: .ai-context/specs/admin-static-login.spec.md (every screen here
  requires a valid session — see that spec's AC1/AC6),
  .ai-context/specs/department-crud.spec.md (Department↔Role enablement is
  managed there, not here),
  .ai-context/specs/employee-crud-mapping.spec.md (a Role cannot be
  deactivated while Employees hold it — enforced by the backend, surfaced
  here as a UI error state; `category` drives that spec's Manager/HR
  mapping rules).
- Consumes: backend spec `role-crud.spec.md` (`role-crud.API01`–`API06`) —
  full request/response/error shape owned there, not duplicated here; only
  the parts that drive UI behavior are restated below.

**Amended (2026-09-04, user-directed):** adds a real "Delete" action (hard
delete, irreversible), consuming the backend's new `role-crud.API06`.
Additive alongside the existing Deactivate/Reactivate soft-delete toggle —
neither replaces the other.

## API Contract

### role-crud.API01–API06 — Consumes (see backend `role-crud.spec.md`)
| Backend endpoint | Used by this UI for |
|---|---|
| `POST /api/v1/roles` | Create-Role form submit |
| `GET /api/v1/roles` (`isActive`, `category` filters) | List screen + filter controls |
| `GET /api/v1/roles/:id` | Detail/edit screen load |
| `PUT /api/v1/roles/:id` | Edit form submit |
| `PATCH /api/v1/roles/:id/status` | Deactivate/reactivate action |
| `DELETE /api/v1/roles/:id` | "Delete" action (hard delete, irreversible) |

**Error codes this UI must render distinct messages for:** `VALIDATION_ERROR`
(400), `INVALID_CATEGORY` (400), `UNAUTHORIZED` (401 — handled globally per
`admin-static-login` AC6/AC7, not per-screen), `NOT_FOUND` (404),
`DUPLICATE_CODE` (409), `ROLE_HAS_ACTIVE_EMPLOYEES` (409),
`ROLE_HAS_EMPLOYEES` (409).

## Acceptance Criteria
1. role-crud.AC1 — Given valid `name` and `code` are entered with the
   category selector left at "None," when the create form is submitted,
   then a new Role row appears in the list with no category badge.
2. role-crud.AC2 — Given valid `name`/`code` and category "Manager" are
   entered, when the create form is submitted, then a new Role row appears
   with a "Manager" category badge.
3. role-crud.AC3 — Given valid `name`/`code` and category "HR" are entered,
   when the create form is submitted, then a new Role row appears with an
   "HR" category badge.
4. role-crud.AC4 — Given the category control only exposes `None`, `HR`,
   or `Manager` as selectable values, when the create form is submitted,
   then no client state can produce the `INVALID_CATEGORY` error — this AC
   documents that the constraint is enforced by input shape, not a
   separate inline error path.
5. role-crud.AC5 — Given `name` or `code` is left empty, when the create
   form is submitted, then the `VALIDATION_ERROR` message is shown inline
   on the relevant field(s) and no row is created.
6. role-crud.AC6 — Given a Role already exists with a given `code`, when
   the create form is submitted with that same `code`, then the
   `DUPLICATE_CODE` message is shown inline on the `code` field.
7. role-crud.AC7 — Given Roles exist with mixed statuses and categories,
   when the list screen loads with no filter applied, then all Roles are
   shown regardless of status or category.
8. role-crud.AC8 — Given the Admin selects the "Active only" filter, when
   the list re-renders, then only active Roles are shown.
9. role-crud.AC9 — Given the Admin selects the "HR" category filter, when
   the list re-renders, then only Roles with `category: "HR"` are shown.
10. role-crud.AC10 — Given a Role row is selected, when its detail screen
    loads, then its current `name`, `code`, status, and `category` are
    displayed.
11. role-crud.AC11 — Given the edit form is submitted with valid new
    `name`/`code`/`category`, then the Role's row/detail reflects the
    updated values.
12. role-crud.AC12 — Given the edit form is submitted with a `code`
    already used by a different Role, then the `DUPLICATE_CODE` message is
    shown inline on the `code` field and no update occurs.
13. role-crud.AC13 — Given a Role has no Employees holding it, when the
    Admin triggers "Deactivate," then the Role's status updates to
    inactive without further confirmation of a blocking condition.
14. role-crud.AC14 — Given a Role has one or more active Employees holding
    it, when the Admin triggers "Deactivate," then the
    `ROLE_HAS_ACTIVE_EMPLOYEES` message is shown and the status is not
    changed.
15. role-crud.AC15 — Given a deactivated Role, when the Admin triggers
    "Reactivate," then the Role's status updates to active.
16. role-crud.AC16 — Given a Role has no Employees holding it, when the Admin triggers "Delete" and confirms in the dialog, then the Role is permanently removed and the Admin is returned to the list screen.
17. role-crud.AC17 — Given a Role has one or more Employees holding it, when the Admin triggers "Delete" and confirms, then the `ROLE_HAS_EMPLOYEES` message is shown and the Role is not removed.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| role-crud.UT01 | AC1 | Submit create form with category "None" | New row, no category badge |
| role-crud.UT02 | AC2 | Submit create form with category "Manager" | New row, "Manager" badge |
| role-crud.UT03 | AC3 | Submit create form with category "HR" | New row, "HR" badge |
| role-crud.UT04 | AC5 | Submit create form with empty `code` | Inline `VALIDATION_ERROR`, no new row |
| role-crud.UT05 | AC6 | Submit create form with duplicate `code` | Inline `DUPLICATE_CODE` |
| role-crud.UT06 | AC7 | Load list with mixed Roles, no filter | All rows shown |
| role-crud.UT07 | AC8 | Toggle "Active only" filter | Only active rows shown |
| role-crud.UT08 | AC9 | Select "HR" category filter | Only HR-category rows shown |
| role-crud.UT09 | AC10 | Open detail screen for existing Role | Fields populated incl. category |
| role-crud.UT10 | AC11 | Submit edit form with new name/code/category | Row/detail reflects update |
| role-crud.UT11 | AC12 | Submit edit form with a duplicate code | Inline `DUPLICATE_CODE`, no update |
| role-crud.UT12 | AC13 | Deactivate Role with no Employees holding it | Status becomes inactive |
| role-crud.UT13 | AC14 | Deactivate Role with an active Employee holding it | `ROLE_HAS_ACTIVE_EMPLOYEES` shown, status unchanged |
| role-crud.UT14 | AC15 | Reactivate an inactive Role | Status becomes active |
| role-crud.UT15 | AC16 | Delete a Role with no Employees holding it, confirm dialog | Role gone, redirected to list |
| role-crud.UT16 | AC17 | Delete a Role with an Employee holding it | `ROLE_HAS_EMPLOYEES` shown |

## Explicitly Out of Scope
- Audit trail / change history display (BRD-003).
- Bulk create/import of Roles.
- Pagination controls beyond the active/inactive and category filters —
  the backend contract has no pagination parameters to build against.
- Any UI to reassign Employees when a Role's `category` is changed after
  Employees already hold Manager/HR mappings derived from it — the backend
  spec explicitly leaves this unresolved (flagged there as an open item);
  this UI does not attempt to surface or resolve it either.

## Non-Functional Constraints (from constitution.md)
- Server-state caching/synchronization for this screen's data must use
  TanStack Query only (`constitution.md` → Architectural Constraints); no
  component holds fetched Role data in local `useState`.
- HTTP calls go through the single shared Axios instance only.
- Route files under `src/app/roles/**` stay thin, per `constitution.md` →
  Architectural Constraints and `architecture.md` → Folder Structure; the
  actual screens live in `src/screens/roles/`.
- Test framework is Vitest + React Testing Library; test-first scope and
  coverage floor are an open gap in `constitution.md` — not yet enforceable
  at Gate 1.
