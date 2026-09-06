# Field guide — Gate 1 Spec Peer Review

Source: INT SDD Blueprint v1.0, Sections 3, 6, 8, 9.

## What Gate 1 is

The review a spec passes through before it's trusted enough for
`plan.md`/implementation work to build on. It gates the `Draft`/`In Peer
Review` → `Approved` transition in the fixed lifecycle (Section 6):

```
Draft → In Peer Review (Gate 1) → Changes Requested ⟲ → Approved →
Plan Drafted → Plan Reviewed → Tasks Generated → In Development →
In QA → Ready for Release → Released (vX.Y.Z) → [Deprecated / Superseded]
```

`Changes Requested ⟲` is not a dead end — it loops back into revision, then
Gate 1 runs again, until the spec clears every bullet.

## The checklist, verbatim (Section 9)

> Reviewer ≠ author · Intent is one unambiguous paragraph · Every AC is
> given/when/then, individually IDed · API Contract complete if applicable
> · Out-of-scope explicit · Plan checked line-by-line against
> constitution.md · Related/Builds-on specs are Approved/Released · No
> overlap with existing spec · Security/Architecture sign-off obtained
> where required · Status updated (never left ambiguous)

Ten bullets. Every one gets an explicit pass/fail with a one-line reason —
same discipline as `plan-generation`'s Constitution Check: **silence on a
bullet is a gap, not a pass.**

### How to check each bullet against the actual spec file

1. **Reviewer ≠ author** — the `spec.md` template has no "Author" field, so
   this can't be inferred from the file. Ask the user directly whether the
   person conducting *this* review is someone other than whoever drafted
   the spec. This is a hard gate: if the answer is no (or the same agent
   session drafted the spec and is now reviewing it with no independent
   human involved), the outcome cannot be `Approved` no matter how clean
   the rest of the checklist is — cap the outcome at "checklist complete,
   pending an independent reviewer" and leave Status at `In Peer Review`.
2. **Intent is one unambiguous paragraph** — read the `## Intent` section.
   Fail if it's more than one paragraph, describes more than one feature,
   or leaves "for whom"/"under what condition" unstated.
3. **Every AC is given/when/then, individually IDed** — check every line
   under `## Acceptance Criteria`. Fail any AC that uses an adjective
   instead of a checkable condition, lacks a `<slug>.ACn` ID, or bundles
   two behaviors into one criterion with "and."
4. **API Contract complete if applicable** — if `## API Contract` exists,
   every endpoint needs request payload, success response + code, and an
   exceptions table with a distinct row per error path (not one generic
   "error" row). If the section is absent, confirm that's actually correct
   (the feature doesn't expose/consume an API) rather than an omission.
5. **Out-of-scope explicit** — `## Explicitly Out of Scope` is present and
   non-empty wherever the feature has any adjacent territory that could be
   mistaken for in-scope.
6. **Plan checked line-by-line against constitution.md** — there's no
   `plan.md` yet at Gate 1 (that only exists after Approval), so this is an
   early, informal spot-check: read `.ai-context/constitution.md` in full
   and verify nothing in the spec's Intent, Acceptance Criteria, API
   Contract, or Non-Functional Constraints already conflicts with any of
   its five sections (e.g. an endpoint with no stated auth decision
   conflicts with Security Posture; a new datastore implied by the Data
   Model conflicts with Architectural Constraints without an ADR). This
   doesn't replace `plan-generation`'s formal Constitution Check later —
   it catches a spec that's DOA before plan work even starts.
7. **Related/Builds-on specs are Approved/Released** — for every spec
   listed under `## Context`'s `Related:`/`Builds on:`, open it and check
   its own `## Status`. Fail if any referenced spec is still `Draft`,
   `In Peer Review`, or `Changes Requested ⟲`.
8. **No overlap with existing spec** — scan sibling files in
   `.ai-context/specs/` for the same feature territory (same entity, same
   API paths, same BRD entry claimed twice). Sibling specs that
   deliberately split one BRD document into several features (see
   `spec-generation`) are expected to reference each other, not overlap —
   overlap means two specs claiming to own the *same* behavior.
9. **Security/Architecture sign-off obtained where required** — can't be
   inferred from the file. Ask the user directly whether sign-off was
   obtained, and use judgment on whether it's "required" at all: an
   endpoint touching auth, PII, or a new datastore/integration almost
   always needs it; a purely internal read-only listing endpoint may not.
   If required and not yet obtained, this blocks `Approved`.
10. **Status updated (never left ambiguous)** — this skill's own job at
    the end: the spec always leaves this review at exactly one of the
    fixed labels, never left mid-review.

## The two possible outcomes — exact labels, nothing invented

- **`Approved`** — every checklist bullet passes, including reviewer
  independence and any required sign-off. Plain label, no version suffix.
- **`Changes Requested ⟲`** — verbatim, including the ⟲ glyph (Section 6's
  own notation for this state) — anything failed. List exactly which
  bullets failed and why, specific enough that the author can act on it
  without re-deriving the finding themselves.

Never write a status outside the fixed state machine (Section 3, rule 6) —
not "Needs Work," not "Pending," not a percentage.

## Revision loop (Section 8, Case A) — what happens after Changes Requested

The spec isn't still Released, so this is always an in-place edit: same
file, same slug. Section 3's rule 9: the author bumps a version marker
inside `## Status` when revising after Gate 1 feedback (e.g. `Draft v1.1`)
so the revision history is visible in the file itself, not only in git
blame. When re-reviewing a spec that came back with `Changes Requested ⟲`,
check that a version bump actually happened — a resubmission with no
version marker change is a sign the file wasn't actually revised.

## What this skill cannot certify on its own

Two checklist bullets are inherently human calls, not something derivable
from file content: **reviewer ≠ author**, and **security/architecture
sign-off obtained where required**. Always ask directly rather than
assuming either is satisfied — an AI-run checklist pass is not itself an
independent human reviewer, and this skill's job is to make that gap
visible, not paper over it with an automatic `Approved`.

## `status.md`

Same discipline as `spec-generation`/`plan-generation`: whichever outcome
is confirmed, update the spec's row in `.ai-context/status.md`'s Active
Specs table the same day — Status column, Last Updated date, and (for
`Changes Requested ⟲`) a short Notes summary of what's blocking, so the
board reflects reality without anyone having to re-open the spec file to
find out why it's stuck.
