# Tasks: Static Admin Login (UI)

> ⚠️ **Speculative draft.** The linked spec is `Changes Requested ⟲` and
> the linked plan is unreviewed — this bypasses the standard
> Plan-Reviewed-before-tasks gate at the user's explicit request. Not
> official; must be re-derived once the spec/plan actually clear their
> gates.

## Derived From
.ai-context/plans/admin-static-login.plan.md

## Sequence
- [x] admin-static-login.T01 — Create `src/lib/axios.ts` (single Axios
  instance, base URL from `NEXT_PUBLIC_API_BASE_URL`) and
  `src/lib/queryClient.ts` (TanStack `QueryClient`); provide
  `QueryClientProvider` in `src/app/layout.tsx` — Acceptance: AC3
- [x] admin-static-login.T02 — Build the auth data layer:
  `src/types/auth.ts` (`LoginRequest`, `LoginResponse`),
  `src/features/auth/auth.api.ts` (`login()` calling
  `POST /api/v1/admin/login`), `src/features/auth/auth.store.ts` (Zustand
  store: `token`, `admin`, `isAuthenticated`, `setSession`, `logout`,
  persisted to `localStorage`), and `src/features/auth/auth.mutations.ts`
  (`useLoginMutation`) — Acceptance: AC3
- [x] admin-static-login.T03 — Build `src/components/layout/AuthGuard.tsx`
  and wire it into `src/app/layout.tsx` around the protected route tree:
  redirect an unauthenticated visitor of any protected route to `/login`;
  redirect an authenticated visitor away from `/login` — Acceptance: AC1,
  AC2
- [x] admin-static-login.T04 — Build `src/screens/login/LoginPage.tsx`
  (username/password form wired to `useLoginMutation`, inline error
  rendering for `VALIDATION_ERROR`/`INVALID_CREDENTIALS`, redirect to the
  default Admin Panel screen on success) and `src/app/login/page.tsx`
  (thin route) — Acceptance: AC3, AC4, AC5
- [x] admin-static-login.T05 — Add interceptors to `src/lib/axios.ts`: a
  request interceptor attaching `Authorization: Bearer <token>` from
  `auth.store`, and a response interceptor that on any `401` calls
  `logout()` and redirects to `/login` — Acceptance: AC6, AC7

## AC Coverage
AC1 T03 · AC2 T03 · AC3 T01, T02, T04 · AC4 T04 · AC5 T04 · AC6 T05 · AC7 T01, T05 — all 7 covered.

## Implementation Notes (2026-09-03)
All 5 tasks implemented and merged into the working tree. Verified via
`yarn lint` (clean), `tsc --noEmit` (clean), `yarn build` (succeeds,
`/login` prerenders static), and a direct backend round-trip (`POST
/api/v1/admin/login` with both `admin`/`admin` and a wrong password,
matching the spec's success/`INVALID_CREDENTIALS` shapes exactly). Browser
visual verification was **not** possible — the Chrome extension was
disconnected — so the actual rendered form and redirect behavior have not
been eyeballed in a live browser; only static analysis + backend
integration are confirmed.

Two real deviations from the plan/architecture surfaced during
implementation, both already folded back into `architecture.md`/
`constitution.md`:
- `src/pages/` (as named in every spec/plan/tasks file) collides with
  Next.js's reserved legacy Pages Router directory and broke the build.
  Renamed to `src/screens/` project-wide, including in `architecture.md`,
  `constitution.md`, and every other spec/plan/tasks file that referenced
  it.
- T05's response interceptor originally did `window.location.href =
  '/login'` on a 401, per the plan. ESLint's `@next/next/no-location-
  assign-relative-destination` flagged it; simplified to just calling
  `logout()`, since `AuthGuard` (T03) already reactively redirects
  whenever `isAuthenticated` flips to false — no imperative navigation
  needed in the interceptor.

Also added, not explicitly itemized in the plan but required to make T01
work: `.env.local`/`.env.example` (`NEXT_PUBLIC_API_BASE_URL`), and a
`hasHydrated` flag on `auth.store.ts` to avoid `AuthGuard` redirecting
before Zustand's `persist` middleware finishes rehydrating from
`localStorage` on first load.
