# One-Point Employee Portal — Internal Transfer System

A three-app system for submitting and processing internal employee transfer
requests: an Employee-facing portal, an Admin panel for managing the org
structure, and a backend API that owns the workflow and business rules.

```
sdd-assessment/
├── backend/    Express + MongoDB API — owns all business logic and data
├── frontend/   Next.js — Employee portal (submit/track transfers, approvals)
└── admin/      Next.js — Admin panel (Locations/Departments/Roles/Employees)
```

## Tech stack

| App | Stack |
|---|---|
| `backend` | Node/Express, Mongoose (MongoDB), JWT auth, `node-cron`, Jest + Supertest, Swagger (`/api-docs`) |
| `frontend` | Next.js (App Router), React, TanStack Query, Zustand, Tailwind, Vitest + Testing Library |
| `admin` | Next.js (App Router), React, TanStack Query, Zustand, Tailwind |

## Running locally

Each app runs independently and talks to the backend over HTTP.

### 1. Backend (port 4000)

```bash
cd backend
cp .env.example .env      # defaults work out of the box for local dev
npm install
npm run dev:all           # docker compose up (MongoDB) + nodemon
```

- MongoDB runs via `docker compose` (see `backend/docker-compose.yml`), exposed on host port **27018** (not the Mongo default 27017 — `MONGO_URI` in `.env` already points at 27018).
- API docs: `http://localhost:4000/api-docs`
- Health check: `http://localhost:4000/api/health`
- Default admin login: `admin` / `admin` (override via `ADMIN_USERNAME`/`ADMIN_PASSWORD` in `.env`)

### 2. Frontend — Employee portal (port 3000)

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
yarn install
yarn dev
```

### 3. Admin panel (port 3001)

Also a Next.js app defaulting to port 3000, so start it on a different port:

```bash
cd admin
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
yarn install
yarn dev -- -p 3001
```

### Tests

```bash
cd backend  && npm test    # Jest + Supertest, 80% line coverage enforced
cd frontend && yarn test   # Vitest + React Testing Library
# admin has no test suite configured
```

## Data model (backend)

- **Location**, **Department**, **Role** — flat reference tables managed by the Admin panel. A Role optionally carries a `category`: `HR`, `Manager`, `Payroll`, `IT`, `Facilities`, or `null` (a regular role).
- **DepartmentRole** — which Roles are valid in which Department (auto-created on demand, see below).
- **Employee** — name/email/password, and current `locationId`/`departmentId`/`roleId`/`managerId`/`hrId`.
- **TransferRequest** — one employee's request to move to a new Location/Department/Role, carrying the full approval-chain state (see workflow below).

Two separate JWT auth systems exist side by side: an **Admin token** (`POST /api/v1/admin/login`, static single admin identity) for the Admin panel, and an **Employee token** (`POST /api/v1/auth/login`) for every other role — Employee, Manager, HR, Receiving Manager, Payroll, IT, Facilities are all just Employees whose Role's `category` determines what they're allowed to see and do.

## The transfer request workflow

An Internal Transfer request moves through a fixed chain of approvals, then fulfillment, then a deferred organisational-data update:

```
Employee submits
  → Pending Current Manager Approval      (their own manager)
    → Pending Current HR Approval         (their own HR — tenure shown as a warning, not a hard block)
      → Pending Receiving HR Approval     (HR at the target Location+Department — assigns a Receiving Manager)
        → Pending Receiving Manager Approval
          ⇄ Pending Receiving HR Reassignment   (if that Receiving Manager rejects, and another untried one exists)
          → Hold                                (if every candidate Receiving Manager has rejected)
          → Pending Fulfillment Trigger          (Receiving Manager accepted)
            → Pending Fulfillment                (Payroll / IT / Facilities run in parallel — each just reports "Done")
              → Completed
