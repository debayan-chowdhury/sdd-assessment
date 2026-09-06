# Plan: Location CRUD (UI)

> ⚠️ **Speculative draft.** `location-crud.spec.md` is currently
> `Changes Requested ⟲`, not `Approved`. This plan is drafted against the
> spec's current content at the user's explicit request, bypassing the
> standard Gate-1-before-plan gate. It is **not official** and must be
> re-derived (or at minimum re-checked) once the spec is revised and
> actually reaches `Approved`.

## Derived From
.ai-context/specs/location-crud.spec.md

## Architecture Approach
Assumes `admin-static-login`'s plan has already established
`src/lib/axios.ts`, `src/lib/queryClient.ts`, and `AuthGuard`. This plan is
also the first CRUD screen built, so it establishes the first reusable
`components/ui/` primitives that `department-crud`/`role-crud`/
`employee-crud-mapping` will reuse rather than recreate.

- **New shared UI (first built here, reused later):**
  `src/components/ui/{DataTable, Modal, ConfirmDialog, StatusBadge}.tsx`.
- **Feature-specific:**
  - `src/features/locations/locations.api.ts` — `getLocations(filters)`,
    `getLocation(id)`, `createLocation`, `updateLocation`,
    `setLocationStatus`, `addDepartmentMapping`, `removeDepartmentMapping`,
    `getLocationDepartments(id)`.
  - `src/features/locations/locations.queries.ts` — `useLocationsQuery`,
    `useLocationQuery`, `useLocationDepartmentsQuery`.
  - `src/features/locations/locations.mutations.ts` —
    `useCreateLocationMutation`, `useUpdateLocationMutation`,
    `useSetLocationStatusMutation`, `useAddDepartmentMappingMutation`,
    `useRemoveDepartmentMappingMutation`.
  - `src/screens/locations/LocationsListPage.tsx`,
    `LocationDetailPage.tsx`, `components/{LocationTable, LocationFormModal,
    LocationDepartmentMappingPanel}.tsx`.
  - `src/app/locations/page.tsx`, `src/app/locations/[locationId]/page.tsx`
    — thin, render the two page components above.
- **Cross-feature dependency:** the "Add Department" control in
  `LocationDepartmentMappingPanel` needs a list of Departments to select
  from. This plan depends on a minimal `useDepartmentsQuery` read hook
  existing (from `department-crud`'s data layer) — see Sequencing.
- Integration points: backend `location-crud.API01`–`API08` per the spec's
  API Contract table — no new endpoint on this side.

## Data Model
No local datastore. Client-side shapes only:
- `src/types/location.ts` — `Location { id, name, code, isActive }`,
  `LocationInput { name, code }`.
- Reuses `src/types/department.ts` (`Department`) for the mapped/available
  Department lists — owned by `department-crud`'s plan, not redefined here.

## Constitution Check
- [x] Test framework matches `constitution.md` — Vitest + React Testing
  Library for list/detail/form components and the mutation hooks.
- [ ] Test-first scope / coverage floor — **N/A, flagged gap in
  constitution.md itself**; not invented here.
- [ ] Employee-data logging rule — **N/A**, this feature only handles
  Location records, no Employee data.
- [ ] Auth baseline — **N/A to this plan directly**; consumed via the
  shared `AuthGuard`/Axios interceptor from `admin-static-login`'s plan,
  not re-implemented here.
- [ ] Session expiry/logout/multi-admin — **N/A**, out of this feature's
  scope entirely.
- [x] No `middleware.ts` for access control — this feature's routes rely
  on the shared `AuthGuard`, not `middleware.ts`.
- [ ] Secrets/config via `.env` — **N/A**, this feature introduces no new
  secret/config value; it reuses the shared Axios base URL.
- [x] No local datastore, backend REST `/api/v1` only — all Location data
  comes from `location-crud.API01`–`API08`; no datastore introduced.
- [x] Axios only, single shared instance — reuses `src/lib/axios.ts`; no
  new HTTP client.
- [x] TanStack Query only for server state — all Location and mapped-
  Department data is held in query/mutation hooks, never local `useState`.
- [ ] Zustand for client state — **N/A**, this feature has no
  cross-component client state to hold (no store needed beyond the shared
  auth store).
- [x] Thin route files — `src/app/locations/**/page.tsx` only import and
  render the matching `src/screens/locations/**` component.
- [x] No new library outside the approved set — none introduced.
- [ ] Non-Functional Baselines — **N/A, flagged gap in constitution.md
  itself**; not invented here.
- [x] Targets backend API `v1` — all calls target `/api/v1/locations/**`.
- [ ] Breaking-change/deprecation policy — **N/A, flagged gap in
  constitution.md itself**; not this plan's decision to make.

**Revised (2026-09-04, user-directed):** adds a "Delete" button + confirmation dialog (`variant="danger"`) to `LocationDetailPage.tsx`, wired to a new `useDeleteLocationMutation` (`locations.mutations.ts`) calling `DELETE /api/v1/locations/:id` (`locations.api.ts`). On success, navigates back to `/locations`; on `LOCATION_HAS_EMPLOYEES`, shows an inline error and leaves the record intact. `ConfirmDialog` gains an optional `variant` prop (`"default" | "danger"`, default `"default"`) so this irreversible action is visually distinct (red confirm button) from the existing reversible Deactivate dialog — a shared-component change, so it applies to all four entities' delete dialogs, not just this one.

## Explicitly Deferred
- Audit trail / change history display — spec's Explicitly Out of Scope.
- Bulk create/import of Locations or mappings — spec's Explicitly Out of
  Scope; single-record forms only.
- Pagination beyond the `isActive` filter — the backend contract has no
  pagination parameters to build against.
- Creating/editing Department records from this screen — Departments are
  only selected here; authored in `department-crud`.

## Sequencing
1. `src/components/ui/{DataTable, Modal, ConfirmDialog, StatusBadge}.tsx`
   (first use, reused by every later CRUD screen).
2. `src/types/location.ts`.
3. A minimal `src/features/departments/departments.queries.ts` read hook
   (`useDepartmentsQuery`) — pulled forward from `department-crud`'s plan
   just far enough to power the "Add Department" selector; the full
   Department CRUD screens don't need to exist yet.
4. `src/features/locations/{locations.api.ts, locations.queries.ts,
   locations.mutations.ts}`.
5. `src/screens/locations/{LocationsListPage.tsx, LocationDetailPage.tsx,
   components/*}`.
6. `src/app/locations/page.tsx` + `src/app/locations/[locationId]/page.tsx`.
7. **Revision:** add `variant` prop to `ConfirmDialog.tsx`; add `deleteLocation`/`useDeleteLocationMutation`; wire "Delete" button + dialog into `LocationDetailPage.tsx`.
