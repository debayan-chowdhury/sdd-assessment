# Plan Generation Workflow

Triggered when generating `.ai-context/plans/<slug>.plan.md` from an
**Approved** `.ai-context/specs/<slug>.spec.md`. Do not start plan generation
if the linked spec's Status is not `Approved`.

Follow these steps:

1. Read the linked spec's **Intent**, **API Contract**, and **Acceptance
   Criteria** in full before drafting anything.
2. Produce the plan following the `.ai-context/plans/_TEMPLATE.plan.md`
   skeleton exactly — every section present, in order:
   * Derived From (link back to the spec and its version)
   * Architecture Approach (how this fits the Next.js App Router structure —
     which route segments, Server vs Client Components, Server Actions vs
     Route Handlers)
   * Data Model (types/schemas involved, and any validation layer, e.g. zod)
   * Constitution Check
   * Explicitly Deferred
   * Sequencing
3. For the Constitution Check, go line-by-line against the project's actual
   `.ai-context/constitution.md` — check each rule explicitly and record a
   pass/fail/N-A, never a blanket "looks compliant."
4. If the spec left something ambiguous (an unclear acceptance criterion, an
   unspecified error case, a missing contract detail), flag it explicitly in
   the plan for human resolution — do not silently choose an interpretation.
5. List anything intentionally out of scope for this pass under Explicitly
   Deferred, with a one-line reason.
