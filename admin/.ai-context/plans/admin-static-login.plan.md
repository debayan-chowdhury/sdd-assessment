# Plan: Static Admin Login (UI)

> ⚠️ **Speculative draft.** `admin-static-login.spec.md` is currently
> `Changes Requested ⟲`, not `Approved`. This plan is drafted against the
> spec's current content at the user's explicit request, bypassing the
> standard Gate-1-before-plan gate. It is **not official** and must be
> re-derived (or at minimum re-checked) once the spec is revised and
> actually reaches `Approved`.

## Derived From
.ai-context/specs/admin-static-login.spec.md

## Architecture Approach
This is the first feature built, so it also stands up the shared
infrastructure every other feature's plan will assume already exists:

- **New shared infra (owned by this plan):**
  - `src/lib/axios.ts` — single Axios instance, base URL from
    `NEXT_PUBLIC_API_BASE_URL`, a request interceptor attaching
    `Authorization: Bearer <token>` from the auth store, and a response
    interceptor that on any `401` clears the auth store and redirects to
    `/login` (spec AC6/AC7).
  - `src/lib/queryClient.ts` — the app's one `QueryClient`, provided at
    `src/app/layout.tsx`.
  - `src/components/layout/AuthGuard.tsx` — client component checking
    `useAuthStore().isAuthenticated` on mount; redirects to `/login` if
    absent (spec AC1), or away from `/login` if already authenticated
    (spec AC2). Wrapped around the protected route tree in
    `src/app/layout.tsx`.
- **Feature-specific:**
  - `src/features/auth/auth.api.ts` — `login(username, password)` calling
    `POST /api/v1/admin/login`.
  - `src/features/auth/auth.mutations.ts` — `useLoginMutation` (TanStack
    Query `useMutation`), on success calls `auth.store`'s `setSession`.
  - `src/features/auth/auth.store.ts` — Zustand store: `token`, `admin`,
    `isAuthenticated`, `setSession(token, admin)`, `logout()`; persists
    `token`/`admin` to `localStorage` per `constitution.md`'s Security
    Posture, rehydrated on app load.
  - `src/screens/login/LoginPage.tsx` — the form (username, password,
    inline error rendering for `VALIDATION_ERROR`/`INVALID_CREDENTIALS`).
  - `src/app/login/page.tsx` — thin route rendering `LoginPage`.
- Integration point: backend `POST /api/v1/admin/login` per the spec's API
  Contract — no new endpoint on this side.

## Data Model
No local datastore (per `constitution.md` → Architectural Constraints).
Client-side shapes only:
- `src/types/auth.ts` — `LoginRequest { username: string; password: string }`,
  `LoginResponse { token: string; admin: { name: string; email: string; phone: string } }`.
- `auth.store.ts` state shape: `{ token: string | null; admin: AdminProfile | null; isAuthenticated: boolean }`.

## Constitution Check
- [x] Test framework matches `constitution.md` — Vitest + React Testing
  Library for `LoginPage`, `AuthGuard`, and `auth.store`/`auth.mutations`.
- [ ] Test-first scope / coverage floor — **N/A, flagged gap in
  constitution.md itself**; this plan doesn't invent a number or scope.
- [ ] Employee-data logging rule — **N/A**, this feature never touches
  Employee records, only the static admin credential/profile.
- [x] Auth baseline (static credential → JWT → `localStorage` → Bearer via
  Axios interceptor) — this plan builds exactly that, no deviation.
- [x] No session expiry/logout/multi-admin — this plan builds none of
  those (see Explicitly Deferred), consistent with the constitution
  stating none exist yet.
- [x] No `middleware.ts` for access control — gating is done entirely by
  the client-side `AuthGuard` component; no `middleware.ts` file is
  created for auth purposes.
- [x] Secrets/config via `.env` + `NEXT_PUBLIC_` prefix — the backend base
  URL is read from `process.env.NEXT_PUBLIC_API_BASE_URL` in `axios.ts`;
  no secret is hardcoded.
- [x] No local datastore, backend REST `/api/v1` only — this plan calls
  `POST /api/v1/admin/login` and introduces no datastore.
- [x] Axios only, single instance — this plan is the one that creates
  that single instance; no other HTTP client is used.
- [x] TanStack Query only for server state — login is a
  `useMutation`-backed call, not a manual `fetch` + `useState`.
- [x] Zustand only for client state — `auth.store.ts` is the sole Zustand
  store for token/session state.
- [x] Thin route files — `src/app/login/page.tsx` only imports and
  renders `LoginPage`.
- [x] No new library outside the approved Axios/TanStack Query/Zustand
  set — none introduced.
- [ ] Non-Functional Baselines (latency/availability/RPO-RTO) — **N/A,
  flagged gap in constitution.md itself**; this plan doesn't invent a
  target.
- [x] Targets backend API `v1` — calls `POST /api/v1/admin/login`,
  matching the pinned `v1` base path.
- [ ] Breaking-change/deprecation policy for `v1`→`v2` — **N/A, flagged
  gap in constitution.md itself**; not this plan's decision to make.

## Explicitly Deferred
- Logout / explicit token invalidation UI — spec's Explicitly Out of
  Scope; no backend endpoint exists for it yet either.
- Session/token expiry handling beyond the reactive 401→redirect (AC6) —
  spec's Explicitly Out of Scope; no proactive expiry check is built.
- Multi-admin support, registration, credential management UI — spec's
  Explicitly Out of Scope; the backend has no such capability.
- Editable admin profile UI — the returned profile is display-only, per
  spec.
- Password visibility toggle, "remember me," forgot-password flow — not
  raised in the BRD or spec; not built.

## Sequencing
1. `src/lib/axios.ts` + `src/lib/queryClient.ts` (shared infra every other
   feature's plan depends on).
2. `src/types/auth.ts`.
3. `src/features/auth/{auth.api.ts, auth.store.ts, auth.mutations.ts}`.
4. `src/components/layout/AuthGuard.tsx`, wired into `src/app/layout.tsx`.
5. `src/screens/login/LoginPage.tsx` + `src/app/login/page.tsx`.
6. Axios response interceptor for reactive 401 handling (AC6/AC7) — added
   once `auth.store.ts` exists so it can call `logout()`.
