# Field guide — `.ai-context/tasks/<slug>.tasks.md`

Source: INT SDD Blueprint v1.0, Sections 2, 3, 4, 5, 6, 9.

## What this file is, and isn't

- **Tasks are generated from a plan's Sequencing, and only once a human has
  marked that plan `Plan Reviewed`.** Section 3: "`tasks.md` — Generated
  from the plan's sequencing." Section 5 field guide notes Sequencing is
  "the input `tasks.md` generation will later break into
  independently-verifiable units — not itself a task list." Don't generate
  tasks against a plan a human hasn't reviewed — its Sequencing, Data
  Model, or Constitution Check might still change.
- **One plan, one tasks.md, same slug.** Lives at
  `.ai-context/tasks/<slug>.tasks.md`, same `<slug>` as the spec and plan
  it's derived from — never a new slug at this stage (a new slug only
  happens when a *spec* is superseded, per `spec-generation`'s
  change-management rules).
- **One task = one agent prompt.** Section 3, explicit: "never prompt
  'implement the whole tasks file.'" A task list that reads like three
  giant phases isn't done — it's Sequencing copy-pasted with checkboxes
  added. Keep decomposing until each line is something you'd hand to an
  agent as a single, complete instruction.
- **Link, don't restate.** Reference the plan and spec by path; don't paste
  their content wholesale. Tasks add build-order granularity *on top of*
  what they already say.

## Section-by-section (tasks.md)

1. **Derived From** — `.ai-context/plans/<slug>.plan.md`. Nothing else.
2. **Sequence** — an ordered checklist. Each line:
   `- [ ] <slug>.T01 — <independently verifiable unit of work> —
   Acceptance: <AC ID(s)>`
   - **ID**: `<slug>.T01`, `<slug>.T02`, … — sequential, stable once
     assigned. Never renumber an existing task in a revision (Section 4);
     append new ones or mark one superseded in place if scope genuinely
     changes.
   - **Unit of work**: one sentence, concrete and independently
     verifiable — a reviewer or a fresh agent should be able to tell
     whether it's done without reading the rest of the file.
   - **Acceptance**: the spec's Acceptance Criteria ID(s) this task
     satisfies (`AC1`, or `AC2, AC3` if it covers more than one). Every
     task needs at least one — a task with no AC mapping is not
     independently verifiable against anything and shouldn't exist as
     drafted (either fold it into the task it actually supports, or ask
     whether it belongs in Explicitly Deferred instead).

## Task-sizing and ordering discipline

- **Sizing**: if a task's description needs "and" to describe two
  different pieces of work, it's usually two tasks. If a task can't be
  verified as done without also verifying a *different* task first that
  isn't listed before it, the ordering is wrong, not just the sizing.
- **Ordering**: keep the system deployable after every task, not just
  after every phase of the plan's Sequencing — this is a finer grain than
  the plan operates at. Concretely:
  - Additive schema/field/migration changes land before the code that
    reads or writes them.
  - Auth/validation for an endpoint lands before (or in the same task as)
    the endpoint is wired into a route — never after.
  - A new dependency the plan approved lands before the task that uses it.
  - Backend/API tasks generally precede the frontend tasks that call them,
    unless the plan's Architecture Approach says otherwise.
- **Test-first tasks**: per `constitution.md`'s Testing Discipline (test-
  first mandatory for state-changing operations), a task that implements a
  state-changing endpoint or operation should be understood to include
  writing its test first as part of that same task's Definition of Done —
  don't split "write the test" and "write the implementation" into two
  separate tasks unless the plan or constitution specifically calls for
  strict two-step TDD tracking; the worked example below keeps them
  combined.

## AC-coverage check — never leave one uncovered

Before finalizing, list every Acceptance Criteria ID from the spec and
confirm each has at least one task citing it. This is the tasks.md
equivalent of `plan-generation`'s "a plan silent on a rule is a gap, not a
pass": **a tasks.md silent on an AC is a gap, not a complete
decomposition.** If an AC has no natural task, that's a signal either the
Sequencing missed something or the AC needs a task added — raise it,
don't ship the file with a silent gap.

## Never invent — flag gaps

