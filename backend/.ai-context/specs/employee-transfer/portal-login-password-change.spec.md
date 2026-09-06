# Spec: Portal Login and Password Change

## Spec ID
portal-login-password-change

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-001

## Intent
Let every role in the Internal Transfer journey (Employee, Current Manager, Current HR, Receiving HR, Receiving Manager, Payroll, IT, Facilities) log in with the Employee credentials provisioned by employee-crud-mapping.spec.md, and change their password — mandatory on first login, optional thereafter.

## Context
- Builds on: .ai-context/architecture.md (Security Posture pointer, Integration Points — no notification system exists).
- Related: .ai-context/specs/admin/employee-crud-mapping.spec.md (source of the credentials and `mustChangePassword` flag this spec consumes), .ai-context/specs/admin/admin-static-login.spec.md (separate, unrelated auth surface — Admin login is a distinct static credential, not an Employee record; the two are not interchangeable).
- **Design note:** login identity = the Employee record's `email` field, per employee-crud-mapping.spec.md.

**Amended (v1.1, 2026-09-04):** User-directed change, downstream of employee-crud-mapping.spec.md's v1.3 amendment (which removes `code` from the Employee model in favor of `email`, and moves password-setting to the Admin at creation time). The login request field is renamed `username` → `email`, and the returned `employee` profile's `code` field is replaced with `email`. Case A in-place edit (still `In Development`, not Released).

## API Contract

### portal-login-password-change.API01 — POST /api/v1/auth/login
**Request payload:**
```json
{ "email": "string", "password": "string" }
```
**Success response (200):**
```json
{
  "token": "string",
  "employee": {
    "id": "string", "name": "string", "email": "string",
    "locationId": "string", "departmentId": "string", "roleId": "string",
    "roleCategory": "HR | Manager | Payroll | IT | Facilities | null",
    "managerId": "string | null", "managerName": "string | null",
    "hrId": "string | null", "hrName": "string | null",
    "mustChangePassword": true
  }
}
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `email` or `password` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | `email` does not resolve to an Employee, or `password` does not match | `{ "error": { "message": "...", "code": "INVALID_CREDENTIALS" } }` — the same code covers both cases; the response never reveals which one failed |
| 403 | Credentials are correct but the Employee's `isActive` is `false` | `{ "error": { "message": "...", "code": "ACCOUNT_INACTIVE" } }` |

### portal-login-password-change.API02 — GET /api/v1/auth/profile
Added so the portal's own Profile screen can render "who am I" (own name/email plus Location/Department/Role/Manager/HR, all display-name-resolved) from a single call, instead of combining the login snapshot with a separate bounded id-list lookup (`GET /options/employees?ids=...`) and the full Location/Department/Role option lists.
**Request payload:** none.
**Success response (200):**
```json
{
  "id": "string", "name": "string", "email": "string",
  "locationId": "string", "locationName": "string | null",
  "departmentId": "string", "departmentName": "string | null",
  "roleId": "string", "roleName": "string | null",
  "roleCategory": "HR | Manager | Payroll | IT | Facilities | null",
  "managerId": "string | null", "managerName": "string | null",
  "hrId": "string | null", "hrName": "string | null",
  "mustChangePassword": true
}
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### portal-login-password-change.API03 — POST /api/v1/auth/change-password
**Request payload:**
```json
{ "currentPassword": "string", "newPassword": "string" }
```
**Success response (200):**
```json
{ "message": "Password updated" }
```
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `currentPassword` or `newPassword` missing/empty | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token presented | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 400 | `currentPassword` does not match the Employee's stored password | `{ "error": { "message": "...", "code": "INVALID_CURRENT_PASSWORD" } }` |

No complexity rule applies to `newPassword` (BRD-001: "no password complexity requirement — any combination is allowed") — only presence is validated.

