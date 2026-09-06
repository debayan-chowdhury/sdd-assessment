# Plan: Receiving Manager Transfer Approval

## Derived From
.ai-context/specs/receiving-manager-transfer-approval.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's infra, transfer-request-submission.plan.md's `TransferRequest` type, and current-manager-transfer-approval.plan.md's `ApprovalsInboxScreen` shell already exist.

- **New screen section**: `src/screens/approvals/ReceivingManagerQueue.tsx`, composed into `ApprovalsInboxScreen`.
- **New shared component**: `src/components/ui/ReasonCodeDialog.tsx` — a reject dialog requiring a selection from a fixed enum (`NO_HEADCOUNT` / `ROLE_SKILL_MISMATCH` / `TIMING_CONFLICT` / `OTHER`, AC3) plus optional free text, distinct from `RejectReasonDialog` (free-text-only, used by the Current Manager/HR specs) since this gate's reason shape is structured.
- **New data layer**: extends `transfer-request.queries.ts` (`useReceivingManagerQueue` for API01) and `.mutations.ts` (`useReceivingManagerDecision` for API02).

## Data Model
No new persisted type — reuses `TransferRequest`. The reject payload shape (`{ decision: "reject", reasonCode, reasonDetail? }`) is a request-only shape, typed inline in the mutation hook, not added to `transferRequest.ts` since it isn't part of the entity itself.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses project-wide setup.
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap).

**Security Posture**
- [x] Sensitive data never in console/logs — employee name/target-org fields never logged.
- [x] Auth baseline — screen sits behind `AuthGuard`.
- [x] Credentials/session rules — N/A.
- [x] JWT/Axios interceptor — reused as-is.
- [x] No `middleware.ts` gating — untouched.
- [x] Secrets/`.env` — no new env vars.

**Architectural Constraints**
- [x] No local datastore.
- [x] Axios only — extends existing `transfer-request.api.ts`.
- [x] TanStack Query only — `useReceivingManagerQueue`/`useReceivingManagerDecision`, cache invalidated on decision.
- [x] Zustand only where needed — none needed.
- [x] Route files thin only — no route file changed by this plan.
- [x] No datastore/library outside the approved list.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — not yet decided (constitution.md gap).
- [x] The 2-day escalation SLA is backend-owned; this plan only renders `escalated` (AC9).

**Versioning Rules**
- [x] Targets `/api/v1`.
- [ ] Breaking-change/deprecation policy — not yet decided (constitution.md gap).

## Explicitly Deferred
- **Notifying candidate managers their turn has come** — spec's own Explicitly Out of Scope; they discover it via their own queue.
- **Excluding previously-rejected managers on reassignment** — not enforced by the backend either; no client-side workaround invented.
- **Escalation-item resolution UI** — journey-wide flagged gap, flag-only here too.

## Sequencing
1. `src/components/ui/ReasonCodeDialog.tsx`.
2. Extend `transfer-request.queries.ts` with `useReceivingManagerQueue`.
3. Extend `transfer-request.mutations.ts` with `useReceivingManagerDecision`.
4. `src/screens/approvals/ReceivingManagerQueue.tsx` (branches its success message on the returned `status` — `Pending Receiving HR Reassignment` vs. `Hold` — per AC7).
5. Compose into `ApprovalsInboxScreen`.
6. Tests for steps 2–4, per AC1–AC10.