Same discipline as every other `.ai-context/` artefact: if the plan's
Sequencing doesn't give enough detail to size or order a task (an
unspecified build step, an ambiguous dependency between two Sequencing
items), don't silently invent a plausible-sounding task boundary. Either
ask the user directly, or carry the plan's own `## Open Questions` forward
visibly rather than resolving it with a guess while writing tasks.

## Status transitions this skill drives

Per the fixed state machine (Section 6):
```
... Plan Drafted → Plan Reviewed → Tasks Generated → In Development → ...
```
Writing a new tasks.md moves the *spec's* `## Status` from `Plan Reviewed`
to `Tasks Generated` — update this in the spec file itself, and in
`.ai-context/status.md`'s Active Specs row for that slug (Status column +
Last Updated date). `In Development` is a separate, later transition
(triggered once implementation of the first task actually starts) — this
skill only ever produces `Tasks Generated`, never `In Development` or
beyond.

Inside the tasks.md file itself, individual tasks track their own
progress via checkbox state (Section 6): `Not Started / In Progress /
In Review / Merged`. This skill sets every new task to `Not Started`; it
does not itself advance task-level state — that happens during
implementation.

## Revising an existing tasks.md

`tasks.md` has no `Released`/supersession concept of its own, same as
`plan.md` — that only applies to specs. If
`.ai-context/tasks/<slug>.tasks.md` already exists for this slug (the plan
was revised after tasks were first generated, or a review of the task list
itself asked for re-sequencing), treat it as an in-place revision: edit
the same file, state plainly what changed and why. Preserve the checkbox
state of any task whose scope is unchanged — regenerating the file is not
a reason to reset progress on work already `In Progress` or `Merged`. If a
task's scope changed enough that its prior progress no longer applies,
say so explicitly rather than silently resetting it.

## Worked example — email-password-login (abridged)

From a `Plan Reviewed` plan `email-password-login.plan.md`, Sequencing:
```
1. `users` table password_hash column + bcrypt utility
2. `/auth/login` endpoint with credential check
3. Rate-limit lockout after 5 failed attempts
4. Frontend login screen
```

Resulting tasks.md:

```markdown
# Tasks: Email + Password Login

## Derived From
.ai-context/plans/email-password-login.plan.md

## Sequence
- [ ] email-password-login.T01 — Add `password_hash` column to `users`
  table and a bcrypt hashing utility (cost factor 12) — Acceptance: AC1
- [ ] email-password-login.T02 — Implement `POST /auth/login`: validate
  payload, look up user by email, compare password with
  `bcrypt.compare`, issue access token on match, return 401
  `invalid_credentials` on mismatch — Acceptance: AC1, AC2
- [ ] email-password-login.T03 — Add rate-limit lockout: track
  consecutive failed attempts per email, return 429 `rate_limited` on the
  6th, reset counter on a successful login — Acceptance: AC3
- [ ] email-password-login.T04 — Build the frontend login screen calling
  `/auth/login`, surfacing `invalid_credentials` and `rate_limited`
  responses to the user — Acceptance: AC1, AC2
```

Note each task is independently verifiable, cites its AC(s), and the
sequencing keeps the system deployable at every step (schema before the
endpoint that needs it, the endpoint before the lockout logic that wraps
it, the backend before the frontend that calls it) — a finer grain than
the plan's own Sequencing, not a restatement of it.

## What's out of scope for this skill

- **Plan review** — this skill assumes the plan is already
  `Plan Reviewed`; if it isn't, that's a blocker to raise, not something
  this skill resolves.
- **Implementation of the tasks themselves** — a separate step, one agent
  prompt per task, run only after this file exists. This skill produces
  the ordered list and AC mapping, not the code.
- **Gate 2 code review** — the separate, existing `code-review` skill,
  which runs against a diff after a task (or set of tasks) is implemented,
  not against this file directly.
- **ADRs** — if decomposing the plan surfaces a decision serious enough to
  need one that the plan itself didn't already flag, raise it rather than
  writing one inline — `.ai-context/decisions/ADR-NNNN-<slug>.md` is a
  separate artefact with project-global sequential numbering, and should
  already have been caught at plan stage in the normal case.
