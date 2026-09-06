# Plan: Employee CRUD and Manager/HR Mapping

## Derived From
.ai-context/specs/admin/employee-crud-mapping.spec.md

## Architecture Approach
Same layering as the other four plans in this batch. Because this spec's validation chain (department-role enablement, manager/HR existence + role category + Location+Department scope match) is substantial business logic, it is pulled out of the controller into a dedicated service module, per `.agent/rules/int-standards.node.md`'s "keep functions small and modular" and "controllers orchestrate" guidance:

New modules:
- `src/models/Employee.js` — Mongoose model.
- `src/services/employeeMapping.service.js` — validates `locationId`/`departmentId`/`roleId`/`managerId`/`hrId` on create and update (employee-crud-mapping.AC1–AC12), called by the controller; returns a typed validation error the controller maps to the correct HTTP status/code.
- `src/controllers/employee.controller.js` — handlers for employee-crud-mapping.API01–API05, delegating validation to `employeeMapping.service.js`.
- `src/routes/employee.routes.js` — mounted at `/api/v1/employees`, gated by `adminAuth.middleware.js` (admin-static-login.plan.md).

This plan runs last in the batch because it's the only one that reads from all four other specs' collections (`Location`, `Department`, `Role`, `DepartmentRole`) — those models must exist first.

**Revised (v1.2, 2026-09-03):** adds portal login credential provisioning, per employee-crud-mapping.spec.md's v1.2 amendment. `bcryptjs` (or `bcrypt` — see Open Questions) is added as a dependency for hashing. A new `src/utils/generatePassword.js` helper produces the one-time `temporaryPassword` at creation (a random string; no complexity rule applies, per the spec). `employee.controller.js`'s create handler hashes it into `passwordHash` before saving and returns the plaintext `temporaryPassword` once in the response only. No new module owns "login" itself — that's portal-login-password-change.plan.md, which depends on the `passwordHash`/`mustChangePassword` fields landing here first.

**Revised (v1.3, 2026-09-04):** user-directed change, per employee-crud-mapping.spec.md's v1.3 amendment. `code` removed from the `Employee` schema; `email` replaces it as the unique identifier. `generatePassword.js` is deleted — the Admin now supplies `password` directly in the create request, hashed into `passwordHash` the same way; `temporaryPassword` is removed from the create response entirely (nothing to return once the Admin already knows the password they set). No architectural changes beyond the field swap — same model, same controller, same service.

## Open Questions
- **bcrypt library choice:** neither the spec nor constitution.md names a specific bcrypt package. This plan assumes `bcryptjs` (pure JS, no native build step, lower operational risk for this project's Docker-based dev setup — see `package.json`'s existing dependencies, none of which require native compilation) over `bcrypt` (native bindings, faster but adds a build dependency). This is a plan-level implementation choice, not a spec requirement — flagging it here rather than silently picking one with no rationale on record.

## Data Model
**`Employee`** (existing collection `employees`):
```js
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  isActive: { type: Boolean, default: true },
  locationId: { type: ObjectId, ref: 'Location', required: true },
  departmentId: { type: ObjectId, ref: 'Department', required: true },
  roleId: { type: ObjectId, ref: 'Role', required: true },
  managerId: { type: ObjectId, ref: 'Employee', default: null },
  hrId: { type: ObjectId, ref: 'Employee', default: null },
  passwordHash: { type: String, required: true, select: false },
  mustChangePassword: { type: Boolean, default: true },
}
// timestamps: true
```
`email`'s `unique: true` index implements employee-crud-mapping.AC12 (`DUPLICATE_EMAIL`) and doubles as the portal login identifier (employee-crud-mapping.spec.md's v1.3 amendment) — replacing `code`, which is removed from this collection entirely as of v1.3.

**Implementation note (v1.3):** the stale `code_1` unique index left behind by the v1.3 field removal does not drop itself — Mongoose's `autoIndex` only adds indexes declared in the current schema, it never removes ones no longer declared. Deploying this revision to any environment with existing `employees` data requires an explicit `db.employees.dropIndex('code_1')` (done manually against this project's dev/test databases when v1.3 landed) or every subsequent create fails on a phantom `code: null` uniqueness collision.

