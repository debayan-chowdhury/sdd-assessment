# Architecture

_Last updated: 2026-09-03_

## System Overview
Admin Panel is a Next.js 16 (App Router) frontend that lets a single Admin
user manage the portal's master data — Locations, Departments, Roles, and
Employees, with Employee-to-Location/Department/Role and Manager/HR mapping
— through CRUD screens, gated by a static admin login. It owns no datastore
of its own: all data is read from and written to a versioned backend REST
API (`/api/v1`) via Axios, cached and synchronized client-side with
TanStack Query, with auth/session and UI state held in Zustand.

## Folder Structure

Feature-based, with a strict separation between **route files** (thin,
App Router only) and **page components** (the actual screens, in their own
`screens/` tree). Note: this is deliberately **not** named `pages/` —
Next.js reserves `src/pages/` for the legacy Pages Router and will try to
validate anything placed there as a route file, which breaks the build.

```
src/
├── app/                    # App Router route segments — THIN ONLY
│   ├── layout.tsx
│   ├── globals.css
│   └── <feature>/          # one folder per feature/domain area
│       ├── page.tsx        # list/index screen for <feature>
│       └── [<id>]/
│           └── page.tsx    # detail screen for a single <feature> record
│
├── screens/                 # Page-level screen components (NOT Pages Router)
│   └── <feature>/
│       ├── <ListScreen>.tsx
│       ├── <DetailScreen>.tsx
│       └── components/     # sub-components used only within this feature's pages
│           └── <SubComponent>.tsx
│
├── components/             # Shared/reusable UI — used across 2+ features
│   ├── ui/                 # generic, feature-agnostic primitives
│   └── layout/             # app chrome (shell, nav, auth gate, etc.)
│
├── features/                # Data layer, one subfolder per domain entity
│   └── <entity>/
│       ├── <entity>.api.ts        # Axios calls
│       ├── <entity>.queries.ts    # TanStack Query read hooks
│       ├── <entity>.mutations.ts  # TanStack Query write hooks
│       └── <entity>.store.ts      # Zustand store, only where cross-component client state is needed
│
├── lib/
│   ├── axios.ts             # single Axios instance: baseURL, Bearer interceptor, 401 handler
│   ├── queryClient.ts       # TanStack QueryClient instance/config
│   └── utils.ts
│
├── types/                   # one file per domain entity
│   └── <entity>.ts
│
└── middleware.ts             # NOT used for auth gating (see Known Constraints) —
                               # omit entirely unless a non-auth use emerges
```

**Naming conventions**
- Route segment folders under `src/app/`: kebab-case, matching the URL
  segment they represent.
- Route files: always `page.tsx`; contain only an import of the matching
  `src/screens/**` component and its render — no hooks beyond that, no
  data-fetching, no business logic.
- Page components: PascalCase, `<Feature><Screen>Page.tsx` pattern (e.g. a
  list screen and a detail screen per feature), one file per screen.
- Page-scoped subcomponents: PascalCase, live in
  `src/screens/<feature>/components/`, named `<Feature><Purpose>.tsx`.
- Shared components: PascalCase, in `src/components/ui/` (generic, feature-
  agnostic) or `src/components/layout/` (app chrome).
- Data-layer files: lowercase-dot-suffixed by role — `*.api.ts` (Axios
  calls), `*.queries.ts` (TanStack `useQuery` hooks), `*.mutations.ts`
  (TanStack `useMutation` hooks), `*.store.ts` (Zustand store). Hook names
  always follow `use<Noun><Verb?>`.
- Types: one file per domain entity in `src/types/`, filename camelCase
  matching the entity, exported type/interface names PascalCase.

## Coding Rules & Instructions
See `.agent/rules/int-standards.nextjs.md` for the full rule set. Headline
conventions most relevant to this structure:
- Server Components are the App Router default — but note the Known
  Constraint below on auth-gated screens.
- No `'use client'` boundary wider than it needs to be.
- All Route Handler / Server Action input is validated before use (not
  applicable to most of this app today, since it has no backend of its own
  — see Known Constraints).

