### Task 1 — State the single-file test command's runnable shape in the adopter conventions templates

**Goal:** When `/autonomous-sdlc-harness:harness-analyze` fills an adopter's conventions documents from these two templates, it should state the single-file test command in a shape an unattended unit can run as one plain foreground command. It should also not quote terminal-only runner output as what a run prints. Both mistakes are what the observed run tripped on (story index `## Context`).

**Where this layer stops.** This task changes only the guidance an adopter's analyze run reads. It adds no rule about what a unit does when a run leaves the foreground. That rule is **Task 2's** (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 6), and this file does not point at it: a template lands in an adopter's own `.claude/context/` and must not cite a plugin path. The two tasks are independent, and either ships without the other.

**Audience.** `cli/templates/` changes what a *future adopter* receives and changes nothing in this checkout (`.claude/context/cli.md` → `## What this layer owns, and what it is not`). This repository's own filled `.claude/context/conventions.md` is a conventions document. No task may target it, and the story index raises it in `## Corpus staleness`.

### Targets

- `cli/templates/claude/context/conventions.md` — the `**What belongs here**` bullet that opens *"Logging, error handling, and the testing bar"*.
- `cli/templates/claude/context/layer.md` — the `**What belongs here**` bullet that opens *What "done" means here*.

**Work:**

- [ ] `conventions.md` template: in the bullet containing *"the one command that runs a single test file on its own"*, append after its last sentence (*"… because it is already allow-listed."*) the two sentences below, verbatim:
  - *"Name it as one command run from the repository root — never `cd <dir> && …`, and never with its output redirected to a file — because a unit runs it unattended, where either shape can be refused and nobody can approve it."*
  - *"Do not quote a terminal run's output as what a run prints: a runner may print a different format when its output is captured rather than shown on a terminal."*
- [ ] `layer.md` template: in the bullet containing *"the one command that runs a single test file of this layer on its own"*, append the same two sentences after *"… because it is already allow-listed."*.
- [ ] Change nothing else in either file. The `**What belongs here**` guidance marker and the closing `<!-- harness:unfilled -->` marker are wires (`cli/src/generators/claudeContext.ts` → `SKELETON_GUIDANCE_MARKER`, `UNFILLED_STUB_MARKER`), so both stay byte-identical.

**Verification:**

- `git grep -n "nobody can approve it" -- cli/templates/claude/context` lists exactly the two target files, and so does `git grep -n "rather than shown on a terminal" -- cli/templates/claude/context`. The invariant is *the set of matching files equals this task's Targets*.
- `git grep -nF '**What belongs here**' -- cli/templates/claude/context/conventions.md cli/templates/claude/context/layer.md` and `git grep -nF '<!-- harness:unfilled -->' -- cli/templates/claude/context/conventions.md cli/templates/claude/context/layer.md` each still list both files.
- `git diff --stat` shows changes only in the two target files.
- Run `commands.typecheck` as configured. This task creates and edits no test file, so it runs no test (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`). The marker assertions in `cli/test/init.test.mjs` and `cli/test/doctor.test.mjs` run in Phase G.
