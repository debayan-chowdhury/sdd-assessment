# Spec: Current Manager Transfer Approval

## Spec ID
current-manager-transfer-approval

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-003

## Intent
Let the Current Manager (the Employee referenced by a `TransferRequest`'s `currentManagerId`) accept or reject a pending request as the first approval gate, moving it to Current HR on accept or closing it on reject.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity and status machine this spec advances), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token).

## API Contract

### current-manager-transfer-approval.API01 — GET /api/v1/transfer-requests/pending/current-manager
**Request payload:** none.
**Success response (200):** array of `TransferRequest` objects where `status = "Pending Current Manager Approval"` and `currentManagerId` equals the calling Employee's id.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |

### current-manager-transfer-approval.API02 — POST /api/v1/transfer-requests/:id/current-manager-decision
**Request payload:**
```json
{ "decision": "accept | reject", "reason": "string | omitted" }
```
**Success response (200):** updated `TransferRequest` object — `status: "Pending Current HR Approval"` on accept, `status: "Rejected"` with `rejectionReason` set on reject.
**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `decision` missing or not one of `accept`/`reject` | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 400 | `decision: "reject"` with `reason` missing/empty | `{ "error": { "message": "...", "code": "REASON_REQUIRED" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | The calling Employee is not this request's `currentManagerId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `status` is not `Pending Current Manager Approval` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

## Acceptance Criteria
1. current-manager-transfer-approval.AC1 — Given a request in `Pending Current Manager Approval` assigned to the caller, when POST .../current-manager-decision is called with `decision: "accept"`, then `status` becomes `Pending Current HR Approval` and the response is 200.
2. current-manager-transfer-approval.AC2 — Given the same precondition, when called with `decision: "reject"` and a non-empty `reason`, then `status` becomes `Rejected`, `rejectionReason` is set to `reason`, and the response is 200 (terminal — BRD-002: the employee must submit a brand-new request).
3. current-manager-transfer-approval.AC3 — Given `decision: "reject"` with `reason` missing, when POST .../current-manager-decision is called, then the response is 400 `REASON_REQUIRED` (BRD-003: "a reason is captured").
4. current-manager-transfer-approval.AC4 — Given a request not assigned to the caller as `currentManagerId`, when POST .../current-manager-decision is called, then the response is 403 `FORBIDDEN`.
5. current-manager-transfer-approval.AC5 — Given a request whose `status` is not `Pending Current Manager Approval` (already decided, or further along the chain), when POST .../current-manager-decision is called, then the response is 409 `INVALID_STATUS_TRANSITION`.
6. current-manager-transfer-approval.AC6 — Given a nonexistent `id`, when POST .../current-manager-decision is called, then the response is 404 `NOT_FOUND`.
7. current-manager-transfer-approval.AC7 — Given no valid token, when either endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
8. current-manager-transfer-approval.AC8 — Given a request has remained in `Pending Current Manager Approval` for more than 2 days without a decision, then it is flagged `escalated: true` with `escalatedAt` set — `status` is unchanged, and the flag does not block the Current Manager from still deciding it afterward.
9. current-manager-transfer-approval.AC9 — Given a request is assigned to the caller and in the correct status, when GET /api/v1/transfer-requests/pending/current-manager is called, then it appears in the list; a request not assigned to the caller, or not in that status, does not.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| current-manager-transfer-approval.UT01 | AC1 | Accept an assigned pending request | 200, `status: "Pending Current HR Approval"` |
| current-manager-transfer-approval.UT02 | AC2 | Reject with a reason | 200, `status: "Rejected"`, `rejectionReason` set |
| current-manager-transfer-approval.UT03 | AC3 | Reject with no reason | 400 `REASON_REQUIRED` |
| current-manager-transfer-approval.UT04 | AC4 | Decide a request assigned to a different manager | 403 `FORBIDDEN` |
| current-manager-transfer-approval.UT05 | AC5 | Decide a request already `Rejected` | 409 `INVALID_STATUS_TRANSITION` |
| current-manager-transfer-approval.UT06 | AC6 | Decide a nonexistent request id | 404 `NOT_FOUND` |
| current-manager-transfer-approval.UT07 | AC7 | Call either endpoint with no token | 401 `UNAUTHORIZED` |
| current-manager-transfer-approval.UT08 | AC8 | Advance a fake clock past 2 days with no decision | `escalated: true`, `status` unchanged |
| current-manager-transfer-approval.UT09 | AC9 | List pending queue with a mix of assigned/unassigned/wrong-status requests | Only correctly-scoped requests returned |

## Explicitly Out of Scope
- Team-continuity/handover administration beyond the accept/reject gate itself.
- The case where the employee's current manager is also changing as part of the same transfer (BRD-003, explicit).
- Resolution mechanics for an escalated item — see transfer-request-submission.spec.md.

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
