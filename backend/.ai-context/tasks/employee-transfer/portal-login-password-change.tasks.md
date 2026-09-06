# Tasks: Portal Login and Password Change

## Derived From
.ai-context/plans/employee-transfer/portal-login-password-change.plan.md

## Sequence
- [x] portal-login-password-change.T01 — Add `EMPLOYEE_JWT_SECRET` to `.env.example`; implement `employeeAuth.controller.js`'s login handler (`.select('+passwordHash')` lookup by `code`, `bcryptjs.compare`, JWT issue with no expiry) — test-first — Acceptance: AC1, AC2, AC3, AC4
- [x] portal-login-password-change.T02 — Implement `employeeAuth.middleware.js` (verifies `Authorization: Bearer` JWT, fetches the Employee fresh from the DB, attaches `req.employee`) — test-first — Acceptance: AC8
- [x] portal-login-password-change.T03 — Implement `employeeAuth.controller.js`'s change-password handler (current-password check, updates `passwordHash`, clears `mustChangePassword`) — test-first — Acceptance: AC5, AC6, AC7, AC9
- [x] portal-login-password-change.T04 — Implement `auth.routes.js` (login public; change-password gated by T02's middleware), mounted at `/api/v1/auth` in `src/index.js` — test-first, including the no-token 401 case on change-password — Acceptance: AC8
- [x] portal-login-password-change.T05 — Confirm ≥80% line coverage for T01–T04, per constitution.md's Testing Discipline floor — Acceptance: AC1–AC9 (coverage verification, not new behavior)

## v1.1 Revision (2026-09-04) — username renamed to email
User-directed change, downstream of employee-crud-mapping.T14. T01–T05 above are unchanged and preserved as `Merged`, except their `username`/`code` references are now historical.
- [x] portal-login-password-change.T06 — Rename the login handler's `username` request field to `email` (lookup by `email` instead of `code`) and the response's `employee.code` to `employee.email` — test-first — Acceptance: AC1, AC2, AC3

## Note
T01 depends on employee-crud-mapping.T10–T11 (v1.2 revision) landing first — this spec verifies credentials that plan provisions. T06 depends on employee-crud-mapping.T14 (v1.3 revision).
