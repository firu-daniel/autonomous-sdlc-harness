# Story: Thin the fix-plan and statistics writers' agent prose

## Context

This branch is the **fix-plan and statistics writers family session** of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, `**Fix-plan and statistics writers:**`). It thins `plugin/agents/user-review-fix-plan-writer.md`, `plugin/agents/test-fix-plan-writer.md` and `plugin/agents/statistics-plan-writer.md` in one session. No reviewer joins the family. The one place a reviewer grades against a family definition is `plugin/agents/architecture-reviewer.md`, which cites `test-fix-plan-writer`'s machine-path rule as the source of its sub-case (c) raise. That reviewer was thinned in the plan/diff-gates session, and Task 3 keeps the rule and its bold lead. Work reports are dropped (`## User verdict` in the same README), so this is thinning only: no template, no `## Work report` section, no report storage. The research reports `docs/work-report-research/user-review-fix-plan-writer.md`, `docs/work-report-research/test-fix-plan-writer.md` and `docs/work-report-research/statistics-plan-writer.md` are input through their `## Prose classification` and `## Thinning plan` sections only, read as guidance on what is redundant. Their line numbers and word counts describe the tree before the base session and the four earlier family sessions. The base commit for every comparison is `13a2ed4c`, the current `dev` (this repository's default branch).

**The standard every task applies** is `.claude/context/plugin.md` → `## Writing agent prose`:
- a rule is a direct instruction, and each rule is stated once;
- rationale the agent does not act on is dropped, and every edge case is kept;
- a wire literal or a cited anchor is never paraphrased;
- a change to an agent definition never raises its up-front word count.

**Behaviour does not change**: every rule a writer or its caller acts on today still holds after the edit, stated more briefly. One read moves on purpose. `test-fix-plan-writer` takes the user-review fix-plan sample as its split-format reference today. That sample is a different artifact family, and every shape the test fix plan uses is already spelled out in the definition, so Task 3 makes the sample an on-demand read, as the task-plan family session did for `plugin/samples/sample_task_plan.md`. The sample files themselves are unchanged. Every per-task file gives the exact old and new text of each change, checked against `13a2ed4c`. An implementer applies that text and changes nothing else.

**Research proposals this branch declines:**
- **Thinning `## Resolved values`** (the preamble and every row, in all three files). The preamble and most rows are shared word for word with up to nineteen other agents, and the family-only parts are single clauses inside frozen sentences, so the whole section stays as it is.
- **Moving `user-review-fix-plan-writer`'s sample read to on-demand.** The sample index and its three per-finding files are that agent's own output format and taste reference, as the story-plan samples are for `task-plan-writer`, so the read stays up front.
- **Editing `plugin/samples/sample_statistics.md`.** The samples are one worked fixture whose files cite each other (`plugin/samples/README.md`). This branch edits no file under `plugin/samples/` or `plugin/instructions/`.
- **Retitling `## Read on demand (no auto-loaded context)`**, or any other heading. Every heading line is frozen.
- **A shared plan-writer base file.** A base file read up front moves words rather than cutting them, and the README keeps shared copies in each definition.
- **Dropping `test-fix-plan-writer`'s `## What you must not do` bullets.** They stay. Only the rationale after each is cut.

**Frozen text** is defined at `13a2ed4c` and stays word for word in its file:

1. **Ten-word windows.** Every run of words covered by a 10-word window — ten consecutive whitespace-separated words inside one blank-line-delimited paragraph — that also occurs in an agent definition **outside** this family, plus the words between two such runs in one sentence. A sentence that holds frozen text may lose only its unfrozen words. A whole sentence may be dropped only when every frozen run in it still occurs, word for word, elsewhere in the same file.
2. **Every bold lead** (`**…**` opening a line or a list item) in the three files. No task removes or rewords one.
3. **Every heading line.**
4. **Every fenced block**: the dispatch prompts, the `awk`, `grep` and `git log` commands, the log marker lines and the return blocks.
5. **Each frontmatter block.**

The large frozen blocks are:
- each file's `## Resolved values` preamble and table;
- the docs-retrieval tool bullet of each `## Read on demand`;
- the sentence *"Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins."*;
- each file's `**A cited path you cannot read is a finding, not a fallback.**` paragraph;
- the `## Questions` sentence of each `**How the caller consumes your return.**` paragraph that carries one;
- `user-review-fix-plan-writer`'s readiness-entry bullet runs, its per-finding-files run and its test-run quality-check bullet;
- the writer-side rejected-findings paragraph in the two fix-plan writers.

Each per-task file lists the frozen text inside its own range.

