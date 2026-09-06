# Architecture

_Last updated: 2026-09-03_

## System Overview
A single-process Node.js/Express REST API backend, backed by one MongoDB database via Mongoose, using JWT-based authentication for protected routes. It is a monolith: one deployable Express app, one datastore, no messaging layer.

## Folder Structure
**Layered (by technical role)**. Recommended for a service with one primary domain and a small, tightly-related set of resources; revisit in favor of feature-based organization only if the codebase grows into several genuinely independent domains sharing one repo, or clean/hexagonal if the domain logic needs to outlive a likely future framework/DB swap.

```
src/
├── config/          # environment/connection setup — DB client, env-backed constants
├── controllers/      # one file per resource, HTTP-facing only — parses the request, calls a service or model, shapes the response
├── middleware/       # cross-cutting request handling — auth/token verification, error formatting, request logging
├── models/          # Mongoose schemas — one file per collection, including join collections for many-to-many relationships
├── routes/          # Express routers — one file per resource, wires paths to controller functions, mounted in index.js
├── services/        # business logic that doesn't belong in a controller or model — validation spanning multiple collections, cross-entity rules
└── index.js         # Express app bootstrap — middleware registration, route mounting, DB connect, server start
```

**Naming conventions:**
- Routes: `<resource>.routes.js` — plural resource name, one router per resource, mounted under a versioned prefix (e.g. `/api/v1/<resource>`).
- Controllers: `<resource>.controller.js` — one exported function per action (`create`, `list`, `getById`, `update`, `setStatus`, …).
- Models: PascalCase singular entity name matching the Mongoose model (e.g. a `Widget` model file is `Widget.js`, backing the `widgets` collection). A join collection for a many-to-many relationship gets its own model, named `<EntityA><EntityB>.js`.
- Services: `<domain>.service.js` — used when logic spans more than one model or is too substantial to inline in a controller.
- Middleware: `<purpose>.middleware.js`.

## Coding Rules & Instructions
Governed by `.agent/rules/int-standards.node.md`. Headline conventions (not a duplicate — see that file for the full set):
- `async/await` only for asynchronous code, including all Mongoose queries; no raw `.then()/.catch()` chains.
- Secrets and credentials are read from `process.env` via `dotenv`, never hardcoded in source.
- Centralized Express error-handling middleware returns structured `{ "error": { "message", "code" } }` JSON — no leaking raw Mongoose/MongoDB errors to the client.

## Components
Each REST resource is a component made up of: a router (`routes/`), a controller (`controllers/`), a Mongoose model (`models/`), and — where its logic spans multiple models or doesn't fit cleanly in a controller — a service (`services/`). Cross-cutting concerns (authentication, error handling, logging) live in `middleware/` and apply across components rather than belonging to any one of them.

## Data Model
Conventions applied across all collections, not a specific schema list:
- Every collection uses `{ timestamps: true }`.
- Soft delete is modeled as an `isActive: Boolean` flag on the document, not physical deletion, wherever the domain calls for reversible deactivation rather than permanent removal.
- A human-readable unique business identifier (commonly a `code` field) gets a `unique: true` index wherever the domain requires one.
- A many-to-many relationship between two collections is modeled as its own join collection holding the two foreign keys plus a compound unique index on that pair — not as an embedded array on either side.
- References between collections use Mongoose `ref` (ObjectId) for population rather than denormalized copies of related data.

## Integration Points
| System | Direction | Protocol | Notes |
|---|---|---|---|
| MongoDB | Out | MongoDB wire protocol, via Mongoose | Single instance; connection URI from an environment variable |

No other external system or third-party API integration exists today. The consumer(s) of this REST API (a frontend, another service, etc.) are not described anywhere in `.ai-context/` yet — **flagged gap**, not assumed; add here once known.

## Decisions In Force
No ADRs exist yet (`.ai-context/decisions/` holds only `_TEMPLATE_ADR.md`) — **flagged gap**. Two standing decisions are substantial enough to warrant a written ADR retroactively:
- A versioned API prefix (`/api/v1/...`) for authenticated resources, coexisting with any pre-existing unversioned routes.
- JWT as the authentication mechanism for protected routes, verified via shared middleware.

## Known Constraints
- `.ai-context/constitution.md` is still an unfilled skeleton — Security Posture, Testing Discipline, and the other four sections have no stated rules yet. Every plan's Constitution Check is a flagged gap until `constitution-generation` populates it.
- No ADRs are recorded yet, despite at least two decisions (above) that would normally warrant one.
- This file should be re-checked against the actual `src/` contents as implementation proceeds, per this doc's own "keep architecture.md current or don't trust it" rule — a folder-structure/naming-convention doc still goes stale if the codebase drifts from it.
