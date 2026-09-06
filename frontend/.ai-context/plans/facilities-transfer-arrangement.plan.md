# Plan: Facilities Transfer Arrangement

## Derived From
.ai-context/specs/facilities-transfer-arrangement.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's infra, transfer-request-submission.plan.md's `TransferRequest` type, current-manager-transfer-approval.plan.md's `ApprovalsInboxScreen` shell, and payroll-transfer-update.plan.md's generic `FulfillmentWorklist` component already exist.

- **New screen section**: `src/screens/approvals/FacilitiesWorklist.tsx` — a thin wrapper instantiating `FulfillmentWorklist` with Facilities' query/mutation hooks and the `roleCategory === "Facilities"` gate (AC1), composed into `ApprovalsInboxScreen`. No new generic component needed — this is the third mechanical use of `FulfillmentWorklist`.
- **New data layer**: extends `transfer-request.queries.ts` (`useFacilitiesWorklist` for API01) and `.mutations.ts` (`useFacilitiesStatusUpdate` for API02).

## Data Model
No new persisted type — reuses `TransferRequest`. No schema change.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses project-wide setup.
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap).

**Security Posture**
- [x] Sensitive data never in console/logs — employee name/target-org fields never logged.
- [x] Auth baseline — screen sits behind `AuthGuard`; role gate (`roleCategory === "Facilities"`) is UX only, the backend's own `403 FORBIDDEN` is the real boundary.
- [x] Credentials/session rules — N/A.
- [x] JWT/Axios interceptor — reused as-is.
- [x] No `middleware.ts` gating — untouched.
- [x] Secrets/`.env` — no new env vars.

**Architectural Constraints**
- [x] No local datastore.
- [x] Axios only — extends existing `transfer-request.api.ts`.
- [x] TanStack Query only — `useFacilitiesWorklist`/`useFacilitiesStatusUpdate`, cache invalidated on update.
- [x] Zustand only where needed — none needed.
- [x] Route files thin only — no route file changed by this plan.
- [x] No datastore/library outside the approved list.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — not yet decided (constitution.md gap).
- [x] The 5-business-day escalation SLA is backend-owned; this plan only renders `escalated` (AC8).

**Versioning Rules**
- [x] Targets `/api/v1`.
- [ ] Breaking-change/deprecation policy — not yet decided (constitution.md gap).

## Explicitly Deferred
- **Any integration with Facilities' actual workspace-management system** — spec's own Explicitly Out of Scope.
- **Escalation-item resolution UI** — journey-wide flagged gap, flag-only here too.

## Sequencing
1. Extend `transfer-request.queries.ts` with `useFacilitiesWorklist`.
2. Extend `transfer-request.mutations.ts` with `useFacilitiesStatusUpdate`.
3. `src/screens/approvals/FacilitiesWorklist.tsx`.
4. Compose into `ApprovalsInboxScreen`.
5. Tests for steps 1–3, per AC1–AC9.
