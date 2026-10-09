## Row A's branch-derived commit_prefix contradicts the repository's commit-message policy
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` row `A` derives `commit_prefix` from the branch name (`fix_` → `fix`), and `plugin/agents/committer.md` → `## Invocation contract` names the branch name as the source for a story task. `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "Adding new work — a story task's commit" and lists `chore` as the only prefix token in use. The committer flagged the mismatch in its own return on six of the eighteen task commits (dd1579e, be96fa9, 2679bac, 45a080d, 3128d35, 4c1e6bf) and used the `fix` it was given each time. The Phase C fix row, which reads the policy's designation instead, committed b253d899 with no prefix, so this branch now carries both shapes.
- **cost this run:** eighteen task commits whose subjects break the repository's stated commit policy; six committer returns spent words on the same note.
- **hypothesis:** (guess) the two sources were written for adopters whose policy uses Conventional-Commit prefixes, and no reader reconciles them when the policy says `none`.

## The branch reviewer could not reproduce its Must Fix in a scratch repository
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return states that its scratch-repo run of the `init --reset-config` failure "was refused by the permission system", so Finding 1 in `harness-runs/code_reviews/fix_adopter_scripts_dir_and_workflow_hardening_code_review.md` rests on reading `loadConfig`, `checkString` and `writeHarnessConfig` only.
- **cost this run:** the one Must Fix of the end-of-branch review went to the fix loop unreproduced; the Phase C implementer added the tests that would have shown it.

## The plan needed 3 review rounds before converging
- **category:** optimization
- **evidence:** plan-convergence rounds across the three plan-gate roots: `harness-runs/task_plan_reviews/fix_adopter_scripts_dir_and_workflow_hardening/` holds `review_0.md`, `review_1.md`; `harness-runs/architecture_reviews/fix_adopter_scripts_dir_and_workflow_hardening/` holds `review_0.md`; no business-parity root (`phases.parity` is `false`). Total 3 rounds. Per root, by finding title: task-plan `review_0` → 8 findings (first round); `review_1` vs `review_0` → 4 re-raised (gate 6f deliberate set, `uvx` fallback, scope register row 2 heading, orphaned Task 15 hand-off) and 4 net-new (Task 8 poller credential, Task 7 header evidence, script REPRO blocks, Task 1 test coverage). Architecture `review_0` has no predecessor in its root.
- **cost this run:** 11 planning dispatches (4 writer, 4 architecture, 3 task-plan reviewer) before convergence.
