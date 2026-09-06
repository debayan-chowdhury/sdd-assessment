# Plan: Current HR Transfer Approval

## Derived From
.ai-context/specs/current-hr-transfer-approval.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's infra, transfer-request-submission.plan.md's `TransferRequest` type, and current-manager-transfer-approval.plan.md's `RejectReasonDialog` (used here in optional-reason mode) and `ApprovalsInboxScreen` shell already exist.

- **New screen section**: `src/screens/approvals/CurrentHrQueue.tsx`, composed into the existing `ApprovalsInboxScreen`.
- **New data layer**: extends `transfer-request.queries.ts` (`useCurrentHrQueue` for API01, returning items with `employeeTenureDays`/`meetsMinimumTenure`) and `.mutations.ts` (`useCurrentHrDecision` for API02).

## Data Model
No new persisted type. The API01 response items extend `TransferRequest` with two backend-computed fields not part of the entity's own shape (they only exist on this queue's response, not on the entity returned elsewhere):
```ts
type CurrentHrQueueItem = TransferRequest & {
  employeeTenureDays: number;
  meetsMinimumTenure: boolean;
};
```
Added to `src/types/transferRequest.ts` alongside the base type.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses project-wide setup.
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap).

**Security Posture**
- [x] Sensitive data never in console/logs — employee name/tenure figures never logged.
- [x] Auth baseline — screen sits behind `AuthGuard`.
- [x] Credentials/session rules — N/A.
- [x] JWT/Axios interceptor — reused as-is.
- [x] No `middleware.ts` gating — untouched.
- [x] Secrets/`.env` — no new env vars.

**Architectural Constraints**
- [x] No local datastore.
- [x] Axios only — extends existing `transfer-request.api.ts`.
- [x] TanStack Query only — `useCurrentHrQueue`/`useCurrentHrDecision`, cache invalidated on decision.
- [x] Zustand only where needed — none needed.
- [x] Route files thin only — no route file changed by this plan.
- [x] No datastore/library outside the approved list.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — not yet decided (constitution.md gap).
- [x] The 2-day escalation SLA and the 6-month tenure rule are backend-owned; this plan only renders their computed results (`escalated`, `meetsMinimumTenure`), it implements neither.

**Versioning Rules**
- [x] Targets `/api/v1`.
- [ ] Breaking-change/deprecation policy — not yet decided (constitution.md gap).

## Explicitly Deferred
- **Any correction/backfill of historical tenure data** — spec's own Explicitly Out of Scope; the backend's flagged approximation (`Employee.createdAt`) is displayed as-is.
- **Escalation-item resolution UI** — journey-wide flagged gap, flag-only here too.

## Sequencing
1. Extend `src/types/transferRequest.ts` with `CurrentHrQueueItem`.
2. Extend `transfer-request.queries.ts` with `useCurrentHrQueue`.
3. Extend `transfer-request.mutations.ts` with `useCurrentHrDecision`.
4. `src/screens/approvals/CurrentHrQueue.tsx` (reuses `RejectReasonDialog` in optional-reason mode).
5. Compose into `ApprovalsInboxScreen`.
6. Tests for steps 2–5, per AC1–AC9.
