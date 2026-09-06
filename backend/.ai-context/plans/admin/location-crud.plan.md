# Plan: Location CRUD

## Derived From
.ai-context/specs/admin/location-crud.spec.md

## Architecture Approach
`.ai-context/architecture.md`'s Folder Structure is still an unfilled skeleton, so this plan follows the same layering as admin-static-login.plan.md: `.agent/rules/int-standards.node.md`'s routes/controllers/services/models split, on top of this project's actual existing `src/` structure.

New modules:
- `src/models/Location.js` — Mongoose model.
- `src/models/LocationDepartment.js` — Mongoose model for the Location↔Department join.
- `src/controllers/location.controller.js` — handlers for location-crud.API01–API08.
- `src/routes/location.routes.js` — mounted at `/api/v1/locations`, per the route-prefix decision in admin-static-login.plan.md.

All routes in this router use `adminAuth.middleware.js` (admin-static-login.plan.md) — this is a hard dependency; that middleware must exist before this router is wired up.

**Join collection, not embedded array:** the Location↔Department mapping is modeled as its own `LocationDepartment` collection rather than an embedded `departmentIds` array on `Location`, because the spec's API Contract already exposes the mapping as its own CRUD-like surface (API06 create, API07 delete-one, API08 list) — a dedicated collection with a compound unique index is the direct, idiomatic fit and lets the uniqueness constraint (location-crud.AC14) be enforced at the database layer rather than re-implemented in application code.

**Revised (2026-09-04, user-directed):** adds `remove` to `location.controller.js` and `DELETE /api/v1/locations/:id` to the router, per location-crud.spec.md's amendment. Guard query mirrors the existing `LOCATION_HAS_ACTIVE_EMPLOYEES` pattern in `setStatus` but omits the `isActive: true` filter (counts any Employee, active or inactive) — a hard delete must not leave a dangling reference from an inactive Employee either. On success, cascades a `LocationDepartment.deleteMany({ locationId })` before removing the Location document.

## Data Model
**`Location`** (new collection `locations`):
```js
{
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true },
}
// timestamps: true
```
`code`'s `unique: true` index directly implements location-crud.AC3/AC9 (`DUPLICATE_CODE`), per the Gate 1-ratified uniqueness assumption.

**`LocationDepartment`** (new collection `locationdepartments`, the Location↔Department join):
```js
{
  locationId: { type: ObjectId, ref: 'Location', required: true },
  departmentId: { type: ObjectId, ref: 'Department', required: true },
}
// compound unique index: { locationId: 1, departmentId: 1 } — implements location-crud.AC14 (MAPPING_ALREADY_EXISTS)
```
`Department` itself doesn't exist yet at this plan's position in the sequence (it's department-crud.plan.md, drafted next) — this is a forward reference resolved once that model lands; both plans reference the same join collection by name so there is exactly one owner of its schema (this plan) and no duplicate definition in department-crud.plan.md.

## Constitution Check
Re-verified against `.ai-context/constitution.md` (2026-09-03, now populated — supersedes the prior skeleton-era check below).
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. Sequencing now writes each handler test-first; a final step is an explicit coverage check.
- [x] Security Posture — `name` is on constitution.md's PII list; `Location.name` is a location's own name, not a person's, but no logging statement in this plan's scope logs any request/response body regardless, so no PII-in-logs exposure is introduced. Every endpoint in this plan sits behind `adminAuth.middleware.js` — no public route here. Secrets: none introduced by this plan (no new credential/secret).
- [x] Architectural Constraints — MongoDB via Mongoose, the approved datastore; no new datastore introduced. REST only, no messaging. Frontend N/A.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — `/api/v1/locations` matches constitution.md's versioning scheme exactly.

## Explicitly Deferred
- Audit trail / change history — never built, per BRD-001 (permanent).
- Bulk create/import of Locations or Location↔Department mappings — not built; spec explicitly excludes it.
- Pagination/filtering beyond `isActive` — not built now; the `GET /api/v1/locations` handler is written so an additive `page`/`limit` query param could be introduced later without breaking the existing contract.
- **Deactivation guard against active Employees (`LOCATION_HAS_ACTIVE_EMPLOYEES`, location-crud.AC11)** — the `Employee` model doesn't exist until employee-crud-mapping.plan.md (drafted last in this batch). This plan writes the guard's query against the `Employee` collection by name now; since Employee CRUD is being planned in the same batch, the guard is fully functional once employee-crud-mapping's Sequencing lands — no code changes needed here later, just an ordering dependency. See Sequencing.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest): the test is written alongside (not after) the implementation it covers.
1. `Location` model + unique `code` index.
2. `LocationDepartment` join model + compound unique index. (References `Department` by ObjectId only — no hard dependency on department-crud's model file existing yet, since Mongoose refs are resolved by collection name at query time, not at schema-definition time.)
3. `location.controller.js` — create/read/update handlers (AC1–AC9).
4. `location.controller.js` — status toggle handler (AC10–AC12), including the `LOCATION_HAS_ACTIVE_EMPLOYEES` guard querying the `Employee` collection. **This guard is inert (always allows deactivation) until employee-crud-mapping's `Employee` model exists and Employees can actually be created — no Employee documents can exist before that plan's Sequencing runs, so this is not a functional gap, only a build-order note.**
5. `location.controller.js` — Location↔Department mapping handlers (AC13–AC16).
6. `location.routes.js`, gated by `adminAuth.middleware.js`, mounted at `/api/v1/locations` (AC17 — unauthenticated requests rejected — is exercised here, at the router-wiring level).
7. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
8. **Revision:** `location.controller.js` — `remove` handler (AC18–AC19), test-first.
9. **Revision:** `location.routes.js` — `DELETE /:id` route (test-first, including the no-token 401 case).
