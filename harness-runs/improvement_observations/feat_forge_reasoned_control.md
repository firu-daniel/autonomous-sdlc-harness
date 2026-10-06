## The plan loop needed 5 review rounds before it converged, and every Should Fix finding was re-raised unapplied
- **category:** optimization
- **evidence:** plan-convergence round artifacts: `harness-runs/task_plan_reviews/feat_forge_reasoned_control/review_0.md`–`review_2.md` (3) and `harness-runs/architecture_reviews/feat_forge_reasoned_control/review_0.md`–`review_1.md` (2), so 5 FAIL rounds before the cap park (`question_1.md`, answered "(a) Give it 3 more rounds"). The resumed loop then passed both gates on its first extra round and wrote no artifact. Split per root, matching finding titles by subject (wording differs between rounds, so no title is byte-identical): task-plan `review_1` vs `review_0`: 6 net-new, 3 re-raised; `review_2` vs `review_1`: 1 net-new (the only Must Fix), 8 re-raised (all 6 Should Fix and both Nice to Have). Architecture `review_1` vs `review_0`: 2 net-new, 0 re-raised. The Should Fix "`task_5_plan.md`: every admitted comment pays for the agent's setup" appears in all three task-plan rounds and returned as the Phase C2 `skeptic-reviewer`'s `## Questions` entry.
- **cost this run:** one clarification park and a resume session; 12 planning dispatches before the park plus 3 after it
- **hypothesis:** guess — the writer applied only Must Fix items each round, so the Should Fix items never left the review

## `bash -n` on the shipped run script was refused by the permission layer in four units
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 1, 2, 3 and 4 each report that `bash -n cli/templates/scripts/remote-run.sh` needed an approval the unattended session could not give, with both an absolute and a repo-relative path; each recorded it under **Deviations from plan:** in `harness-runs/task_plans/feat_forge_reasoned_control/task_<K>_plan.md` (K = 1–4)
- **cost this run:** the script's standalone syntax check never ran; four tasks rested their syntax claim on the test suites that execute the script

## The story-task commit prefix the unit loop passes disagrees with the commit class designation
- **category:** agent-contract
- **evidence:** `.claude/context/conventions.md` → the per-commit-class table designates **`none`** for "Adding new work — a story task's commit", while `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` derives the prefix from the branch name (`feat_` → `feat`), and `plugin/agents/committer.md` → `## Invocation contract` names the branch name as the story-task source. This run's 11 task commits (`0285ffa`…`a612ade`) carry `feat:`; its 7 review-fix commits, passed `none` per that same table, carry no prefix.
- **cost this run:** one branch with two prefix shapes for the same project policy