→ Rejected   (terminal, from any of the four approval gates)
```

Escalation flags (`escalated: true`) are layered on top automatically if a request sits too long in an approval gate (2 days) or a fulfillment target (5 business days) without action — informational only, no automated resolution.

### The deferred organisational update

When Receiving HR accepts the gate (assigning a Receiving Manager), the employee's `Location`/`Department`/`Role`/`Manager`/`HR` are **not** changed immediately. The change is deferred until the request's `effectiveDate`, and then applied by whichever of these fires first:

1. **Lazy, per-request** — `employeeAuth` middleware checks on every authenticated call by that employee (and at login).
2. **Scheduled job** — `backend/src/jobs/dueOrgUpdates.job.js`, a `node-cron` sweep every 15 minutes across every employee.
3. **Manual trigger** — `POST /api/v1/admin/jobs/due-org-updates/trigger` (Admin-authenticated), exposed as a **"Run now"** button on the Admin dashboard, for testing or forcing it on demand.

Until applied, the employee's live profile (`GET /api/v1/auth/profile`) keeps showing their *old* Manager/HR/Location — the frontend shows a banner explaining the change lands automatically on the effective date.

### Notable business-rule decisions (post-BRD amendments)

A few rules were deliberately changed from the original literal BRD reading during development — each documented as an "Amendment" in its spec under `backend/.ai-context/specs/`:

- **Tenure check is advisory, not a hard block** — Current HR sees a tenure warning but can still accept an under-tenure employee.
- **"Need Information" removed** — Payroll/IT/Facilities only ever report `Done`; the report/reply messaging sub-flow was removed entirely.
- **Role↔Department mapping auto-enables** — submitting a transfer to a Role not yet mapped to the target Department creates that mapping automatically instead of rejecting.
- **Self-service Role is restricted** — an Employee can only transfer into a regular (`category: null`) Role; Manager/HR/IT/Payroll/Facilities roles are excluded from `/options/roles` and rejected server-side if forced.
- **A transfer must actually change something** — rejected with `NO_CHANGE_REQUESTED` if Location, Department, *and* Role would all stay the same.
- **Org-data update deferred to effective date** — see above; originally applied immediately on Receiving HR's accept.

## Backend workflow (by role)

All endpoints are versioned under `/api/v1`. Every non-admin endpoint requires an Employee JWT; the caller's Role `category` (returned as `roleCategory`) gates which endpoints they can use.

| Role (`roleCategory`) | What they do |
|---|---|
| Employee (`null`) | `POST /transfer-requests` to submit; `GET /transfer-requests/me` / `/:id` to track |
| Manager | `GET/POST .../pending/current-manager`, `.../current-manager-decision`; `.../pending/receiving-manager`, `.../receiving-manager-decision` |
| HR | `.../pending/current-hr`, `.../current-hr-decision`; `.../pending/receiving-hr-gate`, `.../receiving-hr-gate-decision`; `.../pending/receiving-hr-fulfillment`, `.../trigger-fulfillment`, `.../confirm-completion`; `.../pending/receiving-hr-reassignment`, `.../reassign-manager`; `.../pending/receiving-hr-hold`, `.../reopen-hold` |
| Payroll / IT / Facilities | `.../pending/{payroll,it,facilities}`, `.../{payroll,it,facilities}-status` (report `Done`) |

Admin-only (Admin JWT): full CRUD on Locations, Departments, Roles, Employees, and their mappings, plus the manual org-update trigger. See `/api-docs` for the full contract.

## Frontend workflow (Employee portal, `frontend/`)

- **Login / change password** → **Dashboard** (`/`) — profile summary (live from `/auth/profile`), current/most-recent transfer request, and (for approver roles) a queue-count summary linking to...
- **`/approvals`** — one section per role the logged-in employee holds (Current Manager, Receiving Manager, Current HR, Receiving HR gate/fulfillment/reassignment/hold, Payroll/IT/Facilities worklists) — only the sections relevant to that employee's `roleCategory` render.
- **`/transfer-request`** — submit a new request (if none active) or view the active one; **`/transfer-request/:id`** — full status detail; **`/transfer-request/history`** — past requests.

## Admin panel workflow (`admin/`)

- **Dashboard** (`/`) — nav into each resource, plus the **"Run now"** button to manually trigger due organisational updates.
- **Locations / Departments / Roles** — CRUD, activate/deactivate, and mapping (Location↔Department, Department↔Role).
- **Employees** — CRUD, assign Location/Department/Role/Manager/HR, activate/deactivate.

## Documentation

Full specs (API contracts, acceptance criteria, and every amendment's rationale) live under `backend/.ai-context/specs/` and `frontend/.ai-context/specs/`, written per the project's Specification-Driven Development process. `backend/.ai-context/BRD_Employee_Transfer.md` holds the original business requirements each spec traces back to.
