## The plan unit needed 10 plan-review rounds across two sessions, every round's findings net-new by title
- **category:** optimization
- **evidence:** `harness-runs/architecture_reviews/fix_run_job_credential_exposure/` holds `review_0.md`–`review_5.md` (6 rounds) and `harness-runs/task_plan_reviews/fix_run_job_credential_exposure/` holds `review_0.md`–`review_3.md` (4 rounds). Numbered finding titles per round, diffed against the predecessor in the same root: architecture 3 → 2 → 3 → 1 → 1 → 0, all net-new, none re-raised; task-plan 2 → 3 → 1 → 1, all net-new by title. Two of the task-plan titles (`review_1.md` #3, `review_3.md` #1) both report the previous round's Should Fixes as neither applied nor recorded under `## Rejected findings`. The walker reached its 5-revision cap twice: once in the session before the park (`question_1.md`, park 1), and once in this resumed session at `review_5.md`.
- **cost this run:** 24 planning dispatches across both sessions before implementation started (the dispatch counter read 12 at this session's entry, before its reset, and 12 more were counted this session); a clarification park and its resume; the plan entered implementation with the architecture gate still FAIL, accepted under the park answer.
- **hypothesis:** guess only: each architecture round reads a wider slice of the shipped scripts' header contracts than the round before.

## The architecture reviewer returned `verdict: FAIL` with `must_fix_count: 0`, and the walker counted it as a failed round toward the cap
- **category:** agent-contract
- **evidence:** this session's dispatch #12 (`[plan-write · arch · iter 4] → architecture-reviewer`) returned `verdict: FAIL`, `findings_file: harness-runs/architecture_reviews/fix_run_job_credential_exposure/review_5.md`, `must_fix_count: 0`. Passing that as `--outcome FAIL` produced `binding: <escalate>`, `reason: cap`. The implemented-branch architecture review (Phase A2, dispatch #27) did the same: `verdict: FAIL`, `must_fix_count: 0`, with one Should-level finding that the fix loop then applied.
- **cost this run:** the plan loop's second cap escalation fired on a round that had no Must Fix. The run went on only because the earlier park answer had already accepted a non-converged plan.

## Read-only and file-rewrite commands sub-agents issued were refused by the unattended permission mode
- **category:** tooling-gap
- **evidence:** sub-agent returns this session: `test-fix-plan-writer` (dispatch #54) reported `printenv HOME` refused by the permission mode; the Task 2 `layer-implementer` (dispatch #3) reported `bash --version` refused; the `skeptic-reviewer` (dispatch #44) reported a Bash rewrite of `harness-runs/skeptic_reviews/fix_run_job_credential_exposure_skeptic_review/finding_2.md` blocked and redid it with Write. The orchestrator's own Phase-D `for f in …; do …; done` heading listing was refused in "don't ask" mode and was redone as a single multi-file `grep`.
- **cost this run:** the Task 2 implementer could not confirm which `bash` ran its behavioural cases (bash 3.2 compatibility checked by parse only); the test-fix-plan writer guessed the home directory from sandbox paths for its machine-path check.

## The run copy has no local `dev` ref, so `git log dev..HEAD` failed and agents fell back to `origin/dev`
- **category:** tooling-gap
- **evidence:** `branch-reviewer` (dispatch #31) reported "this checkout has no local `dev` ref, so I diffed against `origin/dev`"; `statistics-plan-writer` (dispatch #59) reported `git log dev..HEAD` failed and it used `origin/dev..HEAD` instead. Both dispatch blocks pass `diff_base: dev` / the configured `defaultBranch` as the base.
- **cost this run:** none measured. The fallback gave a merge base (`77f386db`) that matches the branch's own cut, but only because each agent improvised it.
