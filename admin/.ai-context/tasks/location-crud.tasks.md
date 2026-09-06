# Tasks: Location CRUD (UI)

> ⚠️ **Speculative draft.** The linked spec is `Changes Requested ⟲` and
> the linked plan is unreviewed — this bypasses the standard
> Plan-Reviewed-before-tasks gate at the user's explicit request. Not
> official; must be re-derived once the spec/plan actually clear their
> gates.

## Derived From
.ai-context/plans/location-crud.plan.md

## Sequence
- [x] location-crud.T01 — Build shared UI primitives:
  `src/components/ui/{DataTable, Modal, ConfirmDialog, StatusBadge}.tsx`
  (generic, feature-agnostic; first built here, reused by later CRUD
  screens) — Acceptance: AC1
- [x] location-crud.T02 — Create `src/types/location.ts` (`Location`,
  `LocationInput`) and a minimal `src/features/departments/{departments.api.ts,
  departments.queries.ts}` (`getDepartments()`, `useDepartmentsQuery`),
  enough to power the "Add Department" selector later — Acceptance: AC12
- [x] location-crud.T03 — Build `src/features/locations/locations.api.ts`
  (`getLocations`, `getLocation`, `createLocation`, `updateLocation`,
  `setLocationStatus`, `addDepartmentMapping`, `removeDepartmentMapping`,
  `getLocationDepartments`) and `locations.queries.ts`
  (`useLocationsQuery`, `useLocationQuery`, `useLocationDepartmentsQuery`)
  — Acceptance: AC4, AC5, AC6
- [x] location-crud.T04 — Build `src/features/locations/locations.mutations.ts`
  (`useCreateLocationMutation`, `useUpdateLocationMutation`,
  `useSetLocationStatusMutation`, `useAddDepartmentMappingMutation`,
  `useRemoveDepartmentMappingMutation`) — Acceptance: AC1, AC7, AC9, AC11,
  AC12, AC14
- [x] location-crud.T05 — Build `src/screens/locations/LocationsListPage.tsx`
  + `components/LocationTable.tsx` with an active/inactive filter toggle
  — Acceptance: AC4, AC5
- [x] location-crud.T06 — Build
  `src/screens/locations/components/LocationFormModal.tsx` (create/edit
  form wired to the create/update mutations, inline
  `VALIDATION_ERROR`/`DUPLICATE_CODE` rendering) — Acceptance: AC1, AC2,
  AC3, AC7, AC8
- [x] location-crud.T07 — Build `src/screens/locations/LocationDetailPage.tsx`
  (fields, status, mapped Departments list) with deactivate/reactivate
  wired to `useSetLocationStatusMutation`, inline
  `LOCATION_HAS_ACTIVE_EMPLOYEES` on blocked deactivation — Acceptance:
  AC6, AC9, AC10, AC11
- [x] location-crud.T08 — Build
  `src/screens/locations/components/LocationDepartmentMappingPanel.tsx`
  (Add/Remove Department mapping UI, `useDepartmentsQuery` for selector
  options, mapping mutations, inline `MAPPING_ALREADY_EXISTS` on
  duplicate add) — Acceptance: AC12, AC13, AC14
- [x] location-crud.T09 — Build `src/app/locations/page.tsx` and
  `src/app/locations/[locationId]/page.tsx` (thin routes rendering
  `LocationsListPage`/`LocationDetailPage`) — Acceptance: AC4, AC6

## AC Coverage
AC1 T04, T06 · AC2 T06 · AC3 T06 · AC4 T03, T05, T09 · AC5 T03, T05 · AC6 T03, T07, T09 · AC7 T04, T06 · AC8 T06 · AC9 T04, T07 · AC10 T07 · AC11 T04, T07 · AC12 T02, T04, T08 · AC13 T08 · AC14 T04, T08 · AC15 T10, T11 · AC16 T10, T11 — all 16 covered.

## Revision (2026-09-04) — hard delete
User-directed change, adding a real "Delete" action alongside the existing Deactivate/Reactivate toggle.
- [x] location-crud.T10 — Add `variant?: "default" | "danger"` prop to the shared `src/components/ui/ConfirmDialog.tsx` (danger renders a red confirm button) — Acceptance: AC15, AC16
- [x] location-crud.T11 — Add `deleteLocation` to `locations.api.ts` and `useDeleteLocationMutation` to `locations.mutations.ts` (`DELETE /api/v1/locations/:id`); wire a "Delete" button + `ConfirmDialog variant="danger"` into `LocationDetailPage.tsx`, rendering `LOCATION_HAS_EMPLOYEES` inline and navigating to `/locations` on success — Acceptance: AC15, AC16
