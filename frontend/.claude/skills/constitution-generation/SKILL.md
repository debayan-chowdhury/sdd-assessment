---
name: constitution-generation
description: >-
  Write or amend a project's `.ai-context/constitution.md` — the
  project-wide, non-negotiable engineering rules (Testing Discipline,
  Security Posture, Architectural Constraints, Non-Functional Baselines,
  Versioning Rules) per INT's Specification-Driven Development (SDD)
  standard, Section 8. This is the "law" every spec and plan is checked
  against at review, so every line must be specific and checkable — never
  vague aspirations like "write secure code". Use when the user asks to
  "write the constitution", "generate constitution.md", "fill in the
  project constitution", "set the project's non-negotiables/baselines",
  or references the placeholder `.ai-context/constitution.md` skeleton
  (e.g. one created by the `ai-workspace-scaffold` skill) and wants it
  populated. Also use for amending an existing constitution.md — that
  goes through the same rigor as a new one, not a silent edit. Do not use
  for per-feature specs, plans, or BRD entries — those are different
  artefacts (see `brd-generation` for BRD.md).
---

# Constitution Generator

## Role

You are a senior architect. Hold every candidate line to the specificity
test the way someone who has to enforce this law at every Gate 1 review
would: a bare adjective like "secure" or "fast" doesn't survive, because it
gives a reviewer nothing to point at. Where the source material doesn't
support a number, tool, or explicit exception, mark the gap openly rather
than settling it with a plausible-sounding guess — an invented SLA or
coverage floor gets trusted as fact and is worse than no rule at all.

Produces one thing: a fully written `.ai-context/constitution.md`, or a
reviewed amendment to an existing one, per INT's SDD standard Section 8.

This is **not** a per-feature artefact — it's written once per project (or
once per major sub-system), and every Gate 1 spec review checks plans
against it line by line. That's why the bar here is higher than for most
docs: every line must be specific enough that a reviewer could point at it
and say "the plan violates this." See `references/field_guide.md` for the
full specificity test, the fixed section order, and a verbatim worked
example — read it before drafting anything.

## Workflow

### 1. Determine new vs. amendment

Look for an existing `.ai-context/constitution.md` (uploaded, referenced, or
visible in the project's filesystem).

- **Doesn't exist, or exists only as the skeleton** (headers with
  `<placeholder>` fields, e.g. straight out of `ai-workspace-scaffold`) —
  this is a first draft. Proceed to Step 2.
- **Already has real, filled-in content** — this is an amendment. Per the
  source guideline, amendments get the same review rigor as a new
  constitution, not a quiet edit. After drafting the change, add (or append
  to) a `## Constitution Change Log` section at the end of the file — one
  dated entry per amendment: what changed, and why. Don't touch this section
  when writing a first draft; it only exists once there's history to log.

### 2. Gather source material

Any of these, and often more than one at once:

- **Existing project docs** — architecture doc, security policy, SLA/NFR
  doc, tech-stack decisions. Read them in full (route through `file-reading`
  if they're uploaded files not already in context) before drafting.
- **Sibling `.ai-context/` files**, if present — `project_context.md` or
  `architecture.md` may already state the stack, datastores, or
  integrations; `.agent/rules/int-standards.<stack>.md` (if the project has
  one) names the actual test framework in use — cross-reference it instead
  of asking again.
- **The user describing it directly in chat.**
- **An interview**, when none of the above gives enough to work with — walk
  the five sections from `references/field_guide.md` one at a time. Use
  `ask_user_input_v0` for the parts that are naturally a short pick list
  (e.g. "what's the primary datastore?", "which auth baseline?"); use plain
  follow-up questions for open-ended specifics (coverage percentages,
  latency numbers, RPO/RTO) since those aren't multiple-choice by nature.
  Don't interview for facts already sitting in project files — check first.

### 3. Draft each of the five sections — in order, grounded only in the source

Testing Discipline → Security Posture → Architectural Constraints →
Non-Functional Baselines → Versioning Rules. For each candidate line, apply
the specificity test from the field guide before it goes in: name a number,
a tool, or an explicit exception — never a bare adjective ("secure," "fast,"
"robust").

### 4. Never invent — mark gaps explicitly

If a section genuinely can't be filled from the source (no stated coverage
floor, no named secret manager, no latency target), don't fabricate a
plausible-sounding number. Write it as a visible, flagged gap instead:

```markdown
## Non-Functional Baselines
- Latency, availability, and RPO/RTO targets: not yet decided — needs
  Tech Lead/Architect sign-off before this section can be considered complete.
```

A constitution with an honest gap is usable and gets fixed at the next
review; one with an invented SLA number is actively worse, because a Gate 1
reviewer will trust it as settled fact.

### 5. Confirm before finalizing

Don't go straight from draft to saved file. Present the draft conversationally
first:
- What you drafted, section by section, and what it's grounded in (which
  doc, or "from your answer to X").
- Any gaps you flagged and couldn't fill.
- For an amendment: what specifically changed from the previous version.

Ask for confirmation or corrections. Repeat this loop — redraft, re-present
— until the user confirms, or explicitly says to proceed with the flagged
gaps left as gaps. Only then move to Step 6.

### 6. Output

- Write the file directly to `.ai-context/constitution.md` at the project
  root (use `create_file` for a first draft, `str_replace` for an amendment
  to the existing file — don't recreate the whole file for a small
  amendment if a targeted edit works). If the project location isn't
  obvious, ask where the project root is rather than guessing.
- Title line is always `# Project Constitution — <Project Name>`. If the
  project name isn't known from context, ask for it rather than leaving the
  title generic.
- After writing, if a file-presentation tool is available, present the file
  so the user can see it; otherwise show the full final content in chat.
- If this ran on top of an `ai-workspace-scaffold` skeleton, note that the
  constitution is now real content and ready to be checked against at
  spec/plan review — no further action needed on this file until the next
  amendment.

## Reference files

| File | Read when |
|---|---|
| `references/field_guide.md` | Always, before drafting — the specificity test, fixed section order, and full verbatim worked example (Insurance Platform) for calibration |
