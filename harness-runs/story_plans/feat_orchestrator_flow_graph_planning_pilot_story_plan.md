# Story: Flow-graph planning pilot: the task-plan loop's routing moves from prose into a declared graph and a walker

## Context

This branch moves the planning loop's **routing** out of the prose in `plugin/instructions/task_plan_writing_instructions_core.md` and into a declared flow graph walked by a small script. The **judgement** stays with the orchestrator, which still runs the loop in the same session. The walker owns the next node, the one shared `iteration` counter and its cap of 5, both skip semantics, each gate's `iteration:` argument and the escalation payload. The orchestrator still dispatches, passes each verdict back, applies the mode-contract bindings and composes every prompt under the dispatch discipline. The pilot covers this one flow and changes none of its behaviour: gate order, the cap, the re-run-every-gate rule, the two skip semantics, the payload and the ledger entries all stay as the core states them at this branch's merge base.

Four decisions shape the cut. They are recorded with their reasons by Task 16.

- **The walker is bash 3.2 plus `jq` 1.5.** Those are what `doctor` already checks, so no new `doctor` check is needed.
- **The walker ships as an outer-loop script.** It lives at `cli/templates/scripts/flow-walker.sh`, and `init` copies it into the adopter's `scriptsDir`. It is granted in the generated autonomous profile through an `agentInvocable` row, and it finds its graph **beside itself** by flow id: `flows/task_plan_writing.graph.json`. Every call is therefore one plain literal command, and the orchestrator never has to resolve the plugin root.
- **Each node's dispatch block stays in the core.** Its key names are wire strings the planning agents quote. The walker supplies values, never lines.
- **The safety contract stays an orchestrator step.** It covers the STOP check, the `.dispatch_counter` increment and, in the autonomous fork, the PAUSE check. PAUSE sits between STOP and the increment and needs a judgement, and the halt messages name a binding the walker must not resolve.

The walker's own state is machine-local at `<state_dir>/.flow_walker_state`, ignored like `.dispatch_counter`, and never a second phase record. `start` resets it, which is what re-entry does to `iteration` today.

The tasks run in the configured layer order, `cli` → `plugin` → `general`. The `cli` tasks write the graph (Task 1), the library reader (Task 2), the gate library (Task 3) and the walker (Task 4). Task 5 ships them through `init`. Tasks 6 and 7 test the walker against expected action sequences written from the **pre-change** core's sentences, never from the graph, and Task 8 names it in the package's text. The `plugin` tasks rewrite the core around the walker, keeping every cited heading and `## Setup` steps 1–6 byte-identical (Task 9), then repoint the forks (Task 10), the commands and the flow overview (Task 11). The catch-all `general` tasks formalise and check what the layers below built:

- Task 12 writes the JSON schema, its negatives (in `schemas/negative/`) and the static-check fixtures (in their own `schemas/flow-graph-check/`, since they are schema-valid).
- Task 13 writes the seven-check static checker, whose `cap-matches-core` holds the graph's cap in agreement with the two cap descriptions the core keeps.
- Task 14 wires both into `scripts/run-gates.sh`.
- Task 15 mirrors the scripts into this self-adopted checkout.
- Task 16 records the decisions and the core's measured size.
- Task 17 adds the three new outer-loop files to `docs/watcher.md` §2, the table of record for that set.

**Top risks:**

- **The walker quietly changes routing.** This is the likeliest failure. Tasks 6 and 7 guard it: every expectation is a literal quoted from the pre-change core, including the parity gate's run-mode-before-config order and the UI loop's config-before-run-mode order, and mutation checks prove the cases bite.
- **A citer is stranded.** The corpus quotes the core's headings and step numbers from many files. Task 9 keeps each of those anchors byte-identical, and the Scope register below re-derives the citer set by command.
- **An unattended run stalls on the walker's own command.** Task 4 keeps all three invocation forms free of every construct the script-allowlist guard refuses, and verifies that against the guard's `REPRO`. Task 5 grants the walker in the profile's three forms.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** Each entry resolves 1:1 to `harness-runs/task_plans/feat_orchestrator_flow_graph_planning_pilot/task_<K>_plan.md`. Entries are ordered by ship sequence, in the configured layer order with the catch-all `general` layer last.

