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
