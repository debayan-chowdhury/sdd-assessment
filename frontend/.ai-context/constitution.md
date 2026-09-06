# Project Constitution — Employee Portal (Frontend)

## Testing Discipline
- Test framework: Vitest + React Testing Library (see
  `.agent/workflows/generate-tests.md`), same as the sibling Admin Panel
  app, for consistency across the two frontends. Neither `vitest` nor
  `@testing-library/react` is installed in `package.json` yet — install
  before the first test file is written. No other test runner may be
  introduced without an ADR.
- Test-first scope and coverage floor: **not yet decided** — needs Tech
  Lead/Architect sign-off. Until set, no plan may be rejected at Gate 1 for
  missing test-first discipline or a coverage number, since none exists yet.

## Security Posture
- Sensitive data in scope: employee records surfaced through this portal
  (name, department/location/role, manager/HR mapping) and every role's own
  login credentials. This data may never appear in browser console output,
  error boundaries, or any client-side logging in production builds.
- Auth baseline: standalone, portal-managed username/password login,
  required for every role in the Internal Transfer journey — Employee,
  Current Manager, Current HR, Receiving HR, Receiving Manager, Payroll,
  IT, Facilities (BRD-001). No integration with any existing company
  identity system (SSO, Active Directory, etc.).
- The Admin Panel sets a default password when it creates an employee
  record. Every role is required to change that default password on first
  login; password change also remains available after that, not just on
  the mandatory first-time prompt (BRD-001).
- There is no password complexity requirement — any combination is allowed.
  This is an explicit product decision (BRD-001), not a gap.
- There is no session timeout, no automatic logout, and no account lockout
  after repeated failed login attempts. These are explicit product
  decisions (BRD-001), not gaps — do not add any of the three without a
  spec change.
- JWT handling: same mechanism as the Admin Panel — the login endpoint
  returns a JWT, stored in `localStorage`, attached as a `Bearer` token to
  every outgoing Axios request via a request interceptor
  (`src/lib/axios.ts`). This is a deliberate cross-app consistency decision,
  not a placeholder — it means the token is readable by any script running
  on the page (XSS exposure is accepted, not mitigated, in this phase),
  across all 8 roles that can log in here, not just a single admin user.
- Because the JWT lives in `localStorage` and not an httpOnly cookie,
  Next.js `middleware.ts` cannot read or verify it — **no route may rely on
  `middleware.ts` for access control.** All auth gating is client-side only
  (see `architecture.md` → Known Constraints).
- Secrets/config (e.g. the backend API base URL) live in `.env` files —
  gitignored, never committed — with per-environment values supplied via
  the deployment platform's environment variable mechanism at deploy time.
  Any value read in a Client Component must be prefixed `NEXT_PUBLIC_`;
  treat every non-prefixed variable as server-only.

## Architectural Constraints
- This repository owns no datastore. All persistent data is read from and
  written to the backend REST API (`/api/v1`) — the same backend the Admin
  Panel calls. Introducing any local datastore requires an ADR.
- HTTP layer: **Axios only**, via a single configured instance
  (`src/lib/axios.ts`). No ad hoc `fetch()` calls to the backend elsewhere
  in the codebase. Not yet installed in `package.json` — add before the
  first API call is written.
- Server-state caching/synchronization: **TanStack Query only.** No
  component may hold fetched server data in local `useState`/`useEffect`
  instead of a query/mutation hook. Not yet installed in `package.json`.
- Client state: **Zustand only** for cross-component client state (auth
  token, UI state such as in-flight approval/status views). No Redux, no ad
  hoc React Context providers duplicating what a Zustand store already
  owns. Not yet installed in `package.json`.
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
- The 2-day approver-escalation window and the 5-day Payroll/IT/Facilities
  response window (BRD-002, BRD-007–009) are business-process SLAs enforced
  by the backend/HR Operations workflow, not a frontend latency or
  availability target — this app only needs to render whatever status the
  backend reports.

## Versioning Rules
- This app currently targets backend API version `v1` (base path
  `/api/v1`), same as the Admin Panel.
- Breaking-change and deprecation-window policy for when the backend ships
  a `v2`: **not yet decided** — needs Tech Lead/Architect sign-off.
