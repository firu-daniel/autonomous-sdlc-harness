# Story: Bind `<MAIN_REPO>` in a `## Resolved values` row everywhere an unattended run reads it, and name the agent's push only as the main checkout's copy

## Context

This branch changes prose only, plus one contract test. An unattended run gets one grant for its push: the permission profile's literal `allow` entry for the main checkout's copy of the wrapper, `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`. Only that spelling is in `sandbox.excludedCommands`. Some autonomous files still describe the push as a bare `<scripts_dir>/push-branch.sh` or with a `$REPO_ROOT` argument. Others resolve `<MAIN_REPO>` in passing, with no rule on how to spell it. An orchestrator that follows those words issues a push that matches neither entry. The push is best-effort, so the refusal or the failed sandboxed push leaves the commits local with no other sign. The branch fixes the words and adds a guard that keeps them fixed. It changes no wrapper, profile, guard or watcher, and it leaves the resolution clause exactly as #183 worded and housed it.

**The two literals every task copies, byte for byte.** Never retype either one.
- **The `<MAIN_REPO>` row** is the line `plugin/agents/committer.md` → `## Resolved values` already carries. The same row appears byte-identically in seven other files. It is the resolution clause followed by the sentence `Spell it as a literal absolute path in the command, never through a substitution or a variable.` Each file that gains a row copies that line whole.
- **The push spelling** is `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal, as `plugin/commands/branch-start-user-review-fix-autonomous.md` → `## Hard boundary` writes it. A file that does not declare `<MAIN_REPO>` and `<repo_root>` itself names "the main checkout's copy" in words, or points at a section that spells it. It never uses a token it does not bind.

**Moving the clause, not rewording it.** When a file's clause moves from a body step into its new row, the clause's occurrence count in that file stays the same. The step it leaves now points at the row: "`<MAIN_REPO>` resolves per its `## Resolved values` row". The `## Who may cite this` roster in `plugin/instructions/main_repo_resolution.md` names files, not positions, so it stays unchanged. `<MAIN_REPO>` also leaves each file's list of "ordinary path placeholders" / "none of the three" tokens, because the table now declares it.

**Decisions this plan takes (goal 1 and goal 3 of the task prompt).**
- **The three orchestration and fix-planning forks are in scope.** `plan_orchestration_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md` and `user_review_fix_plan_writing_instructions_autonomous.md` each bind `<MAIN_REPO>` in their body ("bound where it is written"). Each uses its own reworded variant of the literal-spelling rule. The search turned them up beyond the three files the prompt names, so each gains the row (Tasks 3 and 4).
- **`plugin/instructions/prompt_injection_screen.md` gains the sentence; `plugin/instructions/main_repo_resolution.md` does not.** The screen is read by all three autonomous engines and issues its own commit and push under `<MAIN_REPO>`. It inherits the value rather than resolving it, so its row keeps "this file never resolves it again" and appends the literal-spelling sentence (Task 5). The resolution module is #183's single home of the clause. It produces the value and never spells it into a command, so the sentence has nothing there to bind. Editing it would touch the home the constraints reserve.
- **`plugin/agents/qa-tester.md` is left as it is.** Its clause locates `.claude/settings.autonomous.json` for the Read tool. It never puts `<MAIN_REPO>` into a command, so the command-spelling sentence binds nothing there.
- **The six user-invoked commands are left as they are.** These are `branch-prompt.md`, `branch-user-review.md`, `branch-resume.md`, `branch-pause.md`, `branch-answer.md` and `branch-status.md`. None issues a push. Each runs in a supervised session, where a command the permission profile does not match raises a prompt the user answers, not the immediate refusal `dontAsk` gives an unattended run. No outer-loop script or workflow under `cli/templates/` invokes any of them headless (`git grep` for their names under `cli/templates/scripts` and `cli/templates/github` finds none). Task 6's guard records this exemption, and the one above, with their reasons, so a new binder cannot go unclassified.
- **`plugin/commands/branch-start-user-review-fix-autonomous.md` is the model and stays unchanged.** That includes its step 2, which still restates the clause.

