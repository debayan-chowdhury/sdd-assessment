# Tasks: Role CRUD (UI)

> ⚠️ **Speculative draft.** The linked spec is `Changes Requested ⟲` and
> the linked plan is unreviewed — this bypasses the standard
> Plan-Reviewed-before-tasks gate at the user's explicit request. Not
> official; must be re-derived once the spec/plan actually clear their
> gates.

## Derived From
.ai-context/plans/role-crud.plan.md

## Sequence
- [x] role-crud.T01 — Create `src/types/role.ts` (`Role` incl.
  `category: 'HR' | 'Manager' | null`, `RoleInput`) — Acceptance: AC1
- [x] role-crud.T02 — Build `src/features/roles/roles.api.ts` (full CRUD
  + status) and complete `src/features/roles/roles.queries.ts`
  (`useRolesQuery` with `isActive`/`category` filters, `useRoleQuery`) —
  completing the minimal stub `department-crud` pulled forward —
  Acceptance: AC7, AC8, AC9, AC10
- [x] role-crud.T03 — Build `src/features/roles/roles.mutations.ts`
  (`useCreateRoleMutation`, `useUpdateRoleMutation`,
  `useSetRoleStatusMutation`) — Acceptance: AC1, AC2, AC3, AC11, AC13,
  AC15
- [x] role-crud.T04 — Build `src/screens/roles/RolesListPage.tsx` +
  `components/RoleTable.tsx` with active/inactive and category filter
  controls — Acceptance: AC7, AC8, AC9
- [x] role-crud.T05 — Build
  `src/screens/roles/components/RoleFormModal.tsx` (create/edit form with a
  `category` select restricted to `None`/`HR`/`Manager`, wired to the
  create/update mutations, inline `VALIDATION_ERROR`/`DUPLICATE_CODE`
  rendering) — Acceptance: AC1, AC2, AC3, AC4, AC5, AC6, AC11, AC12
- [x] role-crud.T06 — Build `src/screens/roles/RoleDetailPage.tsx` (fields
  incl. `category`) with deactivate/reactivate wired to
  `useSetRoleStatusMutation`, inline `ROLE_HAS_ACTIVE_EMPLOYEES` on
  blocked deactivation — Acceptance: AC10, AC13, AC14, AC15
- [x] role-crud.T07 — Build `src/app/roles/page.tsx` and
  `src/app/roles/[roleId]/page.tsx` (thin routes rendering
  `RolesListPage`/`RoleDetailPage`) — Acceptance: AC7, AC10

## AC Coverage
AC1 T01, T03, T05 · AC2 T03, T05 · AC3 T03, T05 · AC4 T05 · AC5 T05 · AC6 T05 · AC7 T02, T04, T07 · AC8 T02, T04 · AC9 T02, T04 · AC10 T02, T06, T07 · AC11 T03, T05 · AC12 T05 · AC13 T03, T06 · AC14 T06 · AC15 T03, T06 · AC16 T08 · AC17 T08 — all 17 covered.

## Revision (2026-09-04) — hard delete
User-directed change, adding a real "Delete" action alongside the existing Deactivate/Reactivate toggle. Reuses the `variant="danger"` prop added to `ConfirmDialog.tsx` by location-crud.T10.
- [x] role-crud.T08 — Add `deleteRole` to `roles.api.ts` and `useDeleteRoleMutation` to `roles.mutations.ts` (`DELETE /api/v1/roles/:id`); wire a "Delete" button + `ConfirmDialog variant="danger"` into `RoleDetailPage.tsx`, rendering `ROLE_HAS_EMPLOYEES` inline and navigating to `/roles` on success — Acceptance: AC16, AC17
