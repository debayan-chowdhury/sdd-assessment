# Tasks: Role CRUD

## Derived From
.ai-context/plans/admin/role-crud.plan.md

## Sequence
- [x] role-crud.T01 — Implement `Role` Mongoose model (`name`, `code` unique, `isActive`, `category` enum `['HR', 'Manager', null]`, timestamps) and `POST /api/v1/roles` create handler, covering all creation branches (no category, `category: "Manager"`, `category: "HR"`, invalid category value, missing required fields, duplicate code) — test-first — Acceptance: AC1, AC2, AC3, AC4, AC5, AC6
- [x] role-crud.T02 — Implement `GET /api/v1/roles` (list, optional `isActive` and `category` filters) and `GET /api/v1/roles/:id` (get by id, 404 `NOT_FOUND`) handlers — test-first — Acceptance: AC7, AC8, AC9, AC10, AC11
- [x] role-crud.T03 — Implement `PUT /api/v1/roles/:id` update handler (name/code/category, validation, 404, 409 `DUPLICATE_CODE`) — test-first — Acceptance: AC12, AC13
- [x] role-crud.T04 — Implement `PATCH /api/v1/roles/:id/status` handler (deactivate/reactivate toggle), including the `ROLE_HAS_ACTIVE_EMPLOYEES` guard. The guard queries the `employees` collection directly (`mongoose.connection.collection('employees').countDocuments(...)`), not via `require('../models/Employee')` — so it has no hard file dependency on employee-crud-mapping's model existing yet, and correctly returns 0 (allowing deactivation) until real Employee documents exist — test-first — Acceptance: AC14, AC15, AC16
- [x] role-crud.T05 — Implement `role.routes.js` wiring all handlers from T01–T04, gated by `adminAuth.middleware.js` (admin-static-login.T02), mounted at `/api/v1/roles` in `src/index.js` — test-first, including a no-token 401 case — Acceptance: AC17
- [x] role-crud.T06 — Confirm ≥80% line coverage for all code added in T01–T05, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC17 (coverage verification, not new behavior)

## v1.1 Revision (2026-09-03) — Payroll/IT/Facilities category enum widening
Per role-crud.plan.md's Sequencing step 6. T01–T06 above are unchanged and preserved as `Merged`.
- [x] role-crud.T07 — Widen the `Role` schema's `category` enum from `['HR', 'Manager', null]` to `['HR', 'Manager', 'Payroll', 'IT', 'Facilities', null]`; update `INVALID_CATEGORY` validation in `role.controller.js`'s create/update handlers accordingly — test-first, covering creation with each of the three new category values and continued rejection of an invalid value — Acceptance: AC18

## Revision (2026-09-04) — real hard delete
User-directed change. Per role-crud.plan.md's Sequencing steps 7–8.
- [x] role-crud.T08 — Implement `remove` handler in `role.controller.js`: `ROLE_HAS_EMPLOYEES` guard (any Employee, active or inactive), cascade-delete `DepartmentRole` mappings, then delete the Role — test-first — Acceptance: AC19, AC20
- [x] role-crud.T09 — Add `DELETE /api/v1/roles/:id` to `role.routes.js` — test-first, including the no-token 401 case — Acceptance: AC19, AC20
