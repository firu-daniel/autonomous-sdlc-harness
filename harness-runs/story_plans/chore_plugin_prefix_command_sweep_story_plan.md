# Story: Spell every plugin command with its plugin prefix, decide the watcher's route from a measurement, and gate the spelling

## Context

This branch pays the debt `docs/development.md` → `## 6. The roadmap this tree defers to` records in its paragraph opening *A third debt belongs to no row at all*. Once the plugin is installed, every command it ships resolves as `/autonomous-sdlc-harness:<name>`, while this tree mostly prints the bare `/<name>`. The branch renames nothing and changes what no command does. It respells command names across the tree in one pass, measures the one path no person stands in front of, records what it measured, and adds a gate so the two spellings cannot drift apart again.

**Settled while planning, so no task has to settle it again.**

- **The spelling rule, one line: every slash spelling of a command this plugin ships is `/autonomous-sdlc-harness:<name>`, wherever it sits in this tree, except in the carve-outs below.** The rule is recorded once, in `docs/development.md` → `## 5. Verifying a change` → gate 6, by Task 11, and every other task applies it.
- **Model-read sites are decided by that same rule, and this is the reasoning.** An agent never invokes a plugin command by typing a slash spelling. It invokes a command through the `Skill` tool, by the qualified skill name **without** a slash: `autonomous-sdlc-harness:<name>`. `cli/templates/claude/harness-task-offer.md` already spells it `{{pluginName}}:branch-prompt` and says *"the bare name is not valid"*. So every slash spelling an agent reads under `plugin/` is one of two things. It is a **referent** that names which command is meant (*"the calling command (`/branch-start-user-review-fix-autonomous`)"*), and the qualified form names it just as well. Or it is **text the agent relays to a person**: a STOP message, a `<reentry_command>` or `<next_step_note>` binding value, a *"tell the user to run …"* line. That text is human-facing by the time it is read. So no model-read class keeps the bare spelling. The skill-name form without a slash is a different spelling and is already correct. No task edits it.
- **Some strings look like command spellings and are not.** Path citations such as `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-plan.md`, `plugin/commands/harness-analyze.md` and `agents/branch-reviewer.md` name files. The `branch-*` family name written without a slash is a noun. Command file names and frontmatter under `plugin/commands/` do not change: the prefix comes from the plugin manifest, not from the file.
- **Carve-outs, kept bare on purpose.**
  - (1) `docs/development.md` §5 gate 8's fenced `/harness-analyze --dry-run` and `/harness-analyze` block. Its preamble puts those lines in a session with the plugin installed.
  - (2) Everything under `examples/notes-app/` that `init`, the analyze command or the captured run wrote: `examples/notes-app/.claude/` and `examples/notes-app/sdlc-harness/`. That material is a frozen capture. `examples/notes-app/README.md` is not part of the capture, so it is swept.
  - (3) `harness-runs/`, which holds records of past runs.
  - (4) This repository's own `.claude/` tree. It is `init`'s and `/harness-analyze`'s output for this checkout, and a run cannot edit it: the tool layer refuses edits to `.claude/**`. It is raised as corpus staleness and never scheduled.
  - (5) A bare spelling quoted as **the measured subject** of a recorded measurement or capture, which is the only way to state what was measured. This covers the closed §6 paragraph, the watcher measurement comment, `init.ts`'s headless-leg paragraph, and the `docs/outer-loop-verification.md` → `### 2.2 The launch prompt` capture table, which records what a past verification run dispatched.
  - (6) The three watcher first-message strings, **if and only if** Task 1's measurement keeps them bare.
