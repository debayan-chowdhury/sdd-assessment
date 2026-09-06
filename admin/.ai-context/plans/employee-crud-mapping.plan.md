# Plan: Employee CRUD and Manager/HR Mapping (UI)

> ⚠️ **Speculative draft.** `employee-crud-mapping.spec.md` is currently
> `Changes Requested ⟲`, not `Approved`. This plan is drafted against the
> spec's current content at the user's explicit request, bypassing the
> standard Gate-1-before-plan gate. It is **not official** and must be
> re-derived (or at minimum re-checked) once the spec is revised and
> actually reaches `Approved`.

## Derived From
.ai-context/specs/employee-crud-mapping.spec.md

## Architecture Approach
Assumes `admin-static-login`'s shared infra, `location-crud`'s shared UI
primitives, and all three of `location-crud`/`department-crud`/
`role-crud`'s query hooks (`useLocationsQuery`, `useDepartmentsQuery`,
`useRolesQuery`) already exist and are reused as-is here.

- **Feature-specific:**
  - `src/features/employees/employees.api.ts` — `getEmployees(filters)`,
    `getEmployee(id)`, `createEmployee`, `updateEmployee`,
    `setEmployeeStatus`.
  - `src/features/employees/employees.queries.ts` — `useEmployeesQuery`,
    `useEmployeeQuery`. Also used internally by the form to source
    Manager/HR selector options: employees are filtered client-side (or via
    the same `locationId`/`departmentId` query params) to Employees already
    in the selected Location+Department whose Role `category` matches
    `Manager`/`HR` respectively (per spec Context and AC8).
  - `src/features/employees/employees.mutations.ts` —
    `useCreateEmployeeMutation`, `useUpdateEmployeeMutation`,
    `useSetEmployeeStatusMutation`.
  - `src/screens/employees/EmployeesListPage.tsx`, `EmployeeDetailPage.tsx`,
    `components/{EmployeeTable, EmployeeFormModal,
    EmployeeMappingFields}.tsx` — `EmployeeMappingFields` is the
    conditional Location/Department/Role + Manager/HR subform driving spec
    AC1–AC3's field-visibility rules.
  - `src/app/employees/page.tsx`,
    `src/app/employees/[employeeId]/page.tsx` — thin, render the two page
    components above.
