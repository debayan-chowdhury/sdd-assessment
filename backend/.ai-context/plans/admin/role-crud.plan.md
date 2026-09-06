# Plan: Role CRUD

## Derived From
.ai-context/specs/admin/role-crud.spec.md

## Architecture Approach
Same layering as location-crud.plan.md / department-crud.plan.md.

New modules:
- `src/models/Role.js` — Mongoose model.
- `src/controllers/role.controller.js` — handlers for role-crud.API01–API05.
- `src/routes/role.routes.js` — mounted at `/api/v1/roles`, gated by `adminAuth.middleware.js` (admin-static-login.plan.md).

No join collection is owned here — the Department↔Role enablement mapping (`DepartmentRole`) is owned by department-crud.plan.md; this plan only owns the global `Role` record itself, consistent with the spec's Explicitly Out of Scope.

## Data Model
**`Role`** (existing collection `roles`):
```js
{
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true },
  category: { type: String, enum: ['HR', 'Manager', 'Payroll', 'IT', 'Facilities', null], default: null },
}
// timestamps: true
```
`code`'s `unique: true` index implements role-crud.AC6/AC13 (`DUPLICATE_CODE`). `category`'s enum explicitly includes `null` as a valid value — Mongoose's enum validator otherwise rejects `null` unless it's listed alongside the allowed strings, so this is a deliberate inclusion, not an oversight, to represent "no category" (role-crud.AC1) distinctly from the five named categories (AC2/AC3/AC18).

**Revised (v1.1, 2026-09-03):** `category` enum extended from `['HR', 'Manager', null]` to `['HR', 'Manager', 'Payroll', 'IT', 'Facilities', null]`, per role-crud.spec.md's v1.1 amendment. This is a Mongoose schema enum change on an existing field — additive (widens what's accepted; no existing stored value becomes invalid) and needs no data migration/backfill, since no document currently holds one of the three new values.

## Constitution Check
Re-verified against `.ai-context/constitution.md` (2026-09-03, now populated — supersedes the prior skeleton-era check below).
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. Sequencing now writes each handler test-first; a final step is an explicit coverage check. The v1.1 enum widening gets its own test-first coverage (AC18/UT18), not folded silently into an existing test.
- [x] Security Posture — `name` is on constitution.md's PII list; `Role.name` is a role's own name, not a person's, and no logging statement in this plan's scope logs any request/response body regardless. Every endpoint in this plan sits behind `adminAuth.middleware.js` — no public route here. Secrets: none introduced by this plan. The v1.1 amendment introduces no new credential/PII surface — it's a plain enum change.
- [x] Architectural Constraints — MongoDB via Mongoose, the approved datastore; no new datastore introduced. REST only, no messaging. Frontend N/A.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — `/api/v1/roles` matches constitution.md's versioning scheme exactly. The v1.1 enum widening is additive (no existing accepted value removed/renamed, no status/auth-requirement change), so no version bump is required, per role-crud.spec.md's own v1.1 Versioning Rules line.

**Revised (2026-09-04, user-directed):** adds `remove` to `role.controller.js` and `DELETE /api/v1/roles/:id` to the router, per role-crud.spec.md's amendment. Guard counts any Employee (active or inactive) holding this Role. On success, cascades `DepartmentRole.deleteMany({ roleId })` before removing the Role document.

## Explicitly Deferred
- Audit trail / change history — never built, per BRD-003 (permanent).
- Bulk create/import of Roles — not built; spec explicitly excludes it.
- Pagination/filtering beyond `isActive`/`category` — not built now; additive change possible later.
- **Behavior when a Role's `category` changes/is removed after Employees already hold Manager/HR mappings derived from it** — the spec's own Explicitly Out of Scope flags this as unresolved and this plan re-defers it rather than inventing cascade logic: no BRD-003/BRD-004 requirement states what should happen (block the change? auto-clear dependent mappings? leave them stale?), and guessing would invent an unstated business rule. `role.controller.js`'s update handler (AC12) allows the change unconditionally; any resulting stale Manager/HR mapping on affected Employees is a known, accepted gap until a BRD entry addresses it. This now also applies to a Role changed away from `Payroll`/`IT`/`Facilities` after Employees are already relied on in the Internal Transfer journey's fulfillment worklists (payroll-transfer-update.plan.md etc.) — same reasoning, same deferral.
- **Deactivation guard against active Employees (`ROLE_HAS_ACTIVE_EMPLOYEES`, role-crud.AC15)** — same cross-plan dependency on the `Employee` model as location-crud.plan.md's/department-crud.plan.md's equivalent guards; inert until employee-crud-mapping's Sequencing lands.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest): the test is written alongside (not after) the implementation it covers.
1. `Role` model + unique `code` index + `category` enum (including `null`).
2. `role.controller.js` — create/read/update handlers (AC1–AC13).
3. `role.controller.js` — status toggle handler (AC14–AC16), including the `ROLE_HAS_ACTIVE_EMPLOYEES` guard (inert until employee-crud-mapping lands — see Explicitly Deferred).
4. `role.routes.js`, gated by `adminAuth.middleware.js`, mounted at `/api/v1/roles` (AC17 — unauthenticated requests rejected — is exercised here, at the router-wiring level).
5. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
6. **v1.1 revision:** widen the `category` enum to include `Payroll`/`IT`/`Facilities` (AC18/UT18), test-first. This is a small, additive follow-up to step 1/2 — no other step changes. Runs before employee-crud-mapping's v1.2 revision (a Payroll/IT/Facilities Employee needs the widened enum to exist first) and before the Internal Transfer journey plans that create Employees holding these categories.
7. **Revision:** `role.controller.js` — `remove` handler (AC19–AC20), test-first.
8. **Revision:** `role.routes.js` — `DELETE /:id` route (test-first, including the no-token 401 case).