- **Source comments and test comments are swept too.** A person reads them. The debt paragraph also counted comment-only `cli/src` files as owed, and a comment left bare would be the "two spellings in one corpus" that paragraph warns against.
- **Measurements are recorded where the tasks that take them already own a file.** `harness-runs/scratch/` lives for one dispatch and nothing reads it afterwards (`harness-runs/scratch/README.md`), so a result never crosses tasks through it. Task 1 runs the watcher first-message probe through `bash scripts/scratch-run.sh`. It records the result in a comment block opening `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.` directly above `ENGINE_COMMAND_TASK=` in `cli/templates/scripts/autonomous-watcher.sh`. Task 2 runs the headless `claude -p` leg and records it in the doc comment on `ANALYZE_COMMAND` in `cli/src/commands/init.ts`, in a paragraph opening `Headless first-message leg, re-measured:`. Task 11 copies both records into `docs/development.md` §6, which is where a measured fact of record lives. Task 13 records the planted-failure output of the new check in that script's own header `REPRO` block.
- **One measurement cannot be taken by this run: pasting a command that carries an argument into an interactive session and submitting it.** Examples are `/harness-analyze presentation` and `/autonomous-sdlc-harness:harness-analyze presentation`. An unattended run cannot drive an interactive session, so the branch does not guess the result. Task 11 records it in §6 as an open measurement. This run's Done summary must also name it as not measured.
- **Acceptance 4's last clause needs an unattended run launched after this branch lands.** The clause says a real unattended run launched after the change reaches its first phase. This run can only take the closest in-branch observation: Task 1's probe sends the exact task-engine `launch_prompt` sentence and checks whether the engine command loads. Task 11 records the post-merge launch as the one confirmation still owed, and names what it looks for.
- **The drift check.**
  - It is `scripts/check-command-spelling.sh`, run by `scripts/run-gates.sh` as gate `6d` (Task 13). Its contract is written first, by Task 11, in `docs/development.md` §5 gate 6. That follows the cross-layer rule "contract before consumer".
  - It fails on a bare `/branch-…`, `/branch-*` or `/harness-analyze` spelling that is not preceded by a path character. The regex is `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`. A period may end a match only when a non-name character or the end of the line follows it, so a sentence-final `Then run /branch-status.` is caught and a `.md` path is not.
  - It scans every tracked and untracked-unignored file outside carve-outs (2)–(4) and outside itself.
  - Carve-outs (1), (5) and (6) are exempted by a table of `<path>|<kind>|<text>` entries held in the script, where `<kind>` is `line` (whole-line match) or `contains` (exact substring). Each entry must cover exactly one line of its file. An entry that covers no line is reported as `stale exemption`, and one that covers more than one line is reported as `ambiguous exemption`, so no entry can excuse a line added later. The gate-8 lines use `line` entries.
- **Tests that pin a bare spelling are updated in the same task as the code they quote.** `cli/test/init.test.mjs` pins `ANALYZE_COMMAND = '/harness-analyze'`, the `flat` fallback warning (`assert.match(stderr, /\/harness-analyze/)`) and `ANALYZE_FIRST_REMEDY`. `cli/test/doctor.test.mjs` pins its own `ANALYZE_COMMAND` and the layer-gap remedy. `cli/test/stack-presets.test.mjs` pins ``"`/harness-analyze`'s to propose"``. No test pins `ENGINE_COMMAND_*` or the watcher's `launch_prompt`. The qualified string does not contain the substring `/harness-analyze`, so every one of those assertions fails until it is respelled. That is why each producer and its test share a task.
- **Anchors other files cite keep their text.** Task 11 rewrites the debt paragraph so that it still opens with the words *A third debt belongs to no row at all*. `README.md` and `ARCHITECTURE.md` cite it by that phrase. `README.md`'s heading `### Measured while building that evidence, and not fixed here` also keeps its text.

**Order.** Every task is single-layer, in the configured order: `cli`, then `plugin`, then `general`.
- **`cli`, Tasks 1–5.** Task 1 comes first because its decision feeds Tasks 9, 11, 12 and 13. Tasks 2–4 each pair a producing module with the suite that pins its output. Task 5 sweeps the comment-only modules and the `.claude/` templates. It depends on Task 2, which supplies the `pluginName` render value for `CLAUDE.md`.
- **`plugin`, Tasks 6–8.** Commands, then instructions, then agents, READMEs, flow documents and samples.
- **`general`, Tasks 9–13, last.** Task 9 mirrors the watcher into `scripts/` and sweeps the watcher docs. Task 10 sweeps the reference docs, the schemas and the example README. Task 11 does `docs/development.md`: the rule, the gate-6d contract and the closed debt paragraph. Task 12 does `README.md`, `llms.txt`, `ARCHITECTURE.md` and `ROADMAP.md`, whose measurement text must say what Task 11's paragraph says. Task 13 adds the gate itself. It runs last so it can pass on the fully swept tree.

