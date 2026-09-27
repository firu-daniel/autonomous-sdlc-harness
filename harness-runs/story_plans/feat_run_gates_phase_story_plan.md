# Story: The Run gates phase — `<test_cmd>` runs once per phase, never once per unit

## Context

Who reads this: the implementers and reviewers of this branch's 23 tasks. Each reads this `## Context` plus one per-task file. The paragraphs below state the decisions every task shares. The task prompt left those decisions open, and they are settled here once, so that no task settles them a second way.

**What the branch delivers.** A new **Run gates phase**, `## Phase G — Run gates`, becomes the only place the configured test command (`commands.test`, written `<test_cmd>` in the plugin corpus) runs in the automated flows. In the task flow it runs after Phase E (QA) and before Phase D, so the order is A → A1.5 → A2 → B → C → C2 → E → **G** → D. In the user-review fix flow it runs after Phase QA and before Phase D, so the order is A → QA → **G** → D. It sits after QA rather than directly after C2 because QA fixes also change code, and a gate run placed before them would leave those fixes untested. It still runs before the docs, statistics, observations and digest steps, which all live in Phase D.

The orchestrator runs one wrapper, `bash <scripts_dir>/run-test-suite.sh <label>`. It reads the single line the wrapper prints and nothing else:
- `pass` flips the phase's ledger entry.
- `fail <log path>` opens a fix loop. That loop mirrors the user-review one: a new `test-fix-plan-writer` agent writes a split fix plan from the log, and the existing `architecture-reviewer` approves it in plan-review mode. The fixes then run through the existing unit loop as substitution row `G.4`, and the gates run again.

The loop is capped at `MAX_GATE_ROUNDS = 5` gate runs. A `fail` on round 5 or later goes to `<escalate>`, which in the autonomous forks is the clarification park. After an answered park, the resumed phase runs the gates exactly once more, and a `fail` parks again, so a fix loop can never run past the cap.

The phase body lives in `plugin/instructions/plan_orchestration_instructions_core.md`, which is already an activator of the dispatch-discipline policy. The user-review fix core cites it by reference, exactly as its `## Phase QA` cites family 1's `## Phase E`. Every path placeholder therefore resolves from the entry core's `## Setup`.

**The test-run rule.** Implementers stop running `<test_cmd>` per unit. They keep `<typecheck_cmd>`, or run nothing when `commands.typecheck` is `<none>`. There is one exception: a unit runs the test files it created or edited. It runs them only through a single-file command that a conventions document states, and it skips that run without raising a blocker when no such command is stated or the command is refused. No plan asks for a test run. This covers a `**Verification:**` bullet, a finding's fix, and a sub-step, and it covers `<test_cmd>`, a gate script, and a test file the unit does not write. It binds every plan written before and inside the phase: the task plan, the business-parity, architecture, code-review and skeptic findings, the user-review fix plan, and the test fix plan. Every reviewer of those plans raises a breach as a Must Fix.

The rule has one canonical home: `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, created by Task 5. It lives there because the unit loop is where every plan is executed. Every writer, reviewer and implementer points at that heading and restates none of it.

**Decisions the prompt asked this plan to establish.**
- **No typecheck (`<none>`).** The implementer's per-unit verification reads correctly with `<test_cmd>` gone. The type check is reported as *not run, because the key says there is none*. The unit's own test files are reported as run, or as *skipped: no single-file command stated*. Neither is ever reported as a pass. The Run gates phase then covers the unit (Task 6).
- **How an implementer runs one test file.** The implementer learns the single-file command from the dispatched layer's conventions document or from the catch-all layer's (the `layers[]` entry whose `path` is `"."`). There is no new configuration key.
  - **The test-wrapper candidate is confirmed as the recommended content of that statement, and rejected as a default.** `bash <scripts_dir>/test.sh <file>` needs no new allow entry and no new key. Whether the wrapper's line accepts a path is, however, the command's own property. In this repository the line is `bash scripts/run-gates.sh "$@"`, which ignores its arguments. Using the wrapper blindly here would bring back the per-unit full-suite run this branch removes.
  - Adopters get the prompt to state that command in the shipped conventions skeletons (Task 4), and `/autonomous-sdlc-harness:harness-analyze` fills it in.
  - This repository's own statement belongs in a conventions document, which no task may edit. It is raised in the writer's `## Corpus staleness` return instead. Until someone adds it, implementers here skip their own-file run and Phase G covers them.
