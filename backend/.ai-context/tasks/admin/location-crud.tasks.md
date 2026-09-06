# Tasks: Location CRUD

## Derived From
.ai-context/plans/admin/location-crud.plan.md

## Sequence
- [x] location-crud.T01 — Implement `Location` Mongoose model (`name`, `code` unique, `isActive`, timestamps) and `POST /api/v1/locations` create handler (validation, 201, 400 `VALIDATION_ERROR`, 409 `DUPLICATE_CODE`) in `location.controller.js` — test-first — Acceptance: AC1, AC2, AC3
- [x] location-crud.T02 — Implement `GET /api/v1/locations` (list, optional `isActive` filter) and `GET /api/v1/locations/:id` (get by id, 404 `NOT_FOUND`) handlers — test-first — Acceptance: AC4, AC5, AC6, AC7
- [x] location-crud.T03 — Implement `PUT /api/v1/locations/:id` update handler (validation, 404, 409 `DUPLICATE_CODE`) — test-first — Acceptance: AC8, AC9
- [x] location-crud.T04 — Implement `PATCH /api/v1/locations/:id/status` handler (deactivate/reactivate toggle), including the `LOCATION_HAS_ACTIVE_EMPLOYEES` guard. The guard queries the `employees` collection directly (`mongoose.connection.collection('employees').countDocuments(...)`), not via `require('../models/Employee')` — so it has no hard file dependency on employee-crud-mapping's model existing yet, and correctly returns 0 (allowing deactivation) until real Employee documents exist — test-first — Acceptance: AC10, AC11, AC12
- [x] location-crud.T05 — Implement `LocationDepartment` Mongoose model (`locationId`, `departmentId`, compound unique index) and `POST /api/v1/locations/:id/departments` create-mapping handler (201, 404, 409 `MAPPING_ALREADY_EXISTS`) — test-first — Acceptance: AC13, AC14
- [x] location-crud.T06 — Implement `DELETE /api/v1/locations/:id/departments/:departmentId` (remove mapping, 204, 404) and `GET /api/v1/locations/:id/departments` (list mapped departments) handlers — test-first — Acceptance: AC15, AC16
- [x] location-crud.T07 — Implement `location.routes.js` wiring all handlers from T01–T06, gated by `adminAuth.middleware.js` (admin-static-login.T02), mounted at `/api/v1/locations` in `src/index.js` — test-first, including a no-token 401 case — Acceptance: AC17
- [x] location-crud.T08 — Confirm ≥80% line coverage for all code added in T01–T07, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC17 (coverage verification, not new behavior)

## Revision (2026-09-04) — real hard delete
User-directed change. Per location-crud.plan.md's Sequencing steps 8–9.
- [x] location-crud.T09 — Implement `remove` handler in `location.controller.js`: `LOCATION_HAS_EMPLOYEES` guard (any Employee, active or inactive), cascade-delete `LocationDepartment` mappings, then delete the Location — test-first — Acceptance: AC18, AC19
- [x] location-crud.T10 — Add `DELETE /api/v1/locations/:id` to `location.routes.js` — test-first, including the no-token 401 case — Acceptance: AC18, AC19