**The family check probe.** Task 1 writes `harness-runs/scratch/fix_plan_statistics_family_check.mjs`. It is a read-only probe, gitignored and never committed. It checks the following against `13a2ed4c`:
- frozen text, bold leads, heading lines, fenced blocks and frontmatter;
- each file's wire literals and cited anchors;
- that no file under `plugin/instructions/` or `plugin/samples/`, and no other agent definition, changed;
- that each file's word count fell.

Tasks 2–5 run it on the file they edit. Task 6 writes the probe again from the same text and runs it with no arguments, over all three files, as the branch's authority.

**Anchors and behaviours other files rely on, which every task keeps:**
- **Each fenced dispatch prompt, byte for byte.** The callers send them: `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` steps 5, 7, 8 and 11; `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.2 Write and review the test fix plan` and `### D.1 Write the first branch-statistics file (pre-user-review)`; `plugin/instructions/code_review_instructions.md` and `plugin/instructions/code_review_fixes_instructions.md`; `plugin/instructions/user_review_fixes_instructions_core.md` → `### D.1 Update the branch-statistics file (post-user-review)`.
- **Each return block, line for line**, including `(pending — questions for user)`, the `blocker:` line and the statistics `error:` block. The callers parse the field names.
- **`user-review-fix-plan-writer`'s `## Process` step numbers.** `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 5 cites *"→ step 6"* for the ledger append.
- **The pull-request review shapes.** The `**Review comments:**` line and bullet suffix, the round marker's `comments=` ids and the `## Out of scope / verified-OK` section are parsed by `cli/templates/scripts/remote-run.sh`, whose header names `user-review-fix-plan-writer` as their one writer.
- **`test-fix-plan-writer`'s `## Process` → **Rewrite machine paths before quoting.**** `plugin/agents/architecture-reviewer.md` cites that bold lead as the source of its sub-case (c) raise.
- **The test fix plan's own wires**: the log marker lines (mirrored in `scripts/run-test-suite.sh` and `cli/templates/scripts/run-test-suite.sh`), the `**Failing test:**` and `**Suspected shared cause:**` lines (quoted by `plugin/agents/layer-implementer.md`), `## Not fixable on this branch`, `## Source failures` and `## Quality checks before returning`.
- **The statistics derivations**: both `awk` pipelines, the four arm greps (also quoted in `plugin/samples/sample_statistics.md`), the `record disposition of ` substring and its ` — ` delimiter (shared with `plugin/instructions/improvement_observations_instructions.md`), the weights `15` / `5` / `2` and the formula.
- **The test-run pointer.** The two fix-plan writers' pointer at `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, whose `**Who may cite this.**` roster lists both.
- **The rejected-findings rule**, with `## Rejected findings` and `rebutted round <j> — call stands`.
- **Frontmatter.** Each `tools:` line, which `plugin/agents/README.txt`'s docs-retrieval roster and `ARCHITECTURE.md` count, and each `description:`.

**Measurement.** Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, counted as `wc -w` counts them (runs of non-whitespace characters). `CLAUDE.md`, the adopter's conventions documents, `<state_dir>/lessons.md` and conditional reads are excluded.
- **Reads.** `user-review-fix-plan-writer` reads `plugin/samples/sample_user_review_fix_plan.md` and its three `finding_<N>.md` files (1959 words). `test-fix-plan-writer` reads `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (597 words), plus the same four sample files before this branch only. `statistics-plan-writer` reads `plugin/samples/sample_statistics.md` (1509 words).
- **No read file changes.** The probe's `READS-CHANGED` check confirms it, so each up-front figure after the branch is the definition's new count plus its unchanged reads.
- **Recording.** Task 6 fills `## Up-front word counts`, and every task checks that its own file's count falls.

The verification bar for the branch as a whole belongs to the Run gates phase, not to any unit, and no task runs it. That bar is `cli/test` and `scripts/run-gates.sh` passing, including the plugin manifest under `--strict`.