**Top risks:**
- **A spelling fix breaks an assertion or a quoted wire.** The qualified form no longer contains `/harness-analyze`, so every `includes`/`match` on the bare string turns red. Tasks 2–4 pair each module with its suite and run `bash scripts/test.sh`. Tasks 6–8 grep the citers of any heading whose text they change.
- **The watcher route is decided on a guess.** Task 1 records the Claude Code version, the exact command and the verbatim evidence before it touches a string. Its decision table keeps the proven bare spelling whenever the prefixed spelling is not shown to resolve.
- **The drift gate is too narrow or too broad.** Too narrow, it misses a site. Too broad, it flags path citations or needs an exemption for every quote. Task 13 plants a bare `/harness-analyze` in `docs/cli.md`, and again in `docs/development.md` outside the gate-8 block, to prove the gate fails even in the exemption table's home file. It reverts both plants, and returns a blocker for any finding that is a sweep miss rather than exempting it.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each entry to `[x]` as that task's commit lands. **Only the committing role flips a marker.** In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. An implementer never changes a marker here and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry maps 1:1 to `harness-runs/task_plans/chore_plugin_prefix_command_sweep/task_<K>_plan.md`. Entries run bottom-up in ship order, with the catch-all layer last.

1. [x] **Task 1** — Measure the watcher's first-message spelling and set `ENGINE_COMMAND_*` in the watcher template from the result _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Qualify the analyze command in `init`, the stub footers and the `flat` fallback warning, re-measure the headless leg, and update `init.test.mjs` _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Qualify the analyze command in `detect/presets.ts` and update `stack-presets.test.mjs` _(layer: cli)_ _(points: 10)_
4. [x] **Task 4** — Qualify the analyze command in `doctor`'s checks and update `doctor.test.mjs` _(layer: cli)_ _(points: 15)_
5. [x] **Task 5** — Qualify the command spellings in the comment-only `cli/src` modules and the `cli/templates/claude/` templates _(layer: cli)_ _(points: 10)_
6. [x] **Task 6** — Qualify every command spelling under `plugin/commands/`, `**Usage:**` lines included _(layer: plugin)_ _(points: 15)_
7. [x] **Task 7** — Qualify every command spelling under `plugin/instructions/`, fork binding values included _(layer: plugin)_ _(points: 15)_
8. [x] **Task 8** — Qualify the command spellings in the plugin's agents, READMEs, flow whiteboard and samples _(layer: plugin)_ _(points: 10)_
9. [x] **Task 9** — Mirror the watcher template into `scripts/` and sweep `docs/watcher.md` and `docs/outer-loop-verification.md` _(layer: general)_ _(points: 10)_
10. [x] **Task 10** — Sweep `docs/analyze.md`, `docs/cli.md`, `docs/config.md`, `schemas/` and `examples/notes-app/README.md` _(layer: general)_ _(points: 15)_
11. [x] **Task 11** — Record the spelling rule and the gate-6d contract, sweep `docs/development.md`, and close the debt paragraph _(layer: general)_ _(points: 20)_
12. [ ] **Task 12** — Sweep `README.md`, `llms.txt`, `ARCHITECTURE.md` and `ROADMAP.md`, and align their measurement text with §6 _(layer: general)_ _(points: 15)_
13. [ ] **Task 13** — Add `scripts/check-command-spelling.sh` as gate 6d, sweep `run-gates.sh`, and prove the gate fails on a planted bare spelling _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"This covers every place a person reads a command name and types or pastes it into a session."* The prompt also says *"Model-read sites get a decision, not an automatic swap"* and *"The plan lists each file with its class: human-facing, model-read, watcher string or carve-out."*

**Derivation entry 1 — corpus files, broad (command).** Re-run verbatim from the checkout root. This is the task prompt's own command:
`grep -rlE '/(branch-[a-z-]+|harness-analyze)' . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=harness-runs`

