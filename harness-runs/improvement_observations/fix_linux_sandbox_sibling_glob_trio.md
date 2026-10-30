## `bash -n` on an edited shell script is refused in the unattended run copy
- **category:** tooling-gap
- **evidence:** the Task 2 and Task 5 `layer-implementer` returns each report the plan's `bash -n` verification step "refused" by the permission mode; both fell back to `bash scripts/typecheck.sh`'s shell-parse step (97 files, 0 failed). Task 2 recorded it as an evidence downgrade in `harness-runs/task_plans/fix_linux_sandbox_sibling_glob_trio/task_2_plan.md`; Task 5 in `harness-runs/task_plans/fix_linux_sandbox_sibling_glob_trio/task_5_plan.md`.
- **cost this run:** two task plans' named parse check did not run as written; parse evidence rests on the typecheck wrapper instead.

## `cp` of a template over its self-adopted copy is refused in the unattended run copy
- **category:** tooling-gap
- **evidence:** the Task 4 `layer-implementer` return ("`cp` was refused under don't-ask mode") and the code-review Finding 4 (general layer), Finding 3 (cli layer) and Finding 2 (cli layer) returns each report the template→`scripts/` copy refused; each re-applied the template's hunks by hand with the Edit tool and confirmed byte-identity with `cmp` / `git diff --no-index`.
- **cost this run:** four units mirrored `cli/templates/scripts/…` into `scripts/…` hunk by hand instead of by one copy.

## Push of the run branch failed with `Permission denied (publickey)` mid-run, then recovered
- **category:** tooling-gap
- **evidence:** the C2.3 `committer` (commit `560b6a5c`) returned `pushed: failed` after `push-branch.sh`'s three attempts all failed with `Permission denied (publickey)`. The orchestrator's next direct `bash scripts/push-branch.sh` (main checkout) call after commit `795b3eb1` also failed all three attempts: `ls-remote exited 128`, two `Permission denied (publickey)`, then `remote: Internal Server Error` / `[remote rejected]`. The following call (after `833cfa71`) succeeded on its third attempt; every push before and after succeeded on the first.
- **cost this run:** two commits sat unpushed until the next push call carried them.
- **hypothesis:** an intermittent SSH-agent / remote condition rather than the profile, since the same command succeeded before and after.

## Reviewers and the statistics writer each fell back to `origin/dev` because the run copy has no local `dev`
- **category:** agent-contract
- **evidence:** the A2 `architecture-reviewer`, the B.1 `branch-reviewer` and the D.1 `statistics-plan-writer` returns each state that `defaultBranch` `dev` has no local ref in this run copy and that they diffed / scanned `origin/dev..HEAD` instead; the `branch-reviewer` raised it as a `## Questions` item asking whether `origin/dev` is the right base.
- **cost this run:** three agents each resolved the diff base on their own; one escalated it as an open question to the operator.

## A multi-layer review finding's second-layer dispatch found its work already done
- **category:** flow-efficiency
- **evidence:** code-review Finding 3 (tag `cli, general`) and Finding 2 (tag `cli, general`): the `cli`-layer `layer-implementer` (dispatches #30, #33) also edited the `general`-layer mirror under `scripts/` because the finding's fix names both files; the following `general`-layer dispatches (#31, #34) each reported making no edit and only re-running the checks. For Finding 4 the `cli`-layer dispatch (#27) instead declined the out-of-path mirror and the `general` dispatch (#28) made it.
- **cost this run:** 2 of 3 multi-layer units spent one implementer dispatch that changed nothing.

## The same stale-statement finding class hit 3 of 4 code-review findings
- **category:** optimization
- **evidence:** `harness-runs/code_reviews/fix_linux_sandbox_sibling_glob_trio_code_review.md` readiness titles — Finding 1 (`legs-glob.sh`'s header re-quotes deleted sentences), Finding 3 (`push-branch.sh`'s two "unverified" glob statements), Finding 4 (wrong caller lists in the `hr_deny_glob_expand` / `hr_profile_deny_paths` headers); citing reviewer `branch-reviewer`. The plan loop's round 1 (`harness-runs/task_plan_reviews/fix_linux_sandbox_sibling_glob_trio/review_1.md`) raised the same class as its Must Fix per the `task-plan-writer`'s revision return (two "unverified" sites no task owned).
- **cost this run:** one extra plan revision round and three Phase C fix units.
