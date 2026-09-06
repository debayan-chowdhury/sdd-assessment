# Tasks: Employee CRUD and Manager/HR Mapping

## Derived From
.ai-context/plans/admin/employee-crud-mapping.plan.md

## Sequence
- [x] employee-crud-mapping.T01 — Implement `Employee` Mongoose model (`name`, `code` unique, `isActive`, `locationId`/`departmentId`/`roleId` refs, self-referencing `managerId`/`hrId`, timestamps) and `employeeMapping.service.js` role-category-requirement validation: a regular Employee (Role `category: null`) requires both `managerId` and `hrId`; a `Manager`-category Employee requires only `hrId`; an `HR`-category Employee requires neither and rejects either being provided — test-first — Acceptance: AC1, AC2, AC3, AC4, AC5, AC6
- [x] employee-crud-mapping.T02 — Extend `employeeMapping.service.js`: `managerId`/`hrId` existence checks (404 `MANAGER_NOT_FOUND`/`HR_NOT_FOUND`), role-category correctness of the referenced Employee (400 `INVALID_MANAGER_ROLE`/`INVALID_HR_ROLE`), and Location+Department scope match (400 `MAPPING_SCOPE_MISMATCH`) — test-first — Acceptance: AC7, AC8, AC9, AC10
- [x] employee-crud-mapping.T03 — Extend `employeeMapping.service.js`: `roleId` must be enabled for `departmentId` per the `DepartmentRole` join collection (409 `ROLE_NOT_ENABLED_FOR_DEPARTMENT`) — test-first — Acceptance: ~~AC11~~ (removed by the v1.4 Revision below — see T19)
- [x] employee-crud-mapping.T04 — Implement `POST /api/v1/employees` create handler in `employee.controller.js`, wiring `employeeMapping.service.js` (T01–T03) and adding the duplicate-`code` check (409 `DUPLICATE_CODE`) — test-first, exercising T01–T03's validation end to end through the handler — Acceptance: AC1–AC12
- [x] employee-crud-mapping.T05 — Implement `PUT /api/v1/employees/:id` update handler, applying the same `employeeMapping.service.js` validation as create — test-first — Acceptance: AC15
- [x] employee-crud-mapping.T06 — Implement `GET /api/v1/employees` (list, `isActive`/`locationId`/`departmentId`/`roleId` filters) and `GET /api/v1/employees/:id` (get by id, 404 `NOT_FOUND`) handlers — test-first — Acceptance: AC13, AC14
- [x] employee-crud-mapping.T07 — Implement `PATCH /api/v1/employees/:id/status` handler (deactivate/reactivate toggle, soft-delete only per the Gate 1-ratified `isActive` resolution) — test-first — Acceptance: AC16, AC17
- [x] employee-crud-mapping.T08 — Implement `employee.routes.js` wiring all handlers from T04–T07, gated by `adminAuth.middleware.js` (admin-static-login.T02), mounted at `/api/v1/employees` in `src/index.js` — test-first, including a no-token 401 case — Acceptance: AC18
- [x] employee-crud-mapping.T09 — Confirm ≥80% line coverage for all code added in T01–T08, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC18 (coverage verification, not new behavior)

## Note
Per the plan's Sequencing step 8: once T01 lands (the `Employee` model and its collection exist), `LOCATION_HAS_ACTIVE_EMPLOYEES` / `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` / `ROLE_HAS_ACTIVE_EMPLOYEES` in location-crud.T04 / department-crud.T04 / role-crud.T04 become live against real data. No code change is needed in those tasks for this — their guards already query the `employees` collection directly — so this is not a new task here, only a build-order note.