**Derivation entry 2 — command-spelling sites, excluding path citations (command).** Re-run verbatim from the checkout root. It adds the `/branch-*` glob, which entry 1 cannot match, and drops the files whose only hit is a path citation:
`grep -rlE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=harness-runs`

**Derivation entry 3 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** the lessons ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it constrains how a command name is written, or a file this branch edits.

**Closure invariant:** every site any of the three entries reaches appears as a row below. Every entry-2 file is also an entry-1 file. The entry-1 files that entry 2 does not reach are the rows whose evidence reads "entry 1 only".

**Class** in the Evidence column: **H** human-facing, **M** model-read (decided by the rule above), **W** watcher string, **C** carve-out, **P** path citation only (not a spelling).

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude/CLAUDE.md` | adopted copy | entries 1+2; C (4) | `no-change` | This checkout's own `.claude/` tree. The tool layer refuses edits to `.claude/**`. Raised in `## Corpus staleness` |
| 2 | `.claude/context/cli.md` | — | entries 1+2; C (4) | `no-change` | A conventions document is never a task target. Raised in `## Corpus staleness` |
| 3 | `.claude/context/conventions.md` | — | entries 1+2; C (4) | `no-change` | A conventions document is never a task target. Raised in `## Corpus staleness` |
| 4 | `.claude/context/plugin.md` | — | entries 1+2; C (4) | `no-change` | A conventions document is never a task target. Raised in `## Corpus staleness` |
| 5 | `ARCHITECTURE.md` | — | entry 1 only; P, plus two citations of the debt paragraph's measurement | `change` | Task 12. It has no spelling to respell, but its two citations of the §6 measurement state the sweep is deferred, which Task 11 falsifies |
| 6 | `README.md` | — | entries 1+2; H | `change` | Task 12 |
| 7 | `ROADMAP.md` | — | entries 1+2; H | `change` | Task 12 |
| 8 | `cli/src/commands/init.ts` | — | entries 1+2; H (output strings, comments) | `change` | Task 2 |
| 9 | `cli/src/config/model.ts` | — | entries 1+2; H (comments) | `change` | Task 5 |
| 10 | `cli/src/core/writer.ts` | — | entries 1+2; H (comments) | `change` | Task 5 |
| 11 | `cli/src/detect/presets.ts` | — | entries 1+2; H (warning strings, comments) | `change` | Task 3 |
| 12 | `cli/src/detect/signals.ts` | — | entries 1+2; H (the `flat` fallback warning, comments) | `change` | Task 2, because `init.test.mjs` pins its warning |
| 13 | `cli/src/doctor/checks.ts` | — | entries 1+2; H (report strings) | `change` | Task 4 |
| 14 | `cli/src/generators/claudeContext.ts` | — | entries 1+2; H (stub footers, setup banner) | `change` | Task 2, which also adds the `pluginName: PLUGIN_NAME` render value that Task 5's template consumes |
| 15 | `cli/src/generators/harnessConfig.ts` | — | entries 1+2; H (comment) | `change` | Task 5 |
| 16 | `cli/templates/claude/CLAUDE.md` | template | entries 1+2; H | `change` | Task 5, spelled `/{{pluginName}}:…` so `PLUGIN_NAME` stays the single owner of the name |
| 17 | `cli/templates/claude/README.md` | — | entries 1+2; H | `change` | Task 5 |
| 18 | `cli/templates/scripts/autonomous-watcher.sh` | template | entries 1+2; W (`ENGINE_COMMAND_*`, header mapping comment) | `change` | Task 1. Values follow the measured route, and the measurement comment is added either way |
| 19 | `cli/test/doctor.test.mjs` | — | entries 1+2; H (pinned strings, comments) | `change` | Task 4 |
| 20 | `cli/test/init.test.mjs` | — | entries 1+2; H (pinned strings, comments) | `change` | Task 2. Task 5, which depends on Task 2, appends one case pinning the generated `.claude/CLAUDE.md` spelling |
| 21 | `cli/test/stack-presets.test.mjs` | — | entries 1+2; H (pinned strings, comment) | `change` | Task 3 |
| 22 | `docs/analyze.md` | — | entries 1+2; H | `change` | Task 10 |
| 23 | `docs/cli.md` | — | entries 1+2; H | `change` | Task 10 |
| 24 | `docs/config.md` | — | entries 1+2; H | `change` | Task 10 |
| 25 | `docs/development.md` | — | entries 1+2; H, plus C (1) gate-8 block and C (5) measured quotes | `change` | Task 11 |
| 26 | `docs/outer-loop-verification.md` | — | entries 1+2; W quoted inside a C (5) capture table | `change` | Task 9. The `### 2.2` capture cells keep their captured spelling. If the route is `prefixed`, a note under the table points to §6 |
| 27 | `docs/watcher.md` | — | entries 1+2; H, plus W (engine-command table cells) | `change` | Task 9 |
| 28 | `evals/plan-shape/scaffold.sh` | — | entry 1 only; P (`plugin/commands/branch-start-plan-semi-autonomous.md`) | `no-change` | Path citation, not a spelling |
| 29 | `examples/notes-app/.claude/CLAUDE.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 30 | `examples/notes-app/.claude/context/conventions.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 31 | `examples/notes-app/.claude/context/data-layer.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 32 | `examples/notes-app/.claude/context/domain.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 33 | `examples/notes-app/.claude/context/presentation.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 34 | `examples/notes-app/.claude/context/tests.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 35 | `examples/notes-app/README.md` | — | entries 1+2; H | `change` | Task 10 |
| 36 | `examples/notes-app/sdlc-harness/improvement_observations/feat_note_updated_at.md` | capture | entries 1+2; C (2) | `no-change` | Frozen capture |
| 37 | `llms.txt` | — | entries 1+2; H | `change` | Task 12 |
| 38 | `plugin/README.md` | — | entries 1+2; H | `change` | Task 8 |
| 39 | `plugin/agents/README.txt` | — | entries 1+2; H | `change` | Task 8 |
| 40 | `plugin/agents/architecture-reviewer.md` | — | entry 1 only; P (`agents/branch-reviewer.md`) | `no-change` | Path citation, not a spelling |
| 41 | `plugin/agents/business-parity-reviewer.md` | — | entry 1 only; P | `no-change` | Path citation, not a spelling |
| 42 | `plugin/agents/committer.md` | — | entries 1+2; M (referent) | `change` | Task 8 |
| 43 | `plugin/agents/conventions-reviewer.md` | — | entries 1+2; M (`description:` referent) | `change` | Task 8 |
| 44 | `plugin/agents/conventions-writer.md` | — | entries 1+2; M (`description:` referent) | `change` | Task 8 |
| 45 | `plugin/agents/review-plan-reviewer.md` | — | entry 1 only; P | `no-change` | Path citation, not a spelling |
| 46 | `plugin/agents/skeptic-reviewer.md` | — | entry 1 only; P | `no-change` | Path citation, not a spelling |
| 47 | `plugin/agents/task-plan-writer.md` | — | entries 1+2; M (text relayed in `## Corpus staleness`) | `change` | Task 8 |
| 48 | `plugin/agents/user-review-fix-plan-writer.md` | — | entry 1 only; P | `no-change` | Path citation, not a spelling |
| 49 | `plugin/commands/README.txt` | — | entries 1+2; H | `change` | Task 6 |
| 50 | `plugin/commands/branch-answer.md` | — | entries 1+2; H (`**Usage:**`) | `change` | Task 6 |
| 51 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | entries 1+2; M/H | `change` | Task 6 |
| 52 | `plugin/commands/branch-implement-plan.md` | — | entries 1+2; M/H | `change` | Task 6 |
| 53 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` | — | entries 1+2; H (STOP message) | `change` | Task 6 |
| 54 | `plugin/commands/branch-implement-user-review.md` | — | entries 1+2; M/H (`## Context:` heading) | `change` | Task 6 |
| 55 | `plugin/commands/branch-pause.md` | — | entries 1+2; H (`**Usage:**`) | `change` | Task 6 |
| 56 | `plugin/commands/branch-prompt.md` | — | entries 1+2; H (`**Usage:**`) | `change` | Task 6 |
| 57 | `plugin/commands/branch-qa-test.md` | — | entries 1+2; M/H (`## Context:` heading) | `change` | Task 6 |
| 58 | `plugin/commands/branch-resume.md` | — | entries 1+2; H (`**Usage:**`) | `change` | Task 6 |
| 59 | `plugin/commands/branch-start-docs-autonomous.md` | — | entries 1+2; H | `change` | Task 6 |
| 60 | `plugin/commands/branch-start-plan-autonomous.md` | — | entries 1+2; H | `change` | Task 6 |
| 61 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | entries 1+2; M/H | `change` | Task 6 |
| 62 | `plugin/commands/branch-start-plan.md` | — | entries 1+2; M/H | `change` | Task 6 |
| 63 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | entries 1+2; H | `change` | Task 6 |
| 64 | `plugin/commands/branch-status.md` | — | entries 1+2; H (`**Usage:**`) | `change` | Task 6 |
| 65 | `plugin/commands/branch-user-review.md` | — | entries 1+2; H (`**Usage:**`) | `change` | Task 6 |
| 66 | `plugin/commands/harness-analyze.md` | — | entries 1+2; H (`**Usage:**`, report remedies) | `change` | Task 6 |
| 67 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | entry 1 only; P | `no-change` | Path citations only |
| 68 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` | — | entries 1+2; H | `change` | Task 8 |
| 69 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | entries 1+2; M/H | `change` | Task 7 |
| 70 | `plugin/instructions/code_review_instructions.md` | — | entries 1+2; H | `change` | Task 7 |
| 71 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | entries 1+2; M | `change` | Task 7 |
| 72 | `plugin/instructions/improvement_observations_instructions.md` | — | entries 1+2; M | `change` | Task 7 |
| 73 | `plugin/instructions/mode_contract.md` | — | entries 1+2; M | `change` | Task 7 |
| 74 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | entries 1+2; M/H (binding values) | `change` | Task 7 |
| 75 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` | — | entries 1+2; M/H (binding values) | `change` | Task 7 |
| 76 | `plugin/instructions/qa_test_instructions.md` | — | entries 1+2; H | `change` | Task 7 |
| 77 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | entries 1+2; M/H (binding values) | `change` | Task 7 |
| 78 | `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` | — | entries 1+2; M/H (binding values) | `change` | Task 7 |
| 79 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` | — | entries 1+2; H | `change` | Task 7 |
| 80 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | entries 1+2; M | `change` | Task 7 |
| 81 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | entries 1+2; M/H (binding values) | `change` | Task 7 |
| 82 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` | — | entries 1+2; M/H (binding values) | `change` | Task 7 |
| 83 | `plugin/samples/sample_task_plan.md` | — | entries 1+2; M | `change` | Task 8 |
| 84 | `plugin/samples/sample_user_review.md` | — | entries 1+2; M | `change` | Task 8 |
| 85 | `schemas/harness.config.schema.json` | — | entries 1+2; H (`description` text) | `change` | Task 10 |
| 86 | `schemas/negative/README.md` | — | entries 1+2; H | `change` | Task 10 |
| 87 | `scripts/autonomous-watcher.sh` | adopted copy | entries 1+2; W | `change` | Task 9. Byte-for-byte mirror of row 18 |
| 88 | `scripts/run-gates.sh` | — | entries 1+2; H (gate-8 echo line) | `change` | Task 13 |
| 89 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line; never inline it, join two with prose, or cut its block when compacting a document."* | — | entry 3; constrains how a command is written in `README.md` | `no-change` | The rule stands and binds Task 12. `README.md`'s inline `/harness-analyze <target>` moves into a fenced block there |
| 90 | `plugin/instructions/dispatch_discipline_instructions.md` | — | entry 1 only; P-like: `plan/branch-review` is a compound noun in prose, not a command spelling | `no-change` | Not a spelling. Found when entry 1 was re-run in revision round 1 |
