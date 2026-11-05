## The plan unit needed 7 review rounds, across two sessions and one cap park
- **category:** optimization
- **evidence:** Convergence churn trip-wire. Rounds that wrote a findings file: `harness-runs/task_plan_reviews/fix_runner_seccomp_userns/review_0.md`–`review_4.md` (5) and `harness-runs/architecture_reviews/fix_runner_seccomp_userns/review_0.md`–`review_1.md` (2) = 7; the final plan-review and architecture rounds passed and wrote nothing. Plan-review series, per round (by finding title, against the previous round in the same folder): r0 6 net-new; r1 3 net-new / 2 re-raised; r2 2 net-new / 0 re-raised; r3 3 net-new / 0 re-raised; r4 0 net-new / 2 re-raised. Architecture series: r0 1 net-new; r1 1 net-new / 0 re-raised. The first session hit the walker's 5-revision cap with r2 open and parked (`harness-runs/clarifications/fix_runner_seccomp_userns/question_2.md`); this session resumed with a fresh revision budget and converged after r3 and r4.
- **cost this run:** one park-and-resume cycle, plus 9 planning dispatches in the resumed session before the plan converged.

## The task-plan writer left review Should Fix / Nice to Have items neither applied nor rejected, and the next round re-raised them as Must Fix
- **category:** agent-contract
- **evidence:** `harness-runs/task_plan_reviews/fix_runner_seccomp_userns/review_1.md` Must Fix 1 is titled "The previous round's three Should Fix findings were neither applied nor recorded under `## Rejected findings`", and `review_4.md` Must Fix 1 is titled "`review_3.md` Should Fix 1 was neither applied nor recorded under `## Rejected findings`". In this session the `task-plan-writer` revision dispatch against `review_3.md` returned that it "did not apply the Should Fix or the Nice to Have, because you did not ask for them", and the next round (`review_4.md`) failed on exactly that.
- **cost this run:** two of the plan's seven review rounds (r1 and r4) were spent at least partly on re-raising items the writer had skipped.
- **hypothesis:** the writer's revision contract and the reviewer's "apply or record as rejected" rule disagree about whether a non-Must-Fix item may be silently skipped.

## Routine read-only or copy shell commands were refused at the tool layer for implementers
- **category:** tooling-gap
- **evidence:** reported in `layer-implementer` returns this session: a standalone `bash -n` on an edited shell file was refused (Task 5, Task 6, and code-review Finding 2's `cli` layer), each falling back to the typecheck's shell-parse step; `cp` was refused (Task 9), so two template copies were re-applied hunk by hunk with the file-edit tool and confirmed with `cmp`; a compound `cp && cmp` was refused (code-review Finding 2, `cli` layer); a scripted comparison of `docs/sandbox-verification.md` §9 figures against the task prompt was refused (Task 7), checked by eye instead; `rm` of a scratch probe was refused (architecture Finding 2, `cli` layer), leaving `harness-runs/scratch/j2_mutation.mjs` behind untracked; `printenv HOME` was denied to `test-fix-plan-writer`, which assumed the home directory instead.
- **cost this run:** the `bash -n` parse claim and the Task 7 figure check rest on substitutes rather than the planned commands; one template copy was done by hand-editing.

## The run copy has no local default-branch ref, so the branch reviewer fell back to the remote-tracking ref
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return: "This run copy has no local `dev` branch, so I compared against `origin/dev...HEAD`. 24 run-artifact files were left out of the reviewed diff." The Phase A2 dispatch passed `diff_base: dev` as the core's dispatch block spells it.
- **cost this run:** none observed; the reviewer recovered on its own, but the dispatched `diff_base` named a ref that does not exist in the run copy.
