# Story: A unit never waits on a test run that has left the foreground

## Context

This branch stops a dispatched `layer-implementer` from waiting forever on its own verification run. In the observed headless run (task prompt → `## Why`), the per-unit test was refused twice for its **shape** — a `cd` compound with output redirected to a file — so the agent re-issued it in the background and then polled the captured output for `^ℹ duration_ms`, a line the captured file could never contain, until its own 600 s timeout expired. The fix is one rule at the level that owns what a unit runs, its consumer in the implementer's return contract, and a shape note in the adopter templates that name the single-file command.

**Facts confirmed in this planning session** (the task prompt's `## Constraints` asks that none be repeated from the prompt on trust):

- `node --test` with stdout not a terminal prints **TAP**. A one-case file run under Node v20.19.5 with its output captured by the tool printed `TAP version 13` … `# tests 1`, `# pass 1`, `# duration_ms 30.308292` — no `ℹ` line. The same held for `npm test --workspace cli -- test/prompt.test.mjs`, run from the repository root.
- `npm test --workspace cli -- test/<name>.test.mjs`, issued from the repository root as one plain command, runs `pretest` (`tsc`) and then `node --test --test-timeout=1800000 test/<name>.test.mjs` from `cli/` — one file, with no `cd` and no redirection.
- The refusals and the tool's own backgrounding are taken from the observed transcript the task prompt cites (sub-agent `agent-a46a8648323c1fb5a`): the `cd … > /tmp/…log` shape was refused, and a foreground call that hit its `timeout` was moved to the background as a new task rather than killed. The rule this branch writes depends on neither the timeout's value nor what the tool does at expiry. It only says what a unit does once its run is no longer in the foreground.

**Inventory: where an agent runs a command that can outlast the foreground window, and who covers it.**

- **Gate runs** (`commands.test`): run by the orchestrating top-level session in Phase G, code review, code-review fixes and user-review fixes. They are already covered by `run-test-suite.sh --wait` (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates` and its three siblings). Nothing changes there.
- **Interactive-test dev server**: run by the orchestrator and already covered by `poll-dev-server.sh`. Nothing changes.
- **Per-unit `<typecheck_cmd>` and `<test_file_cmd>`**: run by a **dispatched sub-agent** (`layer-implementer`) and covered by nothing. This is the gap. The orchestrator never verifies a unit itself (`plugin/instructions/plan_orchestration_instructions_autonomous.md`: *"The implementer runs `<typecheck_cmd>` and only the test files … admits"*).
- **Probes through `scratch-run.sh`**: `layer-implementer` and `layer-reviewer` each run their own. They are reached through the evidence-downgrade rules each agent already carries (*"a probe you could not run"*; `layer-reviewer` → *"Disclose a confirmation you did not execute"*). Task 3 names the background case in the implementer's rule. The reviewer is left unchanged: the autonomous forks drop per-unit review, and a backgrounded probe is a confirmation the reviewer did not execute, which its existing rule already routes.
- **Docs flow**: `docs-writer` runs no build or test command. Not in scope.

**The design, and why the existing wrapper is not extended.** The task prompt suggested giving `run-test-suite.sh` a unit-scoped form. That would not work. The wrapper runs only configured `commands.*` strings, and must keep doing so: a wrapper that ran an agent-supplied command would be auto-allowed by the script-allowlist guard and would bypass the permission profile. `<test_file_cmd>`, meanwhile, is prose in a conventions document, not a configuration key (`plugin/instructions/unit_loop_core.md` → `## Resolved values`, class `conventions document`). In this repository, `commands.test` (`bash scripts/test.sh` → `run-gates.sh`) takes no file argument. A unit-scoped wrapper form would therefore need a new configuration key, which is a four-place contract change plus per-runner detection. The only gain would be a per-unit verdict that Phase G already re-establishes over the committed tree.

The smaller rule is enough:

- A unit runs `<typecheck_cmd>` and `<test_file_cmd>` in the foreground, each as one command whose output comes back to it.
- A refusal is the existing skip, never a reason to reshape the command or background it.
- A run the tool layer moves to the background is **not waited on**. The unit reports it as not run, and Phase G runs the suite anyway.

So no completion signal is needed at all, from the runner's output or from anywhere else. The design also satisfies three of the prompt's goals:

- It carries G.1's prohibitions on `Monitor` and `sleep` by pointer (goal 3).
- It keys on no runner output (goal 4).
- It depends on no wall-clock constant (`## Constraints`).

**Why G.1's third prohibition — never end the turn with the run in flight — does not transfer to a unit.** It guards against a headless top-level session being torn down when its turn ends. A dispatched unit's turn ending is its **return**: the orchestrator receives it and continues (`plugin/instructions/unit_loop_core.md` → `## The unit loop` step 3, *"Receive its return"*), so no session ends. What a unit leaves behind is only its own result for that file. The return contract already records that result as not run, and Phase G re-runs it. Waiting would buy nothing, because a unit has no verdict file to poll.

**What is not touched.**

- The per-unit scope rule (one test file per unit) stays as it is (task prompt → `## Out of scope`).
- `run-test-suite.sh` stays as it is.
- The runner, its reporter flags and `cli/package.json` stay as they are.
- This repository's `.claude/context/conventions.md` is the conventions document that primed the observed loop: it states the per-unit command as `npm test -- test/<name>.test.mjs` *from `cli/`*, and it quotes spec-reporter `ℹ` lines. It is a `layers[].conventions` document, so no task may edit it. It is raised as a `stale-rule` recommendation for a hand edit or a supervised `/autonomous-sdlc-harness:harness-analyze` re-run, never scheduled here. Until a human applies it, a unit in this repository that cannot run the documented shape as one plain command takes the skip under the new rule, and Phase G covers the file.

The work is cut into three single-layer tasks in bottom-up ship order (`cli`, then `plugin`):

- **Task 1** — the adopter templates that tell `/autonomous-sdlc-harness:harness-analyze` how to state the single-file command.
- **Task 2** — the rule itself, appended as point 6 of `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, which is the single owner of what a unit runs.
- **Task 3** — the rule's consumer: `plugin/agents/layer-implementer.md`, whose return contract spells the two not-run strings and whose fallback and evidence-downgrade rules name the background case.

No `general`-layer task is needed: no root document states the per-unit run.

**Top risks:**

- **Skipping becomes an escape hatch.** The new rule could be read as licence to skip verification whenever a run is slow or awkward. Task 2 guards this: it forbids choosing the background or reshaping a refused command, and limits the skip to a run the **tool layer** moved.
- **Citations break.** `## The test-run rule`'s points are cited by number elsewhere (*"point 1's row-`G.4` exception"*, `## The test-run rule` point 1 in `#### Row G.4 — test-fix items`), and its heading is a roster-bound wire. Task 2 appends point 6 without renumbering or retitling anything, and its verification re-derives every citer.
- **The two halves drift.** If the rule and the return strings diverge, the skip goes unrecorded. Task 3 restates Task 2's condition phrase *moved to the background* byte for byte, and its verification greps both files for it.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_background_test_wait/task_<K>_plan.md`. Entries are ordered bottom-up by ship sequence.

1. [ ] **Task 1** — State the single-file test command's runnable shape in the adopter conventions templates _(layer: cli)_ _(points: 8)_
2. [ ] **Task 2** — Add test-run rule point 6: a unit's run stays in the foreground, and one moved to the background is not waited on _(layer: plugin)_ _(points: 10)_
3. [ ] **Task 3** — Carry the background case into `layer-implementer`'s return contract, fallback and evidence-downgrade rules _(layer: plugin)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Inventory every place an agent runs a command that can outlast the Bash tool's foreground window, and check whether that place says what to do when the command is backgrounded."*

**Derivation entry A — plugin and template corpus files (command).** Re-run verbatim from the repository root: `git grep -lE '<typecheck_cmd>|<test_file_cmd>|<test_cmd>|run-test-suite\.sh|poll-dev-server\.sh|scratch-run\.sh|single test file' -- plugin cli/templates`

**Derivation entry B — this repository's conventions documents (command).** Re-run verbatim from the repository root: `git grep -lE 'npm test -- test/|ℹ ' -- .claude/context`

**Derivation entry C — standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that standing ledger. It is the only standing artifact under `harness-runs/` with rows; `harness-runs/improvement_suggestions.md` carries no row naming a target.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names per-unit verification, a backgrounded command, or one of the files entries A and B reach. At planning time this procedure reaches no rule, so it contributes no row. A re-walk that does reach one owes it a row.

**Closure invariant:** every site any entry above reaches appears as a row below. `Copy` is `—` throughout: no site here has a mirrored counterpart that these entries reach, and the adopted copies under `scripts/` are neither reached nor changed.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/claude/context/conventions.md` (bullet "the one command that runs a single test file on its own") | — | A, `single test file` | `change` | Task 1 |
| 2 | `cli/templates/claude/context/layer.md` (bullet "the one command that runs a single test file of this layer on its own") | — | A, `single test file` | `change` | Task 1 |
| 3 | `cli/templates/claude/settings.autonomous.json` (the `_comment` lines on outer-loop scripts and the probe route) | — | A, `run-test-suite.sh` / `scratch-run.sh` | `no-change` | permission-profile commentary on which scripts are allowed; it tells no agent how to run or wait on a command |
| 4 | `cli/templates/scripts/README.md` | — | A, `run-test-suite.sh` | `no-change` | lists the script families; no run or wait instruction |
| 5 | `cli/templates/scripts/lib/harness-run-lib.sh` (comment naming `scratch-run.sh`) | — | A, `scratch-run.sh` | `no-change` | shell library comment; addresses no agent |
| 6 | `cli/templates/scripts/run-test-suite.sh` (header "THE WAIT FORM, AND WHY IT EXISTS") | — | A, `run-test-suite.sh` | `no-change` | already says what to do when its run is backgrounded; the wrapper is not extended (story `## Context`, the design paragraph) |
| 7 | `cli/templates/scripts/scratch-run.sh` | — | A, `scratch-run.sh` | `no-change` | the probe runner itself; what an agent does with a backgrounded probe is its caller's rule (rows 10 and 11) |
| 8 | `cli/templates/scripts/start-dev-server.sh` (comment naming `poll-dev-server.sh`) | — | A, `poll-dev-server.sh` | `no-change` | dev-server readiness is already covered by `poll-dev-server.sh` |
| 9 | `cli/templates/state-dir/test_run_logs/README.md` | — | A, `run-test-suite.sh` | `no-change` | describes the gate wrapper's logs; the gate wait is covered |
| 10 | `plugin/agents/layer-implementer.md` (`**What you run, in every mode.**`; `**An evidence downgrade is recorded, in every mode.**`; the row-`G.4` fix-site fallback; `## Output contract` item 5) | — | A, `<typecheck_cmd>` / `<test_file_cmd>` | `change` | Task 3 |
| 11 | `plugin/agents/layer-reviewer.md` (`**Run the probe that would settle it.**`) | — | A, `scratch-run.sh` | `no-change` | a backgrounded probe is a confirmation not executed, which its own `**Disclose a confirmation you did not execute.**` rule routes; per-unit review is off in the autonomous forks |
| 12 | `plugin/commands/branch-implement-plan-semi-autonomous.md` (Phase G summary) | — | A, `run-test-suite.sh` | `no-change` | summarises Phase G, whose wait G.1 owns |
| 13 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` (phase summary) | — | A, `run-test-suite.sh` | `no-change` | summary only; its gate run is Phase G's, and its per-unit runs go through `unit_loop_core.md` (row 22) |
| 14 | `plugin/docs/AUTONOMOUS_FLOW.md` (script table rows) | — | A, `run-test-suite.sh` / `poll-dev-server.sh` | `no-change` | a roster citer of `## The test-run rule` that points and never restates; the heading is unchanged |
| 15 | `plugin/hooks/README.md` (`## The deny list`) | — | A, `scratch-run.sh` | `no-change` | permit documentation; this branch adds no script |
| 16 | `plugin/hooks/autonomous-script-allowlist-guard.sh` (comment naming `scratch-run.sh`) | — | A, `scratch-run.sh` | `no-change` | guard; this branch adds no script |
| 17 | `plugin/instructions/code_review_fixes_instructions.md` (step 1, "Run the gates") | — | A, `run-test-suite.sh` | `no-change` | already carries the `--wait` route |
| 18 | `plugin/instructions/code_review_instructions.md` (step 1, "Run the gates") | — | A, `run-test-suite.sh` | `no-change` | already carries the `--wait` route |
| 19 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` (*"The implementer runs `<typecheck_cmd>` and only the test files"*) | — | A, `<typecheck_cmd>` | `no-change` | points at `## The test-run rule` and restates none of its skip conditions |
| 20 | `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates` | — | A, `run-test-suite.sh` | `no-change` | owner of the gate wait; the new rule cites it by pointer; the orchestrator runs no per-unit verification |
| 21 | `plugin/instructions/qa_test_instructions.md` (`### 2. Start the dev server (background)`) | — | A, `poll-dev-server.sh` | `no-change` | covered by `poll-dev-server.sh` |
| 22 | `plugin/instructions/unit_loop_core.md` → `## The test-run rule` | — | A, `<test_file_cmd>` | `change` | Task 2 |
| 23 | `plugin/instructions/user_review_fixes_instructions.md` (step 1, "Run the gates") | — | A, `run-test-suite.sh` | `no-change` | already carries the `--wait` route |
| 24 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` (*"Never start the Phase QA dev server with a raw package-manager"*) | — | A, `poll-dev-server.sh` | `no-change` | dev-server start rule; QA is covered by `poll-dev-server.sh` |
| 25 | `plugin/instructions/user_review_fixes_instructions_core.md` (`<typecheck_cmd>` row; Run gates phase) | — | A, `<typecheck_cmd>` | `no-change` | runs Phase G by reference; its units run through `unit_loop_core.md` (row 22) |
| 26 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` (`<app_root>` binding row) | — | A, `<test_cmd>` / `<typecheck_cmd>` | `no-change` | says where a configured string runs from and points at the core's row for the refused case; no wait instruction is owed there, because the per-unit run's rule is `unit_loop_core.md`'s (row 22) |
| 27 | `plugin/scripts/README.md` | — | A, `poll-dev-server.sh` | `no-change` | QA helper list; covered |
| 28 | `plugin/scripts/find-free-port.sh` | — | A, `poll-dev-server.sh` | `no-change` | QA helper; covered |
| 29 | `plugin/scripts/kill-dev-server.sh` | — | A, `poll-dev-server.sh` | `no-change` | QA helper; covered |
| 30 | `plugin/scripts/poll-dev-server.sh` | — | A, `poll-dev-server.sh` | `no-change` | is the QA wait mechanism |
| 31 | `plugin/scripts/reserve-qa-user.sh` | — | A, `poll-dev-server.sh` | `no-change` | QA helper; covered |
| 32 | `.claude/context/conventions.md` → `## The testing bar`, bullet "A unit's own verification runs the one test file" | — | B, `npm test -- test/` and `ℹ ` | `no-change` | a conventions document is never a task target; the branch's work falsifies its `from cli/` command shape and its spec-reporter quote, so it is raised in `## Corpus staleness` as a `stale-rule` |
