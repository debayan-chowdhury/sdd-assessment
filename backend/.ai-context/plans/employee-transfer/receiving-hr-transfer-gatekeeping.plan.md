# Plan: Receiving HR Transfer Gatekeeping

## Derived From
.ai-context/specs/employee-transfer/receiving-hr-transfer-gatekeeping.spec.md

## Architecture Approach
New module:
- `src/controllers/receivingHrGatekeeping.controller.js` — handlers for receiving-hr-transfer-gatekeeping.API01–API08 (8 endpoints — the largest controller in this journey, mirroring the spec's own 4-touchpoint scope).

**Adds to `transferRequestWorkflow.service.js`** (owned by transfer-request-submission.plan.md, extended here rather than duplicated): a new exported `validateManagerAssignment(managerId, locationId, departmentId)` helper — active, `Manager`-category, at the given Department+Location — shared by this plan's API02/API03/API08 (all three assign a manager) rather than repeated three times in one controller.

**Adds to `transferRequest.routes.js`**: all 8 endpoints, gated by `employeeAuth.middleware.js`.

**The literal early-org-update reading (AC1):** on Receiving HR's gate-accept, `receivingHrGatekeeping.controller.js` writes `newLocationId`/`newDepartmentId`/`newRoleId` directly onto the `Employee` document (via `Employee.findByIdAndUpdate`, not through `employeeMapping.service.js`'s full create/update validation chain — that chain is designed for Admin-initiated changes with a fresh `managerId`/`hrId` pair, which doesn't apply here since this update only touches Location/Department/Role). This is implemented exactly as the spec's flagged reading states; no rollback path exists if the Receiving Manager later rejects, per the spec's own flagged note.

## Data Model
No schema change beyond what transfer-request-submission.plan.md already defines (`rejectedManagerIds` is appended to here, by API02's reject path and API03/API08's reassignment, but the field itself is already declared there). Writes `Employee.locationId`/`departmentId`/`roleId` (existing fields, employee-crud-mapping.plan.md). API06 (respond-need-information) appends `direction: 'reply'` entries to `TransferRequest.fulfillmentMessages` — declared by transfer-request-submission.plan.md, reused here unchanged.

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. Given this is the largest controller in the journey (8 handlers), each gets independent test coverage — not a single combined "gatekeeping" test.
- [x] Security Posture — no new PII/credential field; the `Employee` write in API02 touches only `locationId`/`departmentId`/`roleId`, never `name`/`passwordHash`. Every endpoint sits behind `employeeAuth.middleware.js`.
- [x] Architectural Constraints — no new datastore, no messaging; "sends a confirmation email" (spec's API07 note) is explicitly not implemented, consistent with no notification system existing anywhere in `architecture.md`'s Integration Points.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — additive routes on the existing `/api/v1/transfer-requests` resource; no breaking change.

## Explicitly Deferred
- Actually sending a confirmation email (API07) — no notification/email system exists in this project; `confirm-completion` only changes `status`, per the spec's own Explicitly Out of Scope.
- Enforcing that a reassigned/reopened manager wasn't already tried — the spec flags this as unenforced; `validateManagerAssignment` checks role/scope only, not `rejectedManagerIds` exclusion, matching the spec's own stated gap (not silently adding a stricter check the spec didn't ask for).
- Resolution mechanics for an escalated item at this gate — no endpoint built, consistent with every other plan in this journey.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest). Depends on transfer-request-submission.plan.md, portal-login-password-change.plan.md, and employee-crud-mapping.plan.md (the `Employee` model this plan writes to).
1. Add `validateManagerAssignment` to `transferRequestWorkflow.service.js`, tested independently.
2. `receivingHrGatekeeping.controller.js` — gate-decision handler (API01–API02, AC1–AC3), including the `Employee` org-data write on accept.
3. `receivingHrGatekeeping.controller.js` — reassign-manager handler (API03, AC4).
4. `receivingHrGatekeeping.controller.js` — trigger-fulfillment handler (API04, AC5), setting `payrollStatus`/`itStatus` to `Pending` and `facilitiesStatus` per the location-change comparison.
5. `receivingHrGatekeeping.controller.js` — fulfillment-queue and respond-need-information handlers (API05–API06, AC6).
6. `receivingHrGatekeeping.controller.js` — confirm-completion handler (API07, AC7–AC8).
7. `receivingHrGatekeeping.controller.js` — reopen-hold handler (API08, AC9–AC10), including the 6-month `HOLD_WINDOW_EXPIRED` check against `holdStartedAt`.
8. Add all 8 routes to `transferRequest.routes.js`.
9. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
