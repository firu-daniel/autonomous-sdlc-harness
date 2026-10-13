# Story: Thin the UI-tests and QA family's agent prose

## Context

This branch is the **UI-tests and QA family session** of the agent-thinning series (`docs/work-report-research/README.md` → `## Follow-ups`, item 3, `**UI tests and QA:**`). It thins five definitions in one session:
- `plugin/agents/ui-tests-plan-writer.md`;
- `plugin/agents/ui-tests-plan-reviewer.md`, which grades plans against the writer's definition, so it is thinned in the same session and after the writer;
- `plugin/agents/qa-tester.md`;
- the two mobile stubs, `plugin/agents/qa-tester-mobile-maestro.md` and `plugin/agents/qa-tester-mobile-mcp.md`.

Work reports are dropped (`## User verdict` in the same README), so this is thinning only: no template, no `## Work report` section, no report storage. The research reports `docs/work-report-research/ui-tests-plan-writer.md`, `ui-tests-plan-reviewer.md`, `qa-tester.md`, `qa-tester-mobile-maestro.md` and `qa-tester-mobile-mcp.md` are input through their `## Prose classification` and `## Thinning plan` sections only, read as guidance on what is redundant. Their line numbers and word counts describe the tree before the base session and the four earlier family sessions.

The base commit for every comparison is `13a2ed4c`. The README says to measure from the current `main`; this repository's default branch is `dev`, as in the earlier family sessions, and `13a2ed4c` is `dev`'s head.

**The largest saving is a read, not a sentence**, as the README says. Today both UI-test agents read the configured driver's `qa-tester` variant whole, and the reviewer also reads the whole writer. After this branch:
- under `web-playwright`, both agents read only `qa-tester.md`'s frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section — the capability set they annotate from and grade against (Tasks 2 and 5);
- the reviewer reads only the writer's `` ## Split output spec (mirror the `task-plan-writer` exactly) `` and `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) `` sections, the contract it grades against, and may read another writer section when a finding turns on a writer rule its own file does not state (Task 5);
- under a mobile driver, the stub is still read whole.

**The standard every task applies** is `.claude/context/plugin.md` → `## Writing agent prose`:
- a rule is a direct instruction, and each rule is stated once;
- rationale the agent does not act on is dropped, and every edge case is kept;
- a wire literal or a cited anchor is never paraphrased;
- a change to an agent definition never raises its up-front word count.

**Behaviour does not change**: every rule an agent or its caller acts on today still holds after the edit. `phases.qa` is `false` in this repository, so none of the five is dispatched here. They are adopters' agents, so every gate, driver and capability rule stays. Every per-task file gives the exact old and new text of each change, checked against `13a2ed4c`. An implementer applies that text and changes nothing else.

**Research proposals this branch declines:**
- **Thinning `## Resolved values`.** The shared rows and preambles are frozen. Only rows no other definition carries are touched: `qa-tester.md`'s `<qa_port_seed>` and `<dev_server_cmd>` cells (Task 7), and each stub's `<qa_driver>` cell and one preamble clause (Task 10).
- **Removing a stub's `## Resolved values`, merging its gates into one list, or renaming its sections.** `.claude/context/plugin.md` → `## The sections an asset carries` requires the table and cites `## What this variant would drive`, and every heading is frozen.
- **Rewriting the stubs' `description:` lines.** Frontmatter is frozen: it is what a dispatcher selects on.
- **A shared base file or a new `## Driver-neutral contract` heading in `qa-tester.md`.** A base file read up front moves words rather than cutting them, and the stubs' pointer already names the inherited parts.
- **Thinning `## Unsolicited dispatch guidance`.** It is frozen roster text.
- **Moving the reviewer's grading groups behind pointers wholesale.** Only the two capability rules the writer's `### Capability guidance` already states, which the reviewer now reads up front, become pointers (Task 6). Every other Must Fix trigger stays in the reviewer.

**Frozen text** is defined at `13a2ed4c` and stays word for word in its file:
1. **Ten-word windows.** Every run of words covered by a 10-word window — ten consecutive whitespace-separated words inside one blank-line-delimited paragraph — that also occurs in an agent definition **outside** this family, plus the words between two such runs in one sentence. A sentence that holds frozen text may lose only its unfrozen words.
2. **Bold leads** (`**…**` opening a line, a list item or a table cell). A bold lead an agent definition outside the family carries verbatim stays, and so does one that two or more family definitions carry. No task removes one.
3. Every heading line.
4. Each frontmatter block.
5. **Text other files quote or grep**, each listed in the owning per-task file:
   - the stubs' declaration and stopping-loudly sentences, quoted by `ARCHITECTURE.md`;
   - the phrase `declared but not implemented in this release`, the sweep key of `cli/src/config/model.ts` → `QA_DRIVER_IMPLEMENTED`;
   - the `**Park the account you drive (so parallel QA sessions never collide on one account).**` lead, cited by `plugin/scripts/reserve-qa-user.sh` and `plugin/scripts/release-qa-user.sh`.

