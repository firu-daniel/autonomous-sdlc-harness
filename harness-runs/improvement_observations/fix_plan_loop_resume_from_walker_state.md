## The task plan needed 3 review rounds before it converged
- **category:** optimization
- **evidence:** Trip-wire **Convergence churn**. The plan unit's round artifacts, listed per root: `harness-runs/architecture_reviews/fix_plan_loop_resume_from_walker_state/` holds `review_0.md` and `review_1.md` (two FAILs, 1 Must Fix each per the reviewer returns); `harness-runs/task_plan_reviews/fix_plan_loop_resume_from_walker_state/` holds `review_0.md` (one FAIL, 1 Must Fix); `business_parity_reviews/` has none (`phases.parity=false`). Total: 3 rounds. The PASSes that followed (architecture at iterations 2 and 2, task-plan-reviewer at iteration 1) wrote no file. The net-new vs re-raised split cannot be measured: the only headings in these files are the `## Must Fix` / `## Should Fix` / `## Nice to Have` section headings, with no per-finding heading to match across rounds. The writer's own returns describe each round's Must Fix as a different site (round 0: the §1.7 step 4 edit placed in the wrong task; round 1: a test title retitled; task-plan round 0: test-quoted phrases not preserved).
- **cost this run:** 8 planning dispatches beyond the minimum (3 writer revisions plus 5 re-run gates), across 10 planning dispatches in total.

## `bash scripts/test.sh` exited 1 on gates 1a and 6a in every implementer dispatch of this run
- **category:** tooling-gap
- **evidence:** All 14 `layer-implementer` returns this run (Tasks 1–8, code-review Findings 4/2/3/1, skeptic Findings 2/1) report `bash scripts/test.sh` exit 1, with 18 gates passed and 2 failed. The failures: `1a plugin manifest` (`claude plugin validate --strict` reports six "Shell command uses ${CLAUDE_PLUGIN_ROOT} without quotes" warnings in `plugin/hooks/hooks.json`, a file this branch does not touch) and `6a no machine paths` (hits in the worktree's own `.git` pointer file and in existing `harness-runs/` artifacts). The task prompt names both gates as already failing.
- **cost this run:** No unit's configured test command passed as a whole. Each implementer had to establish by hand that its diff caused neither failure, and one (Task 1) recorded the exit-1 as a plan deviation.
- **hypothesis:** 1a looks like a newer validator rule rather than a change to `hooks.json`; one guess.

## An implementer's compound shell command for a scripted walker check was refused
- **category:** tooling-gap
- **evidence:** The Task 1 `layer-implementer` return says the plan's `REPRO` walk "could not be run as typed shell lines because the compound shell command was refused". It ran the walk from a Python script in `harness-runs/scratch/` instead, deleted that script afterwards, and recorded the substitution under `**Deviations from plan:**` in `harness-runs/task_plans/fix_plan_loop_resume_from_walker_state/task_1_plan.md`.
- **cost this run:** One plan-verification step ran by a route other than the one the plan specified.