- **The log is versioned per round, not overwritten.** The wrapper writes `<state_dir>/test_run_logs/<branch>/<label>.log`, with the label `<gate_key>_round_<gate_round>`, and truncates only when the same label runs again, which happens when a resumed round re-runs.
  - Why: the fix-plan writer at round *k* compares round *k−1*'s log. That comparison is how it tells a regression the previous fix introduced from a failure that persisted. A cap park must also hand the operator every round's evidence, which an overwrite would destroy.
  - The logs are machine-local and gitignored, ignored by their contents with a README exception. Gate output carries machine paths, and the self-containment gate refuses those.
- **Writer: a new agent. Reviewer: an existing agent in a new sub-case.** The rule in the always-loaded project file requires every agent to declare a `tools:` allowlist that omits the browser namespaces. Both choices satisfy it: the new agent declares its own, and the reused reviewer keeps its read-only one.
  - Reusing `user-review-fix-plan-writer` would put a second job inside a resident system prompt. Its body mandates a lessons-ledger append, which a gate failure must never trigger, because lessons are human-caught escapes. Its four fixed prompts are also shaped around a user-review file.
  - `test-fix-plan-writer` therefore gets its own allowlist: `Read, Write, Edit, Bash, Glob, Grep, mcp__harness-docs__search_docs`. It carries the search tool because `plugin/agents/README.txt` grants it to every plan writer. It has no browser namespace.
  - The approving reviewer is `architecture-reviewer` at a fourth insertion point, sub-case (c). This mirrors the user-review fix plan's architecture gate, adds no new allowlist, and leaves that agent's read-only guarantee unchanged.
  - There is deliberately no parity gate, because the prompt names one approving reviewer. Completeness against the log is the writer's own check, and Phase G's re-run is the plan's real verification.
- **No baseline run.** Every failure is the branch's to fix. A failure the writer judges not fixable on the branch, such as an environment problem, is listed under the fix plan's `## Not fixable on this branch`. When nothing on the plan is fixable, the phase parks at once rather than spending rounds.
- **The supervised flows run the gates once, and a human owns the fix route.** They are human-gated item loops with no reviewer agents and no safety contract, so a writer/reviewer fix loop does not fit their shape. Their three statistics points run the wrapper first. A `fail` reports the log path and stops before statistics (Task 17).
- **Planning is untouched.** The planning flow graph `task_plan_writing.graph.json` is not changed.

**Every place the contract reaches, and the task that changes it:**

| Place | Task |
|---|---|
| The wrapper and its behaviour tests, and the retrieval module header's allowlist count | Tasks 1 and 2 |
| The run-artifact directories and the log ignore rule | Task 3 |
| Adopter conventions skeletons, the scratch-mutation sentences, and the outer-loop rosters in `cli/README.md`, the scripts README and the autonomous profile's comment | Task 4 |
| The test-run rule and unit-loop row `G.4` | Task 5 |
| The implementer | Task 6 |
| The fix-plan writer | Task 7 |
| The approving reviewer | Task 8 |
| Phase G itself | Task 9 |
| The committer's caller table | Task 10 |
| The flow-progress ledger for both engines, with entries `G` and `RG`, and resume | Task 11 |
| The task-engine forks, autonomous and semi-autonomous | Task 12 |
| The user-review fix core | Task 13 |
| The user-review fix forks | Task 14 |
| The plan writers | Task 15 |
| The plan reviewers | Task 16 |
| The supervised flows | Task 17 |
| `plugin/docs/AUTONOMOUS_FLOW.md` and the whiteboard | Task 18 |
| `/autonomous-sdlc-harness:branch-status`, the three engine commands, and the semi-autonomous user-review command `branch-implement-user-review-semi-autonomous.md` | Task 19 |
| This repository's self-adoption copies | Task 20 |
| Gate 6a's log exclusion | Task 21 |
| `docs/` (including the `docs/watcher.md` scripts table) and `ARCHITECTURE.md` | Task 22 |
| The acceptance walk | Task 23 |

