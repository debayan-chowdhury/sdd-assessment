# Plan: Department CRUD

## Derived From
.ai-context/specs/admin/department-crud.spec.md

## Architecture Approach
Same layering as location-crud.plan.md (architecture.md's Folder Structure is still an unfilled skeleton; grounded in `.agent/rules/int-standards.node.md` and the project's actual `src/` structure instead).

New modules:
- `src/models/Department.js` — Mongoose model.
- `src/models/DepartmentRole.js` — Mongoose model for the Department↔Role join.
- `src/controllers/department.controller.js` — handlers for department-crud.API01–API08.
- `src/routes/department.routes.js` — mounted at `/api/v1/departments`, gated by `adminAuth.middleware.js` (admin-static-login.plan.md).

**Join collection, not embedded array:** same rationale as `LocationDepartment` in location-crud.plan.md — the Department↔Role mapping is its own CRUD-like surface in the spec (API06 create, API07 delete-one, API08 list), so a dedicated collection with a compound unique index is the direct fit and enforces department-crud.AC14 (`MAPPING_ALREADY_EXISTS`) at the database layer.

**This is also where BRD-002/BRD-003's Role-scoping contradiction resolves architecturally:** `Role` documents themselves stay in one global `roles` collection (owned by role-crud.plan.md), never duplicated or forked per Department. `DepartmentRole` only records *which* global Roles are enabled for a given Department — it holds no Role data of its own beyond the two foreign keys.

## Data Model
**`Department`** (new collection `departments`):
```js
{
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true },
}
// timestamps: true
```
`code`'s `unique: true` index implements department-crud.AC3/AC9 (`DUPLICATE_CODE`).

**`DepartmentRole`** (new collection `departmentroles`, the Department↔Role join):
```js
{
  departmentId: { type: ObjectId, ref: 'Department', required: true },
  roleId: { type: ObjectId, ref: 'Role', required: true },
}
// compound unique index: { departmentId: 1, roleId: 1 } — implements department-crud.AC14 (MAPPING_ALREADY_EXISTS)
```
`Role` doesn't exist yet at this plan's position in the sequence (role-crud.plan.md is drafted next) — same forward-reference pattern as `LocationDepartment` → `Department` in location-crud.plan.md.

## Constitution Check
Re-verified against `.ai-context/constitution.md` (2026-09-03, now populated — supersedes the prior skeleton-era check below).
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. Sequencing now writes each handler test-first; a final step is an explicit coverage check.
- [x] Security Posture — `name` is on constitution.md's PII list; `Department.name` is a department's own name, not a person's, and no logging statement in this plan's scope logs any request/response body regardless. Every endpoint in this plan sits behind `adminAuth.middleware.js` — no public route here. Secrets: none introduced by this plan.
- [x] Architectural Constraints — MongoDB via Mongoose, the approved datastore; no new datastore introduced. REST only, no messaging. Frontend N/A.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — `/api/v1/departments` matches constitution.md's versioning scheme exactly.

**Revised (2026-09-04, user-directed):** adds `remove` to `department.controller.js` and `DELETE /api/v1/departments/:id` to the router, per department-crud.spec.md's amendment. Guard counts any Employee (active or inactive) mapped to this Department. On success, cascades both `LocationDepartment.deleteMany({ departmentId })` and `DepartmentRole.deleteMany({ departmentId })` before removing the Department document.

## Explicitly Deferred
- Audit trail / change history — never built, per BRD-002 (permanent).
- Bulk create/import of Departments or Department↔Role mappings — not built; spec explicitly excludes it.
- Pagination/filtering beyond `isActive` — not built now; additive change possible later without breaking the contract.
- Creating/editing Role records themselves — out of this plan's scope entirely; see role-crud.plan.md. This plan only manages the enablement mapping.
- **Deactivation guard against active Employees (`DEPARTMENT_HAS_ACTIVE_EMPLOYEES`, department-crud.AC11)** — same cross-plan dependency on the `Employee` model as location-crud.plan.md's equivalent guard; inert until employee-crud-mapping's Sequencing lands, functional from that point with no further code changes here.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest): the test is written alongside (not after) the implementation it covers.
1. `Department` model + unique `code` index.
2. `DepartmentRole` join model + compound unique index. (References `Role` by ObjectId only — no hard dependency on role-crud's model file existing yet.)
3. `department.controller.js` — create/read/update handlers (AC1–AC9).
4. `department.controller.js` — status toggle handler (AC10–AC12), including the `DEPARTMENT_HAS_ACTIVE_EMPLOYEES` guard (inert until employee-crud-mapping lands — see Explicitly Deferred).
5. `department.controller.js` — Department↔Role mapping handlers (AC13–AC16).
6. `department.routes.js`, gated by `adminAuth.middleware.js`, mounted at `/api/v1/departments` (AC17 — unauthenticated requests rejected — is exercised here, at the router-wiring level).
7. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
8. **Revision:** `department.controller.js` — `remove` handler (AC18–AC19), test-first.
9. **Revision:** `department.routes.js` — `DELETE /:id` route (test-first, including the no-token 401 case).