**Revised (v1.2, 2026-09-03):** `passwordHash` and `mustChangePassword` added. `passwordHash` uses Mongoose's `select: false` so it is excluded from every query result by default (not just filtered out in the controller response mapping) — a defense-in-depth measure beyond what the spec strictly requires, chosen because a `select: false` field can't be accidentally leaked by a future handler that forgets to strip it manually, which is a real risk given how many endpoints across this journey return `Employee`-shaped data (portal-login-password-change, receiving-hr-transfer-gatekeeping, etc.). `passwordHash` has no `unique`/index requirement. This is an additive schema change on an existing collection with no backfill concern for *new* documents, but see Explicitly Deferred for existing ones.

**"One active mapping at a time" (BRD-004) needs no extra index or constraint**: since `locationId`/`departmentId`/`roleId` are single fields on the Employee document itself (not an array of mappings), an Employee structurally cannot hold more than one Location+Department+Role combination at once — this is inherent to the schema shape, not something a uniqueness index needs to separately enforce.

`managerId`/`hrId` self-reference the same `Employee` collection. `employeeMapping.service.js` is responsible for the category/scope validation (AC1–AC11); the schema itself only constrains the reference to be a valid ObjectId, since Mongoose refs don't natively express "must resolve to a document whose `roleId` has a given `category`."

## Constitution Check
Re-verified against `.ai-context/constitution.md` (2026-09-03, now populated — supersedes the prior skeleton-era check below). This is the plan most affected by Security Posture now that it's real, since `Employee.name` is a person's name — squarely on constitution.md's PII list.
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. Sequencing now writes each unit test-first; a final step is an explicit coverage check. Given the size of `employeeMapping.service.js`'s validation chain (AC1–AC11), its test-first coverage matters more here than in the other four plans — each validation branch (role-category checks, scope match, existence checks) gets its own test, not one combined test for the whole function.
- [x] Security Posture — `Employee.name` is PII per constitution.md's list; it must never appear in logs at any level. No logging statement in this plan's scope (controller or service) logs the full Employee document or request/response body; `employeeMapping.service.js`'s validation errors reference field names and IDs (`managerId`, `hrId`) in error messages, never the `name` value itself — this is a concrete constraint on how validation errors are worded, not just an incidental pass. Every endpoint in this plan sits behind `adminAuth.middleware.js` — no public route here. Secrets: none introduced by this plan. **v1.2 addition:** `passwordHash` and the one-time `temporaryPassword` are credentials per constitution.md's Security Posture rule ("credentials... never appear in logs at any log level") — `passwordHash` is `select: false` at the schema level (excluded from queries by default) and `temporaryPassword` is never persisted, only computed and returned once; neither is included in any `morgan` request/response log or any application log statement in `employee.controller.js`.
- [x] Architectural Constraints — MongoDB via Mongoose, the approved datastore; no new datastore introduced. REST only, no messaging. Frontend N/A.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — `/api/v1/employees` matches constitution.md's versioning scheme exactly.

**Revised (2026-09-04, user-directed):** adds `remove` to `employee.controller.js` and `DELETE /api/v1/employees/:id` to the router, per employee-crud-mapping.spec.md's amendment. Guard counts any *other* Employee referencing this one as `managerId` or `hrId` (`$or` query) — deliberately narrower than the other three entities' guards, since an Employee's "dependents" are other Employee records, not join-table mappings. No cascade/reassignment is attempted. Does not check `TransferRequest` references — flagged gap, out of scope (see spec).

**Revised (v1.4, 2026-09-04, user-directed):** removes `validateDepartmentRoleEnablement`/its call from `employeeMapping.service.js` entirely (including the now-unused `DepartmentRole` import), per employee-crud-mapping.spec.md's v1.4 amendment. Role and Department carry no relation in Employee create/update going forward. `transferRequest.controller.js`'s own independent `DepartmentRole` check (a separate feature, not shared code) is untouched.

