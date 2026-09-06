# Plan: Receiving HR Transfer Gatekeeping

## Derived From
.ai-context/specs/receiving-hr-transfer-gatekeeping.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's infra, transfer-request-submission.plan.md's `TransferRequest` type, and current-manager-transfer-approval.plan.md's `RejectReasonDialog`/`ApprovalsInboxScreen` shell already exist.

- **New screen sections**, composed into `ApprovalsInboxScreen`: `src/screens/approvals/ReceivingHrGateQueue.tsx` (API01/API02, plus the reassign action AC12/API03), `src/screens/approvals/ReceivingHrFulfillmentQueue.tsx` (API04–API07), and a `ReceivingHrHoldReopen.tsx` sub-component (API08, AC13/AC14) rendered wherever a `Hold` request the caller is `receivingHrId` on is shown.
- **New shared component**: `src/components/ui/ManagerPicker.tsx` — a required-selection control used by both the gate-accept flow (AC2) and the reassign flow (AC12). Its actual data source is an **Open Question** (see below); this plan builds the control against a placeholder query hook (`useCandidateManagers(locationId, departmentId)`) whose implementation is blocked on that question, not invented here.
- **New data layer**: extends `transfer-request.queries.ts` (`useReceivingHrGateQueue`, `useReceivingHrFulfillmentQueue`) and `.mutations.ts` (`useReceivingHrGateDecision`, `useReassignManager`, `useTriggerFulfillment`, `useRespondNeedInformation`, `useConfirmCompletion`, `useReopenHold`) — six mutations, all extending the existing `transfer-request` feature module.

## Data Model
No new persisted type — reuses `TransferRequest`. The `respond-need-information` payload (`{ target: "payroll" | "it" | "facilities", message: string }`) is a request-only shape, added to `src/types/transferRequest.ts` as `NeedInformationReply`, not stored client-side beyond the mutation call.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses project-wide setup.
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap).

**Security Posture**
- [x] Sensitive data never in console/logs — employee name/target-org fields never logged.
- [x] Auth baseline — screens sit behind `AuthGuard`.
- [x] Credentials/session rules — N/A.
- [x] JWT/Axios interceptor — reused as-is.
- [x] No `middleware.ts` gating — untouched.
- [x] Secrets/`.env` — no new env vars.

**Architectural Constraints**
- [x] No local datastore.
- [x] Axios only — extends existing `transfer-request.api.ts` (and, once resolved, whatever module backs `useCandidateManagers`).
- [x] TanStack Query only — all six mutations invalidate the relevant queue query on success; no manual list mutation.
- [x] Zustand only where needed — none needed; per-row dialog/expanded state is local.
- [x] Route files thin only — no route file changed by this plan.
- [x] No datastore/library outside the approved list.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — not yet decided (constitution.md gap).
- [x] The 2-day/5-day escalation SLAs are backend-owned; this plan only renders `escalated` (AC17), it implements neither timer.

**Versioning Rules**
- [x] Targets `/api/v1`.
- [ ] Breaking-change/deprecation policy — not yet decided (constitution.md gap).

## Explicitly Deferred
- **The literal early-organisational-update behavior** (backend accepts the gate decision by updating the Employee record immediately, before Receiving Manager approval) is a backend concern with no distinct frontend UI implication beyond AC3's confirmation copy — not re-litigated here.
- **Any confirmation-email UI** — spec's own Explicitly Out of Scope; `confirm-completion` only changes status client-side, no email-sent messaging is shown.
- **Enforcing exclusion of previously-rejected managers on reassign/reopen** — neither the spec nor the backend enforces this; `ManagerPicker` shows all candidates the (still-open) data source returns, no client-side filtering invented to compensate.
- **Escalation-item resolution UI** — journey-wide flagged gap, flag-only here too.

## Sequencing
1. Extend `src/types/transferRequest.ts` with `NeedInformationReply`.
2. Extend `transfer-request.queries.ts` with `useReceivingHrGateQueue`/`useReceivingHrFulfillmentQueue`.
3. Extend `transfer-request.mutations.ts` with the six mutations listed above.
4. `src/components/ui/ManagerPicker.tsx` against the placeholder `useCandidateManagers` hook (blocked on the Open Question — build the control's UI/validation now, wire the real data source once it's answered).
5. `src/screens/approvals/ReceivingHrGateQueue.tsx`.
6. `src/screens/approvals/ReceivingHrFulfillmentQueue.tsx`.
7. `src/screens/approvals/ReceivingHrHoldReopen.tsx`.
8. Compose all three into `ApprovalsInboxScreen`.
9. Tests for steps 2–7, per AC1–AC17 (the `ManagerPicker`'s data-fetch tests are mocked against the placeholder hook until the Open Question resolves).

## Open Questions
- **No endpoint exists for listing candidate Receiving Managers.** Neither this journey's BRD nor its backend spec set defines "list Manager-category Employees at Department+Location X" — accept/reassign only *validate* a submitted `assignedManagerId` server-side (`INVALID_MANAGER_ROLE`), they don't provide a way to populate a picker. This is very likely an Admin Panel employee-lookup endpoint that doesn't yet exist in this journey's contract. Needs the spec author to either add the endpoint to a spec (this one, or a new small one) or point at an existing Admin Panel endpoint this frontend is allowed to call. `ManagerPicker`/`useCandidateManagers` cannot be finished until this is answered.
