---
name: swagger-docs
description: >-
  Add or update Swagger/OpenAPI documentation for this project's Express
  REST API. Installs `swagger-jsdoc` + `swagger-ui-express` if not already
  present, adds a central OpenAPI config at `src/config/swagger.js` (info,
  `/api/v1` server, JWT bearer security scheme), mounts interactive docs at
  `GET /api-docs`, and adds/updates one `@swagger` JSDoc block per endpoint
  directly above its `router.<method>(...)` call in `src/routes/*.js`.
  Every block is sourced from that endpoint's corresponding
  `.ai-context/specs/<slug>.spec.md` API Contract section (request shape,
  success response, every listed exception with its exact error code) —
  never invented from the route/controller code alone. Use when the user
  asks to "add swagger", "document the API", "generate OpenAPI docs", "add
  API documentation", or references Swagger/OpenAPI for this backend. Also
  use to add docs for a newly implemented endpoint, or to refresh docs
  after an endpoint's spec changes. For an endpoint with no spec (e.g. a
  dev-only route like `/api/v1/dev/admin-token`, or infra like
  `/api/v1/health`), document it directly from the route/controller code
  instead and mark it clearly as non-spec'd — don't skip it silently. Not
  for writing the spec itself (`spec-generation`) — this skill only
  documents what a spec (or, for non-spec'd routes, the code) already
  contracts.
---

# Swagger Docs Generator

## Role

You are the engineer keeping this API's documentation trustworthy. A
Swagger page a caller can't rely on is worse than no page at all — every
status code, every field, and every error body you write here must be
something the spec (or, for non-spec'd routes, the actual code) really
says, not something that looks plausible. When a spec and the running code
disagree, that's a real bug to flag to the user, not something to
paper over by documenting whichever one looks more convenient.

Produces: a working `GET /api-docs` (and `GET /api-docs.json` for the raw
spec) reflecting every currently-implemented endpoint, plus one `@swagger`
block per endpoint co-located with its route so the docs stay easy to keep
in sync as routes change.

## Workflow

### 1. Check what's already set up

- Look for `swagger-jsdoc`/`swagger-ui-express` in `package.json` and for
  `src/config/swagger.js`. If both exist, this is an update — skip to
  Step 3 for whichever routes are new or changed.
- If setting up for the first time, continue to Step 2.

### 2. First-time setup

- Add `swagger-jsdoc` and `swagger-ui-express` to `package.json`
  dependencies, `npm install`.
- Create `src/config/swagger.js`:

  ```js
  const swaggerJsdoc = require('swagger-jsdoc');

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: '<derive from project_context.md's Project Name, or ask>',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    apis: ['./src/routes/*.js'],
  });

  module.exports = swaggerSpec;
  ```

- Mount it in `src/app.js` (alongside the other route mounts, before the
  404 handler):

  ```js
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
  ```

  Mount it unconditionally unless the user asks otherwise — unlike the
  dev-token endpoint, a docs page isn't a security bypass, so it doesn't
  need a `NODE_ENV !== 'production'` gate by default.

### 3. One `@swagger` block per endpoint, grounded in its spec

For each route file (`src/routes/<slug>Routes.js` or similar), find that
feature's `.ai-context/specs/<slug>.spec.md`. Walk its **API Contract**
section endpoint by endpoint (`<slug>.API01`, `API02`, …) and add a
JSDoc block directly above the matching `router.<method>(...)` line,
translating:

- The spec's **Request payload** → `requestBody.content['application/json'].schema`
  (mark fields required per the spec's own wording, e.g. "Missing/invalid
  `name` or `code`" implies both are required).
- The spec's **Success response** → the `2xx` entry in `responses`, full
  shape including every field the spec lists.
- Every row in the spec's **Exceptions** table → its own entry in
  `responses`, keyed by the exact status code, `description` naming the
  exact error code from the spec (e.g. `duplicate_location`, not a
  paraphrase). Do not omit a listed exception and do not add one the spec
  doesn't have.
- `security: [{ bearerAuth: [] }]` on every endpoint that requires
  `requireAdminAuth` (check the route file itself for this — some route
  files apply it once via `router.use(...)` rather than per-endpoint).
- `tags: [<Resource>]` — one tag per resource (e.g. `Locations`,
  `Departments`), so Swagger UI groups them sensibly.

Example, grounded in `admin-location-crud.spec.md`'s API01:

```js
/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a Location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 name: { type: string }
 *                 code: { type: string }
 *                 isActive: { type: boolean }
 *       400:
 *         description: validation_error
 *       401:
 *         description: unauthorized
 *       403:
 *         description: forbidden
 *       409:
 *         description: duplicate_location
 */
router.post('/', locationController.create);
```

For a path parameter like `:id`, add a shared `parameters` entry
(`{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }`)
on that endpoint's block rather than inventing a separate reusable
component unless several endpoints across many files share it.

### 4. Non-spec'd routes — document from code, mark clearly

Some routes have no spec (dev-only endpoints like
`GET /api/v1/dev/admin-token`, infra like `GET /api/v1/health`). Still
document them — an undocumented endpoint that exists in the running app is
a worse gap than one clearly marked as non-spec'd. Read the actual
route/controller code for the real request/response shape (never guess),
and note in the `description` that it isn't backed by a spec, e.g.
`"Dev-only convenience, not part of any spec — see src/routes/devRoutes.js"`.

### 5. Never invent — flag mismatches instead

If a spec's API Contract says something the actual controller code doesn't
do (a status code the code never returns, a field the code never sends),
don't silently document the spec's version or the code's version as if
they agree — stop and tell the user which one is out of date, the same
discipline `spec-generation`/`plan-generation` apply to their own
never-invent rule. This is a real bug (spec drift or an implementation
gap), not a documentation detail to paper over.

### 6. Verify

- Start (or restart) the app and hit `GET /api-docs` — confirm it loads
  and every implemented endpoint appears.
- Hit `GET /api-docs.json` and spot-check that a couple of endpoints'
  `responses` match what `curl` against the real endpoint actually
  returns (status code and error `description` at minimum).
- Report which route files got new/updated blocks and which endpoints (if
  any) had no spec and were documented from code instead.
