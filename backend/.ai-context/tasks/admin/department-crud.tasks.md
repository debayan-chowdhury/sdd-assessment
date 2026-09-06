# Tasks: Department CRUD

## Derived From
.ai-context/plans/admin/department-crud.plan.md

## Sequence
- [x] department-crud.T01 — Implement `Department` Mongoose model (`name`, `code` unique, `isActive`, timestamps) and `POST /api/v1/departments` create handler (validation, 201, 400 `VALIDATION_ERROR`, 409 `DUPLICATE_CODE`) in `department.controller.js` — test-first — Acceptance: AC1, AC2, AC3
- [x] department-crud.T02 — Implement `GET /api/v1/departments` (list, optional `isActive` filter) and `GET /api/v1/departments/:id` (get by id, 404 `NOT_FOUND`) handlers — test-first — Acceptance: AC4, AC5, AC6, AC7
- [x] department-crud.T03 — Implement `PUT /api/v1/departments/:id` update handler (validation, 404, 409 `DUPLICATE_CODE`) — test-first — Acceptance: AC8, AC9
- [x] department-crud.T04 — Implement `PATCH /api/v1/departments/:id/status` handler (deactivate/reactivate toggle), including the `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` guard. The guard queries the `employees` collection directly (`mongoose.connection.collection('employees').countDocuments(...)`), not via `require('../models/Employee')` — so it has no hard file dependency on employee-crud-mapping's model existing yet, and correctly returns 0 (allowing deactivation) until real Employee documents exist — test-first — Acceptance: AC10, AC11, AC12
- [x] department-crud.T05 — Implement `DepartmentRole` Mongoose model (`departmentId`, `roleId`, compound unique index) and `POST /api/v1/departments/:id/roles` create-mapping handler (201, 404, 409 `MAPPING_ALREADY_EXISTS`) — test-first — Acceptance: AC13, AC14
- [x] department-crud.T06 — Implement `DELETE /api/v1/departments/:id/roles/:roleId` (remove mapping, 204, 404) and `GET /api/v1/departments/:id/roles` (list enabled roles) handlers — test-first — Acceptance: AC15, AC16
- [x] department-crud.T07 — Implement `department.routes.js` wiring all handlers from T01–T06, gated by `adminAuth.middleware.js` (admin-static-login.T02), mounted at `/api/v1/departments` in `src/index.js` — test-first, including a no-token 401 case — Acceptance: AC17
- [x] department-crud.T08 — Confirm ≥80% line coverage for all code added in T01–T07, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC17 (coverage verification, not new behavior)

## Revision (2026-09-04) — real hard delete
User-directed change. Per department-crud.plan.md's Sequencing steps 8–9.
- [x] department-crud.T09 — Implement `remove` handler in `department.controller.js`: `DEPARTMENT_HAS_EMPLOYEES` guard (any Employee, active or inactive), cascade-delete `LocationDepartment` and `DepartmentRole` mappings, then delete the Department — test-first — Acceptance: AC18, AC19
- [x] department-crud.T10 — Add `DELETE /api/v1/departments/:id` to `department.routes.js` — test-first, including the no-token 401 case — Acceptance: AC18, AC19
