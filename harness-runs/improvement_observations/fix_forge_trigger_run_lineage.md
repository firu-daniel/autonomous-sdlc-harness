## The plan needed 3 review rounds before it converged
- **category:** optimization
- **evidence:** Convergence churn trip-wire (≥3 rounds). The plan's rounds across its three plan-review roots: `harness-runs/architecture_reviews/fix_forge_trigger_run_lineage/review_0.md` (1 Must Fix; the only artifact in that root, so no predecessor to diff), `harness-runs/task_plan_reviews/fix_forge_trigger_run_lineage/review_0.md` (2 Must Fix) and `review_1.md` (1 Must Fix). Diffing `review_1` against `review_0` in the task-plan root by finding title: 1 net-new, 0 re-raised. The business-parity root has no artifacts (`phases.parity` is false).
- **cost this run:** 9 planning dispatches before the plan converged on `task-plan-reviewer` iteration 2.

## Row A's `commit_prefix` rule gave `fix` while the repository's commit policy gives `none` for a story task
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` → `## Substitution table`, row `A`, `commit_prefix rule` derives the prefix from the branch name (`fix_` → `fix`). `.claude/context/conventions.md` → `## Commit-message policy` designates **`none`** for "Adding new work — a story task's commit". The orchestrator followed row A, so all 12 Phase A commits on this branch carry `fix:` (`f0770b3` … `f910814`). The Phase C and C2 review-item commits used `none` per the fix rows' designation rule (`bad0346`, `2a2c4da`, `1951b97`, `79a9969`, `2cf11a6`).
- **cost this run:** 12 commit subjects off the repository's stated commit policy.
- **hypothesis:** the row-A rule and the committer's "two closed sources" sentence (`plugin/agents/committer.md`, `commit_prefix` argument) predate this repository's per-class designation table.

## The plugin manifest check was held for approval in the headless session
- **category:** tooling-gap
- **evidence:** the Task 8 `layer-implementer` (plugin layer) reported that `claude plugin validate --strict plugin` was held for approval by the session, so it did not run, and it recorded this as a deviation in `harness-runs/task_plans/fix_forge_trigger_run_lineage/task_8_plan.md`.
- **cost this run:** the plugin-layer edits in Tasks 8 and 9 shipped without a manifest check at unit level. The Run gates suite passed on round 1.

## The skeptic reviewer could not run its reproduction
- **category:** tooling-gap
- **evidence:** the Phase C2 `skeptic-reviewer` return says its attempt to reproduce the relative `--answers-from` defect "with a throwaway repository and worktree was denied, so it has not been run". The finding (`harness-runs/skeptic_reviews/fix_forge_trigger_run_lineage_skeptic_review/finding_1.md`) was confirmed by reading code only. The fix's new suite case was not run against the unfixed script either (implementer return for that unit).
- **cost this run:** one Must Fix landed without an observed failing reproduction.

## A plan-review Should Fix the writer did not apply came back as a code-review Must Fix
- **category:** flow-efficiency
- **evidence:** `harness-runs/task_plan_reviews/fix_forge_trigger_run_lineage/review_1.md` → `## Should Fix` raised "`task_12_plan.md`, leg (d) step 2: the old `<slug>_2` run must be finished before the explicit `start`". The `task-plan-writer` revision for that round applied Must Fix items only. Phase B raised the same gap as Must Fix `harness-runs/code_reviews/fix_forge_trigger_run_lineage_code_review/finding_1.md`, fixed in `2a2c4da`. The same review's Should Fix on the story index's "Every legitimate own-lineage run is included" claim reappeared as the `branch-reviewer`'s `## Questions` item (merge-commit lineage) and as a call-out in the skeptic index.
- **cost this run:** 2 extra dispatches (implementer + committer) for Finding 1.

## One fix dispatch was redone because the orchestrator passed a wrong detail-file path
- **category:** flow-efficiency
- **evidence:** dispatch #36 (Phase C, Item 3, `general` layer, code-review Finding 2) named `harness-runs/code_reviews/fix_forge_trigger_run_lineage/finding_2.md`. The real path is `harness-runs/code_reviews/fix_forge_trigger_run_lineage_code_review/finding_2.md`. The implementer returned `blocker:` with no change, and dispatch #37 repeated it with the correct path. This was the second layer of a multi-layer (`cli, general`) finding, the only point where the orchestrator re-typed the path.
- **cost this run:** 1 wasted dispatch.