**Only the committing role flips a marker `[ ]` → `[x]`:** the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only. The committer never touches them.

1. [x] **Task 1** — Declare the task-plan-writing flow graph beside the walker _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Add a `phases.*` reader to the outer-loop library _(layer: cli)_ _(points: 8)_
3. [x] **Task 3** — Add the walker's gate library `lib/flow-walker-gates.sh` _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Add the walker `flow-walker.sh` _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Ship the walker and its graph through `init`: table rows, run-control ignore rule, profile entries _(layer: cli)_ _(points: 15)_
6. [x] **Task 6** — Walker tests: the task-plan loop, derived from the pre-change core _(layer: cli)_ _(points: 20)_
7. [x] **Task 7** — Walker tests: the UI-test loop, re-entry and the re-print subcommand _(layer: cli)_ _(points: 15)_
8. [x] **Task 8** — Name the walker in the cli package's adopter-facing text _(layer: cli)_ _(points: 8)_
9. [x] **Task 9** — Rewrite the planning core around the walker _(layer: plugin)_ _(points: 20)_
10. [x] **Task 10** — Repoint the two planning forks at the rewritten core _(layer: plugin)_ _(points: 12)_
11. [x] **Task 11** — Repoint the planning commands and the flow overview _(layer: plugin)_ _(points: 12)_
12. [x] **Task 12** — Flow-graph schema, its negative fixtures and the static-check fixtures _(layer: general)_ _(points: 20)_
13. [ ] **Task 13** — Static checker `scripts/check-flow-graph.sh` _(layer: general)_ _(points: 18)_
14. [ ] **Task 14** — Wire the flow-graph checks into `scripts/run-gates.sh` and `docs/development.md` §5 _(layer: general)_ _(points: 10)_
15. [ ] **Task 15** — Mirror the walker into this checkout's `scripts/` and ignore its state _(layer: general)_ _(points: 8)_
16. [ ] **Task 16** — Record the pilot's decisions and measurements in `docs/flow-graph-walker.md` _(layer: general)_ _(points: 15)_
17. [ ] **Task 17** — Add the walker, its gate library and its graph to `docs/watcher.md` §2 _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Re-derive every file that cites the moved anchors: `grep -rn "task_plan_writing_instructions_core" plugin cli/templates`."*

This plan also changes which files the outer-loop set holds, so a second site class covers every durable text that enumerates that set.

**Derivation entry A — citers of the planning core, in the predicate's own trees (command).** Re-run verbatim: `grep -rln "task_plan_writing_instructions_core" plugin cli/templates`

**Derivation entry B — citers of the planning core, everywhere else (command).** Re-run verbatim: `git grep -ln "task_plan_writing_instructions_core" -- . ':!harness-runs' ':!plugin' ':!cli/templates'`

**Derivation entry C — texts that enumerate the outer-loop script set, or state which of its rows are agent-invocable (command).** Re-run verbatim: `git grep -lE "docs-retrieval server launcher|agent-invocable|Profile allow entry|LEFT ALLOWED|stay allowed|OUTER_LOOP_SCRIPT_FILES" -- . ':!harness-runs' ':!examples'`. It keeps the round-0 pattern as one alternative, so it reaches every site the round-0 entry reached. Its other alternatives reach the enumerations that list the set without that phrase: the `docs/watcher.md` §2 table's header, every text that says which rows are agent-invocable, the guard's `LEFT ALLOWED` comment and `plugin/hooks/README.md`'s *"stay allowed"* list of the outer-loop scripts the guard leaves allowed, and `cli/test/init.test.mjs`'s hand-spelled `OUTER_LOOP_SCRIPT_FILES` exclusion list. Task 5 adds a `yes` row and two further outer-loop files, so each of those texts is a candidate.