Each per-task file lists the frozen text inside its own range.

**Text shared only inside this family** is thinned once and written identically into every definition that carries it. The probe's `SHARED` list holds each string:
- the phase-gate sentences of the writer, `qa-tester.md` and both stubs (Tasks 1, 7, 10);
- four `## Read first` and `### Capability guidance` sentences of the writer and the reviewer (Tasks 2, 5, 6);
- the gate, scope, lifecycle and pointer text of the two stubs (Task 10).

**The family check probe.** Task 1 writes `harness-runs/scratch/ui_tests_qa_family_check.mjs`, a read-only probe that is gitignored and never committed. It checks the following against `13a2ed4c`:
- frozen text, bold leads, headings and frontmatter;
- the `SHARED` strings;
- each file's wire literals and cited anchors;
- that no file outside the five definitions changed;
- that each definition's word count and each agent's up-front read fell.

Tasks 2–10 run it on the files they edit. Run with file arguments, it reports a `SHARED` string still waiting on a later task as `SHARED-PENDING` and does not fail on it. Task 11 writes the probe again from the same text and runs it with no arguments, as the branch's authority. Run that way, every `SHARED` string must be in place and every up-front figure must have fallen.

**Anchors and behaviours other files rely on, which every task keeps:**
- **Every fenced dispatch and prompt block, key for key.**
  - The writer's three prompts are sent by `plugin/instructions/task_plan_writing_instructions_core.md` → `## UI-test-plan write loop`, by `plugin/instructions/qa_test_instructions.md` → `### 1.`, and by `plugin/instructions/user_review_fixes_instructions_core.md` → `### QA.0`. The last two quote the augment block "byte for byte" from the writer, its single source.
  - The reviewer's five keys come from `### 2. Spawn ui-tests-plan-reviewer`, and the qa-tester's block from `plugin/instructions/plan_orchestration_instructions_core.md` → `### E.1 Run QA` and `qa_test_instructions.md` → `### 3.`.
- **Every return shape**:
  - the writer's three-line return and its no-UI block;
  - `no_ui: true`, a routing signal;
  - the reviewer's `verdict: PASS` / `verdict: FAIL` + `findings_file:` + `must_fix_count:`;
  - the qa-tester's four shapes, including the parsed prefix `error: blocked — `;
  - each stub's fenced `error:` literal.
- **Cited anchors**:
  - the writer's **Augment after user-review fixes** label;
  - the reviewer's `## Process` step 0 and step 3;
  - `qa-tester.md` → `## Preconditions` step 3, "Per-single-test invocation", `### 3. A test blocked`, `### 4. The run cannot proceed` and "Park the account you drive";
  - every heading the writer and the reviewer now read by name.
- **The no-write rules.** The writer writes nothing on `no_ui` or a zero-change augment. The reviewer writes nothing on PASS and creates its findings folder only when it has findings. The qa-tester writes nothing on PASS or blocked and never writes the merged round index in per-single-test mode.
- **Frontmatter.** Each `tools:` line: the browser grant is `qa-tester.md`'s alone (`.claude/CLAUDE.md` → `## Agent authoring rules`), and `ARCHITECTURE.md` and `plugin/agents/README.txt` count the grants. Each `description:`, which `.claude/context/plugin.md` quotes.
- **The conventional artifact paths** that the state-directory README templates under `cli/templates/state-dir/` describe, and the screenshot path that `cli/templates/repo/gitignore.qa` describes.

**Out of this series and left as found.** Three orchestrator files cite `qa-tester.md` "Which user", a label the file does not carry at `13a2ed4c` (its paragraph is **Which account.**):
- `plugin/instructions/plan_orchestration_instructions_core.md`;
- `plugin/instructions/plan_orchestration_instructions_autonomous.md`;
- `plugin/instructions/qa_test_instructions.md`.

The orchestrator instruction files are outside this series, and the stale citation predates this branch.

