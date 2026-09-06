# Project Constitution — Admin Panel

## Testing Discipline
- Test framework: Vitest + React Testing Library (see
  `.agent/rules/int-standards.nextjs.md`). No other test runner may be
  introduced without an ADR.
- Test-first scope and coverage floor: **not yet decided** — needs Tech
  Lead/Architect sign-off. Until set, no plan may be rejected at Gate 1 for
  missing test-first discipline or a coverage number, since none exists yet.

## Security Posture
- Sensitive data in scope: Employee records (name, Location/Department/Role
  mapping, Manager/HR mapping). This data may never appear in browser
  console output, error boundaries, or any client-side logging in
  production builds.
- Auth baseline: a single static hardcoded credential (`admin`/`admin`) is
  submitted to the backend's login endpoint, which returns a JWT. The JWT
  is stored in `localStorage` and attached as a `Bearer` token to every
  outgoing Axios request via a request interceptor (`src/lib/axios.ts`).
  This is a deliberate, current-phase stakeholder decision, not a
  placeholder — but it means the token is readable by any script running on
  the page (XSS exposure is accepted, not mitigated, in this phase).
- Session expiry, logout, and multi-admin support are explicitly **not**
  implemented — deferred to a future phase. Until then, treat any plan
  touching auth as building against a session that never expires
  client-side.
- Because the JWT lives in `localStorage` and not an httpOnly cookie, `Next.js`
  `middleware.ts` cannot read or verify it — **no route may rely on
  `middleware.ts` for access control.** All auth gating is client-side only
  (see `architecture.md` → Known Constraints).
- Secrets/config (e.g. the backend API base URL) live in `.env` files —
  gitignored, never committed — with per-environment values supplied via
  the deployment platform's environment variable mechanism at deploy time.
  Any value read in a Client Component must be prefixed `NEXT_PUBLIC_`;
  treat every non-prefixed variable as server-only.

## Architectural Constraints
- This repository owns no datastore. All persistent data is read from and
  written to the backend REST API (`/api/v1`) — see Versioning Rules.
  Introducing any local datastore requires an ADR.
- HTTP layer: **Axios only**, via a single configured instance
  (`src/lib/axios.ts`). No ad hoc `fetch()` calls to the backend elsewhere
  in the codebase.
- Server-state caching/synchronization: **TanStack Query only.** No
  component may hold fetched server data in local `useState`/`useEffect`
  instead of a query/mutation hook.
- Client state: **Zustand only** for cross-component client state (auth
  token, UI state). No Redux, no ad hoc React Context providers duplicating
  what a Zustand store already owns.
- Route files under `src/app/**/page.tsx` contain no business logic or
  data-fetching of their own — they only import and render a component from
  `src/screens/` (see `architecture.md` → Folder Structure — named
  `screens/`, not `pages/`, since Next.js reserves `src/pages/` for the
  legacy Pages Router).
- Introducing a new datastore, HTTP client, server-state library, or
  client-state library outside this list requires an ADR.

## Non-Functional Baselines
- Latency, availability, and RPO/RTO targets: **not yet decided** — needs
  Tech Lead/Architect sign-off before this section can be considered
  complete. (This repo owns no datastore, so RPO/RTO here would apply only
  to the backend's data, not to this app.)

## Versioning Rules
- This app currently targets backend API version `v1` (base path
  `/api/v1`).
- Breaking-change and deprecation-window policy for when the backend ships
  a `v2`: **not yet decided** — needs Tech Lead/Architect sign-off.
