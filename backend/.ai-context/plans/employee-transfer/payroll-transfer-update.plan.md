# Plan: Payroll Transfer Update

## Derived From
.ai-context/specs/employee-transfer/payroll-transfer-update.spec.md

## Architecture Approach
New module:
- `src/controllers/payrollUpdate.controller.js` — handlers for payroll-transfer-update.API01–API02.

**Adds to `transferRequest.routes.js`**: `GET /api/v1/transfer-requests/pending/payroll` and `POST /api/v1/transfer-requests/:id/payroll-status`, gated by `employeeAuth.middleware.js` plus an in-controller `req.employee.roleCategory === 'Payroll'` check (403 `FORBIDDEN` otherwise) — not a separate role-check middleware, since only this and the two sibling fulfillment plans need it and each checks a different literal category; a shared `requireRoleCategory(category)` middleware factory would be the natural refactor if a fourth role-scoped spec appeared, but three call sites doesn't yet justify the abstraction.

**Org-wide scope (the spec's flagged assumption):** the pending-list query filters only on `payrollStatus IN ('Pending', 'Need Information')` — no `locationId`/`departmentId` filter — so any active Employee with `roleCategory: 'Payroll'` sees every such request, system-wide.

## Data Model
No schema change. Reads/writes `TransferRequest.payrollStatus`, `escalated`/`escalatedAt`, `statusEnteredAt`, and appends `direction: 'report'` entries to `fulfillmentMessages` (all declared by transfer-request-submission.plan.md, which owns this shared field precisely so no fulfillment plan depends on another's build order — see that plan's Data Model note). it-transfer-provisioning.plan.md and facilities-transfer-arrangement.plan.md append to the same field with their own `target` value; receiving-hr-transfer-gatekeeping.plan.md appends `direction: 'reply'` entries.

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor.
- [x] Security Posture — no new PII/credential field. Every endpoint sits behind `employeeAuth.middleware.js` plus the role-category check.
- [x] Architectural Constraints — no new datastore, no messaging; no integration with any actual external Payroll system, per the spec's explicit scope boundary.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Building or integrating with Payroll's actual external portal/system — BRD-007, explicit, permanent.
- Determining whether pay is actually affected — left to the reporting Payroll Employee's judgment; no automatic condition is computed by this plan, consistent with the spec's flagged assumption.
- Resolution mechanics for an escalated item (5-business-day silence) — no endpoint built.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md, portal-login-password-change.plan.md, and receiving-hr-transfer-gatekeeping.plan.md's trigger-fulfillment handler (which first sets `payrollStatus` to `Pending`) for end-to-end testability.
1. `payrollUpdate.controller.js` — pending-list handler (AC10), scoped to the caller's role category.
2. `payrollUpdate.controller.js` — status-report handler (AC1–AC9), including the `message`-required-on-Need-Information check (appended to `fulfillmentMessages`) and the `INVALID_STATUS_TRANSITION` guard.
3. Add both routes to `transferRequest.routes.js`.
4. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
