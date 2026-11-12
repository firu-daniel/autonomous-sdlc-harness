## The unattended profile denies edits under `githooks/`, so a planned respell of `githooks/pre-push` could not land twice
- **category:** tooling-gap
- **evidence:** Task 35 (`harness-runs/task_plans/chore_devscene_adopter_layout/task_35_plan.md`) and code-review Finding 2 (`harness-runs/code_reviews/chore_devscene_adopter_layout_code_review/finding_2.md`) each asked for three comment-line respells in `githooks/pre-push`; every `Edit` was refused with "File is in a directory that is denied by your permission settings." (the run profile carries `Edit(.../githooks/**)` deny entries — "a run copy's pre-push hook runs from it, outside the sandbox"). Finding 2 was closed index-only at commit 1606f2a1; the file is unchanged on the branch.
- **cost this run:** one planned edit and one review fix left for a manual hand edit; two implementer dispatches spent on an edit no unit could make.
- **hypothesis:** (guess) planning has no signal that `githooks/` is write-denied for run agents, so it assigns the edit to a unit.

## `git init` of a scratch repository was refused, so Task 35's fresh-adoption check did not run
- **category:** tooling-gap
- **evidence:** Task 35's implementer reported `git init -q <scratch>` (scratch under `harness-runs/scratch/fresh-init-chore_devscene_adopter_layout`) refused with "Permission to use Bash has been denied because Claude Code is running in don't ask mode."; steps 3–6 (`init`, the old-name grep, the old-name `find`, `doctor`) were recorded as not run.
- **cost this run:** the story's "fresh `init` then `doctor`" Done-when check has no evidence on this branch.

## Per-file `bash -n` named in plan verification bullets was refused across many units
- **category:** tooling-gap
- **evidence:** the implementers of Tasks 5, 6, 7, 8, 10, 16, 17, 18 and 34 each reported their plan's `bash -n <file>` verification step refused by the permission mode, and fell back to `bash scripts/typecheck.sh`'s shell-parse step (124 files, 0 failed). Bulk in-place edits (`sed -i`, `perl -pi`) were also refused in Tasks 4, 7, 14, 27 and 33, and redone with per-file `Edit`.
- **cost this run:** nine evidence downgrades recorded in task files; extra edit dispatch time on the bulk-respell tasks.

## A committer's push timed out silently; the commit landed but was not pushed
- **category:** silent-failure
- **evidence:** the Task 11 committer returned `pushed: failed` for commit aee87e13: `push-branch.sh` ran past the 120 s tool limit with no output. The orchestrator's own single-statement `bash <main checkout>/scripts/push-branch.sh <run copy>` call immediately after pushed `6de7a7fb..aee87e13` successfully.
- **cost this run:** one extra push call; the remote would have lagged one commit had the next commit's push not run.

## A compounded wrapper call failed with a misleading git error rather than a refusal
- **category:** tooling-gap
- **evidence:** the P0 ledger commit issued as `bash <main checkout>/scripts/commit-on-branch.sh … ; echo "exit=$?"` (one Bash call, against the single-statement rule) exited 1 with "refusing to commit: cannot sync branch … the fetch of refs/heads/chore_devscene_adopter_layout failed"; a manual reproduction showed `error: cannot open '.git/FETCH_HEAD': Operation not permitted` (main checkout). The same call issued alone committed 959b45ab.
- **cost this run:** one failed commit attempt and a diagnosis detour.
- **hypothesis:** (guess) the wrapper's refusal text names the failed step, not the sandbox, so the cause is not visible from the message.

## The plan needed 7 review rounds before it converged
- **category:** optimization
- **evidence:** plan-review roots `harness-runs/task_plan_reviews/chore_devscene_adopter_layout/` (review_0, review_1) and `harness-runs/architecture_reviews/chore_devscene_adopter_layout/` (review_0, review_1, review_2) hold 5 FAIL artifacts; this resumed session's architecture and plan-review gates then passed with no file written (2 more rounds), after a cap park (`question_1`). The net-new vs re-raised split is unmeasurable from headings: the files carry only section headings (`## Must Fix` / `## Should Fix` / `## Nice to Have`), no per-finding titles.
- **cost this run:** one park at the 5-revision cap and a resume.

## Index-only commit
- **category:** optimization
- **evidence:** Finding 2 (code review) — 1606f2a1 — "readiness flip only, no work file in the tree".
- **cost this run:** one readiness entry closed with no change applied.
