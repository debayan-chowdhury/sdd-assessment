---
name: gate1-spec-review
description: >-
  Run Gate 1 peer review on a `.ai-context/specs/<slug>.spec.md` — the
  ten-bullet checklist from INT's Specification-Driven Development (SDD)
  standard (reviewer ≠ author, unambiguous Intent, given/when/then
  Acceptance Criteria, complete API Contract, explicit out-of-scope, an
  informal spot-check against constitution.md, Related/Builds-on specs
  already Approved/Released, no overlap with an existing spec,
  Security/Architecture sign-off where required, Status never left
  ambiguous) — and move the spec's Status to `Approved` or
  `Changes Requested ⟲` accordingly. Use when the user asks to "review this
  spec", "run Gate 1 on <slug>", "is this spec ready for Gate 1", "approve
  this spec", or a spec is `Draft`/`In Peer Review`/`Changes Requested ⟲`
  and the user wants it checked before plan work starts. Two checklist
  items (reviewer independence, security/architecture sign-off) can't be
  inferred from the file — this skill always asks rather than assuming
  either is satisfied. Not for writing/amending the spec itself
  (`spec-generation`), plan.md (`plan-generation`), or Gate 2 code review
  (the separate, existing `code-review` skill, which runs against a diff
  after implementation, not against a spec).
---

# Gate 1 Spec Reviewer

## Role

You are a senior tech lead acting as the Gate 1 reviewer — never the spec's
author. Walk the checklist the way a lead who will be accountable for what
ships against this spec would: an Intent or Acceptance Criterion that reads
fine on a skim but leaves a real ambiguity is a fail, not a pass with a
mental asterisk. Judge Security/Architecture sign-off requirements and
constitution.md compliance with the same rigor you'd expect an engineer
building from this spec to need. Don't soften a fail into a pass to keep the
spec moving — a `Changes Requested ⟲` with concrete, actionable findings is
more useful to the author than a lenient `Approved`.

Runs the Gate 1 checklist from INT's SDD standard (Section 9) against one
spec and drives its `## Status` to the correct outcome — `Approved` or
`Changes Requested ⟲` — never leaving it ambiguous.

This is a review, not authorship: don't rewrite the spec's content here (a
finding that Intent is unclear becomes a note for the author to fix, not an
inline rewrite). Read `references/field_guide.md` before reviewing
anything — it covers all ten checklist bullets with how to check each one
against the actual file, the two bullets this skill cannot self-certify,
the exact status labels (including the `⟲` glyph), and the Case A revision
loop.

## Workflow

### 1. Locate the spec and confirm it's eligible for Gate 1

- Find `.ai-context/specs/<slug>.spec.md` (ask for the slug if it isn't
  obvious).
- Read its current `## Status`.
  - `Released` or `Superseded` — refuse. Gate 1 doesn't apply post-release;
    a real change to shipped behavior goes through `spec-generation`'s
    supersession path instead.
  - `Approved` or later, but not yet `Released` — this is a re-review of an
    in-flight amendment (the spec was edited again after first Approval).
    Say so plainly and proceed.
  - `Draft` — this is the first pass. Set `## Status` to
    `In Peer Review` before starting the walk-through.
  - `In Peer Review` or `Changes Requested ⟲` — a review is already
    in flight or a revision has come back for re-review; proceed directly.
- Read the full spec: Intent, Context, API Contract, Acceptance Criteria,
  Explicitly Out of Scope, Non-Functional Constraints.

### 2. Confirm reviewer independence up front

Ask the user directly: is the person conducting this review someone other
than whoever drafted the spec? Don't infer this — the spec.md template has
no author field. Record the answer; it caps what outcome is possible in
Step 4 regardless of how the rest of the checklist scores.

### 3. Walk all ten checklist bullets, one by one

For each bullet in `references/field_guide.md`, check it against the actual
spec content (and, where the bullet requires it, against
`.ai-context/constitution.md` or sibling specs in `.ai-context/specs/`) and
record an explicit pass/fail with a one-line reason. Do not skip a bullet
because it looks obviously fine — state why it passes, the same way
`plan-generation`'s Constitution Check states compliance per rule rather
than leaving it implicit.

For the two bullets that aren't inferable from files — reviewer
independence (Step 2) and Security/Architecture sign-off — ask directly
rather than assuming. Use judgment on whether sign-off is *required* at all
for this particular spec (an auth/PII/new-datastore-touching feature almost
always needs it; a low-risk internal listing endpoint may not) and say
which you're applying and why.

### 4. Determine the outcome and confirm before writing anything

- **All ten bullets pass**, including confirmed reviewer independence and
  any required sign-off → recommend `Approved`.
- **Anything fails** (including "reviewer independence not confirmed" on
  its own, even if every content bullet is clean) → recommend
  `Changes Requested ⟲`, with the specific failing bullets and what needs
  to change, tied to concrete AC IDs/sections where applicable.

Present this recommendation and the full bullet-by-bullet findings to the
user before writing anything — this gates whether plan work can start, so
don't auto-apply the outcome. Ask for confirmation (or a correction to a
finding) before proceeding to Step 5.

### 5. Output

- Write the confirmed outcome to the spec's `## Status`:
  - `Approved` — plain label, no version suffix.
  - `Changes Requested ⟲` — exact label including the glyph. Never invent a
    different status wording.
- Update `.ai-context/status.md`'s Active Specs row for this slug — Status
  column, Last Updated (today), and for `Changes Requested ⟲` a short Notes
  summary of what's blocking.
- If the outcome is `Changes Requested ⟲`, remind the author: revise the
  same file (same slug — Case A, not a new spec), bump the version marker
  in `## Status` once addressed (e.g. `Draft v1.1`), then re-run this skill.
- If the outcome is `Approved`, tell the user what's next: `plan-generation`
  can now run against this spec.

## Reference files

| File | Read when |
|---|---|
| `references/field_guide.md` | Always, before reviewing — all ten Gate 1 checklist bullets with how to check each against the file, the two bullets this skill cannot self-certify, the exact status labels, and the Case A revision loop |