**Ship order.** The tasks run plugin layer first (Tasks 1–5), then the `cli` test (Task 6). This departs from the configured `layers[]` order (`cli`, `plugin`, `general`) on purpose. Task 6's guard asserts the plugin corpus's end state, so landing it first would ship a red suite. Task 6 consumes what Tasks 1–5 produce. No task here belongs to the catch-all `general` layer.

**Top risks:** The likeliest failure is a new `<MAIN_REPO>` row that differs by a byte from the existing eight, giving two wordings to keep in step. Every task that adds a row verifies it against `committer.md`'s line, and Task 6's needle is the whole row, so any drift goes red. The second risk is a clause count that changes when a clause moves into a row, which would break #183's corpus suite and its roster. Every task that moves a clause checks that its count is unchanged. The third is a guard that is green but cannot go red. Task 6 runs each new case red once, against a named working-tree mutation it then reverts, and records each in the suite's header.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational progress markers only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_docs_flow_main_repo_binding/task_<K>_plan.md`.

1. [x] **Task 1** — Give the plan and docs engine commands a `<MAIN_REPO>` row and the literal push spelling _(layer: plugin)_ _(points: 15)_
2. [x] **Task 2** — Bind `<MAIN_REPO>` in the docs fork's table and point the docs phase at the main checkout's wrappers _(layer: plugin)_ _(points: 10)_
3. [x] **Task 3** — Move `<MAIN_REPO>` into a row in both orchestration forks and spell the post-commit push literally _(layer: plugin)_ _(points: 15)_
4. [x] **Task 4** — Fix the planning forks' "Push after the commit" prose and bind `<MAIN_REPO>` in the fix-plan fork's table _(layer: plugin)_ _(points: 15)_
5. [ ] **Task 5** — Point the committer's `push` argument, the prompt-injection screen's row and the flow document's push at the main checkout's copy _(layer: plugin)_ _(points: 10)_
6. [ ] **Task 6** — Extend the `<MAIN_REPO>` corpus suite with the row, the push spelling and the forbidden resolutions, each run red once _(layer: cli)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted from the task prompt (`harness-runs/task_prompts/fix_docs_flow_main_repo_binding_task_prompt.md`, opening paragraph): *"makes every autonomous file that names the agent's push spell it one way: `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal. It also makes every autonomous `<MAIN_REPO>` binding carry the literal-spelling rule in its own `## Resolved values` row."* Goal 1 widens it to *"any other site the search turns up under `plugin/` or `cli/templates/` that an unattended run reads."*

**Derivation entry D1: push mentions in the plugin corpus (command).** Re-run verbatim from the checkout root: `git grep -n -F push-branch.sh -- plugin`. Per-candidate rule: a mention is `change` when it describes the act of the agent's push in a spelling other than the main checkout's copy. That covers a bare `<scripts_dir>/push-branch.sh`, an unqualified "then `push-branch.sh`", or a `$REPO_ROOT` argument. A mention is `no-change` when it already spells or points at the main checkout's copy, or names the wrapper as an object: a property, a token-row inventory, or a quoted anti-pattern.

**Derivation entry D2: push mentions in the adopter templates (command).** Re-run verbatim: `git grep -l -F push-branch.sh -- cli/templates`.

**Derivation entry D3: `<MAIN_REPO>` token sites (command).** Re-run verbatim: `git grep -l -F "<MAIN_REPO>" -- plugin cli/templates`.

**Derivation entry D4: resolution-clause sites (command).** Re-run verbatim: `git grep -l -F "printenv HARNESS_MAIN_REPO" -- plugin cli/templates`. It reaches the one binder D3 misses, `plugin/agents/qa-tester.md`, which carries the clause without the token.

