## The plan needed 4 review rounds before it converged
- **category:** optimization
- **evidence:** plan-convergence round artifacts total 4: `harness-runs/architecture_reviews/fix_forge_run_control_gate12_findings/review_0.md` (1 Must Fix) and `harness-runs/task_plan_reviews/fix_forge_run_control_gate12_findings/review_0.md`, `review_1.md`, `review_2.md`; no business-parity folder (`phases.parity` false). Within the task-plan-review root, by Must Fix heading: round 0 — 4 findings; round 1 vs round 0 — 2 net-new, 0 re-raised; round 2 vs round 1 — 1 net-new, 0 re-raised. Should Fix headings marked "(carried over)" by the reviewer itself: 3 in round 1, 6 in round 2 (the writer's revision mode applies Must Fix only).
- **cost this run:** 14 planning dispatches (5 writer, 5 architecture, 4 task-plan-reviewer) before Phase A, per the `[plan-write · …] (#1)`–`(#14)` heartbeats
- **hypothesis:** each round surfaced new Must Fix items rather than re-raising unfixed ones, which points at partial review passes rather than fixes that did not land.

## Row A's branch-derived commit prefix contradicts this repository's commit policy for story-task commits
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` derives the prefix from the branch name (`fix_` → `fix`), while `.claude/context/conventions.md` → `## Commit-message policy` says a story task's commit takes prefix `none`. The committer flagged the conflict on its own return for Task 1 (commit 7ae6576) and again for Task 9 (commit fe124f7); all 20 Phase-A commits on this branch carry `fix:`. The fix rows (`C`, `C2.4`) resolve the prefix from the committer's policy instead and committed with `none` (e.g. 4ddb54f).
- **cost this run:** 20 task commits carry a prefix the repository's policy forbids for that class

## Verification commands an implementer planned were refused by the permission profile
- **category:** tooling-gap
- **evidence:** from implementer returns this run: `bash -n` on `cli/templates/scripts/autonomous-watcher.sh` refused (Task 1); `bash -n` on `cli/templates/scripts/remote-run.sh` refused (Task 11, which wrote no tests of its own); `claude plugin validate --strict plugin` refused (Task 14); the mutation check `git show 7002111:cli/templates/scripts/autonomous-watcher.sh` refused (Task 3). Each implementer recorded the claim as resting on reading the edit.
- **cost this run:** shell syntax and plugin-manifest validity went unchecked at unit level for four units; the Phase G gate run (`task_round_1`) passed afterwards
