# Tasks: Department CRUD (UI)

> ⚠️ **Speculative draft.** The linked spec is `Changes Requested ⟲` and
> the linked plan is unreviewed — this bypasses the standard
> Plan-Reviewed-before-tasks gate at the user's explicit request. Not
> official; must be re-derived once the spec/plan actually clear their
> gates.

## Derived From
.ai-context/plans/department-crud.plan.md

## Sequence
- [x] department-crud.T01 — Create `src/types/department.ts`
  (`Department`, `DepartmentInput`) and a minimal
  `src/features/roles/{roles.api.ts, roles.queries.ts}` (`getRoles()`,
  `useRolesQuery`), enough to power the "Enable Role" selector later —
  Acceptance: AC12
- [x] department-crud.T02 — Build `src/features/departments/departments.api.ts`
  (`getDepartments`, `getDepartment`, `createDepartment`,
  `updateDepartment`, `setDepartmentStatus`, `addRoleMapping`,
  `removeRoleMapping`, `getDepartmentRoles`) and
  `departments.queries.ts` (`useDepartmentsQuery`, `useDepartmentQuery`,
  `useDepartmentRolesQuery`) — Acceptance: AC4, AC5, AC6
- [x] department-crud.T03 — Build
  `src/features/departments/departments.mutations.ts`
  (`useCreateDepartmentMutation`, `useUpdateDepartmentMutation`,
  `useSetDepartmentStatusMutation`, `useAddRoleMappingMutation`,
  `useRemoveRoleMappingMutation`) — Acceptance: AC1, AC7, AC9, AC11, AC12,
  AC14
- [x] department-crud.T04 — Build
  `src/screens/departments/DepartmentsListPage.tsx` +
  `components/DepartmentTable.tsx` with an active/inactive filter toggle
  — Acceptance: AC4, AC5
- [x] department-crud.T05 — Build
  `src/screens/departments/components/DepartmentFormModal.tsx` (create/edit
  form wired to the create/update mutations, inline
  `VALIDATION_ERROR`/`DUPLICATE_CODE` rendering) — Acceptance: AC1, AC2,
  AC3, AC7, AC8
- [x] department-crud.T06 — Build
  `src/screens/departments/DepartmentDetailPage.tsx` (fields, status,
  enabled Roles with `category`) with deactivate/reactivate wired to
  `useSetDepartmentStatusMutation`, inline
  `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` on blocked deactivation — Acceptance:
  AC6, AC9, AC10, AC11
- [x] department-crud.T07 — Build
  `src/screens/departments/components/DepartmentRoleMappingPanel.tsx`
  (Enable/Disable Role mapping UI, `useRolesQuery` for selector options,
  mapping mutations, inline `MAPPING_ALREADY_EXISTS` on duplicate enable)
  — Acceptance: AC12, AC13, AC14
- [x] department-crud.T08 — Build `src/app/departments/page.tsx` and
  `src/app/departments/[departmentId]/page.tsx` (thin routes rendering
  `DepartmentsListPage`/`DepartmentDetailPage`) — Acceptance: AC4, AC6

## AC Coverage
AC1 T03, T05 · AC2 T05 · AC3 T05 · AC4 T02, T04, T08 · AC5 T02, T04 · AC6 T02, T06, T08 · AC7 T03, T05 · AC8 T05 · AC9 T03, T06 · AC10 T06 · AC11 T03, T06 · AC12 T01, T03, T07 · AC13 T07 · AC14 T03, T07 · AC15 T09 · AC16 T09 — all 16 covered.

## Revision (2026-09-04) — hard delete
User-directed change, adding a real "Delete" action alongside the existing Deactivate/Reactivate toggle. Reuses the `variant="danger"` prop added to `ConfirmDialog.tsx` by location-crud.T10.
- [x] department-crud.T09 — Add `deleteDepartment` to `departments.api.ts` and `useDeleteDepartmentMutation` to `departments.mutations.ts` (`DELETE /api/v1/departments/:id`); wire a "Delete" button + `ConfirmDialog variant="danger"` into `DepartmentDetailPage.tsx`, rendering `DEPARTMENT_HAS_EMPLOYEES` inline and navigating to `/departments` on success — Acceptance: AC15, AC16
