## `bash -n` syntax check on edited shell templates refused by the permission layer
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 1–13, code-review Finding 5 and skeptic Finding 2 each report `bash -n cli/templates/scripts/remote-run.sh` refused ("requires approval"); Task 7's return reports the same for `cli/templates/scripts/autonomous-watcher.sh`. Each implementer substituted its own test-file run as the parse evidence and recorded the downgrade in the unit's detail file (e.g. `harness-runs/task_plans/feat_forge_run_control/task_1_plan.md`).
- **cost this run:** 15 units shipped shell-template edits with no syntax check of their own; parse correctness rested on test suites and on the Phase G run (which printed `pass` on round 1).
- **hypothesis:** the unattended permission profile carries no allow entry matching `bash -n <path>`.

## `claude plugin validate --strict plugin` not run by plugin-layer implementers
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Task 20 (`plugin/agents/user-review-fix-plan-writer.md`) and Task 21 (`plugin/docs/AUTONOMOUS_FLOW.md`) each report the manifest gate `claude plugin validate --strict plugin` needed approval and was not run.
- **cost this run:** two plugin-layer units shipped without the manifest gate at unit time.

## Committer reported `pushed: failed`; a plain push-helper retry succeeded
- **category:** silent-failure
- **evidence:** the `committer` return for Task 19 (commit `3b6670c`) carried `pushed: failed`; the orchestrator's next `bash scripts/push-branch.sh <repo root>` printed `93fd251..3b6670c  feat_forge_run_control -> feat_forge_run_control`.
- **cost this run:** one commit sat unpushed until the next manual push; no rework.
- **hypothesis:** transient remote failure.

## Row A's branch-name `commit_prefix` disagrees with the conventions document's per-class designation
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` → `## Substitution table` row `A` sets `commit_prefix` "from the branch name: `feat_` → `feat`", which produced `feat:` on all 31 task commits (`d6cf8e7` … `bd44229`). `.claude/context/conventions.md` → its commit-class table designates **`none`** for "Adding new work — a story task's commit" and reserves `chore` as the only prefix token in use. The fix rows (A2.3, C, C2.4) followed the conventions document's `none` designation, so the branch carries both forms.
- **cost this run:** 31 commit subjects carry a prefix the repository's own commit policy says it does not use.

## Corpus staleness reported by the plan writer
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return carried `## Corpus staleness` with one `stale-rule` entry: `.claude/context/conventions.md` → `## Not determined`, the bullet "What the configuration key `forge` means beyond the issue trigger is not settled", falsified by this branch delivering the draft pull request, comment-based park-and-ask, comment commands, review rounds, lifecycle comments and state labels.
- **cost this run:** owes a restatement — `forge` `github` with `execution.target` `github-actions` turns on the whole GitHub coupling; adapters beyond GitHub are what remains. Route: a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run, or a hand edit.

## Convergence churn: the plan needed 4 review rounds
- **category:** optimization
- **evidence:** plan rounds across its review roots — `harness-runs/task_plan_reviews/feat_forge_run_control/` holds `review_0.md`, `review_1.md`, `review_2.md` (the fourth `task-plan-reviewer` pass returned PASS and wrote none), and `harness-runs/architecture_reviews/feat_forge_run_control/` holds `review_0.md`: 4 round artifacts. Within `task_plan_reviews/`, by Must Fix heading: round 0 — 3 findings; round 1 — 2 net-new, 0 re-raised; round 2 — 2 net-new, 0 re-raised. `architecture_reviews/` is a one-round series (1 finding).
- **cost this run:** 14 planning dispatches (`.dispatch_counter` reached 14 at planning convergence) for a 31-task plan.

# User-review fix round 1 — never refuse an in-flight review; collect every reviewer; auto-start the next round

## The fix-plan writer's lessons-ledger append is staged by no commit point of the autonomous fix flow
- **category:** silent-failure
- **evidence:** after the `user-review-fix-plan-writer` initial-write dispatch, `git status --short` showed ` M harness-runs/lessons.md` (two lines appended per the writer's `## Process` step 6). `user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3` stages only the fix-plan index, the review, the per-finding folder and the two gate folders; a grep of `user_review_fix*_autonomous.md`, `user_review_fixes_instructions_core.md` and `committer.md` for `lessons.md` returned nothing. The orchestrator committed it separately as `d91a842` (`chore: Add user-review lessons for feat_forge_run_control`) to keep the tracked tree clean.
- **cost this run:** one out-of-contract commit; without it the tracked tree would have been dirty from fix-plan convergence onward.

## Implementer scratch probes carrying the checkout path failed Run gates round 1
- **category:** agent-contract
- **evidence:** the Finding 2 `cli` `layer-implementer` return stated it left a gitignored copy of the collector at `harness-runs/scratch/round_collect.sh`; `bash scripts/run-test-suite.sh review_1_round_1` printed `fail harness-runs/test_run_logs/feat_forge_run_control/review_1_round_1.log`, and the test fix plan `harness-runs/test_fix_plans/feat_forge_run_control_review_1_round_1.md` diagnosed four probes under `harness-runs/scratch/` (`collect_control_probe.mjs`, `collect_on_branch_probe.mjs`, `gen_collect_probe.py`, `round_collect.sh`) tripping the machine-path gate. Round 2 printed `pass` after they were deleted.
- **cost this run:** one extra gate run and 6 dispatches (#17–#22: writer, architecture gate, plan commit, implementer, reviewer, index-only commit).

## Row UR-A's severity `commit_prefix` disagrees with the conventions document's per-class designation
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` → `#### Row UR-A` maps `## Must Fix` → `fix`, which produced `fix:` on `92d21d2`, `57a8427`, `9cee5cf` and `905285a`. `.claude/context/conventions.md` designates **`none`** for "Fixing existing work"; row `G.4` in the same run followed that designation (`8e6375c`, no prefix), as did the task run's fix rows (`24122fb`, `5ea7446`, …).
- **cost this run:** four commit subjects carry a prefix the repository's own commit policy says it does not use.

## The user-review ledger creation rule has no case for an existing task-engine ledger
- **category:** agent-contract
- **evidence:** `harness-runs/flow_progress/feat_forge_run_control_progress.md` existed with header `(engine: task)` and no round. `autonomous_pause_and_ledger.md` → `### 1.4` names three cases for the user-review engine (same round → resume, older round → re-seed, absent → create); none matches a ledger of the other engine. The orchestrator treated it as create and overwrote it from the user-review template (`e47d7ce`).
- **cost this run:** none measured; the choice was the orchestrator's own reading.

## Index-only commit
- **category:** optimization
- **evidence:** `8e6375c` — `Finding 1` (test fix plan `review_1_round_1`) — `Mark Finding 1 done — test fix plan index flip only`; the unit's work was deleting gitignored files, so no tracked work file existed to stage.
- **cost this run:** one commit whose subject records only the readiness flip.
