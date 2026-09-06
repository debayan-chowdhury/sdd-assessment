# Plan: Static Admin Login

## Derived From
.ai-context/specs/admin/admin-static-login.spec.md

## Architecture Approach
`.ai-context/architecture.md`'s Folder Structure is still an unfilled skeleton, so this plan grounds its component split in the layering already stated in `.agent/rules/int-standards.node.md` ("routes stay thin and delegate to controllers/services; controllers orchestrate") and the project's actual existing structure (`src/config/`, `src/routes/`, `src/index.js`).

New modules:
- `src/config/adminIdentity.js` — reads `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_JWT_SECRET` from `process.env` (via `dotenv`, already wired in `src/index.js`), defaulting `ADMIN_USERNAME`/`ADMIN_PASSWORD` to `admin`/`admin` per BRD-005 if unset, so the BRD's stated default ships out of the box while remaining overridable per environment — satisfies int-standards.node.md's "never hardcode secrets, read from `process.env`" rule without contradicting BRD-005's "hardcoded as admin/admin."
- `src/controllers/adminAuth.controller.js` — `POST /api/v1/admin/login` handler (admin-static-login.API01).
- `src/middleware/adminAuth.middleware.js` — verifies the JWT on the `Authorization: Bearer <token>` header; used by this and all four other admin-panel specs' routers.
- `src/routes/adminAuth.routes.js` — mounted at `/api/v1/admin`.

**Route prefix decision:** the existing `src/routes/health.routes.js` is mounted unversioned (`app.use('/api', healthRoutes)` → `/api/health`), but this spec's API Contract (and all four other Approved specs) already commit to `/api/v1/...`. Per user confirmation, this plan introduces a new `/api/v1` mount in `src/index.js` for admin-panel routers only; `/api/health` stays as-is, unversioned — it is outside all five specs' scope and not to be touched by this work.

**Token mechanism (Open Question resolved by user):** JWT via the `jsonwebtoken` package (new dependency — not currently in `package.json`), signed with `ADMIN_JWT_SECRET`, 8-hour expiry. The spec's API Contract only states `"token": "string"`; JWT is chosen because `adminAuth.middleware.js` needs to verify the token statelessly across all five specs' endpoints without a shared session store, and because it is the natural fit for `jsonwebtoken` alongside this Express/Mongoose stack. The 8-hour expiry is an unstated assumption — see Open Questions.

## Data Model
No schema change. No Mongoose model is introduced for this spec — the Admin's identity (`admin`/`admin` credential, static `name`/`email`/`phone` profile) is not persisted; it is read from environment variables at request time, per BRD-005 ("not stored per-admin... not backed by any user record").

## Constitution Check
Re-verified against `.ai-context/constitution.md` (2026-09-03, now populated — supersedes the prior skeleton-era check below).
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. Sequencing now installs `jest` in step 1 and writes each handler test-first; step 7 is an explicit coverage check.
- [x] Security Posture — no PII field (name/DOB/phone/email/govID/payment) is introduced by this plan. Credentials and the JWT secret/token are never logged — no logging statement in this plan's scope touches them. `POST /api/v1/admin/login` is this plan's one intentionally public route — stated reason: it's the credential-exchange endpoint itself; nothing else in this plan is public. Secrets (`ADMIN_JWT_SECRET`, `ADMIN_PASSWORD`, etc.) are read from `process.env` only via `src/config/adminIdentity.js`, never hardcoded.
- [x] Architectural Constraints — MongoDB via Mongoose is the approved datastore; this plan introduces none at all (no persisted Admin model). REST only, no messaging. Frontend N/A.
- [x] Non-Functional Baselines — constitution.md itself flags this section as an open gap (no latency/availability/RPO-RTO target exists yet) — nothing to check this plan against.
- [x] Versioning Rules — `/api/v1` matches constitution.md's versioning scheme exactly; this plan is in fact the origin of that now-formalized rule.

## Explicitly Deferred
- Logout / explicit token invalidation — per spec's Explicitly Out of Scope, BRD-005 leaves this "Open at BRD stage." Not built; a stateless JWT with expiry is the only mitigation until a future BRD entry addresses it.
- Session/token expiry policy — BRD-005 "Open at BRD stage." This plan makes a concrete assumption (8h) to unblock implementation, but the duration itself remains open — see Open Questions.
- Multi-admin support / per-admin credentials — per spec's Explicitly Out of Scope, no BRD requirement exists yet.
- Password reset/change flow — per spec's Explicitly Out of Scope, no BRD requirement exists yet.
- Editable admin profile — per spec's Explicitly Out of Scope; name/email/phone are fixed, sourced from env vars only.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest): the test is written alongside (not after) the implementation it covers.
1. Add `jsonwebtoken` (dependency) and `jest` (devDependency) to `package.json`.
2. Add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_JWT_SECRET` to `.env.example`.
3. `src/config/adminIdentity.js` — env-backed identity/credential reader.
4. `src/controllers/adminAuth.controller.js` — login handler (admin-static-login.AC1–AC3).
5. `src/middleware/adminAuth.middleware.js` — JWT verification middleware (admin-static-login.AC4–AC5). This is a hard dependency for every other admin-panel spec's routes — must land before any of them are wired up.
6. `src/routes/adminAuth.routes.js`, mounted at `/api/v1/admin` in `src/index.js`.
7. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.

## Open Questions
- **Token expiry duration (8h assumed):** neither BRD-005 nor `constitution.md` (Non-Functional Baselines is itself a flagged gap there) states a session length. Accepted as a working assumption at plan review (2026-09-03) — not blocking, but still not a value traceable to any BRD/constitution rule; revisit if a session-length requirement is ever stated.
