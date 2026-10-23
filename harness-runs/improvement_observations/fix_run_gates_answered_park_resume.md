## A committer's review_plan_file commit was refused at the clone-to-main branch sync, then landed on an identical re-dispatch
- **category:** tooling-gap
- **evidence:** Phase A2.2 committer dispatch #14 (`mode: review_plan_file`, `plan_path: harness-runs/architecture_branch_reviews/fix_run_gates_answered_park_resume_arch_review.md`) returned `error: commit-on-branch.sh exited 1 and refused to commit: "cannot sync branch 'fix_run_gates_answered_park_resume' in from '<run copy root>': the fetch of refs/heads/fix_run_gates_answered_park_resume failed"` with nothing committed. The same dispatch, re-issued unchanged as #15, committed `754228cb`. Five earlier committer dispatches in this session (#2–#12) and the orchestrator's own direct wrapper calls before and after it committed normally. The refusal text is `HR_SYNC_REFUSAL` in `scripts/lib/harness-run-lib.sh` → `hr_copy_sync_in_var` (main checkout).
- **cost this run:** one extra committer dispatch; the review index sat untracked between the two dispatches.
- **hypothesis:** the committer's wrapper call ran sandboxed that time, where the fetch into the main checkout's `.git` is denied — a guess, not established.

## Committer pushes failed twice while the orchestrator's direct pushes from the same run copy succeeded
- **category:** tooling-gap
- **evidence:** committer dispatch #12 (Task 5, commit `88bf8e8f`) returned `pushed: failed` — the sandbox proxy blocked the SSH connection to `github-firu:22` ("host is not on the allow list") on three tries. Committer dispatch #36 (skeptic Finding 1, commit `f5ff1a08`) returned `pushed: failed` — `push-branch.sh` refused because its fetch of `refs/heads/fix_run_gates_answered_park_resume` failed, while still exiting 0. Every orchestrator-issued `bash <main checkout>/scripts/push-branch.sh <run copy>` call this session pushed successfully, including the next ones (`2856ae17`, `4fcab128`), which carried both unpushed commits.
- **cost this run:** two commits sat local-only until the next ledger-flip push; no work lost.

## The plan needed 6 review rounds across two reviewer roots, every round net-new
- **category:** optimization
- **evidence:** convergence churn on the plan unit. `harness-runs/architecture_reviews/fix_run_gates_answered_park_resume/` holds `review_0`–`review_3` (round 0: 2 Must Fix; rounds 1, 2, 3: 1 Must Fix each, every title net-new against its predecessor, 0 re-raised). `harness-runs/task_plan_reviews/fix_run_gates_answered_park_resume/` holds `review_0` (4 Must Fix, 3 Should Fix) and `review_1` (2 Must Fix, 1 Should Fix; 3 net-new, 0 re-raised). Total 6 rounds. The pre-park session hit the walker's 5-revision cap on the architecture gate (park `question_1.md`); this post-resume session converged in 2 revisions (architecture PASS twice, plan review FAIL then PASS). Dispatch count 42 this session (post-resume), cap 800 — the pre-park session's count is not recoverable.
- **cost this run:** one clarification park plus a resume; the answer chose another bounded round with no design change.
- **hypothesis:** each architecture round surfaced a different consequence of introducing one new binding, rather than re-raising an unfixed one.
