# Plan: IT Transfer Provisioning

## Derived From
.ai-context/specs/employee-transfer/it-transfer-provisioning.spec.md

## Architecture Approach
New module:
- `src/controllers/itProvisioning.controller.js` — handlers for it-transfer-provisioning.API01–API02. Same structure as payroll-transfer-update.plan.md's controller — read that plan first, this one only calls out what differs.

**Adds to `transferRequest.routes.js`**: `GET /api/v1/transfer-requests/pending/it` and `POST /api/v1/transfer-requests/:id/it-status`, gated by `employeeAuth.middleware.js` plus an in-controller `req.employee.roleCategory === 'IT'` check.

**Org-wide scope:** same reasoning as payroll-transfer-update.plan.md — the pending-list query filters only on `itStatus IN ('Pending', 'Need Information')`, no Location/Department scoping.

## Data Model
No schema change. Reads/writes `TransferRequest.itStatus`, `escalated`/`escalatedAt`, `statusEnteredAt`, and appends `target: 'it', direction: 'report'` entries to `fulfillmentMessages` (all declared by transfer-request-submission.plan.md).

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor.
- [x] Security Posture — no new PII/credential field. Every endpoint sits behind `employeeAuth.middleware.js` plus the role-category check.
- [x] Architectural Constraints — no new datastore, no messaging; no integration with any actual external IT provisioning system, per the spec's explicit scope boundary.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Building or integrating with IT's actual provisioning system — BRD-008, explicit, permanent.
- Defining what triggers IT applicability at all — the spec itself flags this as an unstated gap in the BRD; not resolved here, `itStatus` is simply always `Pending` at trigger time (receiving-hr-transfer-gatekeeping.plan.md).
- Resolution mechanics for an escalated item (5-business-day silence) — no endpoint built.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md, portal-login-password-change.plan.md, and receiving-hr-transfer-gatekeeping.plan.md's trigger-fulfillment handler for end-to-end testability.
1. `itProvisioning.controller.js` — pending-list handler (AC10), scoped to the caller's role category.
2. `itProvisioning.controller.js` — status-report handler (AC1–AC9).
3. Add both routes to `transferRequest.routes.js`.
4. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
