## The unattended profile refuses every way to set a self-adopted script's executable bit, so the unit parked
- **category:** tooling-gap
- **evidence:** Architecture-review Finding 2 (`harness-runs/architecture_branch_reviews/fix_task_offer_check_script_arch_review/finding_2.md`) asked for mode `0755` on the self-adopted `scripts/task-offer-check.sh`. Park 2's question file (`harness-runs/clarifications/fix_task_offer_check_script/question_2.md`, machine-local) records `chmod +x scripts/task-offer-check.sh`, `chmod 755` and `git update-index --chmod=+x scripts/task-offer-check.sh` each refused with "Permission to use Bash has been denied because Claude Code is running in don't ask mode", in Task 8 and again in the A2.3 fix loop. The operator answered option (a) and set the bit by hand. On resume, the fix landed as `40265dbc`.
- **cost this run:** one park-and-resume cycle, plus a manual operator step before the A2.3 fix loop could close.

## Run gates round 1 failed on the run's own git-ignored park question file, not on branch code
- **category:** flow-efficiency
- **evidence:** `harness-runs/test_run_logs/fix_task_offer_check_script/task_round_1.log` failed check `6a no machine paths`. The hit was the run copy's absolute path in option (a) of `harness-runs/clarifications/fix_task_offer_check_script/question_2.md`, which the previous session wrote as a park question; the file is git-ignored and ships in no commit. Fixing it took the test-fix plan `harness-runs/test_fix_plans/fix_task_offer_check_script_task_round_1.md`, five dispatches this session (#12 test-fix-plan-writer, #13 architecture-reviewer, #14 committer, #15 layer-implementer, #16 committer) and a second gate round, which printed `pass`.
- **cost this run:** one of five Run gates rounds and five dispatches spent on a machine-local artifact, not on the branch's code.

## The branch-reviewer's Pass 0 grep sweep did not run because its regex table is an empty stub
- **category:** tooling-gap
- **evidence:** The Phase B `branch-reviewer` return (dispatch #5, recorded in the session transcript) reported that the grep half of Pass 0 did not run because its regex table is still the empty stub, which it called a configuration gap; only the caller-check half ran.
- **cost this run:** the end-of-branch review ran without its regex sweep.

## Index-only commit: one unit's commit staged only its readiness index
- **category:** optimization
- **evidence:** `git log --format='%h %s' origin/dev..HEAD` (no local `dev` ref exists in this checkout, so the remote-tracking ref was the base) shows `b9f1d7f8` — `Finding 1`, staged set "readiness index flip only" — for the round-1 test-fix plan `harness-runs/test_fix_plans/fix_task_offer_check_script_task_round_1.md`. The unit's only edit was to the git-ignored `harness-runs/clarifications/fix_task_offer_check_script/question_2.md`.
- **cost this run:** one commit carries no work file.
