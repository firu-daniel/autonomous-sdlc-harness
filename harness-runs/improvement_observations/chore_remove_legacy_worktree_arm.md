## `bash -n` on a shipped script is refused by the tool layer in an unattended unit
- **category:** tooling-gap
- **evidence:** three `layer-implementer` returns this run reported their plan's `bash -n <file>` syntax check as refused by the tool layer and recorded it as a deviation: Task 11 (`bash -n` on `cli/templates/scripts/launch-sandboxed-gates.sh`, deviation note in `harness-runs/task_plans/chore_remove_legacy_worktree_arm/task_11_plan.md`), Task 12 (`bash -n` on `cli/templates/scripts/setup-worktree.sh`, note in `task_12_plan.md`) and Task 5 (`bash -n` on each of its five script targets, note in `task_5_plan.md`). Each fell back on `bash scripts/typecheck.sh`'s shell-parse step (122 files, 0 failed); the Task 12 implementer stated it did not confirm that step's file list includes the edited script.
- **cost this run:** three plan verification steps not run as written; the syntax claim for three edited shell scripts rests on a substitute check.

## The run copy has no local `dev` ref, so `<default_branch>..HEAD` commands fail
- **category:** tooling-gap
- **evidence:** `statistics-plan-writer` reported that `dev..HEAD` failed in this checkout and read commits over `origin/dev..HEAD` instead; `architecture-reviewer` (A2) and `review-plan-reviewer` (C2.2) each reported diffing against `origin/dev` because `dev` has no local branch here. The Phase-D dispositioned-unit derivation was likewise run as `git log … origin/dev..HEAD`.
- **cost this run:** every `diff_base: dev` / `<default_branch>..HEAD` consumer had to substitute the remote-tracking ref on its own judgement.

## Plan unit needed 5 review rounds, every round net-new, and parked once at the revision cap
- **category:** optimization
- **evidence:** round artifacts for the plan unit: `harness-runs/task_plan_reviews/chore_remove_legacy_worktree_arm/` review_0–review_2 and `harness-runs/architecture_reviews/chore_remove_legacy_worktree_arm/` review_0–review_1 (5 FAIL rounds; the passing architecture and plan-review rounds of this session wrote no file). By finding heading, task-plan-review: review_0 2 findings; review_1 2 net-new, 0 re-raised; review_2 1 net-new, 0 re-raised. Architecture-review: review_0 1 finding; review_1 1 net-new, 0 re-raised. The walker escalated at its 5-revision cap (`reason: cap`, `rounds: architecture_review 2`, `rounds: plan_review 3`) and the run parked (question_2); the answered park granted one more round, which passed.
- **cost this run:** one park and a human answer before implementation could start; 3 extra dispatches in the resumed session.
- **hypothesis:** (guess) the scope register's derivation commands were widened one gap per round rather than once.

## Task 10 closed without a fix: example profile edit refused under `.claude/`
- **category:** tooling-gap
- **evidence:** commit `7a4da253`, unit `Task 10`, cause recorded on the commit: "tool-layer guard refused the Edit of examples/notes-app/.claude/settings.autonomous.json under a .claude/ path"; diagnosis in `harness-runs/task_plans/chore_remove_legacy_worktree_arm/task_10_plan.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix.

## Architecture Finding 1 closed without a fix: same refused `.claude/` edit
- **category:** tooling-gap
- **evidence:** commit `837a0302`, unit `Finding 1` (`harness-runs/architecture_branch_reviews/chore_remove_legacy_worktree_arm_arch_review.md`), cause recorded on the commit: "tool-layer guard refused the Edit of examples/notes-app/.claude/settings.autonomous.json under a .claude/ path"; diagnosis in `harness-runs/architecture_branch_reviews/chore_remove_legacy_worktree_arm_arch_review/finding_1.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix.
