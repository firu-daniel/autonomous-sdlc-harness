# Story: Thin the conventions family's agent and command prose

## Context

This branch is the **conventions family session** of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, `**Conventions:**`). It thins `plugin/agents/conventions-writer.md`, `plugin/agents/conventions-reviewer.md` and their caller `plugin/commands/harness-analyze.md` in one session, because the reviewer grades documents against the writer's definition and the command quotes both agents' contracts. Work reports are dropped (`## User verdict` in the same README), so this is thinning only: no template, no `work_report:` field, no caller change to carry one. The research reports `docs/work-report-research/conventions-writer.md` and `docs/work-report-research/conventions-reviewer.md` are input through their `## Prose classification` and `## Thinning plan` sections only, read as guidance on what is redundant; their line numbers and word counts describe the tree before the base session and the six earlier family sessions. The base commit for every comparison is `25e2382a`, the current `dev` (this repository's default branch).

**The standard every task applies** is `.claude/context/plugin.md` → `## Writing agent prose`:
- a rule is a direct instruction, and each rule is stated once;
- rationale the agent does not act on is dropped, and every edge case is kept;
- a wire literal or a cited anchor is never paraphrased;
- a change never raises the file's up-front word count.

`harness-analyze.md` is a command, not an agent definition, and the same standard is applied to it: its own `## Context` already says the decisions it applies are recorded in `docs/analyze.md` *"and are not restated here"*, and most of what Tasks 5–7 cut is that restated rationale.

**Behaviour does not change**: every rule the writer, the reviewer or the command acts on today still holds after the edit, stated more briefly. One read moves on purpose. `conventions-reviewer` reads the whole of `conventions-writer.md` up front today; Task 3 narrows that read to the four sections it grades against — `## Scope`, `## The document`, `## The fix dispatch` and `## House rules` — as the reviewer research report proposes. Where the reviewer restates a writer rule it now reads (the census and stack shapes of check (9), the probe paragraph of check (7)), Task 4 cites the writer's rule by its bold lead and keeps the reviewer's own **Concrete correction**. Every per-task file gives the exact old and new text of each change, checked against `25e2382a`. An implementer applies that text and changes nothing else.

**Research proposals this branch declines:**
- **The `work_report:` field, its template and the combined `harness-analyze.md` caller change.** Work reports are dropped.
- **Thinning `## Resolved values`** in any of the three files, including dropping the `<app_dir>` row and shortening the `<repo_root>` row. Those rows are shared word for word with agents, commands and instruction files outside the family, so the whole section stays as it is.
- **Trimming either agent's frontmatter `description:`.** Every frontmatter block is frozen; it is the text a dispatcher selects on.
- **Editing `docs/analyze.md`.** The design record keeps the rationale this branch removes from the three files, and every anchor it cites stays.
- **A shared base file for the pair.** A base file read up front moves words rather than cutting them.

**Frozen text** is defined at `25e2382a` and stays word for word in its file:
1. **Ten-word windows.** Every run of words covered by a 10-word window — ten consecutive whitespace-separated words inside one blank-line-delimited paragraph — that also occurs in an agent definition, command or instruction file **outside** this family, plus the words between two such runs in one sentence. A sentence that holds frozen text may lose only its unfrozen words.
2. **Every bold lead** (`**…**` opening a paragraph's first line or a list item) in the three files. No task removes or rewords one.
3. **Every heading line.**
4. **Every fenced block.**
5. **Each frontmatter block.**

The large frozen blocks are each file's `## Resolved values` preamble and table, the *"Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins."* sentence in both agents, the argument-names wire sentence and the stop-condition lead in both agents, and the writer's `## House rules` line-number and repo-relative-path runs. Each per-task file lists the frozen text inside its own range.

**The family check probe.** Task 1 writes `harness-runs/scratch/conventions_family_check.mjs`. It is a read-only probe, gitignored and never committed. It checks the following against `25e2382a`:
- frozen text, bold leads, heading lines, fenced blocks and frontmatter;
- each file's wire literals and cited anchors, compared with whitespace collapsed so a re-wrapped line in the command still matches;
- that no other file under `plugin/` changed;
- that each file's word count fell, and that `conventions-reviewer`'s up-front count (its definition plus what it reads of the writer) fell.

Tasks 2–7 run it on the file they edit. Task 8 writes the probe again from the same text and runs it with no arguments, over all three files, as the branch's authority.

**Anchors and behaviours other files rely on, which every task keeps:**
- **Every heading, step number and block label of the command** — steps 1–6, `(4a)`, `(4b)`, `(4c)`, `(4d)`, `(4d.0)` — which `plugin/agents/conventions-reviewer.md`, `docs/development.md` Gate 8 and `docs/analyze.md` cite.
- **Every section heading of both agents**, in particular the writer's `## Invocation contract`, `## Resolved values`, `## Scope`, `## The document`, `## House rules` and `## Output contract`, and the reviewer's `## Invocation contract` and `## The corpus pass — what to verify`, each cited by the command or by `docs/analyze.md`.
- **Every dispatch value name and return field name of both agents, in order.** The command fills and parses them, and both agents say *"Field names byte-stable"*.
- **The wire literals** `Reviewer finding not applied — ` (carried by all three files, as `.claude/CLAUDE.md` states), `Layer-writer divergence — `, `<!-- harness:unfilled -->`, `<!-- harness:setup-pending -->`, the `prior_document` values `skeleton` / `filled` / `absent` and `n/a`, and step 5's verdict JSON line with its three verdicts.
- **The writer's dispatch-count sentence**, which the command's `(4d.0)` quotes as *"the receiving contract's own words"*, and the reviewer's check numbers (1)–(15) and ids `C1`–`C6`.
- **Every passage a conventions document quotes**, so no conventions document goes stale: `.claude/context/plugin.md` quotes the reviewer's *"that omission is deliberate: it makes the read-only guarantee tool-level rather than a prose request"*, the writer's *"Field names byte-stable"* and `## House rules` line-number paragraph, and the command's `cli/src/doctor/checks.ts` (`LAYER_PROFILE_CHECK`) citation.
- **The qualified command spelling** `/autonomous-sdlc-harness:harness-analyze` and the setup verb `autonomous-sdlc-harness init`; `scripts/check-command-spelling.sh` (gate 6d) fails a bare `/harness-analyze`.

**Measurement.** Up-front words are the file plus every plugin file or section it reads on every dispatch, counted as `wc -w` counts them (runs of non-whitespace characters). `CLAUDE.md`, the adopter's conventions documents, `<state_dir>/lessons.md` and conditional reads are excluded.
- **`conventions-writer`** reads no plugin file up front.
- **`conventions-reviewer`** reads all of `conventions-writer.md` before this branch, and only its four graded sections after Task 3. The probe's `UPFRONT` line computes both.
- **`harness-analyze.md`** is loaded into the session as a command. Its `(4b)` read of the writer's `## The document` and `## House rules` is conditional on the `project` target and is excluded.
- Task 8 fills `## Up-front word counts`, and every task checks that its own file's count falls.

The verification bar for the branch as a whole belongs to the Run gates phase, not to any unit, and no task runs it. That bar is `cli/test` and `scripts/run-gates.sh` passing, including the plugin manifest under `--strict` and the command-spelling gate.

**Top risks:**
- **A dropped rule, edge case or wire literal** — a dispatch value, a return field, a `none` case, a check exemption, a corpus disposition or the verdict JSON line. Each per-task file gives a rule inventory to run before saving, and the probe's heading, bold-lead and literal checks catch a lost wire mechanically; Task 8 runs it over all three files.
- **The narrowed reviewer read loses a rule the reviewer grades.** Task 3 narrows only to sections whose contents its own file enumerates, Task 4's checks cite the writer's rules by bold leads that the probe pins in the writer, and the probe fails with `READ-SECTION-MISSING` if one of the four sections disappears.
- **A thinned sentence forks text other files share word for word, or a re-wrapped command paragraph breaks a quoted anchor.** Every per-task file lists the frozen text in its range and applies only replacement texts already checked against `25e2382a`; the probe checks every frozen run and every literal with whitespace collapsed.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_conventions/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin `conventions-writer`'s intro, `## Invocation contract` and `## Scope`, and write the family check probe _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Thin `conventions-writer`'s `## The document`, `## The fix dispatch`, `## Output contract` and `## House rules` _(layer: plugin)_ _(points: 20)_
3. [x] **Task 3** — Thin `conventions-reviewer`'s intro and `## Invocation contract`, and narrow its read of the writer to four sections _(layer: plugin)_ _(points: 15)_
4. [ ] **Task 4** — Thin `conventions-reviewer`'s checks, corpus pass, `## What you do not do` and `## House rules` _(layer: plugin)_ _(points: 20)_
5. [ ] **Task 5** — Thin `harness-analyze.md`'s `## Context` and steps 1–3 _(layer: plugin)_ _(points: 15)_
6. [ ] **Task 6** — Thin `harness-analyze.md`'s step 4 lead, `(4a)`, `(4b)` and `(4c)` _(layer: plugin)_ _(points: 20)_
7. [ ] **Task 7** — Thin `harness-analyze.md`'s `(4d)`, step 5 and step 6 _(layer: plugin)_ _(points: 15)_
8. [ ] **Task 8** — Measure the three files, run the family check probe and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**Conventions:**`"*. That README resolves it to two passages:
- *"Run one per family … A reviewer that grades against its writer's definition is thinned in the same session as that writer. … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."*
- *"**Conventions:** conventions-writer and conventions-reviewer, together with their caller `harness-analyze.md`."*

**Derivation entries.** Each command is read-only and is re-run verbatim from the repository root. Every command reads the base commit `25e2382a`, so it reaches the same sites after the branch's edits as before them.

- **C1 — the family's files (command):** `git grep -l -E '^name: conventions-(writer|reviewer)$|^# Scope: Fill this repository' 25e2382a -- plugin/agents plugin/commands` — one site per printed file, read with its `25e2382a:` prefix removed.
- **C2 — plugin files the family cites (command):** `git grep -o -h -E '\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_<>./-]+' 25e2382a -- plugin/agents/conventions-writer.md plugin/agents/conventions-reviewer.md plugin/commands/harness-analyze.md` — one site per distinct path printed.
- **C3 — durable files that name the family by file name or role name (command):** `git grep -l -E 'conventions-writer|conventions-reviewer|harness-analyze\.md|[Cc]onventions [Ww]riter|[Cc]onventions [Rr]eviewer' 25e2382a -- . ':!harness-runs' ':!docs/work-report-research'` — one site per printed file, read with its `25e2382a:` prefix removed. The command's **slash-command name** is deliberately not a pattern: hundreds of CLI messages, tests and documents name `/autonomous-sdlc-harness:harness-analyze` as a command to run, and none of them quotes the command file's prose, which is all this branch changes. It excludes two trees:
  - `harness-runs/` holds the run artifacts of this repository's adopted harness, which no task edits. C3b reaches its standing READMEs.
  - `docs/work-report-research/` is the research record of an older tree, which this branch reads only as input.
- **C3b — standing state-directory READMEs that name the family (command):** `git grep -l -E 'conventions-writer|conventions-reviewer|harness-analyze\.md|[Cc]onventions [Ww]riter|[Cc]onventions [Rr]eviewer' 25e2382a -- 'harness-runs/*README.md'` — one site per printed file, each the adopted copy of a `cli/templates/state-dir/` template, with `Copy` = `adopted copy`.
- **P4 — files that carry the family's frozen text (procedure).**
  - **Artifact:** the three family files and every other `plugin/agents/*.md`, `plugin/commands/*.md` and `plugin/instructions/*.md`, all at `25e2382a`.
  - **Traversal:** each family file top to bottom, paragraph by paragraph (blank-line delimited), as runs of whitespace-separated words, sliding a window of ten consecutive words inside each paragraph.
  - **Decision rule:** a file outside the family is a site when one of its own paragraphs contains one of those ten-word windows. Its disposition is `no-change`: its copy is the reference the family's copy must keep matching.

No standing tracked matrix under `harness-runs/` covers `plugin/`, so no row-class entry is owed.

**Closure invariant:** every file C1, C3 and C3b print, every distinct path C2 prints and every file P4's decision rule reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/conventions-writer.md` | — | C1, C2, C3 | `change` | Task 1 (intro, the corpus read relaxation, `## Invocation contract`, `## Scope`); Task 2 (`## The document` to the end). Frontmatter and `## Resolved values` are frozen and no task edits them |
| 2 | `plugin/agents/conventions-reviewer.md` | — | C1, C2, C3 | `change` | Task 3 (intro, `## Invocation contract`, and the narrowed read of the writer); Task 4 (`## What to verify` to the end). Frontmatter and `## Resolved values` are frozen |
| 3 | `plugin/commands/harness-analyze.md` | — | C1, C2, C3 | `change` | Task 5 (`## Context`, steps 1–3); Task 6 (step 4 lead, `(4a)`–`(4c)`); Task 7 (`(4d)`, steps 5–6). Frontmatter, `# Scope:` heading and `## Resolved values` are frozen |
| 4 | `plugin/agents/` (the directory `${CLAUDE_PLUGIN_ROOT}/agents/` names) | — | C2 | `no-change` | the reviewer's check (12) and C2 resolve actor names against it; no definition is added, removed or renamed |
| 5 | `plugin/agents/task-plan-writer.md` | — | C2, P4 | `no-change` | the writer's `## House rules` cites its `**Conventions-document prohibition**` label, which Task 2 keeps; it also carries frozen copies, the reference the family's copies keep matching |
| 6 | `plugin/instructions/dispatch_discipline_instructions.md` | — | C2, C3, P4 | `no-change` | step 3 of the command cites it as not activated (Task 5, HA10 keeps that); its line naming `conventions-reviewer` as an exclusion still holds; carries frozen copies |
| 7 | `plugin/instructions/qa_test_instructions.md` | — | C2, P4 | `no-change` | the writer's `## House rules` quotes its *"That file holds the rules"*, which Task 2 keeps; carries frozen copies |
| 8 | `plugin/instructions/mention_reading.md` | — | C3, P4 | `no-change` | quotes *"Field names byte-stable"* from the writer's `## Output contract`, which Task 2 keeps; carries frozen copies |
| 9 | `.claude/CLAUDE.md` | — | C3 | `no-change` | conventions document (the always-loaded project file), never a plan target. Its claim that `Reviewer finding not applied — ` is carried by all three family files stays true: the probe pins the literal in each. Its file-naming examples name files that still exist |
| 10 | `.claude/context/plugin.md` | — | C3 | `no-change` | conventions document, never a plan target. Every passage it quotes or cites stays: *"that omission is deliberate: it makes the read-only guarantee tool-level rather than a prose request"* (Task 3), *"Field names byte-stable"* and the `## House rules` line-number paragraph (Task 2), the missing-value stop (Task 1), and the `LAYER_PROFILE_CHECK` citation (Task 7). Nothing it states is falsified |
| 11 | `ARCHITECTURE.md` | — | C3 | `no-change` | its `grep -rn "CLAUDE\.md" plugin/` invariant confines hits to the three family files; no task adds a `CLAUDE.md` hit, and each kept one names `.claude/CLAUDE.md` in the role it did |
| 12 | `cli/src/generators/claudeContext.ts` | — | C3 | `no-change` | a doc comment saying `conventions-writer` composes a document with no file on disk; Task 2 keeps that case (CW16, CW17) |
| 13 | `docs/analyze.md` | — | C3 | `no-change` | the design record. Its citations of the writer's `## Invocation contract` and `## Resolved values`, the reviewer's `## The corpus pass — what to verify` and the writer's `## The document` / `## House rules` all stay; the rationale this branch removes from the three files is the rationale this document records |
| 14 | `docs/development.md` | — | C3 | `no-change` | Gate 8 cites the check ids `C1`–`C6` and (1)–(15), check (3)'s support clause, `(4b)`, `(4d)` and the first of `## Not determined`'s two line classes; every one stays |
| 15 | `plugin/agents/README.txt` | — | C3 | `no-change` | describes the conventions pair and its dispatcher; both axes, the dispatch counts and "findings, no verdict" all still hold |
| 16 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` | — | C3 | `no-change` | names the conventions writer and reviewer among the agents; no agent or command is added, removed or renamed |
| 17 | `plugin/agents/architecture-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches (a ten-word window shared with a family file, mostly the `## Resolved values` rows); its copy is the reference the family's copy keeps matching |
| 18 | `plugin/agents/branch-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 19 | `plugin/agents/business-parity-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 20 | `plugin/agents/committer.md` | — | P4 | `no-change` | as row 17 |
| 21 | `plugin/agents/docs-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 22 | `plugin/agents/docs-writer.md` | — | P4 | `no-change` | as row 17 |
| 23 | `plugin/agents/layer-implementer.md` | — | P4 | `no-change` | as row 17 |
| 24 | `plugin/agents/layer-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 25 | `plugin/agents/qa-tester-mobile-maestro.md` | — | P4 | `no-change` | as row 17 |
| 26 | `plugin/agents/qa-tester-mobile-mcp.md` | — | P4 | `no-change` | as row 17 |
| 27 | `plugin/agents/qa-tester.md` | — | P4 | `no-change` | as row 17 |
| 28 | `plugin/agents/review-plan-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 29 | `plugin/agents/skeptic-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 30 | `plugin/agents/statistics-plan-writer.md` | — | P4 | `no-change` | as row 17 |
| 31 | `plugin/agents/task-plan-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 32 | `plugin/agents/test-fix-plan-writer.md` | — | P4 | `no-change` | as row 17 |
| 33 | `plugin/agents/ui-tests-plan-reviewer.md` | — | P4 | `no-change` | as row 17 |
| 34 | `plugin/agents/ui-tests-plan-writer.md` | — | P4 | `no-change` | as row 17 |
| 35 | `plugin/agents/user-review-fix-plan-writer.md` | — | P4 | `no-change` | as row 17 |
| 36 | `plugin/commands/branch-answer.md` | — | P4 | `no-change` | as row 17 |
| 37 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | P4 | `no-change` | as row 17 |
| 38 | `plugin/commands/branch-implement-plan.md` | — | P4 | `no-change` | as row 17 |
| 39 | `plugin/commands/branch-implement-review.md` | — | P4 | `no-change` | as row 17 |
| 40 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` | — | P4 | `no-change` | as row 17 |
| 41 | `plugin/commands/branch-implement-user-review.md` | — | P4 | `no-change` | as row 17 |
| 42 | `plugin/commands/branch-pause.md` | — | P4 | `no-change` | as row 17 |
| 43 | `plugin/commands/branch-prompt.md` | — | P4 | `no-change` | as row 17 |
| 44 | `plugin/commands/branch-qa-test.md` | — | P4 | `no-change` | as row 17 |
| 45 | `plugin/commands/branch-resume.md` | — | P4 | `no-change` | as row 17 |
| 46 | `plugin/commands/branch-review.md` | — | P4 | `no-change` | as row 17 |
| 47 | `plugin/commands/branch-start-docs-autonomous.md` | — | P4 | `no-change` | as row 17 |
| 48 | `plugin/commands/branch-start-plan-autonomous.md` | — | P4 | `no-change` | as row 17 |
| 49 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | P4 | `no-change` | as row 17 |
| 50 | `plugin/commands/branch-start-plan.md` | — | P4 | `no-change` | as row 17 |
| 51 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | P4 | `no-change` | as row 17 |
| 52 | `plugin/commands/branch-start-user-review-fix-plan.md` | — | P4 | `no-change` | as row 17 |
| 53 | `plugin/commands/branch-status.md` | — | P4 | `no-change` | as row 17 |
| 54 | `plugin/commands/branch-user-review.md` | — | P4 | `no-change` | as row 17 |
| 55 | `plugin/commands/harness-read-mention.md` | — | P4 | `no-change` | as row 17 |
| 56 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | P4 | `no-change` | as row 17 |
| 57 | `plugin/instructions/clarification_digest_instructions.md` | — | P4 | `no-change` | as row 17 |
| 58 | `plugin/instructions/code_review_fixes_instructions.md` | — | P4 | `no-change` | as row 17 |
| 59 | `plugin/instructions/code_review_instructions.md` | — | P4 | `no-change` | as row 17 |
| 60 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 61 | `plugin/instructions/docs_phase_instructions.md` | — | P4 | `no-change` | as row 17 |
| 62 | `plugin/instructions/improvement_observations_instructions.md` | — | P4 | `no-change` | as row 17 |
| 63 | `plugin/instructions/mode_contract.md` | — | P4 | `no-change` | as row 17 |
| 64 | `plugin/instructions/plan_orchestration_instructions.md` | — | P4 | `no-change` | as row 17 |
| 65 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 66 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | P4 | `no-change` | as row 17 |
| 67 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 68 | `plugin/instructions/run_mode_instructions.md` | — | P4 | `no-change` | as row 17 |
| 69 | `plugin/instructions/task_plan_implementation_instructions.md` | — | P4 | `no-change` | as row 17 |
| 70 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 71 | `plugin/instructions/task_plan_writing_instructions_core.md` | — | P4 | `no-change` | as row 17 |
| 72 | `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 73 | `plugin/instructions/unit_loop_core.md` | — | P4 | `no-change` | as row 17 |
| 74 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` | — | P4 | `no-change` | as row 17 |
| 75 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 76 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` | — | P4 | `no-change` | as row 17 |
| 77 | `plugin/instructions/user_review_fixes_instructions.md` | — | P4 | `no-change` | as row 17 |
| 78 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | P4 | `no-change` | as row 17 |
| 79 | `plugin/instructions/user_review_fixes_instructions_core.md` | — | P4 | `no-change` | as row 17 |
| 80 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` | — | P4 | `no-change` | as row 17 |

## Up-front word counts

Up-front words are the file plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md`, the adopter's conventions documents, `<state_dir>/lessons.md` and conditional reads. `Before` is `wc -w` at `25e2382a`. Task 8 fills `After — file` from the probe's `WORDS` lines and `After — up-front` from `After — file`, or for `conventions-reviewer` from the `UPFRONT` line, then `Δ up-front`. Every `Δ up-front` must be below `0`.

| File | Reads counted besides the file | Before — file | Before — up-front | After — file | After — up-front | Δ up-front |
|---|---|---|---|---|---|---|
| conventions-writer | none, before and after | 5097 | 5097 | | | |
| conventions-reviewer | before: all of `plugin/agents/conventions-writer.md` (5097); after: its `## Scope`, `## The document`, `## The fix dispatch` and `## House rules` as Task 2 leaves them | 5882 | 10979 | | | |
| harness-analyze.md | none (the `(4b)` read of the writer is conditional), before and after | 8297 | 8297 | | | |
