# Tasks: Portal Login and Password Change

## Derived From
.ai-context/plans/portal-login-password-change.plan.md (spec Status: Draft, plan not `Plan Reviewed` — Gate 1/plan-review skipped by explicit user direction, 2026-09-04. These tasks are speculative until the spec/plan are actually reviewed.)

## Sequence
- [x] portal-login-password-change.T01 — Install `zustand` and the test toolchain (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`) with minimal Vitest config; create `src/types/employee.ts` and `src/features/auth/auth.store.ts` (Zustand: `token`, `employee`, `setSession`, `clearSession`), with unit tests for the store — Acceptance: AC2
- [x] portal-login-password-change.T02 — Install `axios`; create `src/lib/axios.ts` (instance with `baseURL` from `NEXT_PUBLIC_API_BASE_URL`, a Bearer request interceptor reading `auth.store.ts`, and a 401 response interceptor calling `clearSession` + redirecting to `/login`), with a test mocking a 401 response — Acceptance: AC11
- [x] portal-login-password-change.T03 — Install `@tanstack/react-query`; create `src/lib/queryClient.ts` and wrap `src/app/layout.tsx` in `QueryClientProvider` — Acceptance: AC2 (infrastructure prerequisite for the login mutation added in T05)
- [x] portal-login-password-change.T04 — Build `src/components/layout/AuthGuard.tsx` (redirects unauthenticated visitors to `/login`; redirects to `/change-password` whenever `mustChangePassword: true` regardless of target route) and wire it into `src/app/layout.tsx`, with tests — Acceptance: AC1, AC6
- [x] portal-login-password-change.T05 — Create `src/features/auth/auth.api.ts` (API01 login call) and add `useLoginMutation` to `auth.mutations.ts` — Acceptance: AC2
- [x] portal-login-password-change.T06 — Create `src/features/auth/roleLanding.ts` (pure function mapping `roleCategory` to a landing path) — Acceptance: AC9
- [x] portal-login-password-change.T07 — Build `src/screens/auth/LoginScreen.tsx` (form with required-field client-side validation, calls `useLoginMutation`, maps 401 `INVALID_CREDENTIALS`/403 `ACCOUNT_INACTIVE` to messages, redirects via `mustChangePassword`/`roleLanding` on success) and `src/app/login/page.tsx`, with tests — Acceptance: AC2, AC3, AC4, AC5, AC9
- [x] portal-login-password-change.T08 — Extend `auth.api.ts` (API02 change-password call) and add `useChangePasswordMutation` to `auth.mutations.ts` — Acceptance: AC7
- [x] portal-login-password-change.T09 — Build `src/screens/auth/ChangePasswordScreen.tsx` (form validating only presence of `newPassword`, no complexity rule; calls `useChangePasswordMutation`; maps 400 `INVALID_CURRENT_PASSWORD` to an inline field error without clearing the form; redirects via `roleLanding` on success) and `src/app/change-password/page.tsx`, with tests — Acceptance: AC7, AC8, AC9, AC10
- [x] portal-login-password-change.T10 — Add a profile-menu password-change entry, reachable at any time post-login (not just the mandatory first-login prompt), reusing `ChangePasswordScreen`'s form/flow, with a test confirming availability when `mustChangePassword: false` — Acceptance: AC12

## AC Coverage Check
AC1 (T04) · AC2 (T01, T03, T05, T07) · AC3 (T07) · AC4 (T07) · AC5 (T07) · AC6 (T04) · AC7 (T08, T09) · AC8 (T09) · AC9 (T06, T07, T09) · AC10 (T09) · AC11 (T02) · AC12 (T10) — all 12 covered.
