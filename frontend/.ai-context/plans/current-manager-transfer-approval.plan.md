# Plan: Current Manager Transfer Approval

## Derived From
.ai-context/specs/current-manager-transfer-approval.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's infra and transfer-request-submission.plan.md's `TransferRequest` type + shared status sub-components already exist.

- **Route**: `src/app/approvals/page.tsx` (shared across every approval/fulfillment spec in this journey — one thin route, rendering `ApprovalsInboxScreen`, which composes one section per role the logged-in user is relevant to). This plan adds the Current Manager section to that composition; it does not own the route file itself (portal-login-password-change's AC9 redirect already assumes `/approvals` exists as a destination).
- **New screen section**: `src/screens/approvals/CurrentManagerQueue.tsx`, composed into `src/screens/approvals/ApprovalsInboxScreen.tsx`.
- **New data layer**: added to `src/features/transfer-request/transfer-request.queries.ts` (`useCurrentManagerQueue` for API01) and `.mutations.ts` (`useCurrentManagerDecision` for API02) — extends the existing feature module rather than creating a new one, since this is still the same `TransferRequest` entity.
- **New shared component** (first plan to need it, reused by every later reject-with-reason flow): `src/components/ui/RejectReasonDialog.tsx` — a reason-required confirmation dialog, parameterized by whether the reason is mandatory (this spec: yes, per AC4) or optional (current-hr-transfer-approval: no).

## Data Model
No new type — reuses `TransferRequest` from `src/types/transferRequest.ts` (transfer-request-submission.plan.md). No backend schema owned here.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses project-wide setup, no reinstall.
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap).

**Security Posture**
- [x] Sensitive data never in console/logs — requesting-employee name never logged.
- [x] Auth baseline — screen sits behind `AuthGuard`; no new auth surface.
- [x] Credentials/session rules — N/A, this spec has nothing to do with credentials.
- [x] JWT/Axios interceptor — reused as-is.
- [x] No `middleware.ts` gating — untouched.
- [x] Secrets/`.env` — no new env vars.

**Architectural Constraints**
- [x] No local datastore.
- [x] Axios only — extends the existing `transfer-request.api.ts` module.
- [x] TanStack Query only — `useCurrentManagerQueue`/`useCurrentManagerDecision` are the only server-state access here; on decision success, the query cache for the queue is invalidated (not a manual `useState` list).
- [x] Zustand only where needed — none needed here; dialog open/close state is local component state.
- [x] Route files thin only — `app/approvals/page.tsx` unaffected by this plan beyond composing one more section.
- [x] No datastore/library outside the approved list.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — not yet decided (constitution.md gap).
- [x] The 2-day escalation SLA is a backend-owned rule; this plan only renders the resulting `escalated` flag (AC8), it does not implement the timer.

**Versioning Rules**
- [x] Targets `/api/v1`.
- [ ] Breaking-change/deprecation policy — not yet decided (constitution.md gap).

## Explicitly Deferred
- **Team-continuity/handover administration** — spec's own Explicitly Out of Scope; no UI beyond Accept/Reject.
- **Escalation-item resolution UI** — journey-wide flagged gap, flag-only here too.

## Sequencing
1. `src/components/ui/RejectReasonDialog.tsx` (shared, mandatory-reason mode used here).
2. Extend `transfer-request.queries.ts` with `useCurrentManagerQueue`.
3. Extend `transfer-request.mutations.ts` with `useCurrentManagerDecision`.
4. `src/screens/approvals/CurrentManagerQueue.tsx`.
5. Compose into `src/screens/approvals/ApprovalsInboxScreen.tsx` (create the screen shell here if it doesn't exist yet from an earlier-sequenced plan).
6. Tests for steps 2–5, per AC1–AC9.