**Derivation entry D — standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** the lessons ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each, skipping the template line and the worked example the file itself marks as not a lesson.
- **Decision rule:** a rule is reached when it governs a kind of surface this plan writes: adopter-facing command text, a measured figure behind a decision, or a decision record.

**Closure invariant:** every site any of the four entries reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/instructions/task_plan_writing_instructions_core.md` (the file the predicate names) | — | predicate subject | `change` | Task 9 |
| 2 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → opening paragraph, `## Mode contract — bindings` `<escalate>` row (*"`## Stop conditions` entries 4–7"*), `## Override 5`, `## What this file does NOT redefine` (including *"its six steps"*) | — | entry A | `change` | Task 10 |
| 3 | `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` → `## Mode contract — bindings` `<escalate>` row (*"the one-paragraph non-convergence summary the core's site words"*), `## What this fork does NOT redefine` (including *"its six steps"*) | — | entry A | `change` | Task 10 |
| 4 | `plugin/commands/branch-start-plan-autonomous.md` → step `5. **Planning loop.**`, the `**Planning**` bullet and the `## Resolved values` `<scripts_dir>` row | — | entry A | `change` | Task 11 |
| 5 | `plugin/commands/branch-start-plan-semi-autonomous.md` → step 3 (*"The canonical loop — … the iteration caps …"*) and `## Resolved values` (a new `<scripts_dir>` row) | — | entry A | `change` | Task 11 |
| 6 | `plugin/docs/AUTONOMOUS_FLOW.md` → the `Planning **core**` table row | — | entry A | `change` | Task 11 |
| 7 | `plugin/instructions/dispatch_discipline_instructions.md` → `## Activation` | — | entry A | `no-change` | names the core file only; the file keeps its path and still activates the policy at its dispatch sites |
| 8 | `plugin/instructions/run_mode_instructions.md` → `## Activation` | — | entry A | `no-change` | names the core file only; the core still re-reads the run mode before each gate, now through the walker's ledger read or the `--skipped` re-read |
| 9 | `plugin/instructions/mode_contract.md` → `## Binding vocabulary` `<ask>` row and `## Which files use this` | — | entry A | `no-change` | the `<ask>` row's *"`## Loop` holds that present-and-stop handling today, at its writer-dispatch step"* stays true, because Task 9 keeps the `## Questions` rule in `### 1.`; the list names the file only |
| 10 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **(a) Plan-convergence gates** | — | entry A | `no-change` | cites the core's `## Setup (once per session)` paths table, which Task 9 keeps byte-identical |
| 11 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → the safety-contract and counter-reset paragraphs | — | entry A | `no-change` | cites `## Safety contract` and `## Setup` step 4; both are kept with their numbering and content |
| 12 | `plugin/agents/task-plan-writer.md` → `## Invocation contract` | — | entry A | `no-change` | cites `## Loop` step 1 and quotes its two prompts, both kept verbatim |
| 13 | `plugin/agents/task-plan-reviewer.md` → `## Invocation contract` | — | entry A | `no-change` | cites `### 4. Spawn \`task-plan-reviewer\``, which is kept; its routing sentence describes caller behaviour the walker reproduces, and its return wire strings are unchanged |
| 14 | `plugin/agents/business-parity-reviewer.md` → insertion point 1 | — | entry A | `no-change` | cites `### 2. Business-parity review (plan-review mode)`, which is kept |
| 15 | `plugin/agents/architecture-reviewer.md` → insertion point 1 | — | entry A | `no-change` | cites `### 3. Architecture review (plan-review mode)`, which is kept |
| 16 | `plugin/agents/ui-tests-plan-reviewer.md` → `## Invocation contract` | — | entry A | `no-change` | cites `## UI-test-plan write loop` → `### 2.`, which is kept |
| 17 | `plugin/agents/ui-tests-plan-writer.md` → `## Invocation contract` (initial and revision prompts) | — | entry A | `no-change` | cites UI loop step 1 and quotes its prompts, both kept verbatim |
| 18 | `.claude/context/plugin.md` → naming and citation examples | — | entry B | `no-change` | conventions document: never a task target; the examples naming the core stay true, and the staleness it does carry is raised in `## Corpus staleness` |
| 19 | `evals/plan-shape/scaffold.sh` → the comment citing `## Setup` step 2 | — | entry B | `no-change` | `## Setup` step 2 and its table are kept byte-identical |
| 20 | `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS`, `OuterLoopScript.agentInvocable` | — | entry C | `change` | Task 5 |
| 21 | `cli/test/outer-loop-scripts.test.mjs` | — | entry C | `change` | Task 5 |
| 22 | `cli/README.md` → the outer-loop enumeration sentence | — | entry C | `change` | Task 8 |
| 23 | `cli/templates/scripts/README.md` → *"**The other family in this directory is not generated.**"* | — | entry C | `change` | Task 8 |
| 24 | `cli/templates/claude/settings.autonomous.json` → `_README` entry *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS …"* | — | entry C | `change` | Task 8 |
| 25 | `docs/cli.md` → *"**Two families land in `scriptsDir`…**"* | — | entry C | `change` | Task 16 |
| 26 | `harness-runs/lessons.md` → *Adopter-facing documentation*: "Every command an adopter is meant to run sits in a fenced block…" | — | entry D, governs adopter-facing command text | `no-change` | a constraint honoured by Tasks 8, 14 and 16, not a site they edit; the ledger's only writer is the fix-plan step |
| 27 | `harness-runs/lessons.md` → *Adopter-facing documentation*: "Name an adopter-facing surface with the term adopters already arrive with…" | — | entry D, governs adopter-facing naming | `no-change` | a constraint: the adopter-facing names are the task prompt's own (*flow graph*, *walker*), and no wire identifier is renamed |
| 28 | `harness-runs/lessons.md` → *Evidence and measurement*: "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision…" | — | entry D, governs a measured figure | `no-change` | a constraint honoured by Task 16, which measures the real core file with the command it states |
| 29 | `harness-runs/lessons.md` → *Evidence and measurement*: "A decision rule's outcome is a proposal to the maintainer…" | — | entry D, governs a decision record | `no-change` | a constraint honoured by Task 16's *second flow* section, which adds no roadmap row and no pending work |
| 30 | `plugin/docs/AUTONOMOUS_FLOW.md` → the `\| Git wrappers — the outer-loop scripts an agent may invoke \|` row (*"the rows the shipped table marks agent-invocable"*) | — | entry C (`agent-invocable`) | `change` | Task 11: the git wrappers become *among* the agent-invocable rows, beside the walker row Task 11 adds |
| 31 | `docs/watcher.md` → `## 2. The scripts`: the `\| File \| What it does \| Who runs it \| Profile allow entry \|` table and the paragraph *"**Why only four carry a profile entry, and why that is not the reachability answer.**"* | — | entry C (`Profile allow entry`) | `change` | Task 17 |
| 32 | `docs/outer-loop-verification.md` → `## 3. The allow/deny surface`: *"**Which outer-loop scripts carry a generated permission entry, and which an agent can actually run.** **Four** rows have `agentInvocable: true`…"* and the round note *"**Driven 2026-09-03, re-run whole for this round…**"* | — | entry C (`agent-invocable`) | `no-change` | a dated measurement record: it states what §0's fixture returned in the round it names. Rewriting its counts without re-driving that fixture would falsify the record (`.claude/context/conventions.md` → `## Documents of record`, *"A measured fact states what was measured, the command and the exact message"*) |
| 33 | `docs/outer-loop-verification.md` → `## 4. What ships unexercised, and why` → *"**Eleven of the twelve outer-loop files have their written mode and byte-identity checked only by hand…**"* | — | entry C (`agent-invocable`) | `no-change` | a residual measured in its round, over the twelve files that round drove. The three files this branch adds do not join it, because Task 5's cases assert their bytes and modes |
| 34 | `docs/development.md` → `## 6. The roadmap this tree defers to`: item 6's row (*"**Shipped.** … the outer-loop shell assets …"*) and the paragraph *"**Item 6 owed two things its row did not name…**"* | — | entry C (`agent-invocable`) | `no-change` | a shipped item's record of its own scope. The walker is not item 6's work, and Task 16 adds no roadmap row |
| 35 | `cli/scripts/README.md` → *"**Where the outer-loop scripts went, and why.**"* and *"**Coverage is a row, not a mechanism.**"* | — | entry C (`agent-invocable`) | `no-change` | records the location decision and the coverage mechanism, and names `OUTER_LOOP_SCRIPTS` as the set's single declaration; both hold for the walker's row unchanged |
| 36 | `cli/src/commands/init.ts` → the comment ordering the profile after the outer-loop scripts (*"paths of the agent-invocable ones"*) | — | entry C (`agent-invocable`) | `no-change` | names the flag generically; it holds for any row |
| 37 | `cli/src/generators/permissionProfile.ts` → the header and the doc comments naming agent-invocable rows | — | entry C (`agent-invocable`) | `no-change` | the profile derives its entries from the table's rows (`selectOuterLoopScripts`, `fromWrittenOuterLoop`), which is what Task 5 relies on to grant the walker with no edit here |
| 38 | `cli/src/generators/scripts.ts` → the header (*"whose agent-invocable rows reach the same profile"*) | — | entry C (`agent-invocable`) | `no-change` | names the flag generically; it holds for any row |
| 39 | `cli/templates/scripts/setup-worktree.sh` → the header (*"it is not agent-invocable"*) | template | entry C (`agent-invocable`) | `no-change` | describes that script alone, which this branch does not touch |
| 40 | `scripts/setup-worktree.sh` → the header (*"it is not agent-invocable"*) | this checkout's mirror | entry C (`agent-invocable`) | `no-change` | the mirror of row 39, unchanged for the same reason |
| 41 | `cli/test/profile.test.mjs` → the header and the loop over `OUTER_LOOP_SCRIPTS` | — | entry C (`agent-invocable`) | `no-change` | derives its expectations from the table, so it covers the walker's row with no edit; Task 5's Verification relies on that |
| 42 | `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES` (and its `RUN_CONTROL_ARTIFACTS` list) | — | entry C (`OUTER_LOOP_SCRIPT_FILES`) | `change` | Task 5: adds `'flow-walker.sh'` to the hand-spelled exclusion list, so `writtenWrappers` and `scriptPaths` do not count the walker as a wrapper |
| 43 | `plugin/hooks/README.md` → `## The deny list`: *"The other outer-loop scripts written into the same directory — `create-worktree.sh`, … `scratch-run.sh` — stay allowed"* | — | entry C (`stay allowed`) | `no-change` | the list names the outer-loop scripts left allowed by the guard's own deny-list ground. The walker is reached through its `yes` profile row with no deny entry, and the gate library is a sourced `lib/` file like `harness-run-lib.sh`. The existing enumeration already leaves out the agent-invocable git wrappers and the shared library on that same ground (Task 17 → *Where this task stops*) |
| 44 | `plugin/hooks/autonomous-script-allowlist-guard.sh` → the `# LEFT ALLOWED, DELIBERATELY:` comment | — | entry C (`LEFT ALLOWED`) | `no-change` | enumerates the same six as row 43, on the same ground; the walker and the gate library stay outside it for the reason row 43 gives (Task 17 → *Where this task stops*) |
