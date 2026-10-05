## `bash -n` on an edited shell template is refused in the unattended profile
- **category:** tooling-gap
- **evidence:** three `layer-implementer` returns this run report `bash -n cli/templates/scripts/remote-run.sh` refused by the permission layer: Task 2 (twice, recorded in `harness-runs/task_plans/feat_remote_run_actor_allow_list/task_2_plan.md`'s deviation note), Task 3 (recorded in `task_3_plan.md`'s deviation note), and code-review Finding 1's fix (commit 7c198fa).
- **cost this run:** every edit to `remote-run.sh` shipped without a syntax check; each implementer relied on the test suites that execute the script instead.

## `printenv HOME` needs approval in the test-fix-plan writer's dispatch
- **category:** tooling-gap
- **evidence:** the Phase G round-1 `test-fix-plan-writer` return states "The `printenv HOME` call needed approval", so it inferred the home directory from the checkout path to run its machine-path scrub over `harness-runs/test_fix_plans/feat_remote_run_actor_allow_list_task_round_1.md`.
- **cost this run:** the machine-path check rested on an inferred needle rather than a read one.

## Story-task commits carry `feat:`, while the commit policy designates no prefix for that class
- **category:** agent-contract
- **evidence:** row `A` of `plugin/instructions/unit_loop_core.md` derives `commit_prefix` from the branch name (`feat_` → `feat`), so the 13 task commits d25c660 … 0bcfcf4 carry `feat:`. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "Adding new work — a story task's commit" and names `chore` as the only prefix token in use. The review-fix commits (7c198fa … e57beab) took `none` as that policy designates.
- **cost this run:** one branch carries two prefix conventions for its own work commits.
- **hypothesis:** the row-`A` branch-name rule predates the per-class designation in the commit policy.

## A committer subject exceeds the 72-character cap
- **category:** agent-contract
- **evidence:** commit 058fca3's subject `Add a doctor case for the full-page collaborators cannot tell warning (Finding 5)` is 81 characters; `.claude/context/conventions.md` → `## Commit-message policy` sets "Subject-length cap: 72 characters" for free-form subjects.
- **cost this run:** one commit on the branch breaks the stated subject-length cap.

## architecture-reviewer produced no finding across all of its dispatches
- **category:** optimization
- **evidence:** 5 `architecture-reviewer` dispatches this session — 3 plan-mode rounds (planning iterations 0–2), the Phase A2 implemented-branch review, and the Phase G round-1 test-fix-plan gate — each returned `verdict: PASS`; none of `harness-runs/architecture_reviews/feat_remote_run_actor_allow_list/`, `harness-runs/architecture_branch_reviews/feat_remote_run_actor_allow_list_arch_review.md` or `harness-runs/test_fix_plan_reviews/feat_remote_run_actor_allow_list_task_round_1/` exists.
- **cost this run:** 5 dispatches with no change resulting.
