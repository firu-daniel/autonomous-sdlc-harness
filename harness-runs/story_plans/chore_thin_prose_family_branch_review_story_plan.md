# Story: Thin the branch-review family's agent prose

## Context

This branch is the **branch-review family session** of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, `**Branch review:**`). It thins `plugin/agents/branch-reviewer.md`, `plugin/agents/skeptic-reviewer.md` and `plugin/agents/review-plan-reviewer.md` in one session, because `review-plan-reviewer` grades the split review the other two write against the format their definitions fix. Work reports are dropped (`## User verdict` in the same README), so this is thinning only: no template, no `## Work report` section, no report storage, and no orphan-file exemption. The research reports `docs/work-report-research/branch-reviewer.md`, `skeptic-reviewer.md` and `review-plan-reviewer.md` are input through their `## Prose classification` and `## Thinning plan` sections only, read as guidance on what is redundant; their line numbers and word counts describe the tree before the base session (`8c519ab6`) and the two earlier family sessions (`3706ae8a`, `433f312c`). The base commit for every comparison is `433f312c`, the current `dev` (this repository's default branch).

**The standard every task applies** is `.claude/context/plugin.md` → `## Writing agent prose`: a rule is a direct instruction, each rule is stated once, rationale the agent does not act on is dropped, every edge case is kept, a wire literal or cited anchor is never paraphrased, and a change to an agent definition never raises its up-front word count. **Behaviour does not change**: every rule a reviewer or its caller acts on today still holds after the edit. Where a task finds two statements of one rule that disagree, it records that in its return and keeps the stricter one. Every per-task file gives the exact replacement text for each paragraph it changes; an implementer applies that text and changes nothing else.

**Research proposals this branch declines.** Removing the `<app_dir>` binding and cutting the `## Resolved values` rows to one clause each: those rows are text up to twenty-one agents share, so they are frozen. Moving the grading checklists or the severity rubric behind a pointer: they are the standard each reviewer grades by. Dropping the adopter-fill tables — `branch-reviewer`'s `### Pass 0` sweep table and `review-plan-reviewer`'s `### Missed checks` per-layer table — is a behaviour question the research left open, so both tables and their disable rules stay and only the prose around them is thinned. The parity-gated clauses stay even though `phases.parity` is `false` here, because they are an adopter's.

**Frozen text** is defined at `433f312c` and stays word for word in its file:

1. Every run of words covered by a 10-word window — ten consecutive whitespace-separated words inside one blank-line-delimited paragraph — that also occurs in an agent definition **outside** this family, plus the words between two such runs in one sentence. A sentence that holds frozen text may lose only its unfrozen words. A whole sentence may be dropped only when every frozen run in it still occurs, word for word, elsewhere in the same file.
2. Every bold lead (`**…**` opening a line, a list item or a table cell) that another agent definition carries verbatim, whether inside or outside the family.
3. Every heading line.
4. Each frontmatter block.

The large frozen blocks are each file's `## Resolved values` preamble and table, the docs-retrieval tool bullet, the `**A cited path you cannot read is a finding, not a fallback.**` paragraph, the `## Unsolicited dispatch guidance` section, the Must Fix / Should Fix / Nice to Have ladder, `**Guard carve-out.**`, `**Prose volume — the receiving side.**`, the harness-doctrine sentence, the site-anchor definition and the readiness entry form. The phase-gate sentence pair that opens with `**Skip this … unless `phases.parity` is `true` in `harness.config.json`.**` stays word for word in all three files. Each per-task file lists the frozen text inside its own range.

**Blocks shared only inside this family** are thinned once, identically in `branch-reviewer` and `skeptic-reviewer`, by Task 1. That covers the implementability paragraph, `**Checkbox discipline.**`, `**Re-dispatch on a failed meta-review.**`, the `## Findings format` lead sentence and the intro's delegated-fix sentence. Task 1 also writes `harness-runs/scratch/branch_review_family_check.mjs`, a read-only probe that is gitignored and never committed. The probe checks frozen text, shared bold leads, Task 1's blocks, each file's wire literals, unchanged reads and word counts against `433f312c`. Task 10 writes it again and runs it as the branch's authority. Tasks 2–9 verify their own ranges with `git grep`.

**Anchors and behaviours other files rely on, which every task keeps:**
- Each dispatch block and each `Adjust …` re-dispatch sentence. `plugin/instructions/plan_orchestration_instructions_core.md` → `### B.1`, `### B.2`, `### C2.1` and `### C2.2` quote them.
- The two-pass reconciliation line ending `skipped M (already covered) and K (stale).`, which `### B.1` reads from the message, together with its "not written into any saved file" clause.
- The `## Questions` section literal, carried to `### D.2 Done summary` and named in `plugin/instructions/plan_orchestration_instructions_autonomous.md`.
- The `verdict:` return lines.
- `branch-reviewer`'s `### Pass 2` heading, which `plugin/agents/layer-reviewer.md` cites.
- Each `## Unsolicited dispatch guidance` section, on the roster in `plugin/instructions/dispatch_discipline_instructions.md`.
- Each pointer at `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, whose `**Who may cite this.**` roster lists all three.
- Each `${CLAUDE_PLUGIN_ROOT}/samples/…` pointer, swept by `plugin/agents/README.txt`.
- Each `tools:` line, counted by `plugin/agents/README.txt`'s docs-retrieval grant roster and by `ARCHITECTURE.md`.
- The behaviours the state-directory README templates under `cli/templates/state-dir/` and their adopted copies under `harness-runs/` describe:
  - a reviewer adjusts the files its meta-review names rather than regenerating them;
  - `review-plan-reviewer` learns which family it holds from the paths it is passed, never a flag;
  - an empty `per_task_findings_root` makes Pass 2 a no-op;
  - the skeptic treats the plan, the task prompt and the reference as claims, and emits only net-new findings.

**Measurement.** Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents (the base session's measure). All three agents read `plugin/samples/sample_code_review.md` and `plugin/samples/sample_code_review/finding_1.md` on every dispatch. The `## The test-run rule` section is cited, not read. This branch edits no file under `plugin/instructions/` or `plugin/samples/`, so each agent's up-front change equals its definition's change. The definitions measure `wc -w` 5884 (`branch-reviewer`), 5099 (`skeptic-reviewer`) and 4191 (`review-plan-reviewer`) at `433f312c`. Task 10 fills `## Up-front word counts`, and every task checks that its own file's count falls.

The verification bar for the branch as a whole — `cli/test` and `scripts/run-gates.sh` passing, the plugin manifest under `--strict` included — belongs to the Run gates phase, not to any unit; no task runs either.

**Top risks:** The likeliest failure is a thinned sentence that forks text other agents share word for word. That defect class produced four review items on the previous family branch. Every per-task file lists the frozen text in its range and greps its file sets against `433f312c`, and Task 1's and Task 10's probe checks every frozen run mechanically. The second risk is a dropped rule, edge case or wire literal — a dispatch key, an `Adjust …` sentence, the reconciliation line, a `verdict:` line, a cited heading. Each task applies exact replacement texts, greps its literals, and runs a rule-inventory check before saving. The third is `review-plan-reviewer`'s format checks drifting from the shapes the two writers now state. Task 8 ships after Tasks 4 and 6 and re-reads both writers' format sections before it saves.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_branch_review/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin the blocks `branch-reviewer` and `skeptic-reviewer` share, identically in both, and write the family check probe _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Thin `branch-reviewer`'s intro, `## Invocation contract` and `## Read first` _(layer: plugin)_ _(points: 10)_
3. [x] **Task 3** — Thin `branch-reviewer`'s `## Process`: Pass 1, Pass 0 and Pass 2 _(layer: plugin)_ _(points: 20)_
4. [x] **Task 4** — Thin `branch-reviewer`'s `## Findings format` index bullet, `## Common findings to look for` and `## Output contract` _(layer: plugin)_ _(points: 15)_
5. [x] **Task 5** — Thin `skeptic-reviewer`'s intro, `## What you are NOT`, its own `## Resolved values` row and `## Invocation contract` _(layer: plugin)_ _(points: 15)_
6. [x] **Task 6** — Thin `skeptic-reviewer` from `## Read first` through `## Output contract` _(layer: plugin)_ _(points: 20)_
7. [ ] **Task 7** — Thin `review-plan-reviewer`'s intro, `## Invocation contract`, `## Read first` and `## Process` _(layer: plugin)_ _(points: 15)_
8. [ ] **Task 8** — Thin `review-plan-reviewer`'s `## What to check`, `### False positives` and `### Missed checks` _(layer: plugin)_ _(points: 15)_
9. [ ] **Task 9** — Thin `review-plan-reviewer`'s `### Unactionable gates` and parity spot-check _(layer: plugin)_ _(points: 10)_
10. [ ] **Task 10** — Measure the three definitions, run the family check probe and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**Branch review:**`"*. That README resolves it to *"Run one per family … A reviewer that grades against its writer's definition is thinned in the same session as that writer. … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."* and *"**Branch review:** branch-reviewer, skeptic-reviewer and review-plan-reviewer."*

**Derivation entries.** Each command is read-only and is re-run verbatim from the repository root. C2, C3 and C3b read the base commit `433f312c`, so they reach the same sites after the branch's edits as before them. C1's file names do not change.

- **C1 — the family's definitions (command):** `grep -l -E '^name: (branch|skeptic|review-plan)-reviewer$' plugin/agents/*.md` — one site per printed file.
- **C2 — plugin files the family cites (command):** `git grep -o -h -E '\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_<>./-]+' 433f312c -- plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md plugin/agents/review-plan-reviewer.md` — one site per distinct path printed.
- **C3 — durable files that name the family by agent name, file name or role name (command):** `git grep -l -E 'branch-reviewer|skeptic-reviewer|review-plan-reviewer|[Bb]ranch [Rr]eviewer|[Ss]keptic [Rr]eviewer|[Rr]eview[- ][Pp]lan [Rr]eviewer' 433f312c -- . ':!harness-runs' ':!docs/work-report-research'` — one site per printed file, read with its `433f312c:` prefix removed. It excludes two trees. `harness-runs/` holds the run artifacts of this repository's adopted harness, which no task edits; C3b reaches its standing READMEs. `docs/work-report-research/` is the research record of an older tree, which this branch reads only as input.
- **C3b — standing state-directory READMEs that name the family (command):** `git grep -l -E 'branch-reviewer|skeptic-reviewer|review-plan-reviewer|[Bb]ranch [Rr]eviewer|[Ss]keptic [Rr]eviewer|[Rr]eview[- ][Pp]lan [Rr]eviewer' 433f312c -- 'harness-runs/*README.md'` — one site per printed file. Each is the adopted copy of a `cli/templates/state-dir/` template, so it takes its own row with `Copy` = `adopted copy`.
- **P4 — agent definitions that carry the family's frozen text (procedure).**
  - **Artifact:** the three family definitions and every other `plugin/agents/*.md`, all at `433f312c`.
  - **Traversal:** each family definition top to bottom, paragraph by paragraph (blank-line delimited), as runs of whitespace-separated words, sliding a window of ten consecutive words inside each paragraph; then each line opening with a bold lead (`**…**` after an optional list marker or table cell).
  - **Decision rule:** an agent definition outside the family is a site when one of its own paragraphs contains one of those ten-word windows, or when it contains one of those bold leads verbatim. Its disposition is `no-change`: its copy is the reference the family's copy must keep matching.

No standing tracked matrix under `harness-runs/` covers `plugin/agents/`, so no row-class entry is owed.

**Closure invariant:** every file C1, C3 and C3b print, every distinct path C2 prints and every agent definition P4's decision rule reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/branch-reviewer.md` | — | C1, C2, C3 | `change` | Task 1 (shared blocks); Task 2 (intro, `## Invocation contract`, `## Read first`); Task 3 (`## Process`); Task 4 (`## Findings format` index bullet, `## Common findings to look for`, `## Output contract`). `## Resolved values` and `## Unsolicited dispatch guidance` are frozen and no task edits them |
| 2 | `plugin/agents/skeptic-reviewer.md` | — | C1, C2, C3 | `change` | Task 1 (shared blocks); Task 5 (intro, `## What you are NOT`, the `<deploy_project_id>` row, `## Invocation contract`); Task 6 (`## Read first` through `## Output contract`) |
| 3 | `plugin/agents/review-plan-reviewer.md` | — | C1, C2, C3 | `change` | Task 7 (intro, `## Invocation contract`, `## Read first`, `## Process`); Task 8 (`## What to check` through `### Missed checks`); Task 9 (`### Unactionable gates`, `### Reference-implementation parity spot-check`). `## Output contract` and `## Unsolicited dispatch guidance` are frozen or wire and no task edits them |
| 4 | `plugin/agents/architecture-reviewer.md` | — | C2, C3, P4 | `no-change` | carries cross-family copies the family keeps word for word (the no-`Edit` sentence, the findings-folder lead, the verdict paragraph, the site-anchor definition, the readiness entry form); cites `branch-reviewer`'s split shape, which Tasks 1 and 4 keep |
| 5 | `plugin/agents/business-parity-reviewer.md` | — | C2, C3, P4 | `no-change` | as row 4, plus the Leg 2 precedent-grep text Task 4 leaves frozen |
| 6 | `plugin/agents/layer-reviewer.md` | — | C2, C3, P4 | `no-change` | cites `branch-reviewer`'s Pass 2, whose heading Task 3 keeps; carries the grading ladder, `**Guard carve-out.**`, `**Prose volume — the receiving side.**` and `**You report findings. You do not implement fixes.**`, all frozen |
| 7 | `plugin/agents/qa-tester.md` | — | C3, P4 | `no-change` | mirrors the `branch-reviewer` split format, which Tasks 1 and 4 keep; carries frozen copies |
| 8 | `plugin/agents/user-review-fix-plan-writer.md` | — | C3, P4 | `no-change` | names `branch-reviewer`; carries frozen copies (the split-index pointer form, the test-run pointer) |
| 9 | `plugin/agents/committer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 10 | `plugin/agents/conventions-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 11 | `plugin/agents/conventions-writer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 12 | `plugin/agents/docs-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 13 | `plugin/agents/docs-writer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 14 | `plugin/agents/layer-implementer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 15 | `plugin/agents/qa-tester-mobile-maestro.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 16 | `plugin/agents/qa-tester-mobile-mcp.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 17 | `plugin/agents/statistics-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 18 | `plugin/agents/task-plan-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 19 | `plugin/agents/task-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 20 | `plugin/agents/test-fix-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 21 | `plugin/agents/ui-tests-plan-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 22 | `plugin/agents/ui-tests-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 23 | `plugin/agents/README.txt` | — | C3 | `no-change` | docs-retrieval grant roster lists all three; no task edits a `tools:` line. Its sample-pointer sweep reads the three files' `samples/` pointers, which every task keeps |
| 24 | `plugin/instructions/code_review_instructions.md` | — | C2, C3 | `no-change` | supervised dispatch site; Task 2 keeps the `## Flow` step 2 citation and the single-pass mode it describes |
| 25 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series; Tasks 1–9 keep every dispatch block, `Adjust …` sentence, the reconciliation line, `## Questions` and the `verdict:` lines it quotes or parses |
| 26 | `plugin/instructions/unit_loop_core.md` | — | C2, C3 | `no-change` | its `## The test-run rule` roster lists all three, and each keeps its pointer; its `## The unit loop` rows `C` and `C2.4` read the index shapes Tasks 1, 4 and 6 keep |
| 27 | `plugin/samples/sample_code_review.md` | — | C2, C3 | `no-change` | the format specification `review-plan-reviewer` validates against, read every dispatch by all three; one worked fixture with its siblings (`plugin/samples/README.md`) |
| 28 | `plugin/samples/sample_code_review/finding_1.md` | — | C2 | `no-change` | as row 27 |
| 29 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | relies on the empty-root Pass 2 no-op (Task 2 keeps it) and on `## Questions` (Task 1 keeps it); names the agents in ledger rows |
| 30 | `plugin/instructions/dispatch_discipline_instructions.md` | — | C3 | `no-change` | lists all three on the `## Unsolicited dispatch guidance` roster; the section is frozen |
| 31 | `plugin/instructions/run_mode_instructions.md` | — | C3 | `no-change` | names `review-plan-reviewer` among the structural plan reviewers; no anchor |
| 32 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | names the skeptic reviewers as not run in the docs loop; no anchor |
| 33 | `plugin/instructions/README.md` | — | C3 | `no-change` | lists `branch-reviewer` among dispatched agents; no anchor |
| 34 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | C3 | `no-change` | names the Phase B and C2 dispatches; no anchor |
| 35 | `plugin/commands/branch-start-docs-autonomous.md` | — | C3 | `no-change` | names the reviewers as not run on prose; no anchor |
| 36 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | C3 | `no-change` | lists the three paths; no anchor |
| 37 | `ARCHITECTURE.md` | — | C3 | `no-change` | counts the `mcp__harness-docs__search_docs` grant in frontmatter `tools:` lines, which are frozen |
| 38 | `cli/templates/state-dir/code_reviews/README.md` | template | C3 | `no-change` | says the branch reviewer adjusts the files its meta-review names rather than regenerating; Task 1 keeps that rule |
| 39 | `harness-runs/code_reviews/README.md` | adopted copy | C3b | `no-change` | as row 38 |
| 40 | `cli/templates/state-dir/dispatch_additions/README.md` | template | C3 | `no-change` | a worked heartbeat line naming `skeptic-reviewer`; no contract of the family |
| 41 | `harness-runs/dispatch_additions/README.md` | adopted copy | C3b | `no-change` | as row 40 |
| 42 | `cli/templates/state-dir/review_plan_reviews/README.md` | template | C3 | `no-change` | says `review-plan-reviewer` learns its family from the paths it is passed, never a flag; Task 7 keeps **Stay index-agnostic** |
| 43 | `harness-runs/review_plan_reviews/README.md` | adopted copy | C3b | `no-change` | as row 42 |
| 44 | `cli/templates/state-dir/skeptic_review_plan_reviews/README.md` | template | C3 | `no-change` | as row 42 |
| 45 | `harness-runs/skeptic_review_plan_reviews/README.md` | adopted copy | C3b | `no-change` | as row 42 |
| 46 | `cli/templates/state-dir/skeptic_review_point_reviews/README.md` | template | C3 | `no-change` | says the skeptic reviewer never writes there; no rule Tasks 5–6 change |
| 47 | `harness-runs/skeptic_review_point_reviews/README.md` | adopted copy | C3b | `no-change` | as row 46 |
| 48 | `cli/templates/state-dir/skeptic_reviews/README.md` | template | C3 | `no-change` | says the skeptic runs last, treats the plan, task prompt and reference as claims, and writes only net-new findings; Tasks 5 and 6 keep all three |
| 49 | `harness-runs/skeptic_reviews/README.md` | adopted copy | C3b | `no-change` | as row 48 |
| 50 | `cli/templates/state-dir/story_plans/README.md` | template | C3 | `no-change` | says both end-of-branch reviewers read the story index's `## Context` for intent; Tasks 3 and 6 keep that read |
| 51 | `harness-runs/story_plans/README.md` | adopted copy | C3b | `no-change` | as row 50 |
| 52 | `cli/templates/state-dir/task_plan_point_reviews/README.md` | template | C3 | `no-change` | says the branch reviewer reads this root where its caller supplies it; Tasks 2 and 3 keep two-pass mode and Pass 2 |
| 53 | `harness-runs/task_plan_point_reviews/README.md` | adopted copy | C3b | `no-change` | as row 52 |
| 54 | `cli/templates/state-dir/task_prompts/README.md` | template | C3 | `no-change` | says both end-of-branch reviewers read the task prompt as intent; Tasks 3 and 6 keep that read |
| 55 | `harness-runs/task_prompts/README.md` | adopted copy | C3b | `no-change` | as row 54 |
| 56 | `examples/notes-app/sdlc-harness/improvement_observations/feat_note_updated_at.md` | — | C3 | `no-change` | frozen capture of an adopted repository's run (`examples/notes-app/README.md`); never edited |
| 57 | `examples/notes-app/sdlc-harness/review_plan_reviews/feat_note_updated_at/review_1.md` | — | C3 | `no-change` | as row 56 |

## Up-front word counts

Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents. The reads are unchanged by this branch, so the up-front change equals the definition's change. `Before` is `wc -w` at `433f312c`; Task 10 fills `After` and `Δ` from the probe's `WORDS` lines. Every `Δ` must be below `0`.

| Agent | Reads counted besides the definition (unchanged) | Before — definition | After — definition | Δ |
|---|---|---|---|---|
| branch-reviewer | `plugin/samples/sample_code_review.md`, `plugin/samples/sample_code_review/finding_1.md` | 5884 | | |
| skeptic-reviewer | `plugin/samples/sample_code_review.md`, `plugin/samples/sample_code_review/finding_1.md` | 5099 | | |
| review-plan-reviewer | `plugin/samples/sample_code_review.md`, `plugin/samples/sample_code_review/finding_1.md` | 4191 | | |
