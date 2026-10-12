# Story: Thin the unit-loop family's agent prose

## Context

This branch is the **unit loop** family session of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, the `**Unit loop:**` bullet): it thins `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` and `plugin/agents/committer.md`. The base session (`chore_thin_shared_agent_prose`, merged as `8c519ab6`) already thinned every block those three share with agents of other families, and recorded the writing standard in `.claude/context/plugin.md` → `## Writing agent prose`: a rule is a direct instruction; each rule is stated once; rationale the agent does not act on is dropped and every edge case is kept; a wire literal or a cited anchor is never paraphrased; a change to an agent definition never raises its up-front word count. Every task here applies that standard as written. The inputs are the three research reports' `## Prose classification` and `## Thinning plan` sections (`docs/work-report-research/layer-implementer.md`, `layer-reviewer.md`, `committer.md`), read as guidance on what is redundant, not as edits to copy.

**What is not carried over from the research.** The README's `## User verdict` dropped work reports, so nothing of them lands: no template, no `## Work report` section, and none of the edits the reports proposed outside these three files to make room for one. The reports' **relocations** — moving `layer-implementer`'s catch-all and row-`G.4`/disposition prose, and `layer-reviewer`'s catch-all checks, into new on-demand instruction files — are also declined, and every task thins in place: an `init`-default adopter has a single `general` layer at `"."`, so every dispatch there is a catch-all and an on-demand file adds a read instead of saving one; the disposition and row-`G.4` tests decide whether a unit is closed, and a file the agent must choose to open is the under-reading risk the README's `## Verdict (research)` names; and a new file is new citation surface for no saving on the dispatches that need it. Row-`G.4` detection likewise stays the match against `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## Substitution table`, not a path-shape test that would make the agent a second owner of a `## Setup` path.

**Three things every task keeps byte-for-byte.** (1) Each wire literal and cited anchor its own file lists — return lines, blocker forms, record headings, bold leads another file cites, fixed commit subjects, headings cited by `→`. (2) Every sentence these files share with an agent **outside** this family — the base session's identical copies (`<state_dir>`, `<repo_root>`, parity and `<convention_symbols>` rows, the reviewers' grading ladder, `**Guard carve-out.**`, `**Prose volume — the receiving side.**`, `## Unsolicited dispatch guidance`, the bold leads `**You create `<findings_folder>` yourself, and only when you have findings to write.**` `**Cross-check business logic against `<reference_impl>`**` and `**You report findings. You do not implement fixes.**`, and the rest the `## Scope register` lists under entry D3): thinning one copy alone makes the copies drift. (3) Each frontmatter block. Blocks shared only **inside** this family — `layer-implementer` and `layer-reviewer` carry about a dozen — are thinned once, identically in both files, by Task 1.

**How the tasks divide the files.** Each per-task file names the sections it owns by heading and opening words; no two tasks own the same text, and a task edits nothing outside its sections. Tasks on one file ship in a chain only to fix the order. `### Which caller sends which mode` in `committer.md` is restated from its owners (`unit_loop_core.md` → `## Substitution table` and the phases of `plan_orchestration_instructions_core.md`) and becomes a pointer; `committer.md`'s `### ui_test_pass procedure` keeps its heading and its own steps, and cites the standard steps for the parts it shares with them instead of stating them a second time.

**Measurement.** Up-front words are an agent's definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents — the base session's measure. `layer-implementer` reads `unit_loop_core.md` → `## The test-run rule` and `## Substitution table`; `layer-reviewer` reads `## The test-run rule`; `committer` reads none. This branch edits no file under `plugin/instructions/` or `plugin/samples/`, so each agent's up-front change equals its definition's change. The definitions measured `wc -w` 6246 (`layer-implementer`), 3819 (`layer-reviewer`) and 8410 (`committer`) at `fa8867c9`; Task 13 fills the `After` column of `## Up-front word counts`, and every task checks its own file's figure falls.

