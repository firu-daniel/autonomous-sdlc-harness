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
