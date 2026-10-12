# Story: Thin the plan/diff-gates family's agent prose

## Context

This branch is the **plan/diff-gates family session** of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, `**Plan/diff gates:**`). It thins `plugin/agents/architecture-reviewer.md` and `plugin/agents/business-parity-reviewer.md` in one session. The two definitions have the same skeleton, heading for heading, and share about 1 500 identical words, so the blocks they share are thinned once and written identically into both. Work reports are dropped (`## User verdict` in the same README), so this is thinning only: no template, no `## Work report` section, no report storage. The research reports `docs/work-report-research/architecture-reviewer.md` and `docs/work-report-research/business-parity-reviewer.md` are input through their `## Prose classification` and `## Thinning plan` sections only, read as guidance on what is redundant. Their line numbers and word counts describe the tree before the base session and the three earlier family sessions. The base commit for every comparison is `6307573a`, the current `dev` (this repository's default branch).

**The standard every task applies** is `.claude/context/plugin.md` → `## Writing agent prose`:
- a rule is a direct instruction, and each rule is stated once;
- rationale the agent does not act on is dropped, and every edge case is kept;
- a wire literal or a cited anchor is never paraphrased;
- a change to an agent definition never raises its up-front word count.

**Behaviour does not change**: every rule a reviewer or its caller acts on today still holds after the edit. `business-parity-reviewer` is never dispatched in this repository (`phases.parity` is `false`), but it is an adopter's agent, so every parity-gated rule stays. Every per-task file gives the exact old and new text of each change, checked against `6307573a`. An implementer applies that text and changes nothing else.

**Research proposals this branch declines:**
- **Thinning `## Resolved values`** (the preamble, the `<repo_root>` / `<app_dir>` row, the docs and parity rows). Up to twenty-one agents share those rows word for word, so they are frozen.
- **Narrowing or dropping the up-front read of `unit_loop_core.md` → `## The test-run rule`.** It is the standard the **No plan asks for a test run** check grades by. Keeping both reads unchanged also keeps each agent's up-front change equal to its definition's change.
- **A shared plan/diff reviewer base file.** A base file read up front moves words rather than cutting them, and the README keeps shared copies in each definition.
- **Deleting `## Findings-folder / index-path convention` wholesale.** Every heading line is frozen, and the section's paths are the only place the implemented-solution index path is spelled out. Only its prose is thinned.
- **Thinning `## Unsolicited dispatch guidance`.** It is frozen roster text.
- **Moving the grading standard behind a pointer.** This covers the rejected-findings rule, the parity checks, the exclusion-basis rule, the obvious-reference-bug legs and the dead-code carve-out. They are thinned in place, around their frozen runs.

**Frozen text** is defined at `6307573a` and stays word for word in its file:

1. **Ten-word windows.** Every run of words covered by a 10-word window — ten consecutive whitespace-separated words inside one blank-line-delimited paragraph — that also occurs in an agent definition **outside** this family, plus the words between two such runs in one sentence. A sentence that holds frozen text may lose only its unfrozen words. A whole sentence may be dropped only when every frozen run in it still occurs, word for word, elsewhere in the same file.
2. **Bold leads** (`**…**` opening a line, a list item or a table cell):
   - a bold lead an agent definition outside the family carries verbatim stays;
   - a bold lead only these two definitions carry stays in both or leaves both. No task removes one.
3. Every heading line.
4. Each frontmatter block.

The large frozen blocks are:
- each file's `## Resolved values` preamble and table;
- the `**Every conventions document `<layer_path_map>` names**` bullet, the docs-root bullet and the docs-retrieval tool bullet;
- the `**A cited path you cannot read is a finding, not a fallback.**` paragraph;
- the rejected-findings rule from `**A recorded rejection is an addressed finding only once you have tested it.**` to its end;
- the `## Unsolicited dispatch guidance` section;
- the readiness-section bullet of `### Implemented-solution mode FAIL (insertion point 2)`;
- the site-anchor definition in each per-finding bullet;
- `business-parity-reviewer`'s phase-gate paragraph opening `**Skip this phase unless `phases.parity` is `true` in `harness.config.json`.**`.

Each per-task file lists the frozen text inside its own range.

**Blocks shared only inside this family** are thinned once and written identically into both files by Tasks 1–3. The lines that end identical are the `SHARED` list of the family check probe. Where the two copies differ in a word today (`three` / `two` sub-cases, `architecture` / `parity`, a caller's step anchor), the difference stays and nothing else differs.

**The family check probe.** Task 1 writes `harness-runs/scratch/plan_diff_gates_family_check.mjs`. It is a read-only probe, gitignored and never committed. It checks the following against `6307573a`:
- frozen text and bold leads;
- the `SHARED` lines;
- each file's wire literals;
- that no read and no other agent definition changed;
- that each file's word count fell.

Tasks 2–6 run it on the files they edit. Run with file arguments, it reports a `SHARED` line still waiting on a later task as `SHARED-PENDING` and does not fail on it. Task 7 writes the probe again from the same text and runs it with no arguments, as the branch's authority. Run that way, every `SHARED` line must match.

**Anchors and behaviours other files rely on, which every task keeps:**
- **Each fenced dispatch block, key for key.** The callers send them: `plugin/instructions/task_plan_writing_instructions_core.md` → `### 2. Business-parity review (plan-review mode)` and `### 3. Architecture review (plan-review mode)`, `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` steps 7 and 8, and `plugin/instructions/plan_orchestration_instructions_core.md` → `### A1.5.1 Generate the parity review`, `### A2.1 Generate the architecture review` and `### G.2 Write and review the test fix plan`. `docs/flow-graph-walker.md` → `### Item 2` names their key names as wire strings.
- **Each caller anchor the definitions cite**, in the form they cite it today, including the short `## Phase A1.5` and `## Phase A2` forms.
- **The mode selector.** It keys on the presence of `diff_base`, and `plugin/agents/README.txt` describes it.
- **The `diff_base` key row.** It reads *"use the value you are given, never a remembered default"*, and `plugin/agents/README.txt` quotes that text as unchanged.
- **The return.** `verdict: PASS` / `verdict: FAIL`, `findings_file:` and `must_fix_count:`, and *"Keep the return to those 3 lines."*
- **The PASS no-write rule.** A PASS writes no file. `plugin/instructions/plan_orchestration_instructions_autonomous.md`'s zero-finding rule and its `A1.5g` / `A2g` arms depend on it.
- **The disabled-phase return.** With the phase off, `business-parity-reviewer` returns `verdict: PASS` plus one reason line.
- **The findings folder.** The reviewer creates it only when it has findings. Every caller says *"do NOT `mkdir -p` here"*.
- **The readiness section.** The `## Phase 2 Readiness — Ordered Fix List` heading and the readiness entry form.
- **The rejected-findings rule**, with `## Rejected findings` and `rebutted round <j> — call stands`.
- **The test-run pointer.** Each definition's pointer at `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, whose `**Who may cite this.**` roster lists both.
- **The machine-path pointer.** `architecture-reviewer`'s pointer at `${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.**
- **The `## Unsolicited dispatch guidance` sections**, which are on the roster in `plugin/instructions/dispatch_discipline_instructions.md`.
- **Frontmatter.** Each `tools:` line, which `plugin/agents/README.txt`'s docs-retrieval roster and `ARCHITECTURE.md` count, and each `description:`, which `.claude/context/plugin.md` cites.
- **The conventional artifact paths** that the state-directory README templates under `cli/templates/state-dir/` and their adopted copies under `harness-runs/` describe.

**Measurement.** Up-front words are the agent definition plus every plugin file or section it reads on every dispatch. `CLAUDE.md` and the adopter's conventions documents are excluded, as in the base session's measure.
- **Reads.** Both agents read `unit_loop_core.md` → `## The test-run rule` (597 words at `6307573a`) on every dispatch. `architecture-reviewer`'s sub-case (c) read of the `test-fix-plan-writer` bullet is conditional and is excluded.
- **No read changes.** This branch edits no file under `plugin/instructions/` or `plugin/samples/`, so each agent's up-front change equals its definition's change.
- **Base counts.** The definitions measure `wc -w` 4915 (`architecture-reviewer`) and 5922 (`business-parity-reviewer`) at `6307573a`.
- **Recording.** Task 7 fills `## Up-front word counts`, and every task checks that its own file's count falls.

The verification bar for the branch as a whole belongs to the Run gates phase, not to any unit, and no task runs it. That bar is `cli/test` and `scripts/run-gates.sh` passing, including the plugin manifest under `--strict`.

**Top risks:**
- **A thinned sentence forks text other agents share word for word.** Every per-task file lists the frozen text in its range and applies only replacement texts already checked against `6307573a`. The probe that Task 1 writes and Task 7 runs as the authority checks every frozen run, bold lead and `SHARED` line mechanically.
- **A dropped rule, edge case or wire literal.** That covers a dispatch key, a verdict line, the PASS no-write rule, the reason line, a cited anchor, or the `diff_base` row `plugin/agents/README.txt` quotes. Each task checks its literals with `git grep` and the probe's literal list, and runs a rule inventory before saving.
- **The two copies of a shared block drift apart.** Tasks 1–3 each write both copies in one unit, and Task 7's no-argument probe run fails on any `SHARED` line that differs.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_plan_diff_gates/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin the `## Process` blocks both definitions share, identically in both, and write the family check probe _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Thin both definitions' intros and the `## Invocation contract` blocks they share _(layer: plugin)_ _(points: 20)_
3. [x] **Task 3** — Thin both definitions' `## Scope boundary`, `## Output contract` and `## Findings-folder / index-path convention` _(layer: plugin)_ _(points: 20)_
4. [ ] **Task 4** — Thin `architecture-reviewer`'s own `## Read first` bullet, sub-case (c) step, `## What to check` and justification rule _(layer: plugin)_ _(points: 15)_
5. [ ] **Task 5** — Thin `business-parity-reviewer`'s `## Read first`, `## Process` step 3 and parity checks (a)–(h) _(layer: plugin)_ _(points: 15)_
6. [ ] **Task 6** — Thin `business-parity-reviewer`'s checks (i)–(j), exclusion basis, obvious-reference-bug exception and dead-code carve-out _(layer: plugin)_ _(points: 10)_
7. [ ] **Task 7** — Measure both definitions, run the family check probe and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**Plan/diff gates:**`"*. That README resolves it to two passages:
- *"Run one per family … A reviewer that grades against its writer's definition is thinned in the same session as that writer. … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."*
- *"**Plan/diff gates:** architecture-reviewer and business-parity-reviewer. They share about 1 500 identical words."*

**Derivation entries.** Each command is read-only and is re-run verbatim from the repository root. C2, C3 and C3b read the base commit `6307573a`, so they reach the same sites after the branch's edits as before them. C1's file names do not change.

- **C1 — the family's definitions (command):** `grep -l -E '^name: (architecture|business-parity)-reviewer$' plugin/agents/*.md` — one site per printed file.
- **C2 — plugin files the family cites (command):** `git grep -o -h -E '\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_<>./-]+' 6307573a -- plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` — one site per distinct path printed.
- **C3 — durable files that name the family by agent name or role name (command):** `git grep -l -E 'architecture-reviewer|business-parity-reviewer|[Aa]rchitecture [Rr]eviewer|[Bb]usiness[- ][Pp]arity [Rr]eviewer' 6307573a -- . ':!harness-runs' ':!docs/work-report-research'` — one site per printed file, read with its `6307573a:` prefix removed. It excludes two trees:
  - `harness-runs/` holds the run artifacts of this repository's adopted harness, which no task edits. C3b reaches its standing READMEs.
  - `docs/work-report-research/` is the research record of an older tree, which this branch reads only as input.
- **C3b — standing state-directory READMEs that name the family (command):** `git grep -l -E 'architecture-reviewer|business-parity-reviewer|[Aa]rchitecture [Rr]eviewer|[Bb]usiness[- ][Pp]arity [Rr]eviewer' 6307573a -- 'harness-runs/*README.md'` — one site per printed file. Each is the adopted copy of a `cli/templates/state-dir/` template, so it takes its own row with `Copy` = `adopted copy`.
- **P4 — agent definitions that carry the family's frozen text (procedure).**
  - **Artifact:** the two family definitions and every other `plugin/agents/*.md`, all at `6307573a`.
  - **Traversal:** each family definition top to bottom, paragraph by paragraph (blank-line delimited), as runs of whitespace-separated words, sliding a window of ten consecutive words inside each paragraph; then each line opening with a bold lead (`**…**` after an optional list marker or table cell).
  - **Decision rule:** an agent definition outside the family is a site when one of its own paragraphs contains one of those ten-word windows, or when it contains one of those bold leads verbatim. Its disposition is `no-change`: its copy is the reference the family's copy must keep matching.

No standing tracked matrix under `harness-runs/` covers `plugin/agents/`, so no row-class entry is owed.

**Closure invariant:** every file C1, C3 and C3b print, every distinct path C2 prints and every agent definition P4's decision rule reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/architecture-reviewer.md` | — | C1, C2, C3 | `change` | Task 1 (`## Process` shared blocks); Task 2 (intro, `## Invocation contract`); Task 3 (`## Scope boundary`, `## Output contract`, `## Findings-folder / index-path convention`); Task 4 (lessons bullet, sub-case (c) step, `## What to check`, justification rule). Frontmatter, `## Resolved values` and `## Unsolicited dispatch guidance` are frozen and no task edits them |
| 2 | `plugin/agents/business-parity-reviewer.md` | — | C1, C2, C3 | `change` | Task 1 (`## Process` shared blocks); Task 2 (intro, `## Invocation contract`); Task 3 (`## Scope boundary`, `## Output contract`, `## Findings-folder / index-path convention`); Task 5 (`## Read first`, `## Process` step 3, checks (a)–(h)); Task 6 (checks (i)–(j), exclusion basis, exception, legs, outcome, dead-code carve-out). Frontmatter, the phase-gate paragraph, `## Resolved values` and `## Unsolicited dispatch guidance` are frozen and no task edits them |
| 3 | `plugin/agents/branch-reviewer.md` | — | C2, P4 | `no-change` | carries frozen copies (the no-`Edit` sentence, the mode-flag run, the excluded-count line, the phase-gate bold lead, Leg 2's precedent grep, the justification run); both scope-boundary bullets keep their `branch-reviewer.md` citation (Task 3) |
| 4 | `plugin/agents/layer-reviewer.md` | — | C2, P4 | `no-change` | carries frozen copies (the findings-folder and return-parsed bold leads, the `iteration` row, the guidance section); both styling bullets keep their `layer-reviewer.md` citation (Task 3) |
| 5 | `plugin/agents/test-fix-plan-writer.md` | — | C2, P4 | `no-change` | `## Process` → **Rewrite machine paths before quoting.** is cited by `architecture-reviewer`'s `## Read first` and sub-case (c) step; Task 4 keeps both citations |
| 6 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series; dispatch sites `### A1.5.1`, `### A2.1` and `### G.2`, whose blocks, *"do NOT `mkdir -p` here"* lines and verdict parse Tasks 2 and 3 keep |
| 7 | `plugin/instructions/task_plan_writing_instructions_core.md` | — | C2, C3 | `no-change` | dispatch sites `### 2. Business-parity review (plan-review mode)` and `### 3. Architecture review (plan-review mode)`; Task 2 keeps both cited anchors and both blocks |
| 8 | `plugin/instructions/unit_loop_core.md` | — | C2, C3 | `no-change` | its `## The test-run rule` roster lists both definitions; both keep the read and the pointer |
| 9 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` | — | C2, C3 | `no-change` | dispatch sites `## Flow` steps 7 and 8; Task 2 keeps both cited anchors (`→ step 8`, `→ `## Flow` step 7`) and both blocks |
| 10 | `.claude/context/plugin.md` | — | C3 | `no-change` | a conventions document — never a plannable target. It cites `business-parity-reviewer`'s `description:`, which is frozen frontmatter; nothing this branch does falsifies what it states |
| 11 | `ARCHITECTURE.md` | — | C3 | `no-change` | counts the `mcp__harness-docs__search_docs` grant in frontmatter `tools:` lines, which are frozen |
| 12 | `cli/templates/scripts/flows/task_plan_writing.graph.json` | template | C3 | `no-change` | names both agents and their heartbeats; no agent name changes |
| 13 | `scripts/flows/task_plan_writing.graph.json` | adopted copy | C3 | `no-change` | as row 12 |
| 14 | `cli/templates/state-dir/architecture_branch_review_point_reviews/README.md` | template | C3 | `no-change` | describes the per-item layer review of an architecture finding; no contract of the family's text |
| 15 | `harness-runs/architecture_branch_review_point_reviews/README.md` | adopted copy | C3b | `no-change` | as row 14 |
| 16 | `cli/templates/state-dir/architecture_branch_reviews/README.md` | template | C3 | `no-change` | describes the split index the implemented-solution mode writes; Task 3 keeps the index shape and the conventional path |
| 17 | `harness-runs/architecture_branch_reviews/README.md` | adopted copy | C3b | `no-change` | as row 16 |
| 18 | `cli/templates/state-dir/architecture_reviews/README.md` | template | C3 | `no-change` | describes the plan-gate flat file; Task 3 keeps the flat template and the conventional path |
| 19 | `harness-runs/architecture_reviews/README.md` | adopted copy | C3b | `no-change` | as row 18 |
| 20 | `cli/templates/state-dir/architecture_user_review_reviews/README.md` | template | C3 | `no-change` | says the reviewer learns which plan it holds from the paths it is passed, never a flag; Task 2 keeps the mode selector and the role-playing sentence |
| 21 | `harness-runs/architecture_user_review_reviews/README.md` | adopted copy | C3b | `no-change` | as row 20 |
| 22 | `cli/templates/state-dir/test_fix_plan_reviews/README.md` | template | C3 | `no-change` | says the reviewer creates the folder only when it has findings; that paragraph is frozen and no task edits it |
| 23 | `harness-runs/test_fix_plan_reviews/README.md` | adopted copy | C3b | `no-change` | as row 22 |
| 24 | `cli/templates/state-dir/test_fix_plans/README.md` | template | C3 | `no-change` | says the architecture reviewer approves the plan in plan-review mode; Task 2 keeps sub-case (c) |
| 25 | `harness-runs/test_fix_plans/README.md` | adopted copy | C3b | `no-change` | as row 24 |
| 26 | `cli/test/flow-walker-resume.test.mjs` | — | C3 | `no-change` | keys on agent names and heartbeats, never on definition prose |
| 27 | `cli/test/flow-walker-ui-and-reentry.test.mjs` | — | C3 | `no-change` | as row 26 |
| 28 | `cli/test/flow-walker.test.mjs` | — | C3 | `no-change` | as row 26 |
| 29 | `docs/flow-graph-walker.md` | — | C3 | `no-change` | `### Item 2` names the dispatch blocks' key names as wire strings the definitions quote; Task 2 leaves every block unchanged |
| 30 | `examples/notes-app/sdlc-harness/improvement_observations/feat_note_updated_at.md` | — | C3 | `no-change` | frozen capture of an adopted repository's run (`examples/notes-app/README.md`); never edited |
| 31 | `plugin/agents/README.txt` | — | C3 | `no-change` | its docs-retrieval roster lists both (frozen `tools:` lines); it quotes the `diff_base` key row and describes the mode selector, both of which Task 2 keeps |
| 32 | `plugin/agents/skeptic-reviewer.md` | — | C3, P4 | `no-change` | de-duplicates against the parity and architecture reviews at their conventional paths, which Task 3 keeps; carries frozen copies |
| 33 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | C3 | `no-change` | names the Phase A1.5 and A2 dispatches; no anchor into the family |
| 34 | `plugin/commands/branch-start-docs-autonomous.md` | — | C3 | `no-change` | names both as not run on prose; no anchor |
| 35 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | C3 | `no-change` | names both plan gates; no anchor |
| 36 | `plugin/commands/branch-start-user-review-fix-plan.md` | — | C3 | `no-change` | names both fix-plan gates and the parity phase gate; no anchor |
| 37 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | C3 | `no-change` | lists both paths; no anchor |
| 38 | `plugin/instructions/dispatch_discipline_instructions.md` | — | C3 | `no-change` | lists both on the `## Unsolicited dispatch guidance` roster; the section is frozen |
| 39 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | its zero-finding rule and the `A1.5g` / `A2g` arms rely on a PASS writing no findings index, which Task 3 keeps |
| 40 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | C3 | `no-change` | names the agents in its clarification channel; no anchor |
| 41 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | C3 | `no-change` | names the fix-plan gates; no anchor |
| 42 | `plugin/instructions/user_review_fixes_instructions_core.md` | — | C3 | `no-change` | names `architecture-reviewer` as the writer of `<test_fix_review_folder>`; Task 3 keeps that conventional path |
| 43 | `schemas/flow-graph-check/flow-graph-check-cap-matches-core.json` | — | C3 | `no-change` | flow-graph fixture naming both agents and heartbeats; no agent name changes |
| 44 | `schemas/flow-graph-check/flow-graph-check-fail-cycle-capped.json` | — | C3 | `no-change` | as row 43 |
| 45 | `schemas/flow-graph-check/flow-graph-check-findings-folder-in-core.json` | — | C3 | `no-change` | as row 43 |
| 46 | `schemas/flow-graph-check/flow-graph-check-ledger-id-known.json` | — | C3 | `no-change` | as row 43 |
| 47 | `schemas/flow-graph-check/flow-graph-check-reachable-from-start.json` | — | C3 | `no-change` | as row 43 |
| 48 | `schemas/flow-graph-check/flow-graph-check-reaches-terminal.json` | — | C3 | `no-change` | as row 43 |
| 49 | `schemas/flow-graph-check/flow-graph-check-run-mode-id-known.json` | — | C3 | `no-change` | as row 43 |
| 50 | `schemas/negative/flow-graph-schema-ask-without-resume.json` | — | C3 | `no-change` | as row 43 |
| 51 | `schemas/negative/flow-graph-schema-skip-construct-mixed.json` | — | C3 | `no-change` | as row 43 |
| 52 | `schemas/negative/flow-graph-schema-unknown-binding.json` | — | C3 | `no-change` | as row 43 |
| 53 | `schemas/negative/flow-graph-schema-unknown-outcome.json` | — | C3 | `no-change` | as row 43 |
| 54 | `plugin/agents/committer.md` | — | P4 | `no-change` | carries text P4 reaches — a ten-word window or a bold lead of a family definition; its copy is the reference the family's copy keeps matching |
| 55 | `plugin/agents/conventions-reviewer.md` | — | P4 | `no-change` | as row 54 |
| 56 | `plugin/agents/conventions-writer.md` | — | P4 | `no-change` | as row 54 |
| 57 | `plugin/agents/docs-reviewer.md` | — | P4 | `no-change` | as row 54 |
| 58 | `plugin/agents/docs-writer.md` | — | P4 | `no-change` | as row 54 |
| 59 | `plugin/agents/layer-implementer.md` | — | P4 | `no-change` | as row 54 |
| 60 | `plugin/agents/qa-tester.md` | — | P4 | `no-change` | as row 54 |
| 61 | `plugin/agents/qa-tester-mobile-maestro.md` | — | P4 | `no-change` | as row 54 |
| 62 | `plugin/agents/qa-tester-mobile-mcp.md` | — | P4 | `no-change` | as row 54 |
| 63 | `plugin/agents/review-plan-reviewer.md` | — | P4 | `no-change` | as row 54 |
| 64 | `plugin/agents/statistics-plan-writer.md` | — | P4 | `no-change` | as row 54 |
| 65 | `plugin/agents/task-plan-reviewer.md` | — | P4 | `no-change` | as row 54; its own `**Missing whole behaviour.**` and dead-code rules are separate text Tasks 5 and 6 do not touch |
| 66 | `plugin/agents/task-plan-writer.md` | — | P4 | `no-change` | as row 54 |
| 67 | `plugin/agents/ui-tests-plan-reviewer.md` | — | P4 | `no-change` | as row 54 |
| 68 | `plugin/agents/ui-tests-plan-writer.md` | — | P4 | `no-change` | as row 54 |
| 69 | `plugin/agents/user-review-fix-plan-writer.md` | — | P4 | `no-change` | as row 54 |

## Up-front word counts

Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents. Both agents also read `plugin/instructions/unit_loop_core.md` → `## The test-run rule` (597 words at `6307573a`), which this branch does not change, so the up-front change equals the definition's change. `Before` is `wc -w` at `6307573a`; Task 7 fills `After — definition` and `Δ` from the probe's `WORDS` lines. Every `Δ` must be below `0`.

| Agent | Reads counted besides the definition (unchanged) | Before — definition | After — definition | Δ |
|---|---|---|---|---|
| architecture-reviewer | `plugin/instructions/unit_loop_core.md` → `## The test-run rule` | 4915 | | |
| business-parity-reviewer | `plugin/instructions/unit_loop_core.md` → `## The test-run rule` | 5922 | | |