**Wire names every task uses verbatim.**

| Wire | Value |
|---|---|
| Wrapper | `run-test-suite.sh`, one argument `<label>` matching `^[A-Za-z0-9][A-Za-z0-9._-]*$`, or `--wait <label>` |
| Wrapper output | stdout exactly `pass` (exit 0) or `fail <repo-relative log path>` (exit 1); the wait form alone may also print `pending` (exit 3); a refusal is exit 2 with one `run-test-suite.sh: <reason>` stderr line, nothing on stdout, and no file written |
| Verdict files | `<label>.verdict` (the printed line) and `<label>.running` (the in-flight PID), beside the log |
| Directories | `test_run_logs` (machine-local), `test_fix_plans`, `test_fix_plan_reviews`, `test_fix_point_reviews` |
| Gate key | `task` in the task flow; `review_<n>` in the user-review fix flow, where `<n>` is the active user-review round and the unsuffixed file is round 1 |
| Round counter | `<gate_round>` |
| Setup placeholders | `<gate_key>`, `<test_fix_plan_path>` = `<state_dir>/test_fix_plans/<branch>_<gate_key>_round_<gate_round>.md`, `<test_fix_findings_dir>` = `<state_dir>/test_fix_plans/<branch>_<gate_key>_round_<gate_round>/`, `<test_fix_review_folder>` = `<state_dir>/test_fix_plan_reviews/<branch>_<gate_key>_round_<gate_round>/`, `<test_fix_findings_root>` = `<state_dir>/test_fix_point_reviews/<branch>_<gate_key>_round_<gate_round>/` |
| Ledger entries | `G.` in the task engine; `RG.` in the user-review engine |
| Heartbeat phase field | `G` |

These wire names use test vocabulary, the term adopters already arrive with. Only the phase keeps the prompt's name, "Run gates" (`<state_dir>/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with"*).

**Top risks:**
- **A dangling or two-owner contract across the 17 plugin tasks.** The corpus quotes its own headings and wire strings. Tasks 5 → 7 → 8 → 9 are ordered contract-before-dispatcher. Each consumer task restates the exact heading or wire it cites. Task 23's walk re-derives every citation by grep.
- **Silent per-unit suite runs coming back through a plan or through this repository's own wrapper.** Task 5's rule has one home. Tasks 15 and 16 bind every writer and reviewer to it. Task 6 makes the implementer refuse a test-run bullet even when a plan asks for one.
- **A gate run that never finishes cleanly.** It could outlast the Bash tool's foreground window and be ended with the turn, or be tripped by its own log, because gate 6a would find the machine paths the log carries. Task 1's wrapper leaves its verdict in `<label>.verdict` beside the log and offers a `--wait <label>` form that returns the verdict, or `pending` after one bounded slice. Task 9's G.1 re-issues that foreground call until it prints a verdict, so the turn never ends with the run in flight, and it forbids a `Monitor`, a sleep and an ended turn by name (`autonomous_pause_and_ledger.md` → §2.5). Task 21 excludes the log directory from gate 6a.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That role is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only, and the committer never touches them. Each entry resolves 1:1 to `harness-runs/task_plans/feat_run_gates_phase/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence: `cli`, then `plugin`, then the catch-all `general` last.

