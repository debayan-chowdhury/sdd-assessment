# Plan: Transfer Request Submission

## Derived From
.ai-context/specs/employee-transfer/transfer-request-submission.spec.md

## Architecture Approach
This plan owns the `TransferRequest` entity and the workflow logic every other Employee Transfer journey plan (current-manager-transfer-approval, current-hr-transfer-approval, receiving-hr-transfer-gatekeeping, receiving-manager-transfer-approval, payroll-transfer-update, it-transfer-provisioning, facilities-transfer-arrangement) builds on — it must land first among the 8 `TransferRequest`-touching plans (after portal-login-password-change, for the auth middleware).

New modules:
- `src/models/TransferRequest.js` — Mongoose model (full shape below).
- `src/services/transferRequestWorkflow.service.js` — logic shared across all 8 `TransferRequest`-touching plans, so each doesn't reimplement it: `resolveReceivingHr(locationId, departmentId)`, `findCandidateManagers(locationId, departmentId, excludeIds)`, `computeEscalation(request, thresholdDays, businessDaysOnly)` (lazy — computed on read, not a background job; see below), and the 30-day/one-active-request submission validation this plan's own controller uses directly.
- `src/controllers/transferRequest.controller.js` — handlers for transfer-request-submission.API01–API03.
- `src/routes/transferRequest.routes.js` — mounted at `/api/v1/transfer-requests`, gated by `employeeAuth.middleware.js` (portal-login-password-change.plan.md). **This single route file is shared by all 8 `TransferRequest`-touching plans** — each adds its own routes to it rather than creating a separate router per actor, since they're all sub-paths of the one `/api/v1/transfer-requests` resource. This plan creates the file with its own three routes; later plans append to it (a cross-plan coordination point, called out again in each of their own Sequencing sections, same pattern as the Admin Panel batch's deactivation-guard cross-references).

**Escalation — lazy computation, not a scheduled job:** `constitution.md`'s Architectural Constraints approve only "synchronous REST" with "no messaging/event-driven layer," and `architecture.md` lists no scheduler/cron component. Introducing a background job to flip `escalated: true` the instant 2 days/5 business days elapse would be a new architectural component needing an ADR. Instead, `computeEscalation` runs inside every read path that returns a `TransferRequest` (the `GET .../me`, `GET .../:id`, and every actor's pending-queue endpoint across all 8 plans) and computes `escalated`/`escalatedAt` from `status`-entry timestamp vs. now, at request time — no stored value drifts out of date because nothing is ever "set once" by a timer; it's recomputed on every read. This is a plan-level architectural decision, not stated by any spec; flagged here since it shapes every downstream plan's controller pattern.

## Data Model
**`TransferRequest`** (new collection `transferrequests`):
```js
{
  employeeId: { type: ObjectId, ref: 'Employee', required: true },
  currentLocationId: { type: ObjectId, ref: 'Location', required: true },
  currentDepartmentId: { type: ObjectId, ref: 'Department', required: true },
  currentRoleId: { type: ObjectId, ref: 'Role', required: true },
  newLocationId: { type: ObjectId, ref: 'Location', required: true },
  newDepartmentId: { type: ObjectId, ref: 'Department', required: true },
  newRoleId: { type: ObjectId, ref: 'Role', required: true },
  effectiveDate: { type: Date, required: true },
  reason: { type: String, default: null },
  status: {
    type: String,
    required: true,
    enum: [
      'Pending Current Manager Approval', 'Pending Current HR Approval',
      'Pending Receiving HR Approval', 'Pending Receiving Manager Approval',
      'Pending Receiving HR Reassignment', 'Pending Fulfillment Trigger',
      'Pending Fulfillment', 'Hold', 'Rejected', 'Completed',
    ],
    default: 'Pending Current Manager Approval',
  },
  statusEnteredAt: { type: Date, required: true, default: Date.now },
  currentManagerId: { type: ObjectId, ref: 'Employee', required: true },
  currentHrId: { type: ObjectId, ref: 'Employee', required: true },
  receivingHrId: { type: ObjectId, ref: 'Employee', required: true },
  receivingManagerId: { type: ObjectId, ref: 'Employee', default: null },
  rejectedManagerIds: { type: [{ type: ObjectId, ref: 'Employee' }], default: [] },
  rejectionReason: { type: String, default: null },
  holdReason: { type: String, default: null },
  holdStartedAt: { type: Date, default: null },
  payrollStatus: { type: String, enum: ['Pending', 'Need Information', 'Done', 'Not Applicable', null], default: null },
  itStatus: { type: String, enum: ['Pending', 'Need Information', 'Done', 'Not Applicable', null], default: null },
  facilitiesStatus: { type: String, enum: ['Pending', 'Need Information', 'Done', 'Not Applicable', null], default: null },
  escalated: { type: Boolean, default: false },
  escalatedAt: { type: Date, default: null },
  fulfillmentMessages: {
    type: [{
      target: { type: String, enum: ['payroll', 'it', 'facilities'] },
      direction: { type: String, enum: ['report', 'reply'] },
      from: { type: ObjectId, ref: 'Employee' },
      message: String,
      at: { type: Date, default: Date.now },
    }],
    default: [],
  },
}
// timestamps: true
```
`fulfillmentMessages` is declared here (not in whichever fulfillment plan happens to build first) precisely to avoid a circular build-order dependency between payroll-transfer-update.plan.md, it-transfer-provisioning.plan.md, facilities-transfer-arrangement.plan.md, and receiving-hr-transfer-gatekeeping.plan.md — all four read/append to it, and none of them should have to depend on one of the others' schema step landing first. One shared append-only log (`target` + `direction` distinguishes a Payroll/IT/Facilities "Need Information" report from a Receiving HR reply) rather than three near-duplicate per-target fields; no multi-turn threading structure is specified anywhere in the journey, so a flat log is sufficient.
`statusEnteredAt` is a field this plan introduces beyond what the spec's response shape names explicitly — it's how `computeEscalation` knows how long the request has sat in its current status without needing a separate audit-log collection; reset to `Date.now()` every time `status` changes, by every plan's own controller. `rejectedManagerIds` is likewise a plan-level field (not in the spec's documented response shape) backing receiving-manager-transfer-approval.spec.md's candidate-exhaustion logic and receiving-hr-transfer-gatekeeping.spec.md's reassignment; both specs describe the *behavior* without naming a schema field, so this plan makes the concrete storage decision.

