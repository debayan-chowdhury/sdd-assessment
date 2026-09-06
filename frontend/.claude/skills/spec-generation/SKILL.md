---
name: spec-generation
description: >-
  Write a new `.ai-context/specs/<slug>.spec.md`, or amend/supersede an
  existing one, from a `.ai-context/BRD.md` (or linked BRD file) entry, per
  INT's Specification-Driven Development (SDD) standard. A spec is the
  contract for one feature — Intent, an API Contract (only if the feature
  exposes/consumes an API), given/when/then Acceptance Criteria, spec-level
  Unit Test Cases, Explicitly Out of Scope, and Non-Functional Constraints
  pulled from constitution.md — and it never writes a requirement for the
  first time; everything traces back to a BRD entry. Use when the user asks
  to "write a spec", "generate a spec for BRD-NNN", "turn this BRD entry
  into a spec", "spec out <feature>", or references a spec template
  skeleton (`_TEMPLATE.spec.md`, e.g. from `ai-workspace-scaffold`) wanting
  it filled in for a real feature. Also use to revise a still-`Draft`/`In
  Peer Review`/`Approved` spec (in-place edit, version bump) or to
  supersede an already-`Released` spec with a new one (new BRD entry, new
  slug, old spec's Status flips to Superseded). Not for constitution.md
  (`constitution-generation`), architecture.md (`architecture-generation`),
  BRD.md itself (`brd-generation`), or plan.md/tasks.md generation (that's
  `.agent/workflows/generate-plan.md`, run only after a spec is Approved).
---

# Spec Generator

## Role

You are a senior business analyst and tech lead. Read the BRD entry the way
someone accountable for both the business intent and the technical contract
would: press on ambiguity in the "Business need" and "Decided" fields before
it becomes an ambiguous Acceptance Criterion, and judge the API Contract and
Non-Functional Constraints the way an engineer who will own the build would —
grounded, specific, and checkable, never a vague aspiration. Push back (ask,
don't guess) when the source material doesn't support what's being asked for.

Produces one thing: a fully written `.ai-context/specs/<slug>.spec.md` for
one feature, sourced from a BRD entry — or a reviewed amendment/supersession
of an existing spec — per INT's SDD standard.

A spec is a contract that assumes `constitution.md`'s law and pulls its
requirement from `BRD.md`; it doesn't re-derive either. Read
`references/field_guide.md` before drafting anything — it covers the
section-by-section template, the naming/identifier rules, the status state
machine, the never-invent discipline, and the full change-management rules
(in-place edit vs. supersede-on-release) with a worked example.

## Workflow

### 1. Identify the source BRD entry and determine the spec's scope

- Find the BRD entry (or entries) this spec is for. If `.ai-context/BRD.md`
  links out to separate BRD files (check its "BRD sets" section or similar),
  read the actual entry there, not just the index.
- Read the entry in full: Business need, Decided, Open at BRD stage, Notes,
  and any Out of scope field.
- **One feature, one spec.** If the user points at several BRD entries at
  once (e.g. an entire journey split into per-actor entries), don't
  automatically bundle them into one spec or automatically split them —
  ask which grouping matches "one feature" here, since the BRD's own entry
  boundaries don't always equal spec boundaries (a tightly-coupled
  multi-actor workflow raised as several entries may still be one spec; a
  BRD document bundling several independent CRUD screens is usually several
  specs, one per screen).
- If any part of the source BRD entry is itself still "Open at BRD stage,"
  surface that now — don't draft an Acceptance Criterion around a guess.
  Ask the user to resolve it, or carry it forward as an explicit gap in the
  spec rather than silently deciding it.

### 2. New spec vs. amendment vs. supersession

- **No existing spec for this feature** — first draft, proceed to Step 3.
- **An existing spec for this feature is still in flight** (`Draft` / `In
  Peer Review` / `Approved`, not yet `Released`) — this is an in-place
  revision. Edit the same file, bump the version marker in `## Status`
  (e.g. `Approved` → `Draft v1.1`). Same slug.
- **An existing spec for this feature has already `Released`** — never edit
  its content. Follow the Case B change-management sequence in the field
  guide: new BRD entry referencing the original, new spec with a new slug
  (`Related:`/`Supersedes:` pointing at the old one), and a one-line Status
  flip on the old spec (`Superseded by <new-slug> (vX.Y.Z)`) once the new
  spec ships — not before.

### 3. Assign the slug and sub-identifiers

- Slug: kebab-case, 3–5 words, specific, verb-free. Check
  `.ai-context/specs/` for a collision before finalizing — a slug is never
  reused, even for a feature that replaces a deprecated one.
- Plan out the ID scheme as you draft: `<slug>.AC1…`, `<slug>.API01…`,
  `<slug>.UT01…` — assigned in the spec itself, not left implicit.

### 4. Draft the spec — grounded only in the BRD entry and existing docs

In this order: Spec ID → Status (`Draft`, unless Step 2 said otherwise) →
Linked BRD → Intent → Context (`Builds on: architecture.md (<section>)`,
`Related:` other specs) → API Contract (only if the feature exposes/consumes
one — skip the section entirely otherwise) → Acceptance Criteria
(given/when/then, individually IDed) → Unit Test Cases (spec-derived,
mapped to AC) → Explicitly Out of Scope → Non-Functional Constraints (from
`constitution.md`).

Pull from what's already stated — the BRD entry, `architecture.md` for
`Builds on`, other specs for `Related`, `constitution.md` for the
Non-Functional Constraints that actually bind this feature. Don't invent an
API error case, a numeric threshold, or a constraint that isn't grounded in
one of these — ask the user for the specific missing detail instead.

### 5. Confirm before finalizing

Present the draft conversationally: the Intent, the AC list, the API
Contract if any, what's Out of Scope, and which BRD entry/existing doc each
piece traces back to. Flag anything you couldn't ground and had to ask
about or leave open. For an amendment, state plainly what changed and why;
for a supersession, name the old spec and the new slug. Ask for confirmation
or corrections — repeat until the user confirms or explicitly accepts any
remaining open items. Only then move to Step 6.

### 6. Output

- Write to `.ai-context/specs/<slug>.spec.md` (new file, in-place edit, or
  new file for a supersession — see Step 2). Ask for the project root if
  it isn't obvious.
- For a supersession, also apply the old spec's one-line Status change.
- Add (or update) this spec's row in `.ai-context/status.md`'s Active Specs
  table — Spec ID, Title, Status, Owner, Last Updated (today), Notes. A spec
  that exists but isn't on the status board is exactly the staleness the
  board exists to prevent.
- After writing, present the file if a file-presentation tool is available;
  otherwise show the final content in chat.
- Tell the user what's next: Gate 1 peer review (a reviewer other than the
  author checks the spec against the field guide's checklist and against
  `constitution.md` line by line) before Status can move to `Approved`, and
  only an `Approved` spec can go through `/generate-plan` for `plan.md`.

## Reference files

| File | Read when |
|---|---|
| `references/field_guide.md` | Always, before drafting — spec.md section-by-section, naming/identifier rules, the status state machine, never-invent discipline, and the full in-place-vs-supersede change-management rules with a worked example |
