# Plan Generation Workflow

Triggered to turn an *Approved* `.ai-context/specs/<slug>.spec.md` into a
`.ai-context/plans/<slug>.plan.md`. Do not proceed if the spec's Status is
not `Approved`.

1. Read the linked spec in full — its Intent, API Contract, and
   given/when/then Acceptance Criteria — before drafting anything.
2. Produce the plan by filling in the
   `.ai-context/plans/_TEMPLATE.plan.md` skeleton exactly, covering:
   * **Derived From** — the spec's file path and version/date.
   * **Architecture Approach** — where the feature's routes, controllers,
     services, and Mongoose models live, and how they fit the project's
     existing layered structure.
   * **Data Model** — any new/changed Mongoose schema fields, indexes, or
     relationships (`ref`/`populate`) the feature requires.
   * **Constitution Check** — go through `.ai-context/constitution.md`
     rule by rule and state explicitly how the plan satisfies each one
     (Testing Discipline, Security Posture, Architectural Constraints,
     Non-Functional Baselines, Versioning Rules). Never state compliance
     silently — call out every rule by name.
   * **Explicitly Deferred** — anything in scope for the spec but pushed to
     a later iteration, and why.
   * **Sequencing** — an ordered build sequence a follow-up `tasks.md` can
     be generated from directly.
3. If the spec leaves anything ambiguous (an undefined validation rule, an
   unclear error case, a missing field type), flag it explicitly in the plan
   rather than silently resolving it with an assumption.
4. On completion, note that the spec's Status should move from `Approved` to
   `Plan Drafted`.
