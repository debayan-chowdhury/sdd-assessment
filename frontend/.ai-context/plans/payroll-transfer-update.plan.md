# Plan: Payroll Transfer Update

## Derived From
.ai-context/specs/payroll-transfer-update.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's infra, transfer-request-submission.plan.md's `TransferRequest` type, and current-manager-transfer-approval.plan.md's `ApprovalsInboxScreen` shell already exist.

- **New generic shared component** (built here, first of the three near-identical fulfillment specs; reused as-is by it-transfer-provisioning and facilities-transfer-arrangement's plans): `src/screens/approvals/components/FulfillmentWorklist.tsx` — takes a `target: "payroll" | "it" | "facilities"`, a queue query hook, and a status-update mutation hook as props, and renders the list + Mark Done / Need Information controls generically (AC1–AC9 are identical in shape across all three specs).
- **New screen section**: `src/screens/approvals/PayrollWorklist.tsx` — a thin wrapper instantiating `FulfillmentWorklist` with Payroll's query/mutation hooks and the `roleCategory === "Payroll"` gate (AC1), composed into `ApprovalsInboxScreen`.
- **New data layer**: extends `transfer-request.queries.ts` (`usePayrollWorklist` for API01) and `.mutations.ts` (`usePayrollStatusUpdate` for API02).

## Data Model
No new persisted type — reuses `TransferRequest`. No schema change.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses project-wide setup.
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap).

**Security Posture**
- [x] Sensitive data never in console/logs — employee name/target-org fields never logged.
- [x] Auth baseline — screen sits behind `AuthGuard`; role gate (`roleCategory === "Payroll"`) is UX only, the backend's own `403 FORBIDDEN` is the real boundary.
- [x] Credentials/session rules — N/A.
- [x] JWT/Axios interceptor — reused as-is.
- [x] No `middleware.ts` gating — untouched.
- [x] Secrets/`.env` — no new env vars.

**Architectural Constraints**
- [x] No local datastore.
- [x] Axios only — extends existing `transfer-request.api.ts`.
- [x] TanStack Query only — `usePayrollWorklist`/`usePayrollStatusUpdate`, cache invalidated on update.
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
- **Any integration with Payroll's actual external system** — spec's own Explicitly Out of Scope.
- **Computing whether pay is actually affected** — left to the reporting user's judgment; no client-side heuristic invented.
- **Escalation-item resolution UI** — journey-wide flagged gap, flag-only here too.

## Sequencing
1. Extend `transfer-request.queries.ts` with `usePayrollWorklist`.
2. Extend `transfer-request.mutations.ts` with `usePayrollStatusUpdate`.
3. `src/screens/approvals/components/FulfillmentWorklist.tsx` (generic, built here).
4. `src/screens/approvals/PayrollWorklist.tsx`.
5. Compose into `ApprovalsInboxScreen`.
6. Tests for steps 1–4, per AC1–AC9.
