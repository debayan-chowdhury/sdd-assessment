# Plan: Transfer Request Submission

## Derived From
.ai-context/specs/transfer-request-submission.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
Assumes portal-login-password-change.plan.md's foundational infra (`lib/axios.ts`, `lib/queryClient.ts`, `AuthGuard`, auth store) already exists.

- **New route segments**: `src/app/transfer-request/new/page.tsx`, `src/app/transfer-request/[id]/page.tsx` — thin, render `NewTransferRequestScreen`/`TransferRequestStatusScreen`. A third, unparameterized `src/app/transfer-request/page.tsx` resolves AC5 — a server/client redirect layer that checks the user's own active request (via the `me` query) and either shows `NewTransferRequestScreen` or redirects to `/transfer-request/[id]` for the active one.
- **New screens**: `src/screens/transfer-request/NewTransferRequestScreen.tsx`, `src/screens/transfer-request/TransferRequestStatusScreen.tsx`, plus `src/screens/transfer-request/components/` for the status timeline, hold/rejection banners, and escalation indicator (AC11, AC12, AC14) — these sub-components are reused by every approval/fulfillment screen in this journey that also needs to show a request's status, so they're built here since this is the plan that first owns the `TransferRequest` type.
- **New data layer**: `src/features/transfer-request/transfer-request.api.ts` (API01–API03 Axios calls), `transfer-request.queries.ts` (`useMyTransferRequests` for API02, `useTransferRequest(id)` for API03), `transfer-request.mutations.ts` (`useSubmitTransferRequest` for API01).
- **Location/Department/Role option lists** for the form (AC2, AC7): the spec's API Contract doesn't include an endpoint for these — they must come from the Admin Panel's own CRUD read endpoints (`GET /api/v1/locations`, `/departments`, `/roles`, per the backend's admin specs, not part of this journey's contract). Flagged as an Open Question below since it's outside what transfer-request-submission.spec.md itself grants this plan authority to assume.

## Data Model
No backend schema owned here. New client-side type `src/types/transferRequest.ts`, mirroring API01's success-response shape (also the shape API02/API03 return):
```ts
type TransferRequestStatus =
  | "Pending Current Manager Approval" | "Pending Current HR Approval"
  | "Pending Receiving HR Approval" | "Pending Receiving Manager Approval"
  | "Pending Receiving HR Reassignment" | "Pending Fulfillment Trigger"
  | "Pending Fulfillment" | "Completed" | "Rejected" | "Hold";

type FulfillmentSubStatus = "Pending" | "Need Information" | "Done" | "Not Applicable" | null;

type TransferRequest = {
  id: string; employeeId: string;
  currentLocationId: string; currentDepartmentId: string; currentRoleId: string;
  newLocationId: string; newDepartmentId: string; newRoleId: string;
  effectiveDate: string; reason: string | null;
  status: TransferRequestStatus;
  currentManagerId: string; currentHrId: string;
  receivingHrId: string; receivingManagerId: string | null;
  payrollStatus: FulfillmentSubStatus; itStatus: FulfillmentSubStatus; facilitiesStatus: FulfillmentSubStatus;
  rejectionReason: string | null; holdReason: string | null;
  escalated: boolean; escalatedAt: string | null; createdAt: string;
};
```
This type is `Related:` for every other spec's plan in this journey — none of them redefine it.

## Constitution Check
**Testing Discipline**
- [x] Vitest + RTL — reuses the project-wide setup from portal-login-password-change.plan.md (no reinstall needed).
- [ ] Test-first scope / coverage floor — not yet decided project-wide (constitution.md gap); nothing to check this plan against.

**Security Posture**
- [x] Sensitive data never in console/logs — employee name/target-org fields displayed on screen but never logged.
- [x] Auth baseline — every screen in this plan sits behind `AuthGuard`; no new auth surface introduced.
- [x] Default password / no complexity / no timeout / no lockout — N/A, this spec has nothing to do with credentials.
- [x] JWT in `localStorage` via Axios interceptor — reused as-is from `lib/axios.ts`, no new token handling.
- [x] No `middleware.ts` auth gating — no `middleware.ts` touched.
- [x] Secrets/`.env` — no new env vars introduced by this plan.

