# Folder structure patterns, by stack

Used in Step 3 of the workflow to give the user 2–3 real named options instead
of a single default. Present these as a short pick list (`ask_user_input_v0`
fits well here — the options are genuinely mutually exclusive), then render
the chosen pattern as an actual tree scoped to the project, not this generic
version.

**Recommendation rule of thumb**, offered alongside the options, not instead
of asking: layered for a small service or an early-stage project with one
obvious domain, feature-based once there are several independent domains
sharing a codebase, and clean/hexagonal when the domain logic needs to
outlive a likely future swap of framework, DB, or transport. Say this as a
one-line steer, then let the user actually pick — don't pick for them.

---

## Node.js / Express / NestJS-style backends

**Layered (by technical role)** — simplest, best for a single-domain service:
```
src/
├── controllers/
├── services/
├── models/
├── routes/
├── middleware/
└── utils/
```

**Feature-based (by domain module)** — better once there are 3+ distinct
domains in one codebase:
```
src/
├── modules/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.routes.ts
│   │   └── users.model.ts
│   └── payments/
│       └── ...
└── shared/
```

**Clean/hexagonal** — when domain logic must stay framework-agnostic (e.g.
swapping the DB or the HTTP framework should not touch business logic):
```
src/
├── domain/          # entities, business rules — no framework imports
├── application/      # use-cases, orchestration
├── infrastructure/    # DB, external APIs, framework adapters
└── interfaces/        # HTTP controllers, CLI, etc.
```

## Python / FastAPI / Django-style backends

**src layout, layered:**
```
src/<package>/
├── api/            # routers / views
├── services/
├── models/
├── schemas/          # pydantic / DTOs
└── core/            # config, dependencies
```

**Feature-based:**
```
src/<package>/
├── features/
│   ├── users/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── models.py
│   └── payments/
└── shared/
```
Django specifically defaults to per-app structure (`app_name/models.py`,
`views.py`, `serializers.py`) — treat "one Django app per bounded domain" as
the feature-based equivalent rather than introducing a competing pattern.

## Java / Spring Boot

**Layered (package by layer):**
```
src/main/java/com/company/project/
├── controller/
├── service/
├── repository/
└── model/
```

**Feature-based (package by feature)** — generally preferred past a handful
of controllers, since Java tooling makes cross-package navigation easy either
way and package-by-feature keeps related classes co-located:
```
src/main/java/com/company/project/
├── users/
│   ├── UserController.java
│   ├── UserService.java
│   └── UserRepository.java
└── payments/
```

## .NET

**Layered (by project, in a multi-project solution):**
```
Solution/
├── Api/              # controllers
├── Application/       # services, use-cases
├── Domain/            # entities
└── Infrastructure/    # EF Core, external clients
```
This is effectively .NET's idiomatic clean-architecture split — call it that
if the user is already using multi-project solutions for layering.

## React / frontend SPAs

**Feature-based (co-located):**
```
src/
├── features/
│   ├── checkout/
│   │   ├── Checkout.tsx
│   │   ├── useCheckout.ts
│   │   └── checkout.api.ts
│   └── profile/
├── components/    # shared, cross-feature UI only
└── lib/
```

**Atomic design** — better fit for a design-system-heavy product with many
reusable primitives, worse fit for a feature-heavy business app:
```
src/
├── atoms/
├── molecules/
├── organisms/
├── templates/
└── pages/
```

## Flutter / React Native

**Feature-based, mirrors the backend pattern:**
```
lib/
├── features/
│   ├── checkout/
│   │   ├── presentation/
│   │   ├── domain/
│   │   └── data/
│   └── profile/
└── shared/
```

---

## If the stack isn't listed here

Apply the same three-way choice (layered / feature-based / clean-hexagonal)
using that ecosystem's real idioms and directory-naming conventions — don't
force one of the trees above onto an unrelated stack. State the recommended
default for that ecosystem in one line, then ask.