**Derivation entry D5: standing-artifact rows (procedure).** **Artifact:** `harness-runs/lessons.md`, the one standing tracked artifact under `<state_dir>`. **Traversal:** its `## ` topic headings in file order, then each `- **` rule line under each heading. **Decision rule:** a rule is reached when it names the push wrapper's spelling, the `<MAIN_REPO>` binding, or a `## Resolved values` row. Walked at plan time, it reaches no rule, so it contributes no row.

**Closure invariant:** every site each derivation entry reaches appears as a row below. D1 rows are per mention. D2–D4 rows are per file, and a file both D3 and D4 reach has one row naming both.

| # | Site (path + symbol or quoted anchor) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/committer.md` → `## Resolved values` `<scripts_dir>` row ("`push-branch.sh` among them. Both are invoked under `<MAIN_REPO>`") | — | D1 | `no-change` | inventory row, already names the main checkout |
| 2 | `plugin/agents/committer.md` → `## Invocation contract`, the `push` argument ("pushes the branch via `<scripts_dir>/push-branch.sh`") | — | D1 | `change` | Task 5 |
| 3 | `plugin/agents/committer.md` → step 6 **Push:** ("call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`") | — | D1 | `no-change` | already the literal spelling |
| 4 | `plugin/commands/branch-start-docs-autonomous.md` → `## Resolved values` `<scripts_dir>` row ("`push-branch.sh`, in the hard boundary") | — | D1 | `change` | Task 1 (adds "under `<MAIN_REPO>`", as the model row does) |
| 5 | `plugin/commands/branch-start-docs-autonomous.md` → `## Hard boundary` ("via `<scripts_dir>/push-branch.sh`") | — | D1 | `change` | Task 1 |
| 6 | `plugin/commands/branch-start-docs-autonomous.md` → `## Hard boundary` ("`push-branch.sh` self-refuses a branch") | — | D1 | `no-change` | names a wrapper property, not the agent's spelling |
| 7 | `plugin/commands/branch-start-plan-autonomous.md` → `## Resolved values` `<scripts_dir>` row ("`push-branch.sh`, in the hard boundary") | — | D1 | `change` | Task 1 |
| 8 | `plugin/commands/branch-start-plan-autonomous.md` → `## Hard boundary` ("via `<scripts_dir>/push-branch.sh`") | — | D1 | `change` | Task 1 |
| 9 | `plugin/commands/branch-start-plan-autonomous.md` → `## Hard boundary` ("enforced by `push-branch.sh` (it self-refuses") | — | D1 | `no-change` | wrapper property |
| 10 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `<scripts_dir>` row ("under `<MAIN_REPO>`") | — | D1 | `no-change` | the model |
| 11 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → step 1 ("name the main checkout's copies, … `push-branch.sh`") | — | D1 | `no-change` | already names the main checkout's copy |
| 12 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `## Hard boundary` ("via `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal") | — | D1 | `no-change` | the model spelling |
| 13 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `## Hard boundary` ("enforced by `push-branch.sh`") | — | D1 | `no-change` | wrapper property |
| 14 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## The wiring table`, Git wrappers row ("`commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` in `<scripts_dir>`") | — | D1 | `no-change` | inventory; the same row goes on to name the main checkout's copies |
| 15 | `plugin/docs/AUTONOMOUS_FLOW.md` → same row ("An agent calls `commit-on-branch.sh` and `push-branch.sh` as the main checkout's copies") | — | D1 | `no-change` | already the main checkout's copy |
| 16 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Output guarantee`, **What the flow does push.** ("through `push-branch.sh` in `<scripts_dir>`") | — | D1 | `change` | Task 5 |
| 17 | `plugin/instructions/autonomous_pause_and_ledger.md` → `## Resolved values` `<scripts_dir>` row (script inventory) | — | D1 | `no-change` | inventory |
| 18 | `plugin/instructions/autonomous_pause_and_ledger.md` → same row ("are both invoked as the main") | — | D1 | `no-change` | already the main checkout |
| 19 | `plugin/instructions/autonomous_pause_and_ledger.md` → §1.6 ("`bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`. Call each wrapper once, alone.") | — | D1 | `no-change` | literal spelling |
| 20 | `plugin/instructions/autonomous_pause_and_ledger.md` → §1.6 ⚠️ ("the ` then bash push-branch.sh …` piece") | — | D1 | `no-change` | quotes the refused compound as an anti-pattern |
| 21 | `plugin/instructions/autonomous_pause_and_ledger.md` → §1.6 ("`push-branch.sh` is non-fatal") | — | D1 | `no-change` | wrapper property |
| 22 | `plugin/instructions/clarification_digest_instructions.md` → `<scripts_dir>` row ("`push-branch.sh` in `## Push`") | — | D1 | `no-change` | inventory |
| 23 | `plugin/instructions/clarification_digest_instructions.md` → `## Push` fence | — | D1 | `no-change` | literal spelling |
| 24 | `plugin/instructions/dispatch_discipline_instructions.md` → `<scripts_dir>` row | — | D1 | `no-change` | inventory |
| 25 | `plugin/instructions/dispatch_discipline_instructions.md` → `## Push` fence | — | D1 | `no-change` | literal spelling |
| 26 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` push fence | — | D1 | `no-change` | literal spelling |
| 27 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → same section ("`push-branch.sh` is best-effort, non-fatal") | — | D1 | `no-change` | wrapper property |
| 28 | `plugin/instructions/docs_phase_instructions.md` → `## Loop` step 2 **Commit + push.** ("then `push-branch.sh` as a separate, **ungated** statement") | — | D1 | `change` | Task 2 |
| 29 | `plugin/instructions/docs_phase_instructions.md` → `## Commit mechanics` ("then `push-branch.sh` issued unconditionally") | — | D1 | `change` | Task 2 |
| 30 | `plugin/instructions/improvement_observations_instructions.md` → `<scripts_dir>` row | — | D1 | `no-change` | inventory |
| 31 | `plugin/instructions/improvement_observations_instructions.md` → `## Push` fence | — | D1 | `no-change` | literal spelling |
| 32 | `plugin/instructions/improvement_observations_instructions.md` → ⚠️ **No exit-code gate** ("`push-branch.sh` is non-fatal") | — | D1 | `no-change` | wrapper property |
| 33 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `### Override E` fence | — | D1 | `no-change` | literal spelling |
| 34 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `### Override E` ⚠️ ("`push-branch.sh` is non-fatal") | — | D1 | `no-change` | wrapper property |
| 35 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Flow-progress ledger — Implementation flip points.** ("`<MAIN_REPO>/<scripts_dir>/push-branch.sh`** operation") | — | D1 | `no-change` | already the main checkout's copy (task-prompt "already fixed") |
| 36 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → Override H **Commits** bullet | — | D1 | `no-change` | already the main checkout's copy |
| 37 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → clean-tree entry 9 | — | D1 | `no-change` | already the main checkout's copy |
| 38 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → clean-tree entry 10 | — | D1 | `no-change` | already the main checkout's copy |
| 39 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → clean-tree entry 15 ("followed by its own `push-branch.sh`") | — | D1 | `change` | Task 3 |
| 40 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Post-commit push.** ("push via `<scripts_dir>/push-branch.sh`") | — | D1 | `change` | Task 3 |
| 41 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Post-commit push.** ("a plain, single-statement `push-branch.sh` call") | — | D1 | `change` | Task 3 |
| 42 | `plugin/instructions/prompt_injection_screen.md` → `## The steps` step 4 push fence | — | D1 | `no-change` | literal spelling |
| 43 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 3 push fence | — | D1 | `no-change` | literal spelling |
| 44 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 3 **Push after the commit.** ("The `<scripts_dir>/push-branch.sh` call above", "It uses the `$REPO_ROOT` the calling command") | — | D1 | `change` | Task 4 |
| 45 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 4 push fence | — | D1 | `no-change` | literal spelling |
| 46 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 4 ⚠️ ("`push-branch.sh` is non-fatal") | — | D1 | `no-change` | wrapper property |
| 47 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → Override 4 **Push after the commit.** (same two phrases) | — | D1 | `change` | Task 4 |
| 48 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → **Flip the `## Planning` entries** | — | D1 | `no-change` | already the main checkout's copy |
| 49 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `<app_root>` binding ("Override 3's `push-branch.sh` call names `<MAIN_REPO>`'s copy") | — | D1 | `no-change` | already the main checkout's copy |
| 50 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 3 push fence | — | D1 | `no-change` | literal spelling |
| 51 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 3 ⚠️ ("`push-branch.sh` is non-fatal") | — | D1 | `no-change` | wrapper property |
| 52 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 3 **Push after the commit.** ("The `<scripts_dir>/push-branch.sh` call above", "It uses the `$REPO_ROOT` the calling command") | — | D1 | `change` | Task 4 |
| 53 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → **Flip the `## Fix planning` entries** | — | D1 | `no-change` | already the main checkout's copy |
| 54 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → Override 5 push fence | — | D1 | `no-change` | literal spelling |
| 55 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → Override E push fence | — | D1 | `no-change` | literal spelling |
| 56 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → Override E ⚠️ ("`push-branch.sh` is non-fatal") | — | D1 | `no-change` | wrapper property |
| 57 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → **Flip the `## Fixing` entries** | — | D1 | `no-change` | already the main checkout's copy |
| 58 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → Override H **Commits** bullet | — | D1 | `no-change` | already the main checkout's copy |
| 59 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → Override L push fence | — | D1 | `no-change` | literal spelling |
| 60 | `cli/templates/claude/settings.autonomous.json` (`_README`) | — | D2 | `no-change` | the permission profile; constraint: profile unchanged |
| 61 | `cli/templates/github/workflows/harness-control.yml` | — | D2 | `no-change` | workflow, not agent-read prose; its push is not the agent's |
| 62 | `cli/templates/github/workflows/harness-run.yml` | — | D2 | `no-change` | workflow, not agent-read prose |
| 63 | `cli/templates/github/workflows/harness-trigger.yml` | — | D2 | `no-change` | workflow, not agent-read prose |
| 64 | `cli/templates/scripts/autonomous-watcher.sh` | — | D2, D3, D4 | `no-change` | the watcher; constraint: watcher unchanged |
| 65 | `cli/templates/scripts/commit-on-branch.sh` | — | D2 | `no-change` | a push wrapper sibling; constraint: wrappers unchanged |
| 66 | `cli/templates/scripts/create-worktree.sh` | — | D2 | `no-change` | outer-loop script, not agent-read prose |
| 67 | `cli/templates/scripts/launch-sandboxed-gates.sh` | — | D2 | `no-change` | wrapper; constraint |
| 68 | `cli/templates/scripts/lib/harness-run-lib.sh` | — | D2 | `no-change` | outer-loop library, not agent-read prose |
| 69 | `cli/templates/scripts/push-branch.sh` | — | D2 | `no-change` | the push wrapper itself; constraint |
| 70 | `cli/templates/scripts/refresh-branch.sh` | — | D2 | `no-change` | wrapper; constraint |
| 71 | `cli/templates/scripts/remote-run.sh` | — | D2 | `no-change` | outer-loop script, not agent-read prose |
| 72 | `cli/templates/scripts/setup-worktree.sh` | — | D2 | `no-change` | outer-loop script, not agent-read prose |
| 73 | `cli/templates/scripts/restart-watcher.sh` | — | D3 | `no-change` | watcher restart script; constraint: watcher unchanged |
| 74 | `plugin/agents/committer.md` → `## Resolved values` `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row; source of the literal |
| 75 | `plugin/agents/qa-tester.md` → the mocking bullet ("`.claude/settings.autonomous.json` under the **main** checkout, the path a bare `printenv HARNESS_MAIN_REPO` prints") | — | D4 | `no-change` | resolves a Read-tool path and never spells `<MAIN_REPO>` into a command; exempt, with reason, in Task 6 |
| 76 | `plugin/commands/branch-answer.md` → step 1 | — | D3, D4 | `no-change` | supervised, user-invoked, issues no push (goal 3); exempt in Task 6 |
| 77 | `plugin/commands/branch-pause.md` → step 1 | — | D3, D4 | `no-change` | supervised, user-invoked (goal 3); exempt in Task 6 |
| 78 | `plugin/commands/branch-prompt.md` → step 1 | — | D3, D4 | `no-change` | supervised, user-invoked (goal 3); exempt in Task 6 |
| 79 | `plugin/commands/branch-resume.md` → step 1 | — | D3, D4 | `no-change` | supervised, user-invoked (goal 3); exempt in Task 6 |
| 80 | `plugin/commands/branch-status.md` → step 1 | — | D3, D4 | `no-change` | supervised, user-invoked (goal 3); exempt in Task 6 |
| 81 | `plugin/commands/branch-user-review.md` → step 1 | — | D3, D4 | `no-change` | supervised, user-invoked (goal 3); exempt in Task 6 |
| 82 | `plugin/commands/branch-start-docs-autonomous.md` → `## Resolved values` lead paragraph and step 2 **Global kill switch** | — | D3, D4 | `change` | Task 1 |
| 83 | `plugin/commands/branch-start-plan-autonomous.md` → `## Resolved values` lead paragraph and step 2 **Global kill switch** | — | D3, D4 | `change` | Task 1 |
| 84 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `## Resolved values` `<MAIN_REPO>` row | — | D3, D4 | `no-change` | the model |
| 85 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Resolved values` `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row (its push prose is row 16) |
| 86 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → opening paragraph ("declared once in that document's `## Resolved values` table") | — | D3 | `no-change` | names the token, binds nothing |
| 87 | `plugin/instructions/autonomous_pause_and_ledger.md` → `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row |
| 88 | `plugin/instructions/clarification_digest_instructions.md` → `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row |
| 89 | `plugin/instructions/dispatch_discipline_instructions.md` → `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row |
| 90 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Resolved values` lead paragraph and `## Setup (once, at session start)` step 1 | — | D3, D4 | `change` | Task 2 |
| 91 | `plugin/instructions/improvement_observations_instructions.md` → `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row |
| 92 | `plugin/instructions/main_repo_resolution.md` → `## Resolved values` `<MAIN_REPO>` row | — | D3, D4 | `no-change` | the clause's single home (#183's); produces the value and spells no command with it |
| 93 | `plugin/instructions/mode_contract.md` → `<gate_launcher>` vocabulary row | — | D3 | `no-change` | names the token in a binding description, binds nothing |
| 94 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Resolved values` lead paragraph, `<gate_launcher>` binding, `## Override B — global kill switch` **Path:** bullet | — | D3, D4 | `change` | Task 3 |
| 95 | `plugin/instructions/prompt_injection_screen.md` → `<MAIN_REPO>` row ("resolved at its global-kill-switch step") | — | D3 | `change` | Task 5 |
| 96 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `<MAIN_REPO>` row | — | D3, D4 | `no-change` | already carries the row (its push prose is rows 44, 47) |
| 97 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Resolved values` lead paragraph, `## Safety scaffolding` step 1 **STOP checks.** | — | D3, D4 | `change` | Task 4 |
| 98 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Resolved values` lead paragraph, `<gate_launcher>` binding, `## Override B` **Path:** bullet | — | D3, D4 | `change` | Task 3 |
