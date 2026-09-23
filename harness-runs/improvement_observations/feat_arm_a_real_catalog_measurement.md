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

# User-review fix round 1 — maintainer keeps retrieval opt-in; withdrawal wording swept

## The fix-plan writer's lessons-ledger append is in no commit's path list
- **category:** silent-failure
- **evidence:** after the `user-review-fix-plan-writer` returned, `git status --short` showed ` M harness-runs/lessons.md` (one appended rule, per `user-review-fix-plan-writer.md` step 6). The fix-plan fork's Override 3 path list names the fix-plan index, the review, the per-finding folder and the two gate folders, and not `lessons.md`. No later step in the fixes fork names it either. The orchestrator added it to the Override 3 commit (`72a750a`) by hand so the tree would be clean.
- **cost this run:** one path added to a fixed commit list by the orchestrator's own judgment; without it the lesson would have stayed uncommitted in the worktree

## The UR-A `fix` prefix was overridden by the committer on all five fix commits
- **category:** agent-contract
- **evidence:** `unit_loop_core.md` → Row UR-A says `## Must Fix` → `fix`, so all five `committer` dispatches passed `commit_prefix: fix`. All five returns said they dropped it because `.claude/context/conventions.md` → `## Commit-message policy` gives fix commits no prefix. The commits are `22d832b`, `acc05ac`, `84e5918`, `7311152` and `797d375`, and none of them has a prefix.
- **cost this run:** five dispatches carried a prefix the committer had to reject and explain

## The user-review engine found a task-engine ledger with no round to compare
- **category:** agent-contract
- **evidence:** at fix-plan Setup, `harness-runs/flow_progress/feat_arm_a_real_catalog_measurement_progress.md` had the header `(engine: task)` and no round number. `autonomous_pause_and_ledger.md` §1.4 decides between resume and re-seed only by comparing header round numbers. The orchestrator treated the file as older and re-seeded it (`5143973`), following the earlier user-review ledgers `feat_docs_catalog_retrieval_progress.md` and `feat_readme_summary_compact_llms_txt_progress.md`, which also replaced task ledgers.
- **cost this run:** one resume-or-re-seed decision the contract does not state

## Gates 1a and 6a stayed red on every implementer dispatch this round
- **category:** tooling-gap
- **evidence:** all 6 `layer-implementer` dispatches (Findings 1–4, and Finding 5 once per layer, `cli` and `general`) reported that `bash scripts/test.sh` exited 1 with 14 gates passed and 2 failed. The failures were `1a plugin manifest` (unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/hooks/hooks.json` under `--strict`) and `6a no machine paths` (the worktree `.git` pointer and `harness-runs/` artifacts). None of the hits was in a unit's diff.
- **cost this run:** no fix unit could show a green configured test gate

## The per-unit layer reviewer passed every unit on its first round
- **category:** optimization
- **evidence:** zero-yield trip-wire. `layer-reviewer` ran 6 times across 5 findings (Finding 5 once per layer) and returned `verdict: PASS` at iteration 0 each time, so no fix iteration was dispatched. Its root `harness-runs/user_review_fix_plan_point_reviews/feat_arm_a_real_catalog_measurement_fix_plan/` holds only `item_3/review_0.md` and `item_5/review_0.md`, both written on a PASS. All five findings were prose-only edits.
- **cost this run:** 6 reviewer dispatches that changed nothing
