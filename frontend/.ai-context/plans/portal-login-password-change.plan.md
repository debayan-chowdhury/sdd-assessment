# Plan: Portal Login and Password Change

## Derived From
.ai-context/specs/portal-login-password-change.spec.md (Status: Draft — Gate 1 skipped by explicit user direction, 2026-09-04; this plan is speculative until the spec is actually Approved).

## Architecture Approach
This is the foundational plan for the journey — it builds the shared infrastructure every other spec's plan assumes already exists.

- **New route segments** (thin, per `architecture.md` → Folder Structure): `src/app/login/page.tsx`, `src/app/change-password/page.tsx`, each rendering a matching `src/screens/auth/**` component and nothing else.
- **New screens**: `src/screens/auth/LoginScreen.tsx`, `src/screens/auth/ChangePasswordScreen.tsx`.
- **New shared infra (built once, here, since this is the first plan that needs it)**:
  - `src/lib/axios.ts` — single Axios instance, `baseURL` from `NEXT_PUBLIC_API_BASE_URL`, a request interceptor attaching `Authorization: Bearer <token>` from the Zustand auth store, and a response interceptor that clears the store and redirects to `/login` on any 401 (spec AC11).
  - `src/lib/queryClient.ts` — TanStack `QueryClient` instance, wrapped around the app via `<QueryClientProvider>` in `src/app/layout.tsx`.
  - `src/components/layout/AuthGuard.tsx` — client component wrapping every route via `layout.tsx`; redirects unauthenticated visitors to `/login` (AC1), and redirects to `/change-password` whenever `mustChangePassword: true` regardless of the target route (AC6).
- **New data layer**: `src/features/auth/auth.api.ts` (API01/API02 Axios calls), `auth.mutations.ts` (`useLoginMutation`, `useChangePasswordMutation`), `auth.store.ts` (Zustand: `token`, `employee`, actions to set/clear).
- **New helper**: `src/features/auth/roleLanding.ts` — pure function mapping `roleCategory` → landing path (`null` → `/transfer-request`; `Manager`/`HR`/`Payroll`/`IT`/`Facilities` → `/approvals`), used by both the login and change-password success handlers (AC9).

## Data Model
No backend schema — this repo owns no datastore (`constitution.md` → Architectural Constraints). New **client-side type** `src/types/employee.ts`, mirroring API01's `employee` response object:
```ts
type Employee = {
  id: string; name: string; email: string;
  locationId: string; departmentId: string; roleId: string;
  roleCategory: "HR" | "Manager" | "Payroll" | "IT" | "Facilities" | null;
  mustChangePassword: boolean;
};
```

## Constitution Check
**Testing Discipline**
- [ ] Test framework Vitest + RTL — not yet installed anywhere in this repo; installing it is this plan's job (Sequencing step 1), since no prior plan exists to have done it.
- [ ] Test-first scope / coverage floor — constitution.md itself flags this as not yet decided project-wide; this plan cannot be held to a number that doesn't exist yet, per constitution.md's own caveat.

**Security Posture**
- [x] Sensitive data never in console/logs — `email`, `token`, and profile fields are never `console.log`'d; enforced by code review, not a lint rule (no such rule exists yet).
- [x] Auth baseline: portal-managed username/password, no SSO/AD — LoginScreen has no SSO button or external redirect.
- [x] Default password + mandatory first-login change — implemented via `mustChangePassword` branch in AC2/AC6.
- [x] No password complexity requirement — ChangePasswordScreen validates only presence of `newPassword`, no regex/strength rule (AC8).
- [x] No session timeout / auto-logout / lockout UI — none implemented; the only forced-logout path is the 401 interceptor (AC11), which is a token-invalid response, not a timer.
- [x] JWT in `localStorage`, Bearer via Axios interceptor — exactly what `lib/axios.ts` and `auth.store.ts` implement.
- [x] No `middleware.ts` auth gating — no `middleware.ts` file is created; `AuthGuard` is the sole gate, client-side.
- [x] Secrets/`.env`, `NEXT_PUBLIC_` prefix rule — `NEXT_PUBLIC_API_BASE_URL` is the only env var this plan reads, correctly prefixed since it's consumed in a Client Component (`lib/axios.ts`).

**Architectural Constraints**
- [x] No local datastore — all data via `/api/v1`.
- [ ] Axios only, single instance — `lib/axios.ts` built exactly this way; not yet installed, Sequencing step 1.
- [ ] TanStack Query only — `auth.mutations.ts` uses `useMutation`; not yet installed, Sequencing step 1.
- [ ] Zustand only for cross-component client state — `auth.store.ts` is the canonical example this constraint exists for; not yet installed, Sequencing step 1.
- [x] Route files thin only — `app/login/page.tsx`/`app/change-password/page.tsx` each just import and render their screen.
- [x] No datastore/library outside the approved list — none introduced.

**Non-Functional Baselines**
- [ ] Latency/availability/RPO-RTO — constitution.md flags these as not yet decided; nothing to check this plan against.
- [x] N/A — the 2-day/5-day escalation SLAs (constitution.md's one stated NFR note) don't apply to this spec; login/password-change has no escalation concept.

**Versioning Rules**
- [x] Targets `/api/v1` — both consumed endpoints (`/api/v1/auth/login`, `/api/v1/auth/change-password`) are under this prefix.
- [ ] Breaking-change/deprecation policy for a future v2 — constitution.md flags this as not yet decided; nothing to check this plan against.

## Explicitly Deferred
- **Server-side hard-block enforcement of `mustChangePassword`** — the spec's own Explicitly Out of Scope flags this as undecided at the backend; this plan implements only the client-side redirect (AC6), which is UX guidance, not a security boundary. Re-visit if/when the backend spec resolves this.
- **A finer-grained role-landing map** (e.g. distinct default views for Manager vs. HR, or for "Current" vs. "Receiving" context) — AC9's 3-way split (Employee / Manager-or-HR / fulfillment role) is deliberately coarse since "Current" vs. "Receiving" isn't a login-time property; if a future spec wants a richer landing experience, that's a new decision, not implied here.

## Sequencing
1. `yarn add axios @tanstack/react-query zustand` (project-wide dependency install — every other plan in this journey assumes these exist).
2. `yarn add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom` + minimal Vitest config (project-wide test setup — every other plan assumes this exists).
3. `src/lib/axios.ts` (instance + both interceptors).
4. `src/lib/queryClient.ts`, wrap `src/app/layout.tsx` in `QueryClientProvider`.
5. `src/types/employee.ts`.
6. `src/features/auth/auth.store.ts` (Zustand).
7. `src/features/auth/auth.api.ts` + `auth.mutations.ts`.
8. `src/features/auth/roleLanding.ts`.
9. `src/components/layout/AuthGuard.tsx`, wired into `src/app/layout.tsx`.
10. `src/screens/auth/LoginScreen.tsx` + `src/app/login/page.tsx`.
11. `src/screens/auth/ChangePasswordScreen.tsx` + `src/app/change-password/page.tsx`.
12. Tests for steps 3–11, per AC1–AC12.
