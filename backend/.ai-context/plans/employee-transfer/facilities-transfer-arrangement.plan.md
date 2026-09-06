# Plan: Facilities Transfer Arrangement

## Derived From
.ai-context/specs/employee-transfer/facilities-transfer-arrangement.spec.md

## Architecture Approach
New module:
- `src/controllers/facilitiesArrangement.controller.js` — handlers for facilities-transfer-arrangement.API01–API02. Same structure as payroll-transfer-update.plan.md's controller — read that plan first, this one only calls out what differs.

**Adds to `transferRequest.routes.js`**: `GET /api/v1/transfer-requests/pending/facilities` and `POST /api/v1/transfer-requests/:id/facilities-status`, gated by `employeeAuth.middleware.js` plus an in-controller `req.employee.roleCategory === 'Facilities'` check.

**Org-wide scope:** same reasoning as payroll-transfer-update.plan.md — the pending-list query filters only on `facilitiesStatus IN ('Pending', 'Need Information')`, no Location/Department scoping. Unlike Payroll/IT, a request whose location didn't change is `'Not Applicable'` from the moment receiving-hr-transfer-gatekeeping.plan.md's trigger-fulfillment handler runs (a real, computed condition — not this plan's concern, just a consequence of the value it's handed).

## Data Model
No schema change. Reads/writes `TransferRequest.facilitiesStatus`, `escalated`/`escalatedAt`, `statusEnteredAt`, and appends `target: 'facilities', direction: 'report'` entries to `fulfillmentMessages` (all declared by transfer-request-submission.plan.md).

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor.
- [x] Security Posture — no new PII/credential field. Every endpoint sits behind `employeeAuth.middleware.js` plus the role-category check.
- [x] Architectural Constraints — no new datastore, no messaging; no integration with any actual external workspace-management system, per the spec's explicit scope boundary.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Building or integrating with Facilities' actual workspace-management system — BRD-009, explicit, permanent.
- Resolution mechanics for an escalated item (5-business-day silence) — no endpoint built.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md, portal-login-password-change.plan.md, and receiving-hr-transfer-gatekeeping.plan.md's trigger-fulfillment handler for end-to-end testability.
1. `facilitiesArrangement.controller.js` — pending-list handler (AC10), scoped to the caller's role category.
2. `facilitiesArrangement.controller.js` — status-report handler (AC1–AC9), including the `INVALID_STATUS_TRANSITION` guard for a `'Not Applicable'` (location-unchanged) request.
3. Add both routes to `transferRequest.routes.js`.
4. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
