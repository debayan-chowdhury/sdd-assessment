# Spec: Receiving Manager Transfer Approval

## Spec ID
receiving-manager-transfer-approval

## Status
In Development

## Linked BRD
.ai-context/BRD_Employee_Transfer.md#BRD-006

## Intent
Let the assigned Receiving Manager accept or reject a request as the fourth and final approval gate. On accept, the request moves on to Receiving HR's fulfillment trigger. On reject, the system automatically routes to another untried candidate manager (via Receiving HR reassignment) or, once every candidate manager at the target Department+Location has rejected, puts the request on `Hold`.

## Context
- Builds on: .ai-context/architecture.md (Data Model conventions).
- Related: .ai-context/specs/employee-transfer/transfer-request-submission.spec.md (owns the `TransferRequest` entity and status machine this spec advances), .ai-context/specs/employee-transfer/portal-login-password-change.spec.md (requires a valid Employee token), .ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md (assigns this gate's `receivingManagerId` and handles reassignment/hold-reopen).

**Flagged assumption — candidate exhaustion:** BRD-006 says rejection routes to "the next remaining manager" until "all managers for that department+location have rejected," at which point the request goes on `Hold`. This spec's reject handler computes remaining candidates as: active Manager-category Employees at the request's `newLocationId`+`newDepartmentId`, excluding every manager who has already rejected this specific request (tracked internally as the request's rejection history — not a field exposed in this spec's contract). If none remain, `status` auto-transitions to `Hold` in the same call; if at least one remains, `status` becomes `Pending Receiving HR Reassignment` for Receiving HR to pick from (receiving-hr-transfer-gatekeeping.spec.md API03).

## API Contract

### receiving-manager-transfer-approval.API01 — GET /api/v1/transfer-requests/pending/receiving-manager
**Success response (200):** array of `TransferRequest` objects where `status = "Pending Receiving Manager Approval"` and `receivingManagerId` equals the caller.
**Exceptions:** `401 UNAUTHORIZED`.

### receiving-manager-transfer-approval.API02 — POST /api/v1/transfer-requests/:id/receiving-manager-decision
**Request payload:**
```json
{ "decision": "accept" }
```
or
```json
{ "decision": "reject", "reasonCode": "NO_HEADCOUNT | ROLE_SKILL_MISMATCH | TIMING_CONFLICT | OTHER", "reasonDetail": "string | omitted" }
```
**Success response (200):** updated `TransferRequest`.
- `decision: "accept"` → `status: "Pending Fulfillment Trigger"`.
- `decision: "reject"`, another candidate manager remains → `status: "Pending Receiving HR Reassignment"`.
- `decision: "reject"`, no candidate remains → `status: "Hold"`, `holdReason` set from `reasonCode`/`reasonDetail`, `holdStartedAt` set to now.

**Exceptions:**

| Code | Condition | Response body |
|---|---|---|
| 400 | `decision` missing/invalid, or `decision: "reject"` with `reasonCode` missing/not one of the enum values | `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }` |
| 401 | No valid Employee token | `{ "error": { "message": "...", "code": "UNAUTHORIZED" } }` |
| 403 | Caller is not this request's `receivingManagerId` | `{ "error": { "message": "...", "code": "FORBIDDEN" } }` |
| 404 | No `TransferRequest` with this `id` | `{ "error": { "message": "...", "code": "NOT_FOUND" } }` |
| 409 | `status` is not `Pending Receiving Manager Approval` | `{ "error": { "message": "...", "code": "INVALID_STATUS_TRANSITION" } }` |

## Acceptance Criteria
1. receiving-manager-transfer-approval.AC1 — Given a request in `Pending Receiving Manager Approval` assigned to the caller, when POST .../receiving-manager-decision is called with `decision: "accept"`, then `status` becomes `Pending Fulfillment Trigger`.
2. receiving-manager-transfer-approval.AC2 — Given the target Department+Location has at least one other active Manager-category Employee who hasn't yet rejected this request, when called with `decision: "reject"` and a valid `reasonCode`, then `status` becomes `Pending Receiving HR Reassignment`.
3. receiving-manager-transfer-approval.AC3 — Given no other untried candidate manager exists at the target Department+Location, when called with `decision: "reject"`, then `status` becomes `Hold`, `holdReason` and `holdStartedAt` are set.
4. receiving-manager-transfer-approval.AC4 — Given the target Department+Location has only one active Manager-category Employee (the caller) and that manager rejects, when POST .../receiving-manager-decision is called, then `status` goes straight to `Hold` (same rule as AC3, single-candidate case per BRD-006).
5. receiving-manager-transfer-approval.AC5 — Given `decision: "reject"` with `reasonCode` missing or invalid, when POST .../receiving-manager-decision is called, then the response is 400 `VALIDATION_ERROR`.
6. receiving-manager-transfer-approval.AC6 — Given a request not assigned to the caller as `receivingManagerId`, when POST .../receiving-manager-decision is called, then the response is 403 `FORBIDDEN`.
7. receiving-manager-transfer-approval.AC7 — Given a request whose `status` is not `Pending Receiving Manager Approval`, when POST .../receiving-manager-decision is called, then the response is 409 `INVALID_STATUS_TRANSITION`.
8. receiving-manager-transfer-approval.AC8 — Given a nonexistent `id`, when POST .../receiving-manager-decision is called, then the response is 404 `NOT_FOUND`.
9. receiving-manager-transfer-approval.AC9 — Given no valid token, when either endpoint in this spec is called, then the response is 401 `UNAUTHORIZED`.
10. receiving-manager-transfer-approval.AC10 — Given a request assigned to the caller stays in `Pending Receiving Manager Approval` for more than 2 days without a decision (silence, not an explicit reject), then it is flagged `escalated: true` — this is a separate path from the reject-and-reassign flow, and `status` is unchanged.
11. receiving-manager-transfer-approval.AC11 — Given a request assigned to the caller in the correct status, when GET /api/v1/transfer-requests/pending/receiving-manager is called, then it appears in the list.
12. receiving-manager-transfer-approval.AC12 — Given a request goes on `Hold` (AC3/AC4), when the requesting Employee views it (transfer-request-submission.spec.md GET .../me or .../:id), then `status: "Hold"` and `holdReason` are visible.

## Unit Test Cases (spec-derived)

| Test ID | Maps to AC | Scenario | Expected |
|---|---|---|---|
| receiving-manager-transfer-approval.UT01 | AC1 | Accept | 200, `status: "Pending Fulfillment Trigger"` |
| receiving-manager-transfer-approval.UT02 | AC2 | Reject with a second manager available | 200, `status: "Pending Receiving HR Reassignment"` |
| receiving-manager-transfer-approval.UT03 | AC3 | Reject as the last untried manager (multi-manager dept) | 200, `status: "Hold"` |
| receiving-manager-transfer-approval.UT04 | AC4 | Reject as the sole manager at that Department+Location | 200, `status: "Hold"` |
| receiving-manager-transfer-approval.UT05 | AC5 | Reject with `reasonCode` omitted | 400 `VALIDATION_ERROR` |
| receiving-manager-transfer-approval.UT06 | AC6 | Decide a request assigned to a different manager | 403 `FORBIDDEN` |
| receiving-manager-transfer-approval.UT07 | AC7 | Decide a request already `Hold` | 409 `INVALID_STATUS_TRANSITION` |
| receiving-manager-transfer-approval.UT08 | AC8 | Decide a nonexistent request id | 404 `NOT_FOUND` |
| receiving-manager-transfer-approval.UT09 | AC9 | Call either endpoint with no token | 401 `UNAUTHORIZED` |
| receiving-manager-transfer-approval.UT10 | AC10 | Advance a fake clock past 2 days with no decision | `escalated: true`, `status` unchanged |
| receiving-manager-transfer-approval.UT11 | AC11 | List pending queue for a manager with 1 assigned request | Request returned |
| receiving-manager-transfer-approval.UT12 | AC12 | Employee views their `Hold` request | `status`/`holdReason` visible |

## Explicitly Out of Scope
- Resolution mechanics for an escalated item (2-day silence) — flag-only, consistent with every other gate spec.
- Enforcing exclusion of previously-rejecting managers on a later `reopen-hold` (see receiving-hr-transfer-gatekeeping.spec.md's own flagged gap on this point).
- Any UI/notification informing candidate managers their turn has come — out of this journey's scope (they simply see it via their own pending-queue GET).

## Non-Functional Constraints (from constitution.md)
- Every endpoint sits behind Employee JWT verification (Security Posture).
- Test-first mandatory, minimum 80% line coverage (Testing Discipline).