## Acceptance Criteria
1. portal-login-password-change.AC1 — Given an active Employee with correct `email`/`password`, when POST /api/v1/auth/login is called, then the response is 200 with a token and the Employee's profile including `mustChangePassword`.
2. portal-login-password-change.AC2 — Given an incorrect `password` or an `email` that doesn't resolve to any Employee, when POST /api/v1/auth/login is called, then the response is 401 `INVALID_CREDENTIALS`.
3. portal-login-password-change.AC3 — Given `email` or `password` is missing or empty, when POST /api/v1/auth/login is called, then the response is 400 `VALIDATION_ERROR`.
4. portal-login-password-change.AC4 — Given correct credentials for an Employee with `isActive: false`, when POST /api/v1/auth/login is called, then the response is 403 `ACCOUNT_INACTIVE` and no token is issued.
5. portal-login-password-change.AC5 — Given a valid Employee token and a correct `currentPassword`, when POST /api/v1/auth/change-password is called with a non-empty `newPassword`, then the response is 200, the stored password hash is updated, and `mustChangePassword` is set to `false`.
6. portal-login-password-change.AC6 — Given `currentPassword` does not match, when POST /api/v1/auth/change-password is called, then the response is 400 `INVALID_CURRENT_PASSWORD` and the stored password is unchanged.
7. portal-login-password-change.AC7 — Given `newPassword` is missing or empty, when POST /api/v1/auth/change-password is called, then the response is 400 `VALIDATION_ERROR`.
8. portal-login-password-change.AC8 — Given no valid token is presented, when POST /api/v1/auth/change-password is called, then the response is 401 `UNAUTHORIZED`.
9. portal-login-password-change.AC9 — Given an Employee has changed their password once already, when they call POST /api/v1/auth/change-password again, then the change succeeds identically — the mandatory first-change and any later voluntary change use the same endpoint (BRD-001: "can change their password after first login as well").
10. portal-login-password-change.AC10 — Given a valid Employee token, when GET /api/v1/auth/profile is called, then the response is 200 with the Employee's own data plus `locationName`/`departmentName`/`roleName`/`managerName`/`hrName` resolved from the corresponding ids (`null` where an id is `null`).
11. portal-login-password-change.AC11 — Given no valid token is presented, when GET /api/v1/auth/profile is called, then the response is 401 `UNAUTHORIZED`.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| portal-login-password-change.UT01 | AC1 | Login with correct credentials | 200, token + profile |
| portal-login-password-change.UT02 | AC2 | Login with wrong password | 401 `INVALID_CREDENTIALS` |
| portal-login-password-change.UT03 | AC2 | Login with unknown email | 401 `INVALID_CREDENTIALS` |
| portal-login-password-change.UT04 | AC3 | Login with empty body | 400 `VALIDATION_ERROR` |
| portal-login-password-change.UT05 | AC4 | Login with correct credentials but `isActive: false` | 403 `ACCOUNT_INACTIVE` |
| portal-login-password-change.UT06 | AC5 | Change password with correct current password | 200, `mustChangePassword: false` |
| portal-login-password-change.UT07 | AC6 | Change password with wrong current password | 400 `INVALID_CURRENT_PASSWORD` |
| portal-login-password-change.UT08 | AC7 | Change password with empty `newPassword` | 400 `VALIDATION_ERROR` |
| portal-login-password-change.UT09 | AC8 | Change password with no token | 401 `UNAUTHORIZED` |
| portal-login-password-change.UT10 | AC9 | Change password a second time, voluntarily | 200, succeeds again |
| portal-login-password-change.UT11 | AC10 | Get profile for a regular Employee with a manager and HR | 200, all names resolved, `managerName`/`hrName` non-null |
| portal-login-password-change.UT12 | AC11 | Get profile with no token | 401 `UNAUTHORIZED` |

## Explicitly Out of Scope
- Forgot-password / reset flow (BRD-001, explicit).
- Session timeout or automatic logout (BRD-001, explicit — decided as "none").
- Account lockout after repeated failed attempts (BRD-001, explicit — decided as "none").
- SSO / Active Directory / any external identity system integration (BRD-001, explicit).
- Password complexity rules (BRD-001, explicit — none apply).
- **Server-side enforcement that blocks all other portal actions until the mandatory first password change is completed.** BRD-001 says a change is "required on first login" but does not state whether this is enforced by blocking every other endpoint, or is a client-side/UX prompt only. This spec implements the `mustChangePassword` signal and the change endpoint; enforcing it as a hard gate on other endpoints is a flagged gap, not resolved here.
- Admin-side visibility into or management of Employee passwords beyond setting the initial one at creation (employee-crud-mapping.spec.md) — no reset-on-behalf-of-employee action exists.

## Non-Functional Constraints (from constitution.md)
- Credentials and issued tokens never appear in logs at any log level (Security Posture) — applies to both endpoints in this spec.
- Every route other than `/api/v1/auth/login` sits behind token verification (Security Posture); `/api/v1/auth/login` is the explicit, documented public exception.
- Secrets (JWT signing secret) read from environment variables only (Security Posture) — reuses the same signing mechanism as admin-static-login.spec.md; whether Employee tokens and Admin tokens share one signing secret/algorithm or are issued separately is an open architecture question for plan.md, not decided here.
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