**Measurement.** Up-front words are the agent definition plus every plugin file or section it reads on every dispatch. `CLAUDE.md` and the adopter's conventions documents are excluded, as in the base session's measure.
- **Driver-dependent reads.** The writer's and the reviewer's reads depend on `qa.driver`, so their up-front figures are recorded per driver.
- **No reads.** The qa-tester and the stubs read no plugin file up front, so their up-front figure is their definition.
- **Recording.** Task 11 fills `## Up-front word counts`, and every task checks that its own file's count falls.

The verification bar for the branch as a whole belongs to the Run gates phase, not to any unit, and no task runs it. That bar is `cli/test` and `scripts/run-gates.sh` passing, including the plugin manifest under `--strict`.

**Top risks:**
- **A narrowed read drops a rule the reader still needs.** Task 5 names the writer sections the reviewer reads, and Task 4 keeps the `## Split output spec` section stating the whole contract on its own. Tasks 2 and 5 name the `qa-tester.md` section both agents read, and Task 8 keeps it stating the whole capability set. A missing section blocks like an unreadable file, and the reviewer may widen its read when a finding needs it.
- **A thinned sentence forks text other agents share word for word, or drops a wire literal or a cited anchor.** Every per-task file lists the frozen text and the anchors in its range and applies only replacement texts checked against `13a2ed4c`. The probe that Task 1 writes and Task 11 runs as the authority checks every frozen run, bold lead, heading, literal and `SHARED` string mechanically.
- **A dropped edge case in the qa-tester's blocked-versus-failed routes or account parking.** Tasks 8 and 9 each list every route and exit code they keep and run a rule inventory before saving. Task 9 deletes the `## What you must NOT do` restatements only after confirming each rule's other home.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker** to `[x]`: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_thin_prose_family_ui_tests_qa/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Thin `ui-tests-plan-writer`'s intro and `## Invocation contract`, and write the family check probe _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Scope `ui-tests-plan-writer`'s read of the `qa-tester` variant, and thin `## No-UI determination` and `### Capability guidance` _(layer: plugin)_ _(points: 15)_
3. [ ] **Task 3** — Thin `ui-tests-plan-writer`'s `## Process` and `### Test data` _(layer: plugin)_ _(points: 15)_
4. [ ] **Task 4** — Thin `ui-tests-plan-writer` from `## Split output spec` to the end _(layer: plugin)_ _(points: 15)_
5. [ ] **Task 5** — Scope `ui-tests-plan-reviewer`'s reads of the writer and the `qa-tester` variant, and thin its intro through `## Process` _(layer: plugin)_ _(points: 15)_
6. [ ] **Task 6** — Thin `ui-tests-plan-reviewer`'s `## What to check` _(layer: plugin)_ _(points: 15)_
7. [ ] **Task 7** — Thin `qa-tester`'s intro, gates, `## Invocation contract`, `## Read first` and `## Preconditions` _(layer: plugin)_ _(points: 20)_
8. [ ] **Task 8** — Thin `qa-tester`'s `## Which MCP to use` and `## How it tests` _(layer: plugin)_ _(points: 20)_
9. [ ] **Task 9** — Thin `qa-tester`'s `## Output contract` and `## What you must NOT do` _(layer: plugin)_ _(points: 15)_
10. [ ] **Task 10** — Thin both mobile `qa-tester` stubs, identically except for their variant words _(layer: plugin)_ _(points: 15)_
11. [ ] **Task 11** — Measure the five definitions and their up-front reads, run the family check probe, and record the result in the story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/work-report-research/README.md` > `**3. Family sessions.**` > `**UI tests and QA:**`"*. That README resolves it to two passages:
- *"Run one per family … A reviewer that grades against its writer's definition is thinned in the same session as that writer. … Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input."*
- *"**UI tests and QA:** ui-tests-plan-writer, ui-tests-plan-reviewer, qa-tester and the two mobile stubs. The largest saving is reading only qa-tester's capability set."*

**Derivation entries.** Each command is read-only and is re-run verbatim from the repository root. C2, C3 and C3b read the base commit `13a2ed4c`, so they reach the same sites after the branch's edits as before them. C1's file names do not change.

- **C1 — the family's definitions (command):** `grep -l -E '^name: (ui-tests-plan-(writer|reviewer)|qa-tester(-mobile-(maestro|mcp))?)$' plugin/agents/*.md` — one site per printed file.
- **C2 — plugin files the family cites (command):** `git grep -o -h -E '\$\{CLAUDE_PLUGIN_ROOT\}/[A-Za-z0-9_<>./-]+' 13a2ed4c -- plugin/agents/ui-tests-plan-writer.md plugin/agents/ui-tests-plan-reviewer.md plugin/agents/qa-tester.md plugin/agents/qa-tester-mobile-maestro.md plugin/agents/qa-tester-mobile-mcp.md` — one site per distinct path printed, read with `${CLAUDE_PLUGIN_ROOT}/` as `plugin/`.
- **C3 — durable files that name the family by agent name or role name (command):** `git grep -l -E "qa-tester|ui-tests-plan-(writer|reviewer)|[Uu][Ii]-[Tt]est[- ][Pp]lan [Ww]riter|[Uu][Ii]-[Tt]est[- ][Pp]lan [Rr]eviewer|[Ii]nteractive[- ][Tt]est [Aa]gent|[Tt]ester(.s| agent)|QA tester" 13a2ed4c -- . ':!harness-runs' ':!docs/work-report-research'` — one site per printed file, read with its `13a2ed4c:` prefix removed.
  - The role-name alternatives reach files that rely on a family contract without naming an agent: *the tester agent*, *the tester's*, *the interactive test agent*, *the UI-test plan writer*.
  - It excludes `harness-runs/`, the run artifacts of this repository's adopted harness, which no task edits; C3b reaches its standing READMEs.
  - It excludes `docs/work-report-research/`, the research record of an older tree, which this branch reads only as input.
- **C3b — standing state-directory READMEs that name the family (command):** `git grep -l -E "qa-tester|ui-tests-plan-(writer|reviewer)|[Uu][Ii]-[Tt]est[- ][Pp]lan [Ww]riter|[Uu][Ii]-[Tt]est[- ][Pp]lan [Rr]eviewer|[Ii]nteractive[- ][Tt]est [Aa]gent|[Tt]ester(.s| agent)|QA tester" 13a2ed4c -- 'harness-runs/*README.md'` — one site per printed file. Each is the adopted copy of a `cli/templates/state-dir/` template, so it takes its own row with `Copy` = `adopted copy`.
- **P4 — agent definitions that carry the family's frozen text (procedure).**
  - **Artifact:** the five family definitions and every other `plugin/agents/*.md`, all at `13a2ed4c`.
  - **Traversal:** each family definition top to bottom, paragraph by paragraph (blank-line delimited), as runs of whitespace-separated words, sliding a window of ten consecutive words inside each paragraph; then each line opening with a bold lead (`**…**` after an optional list marker or table cell).
  - **Decision rule:** an agent definition outside the family is a site when one of its own paragraphs contains one of those ten-word windows, or when it contains one of those bold leads verbatim. Its disposition is `no-change`: its copy is the reference the family's copy must keep matching.

No standing tracked matrix under `harness-runs/` covers `plugin/agents/`, so no row-class entry is owed.

**Closure invariant:** every file C1, C3 and C3b print, every distinct path C2 prints and every agent definition P4's decision rule reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/ui-tests-plan-writer.md` | — | C1, C2, C3 | `change` | Task 1 (intro, gate, `## Invocation contract` prose); Task 2 (`## Read first` scoped variant read, `## No-UI determination`, `### Capability guidance`); Task 3 (`## Process`, `### Test data`); Task 4 (`## Split output spec` to the end). Frontmatter, `## Resolved values`, the prompt blocks and the rejected-findings paragraph are frozen and no task edits them |
| 2 | `plugin/agents/ui-tests-plan-reviewer.md` | — | C1, C3 | `change` | Task 5 (intro, `ui_test_index` key row, `## Read first` scoped reads of the writer and the variant, `## Process`); Task 6 (`## What to check`). Frontmatter, `## Resolved values`, the dispatch block, `## Unsolicited dispatch guidance` and `## Output contract` are frozen and no task edits them |
| 3 | `plugin/agents/qa-tester.md` | — | C1, C2, C3 | `change` | Task 7 (gates, browser grant, two own `## Resolved values` cells, `## Invocation contract`, `## Read first`, `## Preconditions`); Task 8 (`## Which MCP to use`, `## How it tests`); Task 9 (`## Output contract`, `## What you must NOT do`). Frontmatter, the dispatch block, every return literal and `## Unsolicited dispatch guidance` are frozen |
| 4 | `plugin/agents/qa-tester-mobile-maestro.md` | — | C1, C2, C3 | `change` | Task 10, identically with the mcp stub except for variant words. Frontmatter, the `error:` literal, the declaration and stopping-loudly sentences and every heading are frozen |
| 5 | `plugin/agents/qa-tester-mobile-mcp.md` | — | C1, C2, C3 | `change` | Task 10, identically with the maestro stub except for variant words. Frontmatter, the `error:` literal, the declaration and stopping-loudly sentences and every heading are frozen |
| 6 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series. `### E.1 Run QA` sends the dispatch block and parses the four return shapes; it cites `qa-tester.md` → `## Preconditions` step 3, "Per-single-test invocation" and `### 3. A test blocked`. Tasks 7 and 9 keep all of them. Its `(qa-tester.md, "Which user")` citation already names no label at `13a2ed4c` (the paragraph is **Which account.**); that is pre-existing and not this branch's |
| 7 | `plugin/instructions/qa_test_instructions.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series. `### 1.` quotes the initial-write and augment blocks byte for byte from the writer's `## Invocation contract` (Task 1 keeps every block). `### 3.` sends the qa-tester dispatch block and cites `## Preconditions` and `### 3. A test blocked` (Tasks 7 and 9 keep them). Its "Which user" citation is pre-existing |
| 8 | `plugin/instructions/task_plan_writing_instructions_core.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series. `## UI-test-plan write loop` sends the writer's initial and revision blocks and the reviewer's five keys, quotes the `n/a (<qa_driver> variant declares no capability set)` marker and the no-`mkdir -p` rule, and parses `no_ui: true` and the verdict lines. Tasks 1, 2, 4 and 5 keep all of them |
| 9 | `plugin/instructions/user_review_fixes_instructions_core.md` | — | C2, C3 | `no-change` | an orchestrator file, out of this series. `### QA.0` quotes the augment block from the writer's `## Invocation contract` ("its single source"), cites the "Augment after user-review fixes" label, the zero-change byte-identical rule and `no_ui: true`, and cites `qa-tester.md` → `## Output contract` and `## Preconditions`. Tasks 1, 7 and 9 keep each |
| 10 | `plugin/scripts/release-qa-user.sh` | — | C2, C3 | `no-change` | its header cites `plugin/agents/qa-tester.md` ("Park the account you drive"); Task 8 keeps that bold lead and the release call |
| 11 | `plugin/scripts/reserve-qa-user.sh` | — | C2, C3 | `no-change` | its header cites "Park the account you drive" and says the agent branches on all four exit codes; Task 8 keeps the lead and all four exit-code bullets |
| 12 | `.claude/context/conventions.md` | — | C3 | `no-change` | a conventions document — never a plannable target. It names the interactive-test agent's own grant (`plugin/agents/README.txt`); the `tools:` lines are frozen, and nothing this branch does falsifies what it states |
| 13 | `.claude/context/plugin.md` | — | C3 | `no-change` | a conventions document — never a plannable target. It quotes the reviewer's `description:` (frozen), says the stubs carry no contract pair and carry `## What this variant would drive` (Task 10 keeps both), names the driver gate returning a blocker that names the configured driver (Task 7 keeps it), and says the writer owns capability tagging and `qa-tester.md` the `browser_route` call (Tasks 2 and 8 keep both). Nothing it states is falsified |
| 14 | `ARCHITECTURE.md` | — | C3 | `no-change` | §10 quotes each stub's *"This file is a **declaration**: …"* and *"Stopping loudly is the point. …"* sentences, which Task 10 keeps byte for byte; its tool roster counts the frozen `tools:` lines |
| 15 | `ROADMAP.md` | — | C3 | `no-change` | the Mobile QA drivers row names the role only |
| 16 | `cli/src/config/check.ts` | — | C3 | `no-change` | names the interactive test agent in the `qa.driver` explanation; relies on no definition text |
| 17 | `cli/src/config/model.ts` | — | C3 | `no-change` | `QA_DRIVER_IMPLEMENTED` names `declared but not implemented in this release` as the sweep key over `plugin`; every family file that carries the phrase at `13a2ed4c` keeps it (the probe's `LITERAL` list) |
| 18 | `cli/src/doctor/checks.ts` | — | C3 | `no-change` | its text that a namespace deny revokes the interactive-test agent's own grant relies on the frozen `tools:` lines |
| 19 | `cli/src/generators/harnessConfig.ts` | — | C3 | `no-change` | `settleQaDriver`'s warning names the role and the not-implemented status; no definition text |
| 20 | `cli/src/generators/permissionProfile.ts` | — | C3 | `no-change` | its grant-closure comments rely on the frozen `tools:` lines |
| 21 | `cli/src/generators/repoRoot.ts` | — | C3 | `no-change` | relies on the stubs' built-ins-only allowlists (frozen) and on the screenshot destination under the run-artifact tree, which Task 8 keeps |
| 22 | `cli/templates/claude/settings.autonomous.json` | template | C3 | `no-change` | its `_README` grant-closure text relies on the frozen `tools:` lines |
| 23 | `cli/templates/claude/settings.autonomous.qa.json` | template | C3 | `no-change` | its `_README` says the agent documents the one way `browser_evaluate` goes wrong and grants `browser_route`; Task 8 keeps the hang rule, the grant check and the `_README` citation |
| 24 | `cli/templates/repo/README.md` | template | C3 | `no-change` | says the mobile variants ship built-ins-only allowlists; the frontmatter is frozen |
| 25 | `cli/templates/repo/gitignore.qa` | template | C3 | `no-change` | describes where the agent is told to send a screenshot; Task 8 keeps `<state_dir>/qa_artifacts/<branch>/qa_<test-id>.png` |
| 26 | `cli/templates/scripts/flows/task_plan_writing.graph.json` | template | C3 | `no-change` | dispatches the writer and reviewer by agent name and heartbeat; no `name:` line changes |
| 27 | `cli/templates/state-dir/qa_reviews/README.md` | template | C3 | `no-change` | relies on the tester's `## Preconditions`, the namespaced per-dispatch artefacts, the caller-owned merged index and the folder created only on findings; Tasks 7 and 9 keep each. No adopted copy exists under `harness-runs/` (`phases.qa` is `false` here) |
| 28 | `cli/templates/state-dir/story_plans/README.md` | template | C3 | `no-change` | says the UI-test plan writer reads the story index as an input; Task 2 keeps the story-index bullet of `## Read first` |
| 29 | `cli/templates/state-dir/task_prompts/README.md` | template | C3 | `no-change` | says the UI-test plan reviewer's completeness check runs against the task prompt; the `prompt_path` key row is frozen and `### Completeness (Must Fix)` is not edited |
| 30 | `cli/templates/state-dir/ui_test_plan_reviews/README.md` | template | C3 | `no-change` | relies on the reviewer's no-`Edit` allowlist and own-file-only write (frozen), each Must Fix naming a file (frozen), a PASS touching no disk, and the absent-index PASS that is not a finding (Task 5 keeps step 0). No adopted copy exists under `harness-runs/` |
| 31 | `cli/templates/state-dir/ui_test_plans/README.md` | template | C3 | `no-change` | relies on the writer authoring the whole set in one invocation (Task 1 keeps it), the absent-index signal and no empty index (Task 2 keeps it), and the reviewer grading before the run. No adopted copy exists under `harness-runs/` |
| 32 | `cli/test/flow-walker-resume.test.mjs` | — | C3 | `no-change` | asserts agent names and heartbeats from the graph and the core, never definition prose |
| 33 | `cli/test/flow-walker-ui-and-reentry.test.mjs` | — | C3 | `no-change` | asserts agent names, heartbeats and the core's `No-UI short-circuit` text, never definition prose |
| 34 | `cli/test/flow-walker.test.mjs` | — | C3 | `no-change` | asserts agent names and the core's text, never definition prose |
| 35 | `cli/test/init.test.mjs` | — | C3 | `no-change` | asserts `init`'s own output carries *declared but not implemented*; names the role in comments only |
| 36 | `cli/test/profile.test.mjs` | — | C3 | `no-change` | its grant-closure comments rely on the frozen `tools:` lines |
| 37 | `docs/cli.md` | — | C3 | `no-change` | §2 and §6 say the mobile variants ship built-ins-only allowlists and describe the grant closure; the frontmatter is frozen |
| 38 | `docs/config.md` | — | C3 | `no-change` | the `qa.driver` row names the role only |
| 39 | `docs/flow-graph-walker.md` | — | C3 | `no-change` | lists both UI-test definitions among the agents that cite core contracts and counts core section words; no definition anchor changes |
| 40 | `docs/second-runtime-port-decision.md` | — | C3 | `no-change` | names the writer and the reviewer's `verdict: PASS`, which is frozen |
| 41 | `examples/notes-app/.claude/settings.autonomous.json` | — | C3 | `no-change` | frozen capture of an adopted repository (`.claude/context/conventions.md` → `## Documents of record`); never edited |
| 42 | `examples/notes-app/.gitignore` | — | C3 | `no-change` | the example's generated ignore file; its screenshot comment describes the path Task 8 keeps |
| 43 | `examples/notes-app/sdlc-harness/flow_progress/feat_note_updated_at_progress.md` | — | C3 | `no-change` | frozen capture (`.claude/context/conventions.md` → `## Documents of record`); never edited |
| 44 | `examples/notes-app/sdlc-harness/ui_test_plans/feat_note_updated_at_ui_test_plan.md` | — | C3 | `no-change` | frozen capture of a plan the writer produced; never edited, and no criterion introduced after its date grades it |
| 45 | `plugin/agents/README.txt` | — | C3 | `no-change` | describes the three-file split, the driver gate's blocked `error:`, what each stub carries (frontmatter, allowlist, what it would drive, a pointer to `qa-tester.md`) and the browser closure; Tasks 7 and 10 keep each, and the `tools:` lines are frozen |
| 46 | `plugin/agents/committer.md` | — | C3, P4 | `no-change` | names `qa-tester` as the PASS behind `mode: ui_test_pass`; also carries text P4 reaches (a ten-word window or bold lead of a family definition), and its copy is the reference the family's copy keeps matching |
| 47 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | C3 | `no-change` | names the qa-tester dispatch; no anchor |
| 48 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` | — | C3 | `no-change` | names the writer's augment and the qa-tester; no anchor |
| 49 | `plugin/commands/branch-qa-test.md` | — | C3 | `no-change` | names the qa-tester's driver-gate terminal outcome and its single dispatch name; Task 7 keeps the gate |
| 50 | `plugin/commands/branch-start-docs-autonomous.md` | — | C3 | `no-change` | names the writer as absent from that flow; no anchor |
| 51 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | C3 | `no-change` | names the writer/reviewer loop and the split plan; no anchor |
| 52 | `plugin/commands/branch-start-plan.md` | — | C3 | `no-change` | dispatches the writer with its initial-write prompt; Task 1 keeps the block |
| 53 | `plugin/commands/harness-analyze.md` | — | C3 | `no-change` | says the interactive-test agents ask for the test-attribute convention; Tasks 2, 5 and 7 keep each agent's conventions-document read |
| 54 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | C3 | `no-change` | lists the family's files and states the grant closure; no anchor, and the `tools:` lines are frozen |
| 55 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` | — | C3 | `no-change` | names the role and states the grant closure; the `tools:` lines are frozen |
| 56 | `plugin/hooks/allow-qa-credentials-read.sh` | — | C3 | `no-change` | its header relies on `qa-tester.md` saying to read the credentials file directly; Task 8 keeps **Where credentials come from.** and its direct read |
| 57 | `plugin/instructions/README.md` | — | C3 | `no-change` | names the agents the instructions dispatch; no anchor |
| 58 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | C3 | `no-change` | ledger `P2` names the reviewer's PASS or `no_ui`; both are frozen or kept (Tasks 4, 5) |
| 59 | `plugin/instructions/dispatch_discipline_instructions.md` | — | C3 | `no-change` | its roster lists the reviewer and the qa-tester as carrying `## Unsolicited dispatch guidance`, which is frozen |
| 60 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | names `qa-tester` as not dispatched there; no anchor |
| 61 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | C3 | `no-change` | an orchestrator file, out of this series. It says the QA-user reservation is the qa-tester's (Task 8 keeps the parking protocol) and names the writer's QA.0 return; its "Which user" citation is pre-existing |
| 62 | `plugin/instructions/run_mode_instructions.md` | — | C3 | `no-change` | names the reviewer among the structural plan reviewers; no anchor |
| 63 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | C3 | `no-change` | routes the writer's `## Questions` and `no_ui: true` returns and the reviewer's `verdict: PASS`; Tasks 1 and 4 keep the first two, and the third is frozen |
| 64 | `plugin/instructions/unit_loop_core.md` | — | C3 | `no-change` | row `E.3` reads the merged QA index and the namespaced `finding_t<T>_<M>.md` files; Task 9 keeps the names and the caller-owned merge |
| 65 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | C3 | `no-change` | says the credentials file is the qa-tester's to read (Task 8 keeps it) and routes the writer's `## Questions` (kept) |
| 66 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` | — | C3 | `no-change` | routes the writer's `## Questions` section, which Task 4 keeps |
| 67 | `plugin/samples/sample_task_plan.md` | — | C3 | `no-change` | says the writer's body states the per-test file's own sections; Task 4 keeps `**(b) One self-contained per-test file**` and its seven fields |
| 68 | `plugin/scripts/README.md` | — | C3 | `no-change` | says the QA-user pair is named in the `qa-tester.md` body with `${CLAUDE_PLUGIN_ROOT}`; Task 8 keeps both invocation literals |
| 69 | `schemas/flow-graph-check/flow-graph-check-cap-matches-core.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 70 | `schemas/flow-graph-check/flow-graph-check-fail-cycle-capped.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 71 | `schemas/flow-graph-check/flow-graph-check-findings-folder-in-core.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 72 | `schemas/flow-graph-check/flow-graph-check-ledger-id-known.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 73 | `schemas/flow-graph-check/flow-graph-check-reachable-from-start.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 74 | `schemas/flow-graph-check/flow-graph-check-reaches-terminal.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 75 | `schemas/flow-graph-check/flow-graph-check-run-mode-id-known.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 76 | `schemas/harness.config.schema.json` | — | C3 | `no-change` | the `qa.driver` `description` names the role and the not-implemented status; relies on no definition text |
| 77 | `schemas/negative/flow-graph-schema-ask-without-resume.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 78 | `schemas/negative/flow-graph-schema-skip-construct-mixed.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 79 | `schemas/negative/flow-graph-schema-unknown-binding.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 80 | `schemas/negative/flow-graph-schema-unknown-outcome.json` | — | C3 | `no-change` | a flow-graph fixture whose nodes dispatch the writer and reviewer by name; no `name:` line changes |
| 81 | `scripts/flows/task_plan_writing.graph.json` | adopted copy | C3 | `no-change` | the adopted copy of `cli/templates/scripts/flows/task_plan_writing.graph.json`; dispatches by agent name, and no `name:` line changes |
| 82 | `harness-runs/story_plans/README.md` | adopted copy | C3b | `no-change` | the adopted copy of `cli/templates/state-dir/story_plans/README.md`; same reliance, kept by Task 2 |
| 83 | `harness-runs/task_prompts/README.md` | adopted copy | C3b | `no-change` | the adopted copy of `cli/templates/state-dir/task_prompts/README.md`; same reliance, frozen |
| 84 | `plugin/agents/architecture-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches (a ten-word window or bold lead of a family definition); its copy is the reference the family's copy keeps matching |
| 85 | `plugin/agents/branch-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 86 | `plugin/agents/business-parity-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 87 | `plugin/agents/conventions-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 88 | `plugin/agents/conventions-writer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 89 | `plugin/agents/docs-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 90 | `plugin/agents/docs-writer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 91 | `plugin/agents/layer-implementer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 92 | `plugin/agents/layer-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 93 | `plugin/agents/review-plan-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 94 | `plugin/agents/skeptic-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 95 | `plugin/agents/statistics-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 96 | `plugin/agents/task-plan-reviewer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 97 | `plugin/agents/task-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching. The writer's two pointers at it (`` Same shape as the `task-plan-writer`'s revision mode. `` and the `## Questions` "same discipline" clause) stay |
| 98 | `plugin/agents/test-fix-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |
| 99 | `plugin/agents/user-review-fix-plan-writer.md` | — | P4 | `no-change` | carries text P4 reaches; its copy is the reference the family's copy keeps matching |

## Up-front word counts

Up-front words are the agent definition plus every plugin file or section it reads on every dispatch, excluding `CLAUDE.md` and the adopter's conventions documents. `Before` is `wc -w` at `13a2ed4c`; Task 11 fills `After` and `Δ` from the probe's `WORDS` and `UPFRONT` lines. Every `Δ` must be below `0`.

**Definitions.** `qa-tester`, `qa-tester-mobile-maestro` and `qa-tester-mobile-mcp` read no plugin file up front, so for them this row is also the up-front figure.

| Agent | Before — definition | After — definition | Δ |
|---|---|---|---|
| ui-tests-plan-writer | 5662 | | |
| ui-tests-plan-reviewer | 4326 | | |
| qa-tester | 7921 | | |
| qa-tester-mobile-maestro | 1186 | | |
| qa-tester-mobile-mcp | 1340 | | |

**Up-front, per driver.**
- **Before:** the writer reads the driver's variant whole; the reviewer reads the variant and the writer whole.
- **After:** under `web-playwright`, the variant read is `qa-tester.md`'s frontmatter plus `## Which MCP to use (per-test selection rule — follow verbatim)`, and under a mobile driver the stub whole. The reviewer's writer read is the writer's `` ## Split output spec (mirror the `task-plan-writer` exactly) `` and `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) `` sections.

| Agent | `qa.driver` | Before — up-front | After — up-front | Δ |
|---|---|---|---|---|
| ui-tests-plan-writer | `web-playwright` | 13583 | | |
| ui-tests-plan-writer | `mobile-maestro` | 6848 | | |
| ui-tests-plan-writer | `mobile-mcp` | 7002 | | |
| ui-tests-plan-reviewer | `web-playwright` | 17909 | | |
| ui-tests-plan-reviewer | `mobile-maestro` | 11174 | | |
| ui-tests-plan-reviewer | `mobile-mcp` | 11328 | | |