## Components
| Component | Responsibility | Tech |
|---|---|---|
| `app/**/page.tsx` route files | Thin route entry; renders the matching `screens/**` component | Next.js App Router |
| `screens/**` screen components | Actual screen implementation, composition of shared UI + data hooks | React, TanStack Query, Zustand |
| `components/ui` | Generic, feature-agnostic UI primitives | React, Tailwind |
| `components/layout` | App chrome: shell, nav, `AuthGuard` client-side route protection | React, Zustand |
| `features/<entity>` | Data layer: Axios calls + TanStack Query hooks + (for auth) Zustand store | Axios, TanStack Query, Zustand |
| `lib/axios.ts` | Single Axios instance, Bearer-token interceptor, 401 handling | Axios |

## Data Model
This repo does not own these schemas — they mirror the backend API's
contracts (`/api/v1`) and are typed client-side in `src/types/`:
- **Location** — CRUD entity; can have multiple Departments mapped to it
  (unique per Location-Department pair); soft-delete only; blocked from
  delete while Employees are mapped to it.
- **Department** — CRUD entity; has access to the full shared Role list,
  with a separate Department-Role mapping controlling which are enabled per
  Department; soft-delete only; blocked from delete while Employees are
  mapped to it.
- **Role** — CRUD entity; global, not scoped per Department; optional
  `category` field (`HR` | `Manager` | none) that determines an Employee's
  functional status; soft-delete only; blocked from delete while Employees
  hold it.
- **Employee** — CRUD entity; `Active`/`Inactive` status (Inactive blocks
  portal login) distinct from soft-delete; exactly one active
  Location+Department+Role mapping at a time; Manager/HR mapping rules
  driven by the assigned Role's `category`.
- **Auth** — no persisted entity; a static credential pair exchanged for a
  JWT via the backend login endpoint.

## Integration Points
| System | Direction | Protocol | Notes |
|---|---|---|---|
| Backend API (`/api/v1`) | in/out | REST over HTTPS, JWT Bearer auth | Called directly from the browser via Axios (no Next.js proxy) — backend must allow CORS from this app's deployed origin(s). |

## Decisions In Force
- None recorded yet — no ADRs exist in `.ai-context/decisions/` at this
  time.

## Known Constraints
- **`src/pages/` is reserved by Next.js.** Confirmed during
  `admin-static-login` implementation: Next.js's `src/` folder convention
  auto-detects `src/pages/` as the legacy Pages Router directory and
  validates every file in it as a route (build fails with a `PagesPageConfig`
  type error otherwise). The page-component tree is named `src/screens/`
  for exactly this reason — never rename it back to `pages/`.
- **No server-side auth gating.** The JWT is stored in `localStorage`, not
  an httpOnly cookie, so `middleware.ts` (which runs server/edge-side)
  cannot read it. Route protection is client-side only, via an `AuthGuard`
  component (`src/components/layout/AuthGuard.tsx`) that checks
  `useAuthStore` on mount and redirects to `/login` if absent.
- **Tension with "Server Components by default."** Because auth state only
  exists client-side (`localStorage`/Zustand), any screen that needs
  authenticated data must fetch it client-side (TanStack Query + Axios) and
  is therefore effectively a Client Component, even though
  `int-standards.nextjs.md` states Server Components as the default. This
  is a direct consequence of the `localStorage` JWT decision — revisit
  together if that decision changes.
- **No backend proxy.** Axios calls the backend directly from the browser;
  there is no Next.js Route Handler layer in between. If a future need
  arises (e.g. hiding the backend URL, adding server-side caching), that
  would be a new architectural decision requiring an ADR.
- **Session never expires client-side today.** Logout, token expiry, and
  multi-admin support are explicitly deferred — until built, a logged-in
  browser session persists indefinitely.
- Testing coverage floor/test-first scope, NFR targets, and API
  versioning/deprecation policy are open gaps — see `constitution.md`.
