# Field guide — `.ai-context/specs/<slug>.spec.md`

Source: INT SDD Blueprint v1.0, Sections 3, 4, 5, 6, 8, 9.

## What this file is, and isn't

- **One feature, one spec.** Never combine two features in one file, never
  split one feature across two. A BRD entry that bundles several genuinely
  separable actions (e.g. four master-data CRUD screens raised as one
  document) still gets one spec per feature — group only when the BRD entry
  itself describes a single indivisible contract.
- **The spec is the contract; the BRD is where the requirement was first
  written down.** Never write a requirement for the first time inside a
  spec — if the BRD doesn't say it, either it's a gap to flag or it's out of
  scope. `.ai-context/BRD.md` (or a linked BRD file) is the source spec
  authoring pulls from.
- Intent and Acceptance Criteria come before any technical detail — a spec
  is what's being built and what "correct" means, not an implementation
  plan (that's `plan.md`, generated later, only from an *Approved* spec).

## Naming & identifiers (Section 4)

- **Slug**: kebab-case, 3–5 words, specific, verb-free (names a thing, not
  an action). `2fa-otp-login`, not `login-fix` or `feature-42`. Assigned the
  moment the spec is created. Never reused, even after deprecation — a
  deprecated spec archives, its slug retires with it. Check
  `.ai-context/specs/` for an existing slug collision before finalizing one.
- The slug threads every artefact for the feature together: spec, plan,
  tasks, test_cases, git branch (`feature/<slug>`), PR title
  (`[<slug>] ...`), status board row.
- **Sub-identifiers, scoped under the slug** — assign these as the spec is
  drafted, don't leave them implicit:
  - Acceptance criteria: `<slug>.AC1`, `<slug>.AC2`, …
  - API endpoints: `<slug>.API01`, `<slug>.API02`, …
  - Spec-derived test cases: `<slug>.UT01`, …
  (Tasks get `<slug>.T01` later, at plan/tasks stage — not here.)

## Section-by-section (spec.md)

1. **Spec ID** — the slug, nothing else.
2. **Status** — always starts `Draft` for a new spec. Uses the fixed state
   machine only (see below) — never an invented label.
3. **Linked BRD** — `.ai-context/BRD.md#BRD-NNN`, or the path to the
   specific BRD file and entry if BRDs live in separate files (e.g.
   `.ai-context/BRD_Employee_Transfer.md#BRD-002`). A spec with no traceable
   BRD entry is a gap — say so rather than inventing one.
4. **Intent** — one paragraph: what changes, for whom, under what
   condition. Not a restatement of the BRD's business need paragraph —
   compress it to what this spec specifically commits to building.
5. **Context** — `Builds on: .ai-context/architecture.md (<section>)`,
   `Related:` other specs, and (only if this feature *consumes* an external
   API) a link to that contract.
6. **API Contract** — **only if the feature exposes or consumes an API.**
   Don't force this section where there's nothing to contract (e.g. a pure
   background job). Each endpoint gets its own `<slug>.APINN` block: method
   + path, request payload shape, success response + code, and an
   exceptions table (code, condition, response body). Every distinct error
   path the BRD or the domain implies (auth failure, validation failure,
   not-found, rate-limit) gets its own row — don't collapse them into one
   generic "error" row.
7. **Acceptance Criteria** — always **given/when/then**, individually IDed
   (`<slug>.AC1`). Never an adjective ("secure", "fast", "robust") — a
   reviewer must be able to check each one mechanically. One AC per
   independently-verifiable behavior; a compound "and" sentence usually
   means it should split into two ACs.
8. **Unit Test Cases (spec-derived)** — table: Test ID (`<slug>.UT01`),
   which AC it maps to, scenario, expected result. This is acceptance-level
   only — broader QA sweeps (data variations, negative paths the AC didn't
   spell out) belong in `.ai-context/test_cases/<slug>.test_cases.md`, a
   separate artefact generated later, not here.
9. **Explicitly Out of Scope** — every spec states this where applicable.
   Pull directly from the BRD's own out-of-scope/notes fields first, then
   add anything else the Intent's boundary implies but doesn't state.
10. **Non-Functional Constraints (from constitution.md)** — only the
    constraints from `constitution.md` that actually bind this feature
    (e.g. "passwords hashed with bcrypt, never logged" for an auth feature).
    Link/cite, don't restate the whole constitution.

## Status state machine (Section 6) — the only valid values

```
Draft → In Peer Review (Gate 1) → Changes Requested ⟲ → Approved →
Plan Drafted → Plan Reviewed → Tasks Generated → In Development →
In QA → Ready for Release → Released (vX.Y.Z) → [Deprecated / Superseded]
```

A new spec from this skill always starts at `Draft`. Never invent a status
label outside this list.

## Never invent — mark gaps

Same discipline as `constitution.md`/`architecture.md`: if an Acceptance
Criterion, an API error case, or a non-functional constraint isn't actually
stated in the BRD entry or the project's existing docs, don't fabricate a
plausible-sounding value. Either ask the user directly (specs are drafted
interactively, so this is usually the right move for a missing concrete
detail) or write it as a visible flagged gap the way `constitution.md` and
`architecture.md` do — never silently resolve an "Open at BRD stage" item by
guessing an answer.

## Change management (Section 8) — amending vs. superseding

Whether an edit happens in place or needs a brand-new spec depends entirely
on whether the spec has already Released.

**Case A — still in flight** (`Draft` / `In Peer Review` / `Approved`, not
yet `Released`): edit the same file in place. Bump the version marker in
`## Status` (e.g. `Approved` → `Draft v1.1`) and re-run Gate 1. Same slug,
same file.

**Case B — already Released**: never edit a Released spec's content — it's
the historical record of what shipped in that version; mutating it destroys
the audit trail. Treat the change as a new feature that supersedes the old
one:
1. New BRD entry, referencing the original (`Supersedes BRD-NNN`).
2. New spec, new slug — the old slug's name no longer describes current
   behavior. `Related:` and `Supersedes:` point at the old spec.
3. Old spec's `## Status` flips to `Superseded by <new-slug> (vX.Y.Z)` once
   the new one ships — a one-line change, content otherwise untouched.
4. ADR required if reversing the decision would cost more than a day of
   rework (e.g. an auth-mechanism swap always qualifies).
5. `architecture.md` gets updated to describe the new behavior as current
   state once the new spec ships — not left describing the superseded one.

### Worked example — password login → OTP login (abridged)

Original, Released spec: `email-password-login.spec.md`, `Released (v1.2.0)`.

New BRD entry:
```markdown
### BRD-027: Replace password login with OTP
**Raised by:** Security (password-reuse incidents, Q3 review)
**Business need:** Remove password-based credential risk for user login.
**Decided:** Login becomes email + OTP; password field removed from the
login contract entirely.
**Notes:** Supersedes BRD-009 (original email-password-login).
```

New spec — `.ai-context/specs/email-otp-login.spec.md`:
```markdown
# Spec: Email + OTP Login

## Spec ID
email-otp-login

## Status
Draft

## Linked BRD
.ai-context/BRD.md#BRD-027

## Intent
Replace password-based login with email + OTP verification for all users,
removing the password field from the login flow entirely.

## Context
- Related: .ai-context/specs/email-password-login.spec.md
- Supersedes: email-password-login (Released v1.2.0)
- Builds on: .ai-context/architecture.md (Auth section)

## API Contract
### email-otp-login.API01 — POST /auth/login/request-otp
...
### email-otp-login.API02 — POST /auth/login/verify-otp
...

## Acceptance Criteria
1. email-otp-login.AC1 — Given a registered email, when the user requests
   login, then an OTP is sent and no password field is shown.
...

## Explicitly Out of Scope
- Backup/recovery codes (separate future BRD item)
- Password login is not kept as a fallback — full replacement
```

Old spec, one-line change only:
```markdown
## Status
Superseded by email-otp-login (v1.3.0)
```

## Gate 1 — Spec Peer Review checklist (Section 9)

Not this skill's job to run, but the draft should already pass every item
before it's handed off for review:

Reviewer ≠ author · Intent is one unambiguous paragraph · every AC is
given/when/then, individually IDed · API Contract complete if applicable ·
out-of-scope explicit · Related/Builds-on specs are Approved/Released · no
overlap with an existing spec · Status set correctly (never left ambiguous).

## `status.md` (Section 2, 3)

Every new spec gets a row in `.ai-context/status.md`'s Active Specs table
the same day it's created — `status.md` is "updated same day by whoever
last touched a spec," and a spec that exists but isn't on the board is
exactly the kind of staleness that makes the board untrustworthy. Row
format: `| Spec ID | Title | Status | Owner | Last Updated | Notes |`.
