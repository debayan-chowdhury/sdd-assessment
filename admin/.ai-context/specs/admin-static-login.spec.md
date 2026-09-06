# Spec: Static Admin Login (UI)

## Spec ID
admin-static-login

## Status
Changes Requested ⟲

## Linked BRD
.ai-context/BRD.md#BRD-005

## Intent
Provide the Admin Panel's login screen: a username/password form that
authenticates against the backend's static admin login endpoint, stores the
returned JWT client-side, and gates access to every other Admin Panel
screen (Location/Department/Role/Employee) so none of them is reachable
without a successful login.

## Context
- Builds on: .ai-context/architecture.md (System Overview; Known
  Constraints — `localStorage` JWT, no server-side auth gating, `AuthGuard`
  pattern)
- Related: none yet — the other four Admin Panel specs
  (`location-crud`, `department-crud`, `role-crud`,
  `employee-crud-mapping`) all depend on the `AuthGuard`/auth state this
  spec establishes.
- Consumes: backend spec `admin-static-login.spec.md#admin-static-login.API01`
  (`POST /api/v1/admin/login`) — full request/response/error shape owned
  there, not duplicated here; only the parts that drive UI behavior are
  restated below.

## API Contract

### admin-static-login.API01 — Consumes: POST /api/v1/admin/login
**Request payload (sent by this UI):**
```json
{ "username": "string", "password": "string" }
```
**Success response (200) — relied on by this UI:**
```json
{
  "token": "string",
  "admin": { "name": "string", "email": "string", "phone": "string" }
}
```
**Exceptions this UI must handle:**

| Code | Condition (per backend spec) | UI-relevant field |
|---|---|---|
| 400 | `username` or `password` missing/empty | `error.code = "VALIDATION_ERROR"`, `error.message` |
| 401 | Credentials don't match `admin`/`admin` | `error.code = "INVALID_CREDENTIALS"`, `error.message` |

## Acceptance Criteria
1. admin-static-login.AC1 — Given no valid token is stored, when the Admin
   navigates to any Admin Panel route (`/locations`, `/departments`,
   `/roles`, `/employees`), then they are redirected to `/login` before the
   target screen renders.
2. admin-static-login.AC2 — Given a valid token is stored, when the Admin
   navigates to `/login`, then they are redirected away to the default
   Admin Panel screen instead of seeing the login form.
3. admin-static-login.AC3 — Given the login form is displayed, when the
   Admin submits `username="admin"` and `password="admin"`, then the
   returned `token` and `admin` profile are stored (Zustand `authStore` +
   `localStorage`) and the Admin is redirected to the default Admin Panel
   screen.
4. admin-static-login.AC4 — Given the login form is displayed, when the
   Admin submits any `username`/`password` combination other than
   `admin`/`admin`, then the API's `INVALID_CREDENTIALS` message is
   displayed inline on the form and no redirect occurs.
5. admin-static-login.AC5 — Given the login form is displayed, when the
   Admin submits with `username` or `password` empty, then the API's
   `VALIDATION_ERROR` message is displayed inline on the form and no
   redirect occurs.
6. admin-static-login.AC6 — Given a stored token becomes invalid (any
   subsequent API call to a protected endpoint returns 401), when that
   response is received, then the stored token is cleared and the Admin is
   redirected to `/login`.
7. admin-static-login.AC7 — Given a successful login, when any subsequent
   request is made to a protected Admin Panel endpoint, then the stored
   token is attached as an `Authorization: Bearer <token>` header via the
   shared Axios instance.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| admin-static-login.UT01 | AC1 | Visit `/locations` with no token in the store | Redirected to `/login` |
| admin-static-login.UT02 | AC2 | Visit `/login` with a token already in the store | Redirected away from `/login` |
| admin-static-login.UT03 | AC3 | Submit `admin`/`admin` | Token + profile stored, redirect fires |
| admin-static-login.UT04 | AC4 | Submit `admin`/`wrongpass` | `INVALID_CREDENTIALS` message rendered, no redirect |
| admin-static-login.UT05 | AC5 | Submit with `password` empty | `VALIDATION_ERROR` message rendered, no redirect |
| admin-static-login.UT06 | AC6 | Mock a protected-endpoint call returning 401 | Store cleared, redirect to `/login` |
| admin-static-login.UT07 | AC7 | Mock a protected-endpoint call after login | Request carries `Authorization: Bearer <token>` |

## Explicitly Out of Scope
- Logout / explicit token invalidation UI (BRD-005 — deferred at BRD stage;
  no backend endpoint exists for this yet either).
- Session/token expiry handling beyond AC6's reactive 401 redirect — there
  is no proactive expiry check (BRD-005 — deferred).
- Multi-admin support, registration, or any credential management UI.
- Editable admin profile UI — `name`/`email`/`phone` are fixed, static
  values returned by the API and are only ever displayed, never edited.
- Password visibility toggle, "remember me," or forgot-password flow — not
  raised in BRD-005.

## Non-Functional Constraints (from constitution.md)
- Auth baseline, JWT `localStorage` storage, and the "no `middleware.ts`
  for access control" rule are binding as stated in `constitution.md` →
  Security Posture.
- HTTP layer must be the single shared Axios instance
  (`constitution.md` → Architectural Constraints); no ad hoc `fetch()`.
- Client state (token, `isAuthenticated`) must live in the Zustand
  `auth.store.ts`, not local component state.
- Test framework is Vitest + React Testing Library; test-first scope and
  coverage floor are an open gap in `constitution.md` — not yet enforceable
  at Gate 1.
