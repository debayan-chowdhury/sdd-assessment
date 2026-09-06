# Spec: Portal Login and Password Change

## Spec ID
portal-login-password-change

## Status
In Development (implementation complete, 2026-09-04 — see `.ai-context/tasks/portal-login-password-change.tasks.md`). Note: this skipped Gate 1 peer review, plan review, and task review by explicit user direction — the status reflects actual code state, not that those gates were run.

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-001

## Intent
Let any of the eight roles in the Internal Transfer journey (Employee, Current Manager, Current HR, Receiving HR, Receiving Manager, Payroll, IT, Facilities) log in with their email/password on this portal, land on a role-appropriate view once authenticated, and — mandatorily on first login, optionally afterward — change their password. This spec owns the client-side session (JWT + role) every other frontend spec in this journey depends on for its own role gate.

## Context
- Builds on: .ai-context/architecture.md (System Overview, Security Posture pointer, Known Constraints — no server-side auth gating), .ai-context/constitution.md (Security Posture — JWT in `localStorage`, Axios Bearer interceptor).
- Related: every other spec in this journey (all of them require the session this spec establishes).
- Consumes (backend API contract): `../backend/.ai-context/specs/employee-transfer/portal-login-password-change.spec.md`
  - `portal-login-password-change.API01` — `POST /api/v1/auth/login`
  - `portal-login-password-change.API02` — `POST /api/v1/auth/change-password`

## Acceptance Criteria
1. portal-login-password-change.AC1 — Given an unauthenticated visitor, when they load any route other than `/login`, then `AuthGuard` redirects them to `/login` before any authenticated data is requested.
2. portal-login-password-change.AC2 — Given the login form, when the user submits with `email`/`password` and API01 returns 200, then the token and the returned `employee` profile (including `roleCategory` and `mustChangePassword`) are stored in the Zustand auth store, and the user is redirected to `/change-password` if `mustChangePassword: true`, otherwise to the role-appropriate landing view (AC9).
3. portal-login-password-change.AC3 — Given the login form, when submitted with `email` or `password` empty, then an inline validation error is shown for the missing field(s) and no request is sent.
4. portal-login-password-change.AC4 — Given the login form, when API01 returns 401 `INVALID_CREDENTIALS`, then a single generic "incorrect email or password" message is shown — the UI never distinguishes an unknown email from a wrong password, matching the backend's own non-disclosure.
5. portal-login-password-change.AC5 — Given the login form, when API01 returns 403 `ACCOUNT_INACTIVE`, then a message explaining the account is inactive is shown and no session is created.
6. portal-login-password-change.AC6 — Given `mustChangePassword: true` on the stored profile, when the user attempts to navigate to any route other than `/change-password`, then `AuthGuard` redirects them back to `/change-password` (client-side-only enforcement — see Explicitly Out of Scope; the backend does not block other endpoints).
7. portal-login-password-change.AC7 — Given the change-password form, when submitted with a non-empty `currentPassword` and `newPassword` and API02 returns 200, then `mustChangePassword` is cleared in the auth store, a success message is shown, and the user is redirected to their role-appropriate landing view.
8. portal-login-password-change.AC8 — Given the change-password form, when `newPassword` is empty, then an inline validation error is shown and no request is sent — no complexity rule is enforced client-side either (BRD-001: any combination is allowed).
9. portal-login-password-change.AC9 — Given a successful login or password change and `mustChangePassword: false`, when the user is redirected, then the landing route is chosen by `roleCategory`: `null` (plain Employee) → `/transfer-request`; `Manager` or `HR` → `/approvals`; `Payroll`, `IT`, or `Facilities` → `/approvals` (their own fulfillment worklist). The exact distinction between "Current" and "Receiving" Manager/HR views is not a login-time role — it is resolved per-request by each request's own `currentManagerId`/`currentHrId`/`receivingHrId`/`receivingManagerId` fields (see the approval specs), not by anything decided here.
10. portal-login-password-change.AC10 — Given the change-password form, when API02 returns 400 `INVALID_CURRENT_PASSWORD`, then an inline error on the `currentPassword` field is shown and the form is not cleared.
11. portal-login-password-change.AC11 — Given any authenticated screen, when an Axios response interceptor sees a 401, then the auth store is cleared and the user is redirected to `/login` — this is the only client-side session-expiry behavior in the app (BRD-001: no session timeout otherwise).
12. portal-login-password-change.AC12 — Given a logged-in user, when they use the account/profile menu's password-change entry (available at any time, not just the mandatory prompt), then the same change-password form/flow from AC7 runs (BRD-001: "can change their password after first login as well").

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| portal-login-password-change.UT01 | AC1 | Render a protected route with no auth store token | Redirected to `/login` |
| portal-login-password-change.UT02 | AC2 | Submit login, mock API01 200 with `mustChangePassword: true` | Store populated, redirected to `/change-password` |
| portal-login-password-change.UT03 | AC3 | Submit login form with empty password | Inline validation error, no request fired |
| portal-login-password-change.UT04 | AC4 | Mock API01 401 `INVALID_CREDENTIALS` | Generic incorrect-credentials message shown |
| portal-login-password-change.UT05 | AC5 | Mock API01 403 `ACCOUNT_INACTIVE` | Inactive-account message shown, no store write |
| portal-login-password-change.UT06 | AC6 | Auth store has `mustChangePassword: true`, navigate to `/transfer-request` | Redirected to `/change-password` |
| portal-login-password-change.UT07 | AC7 | Submit change-password, mock API02 200 | Store's `mustChangePassword` cleared, redirected |
| portal-login-password-change.UT08 | AC8 | Submit change-password with empty `newPassword` | Inline validation error, no request fired |
| portal-login-password-change.UT09 | AC9 | Login success with `roleCategory: "Payroll"` | Redirected to `/approvals` |
| portal-login-password-change.UT10 | AC10 | Mock API02 400 `INVALID_CURRENT_PASSWORD` | Inline field error, form retains `newPassword` input |
| portal-login-password-change.UT11 | AC11 | Any authenticated call mocked to return 401 mid-session | Store cleared, redirected to `/login` |
| portal-login-password-change.UT12 | AC12 | Logged-in user (mustChangePassword false) opens profile menu password change | Same form/flow as AC7 renders and succeeds |

## Explicitly Out of Scope
- Forgot-password / reset flow (BRD-001, explicit).
- Any UI implying session timeout, automatic logout on idle, or account lockout after failed attempts (BRD-001, explicit — none exist).
- SSO / Active Directory / external identity provider UI (BRD-001, explicit).
- **Hard, unbypassable enforcement of the mandatory first-password-change.** The backend spec flags that server-side enforcement blocking all other endpoints is undecided; this frontend spec's AC6 is a client-side redirect only, not a security boundary — a user could bypass it by calling the backend directly. Treat as UX guidance, not access control.
- Admin-side password reset/visibility (owned by the separate Admin Panel app).

## Non-Functional Constraints (from constitution.md)
- JWT stored in `localStorage`, attached via the Axios Bearer interceptor (`src/lib/axios.ts`) — Security Posture.
- Credentials and the token are never logged to the console or any client-side logger in production builds — Security Posture.
- No `middleware.ts` auth gating — all route protection is via `AuthGuard`, client-side only — Architectural Constraints / Known Constraints.
- Test framework: Vitest + React Testing Library — Testing Discipline.
