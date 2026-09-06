# Tasks: Employee CRUD and Manager/HR Mapping (UI)

> ⚠️ **Speculative draft.** The linked spec is `Changes Requested ⟲` and
> the linked plan is unreviewed — this bypasses the standard
> Plan-Reviewed-before-tasks gate at the user's explicit request. Not
> official; must be re-derived once the spec/plan actually clear their
> gates. This feature's plan also carries an unresolved `## Open
> Questions` item (fallback-error rendering) — see T06 below.

## Derived From
.ai-context/plans/employee-crud-mapping.plan.md

## Sequence
- [x] employee-crud-mapping.T01 — Create `src/types/employee.ts`
  (`Employee`, `EmployeeInput`) — Acceptance: AC4
- [x] employee-crud-mapping.T02 — Build
  `src/features/employees/employees.api.ts` (CRUD + status) and
  `employees.queries.ts` (`useEmployeesQuery` with
  `isActive`/`locationId`/`departmentId`/`roleId` filters,
  `useEmployeeQuery`) — Acceptance: AC11, AC12
- [x] employee-crud-mapping.T03 — Build
  `src/features/employees/employees.mutations.ts`
  (`useCreateEmployeeMutation`, `useUpdateEmployeeMutation`,
  `useSetEmployeeStatusMutation`) — Acceptance: AC4, AC13, AC14, AC15
- [x] employee-crud-mapping.T04 — Build the Location→Department→Role
  cascading selects in
  `src/screens/employees/components/EmployeeMappingFields.tsx`, using
  `useLocationsQuery`/`useDepartmentsQuery`/`useDepartmentRolesQuery`
  (Role options scoped to the selected Department) — Acceptance: ~~AC9~~
  (removed by the v1.1 Revision below — see T15)
- [x] employee-crud-mapping.T05 — Add the conditional Manager/HR selector
  fields to `EmployeeMappingFields.tsx`: show both when the selected
  Role's `category` is `null`, only HR when `Manager`, neither when
  `HR`; scope each selector's options to Employees already in the
  selected Location+Department with the matching Role `category`
  (`useEmployeesQuery`, filtered) — Acceptance: AC1, AC2, AC3, AC8
- [x] employee-crud-mapping.T06 — Build
  `src/screens/employees/components/EmployeeFormModal.tsx` wiring
  `EmployeeMappingFields` + name/code inputs to the create/update
  mutations, rendering inline `VALIDATION_ERROR`, `MANAGER_REQUIRED`,
  `HR_REQUIRED`, `MAPPING_NOT_ALLOWED`, `DUPLICATE_CODE`, and — per the
  plan's Open Questions resolution — a generic inline banner for the
  fallback-only errors (`INVALID_MANAGER_ROLE`, `INVALID_HR_ROLE`,
  `MAPPING_SCOPE_MISMATCH`, and originally `ROLE_NOT_ENABLED_FOR_DEPARTMENT`
  — the latter removed by the v1.1 Revision below) —
  Acceptance: AC4, AC5, AC6, AC7, AC10 (AC9 removed, see T15)
- [x] employee-crud-mapping.T07 — Build
  `src/screens/employees/EmployeesListPage.tsx` +
  `components/EmployeeTable.tsx` with `isActive`/`locationId`/
  `departmentId`/`roleId` filter controls — Acceptance: AC11
- [x] employee-crud-mapping.T08 — Build
  `src/screens/employees/EmployeeDetailPage.tsx` (fields, status,
  Location/Department/Role, Manager/HR mapping) with deactivate/reactivate
  wired to `useSetEmployeeStatusMutation` — Acceptance: AC12, AC14, AC15
- [x] employee-crud-mapping.T09 — Build `src/app/employees/page.tsx` and
  `src/app/employees/[employeeId]/page.tsx` (thin routes rendering
  `EmployeesListPage`/`EmployeeDetailPage`) — Acceptance: AC11, AC12

## AC Coverage
AC1 T05 · AC2 T05 · AC3 T05 · AC4 T01, T03, T06 · AC5 T06 · AC6 T06 · AC7 T06 · AC8 T05 · ~~AC9~~ removed (v1.1) · AC10 T06 · AC11 T02, T07, T09 · AC12 T02, T08, T09 · AC13 T03 · AC14 T03, T08 · AC15 T03, T08 · AC16 T14 · AC17 T14 — 16 of 17 numbered ACs apply (AC9 removed); all covered.

## Revision (2026-09-04) — code removed, email/Admin-set password
User-directed change, tracking the backend's v1.3 amendment. T01–T09 above are unchanged and preserved as done, except their `code` references are now historical.
- [x] employee-crud-mapping.T10 — Update `src/types/employee.ts` (`code`→`email`; add `EmployeeCreateInput` with `password`, POST-only) and `employees.api.ts`'s `EmployeeDto`/`toEmployee` — Acceptance: AC4, AC7, AC10, AC12
- [x] employee-crud-mapping.T11 — Update `EmployeeFormModal.tsx`: rename the `code` field to `email`, add a `password` field shown only in create mode, split submit into create (`EmployeeCreateInput`)/update (`EmployeeInput`) paths, rename `codeError`/`DUPLICATE_CODE` handling to `emailError`/`DUPLICATE_EMAIL`, add `passwordError` for create-mode `VALIDATION_ERROR` — Acceptance: AC7, AC10
- [x] employee-crud-mapping.T12 — Update `EmployeeMappingFields.tsx` (Manager/HR option labels), `EmployeeTable.tsx` (Code column → Email), `EmployeeDetailPage.tsx` (Code field → Email) — Acceptance: AC12
- [x] employee-crud-mapping.T13 — Verify `tsc --noEmit`, `yarn lint`, `yarn build` all clean after T10–T12 — Acceptance: AC1–AC15 (verification, not new behavior)

## Revision (2026-09-04) — hard delete
User-directed change, adding a real "Delete" action alongside the existing Deactivate/Reactivate toggle. Reuses the `variant="danger"` prop added to `ConfirmDialog.tsx` by location-crud.T10.
- [x] employee-crud-mapping.T14 — Add `deleteEmployee` to `employees.api.ts` and `useDeleteEmployeeMutation` to `employees.mutations.ts` (`DELETE /api/v1/employees/:id`); wire a "Delete" button + `ConfirmDialog variant="danger"` into `EmployeeDetailPage.tsx` (add `getApiErrorCode` to its existing error-helper imports), rendering `EMPLOYEE_HAS_DEPENDENTS` inline and navigating to `/employees` on success — Acceptance: AC16, AC17

## v1.1 Revision (2026-09-04) — Role/Department enablement scoping removed
User-directed change, tracking the backend's v1.4 amendment. Root cause: after a full data reset, no `DepartmentRole` enablement mappings existed for any Department, leaving the Employee-creation Role dropdown empty for every Department. Resolution: Role and Department now carry no relation on this form.
- [x] employee-crud-mapping.T15 — In `EmployeeMappingFields.tsx`, replace `useDepartmentRolesQuery(departmentId)` with `useRolesQuery({ isActive: true })` (from `role-crud`'s `roles.queries.ts`) as the Role selector's option source; remove the Role `<select>`'s `disabled={!departmentId}` gating and its "Select a department first" placeholder (now always "Select a role…") — Acceptance: ~~AC9~~ (removed), verified via `tsc --noEmit`, `yarn lint`, `yarn build` (all clean)