## Explicitly Deferred
- Audit trail / change history — never built, per BRD-004 (permanent).
- Bulk import/export of Employees or mappings — never built, per BRD-004 (single-record-at-a-time only, permanent).
- Employee-facing login/authentication itself (the `/auth/login`/`/auth/change-password` endpoints) — that's portal-login-password-change.plan.md, not this one; this plan only provisions the credential fields. **Superseded by the v1.2 amendment**: the spec's original Gate 1-ratified `isActive`-vs-soft-delete resolution now has a real consequence — `isActive: false` blocks login (portal-login-password-change.spec.md AC4) — but that enforcement lives in portal-login-password-change.plan.md's login handler, not here.
- **Behavior when an Employee referenced as another Employee's `managerId`/`hrId` is deactivated, or has their own Role/Department changed** — the spec's own Explicitly Out of Scope flags this and this plan re-defers it, same reasoning as role-crud.plan.md's category-change deferral: no BRD-004 requirement states whether this should block the change, cascade-reassign, or leave the mapping stale. `employee.controller.js`'s status-toggle and update handlers do not implement any cascading check; a deactivated Employee who is still referenced as someone's manager/HR becomes a known, accepted stale reference until a BRD entry addresses it.
- Pagination beyond the listed filter query params (`isActive`, `locationId`, `departmentId`, `roleId`) — not built now; additive change possible later.
- **Backfilling `passwordHash`/`mustChangePassword`/`email` on Employee documents created before this v1.2/v1.3 revision.** `passwordHash` and `email` are both `required: true` going forward, but any Employee record already in the database (created under the pre-v1.2 shape, e.g. the 32 seeded India Internal-Transfer demo records) has neither, and cannot log in until both exist — `email` doesn't even exist as a concept on those documents, so a PUT re-save (which requires `email` in its own request body) is the only way to bring one current, not an automatic fix. This plan includes no migration script; resolving it is deferred, since neither the spec nor the BRD addresses migrating pre-existing data.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest): the test is written alongside (not after) the implementation it covers. For step 2 specifically, each validation branch gets its own test case, not one combined test for the whole service.
1. `Employee` model + unique `code` index + self-referencing `managerId`/`hrId`.
2. `employeeMapping.service.js` — validation logic for AC1–AC10 (role-category requirements, manager/HR existence, manager/HR role-category check, Location+Department scope match). **v1.4 revision (step 19 below) removes the `ROLE_NOT_ENABLED_FOR_DEPARTMENT`/`DepartmentRole` check this step originally included.**
3. `employee.controller.js` — create/update handlers (AC1–AC12), calling into the service.
4. `employee.controller.js` — list/get handlers with filters (AC13–AC14).
5. `employee.controller.js` — status toggle handler (AC16–AC17).
6. `employee.routes.js`, gated by `adminAuth.middleware.js`, mounted at `/api/v1/employees` (AC18 — unauthenticated requests rejected — is exercised here, at the router-wiring level).
7. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
8. **Follow-up on the other four plans' deactivation guards**: once step 1 lands, `LOCATION_HAS_ACTIVE_EMPLOYEES` / `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` / `ROLE_HAS_ACTIVE_EMPLOYEES` in location-crud/department-crud/role-crud become live (they query the now-existing `Employee` collection) — no code changes needed in those plans, this is purely a build-order note, not a new task.
9. **v1.2 revision:** add `bcryptjs` dependency; add `passwordHash`/`mustChangePassword` fields to the `Employee` schema (test-first). Runs after role-crud's v1.1 revision (step 6 there) since it depends on nothing there directly, but before portal-login-password-change.plan.md, which needs these fields to exist.
10. **v1.2 revision:** `src/utils/generatePassword.js` — the one-time `temporaryPassword` generator (test-first).
11. **v1.2 revision:** wire `generatePassword.js` + bcrypt hashing into `employee.controller.js`'s create handler (AC19/AC20) — hash before save, return plaintext once, never persist it (test-first).
12. **v1.2 revision:** confirm ≥80% line coverage on the new v1.2 code specifically, per constitution.md's Testing Discipline floor.
13. **v1.3 revision:** `Employee` schema — remove `code`, add `email` (test-first); drop the stale `code_1` index from any environment with existing data.
14. **v1.3 revision:** remove `generatePassword.js`; update `employee.controller.js`'s create/update handlers to accept Admin-supplied `email`/`password`, drop `temporaryPassword` from the response (test-first).
15. **v1.3 revision:** update `employeeAuth.controller.js`'s login handler and response shape (`code` → `email`) to match — this plan and portal-login-password-change.plan.md must land together for v1.3, since the login identity field is shared.
16. **Revision:** `employee.controller.js` — `remove` handler (AC21–AC22), test-first.
17. **Revision:** `employee.routes.js` — `DELETE /:id` route (test-first, including the no-token 401 case).
18. **v1.3 revision:** confirm ≥80% line coverage on the v1.3 changes, per constitution.md's Testing Discipline floor.
19. **v1.4 revision:** remove `validateDepartmentRoleEnablement` and its call site from `employeeMapping.service.js`, plus the now-unused `DepartmentRole` import (test-first — update `employeeMapping.service.test.js`/`employee.controller.test.js`/`employee.routes.test.js` to drop the removed AC11/UT11 coverage and the `DepartmentRole` seeding they no longer need).
