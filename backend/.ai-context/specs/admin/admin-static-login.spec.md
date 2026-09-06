# Spec: Static Admin Login

## Spec ID
admin-static-login

## Status
In Development

## Linked BRD
.ai-context/BRD_Admin_Panel.md#BRD-005

## Intent
Gate access to the Admin Panel (Location, Department, Role, and Employee CRUD screens) behind a single hardcoded admin credential (`admin`/`admin`), returning a static admin profile (name, email, phone) on success. No per-admin accounts, registration, or profile editing exist in this phase.

## Context
- Builds on: .ai-context/architecture.md — not yet populated (skeleton only); no section to cite.
- Related: .ai-context/specs/admin/location-crud.spec.md, .ai-context/specs/admin/department-crud.spec.md, .ai-context/specs/admin/role-crud.spec.md, .ai-context/specs/admin/employee-crud-mapping.spec.md — all four are gated by this login.

## API Contract

### admin-static-login.API01 — POST /api/v1/admin/login
**Request payload:**
```json
{ "username": "string", "password": "string" }
```
**Success response (200):**
```json
{
  "token": "string",
  "admin": { "name": "string", "email": "string", "phone": "string" }
}
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `username` or `password` missing/empty in the request body | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | `username`/`password` do not both match the hardcoded `admin`/`admin` credential | `{ "error": { "message": "...", "code": "INVALID_CREDENTIALS" } }` |

## Acceptance Criteria
1. admin-static-login.AC1 — Given the hardcoded credential is `admin`/`admin`, when POST /api/v1/admin/login is called with `username="admin"` and `password="admin"`, then the response is 200 with a token and the static admin profile `{name, email, phone}`.
2. admin-static-login.AC2 — Given any `username`/`password` combination other than `admin`/`admin`, when POST /api/v1/admin/login is called, then the response is 401 with code `INVALID_CREDENTIALS`.
3. admin-static-login.AC3 — Given `username` or `password` is missing or empty, when POST /api/v1/admin/login is called, then the response is 400 with code `VALIDATION_ERROR`.
4. admin-static-login.AC4 — Given no valid token is presented, when any Admin Panel CRUD endpoint (Location/Department/Role/Employee) is called, then the response is 401 and the request is rejected before reaching the endpoint's own logic.
5. admin-static-login.AC5 — Given a valid token from AC1 is presented, when an Admin Panel CRUD endpoint is called, then the request proceeds and is not rejected by the auth gate.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| admin-static-login.UT01 | AC1 | Login with correct `admin`/`admin` credentials | 200, token + static profile returned |
| admin-static-login.UT02 | AC2 | Login with wrong password | 401 `INVALID_CREDENTIALS` |
| admin-static-login.UT03 | AC2 | Login with wrong username | 401 `INVALID_CREDENTIALS` |
| admin-static-login.UT04 | AC3 | Login with empty body | 400 `VALIDATION_ERROR` |
| admin-static-login.UT05 | AC4 | Call a protected admin endpoint with no `Authorization` header | 401 rejected |
| admin-static-login.UT06 | AC5 | Call a protected admin endpoint with a valid token | Request passes the auth gate |

## Explicitly Out of Scope
- Logout / explicit token invalidation (BRD-005 — Open at BRD stage).
- Session/token expiry policy (BRD-005 — Open at BRD stage).
- Multi-admin support or per-admin credentials.
- Password reset/change flow.
- Editable admin profile — name/email/phone are fixed, static values.

## Non-Functional Constraints (from constitution.md)
- `.ai-context/constitution.md` is currently an unfilled skeleton — no Security Posture or other baseline is yet stated to bind against. This section is a flagged gap until `constitution-generation` runs; revisit before this spec reaches Gate 1.
