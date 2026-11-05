## question_1 — How the planning loop should close when only Should Fix / Nice to Have findings remain at the revision cap
- **raised by:** the planning phase (`/autonomous-sdlc-harness:branch-start-plan-autonomous`, task-plan write loop), at the walker's `<escalate>` binding, `reason: cap`. The plan loop reached its 5-revision cap with the architecture gate still open. Latest findings: `harness-runs/architecture_reviews/feat_gate12_sandbox_round_driver/review_1.md` (`verdict: FAIL`, `must_fix_count: 0`). Walker rounds at the cap: `architecture_review 2`, `plan_review 3`.
- **asked:**
  - **Q1 — How should the planning loop close, given the remaining findings are Should Fix / Nice to Have only?** The architecture reviewer FAILed on Should Fix / Nice to Have findings with `must_fix_count: 0`. The task-plan-writer applies only Must Fix items unless told otherwise, so it made no edits in revision 4. The task-plan-reviewer had not reviewed revision 3. Findings the writer reported as still unapplied:
    - Architecture review_0, **Should Fix 1:** declare `stall_values_unconfirmed` as part of the `runs[]` item shape in the state file (Task 2's key shapes and the story index's **The state file**), and turn Tasks 5 and 7's "Task 2's key shapes do not carry it" into a pointer.
    - Architecture review_0, **Nice to Have 1:** add a `g12_scratch_dir` helper in `state.sh` (Task 2) that `g12_state_path` and the `runs.sh` path helpers (Task 6) build on.
    - Task-plan review_2, **Should Fix:** FR3 currently passes on step results alone (Tasks 8, 14). `run_job` in `cli/templates/scripts/autonomous-watcher.sh` prints `job: $final $decision` and then `exit 0`, so a failed run still shows `Run the harness` as successful. The fix grades FR3 on that `job: <final> <decision>` line.
    - Task-plan review_2, **Should Fix:** a local branch ref can be left behind without being recorded (Task 3). The fix moves `update-ref` out of `g12_branch_build` into `g12_branch_push`, after the branch is recorded, and updates Task 5's restatement.
    - Architecture review_1: content not read by the orchestrator (path-only rule); 0 Must Fix.

    Options:
    - **(a) Apply them.** The writer applies the outstanding Should Fix and Nice to Have items above, plus whatever `review_1.md` raises, and every gate runs again, with a fresh 5-revision budget (recommended).
    - **(b) Apply a subset.** Name which ones, e.g. only the two Should Fix items from task-plan review_2 (FR3, `update-ref`); the rest are recorded as accepted at review.
    - **(c) Accept the plan as it stands.** The remaining findings are deferred to the branch review; say whether the task-plan-reviewer must still pass revision 3 before implementation starts.
    - **(d) Stop the run here.**
- **answered:** `Q1: Option (a) to apply all.`
- **carries beyond this branch:** nothing beyond this branch
