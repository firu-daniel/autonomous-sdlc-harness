## Row A's commit_prefix rule produced a prefix the adopting repository's commit policy does not allow
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table`, row `A`, `commit_prefix rule` cell reads "from the branch name: `feat_` → `feat`, `fix_` → `fix`, `refactor_` → `refactor`, else `chore`". `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for a story task's commit and allows only `chore`. `plugin/agents/committer.md` says the caller chooses `commit_prefix` "from `<commit_conventions>`'s vocabulary". Following row A, the Task 1 dispatch passed `commit_prefix: feat` and commit `d35b3ea4` landed and was pushed as `feat: Task 1 — Move every clone ref clone-first, heal a behind clone`. The committer's return flagged the conflict; every later Phase A dispatch passed `none`.
- **cost this run:** one pushed commit subject outside the repository's commit policy, left as is at the user's instruction
- **hypothesis:** the row-A cell and the committer contract name two different sources for the same argument

## The planning loop hit its 5-revision cap; the walker's restart after the user's ruling printed the initial writer prompt
- **category:** agent-contract
- **evidence:** after `[plan-write · iter 4] → task-plan-reviewer  (#12)` returned FAIL (`harness-runs/task_plan_reviews/feat_clone_per_run_switch/review_1.md`), `bash scripts/flow-walker.sh next …` printed `binding: <escalate>` / `reason: cap`. The user chose one more revision round; `bash scripts/flow-walker.sh start --flow task_plan_writing --branch feat_clone_per_run_switch --entry plan_writer` then printed `prompt: initial`. The orchestrator dispatched the revision block instead and recorded it in `harness-runs/dispatch_additions/feat_clone_per_run_switch.md` (dispatch #13).
- **cost this run:** one escalation round-trip to the user; one dispatch whose prompt departed from the walker's printed variant

## Implementers' `rm -rf` of their own temp fixtures was refused, leaving fixtures on disk
- **category:** tooling-gap
- **evidence:** the Task 5, Task 13 and Task 15 `layer-implementer` returns each report a refused `rm -rf` of a fixture they created under the system temp directory or of `harness-runs/scratch/t15/`; Task 13 names `harness-fixture-TnYLoa` and its `-feat_x` / `-origin.git` siblings under the system temp directory as left behind.
- **cost this run:** temp fixtures and scratch folders left for manual cleanup

## The orchestrator's Bash working directory carried into a dispatched agent's shell
- **category:** shared-state
- **evidence:** an orchestrator Bash call during Phase A ran `cd harness-runs/task_plans/feat_clone_per_run_switch && …`, which moved the session's working directory. The Task 27 `layer-implementer` return (dispatch #26) reports "The shell started in `harness-runs/task_plans/feat_clone_per_run_switch`, where the relative command strings don't resolve", and it prefixed its commands with `cd <repo_root> &&`. The orchestrator restored the working directory to the checkout root after that return.
- **cost this run:** one implementer worked around a wrong starting directory; relative command strings would have failed for agents that did not
- **hypothesis:** dispatched agents inherit the orchestrating session's current directory

## The task plan needed 7 failing review rounds across two plan gates before convergence
- **category:** optimization
- **evidence:** plan unit, rounds counted off the two plan-gate roots (`harness-runs/architecture_reviews/feat_clone_per_run_switch/`, `harness-runs/task_plan_reviews/feat_clone_per_run_switch/`): 7 FAIL artifacts (architecture `review_0`–`review_4`, plan-review `review_0`–`review_1`), plus PASS rounds that wrote no file. Architecture root, each round against its predecessor: `review_1` 2 net-new, 2 re-raised; `review_2` 1 net-new, 3 re-raised; `review_3` 1 net-new, 0 re-raised; `review_4` 2 net-new, 0 re-raised. Plan-review root: `review_1` 6 net-new, 1 re-raised. The re-raised findings were all Should Fix items the writer's revision mode does not apply unasked; the cap escalation came on plan-review `review_1`.
- **cost this run:** 19 planning dispatches, one cap escalation to the user
