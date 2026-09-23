## The plan needed six review rounds across two gates before it converged
- **category:** optimization
- **evidence:** convergence churn on the plan unit. `harness-runs/task_plan_reviews/feat_arm_a_real_catalog_measurement/` holds `review_0.md`–`review_3.md` (4 rounds) and `harness-runs/architecture_reviews/feat_arm_a_real_catalog_measurement/` holds `review_0.md`–`review_1.md` (2 rounds): 6 round artifacts, plus two PASS rounds in the park-3 resume session that wrote no file. Per round, with a finding counted as re-raised when its title matches the previous round's or the reviewer labelled it "Carried". task-plan-reviewer: round 0 had 6 findings; round 1 had 5 (2 net-new, 3 re-raised); round 2 had 9 (5 net-new, 4 re-raised); round 3 had 6 (2 net-new, 4 re-raised). architecture-reviewer: round 0 had 3; round 1 had 2 (1 net-new, 1 re-raised). Three findings were re-raised in every task-plan round from 1 to 3: `task_10_plan.md` `### The tool set, and the network`, register row 11, and `task_21_plan.md`.
- **cost this run:** 6 plan-review rounds and the writer revisions between them, spread across the earlier planning sessions
- **hypothesis:** (guess) the rounds were a mix of both causes: fixes that did not land (the three findings carried through rounds 1–3) and findings a partial pass missed earlier (the net-new ones in every round)

## Gate 6a fails on every implementer run in a per-branch worktree
- **category:** tooling-gap
- **evidence:** all 20 `layer-implementer` dispatches this session (Tasks 16–25, arch Finding 1, code-review Findings 1–6 with Finding 3 dispatched once per layer, skeptic Findings 1–2) reported `bash scripts/test.sh` exit 1 with `6a no machine paths` failing. The hits they named were the worktree's own `.git` pointer file and existing `harness-runs/` artifacts, never a file in the unit's diff. Plan review round 2 (`harness-runs/task_plan_reviews/feat_arm_a_real_catalog_measurement/review_2.md`, finding 1) had already raised that `bash scripts/test.sh` cannot exit 0 in this checkout.
- **cost this run:** no unit could show a green configured test gate; each implementer judged the red gate by reading its hit list
- **hypothesis:** (guess) gate 6a scans untracked files in the checkout, including the worktree's `.git` pointer file

## Gate 1a started failing partway through the run, on a file the branch does not touch
- **category:** tooling-gap
- **evidence:** the Task 24 implementer was the first to report `1a plugin manifest` failing: `claude plugin validate --strict` treats six warnings about unquoted `${CLAUDE_PLUGIN_ROOT}` in the `plugin/hooks/hooks.json` hook commands as errors. It said the Task 20 and Task 22 gate logs show 1a passing. `plugin/` has no diff on this branch. Every later implementer dispatch (Task 25, arch Finding 1, code-review Findings 1–6, skeptic Findings 1–2) reported the same failure.
- **cost this run:** from Task 24 on, two configured gates were red on every dispatch instead of one
- **hypothesis:** (guess) the installed validator started enforcing a stricter rule while the run was in progress

## Gate 4 failed once and passed on both reruns
- **category:** silent-failure
- **evidence:** the Task 17 implementer's first `bash scripts/test.sh` run had gate 4 (`npm test`) fail 1 of 738 tests. The test's name was cut off in the output. A direct `node --test` run in `cli/` and a second `bash scripts/test.sh` both passed gate 4. Task 17 touched no `cli/` file.
- **cost this run:** one unidentified flaky test; it was not reproduced and not named
- **hypothesis:** (guess) a timing-dependent CLI test

## An implementation-phase park was resumed through the planning writer loop
- **category:** flow-efficiency
- **evidence:** park 3 was raised by `layer-implementer` on Task 16 in Phase A (`harness-runs/clarifications/feat_arm_a_real_catalog_measurement/question_3.md`). On resume, the planning fork's Override 2(a) fed the answer to `task-plan-writer`, so 3 dispatches (writer, architecture-reviewer, task-plan-reviewer) and plan commit `f837ac6` ran before Task 16's implementer was dispatched. The writer changed `task_16_plan.md`, `task_17_plan.md` and `task_19_plan.md`.
- **cost this run:** 3 dispatches and one plan commit ahead of the resumed Phase A unit