**Architectural Constraints**
- [x] No local datastore — all data via `/api/v1`.
- [x] Axios only — `transfer-request.api.ts` uses the shared `lib/axios.ts` instance, no new `fetch()` calls.
- [x] TanStack Query only — `transfer-request.queries.ts`/`.mutations.ts` are the only place this feature holds server data; no `useState`/`useEffect` fetch duplication.
- [x] Zustand only where cross-component client state is needed — this feature needs none (form state is local `useState`/form-library state, not cross-component); no new store created.
- [x] Route files thin only — all three new `page.tsx` files only import and render.
- [x] No datastore/library outside the approved list — none introduced.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — not yet decided (constitution.md gap); nothing to check against.
- [x] The 30-day minimum-notice and status-vocabulary rules are business rules owned by the backend spec, not an NFR this frontend plan is responsible for enforcing beyond the client-side UX mirror in AC3.

**Versioning Rules**
- [x] Targets `/api/v1` — all three consumed endpoints are under this prefix.
- [ ] Breaking-change/deprecation policy — not yet decided (constitution.md gap).

## Explicitly Deferred
- **A human-readable status label map** — the spec's own Design Note defers this explicitly; `TransferRequestStatusScreen` renders raw `status` strings in this plan. A label map is a small, low-risk follow-up, not built now.
- **The 6-month tenure eligibility display** — spec's Explicitly Out of Scope: not shown at submission time; owned by current-hr-transfer-approval's plan instead.
- **Escalation-item resolution UI** — no such action exists anywhere in the backend contract (journey-wide flagged gap); this plan only renders the `escalated` flag (AC14), never an action for it.

## Sequencing
1. `src/types/transferRequest.ts`.
2. `src/features/transfer-request/transfer-request.api.ts`.
3. `src/features/transfer-request/transfer-request.queries.ts` + `.mutations.ts`.
4. `src/screens/transfer-request/components/` — status timeline, hold/rejection banners, escalation indicator (shared building blocks).
5. `src/screens/transfer-request/NewTransferRequestScreen.tsx` (form, client-side 30-day validation) + `src/app/transfer-request/new/page.tsx`.
6. `src/screens/transfer-request/TransferRequestStatusScreen.tsx` + `src/app/transfer-request/[id]/page.tsx`.
7. `src/app/transfer-request/page.tsx` — active-request redirect/form-or-status resolver (AC5).
8. Tests for steps 2–7, per AC1–AC14.

## Open Questions
- **Resolved 2026-09-04 — Location/Department/Role option-list source for the submission form.** transfer-request-submission.spec.md's API Contract only covers submit/list/get — it didn't include a way to populate the form's dropdowns, and the Admin Panel's master-data endpoints (locations/departments/roles) are `adminAuth`-gated, not reachable with an Employee token. Resolution: added new, narrower endpoints `GET /api/v1/options/{locations,departments,roles}` (`backend/src/routes/options.routes.js`, `backend/src/controllers/options.controller.js`), gated by `employeeAuth` instead of `adminAuth`, returning only active records. These are outside transfer-request-submission.spec.md's original API Contract; now formally owned by their own trio — `backend/.ai-context/specs/employee-transfer/transfer-options.spec.md` (+ `plans/`, `tasks/`) — cross-referenced from transfer-request-submission.spec.md's Context section on both sides (see this repo's spec.md, AC15, and the backend spec's Context).
  - **Amended same day — Department list is cascaded by Location.** The Admin Panel's Location↔Department mapping table (`LocationDepartment`) exists but is unused/empty in this environment, so it's not a reliable signal of which Departments are actually staffed at a Location. Per user direction, `GET /api/v1/options/departments` now requires `locationId` and returns only Departments that have at least one active HR-category Employee *and* at least one active Manager-category Employee at that Location — the minimum staffing `resolveReceivingHr` (submission) and `findCandidateManagers` (receiving-HR gatekeeping) already require downstream, so the dropdown never offers a Location+Department combo that would immediately 404 `NO_RECEIVING_HR` or get stuck later. Role list is intentionally *not* cascaded (by Location or Department) — stays a flat active-Role list, consistent with how `ROLE_NOT_ENABLED_FOR_DEPARTMENT` is already surfaced as a submit-time error (AC8) rather than pre-filtered.