1. [x] **Task 1** — Ship the `run-test-suite.sh` outer-loop script and its `OUTER_LOOP_SCRIPTS` row _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Drive `run-test-suite.sh` in a new `cli/test/run-test-suite.test.mjs` _(layer: cli)_ _(points: 18)_
3. [ ] **Task 3** — Add the four Run-gates directories to the run-artifact tree and ignore `test_run_logs` by its contents _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Ask adopters for their single-file test command in the conventions skeletons, re-word the scratch mutation-revert sentences, and add `run-test-suite.sh` to the adopter-facing outer-loop rosters _(layer: cli)_ _(points: 15)_
5. [ ] **Task 5** — State `## The test-run rule` and add substitution row `G.4` in `unit_loop_core.md` _(layer: plugin)_ _(points: 15)_
6. [ ] **Task 6** — Make `layer-implementer` run `<typecheck_cmd>` per unit and only its own test files _(layer: plugin)_ _(points: 15)_
7. [ ] **Task 7** — Add the `test-fix-plan-writer` agent and grant it the plan-writer search roster _(layer: plugin)_ _(points: 20)_
8. [ ] **Task 8** — Give `architecture-reviewer` insertion point 4 (the test fix plan) and the test-run check _(layer: plugin)_ _(points: 12)_
9. [ ] **Task 9** — Write `## Phase G — Run gates` into `plan_orchestration_instructions_core.md` _(layer: plugin)_ _(points: 20)_
10. [ ] **Task 10** — Add the Phase G commit and fix-loop callers to `committer.md`'s caller table _(layer: plugin)_ _(points: 5)_
11. [ ] **Task 11** — Add the `G.` and `RG.` entries to the flow-progress ledger and its resume rules _(layer: plugin)_ _(points: 10)_
12. [ ] **Task 12** — Wire Phase G into the task-engine autonomous and semi-autonomous forks _(layer: plugin)_ _(points: 10)_
13. [ ] **Task 13** — Run Phase G by reference from `user_review_fixes_instructions_core.md` _(layer: plugin)_ _(points: 15)_
14. [ ] **Task 14** — Wire Phase G into the user-review fix autonomous and semi-autonomous forks _(layer: plugin)_ _(points: 10)_
15. [ ] **Task 15** — Bind the plan writers to the test-run rule _(layer: plugin)_ _(points: 10)_
16. [ ] **Task 16** — Make the plan reviewers raise a test-run request as a Must Fix _(layer: plugin)_ _(points: 12)_
17. [ ] **Task 17** — Run the gates once before statistics in the three supervised statistics points _(layer: plugin)_ _(points: 10)_
18. [ ] **Task 18** — Describe the Run gates phase in `AUTONOMOUS_FLOW.md` and the whiteboard _(layer: plugin)_ _(points: 15)_
19. [ ] **Task 19** — Update `/autonomous-sdlc-harness:branch-status` and the engine commands' phase lists _(layer: plugin)_ _(points: 12)_
20. [ ] **Task 20** — Mirror the new templates into this repository's self-adopted `scripts/`, `harness-runs/` and `.gitignore` _(layer: general)_ _(points: 15)_
21. [ ] **Task 21** — Exclude `test_run_logs` from gate 6a in `scripts/run-gates.sh` and `docs/development.md` _(layer: general)_ _(points: 5)_
22. [ ] **Task 22** — Update `docs/cli.md`, `docs/config.md`, `docs/watcher.md` and `ARCHITECTURE.md` for the new script, phase and agent _(layer: general)_ _(points: 15)_
23. [ ] **Task 23** — Record the acceptance walk in this story index _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"every document that states when `<test_cmd>` runs"*. It is read together with the prompt's companion list under *"Every place the contract reaches"*: the flow-progress ledger for both engines, `/autonomous-sdlc-harness:branch-status`, resume from a paused or parked run, the supervised and semi-autonomous flows, and `plugin/docs/AUTONOMOUS_FLOW.md`.

