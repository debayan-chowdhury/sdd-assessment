# Plan: Transfer Request Option Lists

## Derived From
.ai-context/specs/employee-transfer/transfer-options.spec.md

## Architecture Approach
No new entity, no new collection — this plan adds a thin, read-only controller/route pair over the existing `Location`, `Department`, `Role`, and `Employee` models (all owned by the Admin Panel plans) and reuses transfer-request-submission.plan.md's `transferRequestWorkflow.service.js` helpers rather than reimplementing the HR/Manager staffing checks:

- `src/controllers/options.controller.js` — `listLocations`, `listDepartments`, `listRoles` handlers for transfer-options.API01–API03.
- `src/routes/options.routes.js` — mounted at `/api/v1/options`, gated by `employeeAuth.middleware.js` (portal-login-password-change.plan.md). A separate router from `transferRequest.routes.js` since this resource (`/options`) is conceptually distinct from `/transfer-requests`, even though both are consumed by the same form.
- `listDepartments` computes its HR/Manager staffing filter directly against `Employee`/`Role` (the same query shape as `resolveReceivingHr`/`findCandidateManagers` in `transferRequestWorkflow.service.js`), rather than importing those functions as-is — they return single-employee/candidate-list results scoped to one Department, while this endpoint needs a set of qualifying Department ids across all Departments at one Location. Duplicated query shape, not duplicated business rule: "qualifies" here means the same "active HR-category Employee exists" / "active Manager-category Employee exists" tests those functions already encode.

## Data Model
None owned here. Reads `Location`, `Department`, `Role` (admin-crud plans) and `Employee` (employee-crud-mapping.plan.md) as they exist.

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor.
- [x] Security Posture — no new PII; every endpoint sits behind `employeeAuth.middleware.js`, no public route.
- [x] Architectural Constraints — MongoDB via Mongoose (existing models only), REST only, no new datastore or messaging.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself; nothing to check this plan against.
- [x] Versioning Rules — `/api/v1/options` matches constitution.md's versioning scheme; new surface area, not a breaking change.

## Explicitly Deferred
- Making the Department filter configurable (e.g. an admin toggle for "require Manager too" vs. "HR only") — not requested; the HR+Manager rule is fixed per transfer-options.spec.md.
- Reusing/populating the Admin Panel's `LocationDepartment` mapping table instead of deriving from Employee staffing — spec's Flagged Gap explains why: the mapping exists but is unpopulated in this environment, so it isn't a usable source today. Revisit if the Admin Panel ever gets a workflow that populates it.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest).
1. `options.controller.js` — `listLocations` (active-only, sorted).
2. `options.controller.js` — `listRoles` (active-only, sorted, no Location/Department filter).
3. `options.controller.js` — `listDepartments` (`locationId` required, HR+Manager staffing filter, active-only, sorted).
4. `options.routes.js`, mounted at `/api/v1/options` in `src/app.js`, gated by `employeeAuth.middleware.js` — including the no-token 401 case.
5. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
