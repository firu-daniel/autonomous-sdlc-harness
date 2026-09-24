## The plan unit needed 4 review rounds before convergence
- **category:** optimization
- **evidence:** Convergence churn trip-wire: 4 review rounds on the plan unit. `architecture_reviews/feat_orchestrator_flow_graph_planning_pilot/` holds `review_0.md` and `review_1.md` (two more architecture rounds passed and wrote no file). `task_plan_reviews/feat_orchestrator_flow_graph_planning_pilot/` holds `review_0.md` and `review_1.md` (a third round passed). No business-parity folder exists because `phases.parity=false`. Round-over-round comparison, by finding title only:
  - architecture `review_1` vs `review_0`: 1 net-new, 3 re-raised. The net-new one is the Must Fix (`<scripts_dir>` added to two command files that don't declare it). The 3 re-raised are all Should Fix items that the revision prompt does not ask the writer to apply.
  - task-plan `review_1` vs `review_0`: Must Fix 1 net-new (Task 5 breaks `init.test.mjs`'s `OUTER_LOOP_SCRIPT_FILES` assertions) and 1 re-raised (scope-register derivation entry C still under-inclusive); Should Fix 3 net-new and 0 re-raised.
- **cost this run:** 13 planning dispatches (5 writer, 5 architecture, 3 task-plan-reviewer) for one plan. The loop converged at `iteration` 4, one revision short of the cap of 5.
- **hypothesis:** (guess) derivation entry C was re-raised because each widening of its grep reached new sites the previous command missed.

## The configured test command exited 1 on every implementer dispatch because of two gates outside the diff
- **category:** tooling-gap
- **evidence:** All 23 `layer-implementer` returns this run (Tasks 1–17, code-review Findings 1–5, skeptic Findings 1–3) report that `bash scripts/test.sh` exits 1. The failing gates were `1a plugin manifest` and `6a no machine paths` every time:
  - **1a:** `claude plugin validate --strict plugin` fails on six warnings about unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/hooks/hooks.json`. The Task 14 implementer found that `git diff` against merge base `1fd5ce9` for that file is empty.
  - **6a:** it flags the worktree's own `.git` pointer file and existing `harness-runs/` artifacts.
  - `npm test` (gate 4) passed on every return.
- **cost this run:** no task could meet a plan Verification line that required the test script to exit 0. Tasks 5, 7 and 8 recorded that as a `**Deviations from plan:**` note. Every "no regression" claim rested on reading which gates failed, not on the gate's exit status.
- **hypothesis:** (guess) 1a started failing when the installed `claude` CLI's validator began warning about unquoted plugin-root paths. A sibling worktree `fix_gate_6a_worktree_git_file` exists for 6a.

## Implementer and reviewer dispatches hit permission prompts on read-only verification commands
- **category:** tooling-gap
- **evidence:** these commands were refused or needed approval mid-dispatch, as the returns report:
  - `bash -n` on `scripts/check-flow-graph.sh` (Task 13)
  - direct `claude plugin validate --strict plugin` (Task 11)
  - the merge base's `run-gates.sh` in a scratch worktree (Task 14)
  - `npm run validate:flow-graph` / `:negative` and a combined verification command (code-review Finding 4, both layers)
  - `/tmp` / `mktemp` fixture creation (skeptic-reviewer)
  - `chmod 755 scripts/flow-walker.sh` (Task 15)
  - the orchestrator's own `bash scripts/check-llms-txt.sh`, issued as one part of a compound command after Task 16
- **cost this run:** each check was replaced by a weaker kind of evidence (reading, or relying on another gate's coverage), and each return records that. On Task 15 the implementer got the executable mode through a `cp` + `mv` workaround instead of the refused `chmod`.

## The story-task commit prefix taken from the branch name contradicts this repository's commit policy
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` substitution row `A` sets `commit_prefix` "from the branch name: `feat_` → `feat`". This run's 17 task commits (`98fef10`…`8d50dba`) therefore carry `feat:`. `.claude/context/conventions.md` → the commit-policy per-class table designates **`none`** for "Adding new work — a story task's commit", and the committer for Task 15 (`03de3a9`) pointed out the conflict in its return.
- **cost this run:** 17 commit subjects don't follow the repository's own commit policy. The fix commits (Phase C / C2) used `none` and do follow it.

## The plan writer reported two stale conventions rules this branch invalidates
- **category:** tooling-gap
- **evidence:** the first `task-plan-writer` return carried `## Corpus staleness` with two `stale-rule` entries:
  - (1) `.claude/context/conventions.md`: `## What accompanies a new unit of each kind` ("A negative schema fixture" row, plus the "An outer-loop script" row) and `## The stack…`'s `schemas/` bullet name only `validate:config` / `validate:config:negative`. This branch adds a second schema with its own `validate:flow-graph:negative` chain and a schema-valid `schemas/flow-graph-check/` fixture set. It also makes an `OUTER_LOOP_SCRIPTS` row able to be a sourced library or flow data.
  - (2) `.claude/context/plugin.md`: `## Where a new asset goes` has no row for an orchestrated flow's routing, which for planning now lives in a graph under `cli/templates/scripts/flows/` walked by `<scripts_dir>/flow-walker.sh`.
- **cost this run:** owed follow-up restatements. (1) Each schema's negatives are wired into that schema's own `validate:<name>:negative`, static-check fixtures are proved by their checker, and an outer-loop row may be a script, a sourced library or flow data. (2) A row saying "the routing of an orchestrated flow → a graph under `cli/templates/scripts/flows/`, walked by the outer-loop walker; the core keeps the dispatch blocks and every non-routing rule". Either a supervised `/autonomous-sdlc-harness:harness-analyze` run (answer `skip` for every already-filled document) or a hand edit.
