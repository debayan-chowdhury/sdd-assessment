---
name: ai-workspace-scaffold
description: >-
  Scaffold a project's AI agent workspace — .agent/ (control plane: coding
  rules, ignore file, workflow prompts) and .ai-context/ (knowledge base:
  constitution, project context, architecture, BRD, status, per-feature
  spec/plan/tasks/test-case/ADR templates) — per INT's Specification-Driven
  Development (SDD) standard. Use when the user asks to set up, scaffold,
  initialize, or bootstrap an "AI workspace", "agent workspace", ".agent
  folder", ".ai-context folder", "AI-first project structure", or SDD
  folder structure — including "set up my project for AI coding agents" or
  "add the INT AI folders to this repo". Always asks for the tech stack
  before generating .agent/ content, since it must contain real,
  stack-specific rules. .ai-context/ files are always skeleton templates
  only, filled in later by the user or other skills (constitution-generation,
  architecture-generation, brd-generation, business-understanding).
---

# AI Workspace Scaffold

## Role

You are a senior tech lead setting up this project's engineering standards
for AI coding agents. Treat `.agent/` content the way someone who will hold
the team to these rules would: every stack-specific file must reflect that
ecosystem's actual tooling — its real test framework, its real package
manager/lockfile names — never a generic placeholder dressed up as specific.
Don't guess at a stack to save a question, and don't pre-fill `.ai-context/`
content to be helpful — that's a boundary this skill holds deliberately, not
an oversight to patch over.

Creates the two folders that make a repository's coding-agent context
file-based and portable across models, per INT's AI-First / SDD standard:

- **`.agent/`** — the control plane. *How* the agent behaves. Every file here
  gets real, filled-in content, generated fresh for the project's actual tech
  stack.
- **`.ai-context/`** — the knowledge base. *What* the agent needs to know
  about this specific project. Every file here is created as an **empty
  skeleton only** — headers and placeholder angle-bracket fields — because the
  project-specific content (BRD entries, architecture, etc.) gets written
  later, often by the user directly or by other skills.

```
project-root/
├── .agent/
│   ├── rules/
│   │   ├── int-standards.<stack>.md   # generated content
│   │   ├── .agentignore                # generated content
│   │   └── auto-log.md                 # static, same every time
│   └── workflows/
│       ├── code-review.md              # generated content
│       ├── generate-tests.md           # generated content
│       └── generate-plan.md            # generated content
├── .ai-context/
│   ├── constitution.md                 # skeleton
│   ├── project_context.md              # skeleton
│   ├── architecture.md                 # skeleton
│   ├── BRD.md                          # skeleton
│   ├── status.md                       # skeleton
│   ├── prompt_history.md               # empty log
│   ├── prompts.md                      # empty scratch space
│   ├── specs/_TEMPLATE.spec.md         # skeleton (+ hotfix variant)
│   ├── plans/_TEMPLATE.plan.md         # skeleton
│   ├── tasks/_TEMPLATE.tasks.md        # skeleton
│   ├── test_cases/_TEMPLATE.test_cases.md
│   ├── test_cases/_integration.md      # skeleton
│   └── decisions/_TEMPLATE_ADR.md      # skeleton
```

## Workflow

### 1. Ask for the tech stack (always, before touching the filesystem)

`.agent/` content must be genuinely correct for the project's stack — there's
no meaningful stack-agnostic default. If the user's message didn't already
name one, ask. If `ask_user_input_v0` is available, use it (single_select,
2–4 short options plus room to type another); otherwise ask in chat.

Also confirm the target project root if it isn't obvious from context (e.g.
the user already has files open, or named a directory) — default to the
current working directory if there's an existing project there, or ask where
to create it if this is a fresh scaffold.

Don't proceed to file generation until you have a concrete stack (e.g.
"Node.js", "Python/FastAPI", "Java/Spring", ".NET", "React", "Flutter") — a
vague answer like "backend" isn't enough to write real rules.

### 2. Run the scaffold script

This creates the directory tree and copies every static/skeleton file in one
shot:

```bash
bash scripts/scaffold.sh <target-project-root>
```

It creates `.agent/rules/`, `.agent/workflows/`, all of `.ai-context/`
(including `specs/`, `plans/`, `tasks/`, `test_cases/`, `decisions/`), copies
the static `auto-log.md`, and copies every `.ai-context/` skeleton template
verbatim. It prints exactly which `.agent/` files are still needed — those
are generated in the next step, not by this script.

### 3. Generate the `.agent/` content for the named stack

Read `references/agent_content_guide.md` — it defines the fixed structure for
each file and what must be genuinely stack-specific vs. always-included. For
calibration on the level of specificity expected, `references/node_example.md`
has a fully worked Node.js example (don't copy it for a different stack —
regenerate every rule for the actual stack named).

Write these five files directly with `create_file`, using a lowercase
hyphenated stack slug in the standards filename (e.g. `python`, `dotnet`,
`react`):

- `.agent/rules/int-standards.<stack-slug>.md`
- `.agent/rules/.agentignore`
- `.agent/workflows/code-review.md`
- `.agent/workflows/generate-tests.md`
- `.agent/workflows/generate-plan.md`

### 4. Confirm and hand off

List what was created, and be explicit about the split: `.agent/` is ready to
use as-is; `.ai-context/` files are skeletons — the user (or a follow-up
skill, e.g. `constitution-generation` for `constitution.md`,
`architecture-generation` for `architecture.md`, `brd-generation` for
`BRD.md`, `business-understanding` for `project_context.md`) fills in the
actual project content next. Don't pre-fill `.ai-context/` content yourself
even if you know enough about the project to guess at it — that's explicitly
out of scope for this skill.

## Notes

- If `.agent/` or `.ai-context/` already exist at the target, don't overwrite
  silently — list what's already there and ask whether to fill gaps only or
  replace.
- If the user names a stack with no worked example in the reference guide,
  that's fine — apply the same five fixed categories using general best
  practice for that ecosystem's real tooling (its actual test framework, its
  actual package manager/lockfile names for `.agentignore`, etc.), not a
  generic placeholder.
- The `specs/`, `plans/`, `tasks/`, `test_cases/` directories intentionally
  contain only a `_TEMPLATE.*` file each, not a real per-feature file — the
  first real feature file (e.g. `checkout-flow.spec.md`) gets created when
  that feature's spec work actually starts, not during scaffolding.
