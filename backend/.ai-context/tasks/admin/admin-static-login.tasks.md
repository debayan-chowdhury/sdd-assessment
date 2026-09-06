# Tasks: Static Admin Login

## Derived From
.ai-context/plans/admin/admin-static-login.plan.md

## Sequence
- [x] admin-static-login.T01 — Add `jsonwebtoken` (dependency) and `jest` (devDependency) to `package.json`; add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_JWT_SECRET` to `.env.example`; implement `src/config/adminIdentity.js` (env-backed reader, defaulting `ADMIN_USERNAME`/`ADMIN_PASSWORD` to `admin`/`admin`); implement `POST /api/v1/admin/login` in `adminAuth.controller.js` verifying credentials against `adminIdentity.js` and returning a signed JWT + static profile on success, 401 on mismatch, 400 on missing fields — test-first — Acceptance: AC1, AC2, AC3
- [x] admin-static-login.T02 — Implement `src/middleware/adminAuth.middleware.js`: reads `Authorization: Bearer <token>`, verifies via `jsonwebtoken`, calls `next()` on a valid token, returns 401 `UNAUTHORIZED` on a missing/invalid/expired token — test-first (unit tests with mock req/res/next, not yet wired to any route) — Acceptance: AC4, AC5
- [x] admin-static-login.T03 — Implement `src/routes/adminAuth.routes.js` and mount it at `/api/v1/admin` in `src/index.js` — test-first (route-level integration test hitting the real login endpoint end to end) — Acceptance: AC1, AC2, AC3
- [x] admin-static-login.T04 — Confirm ≥80% line coverage for all code added in T01–T03, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC5 (coverage verification, not new behavior)
