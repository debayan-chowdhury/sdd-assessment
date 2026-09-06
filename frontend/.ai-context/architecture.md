# Architecture

_Last updated: 2026-09-04_

## System Overview
Employee Portal (Frontend) is a Next.js 16 (App Router) frontend that runs
the Internal Transfer journey end-to-end for eight roles — Employee,
Current Manager, Current HR, Receiving HR, Receiving Manager, Payroll, IT,
and Facilities (BRD-001–009) — from portal login through request
submission, a sequential approval chain, parallel fulfillment reporting,
and final confirmation back to the employee. It owns no datastore of its
own: all data is read from and written to the same versioned backend REST
API (`/api/v1`) the sibling Admin Panel calls, via Axios, cached and
synchronized client-side with TanStack Query, with auth/session and UI
state held in Zustand — the same stack as the Admin Panel, adopted here for
consistency across the two frontends of this system.

## Folder Structure

Feature-based, with the same strict separation between **route files**
(thin, App Router only) and **page components** (the actual screens, in
their own `screens/` tree) used by the Admin Panel. Note: this is
deliberately **not** named `pages/` — Next.js reserves `src/pages/` for the
legacy Pages Router and will try to validate anything placed there as a
route file, which breaks the build.

```
src/
├── app/                     # App Router route segments — THIN ONLY
│   ├── layout.tsx
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx         # login screen
│   ├── change-password/
│   │   └── page.tsx         # mandatory-on-first-login + voluntary change
│   ├── transfer-request/
│   │   ├── new/
│   │   │   └── page.tsx     # employee: submit a new request
│   │   └── [id]/
│   │       └── page.tsx     # employee: track status of their active request
│   └── approvals/
│       └── page.tsx         # Current Manager / Current HR / Receiving HR /
│                             #   Receiving Manager / Payroll / IT / Facilities:
│                             #   whatever is pending for the logged-in role
│
├── screens/                  # Page-level screen components (NOT Pages Router)
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── ChangePasswordScreen.tsx
│   ├── transfer-request/
│   │   ├── NewTransferRequestScreen.tsx
│   │   ├── TransferRequestStatusScreen.tsx
│   │   └── components/       # e.g. status timeline, hold-reason banner
│   └── approvals/
│       ├── ApprovalsInboxScreen.tsx   # role-aware: approve/reject vs report-status view
│       └── components/       # e.g. accept/reject dialog, done/need-info dialog
│
├── components/               # Shared/reusable UI — used across 2+ features
│   ├── ui/                   # generic, feature-agnostic primitives
│   └── layout/                # app chrome (shell, nav, auth gate, etc.)
│       └── AuthGuard.tsx      # client-side route protection (see Known Constraints)
│
├── features/                  # Data layer, one subfolder per domain entity
│   ├── auth/
│   │   ├── auth.api.ts
│   │   ├── auth.mutations.ts  # login, change-password
│   │   └── auth.store.ts      # Zustand: token, current user/role
│   └── transfer-request/
│       ├── transfer-request.api.ts
│       ├── transfer-request.queries.ts   # my request / pending-for-me
│       └── transfer-request.mutations.ts # submit, accept/reject, report status
│
├── lib/
│   ├── axios.ts               # single Axios instance: baseURL, Bearer interceptor, 401 handler
│   ├── queryClient.ts         # TanStack QueryClient instance/config
│   └── utils.ts
│
├── types/                      # one file per domain entity
│   └── transferRequest.ts
│
└── middleware.ts                # NOT used for auth gating (see Known Constraints) —
                                  # omit entirely unless a non-auth use emerges
```

**Naming conventions** — identical to the Admin Panel's, for consistency:
- Route segment folders under `src/app/`: kebab-case, matching the URL
  segment they represent.
- Route files: always `page.tsx`; contain only an import of the matching
  `src/screens/**` component and its render — no hooks beyond that, no
  data-fetching, no business logic.
- Page components: PascalCase, `<Feature><Screen>Screen.tsx` pattern, one
  file per screen.
- Page-scoped subcomponents: PascalCase, live in
  `src/screens/<feature>/components/`, named `<Feature><Purpose>.tsx`.
- Shared components: PascalCase, in `src/components/ui/` (generic,
  feature-agnostic) or `src/components/layout/` (app chrome).
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
  Constraint below on auth-gated screens (same tension as the Admin Panel).
- No `'use client'` boundary wider than it needs to be.
- All Route Handler / Server Action input is validated before use (not
  applicable to most of this app today, since it has no backend of its own
  — see Known Constraints).

## Components
| Component | Responsibility | Tech |
|---|---|---|
| `app/**/page.tsx` route files | Thin route entry; renders the matching `screens/**` component | Next.js App Router |
| `screens/auth/**` | Login, mandatory/voluntary password change | React, TanStack Query, Zustand |
| `screens/transfer-request/**` | Employee: submit a new request, track its status through the approval chain and parallel fulfillment steps | React, TanStack Query |
| `screens/approvals/**` | Role-aware inbox: accept/reject for Current Manager/Current HR/Receiving HR/Receiving Manager; Done/Need-Information reporting for Payroll/IT/Facilities | React, TanStack Query |
| `components/layout/AuthGuard` | Client-side route protection; role-based view resolution (which inbox/actions a logged-in role sees) | React, Zustand |
| `components/ui` | Generic, feature-agnostic UI primitives | React, Tailwind |
| `features/auth` | Data layer: login/change-password calls + Zustand auth store | Axios, TanStack Query, Zustand |
| `features/transfer-request` | Data layer: submit/track/approve/reject/report-status calls + query hooks | Axios, TanStack Query |
| `lib/axios.ts` | Single Axios instance, Bearer-token interceptor, 401 handling | Axios |

