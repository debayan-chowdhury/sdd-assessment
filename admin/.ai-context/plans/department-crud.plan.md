# Plan: Department CRUD (UI)

> ⚠️ **Speculative draft.** `department-crud.spec.md` is currently
> `Changes Requested ⟲`, not `Approved`. This plan is drafted against the
> spec's current content at the user's explicit request, bypassing the
> standard Gate-1-before-plan gate. It is **not official** and must be
> re-derived (or at minimum re-checked) once the spec is revised and
> actually reaches `Approved`.

## Derived From
.ai-context/specs/department-crud.spec.md

## Architecture Approach
Assumes `admin-static-login`'s shared infra (`axios.ts`, `queryClient.ts`,
`AuthGuard`) and `location-crud`'s shared UI primitives
(`components/ui/{DataTable, Modal, ConfirmDialog, StatusBadge}`) already
exist and are reused as-is here, not recreated.

- **Feature-specific:**
  - `src/features/departments/departments.api.ts` —
    `getDepartments(filters)`, `getDepartment(id)`, `createDepartment`,
    `updateDepartment`, `setDepartmentStatus`, `addRoleMapping`,
    `removeRoleMapping`, `getDepartmentRoles(id)`.
  - `src/features/departments/departments.queries.ts` —
    `useDepartmentsQuery`, `useDepartmentQuery`, `useDepartmentRolesQuery`.
    (Note: `useDepartmentsQuery`/`departments.api.ts`'s `getDepartments`
    were already pulled forward, minimally, by `location-crud`'s plan for
    its Department selector — this plan completes the full feature around
    that existing file rather than starting from nothing.)
  - `src/features/departments/departments.mutations.ts` —
    `useCreateDepartmentMutation`, `useUpdateDepartmentMutation`,
    `useSetDepartmentStatusMutation`, `useAddRoleMappingMutation`,
    `useRemoveRoleMappingMutation`.
  - `src/screens/departments/DepartmentsListPage.tsx`,
    `DepartmentDetailPage.tsx`, `components/{DepartmentTable,
    DepartmentFormModal, DepartmentRoleMappingPanel}.tsx`.
  - `src/app/departments/page.tsx`,
    `src/app/departments/[departmentId]/page.tsx` — thin, render the two
    page components above.
- **Cross-feature dependency:** the "Enable Role" control needs a list of
  Roles to select from. This plan depends on a minimal `useRolesQuery`
  read hook existing (from `role-crud`'s data layer) — see Sequencing.
- Integration points: backend `department-crud.API01`–`API08` per the
  spec's API Contract table — no new endpoint on this side.

## Data Model
No local datastore. Client-side shapes only:
- `src/types/department.ts` — `Department { id, name, code, isActive }`,
  `DepartmentInput { name, code }` (already referenced by `location-crud`'s
  plan; this plan is where the file is actually authored in full).
- Reuses `src/types/role.ts` (`Role`, including `category`) for the
  enabled/available Role lists — owned by `role-crud`'s plan, not
  redefined here.

## Constitution Check
- [x] Test framework matches `constitution.md` — Vitest + React Testing
  Library for list/detail/form components and the mutation hooks.
- [ ] Test-first scope / coverage floor — **N/A, flagged gap in
  constitution.md itself**; not invented here.
- [ ] Employee-data logging rule — **N/A**, this feature only handles
  Department records, no Employee data.
- [ ] Auth baseline — **N/A to this plan directly**; consumed via the
  shared `AuthGuard`/Axios interceptor, not re-implemented here.
- [ ] Session expiry/logout/multi-admin — **N/A**, out of this feature's
  scope entirely.
- [x] No `middleware.ts` for access control — this feature's routes rely
  on the shared `AuthGuard`, not `middleware.ts`.
- [ ] Secrets/config via `.env` — **N/A**, no new secret/config value is
  introduced; reuses the shared Axios base URL.
- [x] No local datastore, backend REST `/api/v1` only — all Department
  data comes from `department-crud.API01`–`API08`; no datastore
  introduced.
- [x] Axios only, single shared instance — reuses `src/lib/axios.ts`; no
  new HTTP client.
- [x] TanStack Query only for server state — all Department and enabled-
  Role data is held in query/mutation hooks, never local `useState`.
- [ ] Zustand for client state — **N/A**, no cross-component client state
  to hold beyond the shared auth store.
- [x] Thin route files — `src/app/departments/**/page.tsx` only import
  and render the matching `src/screens/departments/**` component.
- [x] No new library outside the approved set — none introduced.
- [ ] Non-Functional Baselines — **N/A, flagged gap in constitution.md
  itself**; not invented here.
- [x] Targets backend API `v1` — all calls target `/api/v1/departments/**`.
- [ ] Breaking-change/deprecation policy — **N/A, flagged gap in
  constitution.md itself**; not this plan's decision to make.

**Revised (2026-09-04, user-directed):** adds a "Delete" button + confirmation dialog (`variant="danger"`, added to the shared `ConfirmDialog.tsx` by location-crud.plan.md's own revision) to `DepartmentDetailPage.tsx`, wired to a new `useDeleteDepartmentMutation` calling `DELETE /api/v1/departments/:id`. On success, navigates to `/departments`; on `DEPARTMENT_HAS_EMPLOYEES`, shows an inline error.

## Explicitly Deferred
- Audit trail / change history display — spec's Explicitly Out of Scope.
- Bulk create/import of Departments or mappings — spec's Explicitly Out
  of Scope; single-record forms only.
- Pagination beyond the `isActive` filter — the backend contract has no
  pagination parameters to build against.
- Creating/editing Role records from this screen — Roles are only
  selected here; authored in `role-crud`.

## Sequencing
1. `src/types/department.ts` (formalizes the type `location-crud` already
   referenced minimally).
2. A minimal `src/features/roles/roles.queries.ts` read hook
   (`useRolesQuery`) — pulled forward from `role-crud`'s plan just far
   enough to power the "Enable Role" selector; the full Role CRUD screens
   don't need to exist yet.
3. `src/features/departments/{departments.api.ts, departments.queries.ts,
   departments.mutations.ts}` — completed in full here (the read path was
   already partially stubbed by `location-crud`'s plan).
4. `src/screens/departments/{DepartmentsListPage.tsx, DepartmentDetailPage.tsx,
   components/*}`.
5. `src/app/departments/page.tsx` +
   `src/app/departments/[departmentId]/page.tsx`.
6. **Revision:** add `deleteDepartment`/`useDeleteDepartmentMutation`; wire "Delete" button + dialog into `DepartmentDetailPage.tsx`.
