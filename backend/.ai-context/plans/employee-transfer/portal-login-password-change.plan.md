# Plan: Portal Login and Password Change

## Derived From
.ai-context/specs/employee-transfer/portal-login-password-change.spec.md

## Architecture Approach
Same layered structure as admin-static-login.plan.md, kept as a parallel-but-separate auth surface rather than folded into it — Employee and Admin are different principal types with different claims, and mixing them into one token/middleware risks an admin token being silently accepted on an employee-only route (or vice versa) by coincidence rather than by design.

New modules:
- `src/controllers/employeeAuth.controller.js` — handlers for portal-login-password-change.API01–API02.
- `src/middleware/employeeAuth.middleware.js` — verifies the Employee JWT on `Authorization: Bearer <token>`, attaches `req.employee` (`{id, roleCategory}`, fetched from the DB so `roleCategory` is always current — not cached in the token). Used by every other Employee Transfer journey plan.
- `src/routes/auth.routes.js` — mounted at `/api/v1/auth`. (Named `auth`, not `employeeAuth`, since `/api/v1/auth/login` is the path the spec commits to and the admin login already lives at `/api/v1/admin/login`, not under a shared `/auth` prefix — no naming collision.)

**Token mechanism:** JWT via the already-installed `jsonwebtoken` package (admin-static-login.plan.md), signed with a new `EMPLOYEE_JWT_SECRET` — deliberately a *separate* secret from `ADMIN_JWT_SECRET`, so the two token types can never be cross-valid even if someone reused a value between env vars by mistake.

**Expiry — resolved, not assumed:** unlike admin-static-login.plan.md's 8h expiry (an unstated assumption there, since neither BRD-005 nor constitution.md said anything either way), BRD-001 *explicitly* states "there is no session timeout or automatic logout." The Employee JWT is therefore issued with **no expiry** (`jsonwebtoken`'s `expiresIn` option omitted) — a deliberate, BRD-grounded difference from the Admin token, not an oversight.

`employeeMapping.service.js` (employee-crud-mapping.plan.md) already owns credential *provisioning*; this plan owns *verification* only (`bcryptjs.compare`) and issuance.

## Data Model
No new collection. Reads/writes the `Employee` document's `passwordHash`/`mustChangePassword` fields added by employee-crud-mapping.plan.md's v1.2 revision — a hard dependency, must land first. `passwordHash` is `select: false` on the schema, so `employeeAuth.controller.js`'s login handler must explicitly `.select('+passwordHash')` when looking up the Employee — by `email` as of employee-crud-mapping.plan.md's v1.3 revision (was `code`; see that plan's step 13).

**Revised (v1.1, 2026-09-04):** user-directed change, per portal-login-password-change.spec.md's v1.1 amendment. The login request field is renamed `username` → `email`, and the returned `employee.code` field becomes `employee.email`. No other change — same handler, same middleware.

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor.
- [x] Security Posture — `passwordHash` and the issued JWT are credentials; never logged at any level, and `passwordHash` is stripped by the schema's `select: false` from every response by default. `POST /api/v1/auth/login` is this plan's one intentionally public route — stated reason: it's the credential-exchange endpoint itself (same pattern as admin-static-login's login route). `EMPLOYEE_JWT_SECRET` is read from `process.env` only, added to `.env.example`, never hardcoded.
- [x] Architectural Constraints — MongoDB via Mongoose, the approved datastore; no new datastore. REST only, no messaging. Frontend N/A.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against. (BRD-001's "no session timeout, no lockout" decisions are business requirements honored above, not a constitution.md non-functional baseline.)
- [x] Versioning Rules — `/api/v1/auth/...` matches constitution.md's versioning scheme exactly; new surface area, not a breaking change to anything existing.

## Explicitly Deferred
- Forgot-password / reset flow — BRD-001, explicit, permanent for this journey.
- Session timeout / account lockout — BRD-001 explicitly decided as "none"; not built, and the no-expiry token design above is the concrete implementation of that decision.
- SSO/AD integration — BRD-001, explicit, permanent.
- **Server-side enforcement blocking other endpoints until the mandatory first password change** — the spec's own Explicitly Out of Scope flags this as a genuine gap (BRD-001 doesn't say whether "required on first login" means a hard server-side block or a client-side prompt). This plan does not add a global gate; `mustChangePassword` is returned at login for the frontend to act on, and every other journey endpoint (current-manager-transfer-approval, etc.) does not check it. Re-open if a future BRD entry requires hard enforcement.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest).
1. Add `EMPLOYEE_JWT_SECRET` to `.env.example`.
2. `employeeAuth.controller.js` — login handler (AC1–AC4), including the `.select('+passwordHash')` lookup and `bcryptjs.compare`.
3. `employeeAuth.controller.js` — change-password handler (AC5–AC8).
4. `employeeAuth.middleware.js` — JWT verification, attaches `req.employee` (fetched fresh from DB, not decoded-token-only, so a since-deactivated or role-changed Employee is reflected immediately). This is a hard dependency for every other Employee Transfer journey plan's routes.
5. `auth.routes.js`, mounted at `/api/v1/auth` in `src/index.js`.
6. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
7. **v1.1 revision:** rename the login handler's `username` field to `email` and the response's `employee.code` to `employee.email` (test-first).
