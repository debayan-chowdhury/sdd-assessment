# Field guide — `.ai-context/plans/<slug>.plan.md`

Source: INT SDD Blueprint v1.0, Sections 2, 3, 4, 5, 6, 9.

## What this file is, and isn't

- **A plan is derived from an *Approved* spec, never from a Draft one.**
  Section 3: "`plan.md` — Derived from an *approved* spec." The spec is the
  contract (what's being built, what "correct" means); the plan is the
  technical approach for building it, checked against `constitution.md`.
  Don't plan against a spec that's still in Gate 1 review — its Acceptance
  Criteria and API Contract aren't settled yet.
- **One spec, one plan, same slug.** The plan lives at
  `.ai-context/plans/<slug>.plan.md`, same `<slug>` as the spec it's derived
  from — never a new slug at this stage (a new slug only happens when a
  *spec* is superseded, per `spec-generation`'s change-management rules).
- **Link, don't restate.** Reference the spec and `constitution.md` by
  path; don't paste their content in wholesale. The plan adds the technical
  approach *on top of* what they already say.

## Section-by-section (plan.md)

1. **Derived From** — `.ai-context/specs/<slug>.spec.md`. Nothing else.
2. **Architecture Approach** — which components/layers this touches (per
   this project's `architecture.md` Folder Structure — e.g. for a layered
   Node backend: which routes/controllers/services/models are new vs.
   modified), and any new module. Name integration points from the spec's
   API Contract, don't re-derive new ones here.
3. **Data Model** — schema changes: new/changed fields, indexes, and (for
   an existing datastore) migration or backfill implications. If the spec
   implies no schema change, say so explicitly rather than leaving the
   section looking skipped.
4. **Constitution Check** — a checklist, **verified line-by-line against
   the project's actual `constitution.md`**, not the three generic
   placeholder bullets in the bare template (those are illustrative only).
   Walk every bullet under every one of the five constitution sections
   (Testing Discipline, Security Posture, Architectural Constraints,
   Non-Functional Baselines, Versioning Rules) that's stated as an actual
   rule (skip a section only if it's itself an explicitly flagged gap in
   `constitution.md`, and say so) and mark each `[x]`/`[ ]` with a one-line
   reason. **A plan silent on a rule is a gap, not a pass** — every rule
   gets an explicit line, including ones that "obviously" don't apply
   (state why they don't, don't just omit them).
5. **Explicitly Deferred** — anything the spec allowed to be dropped from
   this version, plus anything the spec itself flagged as an open
   implementation detail deferred to plan stage (e.g. a spec's Explicitly
   Out of Scope list often includes "X — deferred to plan.md"; this is
   where that gets resolved: either the plan makes the concrete decision,
   or it re-defers with a reason). Each item states the reason, not just
   the fact of deferral.
6. **Sequencing** — the high-level build order, chosen so the system stays
   deployable at each step (e.g. additive schema/field changes land before
   the code that depends on them; a new endpoint's auth/validation lands
   before the endpoint is wired into a route). This is the input
   `tasks.md` generation will later break into independently-verifiable
   units — not itself a task list.

## Never invent — flag open questions

Same discipline as every other `.ai-context/` artefact: if the spec left
something genuinely ambiguous (an error-response shape it didn't fully
specify, a field type, an auth requirement it didn't state), don't silently
resolve it with a plausible-sounding guess. Either ask the user directly, or
add a trailing `## Open Questions` section naming exactly what's unresolved
and who it's deferred to (usually: back to the spec author for a Gate 1
amendment). This mirrors `constitution-generation`/`architecture-generation`
gap-flagging — an honest open question is more useful than an invented
answer a reviewer will trust by default.

## Status transitions this skill drives

Per the fixed state machine (Section 6):
```
... Approved → Plan Drafted → Plan Reviewed → Tasks Generated → ...
```
Writing a new plan moves the *spec's* `## Status` from `Approved` to
`Plan Drafted` — update this in the spec file itself, and in
`.ai-context/status.md`'s Active Specs row for that slug (Status column +
Last Updated date). `Plan Reviewed` is a separate, later transition (after
a human reviews the plan) — this skill only ever produces `Plan Drafted`,
never `Plan Reviewed` or beyond.

## Revising an existing plan

`plan.md` has no `Released` concept of its own — that only applies to
specs. If `.ai-context/plans/<slug>.plan.md` already exists for this slug
(e.g. the spec looped through another Gate 1 revision after the plan was
first drafted, or plan review surfaced a needed change), treat it as an
in-place revision: edit the same file, and state plainly what changed and
why relative to the prior version. There's no separate supersession
mechanism for plans — that only happens at the spec level, which produces
a new slug and therefore a new plan file by definition.

## Worked example — email-password-login (abridged)

From an Approved spec `email-password-login.spec.md`:

```markdown
# Plan: Email + Password Login

## Derived From
.ai-context/specs/email-password-login.spec.md

## Architecture Approach
New /auth/login endpoint in the existing auth-service. Password hashed
with bcrypt (cost factor 12) at signup, compared with bcrypt.compare at
login — no plaintext password ever touches the database or logs.

## Data Model
Uses existing `users` table (email, password_hash columns). No new
datastore.

## Constitution Check
- [x] No new datastore introduced without ADR — none introduced.
- [x] Testing discipline matches constitution.md — Jest, test-first.
- [x] Security posture matches constitution.md — password hashed, never
  logged.

## Explicitly Deferred
- Password reset flow — separate spec, not built here.

## Sequencing
1. `users` table password_hash column + bcrypt utility
2. `/auth/login` endpoint with credential check
3. Rate-limit lockout after 5 failed attempts
4. Frontend login screen
```

Note the Constitution Check names the actual rule and states compliance in
one line each — not a bare checkbox with no rationale.

## What's out of scope for this skill

- **Gate 1 spec review** — the plan assumes the spec is already `Approved`;
  if it isn't, that's a blocker to raise, not something this skill resolves.
- **`tasks.md` generation** — a separate step, run only after a human
  marks the plan `Plan Reviewed`. Sequencing here is input to that step, not
  a replacement for it.
- **ADRs** — if the plan's Architecture Approach or Data Model implies a
  decision serious enough to need one (a new datastore, a reversal costing
  more than a day of rework), flag that it needs an ADR rather than writing
  one inline — `.ai-context/decisions/ADR-NNNN-<slug>.md` is a separate
  artefact with project-global sequential numbering.
