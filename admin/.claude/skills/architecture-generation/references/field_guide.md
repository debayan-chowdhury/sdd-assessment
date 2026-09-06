# Field guide — `.ai-context/architecture.md`

Source: INT SDD Blueprint v1.0, Sections 15, 17, 18.

## What this file is, and isn't

- The **living system design doc** — schemas, integration points, decisions
  in force. Unlike `constitution.md` (law, rarely touched) this one is
  expected to change as the system evolves.
- **"Keep architecture.md current or don't trust it."** A stale doc actively
  misleads the next agent session — worse than no doc, because it's trusted
  by default. When generating or updating this file, say so explicitly if
  something looks likely to go stale soon (e.g. a component still marked
  "planned" that may already be built).
- **Does not duplicate `.agent/rules/int-standards.<stack>.md`.** Per
  Section 18: "stack-specific conventions live in int-standards.<stack>.md
  — this document does not duplicate them." The Coding Rules & Instructions
  section here is a **pointer with a short summary**, not a copy — if the
  int-standards file doesn't exist yet, say so and point at
  `ai-workspace-scaffold`/direct authoring instead of inventing rules here.
- Referenced from specs (`Builds on: .ai-context/architecture.md (<section>)`)
  and from `constitution.md`'s Architectural Constraints — keep section
  headers stable so those references don't silently break.

## Section-by-section

1. **System Overview** — one paragraph, what the system does and its
   shape (monolith / microservices / modular monolith), not a restatement
   of `project_context.md`'s business objective.
2. **Folder Structure** — the chosen organizing pattern (layered /
   feature-based / clean-hexagonal / other), rendered as an actual tree
   scoped to this project — not the generic pattern from the reference file.
   See `references/folder_structure_patterns.md` and Step 3 of SKILL.md.
3. **Coding Rules & Instructions** — a pointer, not a duplicate: which
   `.agent/rules/int-standards.<stack>.md` file governs this codebase, plus
   at most 2–3 headline conventions worth surfacing here for orientation
   (e.g. "async/await only, no raw Promises" for Node). If that file doesn't
   exist yet, say so as a gap rather than inventing rules to fill the
   section.
4. **Components** — table of component, responsibility, tech. Each row
   should be something a Gate 1 reviewer could point a spec's "Builds on" at.
5. **Data Model** — key entities/schemas and who owns them (which component
   is system-of-record for what) — not a full ERD unless the user provides
   one; a summary with a pointer to the real schema source is fine.
6. **Integration Points** — table of system, direction (in/out), protocol,
   notes. This is what specs' "API contract" sections build on top of.
7. **Decisions In Force** — one-line summaries linking to
   `.ai-context/decisions/ADR-NNNN-<slug>.md` files. Don't restate the ADR's
   content here — link and summarize in one line only.
8. **Known Constraints** — things future specs need to design around
   (legacy system that can't change, a vendor contract limiting an
   integration choice, a hard non-negotiable already in `constitution.md`
   worth cross-referencing here for visibility).

## Never invent — mark gaps

Same discipline as `constitution.md` and `BRD.md`: if a section can't be
grounded in what the user or an existing doc actually said, write it as a
visible gap:

```markdown
## Data Model
Not yet defined — schema design happens at the first feature's plan stage;
this section will be filled in once at least one plan.md exists.
```

An architecture.md with honest gaps is more useful than one padded with
plausible-sounding invented schemas or integrations no one confirmed.
