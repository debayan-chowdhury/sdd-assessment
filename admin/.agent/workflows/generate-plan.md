# Plan Generation Workflow

Triggered to turn an **Approved** `.ai-context/specs/<slug>.spec.md` into a
`.ai-context/plans/<slug>.plan.md`. Do not run this workflow against a spec
that is not yet `Approved`.

1. Read the linked spec in full — its Intent, API Contract (if any), and
   given/when/then Acceptance Criteria — before writing anything. The plan
   must implement exactly what the spec contracts, nothing more.
2. Produce the plan by filling in every section of
   `.ai-context/plans/_TEMPLATE.plan.md`:
   - **Derived From** — the spec's slug and version.
   - **Architecture Approach** — how this fits the project's Next.js App
     Router structure (which route segment(s), Server vs. Client Components,
     Server Actions vs. Route Handlers, where new logic lives under `src/`).
   - **Data Model** — any new/changed types, schemas (e.g. Zod), or database
     shapes this feature needs.
   - **Constitution Check** — go through `.ai-context/constitution.md`
     rule by rule and state explicitly how the plan satisfies each one (or
     flag it if it doesn't apply). Do not skip rules silently.
   - **Explicitly Deferred** — anything in scope of the broader feature but
     intentionally not built in this plan.
   - **Sequencing** — an ordered build sequence, granular enough to become
     the basis for `.ai-context/tasks/<slug>.tasks.md` later.
3. If anything in the spec is ambiguous or underspecified for implementation
   purposes, flag it explicitly in the plan (e.g. under Explicitly Deferred
   or an "Open Questions" note) — do not silently resolve it with an
   assumption.
4. On completion, move the spec's Status field from `Approved` to
   `Plan Drafted`.
