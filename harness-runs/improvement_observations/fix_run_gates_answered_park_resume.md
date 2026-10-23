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

# User-review fix round 1 — trim the branch's Phase G prose and restore two test-fix-plan-writer definitions

## The disposition scan's `<default_branch>..HEAD` range fails in a run copy that has no local default-branch ref
- **category:** agent-contract
- **evidence:** at Phase D, the command `improvement_observations_instructions.md` → `## Dispositioned units` (b) prescribes, `git log --format='%h %s%n%b' --name-only dev..HEAD`, exited 128 with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.` The same command over `origin/dev..HEAD` succeeded. The core's own D.2 delivery bullet already bases its count on `origin/<default_branch>`.
- **cost this run:** one failed command; the scan was re-run against `origin/dev`.

## A committer push failed while the orchestrator's next direct push from the same run copy succeeded
- **category:** tooling-gap
- **evidence:** Phase A committer dispatch #15 (Finding 5, commit `15f7dcc4`) returned `pushed: failed`. The committer dispatches #3, #6, #9 and #12 before it returned `pushed: yes`. The orchestrator's next `bash scripts/push-branch.sh <run copy>` (main checkout) after the R3 ledger flip pushed `4e383e63..f26888d2`, which carried `15f7dcc4`.
- **cost this run:** one commit sat local-only until the next ledger-flip push; no work lost.

## Per-unit layer reviewers ran a test file the unit did not create or edit
- **category:** agent-contract
- **evidence:** the `layer-reviewer` returns for Phase A items 3, 4 and 5 (dispatches #8, #11, #14) each report running `node --test cli/test/run-gates-park-answer.test.mjs` (all 5 cases passed). None of the three units created or edited that file. `unit_loop_core.md` → `## The test-run rule` point 1 reserves the suite for the Run gates phase, and its roster lists `layer-reviewer.md` as a citer. The item 1 and item 2 reviewers ran no test.
- **cost this run:** three test runs outside the Run gates phase.
- **hypothesis:** the reviewer reads point 1 as binding only the implementer's unit — a guess, not established.

## An implementer's scratch script could not be removed
- **category:** tooling-gap
- **evidence:** the Phase A item 5 `layer-implementer` return (dispatch #13) reports writing `harness-runs/scratch/f5.py` to make its edits, and that both of its `rm` attempts on it were denied by the permission system. `git check-ignore` matches it to `.gitignore:77` (`harness-runs/scratch/*`), so it is untracked and not committed.
- **cost this run:** one leftover untracked file in the run copy.

## The first user-review round met a task-engine ledger that none of §1.4's three round cases names
- **category:** agent-contract
- **evidence:** on entry, `harness-runs/flow_progress/fix_run_gates_answered_park_resume_progress.md` carried the header `# Flow progress — fix_run_gates_answered_park_resume   (engine: task)`, which has no round number. `autonomous_pause_and_ledger.md` §1.4 decides the user-review engine's create / re-seed / resume by comparing the header round to the active round. The orchestrator re-seeded from the user-review template at round 1, treating the missing round as older (commit `391e429a`).
- **cost this run:** none measured; the decision rested on an interpretation rather than a stated case.

## Per-unit layer reviewers and the fix-plan architecture gate produced no change all round
- **category:** optimization
- **evidence:** zero-yield phase. `layer-reviewer` ran once on each of the 5 Phase A units (dispatches #2, #5, #8, #11, #14) and returned `verdict: PASS` every time, with no findings file. `harness-runs/user_review_fix_plan_point_reviews/fix_run_gates_answered_park_resume_fix_plan/` does not exist. The fix-plan `architecture-reviewer` gate ran once on its one unit and returned PASS, so `harness-runs/architecture_user_review_reviews/fix_run_gates_answered_park_resume/` does not exist either. Dispatch count: 16 this session, cap 450.
- **cost this run:** 6 dispatches that changed nothing.