- Cross-feature dependency: the Role-select in `EmployeeMappingFields`
  sources its options from `role-crud`'s `useRolesQuery({ isActive: true
  })` — **not** scoped by the selected Department as of the v1.1 revision
  below (see that note for why).
- Integration points: backend `employee-crud-mapping.API01`–`API05` per
  the spec's API Contract table — no new endpoint on this side.

## Data Model
No local datastore. Client-side shapes only:
- `src/types/employee.ts` —
  `Employee { id, name, email, isActive, locationId, departmentId, roleId,
  managerId: string | null, hrId: string | null, mustChangePassword? }`,
  `EmployeeInput` (same shape minus `id`/`isActive`/`mustChangePassword`,
  used for both display-mapping and PUT), `EmployeeCreateInput` (
  `EmployeeInput & { password: string }`, POST only — the edit form never
  collects or sends a password field).
- Reuses `src/types/location.ts`, `department.ts`, `role.ts` for the
  mapping selectors — all owned by their respective plans, not redefined
  here.

**Amended (2026-09-04):** user-directed change, tracking the backend's
v1.3 amendment. `code` → `email` throughout; `EmployeeCreateInput` added
as a POST-only superset of `EmployeeInput` carrying `password`, since the
backend's PUT endpoint never accepts credentials.

## Constitution Check
- [x] Test framework matches `constitution.md` — Vitest + React Testing
  Library for list/detail/form components (including the conditional
  field-visibility logic in `EmployeeMappingFields`) and the mutation
  hooks.
- [ ] Test-first scope / coverage floor — **N/A, flagged gap in
  constitution.md itself**; not invented here.
- [x] Employee-data logging rule — **applies directly**: this is the
  feature that handles the sensitive-data category named in
  `constitution.md` → Security Posture. Plan commits to no
  `console.log`/error-boundary dump of Employee objects in production
  builds; error boundaries render a generic message only.
- [ ] Auth baseline — **N/A to this plan directly**; consumed via the
  shared `AuthGuard`/Axios interceptor, not re-implemented here.
- [ ] Session expiry/logout/multi-admin — **N/A**, out of this feature's
  scope entirely.
- [x] No `middleware.ts` for access control — this feature's routes rely
  on the shared `AuthGuard`, not `middleware.ts`.
- [ ] Secrets/config via `.env` — **N/A**, no new secret/config value is
  introduced; reuses the shared Axios base URL.
- [x] No local datastore, backend REST `/api/v1` only — all Employee data
  comes from `employee-crud-mapping.API01`–`API05`; no datastore
  introduced.
- [x] Axios only, single shared instance — reuses `src/lib/axios.ts`; no
  new HTTP client.
- [x] TanStack Query only for server state — Employee data and every
  cross-entity selector (Location/Department/Role/Manager/HR options) is
  held in query hooks, never local `useState`.
- [ ] Zustand for client state — **N/A**, no cross-component client state
  to hold beyond the shared auth store; the form's own field-visibility
  state is local component state (not cross-component), which is the
  correct tool here, not a Zustand-store violation.
- [x] Thin route files — `src/app/employees/**/page.tsx` only import and
  render the matching `src/screens/employees/**` component.
- [x] No new library outside the approved set — none introduced.
- [ ] Non-Functional Baselines — **N/A, flagged gap in constitution.md
  itself**; not invented here.
- [x] Targets backend API `v1` — all calls target `/api/v1/employees/**`.
- [ ] Breaking-change/deprecation policy — **N/A, flagged gap in
  constitution.md itself**; not this plan's decision to make.

**Revised (2026-09-04, user-directed):** adds a "Delete" button + confirmation dialog (`variant="danger"`, added to the shared `ConfirmDialog.tsx` by location-crud.plan.md's own revision) to `EmployeeDetailPage.tsx`, wired to a new `useDeleteEmployeeMutation` calling `DELETE /api/v1/employees/:id`. On success, navigates to `/employees`; on `EMPLOYEE_HAS_DEPENDENTS`, shows an inline error.

**Revised (v1.1, 2026-09-04, user-directed):** `EmployeeMappingFields.tsx`'s
Role selector no longer scopes its options to Roles enabled for the
selected Department. It now sources from `role-crud`'s `useRolesQuery({
isActive: true })` directly (replacing `useDepartmentRolesQuery
(departmentId)`), tracking the backend's v1.4 amendment. Root cause: after
a full data reset, no Department↔Role enablement mappings existed for any
Department, leaving this selector empty for every Department. The Role
`<select>` is also no longer `disabled` while no Department is chosen —
it's independently selectable now. `department-crud`'s
`useDepartmentRolesQuery`/`DepartmentRoleMappingPanel.tsx` are unaffected —
that feature still exists on the Department detail screen, it's just no
longer consumed here.

## Explicitly Deferred
- Audit trail / change history display — spec's Explicitly Out of Scope.
- Bulk import/export of Employees or mappings — spec's Explicitly Out of
  Scope; single-record-at-a-time forms only.
- Employee-facing login/authentication UI — no such feature exists
  anywhere in this system.
- Any UI reflecting cascading effects when an Employee referenced as
  another's `managerId`/`hrId` is deactivated or has their Role/Department
  changed — the spec explicitly leaves this unresolved (mirroring the
  backend spec); this plan does not attempt to resolve it either. Flagged
  as a genuine open item for a future BRD entry, not a plan-stage
  decision.
- Pagination beyond the listed filter query params — the backend contract
  has no pagination parameters to build against.

## Sequencing
1. `src/types/employee.ts`.
2. `src/features/employees/{employees.api.ts, employees.queries.ts,
   employees.mutations.ts}`.
3. `EmployeeMappingFields` subform — build the Location, Department, and
   Role selects first (reusing `useLocationsQuery`, `useDepartmentsQuery`,
   `useRolesQuery`), since the Manager/HR field-visibility logic (AC1–AC3)
   depends on knowing the selected Role's `category` before it can decide
   which of the two remaining fields to show.
4. Manager/HR selectors within `EmployeeMappingFields`, scoped to
   Employees in the selected Location+Department with the matching Role
   `category` (`useEmployeesQuery` filtered client-side).
5. `src/screens/employees/{EmployeesListPage.tsx, EmployeeDetailPage.tsx,
   components/{EmployeeTable, EmployeeFormModal}.tsx}`.
6. `src/app/employees/page.tsx` +
   `src/app/employees/[employeeId]/page.tsx`.
7. **Revision:** add `deleteEmployee`/`useDeleteEmployeeMutation`; wire "Delete" button + dialog into `EmployeeDetailPage.tsx`.
8. **v1.1 revision:** replace `useDepartmentRolesQuery(departmentId)` with `useRolesQuery({ isActive: true })` in `EmployeeMappingFields.tsx`; remove the Role `<select>`'s `disabled={!departmentId}` gating and its "Select a department first" placeholder text.

## Open Questions
- The spec's AC8 describes `INVALID_MANAGER_ROLE`/`INVALID_HR_ROLE`/
  `MAPPING_SCOPE_MISMATCH` as "unreachable through normal UI interaction"
  because selectors are pre-scoped, but still requires an inline fallback
  rendering if the API rejects a stale submission. This plan builds that
  fallback as a generic inline error banner reading the API's
  `error.message` directly, since the spec doesn't specify per-field
  placement for these fallback-only errors. Flagging this as an actual
  open question for the spec author to confirm or refine at the next
  Gate 1 revision, not a silent assumption. (AC9's equivalent
  `ROLE_NOT_ENABLED_FOR_DEPARTMENT` fallback was removed by the v1.1
  revision above — no longer applicable.)
