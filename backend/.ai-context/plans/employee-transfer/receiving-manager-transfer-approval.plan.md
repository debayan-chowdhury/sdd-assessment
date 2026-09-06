# Plan: Receiving Manager Transfer Approval

## Derived From
.ai-context/specs/employee-transfer/receiving-manager-transfer-approval.spec.md

## Architecture Approach
New module:
- `src/controllers/receivingManagerApproval.controller.js` — handlers for receiving-manager-transfer-approval.API01–API02, using `transferRequestWorkflow.service.js`'s `findCandidateManagers` (transfer-request-submission.plan.md) to compute remaining candidates on reject.

**Adds to `transferRequest.routes.js`**: `GET /api/v1/transfer-requests/pending/receiving-manager` and `POST /api/v1/transfer-requests/:id/receiving-manager-decision`, gated by `employeeAuth.middleware.js`.

**Reject-and-reassign logic (the spec's flagged assumption, implemented literally):** on reject, the handler appends the rejecting manager to `rejectedManagerIds`, then calls `findCandidateManagers(newLocationId, newDepartmentId, rejectedManagerIds)`. Empty result → `status: 'Hold'`, `holdStartedAt: now`. Non-empty → `status: 'Pending Receiving HR Reassignment'`. This single code path naturally covers both the single-manager case (AC4) and the multi-manager-exhaustion case (AC3), since both reduce to "zero candidates remain" — no separate branch needed for the single-manager case.

## Data Model
No schema change. Reads/writes `TransferRequest.status`, `rejectedManagerIds` (appends), `holdReason`, `holdStartedAt`, `escalated`/`escalatedAt`, `statusEnteredAt` (all declared by transfer-request-submission.plan.md).

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. The candidate-exhaustion branch (single-manager vs. multi-manager-all-rejected) gets explicit test coverage for both cases, not just one representative case.
- [x] Security Posture — no new PII/credential field. Every endpoint sits behind `employeeAuth.middleware.js`.
- [x] Architectural Constraints — no new datastore, no messaging.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Resolution mechanics for an escalated item (2-day silence) — no endpoint built, consistent with every other plan in this journey.
- Any notification to candidate managers that their turn has come — out of scope; they see it via their own pending-queue GET.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md and portal-login-password-change.plan.md. Should land after receiving-hr-transfer-gatekeeping.plan.md's reassign-manager handler (API03) exists, since a rejected-then-reassigned request needs both sides working to be testable end-to-end — though this plan's own reject handler has no direct code dependency on that controller.
1. `receivingManagerApproval.controller.js` — pending-list handler (AC11).
2. `receivingManagerApproval.controller.js` — decision handler (AC1–AC10), including the candidate-exhaustion → `Hold` branch and the `reasonCode` enum validation on reject.
3. Add both routes to `transferRequest.routes.js`.
4. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