**Derivation entries.** Each command below is run from the checkout root, and each one is read-only.
- **E1 — statements of when the test command runs (command).** `grep -rlE 'test_cmd|commands\.test|that suite' plugin cli/templates scripts docs README.md ARCHITECTURE.md .claude harness-runs/README.md harness-runs/scratch/README.md`
- **E2 — statements of the phase order, in arrow, bullet-list and prose form (command).** `grep -rlE 'A → A1\.5 → A2|A → QA → D|E\. +QA passed|R4\. QA passed|\*\*E\*\* exercises|\*\*Phase E:\*\*|\*\*Phase D:\*\*|followed by a QA phase|then run the QA phase|Phase QA.{0,120}Phase D' plugin docs README.md ARCHITECTURE.md cli/templates`
- **E3 — agents that write or grade a readiness-bearing plan (command).** `grep -lE 'Phase 2 Readiness' plugin/agents/*.md`
  - **Decision rule:** a site is `change` when the agent writes a plan or findings index a unit loop walks, or grades one before it is walked, and that plan is on the prompt's list. Otherwise it is `no-change`, with a reason.
- **E4 — rosters and counts of agents, outer-loop scripts and machine-local directories (command).** `grep -rlE 'flow-walker\.sh|\bten\b.{0,40}(agent|allowlist|files listed)|twenty-one|exactly these ten|is in the other ten|What git ignores is the machine-local part' plugin docs README.md ARCHITECTURE.md cli/README.md cli/src cli/templates harness-runs/README.md`
  - Every outer-loop roster names the flow walker, the one agent-invocable script the orchestrating session ran before this branch, so matching its name reaches every enumeration of that set. Hits under `cli/src` are application source and outside the register's definition; the one whose text goes false, `cli/src/retrieval/server.ts`'s header count, is Task 1's, and `cli/src/generators/outerLoopScripts.ts` is Task 1's own target.
- **E5 — the points where statistics are written, which is where a gate run must precede them (command).** `grep -rlE 'Write branch statistics\. Branch|Update branch statistics\. Branch' plugin/instructions plugin/commands plugin/agents`
- **E6 — commands that read review artifacts or resume a run (command).** `grep -rlE 'code_reviews/|business_parity_branch_reviews/|first phase entry still marked|skipping every phase already marked' plugin/commands cli/templates/scripts scripts`
- **E7 — the plan's own targets (procedure).**
  - **Artifact:** the per-task files `harness-runs/task_plans/feat_run_gates_phase/task_<N>_plan.md`.
  - **Traversal:** the tasks in readiness order, then each line of the task's `### Targets` list.
  - **Decision rule:** a target that is durable corpus text and that no entry above reached gets a row with `change` and its task.
- **E8 — standing-artifact rows (procedure).**
  - **First step, runnable:** `grep -nE '^## |^- \*\*' harness-runs/lessons.md`.
  - **Artifact:** that ledger.
  - **Traversal:** its topic headings in file order, then the one-line rules under each.
  - **Decision rule:** a rule is reached when it names a surface this branch's targets change: an adopter-facing name, an adopter-run command, or an acceptance figure.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | E1 | `change` | Task 9 |
