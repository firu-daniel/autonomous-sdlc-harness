## The plan needed 4 recorded review rounds before converging
- **category:** optimization
- **evidence:** plan-convergence roots: `harness-runs/task_plan_reviews/fix_watcher_multi_question_resume_loop/` holds `review_0.md`–`review_2.md` (3 FAIL rounds), `harness-runs/architecture_reviews/fix_watcher_multi_question_resume_loop/` holds `review_0.md` (1 FAIL round); PASS rounds write no file. Must Fix titles per task-plan-review round: round 0 → 2 net-new; round 1 → 1 net-new, 0 re-raised; round 2 → 1 net-new, 0 re-raised. The writer's revision-4 return reports one Should Fix (Task 2 watchdog-restart `resume_kind`) re-raised in rounds 0, 1 and 2 and never applied, because revisions apply Must Fix only.
- **cost this run:** 4 writer revisions, 14 planning dispatches (cap 40) before convergence
- **hypothesis:** each structural round surfaced a different consumer site the scope register missed, rather than a fix failing to land.

## Gate `6a no machine paths` fails on every `bash scripts/test.sh` run inside a worktree
- **category:** tooling-gap
- **evidence:** all 13 Phase-A and 5 Phase-C `layer-implementer` returns report `bash scripts/test.sh` exit 1 with 13 gates passed and only `6a` failing; the hits are the worktree's untracked `.git` pointer file (`gitdir: <main checkout>/.git/worktrees/…`), `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md` quoting it, and (later) `harness-runs/scratch/t13_test.log`.
- **cost this run:** the configured test gate could not pass on any unit; every implementer had to argue the failure was pre-existing instead of reporting a clean gate
- **hypothesis:** the gate's file walk does not exclude a `.git` that is a file rather than a directory.

## Direct syntax-check and validate commands were refused in the headless profile
- **category:** tooling-gap
- **evidence:** Task 1 and Task 2 implementers: running `bash -n` on the watcher template directly "needed approval" / "was refused", so it was run inside a scratch script; Task 10 implementer: `claude plugin validate --strict plugin` "was refused (it needs approval)", covered only via gate `1a`; Task 13 implementer: `chmod` on the mirrored scripts refused.
- **cost this run:** extra scratch-probe indirection on Tasks 1–2; manifest validation verified only transitively on Task 10

## Story-task commit prefix follows the branch name, but the commit policy designates none
- **category:** agent-contract
- **evidence:** commits `2151e9c` … `3315cce` carry `fix: Task N — …` subjects, from `plugin/instructions/unit_loop_core.md` row `A`'s `commit_prefix rule` ("from the branch name: … `fix_` → `fix`"); `.claude/context/conventions.md` → `## Commit-message policy` designates `none` for "Adding new work — a story task's commit". The Phase B `branch-reviewer` raised it as a `## Questions` item. The Phase C fix commits (`2d8c01e` … `c86ae15`) used the designated `none`.
- **cost this run:** 13 task commits whose subjects contradict the repository's commit policy; left to the maintainer at merge time
- **hypothesis:** row `A` predates the per-class designation table and was not moved onto it with the five fix rows.

## `npm test` gate failed once and passed on the immediate re-run
- **category:** tooling-gap
- **evidence:** Task 9 `layer-implementer` return: first `bash scripts/test.sh` run had gates `4 npm test` and `6a` failing; the second run passed gate 4. The branch had added `cli/test/watcher-park-resume.test.mjs` and `cli/test/watcher-park-loop.test.mjs` in Tasks 4–5; the Task 4 implementer separately reported a registry write race between the `pid` write and the exit classification, masked in the tests by a 0.3 s stub delay.
- **cost this run:** one gate result not reproducible on the same tree
- **hypothesis:** the new watcher suites are timing-sensitive under parallel `node --test` load.