## v1.2 Revision (2026-09-03) — Portal login credentials
Per employee-crud-mapping.plan.md's Sequencing steps 9–12. T01–T09 above are unchanged and preserved as `Merged`. Depends on role-crud.T07 (v1.1) landing first only in the sense of build order stated in role-crud.plan.md — no direct code dependency.
- [x] employee-crud-mapping.T10 — Add `bcryptjs` dependency; add `passwordHash` (`select: false`) and `mustChangePassword` (default `true`) fields to the `Employee` schema; implement `src/utils/generatePassword.js` (random-string generator, no complexity rule) — test-first, covering the schema fields' defaults and the generator's output shape — Acceptance: AC19
- [x] employee-crud-mapping.T11 — Wire `generatePassword.js` + `bcryptjs.hash` into `employee.controller.js`'s create handler: generate a password, hash it into `passwordHash` before save, return the plaintext once as `temporaryPassword` in the 201 response, never persist the plaintext — test-first — Acceptance: AC19
- [x] employee-crud-mapping.T12 — Verify `passwordHash` and `temporaryPassword` are absent from every other response in this spec (GET list, GET by id, PUT) — test-first, explicit assertions beyond what `select: false` alone structurally guarantees — Acceptance: AC20
- [x] employee-crud-mapping.T13 — Confirm ≥80% line coverage for T10–T12, per constitution.md's Testing Discipline floor — Acceptance: AC19, AC20 (coverage verification, not new behavior)

## v1.3 Revision (2026-09-04) — code removed, email/Admin-set password
User-directed change. Per employee-crud-mapping.plan.md's Sequencing steps 13–16. T01–T13 above are unchanged and preserved as `Merged`, except their `code` references are now historical — the field no longer exists.
- [x] employee-crud-mapping.T14 — Remove `code` from the `Employee` schema; add `email` (`required`, `unique`, `lowercase`); drop the stale `code_1` index from dev/test databases — test-first — Acceptance: AC1–AC20 (schema shape underlying all of them)
- [x] employee-crud-mapping.T15 — Delete `src/utils/generatePassword.js`; update `employee.controller.js`'s create handler to accept Admin-supplied `email`/`password` (hash `password` into `passwordHash`, no `temporaryPassword` in the response); update the update handler to use `email` — test-first — Acceptance: AC1–AC3, AC12, AC15, AC19, AC20
- [x] employee-crud-mapping.T16 — Confirm ≥80% line coverage for T14–T15, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC20 (coverage verification, not new behavior)

## Note
T14 requires a manual `db.employees.dropIndex('code_1')` against any environment with existing Employee data (Mongoose's `autoIndex` adds new indexes but never drops stale ones) — done for this project's dev/test databases when v1.3 landed. The pre-v1.2 seeded India Internal-Transfer demo employees (32 records) have neither `email` nor `passwordHash` and cannot log in or be found by email until each is re-saved via PUT with a real `email` — same pre-existing backfill gap as T13, now compounded.

## Revision (2026-09-04) — real hard delete
User-directed change. Per employee-crud-mapping.plan.md's Sequencing steps 16–17.
- [x] employee-crud-mapping.T17 — Implement `remove` handler in `employee.controller.js`: `EMPLOYEE_HAS_DEPENDENTS` guard (any other Employee referencing this one as `managerId` or `hrId`), then delete the Employee — test-first — Acceptance: AC21, AC22
- [x] employee-crud-mapping.T18 — Add `DELETE /api/v1/employees/:id` to `employee.routes.js` — test-first, including the no-token 401 case — Acceptance: AC21, AC22

## v1.4 Revision (2026-09-04) — Role/Department enablement check removed
User-directed change. Per employee-crud-mapping.plan.md's Sequencing step 19. Root cause: after a full data reset, no `DepartmentRole` enablement mappings existed for any Department, leaving the Admin Panel's Employee-creation Role selector empty. Resolution: Role and Department now carry no relation in Employee mapping.
- [x] employee-crud-mapping.T19 — Remove `validateDepartmentRoleEnablement` and its call site from `employeeMapping.service.js`, plus the now-unused `DepartmentRole` import; remove the `ROLE_NOT_ENABLED_FOR_DEPARTMENT` 409 case from `employee.routes.js`'s Swagger docs (POST/PUT); remove the now-superseded AC11/UT11 test coverage (and the `DepartmentRole` seeding it required) from `employeeMapping.service.test.js`, `employee.controller.test.js`, and `employee.routes.test.js` — Acceptance: ~~AC11~~ (removed), verified via the full suite (218/218 passing)
