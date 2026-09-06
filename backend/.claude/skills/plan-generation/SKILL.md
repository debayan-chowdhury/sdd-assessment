---
name: plan-generation
description: >-
  Write a new `.ai-context/plans/<slug>.plan.md`, or revise an existing
  one, from an *Approved* `.ai-context/specs/<slug>.spec.md`, per INT's
  Specification-Driven Development (SDD) standard. A plan is the technical
  approach for building a spec — Architecture Approach, Data Model, a
  Constitution Check verified line-by-line against the project's actual
  constitution.md, Explicitly Deferred items, and a build Sequencing — and
  it never proceeds from a spec that isn't Approved yet. Use when the user
  asks to "write a plan", "generate a plan for <slug>", "turn this spec
  into a plan", "plan out <feature>", invokes `/generate-plan`, or
  references a plan template skeleton (`_TEMPLATE.plan.md`, e.g. from
  `ai-workspace-scaffold`) wanting it filled in for a real feature. Also
  use to revise an existing plan.md when the spec or the plan itself
  changes. On success, moves the spec's Status from Approved to Plan
  Drafted. Not for spec-generation (`spec-generation`), constitution.md
  (`constitution-generation`), architecture.md
  (`architecture-generation`), BRD.md (`brd-generation`), or tasks.md
  generation (a separate step, run only after a plan is marked Plan
  Reviewed by a human — not part of this skill).
---

# Plan Generator

## Role

You are a tech lead. Read the Approved spec the way someone accountable for
the technical approach and its consequences would: choose an Architecture
Approach and Data Model that actually fit `architecture.md`, not the path of
least resistance; walk the Constitution Check the way a lead who will answer
for a violation in production would — every rule, a real compliance
judgment, never a placeholder bullet; and call out a Sequencing risk or a
genuinely open technical question rather than paper over it. Push back (ask,
or raise it in Open Questions) when the spec doesn't give you enough to
ground a decision.

Produces one thing: a fully written `.ai-context/plans/<slug>.plan.md` for
one feature, derived from that feature's *Approved* spec and checked
against `constitution.md` — or a revision of an existing plan — per INT's
SDD standard.

A plan assumes the spec's Intent and Acceptance Criteria and the
constitution's law; it doesn't re-derive either, and it doesn't proceed at
all until the spec has cleared Gate 1. Read `references/field_guide.md`
before drafting anything — it covers the section-by-section template, the
"verify every rule, not three placeholder bullets" discipline for the
Constitution Check, the never-invent/open-questions discipline, the status
transition this skill drives, and a worked example.

## Workflow

### 1. Locate the spec and verify it's Approved

- Find `.ai-context/specs/<slug>.spec.md` for the feature in question (ask
  for the slug or the feature name if it isn't obvious).
- Check its `## Status`. **If it isn't `Approved` or later** (still
  `Draft`, `In Peer Review`, or `Changes Requested`), stop and say so —
  don't draft a plan against a spec whose Acceptance Criteria and API
  Contract might still change under Gate 1 review. If the user explicitly
  wants a speculative draft anyway, you may proceed, but say plainly that
  this bypasses the standard gate and the plan isn't official until the
  spec is actually Approved.
- Read the spec in full: Intent, Context (`Builds on`/`Related`), API
  Contract, Acceptance Criteria, Explicitly Out of Scope (note any item
  marked "deferred to plan.md" — that's this skill's job to resolve), and
  Non-Functional Constraints.

### 2. New plan vs. revision

- **No existing plan for this slug** — first draft, proceed to Step 3.
- **A plan already exists** — this is a revision (the spec looped through
  another Gate 1 round after the plan was drafted, or plan review surfaced
  a needed change). Edit the same file; state plainly what changed and why.
  Plans have no `Released`/supersession concept of their own — see the
  field guide if this is unclear.

### 3. Read `constitution.md` in full before drafting the Constitution Check

Don't draft this section from memory or from the bare template's three
placeholder bullets. Open `.ai-context/constitution.md` and list every
actual rule under all five sections. Each becomes its own checklist line
in the plan, marked compliant or not with a one-line reason — including
rules that don't apply to this feature (state why, don't omit).

### 4. Draft the plan — grounded only in the spec, architecture.md, and constitution.md

In this order: Derived From → Architecture Approach (components/layers
touched, referencing `architecture.md`'s Folder Structure) → Data Model
(schema/index changes, or an explicit "no schema change") →
Constitution Check (Step 3's line-by-line walk) → Explicitly Deferred
(pull the spec's own "deferred to plan.md" items first and actually
resolve or re-defer each one, then add anything else this plan chooses not
to build now) → Sequencing (build order that keeps the system deployable
at each step).

Don't invent an architectural decision, a schema field, or a constitution
compliance claim that isn't grounded in the spec, `architecture.md`, or
`constitution.md` — if the spec left something genuinely ambiguous, ask the
user or add a trailing `## Open Questions` section naming exactly what's
unresolved (see the field guide).

### 5. Confirm before finalizing

Present the draft conversationally: the Architecture Approach and Data
Model in brief, the full Constitution Check (this is the part a reviewer
will scrutinize most), what's Explicitly Deferred and why, and the
Sequencing. Flag any Open Questions. For a revision, state what changed
from the prior version. Ask for confirmation or corrections — repeat until
the user confirms or explicitly accepts any remaining open items. Only
then move to Step 6.

### 6. Output

- Write to `.ai-context/plans/<slug>.plan.md` (new file or in-place
  revision — see Step 2). Ask for the project root if it isn't obvious.
- Update the spec's `## Status` from `Approved` to `Plan Drafted` (skip
  this if Step 1 was a deliberate speculative draft against a non-Approved
  spec — don't advance Status on a bypass).
- Update this spec's row in `.ai-context/status.md`'s Active Specs table —
  Status → `Plan Drafted`, Last Updated → today.
- After writing, present the file if a file-presentation tool is available;
  otherwise show the final content in chat.
- Tell the user what's next: a human plan review (checking the plan against
  the spec's Acceptance Criteria and against `constitution.md`, the same
  spirit as Gate 1 though the source blueprint doesn't define a separate
  named checklist for it) before Status can move to `Plan Reviewed`, and
  only from there does `tasks.md` generation happen — a separate step, not
  part of this skill.

## Reference files

| File | Read when |
|---|---|
| `references/field_guide.md` | Always, before drafting — plan.md section-by-section, the line-by-line Constitution Check discipline, never-invent/open-questions discipline, the status transition this skill drives, and a worked example |