The exact mechanism for "which role sees what" (a claim in the JWT, a
separate `/me` profile call, or something else) is not yet decided — flag
this for the first plan.md that touches `AuthGuard`/`approvals` rather than
assuming one.

## Data Model
This repo does not own these schemas — they mirror the backend API's
contracts (`/api/v1`) and are typed client-side in `src/types/`. Fields and
states below are only what BRD-001–009 actually state; anything not listed
there is an open question for the backend contract, not assumed here.

- **User / Role** — one of eight roles per login: Employee, Current
  Manager, Current HR, Receiving HR, Receiving Manager, Payroll, IT,
  Facilities. Default password set at Admin Panel employee-record creation;
  `mustChangePassword` flag implied by the mandatory-first-login-change
  rule (BRD-001). Receiving HR and Receiving Manager are scoped by
  department **and** location (e.g. Delhi–Finance vs Pune–Finance are
  distinct) — not department alone (BRD-002, BRD-006).
- **TransferRequest** — captured at submission: new department/business
  unit, new location, new role/position, effective date (≥30 days from
  submission), optional reason (BRD-002). Status values referenced in BRD:
  in-progress (at each chain step), `Rejected` (terminal, closed), `Hold`
  (with a reason, reopenable by Receiving HR within a 6-month window), and
  confirmed/closed once Receiving HR sends final confirmation. One active
  request per employee at a time; not editable/withdrawable by the employee
  once submitted (BRD-002).
- **ApprovalStep** — one per chain stage (Current Manager, Current HR,
  Receiving HR-gate, Receiving Manager, Receiving HR-trigger, Receiving
  HR-confirm). Each gate stage carries accept/reject; a 2-day
  no-response window escalates to an HR Operations/Portal Admin queue
  (BRD-002, BRD-003–006).
- **FulfillmentStep** — one each for Payroll, IT, Facilities; triggered in
  parallel by Receiving HR after Receiving Manager approval; each reports
  back exactly one of two states — "Done/Updated" or "Need information from
  Receiving HR about the employee" — within a 5-business-day window, else
  it escalates to the HR Operations/Portal Admin queue (BRD-007–009). No
  accept/reject action on these three.

## Integration Points
| System | Direction | Protocol | Notes |
|---|---|---|---|
| Backend API (`/api/v1`) | in/out | REST over HTTPS, JWT Bearer auth | Called directly from the browser via Axios (no Next.js proxy) — same backend the Admin Panel calls; backend must allow CORS from this app's deployed origin(s). |

Payroll, IT, and Facilities each run in their own separate portal/system.
This app has **no** direct integration with any of them — it only reflects
the two-state status Receiving HR relays through the backend API
(BRD-002, BRD-007–009). Building or integrating with those systems is
explicitly out of scope for this journey.

## Decisions In Force
- None recorded yet — no ADRs exist in `.ai-context/decisions/` at this
  time. The decision to adopt the Admin Panel's Axios/TanStack
  Query/Zustand stack and localStorage-JWT auth pattern for this app (made
  in this conversation, for cross-app consistency) is a candidate for a
  first ADR if the team wants it formally recorded.

## Known Constraints
- **`src/pages/` is reserved by Next.js.** Framework behavior, confirmed in
  the Admin Panel's build: Next.js's `src/` folder convention auto-detects
  `src/pages/` as the legacy Pages Router directory and validates every
  file in it as a route (build fails with a `PagesPageConfig` type error
  otherwise). The page-component tree is named `src/screens/` for exactly
  this reason — never rename it back to `pages/`.
- **No server-side auth gating.** The JWT is stored in `localStorage`, not
  an httpOnly cookie, so `middleware.ts` (which runs server/edge-side)
  cannot read it. Route protection is client-side only, via an `AuthGuard`
  component (`src/components/layout/AuthGuard.tsx`) that checks
  `useAuthStore` on mount and redirects to `/login` if absent — same
  pattern as the Admin Panel, but now gating 8 distinct roles instead of a
  single admin user, so `AuthGuard` also needs to resolve role-based access
  (see Components, above).
- **Tension with "Server Components by default."** Because auth state only
  exists client-side (`localStorage`/Zustand), any screen that needs
  authenticated data must fetch it client-side (TanStack Query + Axios) and
  is therefore effectively a Client Component, even though
  `int-standards.nextjs.md` states Server Components as the default. Same
  consequence as the Admin Panel — revisit together if the JWT-storage
  decision changes.
- **No backend proxy.** Axios calls the backend directly from the browser;
  there is no Next.js Route Handler layer in between. If a future need
  arises (e.g. hiding the backend URL, adding server-side caching), that
  would be a new architectural decision requiring an ADR.
- **HR Operations / Portal Admin escalation queue — owner not yet
  determined.** BRD-002–009 route unanswered approvals and unresponsive
  Payroll/IT/Facilities steps to an "HR Operations / Portal Admin queue,"
  but no such role appears in this app's login roster (BRD-001), and the
  Admin Panel's own scope (per its BRD) doesn't mention it either. Flag
  this for product/architecture clarification before building any
  escalation-queue screen in either app.
- Testing coverage floor/test-first scope, NFR targets, and API
  versioning/deprecation policy are open gaps — see `constitution.md`.
