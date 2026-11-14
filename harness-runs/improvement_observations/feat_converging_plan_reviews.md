## The plan unit needed 9 plan-review rounds across two reviewers before converging
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/feat_converging_plan_reviews/` holds `review_0.md`–`review_4.md` (5 rounds) and `harness-runs/architecture_reviews/feat_converging_plan_reviews/` holds `review_0.md`–`review_3.md` (4 rounds); `phases.parity` is `false`, so no business-parity folder. Per round, by finding-title match against the same root's predecessor — task-plan-reviewer: r0 10 findings; r1 7 net-new, 0 re-raised; r2 2 net-new, 0 re-raised; r3 2 net-new, 0 re-raised; r4 2 net-new, 0 re-raised. architecture-reviewer: r0 5 findings; r1 3 net-new, 0 re-raised; r2 1 net-new, 1 re-raised (the four new fixed-form commit subjects not recorded in the commit-message policy, raised in r1); r3 1 net-new, 0 re-raised. Counted by this (resumed) session from the artifacts on disk; the planning half ran in an earlier session.
- **cost this run:** 9 plan-review rounds plus the matching writer revisions before implementation began.

## Two plan reviewers raised the same Task 10 roster finding
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/feat_converging_plan_reviews/review_0.md` finding 4 "Task 10's roster names two citers that no task makes cite the module" and `harness-runs/architecture_reviews/feat_converging_plan_reviews/review_1.md` finding 1 "`task_10_plan.md` — the module's `## Who may cite this` roster names two forks that no task makes cite it" — same unit (the plan), compared by title only.
- **cost this run:** one finding reviewed and reported twice.

## The Run gates run form started in an interactive session after three headless attempts failed to start
- **category:** tooling-gap
- **evidence:** in this manual-entry session, `bash scripts/run-test-suite.sh task_round_1` printed `pending` (exit 3) right after `launch-sandboxed-gates.sh … task_round_1` printed `in-session` (exit 4), and `--wait` later returned `fail harness-runs/test_run_logs/feat_converging_plan_reviews/task_round_1.log`; round 2 (`task_round_2`) also started and returned `pass`. The open park `harness-runs/clarifications/feat_converging_plan_reviews/question_4.md` records the same run form exiting 2 in the headless sessions with `run-test-suite.sh: the detached run of task_round_1 did not start`, on three attempts.
- **cost this run:** the headless run parked three times at Phase G; completion needed a manual-entry session.
- **hypothesis:** (guess) the detached worker cannot start under the headless run's sandbox/profile but can in an interactive session.

## A headless park question was left open while the manual entry point completed the run
- **category:** agent-contract
- **evidence:** `harness-runs/clarifications/feat_converging_plan_reviews/question_4.md` (origin `Phase G gates`) has no `answer_4.md`; this manual-entry session took the Phase G answer lookup's manual arm (no files written, G.0 behaves as with no park) and ran Phase G to `pass` and on to Phase D with that question file still top-level and unanswered.
- **cost this run:** a stale open question remains in the clarification directory after the run reached "branch ready for review".

## An implementer reported piping test runs against the test-run rule
- **category:** agent-contract
- **evidence:** the G.4 `layer-implementer` return for test-fix Finding 1 (`harness-runs/test_fix_plans/feat_converging_plan_reviews_task_round_1/finding_1.md`) stated that its first runs of three tree guards and one test-file run "were also piped, against the test-run rule", then rerun unpiped.
- **cost this run:** duplicated targeted test runs inside one unit.