**Top risks:**
- **A dropped rule, edge case or wire literal**: a dispatch prompt, a return line, the step 6 anchor, a `**Review comments:**` shape, an arm grep or a severity weight. Each per-task file gives a rule inventory to run before saving, and the probe's fenced-block, heading, bold-lead and literal checks catch a lost wire mechanically. Task 6 runs it over all three files.
- **A thinned sentence forks text other agents share word for word.** Every per-task file lists the frozen text in its range and applies only replacement texts already checked against `13a2ed4c`. The probe checks every frozen run.
- **The test fix plan loses a shape it took from the sample.** Task 3 makes the sample an on-demand read only after confirming that every heading, entry form and per-finding field the test fix plan carries is stated in the definition. The probe's literal list for that file pins each one.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_fix-plan_statistics_writers/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin `user-review-fix-plan-writer`'s intro, `## Invocation contract` and `## Read on demand`, and write the family check probe _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Thin `user-review-fix-plan-writer`'s `## Process`, `## Output contract` and `## Revision mode` _(layer: plugin)_ _(points: 20)_
3. [x] **Task 3** — Thin `test-fix-plan-writer` and make its sample read on-demand _(layer: plugin)_ _(points: 10)_
4. [ ] **Task 4** — Thin `statistics-plan-writer`'s intro, `## Read first`, `## Invocation contract` and `## Process` lead _(layer: plugin)_ _(points: 10)_
5. [ ] **Task 5** — Thin `statistics-plan-writer`'s `## Process` steps 1–3, `## Output` and `## Output contract` _(layer: plugin)_ _(points: 20)_
6. [ ] **Task 6** — Measure the three definitions, run the family check probe and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**Fix-plan and statistics writers:**`"*. That README resolves it to two passages:
- *"Run one per family … A reviewer that grades against its writer's definition is thinned in the same session as that writer. … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."*
- *"**Fix-plan and statistics writers:** user-review-fix-plan-writer, test-fix-plan-writer and statistics-plan-writer."*

**Derivation entries.** Each command is read-only and is re-run verbatim from the repository root. C2, C3 and C3b read the base commit `13a2ed4c`, so they reach the same sites after the branch's edits as before them. C1's file names do not change.

- **C1 — the family's definitions (command):** `grep -l -E '^name: (user-review-fix-plan|test-fix-plan|statistics-plan)-writer$' plugin/agents/*.md` — one site per printed file.
- **C2 — plugin files the family cites (command):** `git grep -o -h -E '\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_<>./-]+' 13a2ed4c -- plugin/agents/user-review-fix-plan-writer.md plugin/agents/test-fix-plan-writer.md plugin/agents/statistics-plan-writer.md` — one site per distinct path printed.
- **C3 — durable files that name the family by agent name or role name (command):** `git grep -l -E 'user-review-fix-plan-writer|test-fix-plan-writer|statistics-plan-writer|[Uu]ser-[Rr]eview [Ff]ix[- ][Pp]lan [Ww]riter|[Tt]est [Ff]ix [Pp]lan [Ww]riter|[Ss]tatistics [Pp]lan [Ww]riter' 13a2ed4c -- . ':!harness-runs' ':!docs/work-report-research'` — one site per printed file, read with its `13a2ed4c:` prefix removed. It excludes two trees:
  - `harness-runs/` holds the run artifacts of this repository's adopted harness, which no task edits. C3b reaches its standing READMEs.
  - `docs/work-report-research/` is the research record of an older tree, which this branch reads only as input.
- **C3b — standing state-directory READMEs that name the family (command):** `git grep -l -E 'user-review-fix-plan-writer|test-fix-plan-writer|statistics-plan-writer|[Uu]ser-[Rr]eview [Ff]ix[- ][Pp]lan [Ww]riter|[Tt]est [Ff]ix [Pp]lan [Ww]riter|[Ss]tatistics [Pp]lan [Ww]riter' 13a2ed4c -- 'harness-runs/*README.md'` — one site per printed file, each the adopted copy of a `cli/templates/state-dir/` template, with `Copy` = `adopted copy`.
- **P4 — agent definitions that carry the family's frozen text (procedure).**
  - **Artifact:** the three family definitions and every other `plugin/agents/*.md`, all at `13a2ed4c`.
  - **Traversal:** each family definition top to bottom, paragraph by paragraph (blank-line delimited), as runs of whitespace-separated words, sliding a window of ten consecutive words inside each paragraph; then each line opening with a bold lead (`**…**` after an optional list marker).
  - **Decision rule:** an agent definition outside the family is a site when one of its own paragraphs contains one of those ten-word windows, or when it contains one of those bold leads verbatim. Its disposition is `no-change`: its copy is the reference the family's copy must keep matching.

No standing tracked matrix under `harness-runs/` covers `plugin/agents/`, so no row-class entry is owed.

**Closure invariant:** every file C1, C3 and C3b print, every distinct path C2 prints and every agent definition P4's decision rule reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/user-review-fix-plan-writer.md` | — | C1, C3 | `change` | Task 1 (intro, `## Invocation contract`, `## Read on demand`); Task 2 (`## Process`, `## Output contract`, `## Revision mode`). Frontmatter and `## Resolved values` are frozen and no task edits them |
| 2 | `plugin/agents/test-fix-plan-writer.md` | — | C1, C3 | `change` | Task 3 (the whole body below `## Resolved values`). Frontmatter and `## Resolved values` are frozen |
| 3 | `plugin/agents/statistics-plan-writer.md` | — | C1, C3 | `change` | Task 4 (intro, `## Read first`, `## Invocation contract`, `## Process` lead); Task 5 (`## Process` steps 1–3, `## Output`, `## Output contract`). Frontmatter and `## Resolved values` are frozen |
| 4 | `plugin/agents/branch-reviewer.md` | — | C2, P4 | `no-change` | carries frozen copies; `user-review-fix-plan-writer`'s two citations of it are rationale and Tasks 1 (U2) and 2 (U18) drop them; nothing in it depends on being cited |
| 5 | `plugin/agents/layer-reviewer.md` | — | C2, P4 | `no-change` | as row 4; Task 1 (U2) drops the one citation |
| 6 | `plugin/instructions/code_review_fixes_instructions.md` | — | C2, C3 | `no-change` | a caller of the first-write statistics prompt; Task 4 drops the definition's caller-provenance sentence (S5) and keeps the prompt block it sends |
| 7 | `plugin/instructions/code_review_instructions.md` | — | C2, C3 | `no-change` | as row 6 |
| 8 | `plugin/instructions/improvement_observations_instructions.md` | — | C2, C3 | `no-change` | its `## Dispositioned units — an entry per unit closed without a fix` ships the derivation `statistics-plan-writer` repeats; Task 5 keeps the derivation byte for byte and drops only the sentence noting the duplication (S16), which cited the heading in a short form |
| 9 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series; its `### G.2` and `### D.1` prompts and return parses are kept (Tasks 3, 4, 5); S5 drops the `### D.1` citation from the definition |
| 10 | `plugin/instructions/unit_loop_core.md` | — | C2, C3 | `no-change` | its `## The test-run rule` roster lists both fix-plan writers, which keep their pointer (Task 3 keeps the `## Read on demand` one); `### The dispositioned outcome` and `## Substitution table` citations are kept |
| 11 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` | — | C2, C3 | `no-change` | dispatch sites `## Flow` steps 5, 7, 8 and 11; Task 1 keeps all four prompt blocks and step citations |
| 12 | `plugin/instructions/user_review_fixes_instructions_core.md` | — | C2, C3 | `no-change` | the update-statistics caller; Task 4 drops the definition's citation of it (S6) and keeps its prompt block |
| 13 | `plugin/samples/sample_statistics.md` | — | C2, C3 | `no-change` | declined (see `## Context`); `statistics-plan-writer` keeps reading it up front |
| 14 | `plugin/samples/sample_user_review_fix_plan.md` | — | C2, C3 | `no-change` | `user-review-fix-plan-writer` keeps it up front; Task 3 makes it on-demand for `test-fix-plan-writer` (T5); the file is unchanged |
| 15 | `plugin/samples/sample_user_review_fix_plan/finding_<N>.md` (the three `finding_1.md`–`finding_3.md`) | — | C2 | `no-change` | as row 14 |
| 16 | `ARCHITECTURE.md` | — | C3 | `no-change` | counts the `mcp__harness-docs__search_docs` grant in frontmatter `tools:` lines, which are frozen |
| 17 | `README.md` | — | C3 | `no-change` | links `statistics-plan-writer` as the writer of `statistics.md`; its path and output are unchanged |
| 18 | `cli/templates/scripts/remote-run.sh` | — | C3 | `no-change` | its header names `user-review-fix-plan-writer` as the one writer of the review-comment line; Task 2 keeps every shape that header owns |
| 19 | `cli/templates/scripts/run-test-suite.sh` | template | C3 | `no-change` | its marker lines are the wire `test-fix-plan-writer` reads; Task 3 keeps the marker block byte for byte |
| 20 | `scripts/run-test-suite.sh` | adopted copy | C3 | `no-change` | as row 19 |
| 21 | `docs/development.md` | — | C3 | `no-change` | records gate runs that name the user-review fix-plan writer; a measured record, not a contract |
| 22 | `docs/github-run-control.md` | — | C3 | `no-change` | describes the inline-comment heading form `## Process` step 2 reads; Task 2 leaves that bullet unchanged |
| 23 | `plugin/agents/README.txt` | — | C3 | `no-change` | lists the fix-plan writers on its docs-retrieval roster (frozen `tools:` lines) and names `statistics-plan-writer` as a report writer; both still hold |
| 24 | `plugin/agents/architecture-reviewer.md` | — | C3, P4 | `no-change` | cites `test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.**, which Task 3 keeps; names both fix-plan writers as revision-mode recipients; carries frozen copies |
| 25 | `plugin/agents/business-parity-reviewer.md` | — | C3, P4 | `no-change` | names `user-review-fix-plan-writer` as its sub-case (b) recipient; carries frozen copies |
| 26 | `plugin/commands/branch-start-user-review-fix-plan.md` | — | C3 | `no-change` | names the flow's writer; no anchor into the definition |
| 27 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | C3 | `no-change` | lists the three definitions by path and describes the success-rate metric, which Task 5 keeps |
| 28 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | names `statistics-plan-writer` as not dispatched there; no anchor |
| 29 | `plugin/instructions/docs_phase_instructions.md` | — | C3 | `no-change` | names the D.1 dispatch; no anchor |
| 30 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | commits the statistics file after the D.1 return contract, which Task 5 keeps line for line |
| 31 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | C3 | `no-change` | Override 5 cites `user-review-fix-plan-writer.md` → step 6; Task 2 keeps the step number and its initial-write-only rule |
| 32 | `plugin/instructions/user_review_fixes_instructions.md` | — | C3 | `no-change` | relies on the fix plan being self-contained; Task 2 keeps `## Source observations` in the index and the self-contained per-finding rule |
| 33 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | C3 | `no-change` | commits the updated statistics file after the D.1 return; contract kept |
| 34 | `plugin/samples/sample_task_plan.md` | — | C3 | `no-change` | describes the statistics family as a single-file report with no readiness section; Task 4 keeps that rule |
| 35 | `plugin/samples/sample_user_review.md` | — | C3 | `no-change` | the user-review text format; the writer's reading of it is unchanged |
| 36 | `plugin/agents/committer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 37 | `plugin/agents/conventions-reviewer.md` | — | P4 | `no-change` | as row 36 |
| 38 | `plugin/agents/conventions-writer.md` | — | P4 | `no-change` | as row 36 |
| 39 | `plugin/agents/docs-reviewer.md` | — | P4 | `no-change` | as row 36 |
| 40 | `plugin/agents/docs-writer.md` | — | P4 | `no-change` | as row 36 |
| 41 | `plugin/agents/layer-implementer.md` | — | P4 | `no-change` | as row 36; it also quotes `**Failing test:**` and `**Suspected shared cause:**`, which Task 3 keeps |
| 42 | `plugin/agents/qa-tester.md` | — | P4 | `no-change` | as row 36 |
| 43 | `plugin/agents/qa-tester-mobile-maestro.md` | — | P4 | `no-change` | as row 36 |
| 44 | `plugin/agents/qa-tester-mobile-mcp.md` | — | P4 | `no-change` | as row 36 |
| 45 | `plugin/agents/review-plan-reviewer.md` | — | P4 | `no-change` | as row 36 |
| 46 | `plugin/agents/skeptic-reviewer.md` | — | P4 | `no-change` | as row 36 |
| 47 | `plugin/agents/task-plan-reviewer.md` | — | P4 | `no-change` | as row 36 |
| 48 | `plugin/agents/task-plan-writer.md` | — | P4 | `no-change` | as row 36; it shares the writer-side rejected-findings paragraph and the `## Questions` sentence |
| 49 | `plugin/agents/ui-tests-plan-reviewer.md` | — | P4 | `no-change` | as row 36 |
| 50 | `plugin/agents/ui-tests-plan-writer.md` | — | P4 | `no-change` | as row 36 |

## Up-front word counts

Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md`, the adopter's conventions documents and `<state_dir>/lessons.md`. `Before` is `wc -w` at `13a2ed4c`. No read file changes on this branch, so each `After — up-front` figure is `After — definition` plus the reads listed for after the branch. Task 6 fills `After — definition` from the probe's `WORDS` lines, then `After — up-front` and `Δ up-front`. Every `Δ up-front` must be below `0`.

| Agent | Reads counted besides the definition | Before — definition | Before — up-front | After — definition | After — up-front | Δ up-front |
|---|---|---|---|---|---|---|
| user-review-fix-plan-writer | `plugin/samples/sample_user_review_fix_plan.md` + its three `finding_<N>.md` (1959), before and after | 4005 | 5964 | | | |
| test-fix-plan-writer | before: `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (597) + the same four sample files (1959); after: the test-run rule (597) only | 2391 | 4947 | | | |
| statistics-plan-writer | `plugin/samples/sample_statistics.md` (1509), before and after | 2928 | 4437 | | | |