The verification bar for the branch as a whole — `cli/test` and `scripts/run-gates.sh` passing, the plugin manifest under `--strict` included — is the Run gates phase's, not any unit's; no task runs either.

**Top risks:** the likeliest failure is a thinned paragraph that drops an edge case or paraphrases a literal another file parses — a blocker form, `record disposition of `, `staged: index-only — `, a fixed subject, `### Standard procedure (`task` / `review_plan_file` / `review_item`)`; every task carries the inventory of what it must keep and greps for each literal before it saves, and Tasks 5, 10 and 12 own the densest wire. The second is a cross-family copy edited by accident, which silently forks a rule the base session made identical; every task's verification re-lists, with `git grep -l -F`, the files carrying each such sentence and compares the set with `fa8867c9`, and Task 13 sweeps all of them once more. The third is the committer losing a refusal path when its procedures are deduplicated — the clean-tree guard, the already-`[x]` path, `noop:`, the three named `error:` returns; Tasks 11 and 12 each verify every path still has its rule, and keep the `steps 1–6` range spelling `plugin/agents/README.txt` sweeps for.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]` — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised flow, which dispatches none — so no implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_unit_loop/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin the blocks `layer-implementer` and `layer-reviewer` share, identically in both files _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Thin `layer-implementer`'s intro, own `## Resolved values` rows, prompt forms and `## Scope` _(layer: plugin)_ _(points: 15)_
3. [x] **Task 3** — Thin `layer-implementer`'s `## Minimal prose` and its catch-all authoring sections _(layer: plugin)_ _(points: 15)_
4. [x] **Task 4** — Thin `layer-implementer`'s `## Working modes` through the evidence-downgrade rule _(layer: plugin)_ _(points: 20)_
5. [ ] **Task 5** — Thin `layer-implementer`'s disposition routes, readiness-index licence and `## Output contract` _(layer: plugin)_ _(points: 20)_
6. [ ] **Task 6** — Thin `layer-reviewer`'s intro, own contract rows and `## Process` _(layer: plugin)_ _(points: 15)_
7. [ ] **Task 7** — Thin `layer-reviewer`'s own checklist triggers, catch-all checks and `## Output contract` _(layer: plugin)_ _(points: 15)_
8. [ ] **Task 8** — Thin `committer`'s intro, `## Resolved values`, and its index and mode argument bullets _(layer: plugin)_ _(points: 15)_
9. [ ] **Task 9** — Thin `committer`'s `commit_prefix`, `push` and record arguments, and replace its caller table with a pointer _(layer: plugin)_ _(points: 15)_
10. [ ] **Task 10** — Thin `committer`'s `## Commit-message policy`, keeping every wire template _(layer: plugin)_ _(points: 20)_
11. [ ] **Task 11** — Thin `committer`'s argument guard, mode routing and standard procedure steps 1–6 _(layer: plugin)_ _(points: 20)_
12. [ ] **Task 12** — Thin `committer`'s `ui_test_pass` procedure to its own steps, and its `## Output contract` _(layer: plugin)_ _(points: 15)_
13. [ ] **Task 13** — Measure the three definitions after the thinning and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**Unit loop:**`"* — which that README's line reads as *"**Unit loop:** layer-implementer, layer-reviewer and committer."*, under *"Run one per family … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."*

**Derivation entries.** Each command is read-only and runs against the base commit `fa8867c9`, so it reaches the same sites after the branch's edits as before them.

| Entry | Form | Entry text |
|---|---|---|
| D1 — sections of the three definitions | command | `git grep -n -E '^#+ ' fa8867c9 -- plugin/agents/layer-implementer.md plugin/agents/layer-reviewer.md plugin/agents/committer.md` — one site per printed heading line; the region above each file's first `## ` heading (frontmatter and intro) is one further site per file. |
| D2 — inbound citers of the three definitions | command | `git grep -l -F -e 'layer-implementer.md' -e 'layer-reviewer.md' -e 'committer.md' fa8867c9 -- ':!plugin/agents/layer-implementer.md' ':!plugin/agents/layer-reviewer.md' ':!plugin/agents/committer.md' ':!docs/work-report-research' ':!harness-runs' ':!examples'` — one site per printed file. |
| D3 — sentences shared with other agent definitions | procedure | **Artifact:** the three definitions at `fa8867c9`, against every other `plugin/agents/*.md` at `fa8867c9`. **Traversal:** each file top to bottom, split into pieces at line ends, at a `. ` followed by a capital letter, `*`, a backtick or `(`, and at each ` \| ` table-cell boundary; keep every piece over 50 characters, plus every paragraph-opening bold lead whatever its length. **Decision rule:** a piece found verbatim in an agent **outside** this family is a `no-change` site — kept byte-for-byte; a piece found only in the other of `layer-implementer` / `layer-reviewer` is a `change` site owned by Task 1, or `no-change` where its row says why. |
| D4 — plugin files the three definitions cite | command | `git grep -o -h -E 'CLAUDE_PLUGIN_ROOT./[A-Za-z0-9_./-]+' fa8867c9 -- plugin/agents/layer-implementer.md plugin/agents/layer-reviewer.md plugin/agents/committer.md` — one site per distinct path printed (a per-item sample path prints cut at its `<N>` placeholder, e.g. `samples/sample_story/task_`); the sections a definition reads in that file are named in the row. |