An index on `{ employeeId: 1, status: 1 }` supports the `ACTIVE_REQUEST_EXISTS` check (AC3) without a full collection scan.

## Constitution Check
- [x] Testing Discipline — Jest, test-first, 80% line coverage floor. `transferRequestWorkflow.service.js`'s three exported functions each get independent test coverage, not just incidental coverage via the controller tests.
- [x] Security Posture — no new PII field (name/DOB/phone/email/govID/payment) is introduced; `reason` is free text an employee provides about their own transfer, not PII in constitution.md's enumerated sense, but is still excluded from any log statement in this plan's scope as a matter of caution. Every endpoint sits behind `employeeAuth.middleware.js` — no public route in this plan.
- [x] Architectural Constraints — MongoDB via Mongoose, the approved datastore; no new datastore. REST only, no messaging — the escalation design above is a direct consequence of this rule, not an incidental choice.
- [x] Non-Functional Baselines — constitution.md flags this section as an open gap itself — nothing to check this plan against.
- [x] Versioning Rules — `/api/v1/transfer-requests` matches constitution.md's versioning scheme; new surface area, not a breaking change.

## Explicitly Deferred
- Edit/withdraw/cancel a submitted request — BRD-002, explicit, permanent; no such endpoint exists in `transferRequest.routes.js`.
- Auto-expiry of a 6-month-lapsed `Hold` — the spec's own Explicitly Out of Scope flags this and this plan re-defers it rather than inventing a background sweep (which would also need the same "no scheduler" justification as escalation above, but with no BRD-stated behavior to implement even if one existed). `ACTIVE_REQUEST_EXISTS` (AC3) continues to block a new submission while a stale `Hold` sits unresolved past 6 months — a known, accepted gap until BRD-006's lapse behavior is specified concretely.
- Resolution mechanics for an escalated ("HR Operations / Portal Admin queue") item — no endpoint is built anywhere in this journey for it; `escalated`/`escalatedAt` are surfaced read-only.

## Sequencing
Per constitution.md's Testing Discipline, every step below is test-first (Jest).
1. `TransferRequest` model + the `{employeeId, status}` index.
2. `transferRequestWorkflow.service.js` — `resolveReceivingHr`, `findCandidateManagers`, `computeEscalation` (each independently tested).
3. `transferRequest.controller.js` — create handler (AC1–AC9): 30-day check, active-request check, Location/Department/Role validation, `ROLE_NOT_ENABLED_FOR_DEPARTMENT` check, Receiving HR resolution via the service, snapshotting Current Manager/HR from the Employee record.
4. `transferRequest.controller.js` — `GET .../me` and `GET .../:id` handlers (AC10–AC11), applying `computeEscalation` to every returned request.
5. `transferRequest.routes.js`, mounted at `/api/v1/transfer-requests` in `src/index.js`, gated by `employeeAuth.middleware.js`.
6. Confirm ≥80% line coverage for this plan's new code, per constitution.md's Testing Discipline floor.
