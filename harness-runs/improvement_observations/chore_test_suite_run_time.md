## The configured test gate exits 1 on every run in this worktree, so no implementer could report it green
- **category:** tooling-gap
- **evidence:** `bash scripts/test.sh` (the configured `commands.test`) exited 1 on every call this session — Task 7 and code-review Findings 1, 2, 3, 4 and 5 — each time on `11 docs-retrieval relevance floor` only, 19 of 20 gates passing, with `the retrieval runtime is not installed, so the optional peers cannot be loaded; missing: autonomous-sdlc-harness`. The Task 7 and Finding 2 measurements (`bash scripts/measure-suite.sh`) show every `run-gates` run exiting 1 on the same gate at both the pre-branch commit `fe17b4e2293f` and `HEAD`.
- **cost this run:** every implementer reported the test gate as red and argued, per dispatch, that its change could not cause the failure; the gate gave no pass signal for any of the six units.
- **hypothesis:** the optional retrieval runtime is not installed in this checkout, so gate 11 cannot pass here regardless of the change.

## A bare `git --version` was refused by the permission profile during a fix dispatch
- **category:** tooling-gap
- **evidence:** the `layer-implementer` dispatch for code-review Finding 2 (`harness-runs/code_reviews/chore_test_suite_run_time_code_review/finding_2.md`, committed in `900fa13`) reported "The permission profile refused a bare `git --version`" and took the version instead from `bash scripts/measure-suite.sh`'s own `measure-suite: git --version: …` output line.
- **cost this run:** none beyond a workaround; the finding's verification step asked for that command by name.

## Host timings were taken under load averages of 20–60 on 10 cores, and a whole review item re-measured because of it
- **category:** shared-state
- **evidence:** the Task 7 `layer-implementer` return (commit `48f0148`) reported `uptime` 1-minute load averages of 31 to 60 during its after runs, and its before `run-gates.sh` (345 s) finished faster than its before `npm test` (429 s) although the first contains the second. Code-review Finding 2 (`harness-runs/code_reviews/chore_test_suite_run_time_code_review/finding_2.md`) was raised on that inconsistency; its fix (commit `900fa13`) re-measured both sides and recorded load averages of 20.86 before the before run and 5.66 before the after run.
- **cost this run:** one extra Should Fix review item and a re-measure dispatch of about 73 min (4,382 s) on top of Task 7's own 58 min (3,454 s).
- **hypothesis:** other autonomous runs on the same machine were running their suites concurrently.

# User-review fix round 1 — Gate 4 host row replaced with hand-measured figures

## The fix-plan writer's lessons-ledger append is a tracked edit that no fork step stages
- **category:** silent-failure
- **evidence:** after the `user-review-fix-plan-writer` initial-write dispatch, `git status --short` showed ` M harness-runs/lessons.md` (its step 6 appends to the ledger). `user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3` stages five explicit paths and `harness-runs/lessons.md` is not among them. Neither the Phase A `review_item` committer's staging nor any other fork step names it. The orchestrator added it by hand to the Override 3 wrapper call, and it landed in `748c1b1`.
- **cost this run:** none, because the path was added by hand. Following the override's list as written would have left a dirty tracked file at the Phase A boundary.

## The re-seed rule has no case for an existing ledger written by the other engine
- **category:** agent-contract
- **evidence:** on entry, `harness-runs/flow_progress/chore_test_suite_run_time_progress.md` (committed in `19417ce`) had the header `(engine: task)`, which carries no round number. `autonomous_pause_and_ledger.md` §1.4 decides only among "header round == active round", "older header round" and "absent". The orchestrator treated the task-engine header as an older round and re-seeded the file for round 1 (`b571093`).
- **cost this run:** one judgement call at Setup. Treating the file as a same-round resume instead would have made §1.7 read P/A-series entries that the user-review engine does not own.

## The configured test gate again exited 1 on gate 11 only
- **category:** tooling-gap
- **evidence:** the `layer-implementer` return for fix-plan Finding 1 (`harness-runs/user_reviews/chore_test_suite_run_time_fix_plan/finding_1.md`, committed in `d29c246`) reported that `bash scripts/test.sh` gave "run-gates: 1 failed, 19 passed", with the failure on `11 docs-retrieval relevance floor`.
- **cost this run:** the one fix unit shipped without a green test gate.

## Zero-yield: both reviewers that ran this round passed first time and changed nothing
- **category:** optimization
- **evidence:** the fix-plan `architecture-reviewer` gate ran once and returned PASS at iteration 0; no `harness-runs/architecture_user_review_reviews/chore_test_suite_run_time/` folder exists. The per-unit `layer-reviewer` ran on 1 of 1 fix units (Finding 1) and returned PASS at iteration 0; no `harness-runs/user_review_fix_plan_point_reviews/chore_test_suite_run_time_fix_plan/` folder exists. The unit count is 1.
- **cost this run:** 2 of this round's 6 dispatches produced no change.