| 2 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | E1, E2 | `change` | Task 12 |
| 3 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` | — | E2 | `change` | Task 12 |
| 4 | `plugin/instructions/user_review_fixes_instructions_core.md` | — | E1, E5 | `change` | Task 13 |
| 5 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | E1, E2 | `change` | Task 14 |
| 6 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` | — | E1, E2 | `change` | Task 14. The phase list changes. Its `<app_root>` sentence keeps citing the core's `<test_cmd>` / `<typecheck_cmd>` row, which still exists. |
| 7 | `plugin/agents/layer-implementer.md` | — | E1, E3 | `change` | Task 6 |
| 8 | `plugin/hooks/allow-safe-compounds.sh` (the `<commands.typecheck> && <commands.test>` comment) | — | E1 | `no-change` | It records a compound the guard allows. It says nothing about when the command runs. |
| 9 | `plugin/hooks/lib/harness-config-lib.sh` (`.commands["test"]` reader) | — | E1 | `no-change` | It is a configuration reader, and states no run point. |
| 10 | `cli/templates/scripts/lib/harness-run-lib.sh` (`commands.test` reader) | — | E1 | `no-change` | It is a configuration reader. Task 1's script consumes `hr_command` unchanged. |
| 11 | `scripts/lib/harness-run-lib.sh` | mirror of 10 | E1 | `no-change` | Same as row 10. |
| 12 | `cli/templates/scripts/scratch-run.sh` (*"because the committer will see that suite"*) | template | E1 | `change` | Task 4 |
| 13 | `scripts/scratch-run.sh` | mirror of 12 | E1 | `change` | Task 20 |
| 14 | `cli/templates/scripts/test.sh` (*"It is what `commands.test` invokes"*) | template | E1 | `no-change` | It states what the key invokes, not when. The argument-forwarding comment is the fact the decisions above rely on. |
| 15 | `scripts/test.sh` | mirror of 14 | E1 | `no-change` | Same as row 14. |
| 16 | `scripts/run-gates.sh` (*"`commands.test` … points here"*) | — | E1 | `change` | Task 21, for gate 6a's exclusion. The pointer sentence itself stays true. |
| 17 | `cli/templates/state-dir/scratch/README.md` (*"the committer has to see that suite clean"*) | template | E1 | `change` | Task 4 |
| 18 | `harness-runs/scratch/README.md` | mirror of 17 | E1 | `change` | Task 20 |
| 19 | `docs/cli.md` | — | E1, E4 | `change` | Task 22 |
| 20 | `docs/config.md` → the `commands.test` row and the `docs.retrieval` row (*"the ten plan-writer and reviewer agents"*) | — | E1, E4 | `change` | Task 22 |
| 21 | `docs/development.md` → gate 6's quoted 6a command | — | E1 | `change` | Task 21 |
| 22 | `docs/outer-loop-verification.md` | — | E1 | `no-change` | A dated measurement record. Editing it would falsify what was measured. |
| 23 | `docs/typecheck-key-decision.md` → *"The unit loop's gate is unconditional"* | — | E1 | `no-change` | A decision of record, stating what held when the decision was taken. |
| 24 | `.claude/context/conventions.md` → `## The testing bar` | — | E1 | `no-change` | Conventions documents are never a plannable target. The branch's work leaves this section without a single-file test statement, so it is raised as a `stale-rule` in `## Corpus staleness`. |
| 25 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | E2, E6 | `change` | Task 11 |
| 26 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | E2, E4 | `change` | Task 18 |
| 27 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` | — | E2, E4 | `change` | Task 18 |
| 28 | `plugin/commands/branch-start-plan-autonomous.md` | — | E2, E4 | `change` | Task 19. Its E4 hit, the `<scripts_dir>` row naming the planning flow's scripts, stays true: the planning flow does not run the gates. |
| 29 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | E2 | `change` | Task 19 |
| 30 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | E2, E6 | `change` | Task 19 |
| 31 | `plugin/agents/architecture-reviewer.md` | — | E3 | `change` | Task 8 |
| 32 | `plugin/agents/branch-reviewer.md` | — | E3 | `change` | Task 15 |
| 33 | `plugin/agents/business-parity-reviewer.md` | — | E3 | `change` | Task 16 |
| 34 | `plugin/agents/committer.md` → `### Which caller sends which mode` | — | E3 | `change` | Task 10 |
| 35 | `plugin/agents/layer-reviewer.md` | — | E3 | `no-change` | Per-unit review findings are not on the prompt's list of plans. Their fix iteration is executed by `layer-implementer`, which Task 6 makes refuse any test-run request whatever its source. |
| 36 | `plugin/agents/qa-tester.md` | — | E3 | `no-change` | Its findings are re-verified by the E.4 browser re-test, never through `<test_cmd>`. The implementer-side refusal (Task 6) covers any stray request. |
| 37 | `plugin/agents/review-plan-reviewer.md` | — | E3 | `change` | Task 16 |
| 38 | `plugin/agents/skeptic-reviewer.md` | — | E3 | `change` | Task 15 |
| 39 | `plugin/agents/statistics-plan-writer.md` | — | E3, E5 | `no-change` | It writes a report that no unit loop walks. The gate run precedes its dispatch, and that order is stated by the callers (Tasks 9, 13, 17). |
| 40 | `plugin/agents/task-plan-reviewer.md` | — | E3 | `change` | Task 16 |
| 41 | `plugin/agents/task-plan-writer.md` | — | E3 | `change` | Task 15 |
| 42 | `plugin/agents/ui-tests-plan-reviewer.md` | — | E3 | `no-change` | UI-test plans are executed by `qa-tester` in a browser, never through `<test_cmd>`. |
| 43 | `plugin/agents/ui-tests-plan-writer.md` | — | E3 | `no-change` | Same as row 42. |
| 44 | `plugin/agents/user-review-fix-plan-writer.md` | — | E3 | `change` | Task 15 |
| 45 | `ARCHITECTURE.md` → the docs-retrieval roster (*"is in the other ten"*) | — | E4 | `change` | Task 22 |
| 46 | `cli/templates/scripts/README.md` | — | E4 | `change` | Task 4 |
| 47 | `cli/templates/state-dir/README-root.md` | template | E4 | `change` | Task 3 |
| 48 | `harness-runs/README.md` | mirror of 47 | E4 | `change` | Task 20 |
| 49 | `plugin/agents/README.txt` → `The docs-retrieval grant — one roster, one wire` | — | E4 | `change` | Task 7 |
| 50 | `plugin/instructions/code_review_instructions.md` → step 6 | — | E5 | `change` | Task 17 |
| 51 | `plugin/instructions/code_review_fixes_instructions.md` → `## Phase 3` | — | E5 | `change` | Task 17 |
| 52 | `plugin/instructions/user_review_fixes_instructions.md` → `## Phase 3` | — | E5 | `change` | Task 17 |
| 53 | `plugin/commands/branch-implement-review.md` | — | E6 | `no-change` | It walks the code-review index only. Its Phase 3 gate run is owned by row 51. |
| 54 | `plugin/commands/branch-status.md` → step 5 | — | E6 | `change` | Task 19 |
| 55 | `plugin/commands/branch-resume.md` (*"skipping every phase already marked `[x]` or `[-]`"*) | — | E6 | `no-change` | The resume prose is marker-generic and names no entry id, so the new `G.` / `RG.` entries resume under it unchanged. |
| 56 | `cli/templates/scripts/autonomous-watcher.sh` (*"first phase entry still marked [ ]"*) | template | E6 | `no-change` | Same as row 55. The watcher parses no ledger entry. |
| 57 | `scripts/autonomous-watcher.sh` | mirror of 56 | E6 | `no-change` | Same as row 56. |
| 58 | `plugin/instructions/unit_loop_core.md` | — | E7 | `change` | Task 5 |
| 59 | `plugin/agents/test-fix-plan-writer.md` (new) | — | E7 | `change` | Task 7 |
| 60 | `cli/templates/scripts/run-test-suite.sh` (new) | template | E7 | `change` | Task 1 |
| 61 | `scripts/run-test-suite.sh` (new) | mirror of 60 | E7 | `change` | Task 20 |
| 62 | `cli/templates/state-dir/test_run_logs/README.md`, `…/test_fix_plans/README.md`, `…/test_fix_plan_reviews/README.md`, `…/test_fix_point_reviews/README.md` (new) | template | E7 | `change` | Task 3 |
| 63 | `harness-runs/test_run_logs/README.md`, `harness-runs/test_fix_plans/README.md`, `harness-runs/test_fix_plan_reviews/README.md`, `harness-runs/test_fix_point_reviews/README.md` (new) | mirror of 62 | E7 | `change` | Task 20 |
| 64 | `cli/templates/repo/gitignore` | template | E7 | `change` | Task 3 |
| 65 | `.gitignore` → the managed block | mirror of 64 | E7 | `change` | Task 20 |
| 66 | `cli/templates/claude/context/conventions.md`, `cli/templates/claude/context/layer.md` | template | E7 | `change` | Task 4. These are adopter skeletons, not this repository's conventions documents. |
| 67 | `harness-runs/story_plans/feat_run_gates_phase_story_plan.md` → `## Acceptance walk` | — | E7 | `change` | Task 23 |
| 68 | `harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with …"* | — | E8 | `no-change` | This plan obeys it: the wire names use test vocabulary. |
| 69 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block …"* | — | E8 | `no-change` | This plan obeys it. The adopter-facing prose Task 4 and Task 22 add names the wrapper as a file and asks the adopter to run no new command. |
| 70 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session …"* | — | E8 | `no-change` | This plan obeys it. Task 23's acceptance evidence records outcomes, never timings. |
| 71 | `docs/watcher.md` → `## 2. The scripts`, the **Outer-loop scripts** table | — | E4 | `change` | Task 22. The table has no row for `run-test-suite.sh`, an agent-invocable (**yes**) script. |
| 72 | `cli/README.md` → the outer-loop shell-assets enumeration | — | E4 | `change` | Task 4 |
| 73 | `cli/templates/claude/settings.autonomous.json` → the *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS …"* comment string | template | E4 | `change` | Task 4. This repository's own profile lives under `.claude/`, which no task may edit, and does not carry this comment string. |
| 74 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | E4 | `no-change` | Its hits name `flow-walker.sh` as the planning loop's router. Planning is untouched, and the statements stay true. |
| 75 | `plugin/instructions/task_plan_writing_instructions_core.md` | — | E4 | `no-change` | Same as row 74: the walker invocations and the `<scripts_dir>` row are the planning loop's own. |
| 76 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | E4 | `no-change` | Same as row 74: its `<scripts_dir>` row names the planning loop's owners, which do not change. |
| 77 | `docs/flow-graph-walker.md` | — | E4 | `no-change` | The decisions of record for the flow-walker pilot. It enumerates no outer-loop set this branch extends. |
| 78 | `cli/templates/scripts/flow-walker.sh` (header) | template | E4 | `no-change` | Its header describes the walker alone and names no other script. |
| 79 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` → the `description:` (*"then run the QA phase"*), the paragraph opening **"Phase A (fixes) followed by a QA phase."**, and step 4 (*"The canonical loop for Phase A and the subsequent Phase QA … — and for Phase D"*) | — | E2 | `change` | Task 19 |

## Acceptance walk

_Recorded by Task 23 once every other task has landed. Until then this section holds only the six acceptance criteria from the task prompt, each awaiting its evidence._

1. With every gate green, the flow runs `<test_cmd>` exactly once per Run gates phase, implementers no longer run it per unit, and they still run `<typecheck_cmd>` per unit. — *pending*
2. The wrapper prints only `pass`, or `fail` plus the log path, and writes the log the way the plan chose. — *pending*
3. A failing gate opens the fix loop, and the loop returns to the gate run after the fixes land. — *pending*
4. A failure still present after 5 rounds parks the run and does not loop further. — *pending*
5. No plan writer asks for a test run in a `**Verification:**` bullet, whether the full suite, a gate, or a test file the unit did not write, and each plan reviewer raises one as a finding. The one run allowed is a test file the unit created or edited, and only when the unit has a way to run one file. Without one, the unit skips the run and raises no blocker. — *pending*
6. `bash scripts/run-gates.sh` prints no new failure. — *pending*