No standing tracked matrix under `harness-runs/` covers `plugin/agents/`, so no row-class entry is owed.

**Closure invariant:** every heading line D1 prints, every file D2 prints, every piece D3's rule reaches and every distinct path D4 prints appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/layer-implementer.md` → frontmatter and intro | — | D1 (pre-heading region) | `change` | Task 2 (intro paragraph); frontmatter unchanged |
| 2 | `plugin/agents/layer-implementer.md` → `## Resolved values` | — | D1 | `change` | Task 1 (`<layer_names>`, `<layer_path_map>` rows); Task 2 (preamble, `<app_dir>` / `<app_root>` removed, `<scripts_dir>`, `<test_cmd>` / `<typecheck_cmd>`, `<test_file_cmd>`) |
| 3 | `plugin/agents/layer-implementer.md` → `## Invocation contract` | — | D1 | `change` | Task 1 (value table, stop condition); Task 2 (lead sentence, prompt forms) |
| 4 | `plugin/agents/layer-implementer.md` → `## Scope` | — | D1 | `change` | Task 2 |
| 5 | `plugin/agents/layer-implementer.md` → `## Minimal prose — every line carries a rule` | — | D1 | `change` | Task 3 |
| 6 | `plugin/agents/layer-implementer.md` → `## Read first` | — | D1 | `change` | Task 1 |
| 7 | `plugin/agents/layer-implementer.md` → `## Catch-all layer additions` | — | D1 | `change` | Task 1 (scope paragraph, `**Read every layer's rules, not just this one's.**`) |
| 8 | `plugin/agents/layer-implementer.md` → `### Surfaces this layer typically touches` | — | D1 | `change` | Task 3 |
| 9 | `plugin/agents/layer-implementer.md` → `### Keep agent and instruction files focused` | — | D1 | `change` | Task 3 |
| 10 | `plugin/agents/layer-implementer.md` → `## Writing an artifact — consumer, evidence, and scope` | — | D1 | `change` | Task 3 |
| 11 | `plugin/agents/layer-implementer.md` → `### Name the consumer, then place the evidence` | — | D1 | `change` | Task 3 |
| 12 | `plugin/agents/layer-implementer.md` → `### Never publish a statistic you can invalidate or did not measure` | — | D1 | `change` | Task 3 |
| 13 | `plugin/agents/layer-implementer.md` → `### Match a sibling's schema, not its length` | — | D1 | `change` | Task 3 |
| 14 | `plugin/agents/layer-implementer.md` → `## Working modes` | — | D1 | `change` | Task 4 |
| 15 | `plugin/agents/layer-implementer.md` → `### Supervised mode` | — | D1 | `change` | Task 4 |
| 16 | `plugin/agents/layer-implementer.md` → `### Semi-autonomous and autonomous modes` | — | D1 | `change` | Task 4 (through `**An evidence downgrade is recorded, in every mode.**`; Task 1 owns the scratch-run invocation clause); Task 5 (from `**Standing-prohibition disposition.**` to the section's end) |
| 17 | `plugin/agents/layer-implementer.md` → `## Output contract` | — | D1 | `change` | Task 5 |
| 18 | `plugin/agents/layer-reviewer.md` → frontmatter and intro | — | D1 (pre-heading region) | `change` | Task 6 (the `**You report findings. You do not implement fixes.**` paragraph); frontmatter unchanged |
| 19 | `plugin/agents/layer-reviewer.md` → `## Resolved values` | — | D1 | `change` | Task 1 (`<layer_names>`, `<layer_path_map>` rows); Task 6 (preamble, `<state_dir>` row's own clause) |
| 20 | `plugin/agents/layer-reviewer.md` → `## Invocation contract` | — | D1 | `change` | Task 1 (value table, stop condition); Task 6 (the rest) |
| 21 | `plugin/agents/layer-reviewer.md` → `## Read first` | — | D1 | `change` | Task 1 |
| 22 | `plugin/agents/layer-reviewer.md` → `## Process` | — | D1 | `change` | Task 6 (Task 1 owns the scratch-run invocation clause) |
| 23 | `plugin/agents/layer-reviewer.md` → `## Checklist` | — | D1 | `change` | Task 7 (own triggers only; the cross-family blocks are rows 71–74) |
| 24 | `plugin/agents/layer-reviewer.md` → `## Catch-all layer additions` | — | D1 | `change` | Task 1 (scope paragraph, `**Read every layer's rules, not just this one's.**`); Task 7 (the checks) |
| 25 | `plugin/agents/layer-reviewer.md` → `## Unsolicited dispatch guidance` | — | D1 | `no-change` | ten-copy cross-family block the base session thinned (row 75) |
| 26 | `plugin/agents/layer-reviewer.md` → `## Output contract` | — | D1 | `change` | Task 7 |
| 27 | `plugin/agents/layer-reviewer.md` → `### 1. No findings at all` | — | D1 | `change` | Task 7 |
| 28 | `plugin/agents/layer-reviewer.md` → `### 2. Only Should Fix and/or Nice to Have findings (no Must Fix)` | — | D1 | `change` | Task 7 |
| 29 | `plugin/agents/layer-reviewer.md` → `### 3. At least one Must Fix` | — | D1 | `change` | Task 7 |
| 30 | `plugin/agents/layer-reviewer.md` → `# <layer> review — <task_heading> — iteration {iteration}` (template line) | — | D1 | `no-change` | findings-file template inside `### 3.`, a wire the fix-iteration implementer and `branch-reviewer` Pass 2 read |
| 31 | `plugin/agents/layer-reviewer.md` → `## Must Fix` (template line) | — | D1 | `no-change` | findings-file template wire, as row 30 |
| 32 | `plugin/agents/layer-reviewer.md` → `## Should Fix` (template line) | — | D1 | `no-change` | findings-file template wire, as row 30 |
| 33 | `plugin/agents/layer-reviewer.md` → `## Nice to Have` (template line) | — | D1 | `no-change` | findings-file template wire, as row 30 |
| 34 | `plugin/agents/committer.md` → frontmatter and intro | — | D1 (pre-heading region) | `change` | Task 8 (intro); frontmatter unchanged |
| 35 | `plugin/agents/committer.md` → `## Resolved values` | — | D1 | `change` | Task 8 (preamble, "Two absences" paragraph, `<scripts_dir>` and `<commit_conventions>` rows) |
| 36 | `plugin/agents/committer.md` → `## Invocation contract` | — | D1 | `change` | Task 8 (lead line through `task_heading`, and the readiness-only paragraph); Task 9 (`commit_prefix` through `already_passing`, the scope note, the unreadable-path paragraph) |
| 37 | `plugin/agents/committer.md` → `### Which caller sends which mode` | — | D1 | `change` | Task 9 (replaced by a pointer to its owners) |
| 38 | `plugin/agents/committer.md` → `## Commit-message policy` | — | D1 | `change` | Task 10 |
| 39 | `plugin/agents/committer.md` → `## Process` | — | D1 | `change` | Task 11 |
| 40 | `plugin/agents/committer.md` → `### Standard procedure (`task` / `review_plan_file` / `review_item`)` | — | D1 | `change` | Task 11 (heading kept byte-for-byte; `plan_orchestration_instructions_core.md` cites it) |
| 41 | `plugin/agents/committer.md` → `### ui_test_pass procedure` | — | D1 | `change` | Task 12 |
| 42 | `plugin/agents/committer.md` → `## Output contract` | — | D1 | `change` | Task 12 |
| 43 | `.claude/context/conventions.md` | — | D2 | `no-change` | conventions document, never a task target; the committer rules it cites (the **Fixed-form subjects** bullet, explicit staging, the `K` spelling of the UI-test subject) are kept by Tasks 10–12 |
| 44 | `.claude/context/plugin.md` | — | D2 | `no-change` | conventions document, never a task target; the rules it cites (`name: committer`, `## Read first`'s unreadable-input rule, the `generated at init` row, the missing-value stop, the return forms and the `prohibited` marker, the line-coordinate grade) are kept by Tasks 1, 5, 7, 8 and 12 |
| 45 | `cli/templates/scripts/scratch-run.sh` | — | D2 | `no-change` | cites `layer-implementer`'s *An evidence downgrade is recorded* paragraph, whose bold lead Task 4 keeps |
| 46 | `cli/templates/state-dir/architecture_branch_review_point_reviews/README.md` | — | D2 | `no-change` | cites `committer.md` → `## Process`, a heading Task 11 keeps |
| 47 | `cli/templates/state-dir/business_parity_branch_review_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 48 | `cli/templates/state-dir/qa_review_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 49 | `cli/templates/state-dir/review_plan_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 50 | `cli/templates/state-dir/skeptic_review_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 51 | `cli/templates/state-dir/task_plan_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 52 | `cli/templates/state-dir/test_fix_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 53 | `cli/templates/state-dir/user_review_fix_plan_point_reviews/README.md` | — | D2 | `no-change` | as row 46 |
| 54 | `docs/analyze.md` | — | D2 | `no-change` | cites `committer.md` for the commit policy, which Task 10 keeps |
| 55 | `docs/development.md` | — | D2 | `no-change` | as row 54 |
| 56 | `docs/outer-loop-verification.md` | — | D2 | `no-change` | measured record citing the evidence-downgrade requirement, which Task 4 keeps |
| 57 | `docs/typecheck-key-decision.md` | — | D2 | `no-change` | decision record of its own date; the "run the configured string as-is" rule it quotes is kept by Task 2 |
| 58 | `plugin/agents/README.txt` | — | D2 | `no-change` | its port note sweeps `grep -n 'steps 1–' plugin/agents/committer.md` for the range `steps 1–6`; Tasks 11 and 12 keep that spelling wherever a range is named |
| 59 | `plugin/agents/architecture-reviewer.md` | — | D2 | `no-change` | names `layer-reviewer.md` as the per-unit counterpart; no anchor |
| 60 | `plugin/agents/branch-reviewer.md` | — | D2 | `no-change` | names `layer-reviewer.md`; its Pass 2 reads the branch-2 findings files Task 7 keeps |
| 61 | `plugin/agents/business-parity-reviewer.md` | — | D2 | `no-change` | as row 59 |
| 62 | `plugin/agents/user-review-fix-plan-writer.md` | — | D2 | `no-change` | names `layer-reviewer.md`; no anchor |
| 63 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | D2 | `no-change` | lists the paths; no anchor |
| 64 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | D2 | `no-change` | names a `committer.md` mode in a reason; no anchor |
| 65 | `plugin/instructions/improvement_observations_instructions.md` | — | D2 | `no-change` | cites `committer.md` → `## Commit-message policy` for the `record disposition of ` record, which Task 10 keeps byte-for-byte |
| 66 | `plugin/instructions/plan_orchestration_instructions.md` | — | D2 | `no-change` | reads the `commit_prefix` contract's three-state rule, which Task 9 keeps |
| 67 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | D2 | `no-change` | cites the `push:` contract, which Task 9 keeps |
| 68 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | D2 | `no-change` | cites the heading `### Standard procedure (`task` / `review_plan_file` / `review_item`)` and its subject-line step, and token-only entry resolution; Task 11 keeps all three |
| 69 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | D2 | `no-change` | relies on `task` / `review_item` staging `<task_file>` only when it carries a deviation note, and on `ui_test_pass`; Tasks 8, 11 and 12 keep both |
| 70 | `plugin/instructions/unit_loop_core.md` | — | D2, D4 | `no-change` | not a target. It cites `layer-implementer` → `## Resolved values` (the refused-call fallback, kept by Task 2), **An evidence downgrade is recorded, in every mode.** (Task 4), the blocker forms (Task 5), and `committer`'s `task_heading` error, index-agnostic `review_item`, `commit_prefix` contract and `disposition` / `already_passing` arguments (Tasks 8–12). The family reads its `## The test-run rule` (roster-locked; thinned by the base session), `## Substitution table` (wire cells the orchestrator reads), `## Layer routing table`, `## The unit loop` and `### Per-unit review step` (orchestrator flow, cited as dispatch sites) |
| 71 | `plugin/agents/layer-reviewer.md` → the Must Fix / Should Fix / Nice to Have ladder under `**Grade every finding by consequence.**` | — | D3 | `no-change` | cross-family copy (`branch-reviewer`, `skeptic-reviewer`) |
| 72 | `plugin/agents/layer-reviewer.md` → `**Your own checklist is not downgradable.**` paragraph | — | D3 | `no-change` | cross-family bold lead (`branch-reviewer`, `skeptic-reviewer`, `ui-tests-plan-reviewer`) |
| 73 | `plugin/agents/layer-reviewer.md` → `**Guard carve-out.**` paragraph | — | D3 | `no-change` | cross-family copy (`branch-reviewer`, `review-plan-reviewer`, `skeptic-reviewer`, `task-plan-reviewer`) |
| 74 | `plugin/agents/layer-reviewer.md` → `**Prose volume — the receiving side.**` paragraph | — | D3 | `no-change` | cross-family copy (`branch-reviewer`, `skeptic-reviewer`) |
| 75 | `plugin/agents/layer-reviewer.md` → `## Unsolicited dispatch guidance` body, and the line "An optional `## Unsolicited dispatch guidance` section precedes whichever fixed return applies" | — | D3 | `no-change` | cross-family copies (nine and four other reviewers) |
| 76 | `plugin/agents/layer-reviewer.md` → "Read-only — saves findings to a file and returns a PASS/FAIL verdict." | — | D3 | `no-change` | frontmatter; cross-family copy (`task-plan-reviewer`, `ui-tests-plan-reviewer`) |
| 77 | `plugin/agents/layer-reviewer.md` → `iteration` row's "Integer from the caller — the index your findings file is named and titled with; never re-derive it." | — | D3 | `no-change` | cross-family copy (five reviewers); Task 6 may thin only the row's own second sentence |
| 78 | `plugin/agents/layer-reviewer.md` → "**Your return is parsed, not read.** The caller matches the verdict line as either `verdict: PASS` or `verdict: FAIL`, and nothing else routes." | — | D3 | `no-change` | cross-family copy (`architecture-reviewer`, `business-parity-reviewer`); Task 6 may thin only the paragraph's own remainder |
| 79 | `plugin/agents/layer-reviewer.md` → `<scripts_dir>` row | — | D3 | `no-change` | cross-family copy (`task-plan-writer`) |
| 80 | `plugin/agents/layer-reviewer.md` → "They are declared here once; after this table the body uses each one as an ordinary placeholder." and "Ordinary **path and template placeholders** are deliberately not listed" | — | D3 | `no-change` | cross-family copies (seventeen and thirteen other agents); Task 6 may shorten only the enumeration after the colon |
| 81 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md`, `plugin/agents/committer.md` → `<repo_root>` row | each file | D3 | `no-change` | cross-family copies (seventeen agents carry its sentences) |
| 82 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md`, `plugin/agents/committer.md` → `<state_dir>` row's "Default `sdlc-harness/`; no path segment of it begins with a dot." | each file | D3 | `no-change` | cross-family copies (nine other agents); Task 6 may thin only `layer-reviewer`'s own clause before it |
| 83 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `<parity_vocabulary>` / `<reference_impl>` row | each file | D3 | `no-change` | first sentence is a cross-family copy (seven agents); its tail "otherwise no parity clause in this file applies" is the pair's own short form, which the base session kept deliberately |
| 84 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `<convention_symbols>` row | each file | D3 | `no-change` | first sentence is a cross-family copy (`branch-reviewer`); its tail is already one clause |
| 85 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `<impl_stack>` row | each file | D3 | `no-change` | the shared tail "Read them off the file the dispatched `layers[].conventions` value names; never assume a stack." is already one clause, and the stack lists differ for a reason (the reviewer grades the mocking idiom) |
| 86 | `plugin/agents/layer-implementer.md` → `<app_dir>` row ("`appDir` — the app's directory inside the checkout, repo-relative.") | — | D3 | `change` | Task 2 removes the `<app_dir>` and `<app_root>` rows, which no step in the file uses; the copies in `conventions-reviewer` / `conventions-writer` are untouched |
| 87 | `plugin/agents/layer-implementer.md` → "This rule is harness doctrine and is stated here in full rather than cited; where the adopter's own rules document restates it …" | — | D3 | `no-change` | cross-family copy (`task-plan-reviewer`) |
| 88 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md`, `plugin/agents/committer.md` → bold lead `**A cited path you cannot read is a finding, not a fallback.**` | each file | D3 | `change` | lead kept byte-for-byte (eighteen agents carry it); Task 1 thins the remainder in the pair, Task 9 in `committer` |
| 89 | `plugin/agents/layer-implementer.md`, `plugin/agents/committer.md` → "They are declared here once …" and "Ordinary **path placeholders** are deliberately not listed" | each file | D3 | `change` | both sentences kept byte-for-byte (cross-family); Task 2 and Task 8 may shorten only the enumeration after the colon, and Task 2 restores the first sentence's shared form when `<app_root>`'s exception clause goes |
| 90 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `<layer_names>` row | each file | D3 | `change` | Task 1 — family-only copy |
| 91 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `<layer_path_map>` row | each file | D3 | `change` | Task 1 — family-only copy |
| 92 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `## Invocation contract` value table and `**Stop condition — a missing value, never a missing key spelling.**` paragraph | each file | D3 | `change` | Task 1 — family-only copy |
| 93 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → `## Read first`'s two paragraphs | each file | D3 | `change` | Task 1 — family-only copy |
| 94 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → catch-all scope paragraph and `**Read every layer's rules, not just this one's.**` | each file | D3 | `change` | Task 1 — family-only copy |
| 95 | `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` → the scratch-run invocation clause ("one path argument, every further argument forwarded to the file …") | each file | D3 | `change` | Task 1 — family-only copy |
| 96 | `plugin/agents/docs-writer.md` | — | D4 | `no-change` | not a target; Task 3 drops `layer-implementer`'s citation of it, which only fenced the docs corpus out of `## Minimal prose` (the fence itself stays) |
| 97 | `plugin/agents/qa-tester.md` | — | D4 | `no-change` | not a target; `committer`'s intro names it as `ui_test_pass`'s signer |
| 98 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | D4 | `no-change` | not a target; cited only by `committer`'s scope note, which Task 9 drops |
| 99 | `plugin/instructions/docs_phase_instructions.md` | — | D4 | `no-change` | as row 98 |
| 100 | `plugin/instructions/plan_orchestration_instructions.md` | — | D4 | `no-change` | not a target; cited by `committer`'s scope note (dropped by Task 9) |
| 101 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | D4 | `no-change` | not a target; `layer-implementer` greps its `## Phase <letter>` headings for the run order (Task 5 keeps the grep), and `committer`'s caller table cites its phases (Task 9's pointer keeps them) |
| 102 | `plugin/instructions/improvement_observations_instructions.md` | — | D4 | `no-change` | not a target; Task 12 drops `committer`'s rationale pointer to `## Dispositioned units` and keeps the rule it explained |
| 103 | `plugin/samples/sample_story_plan.md` | — | D2, D4 | `no-change` | cites `layer-implementer.md` → `## Working modes` for the readiness-index licence, which Task 5 keeps inside that section; `layer-reviewer` reads it only on a unit that edits a sample fixture |
| 104 | `plugin/samples/sample_story/task_<N>_plan.md`, `plugin/samples/sample_task_plan.md` | — | D4 | `no-change` | read by `layer-reviewer` only on a unit that edits a sample fixture; Task 7 keeps every sample pointer (`plugin/agents/README.txt` → the sample-pointer sweep) |
| 105 | `plugin/samples/sample_code_review.md`, `plugin/samples/sample_code_review/finding_<N>.md` | — | D4 | `no-change` | as row 104 |
| 106 | `plugin/samples/sample_user_review_fix_plan.md`, `plugin/samples/sample_user_review_fix_plan/finding_<N>.md` | — | D4 | `no-change` | as row 104 |
| 107 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | D2 | `no-change` | cites the `push:` contract, which Task 9 keeps, and names `committer.md` in a reason |
| 108 | `scripts/scratch-run.sh` | — | D2 | `no-change` | this checkout's `init`-generated copy of row 45's template; cites the same paragraph, whose bold lead Task 4 keeps |
| 109 | `ARCHITECTURE.md` | — | D2 | `no-change` | quotes `layer-implementer` → `## Minimal prose` (*"the adopter's auto-loaded root instruction file and conventions documents"*, item 9); Task 3 keeps the quoted phrase byte-for-byte |
| 110 | `plugin/agents/layer-reviewer.md` → `## Invocation contract` → bold lead `**You create `<findings_folder>` yourself, and only when you have findings to write.**` | — | D3 | `no-change` | cross-family copy (`architecture-reviewer`, `business-parity-reviewer`, `review-plan-reviewer`, `skeptic-reviewer`, `task-plan-reviewer`, `ui-tests-plan-reviewer`); Task 6 may thin only the paragraph's own remainder, keeping the branch-1 no-disk rule |
| 111 | `plugin/agents/layer-reviewer.md` → `## Process` step 4 → bold lead `**Cross-check business logic against `<reference_impl>`**` | — | D3 | `no-change` | cross-family copy (`branch-reviewer`); Task 6 thins only the step's body after the lead |
| 112 | `plugin/agents/layer-reviewer.md` → intro → bold lead `**You report findings. You do not implement fixes.**` | — | D3 | `no-change` | cross-family copy (`branch-reviewer`, `skeptic-reviewer`); Task 6 may thin only the paragraph's own remainder |

## Up-front word counts

Up-front words = the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents. The reads are unchanged by this branch, so the up-front change equals the definition's change. `Before` is `wc -w` at `fa8867c9`; Task 13 fills `After` and `Δ`. Every `Δ` must be below `0`.

| Agent | Reads counted besides the definition (unchanged) | Before — definition | After — definition | Δ |
|---|---|---|---|---|
| layer-implementer | `unit_loop_core.md` → `## The test-run rule`, `## Substitution table` | 6246 | | |
| layer-reviewer | `unit_loop_core.md` → `## The test-run rule` | 3819 | | |
| committer | — | 8410 | | |
