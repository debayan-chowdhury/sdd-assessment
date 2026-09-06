# Plan: Role CRUD (UI)

> ⚠️ **Speculative draft.** `role-crud.spec.md` is currently
> `Changes Requested ⟲`, not `Approved`. This plan is drafted against the
> spec's current content at the user's explicit request, bypassing the
> standard Gate-1-before-plan gate. It is **not official** and must be
> re-derived (or at minimum re-checked) once the spec is revised and
> actually reaches `Approved`.

## Derived From
.ai-context/specs/role-crud.spec.md

## Architecture Approach
Assumes `admin-static-login`'s shared infra and `location-crud`'s shared
UI primitives (`DataTable`, `Modal`, `ConfirmDialog`, `StatusBadge`)
already exist and are reused as-is here, not recreated.

- **Feature-specific:**
  - `src/features/roles/roles.api.ts` — `getRoles(filters)`, `getRole(id)`,
    `createRole`, `updateRole`, `setRoleStatus`.
  - `src/features/roles/roles.queries.ts` — `useRolesQuery`,
    `useRoleQuery`. (Note: a minimal `useRolesQuery` was already pulled
    forward by `department-crud`'s plan for its "Enable Role" selector;
    this plan completes the full feature around that existing file rather
    than starting from nothing.)
  - `src/features/roles/roles.mutations.ts` — `useCreateRoleMutation`,
    `useUpdateRoleMutation`, `useSetRoleStatusMutation`.
  - `src/screens/roles/RolesListPage.tsx`, `RoleDetailPage.tsx`,
    `components/{RoleTable, RoleFormModal}.tsx` (a `category` select —
    `None`/`HR`/`Manager` — is part of `RoleFormModal`, not a separate
    component).
  - `src/app/roles/page.tsx`, `src/app/roles/[roleId]/page.tsx` — thin,
    render the two page components above.
- No cross-feature dependency for this plan's own screens — Role is a
  standalone global list (Department↔Role enablement lives in
  `department-crud`, not here). `employee-crud-mapping`'s plan will later
  depend on `useRolesQuery` from this feature for its Role selector.
- Integration points: backend `role-crud.API01`–`API05` per the spec's
  API Contract table — no new endpoint on this side.

## Data Model
No local datastore. Client-side shapes only:
- `src/types/role.ts` — `Role { id, name, code, isActive, category:
  'HR' | 'Manager' | null }`, `RoleInput { name, code, category: 'HR' |
  'Manager' | null }` (already referenced by `department-crud`'s plan;
  this plan is where the file is actually authored in full).

## Constitution Check
- [x] Test framework matches `constitution.md` — Vitest + React Testing
  Library for list/detail/form components and the mutation hooks.
- [ ] Test-first scope / coverage floor — **N/A, flagged gap in
  constitution.md itself**; not invented here.
- [ ] Employee-data logging rule — **N/A**, this feature only handles
  Role records, no Employee data.
- [ ] Auth baseline — **N/A to this plan directly**; consumed via the
  shared `AuthGuard`/Axios interceptor, not re-implemented here.
- [ ] Session expiry/logout/multi-admin — **N/A**, out of this feature's
  scope entirely.
- [x] No `middleware.ts` for access control — this feature's routes rely
  on the shared `AuthGuard`, not `middleware.ts`.
- [ ] Secrets/config via `.env` — **N/A**, no new secret/config value is
  introduced; reuses the shared Axios base URL.
- [x] No local datastore, backend REST `/api/v1` only — all Role data
  comes from `role-crud.API01`–`API05`; no datastore introduced.
- [x] Axios only, single shared instance — reuses `src/lib/axios.ts`; no
  new HTTP client.
- [x] TanStack Query only for server state — all Role data is held in
  query/mutation hooks, never local `useState`.
- [ ] Zustand for client state — **N/A**, no cross-component client state
  to hold beyond the shared auth store.
- [x] Thin route files — `src/app/roles/**/page.tsx` only import and
  render the matching `src/screens/roles/**` component.
- [x] No new library outside the approved set — none introduced.
- [ ] Non-Functional Baselines — **N/A, flagged gap in constitution.md
  itself**; not invented here.
- [x] Targets backend API `v1` — all calls target `/api/v1/roles/**`.
- [ ] Breaking-change/deprecation policy — **N/A, flagged gap in
  constitution.md itself**; not this plan's decision to make.

**Revised (2026-09-04, user-directed):** adds a "Delete" button + confirmation dialog (`variant="danger"`, added to the shared `ConfirmDialog.tsx` by location-crud.plan.md's own revision) to `RoleDetailPage.tsx`, wired to a new `useDeleteRoleMutation` calling `DELETE /api/v1/roles/:id`. On success, navigates to `/roles`; on `ROLE_HAS_EMPLOYEES`, shows an inline error.

## Explicitly Deferred
- Audit trail / change history display — spec's Explicitly Out of Scope.
- Bulk create/import of Roles — spec's Explicitly Out of Scope;
  single-record forms only.
- Pagination beyond the `isActive`/`category` filters — the backend
  contract has no pagination parameters to build against.
- Any UI to reassign Employees when a Role's `category` changes after
  Employees already hold mappings derived from it — the spec explicitly
  leaves this unresolved (mirroring the backend spec); this plan does not
  attempt to resolve it either. Flagged as a genuine open item for a
  future BRD entry, not a plan-stage decision.

## Sequencing
1. `src/types/role.ts` (formalizes the type `department-crud` already
   referenced minimally).
2. `src/features/roles/{roles.api.ts, roles.queries.ts,
   roles.mutations.ts}` — completed in full here (the read path was
   already partially stubbed by `department-crud`'s plan).
3. `src/screens/roles/{RolesListPage.tsx, RoleDetailPage.tsx,
   components/*}`.
4. `src/app/roles/page.tsx` + `src/app/roles/[roleId]/page.tsx`.
5. **Revision:** add `deleteRole`/`useDeleteRoleMutation`; wire "Delete" button + dialog into `RoleDetailPage.tsx`.
