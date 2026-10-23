# Clarification digest — fix_run_gates_background_run_handling

## question_1 — The task-plan loop hit its 5-revision cap with one Must Fix still open in review_3.md
- **raised by:** planning phase — the task-plan write loop (`task-plan-writer` ↔ `architecture-reviewer` ↔ `task-plan-reviewer`), at the walker's 5-revision cap (`reason: cap`, node `plan_review`); latest findings `harness-runs/task_plan_reviews/fix_run_gates_background_run_handling/review_3.md` (1 Must Fix).
- **asked:**
  - **Q1 — How should the open plan-review finding be resolved?** Options: (a) rule on the finding — say whether its Must Fix is valid and how the named task should handle it, or tell the writer to apply it as written; (b) reject the finding, recorded under `## Rejected findings` with a reason; (c) simplify the disputed measurement — have Task 1 drop its live in-sandbox `SIGNALS` measurement and record the signal behaviour as not measured, as a Manual setup item; (d) stop and leave the plan for hand revision. The loop as it stood:

    | Revision | Gate that failed | Must Fix | Findings file |
    |---|---|---|---|
    | 0 | task-plan-reviewer | 2 | `task_plan_reviews/…/review_0.md` |
    | 1 | task-plan-reviewer | 2 | `task_plan_reviews/…/review_1.md` |
    | 2 | architecture-reviewer | 1 | `architecture_reviews/…/review_0.md` |
    | 3 | task-plan-reviewer | 1 | `task_plan_reviews/…/review_2.md` |
    | 4 | task-plan-reviewer | 1 | `task_plan_reviews/…/review_3.md` (open) |
  - **Q2 — Should the persistent Should Fix items be applied in the next revision?** Yes, no, or name which (revision mode applies Must Fix items only by default). The items, raised several rounds running and unapplied:
    - Task 2 has no test case for the start-up refusal.
    - Task 1 does not define what happens when a worker claims `.running` after its refusal has been returned.
    - Task 4's appended clause has no separator.
    - "re-launched" means different things in Task 4 and Task 8.
    - Task 2's 3-second start-up window may be too short.
- **answered:** "Q1: (a) — the Must Fix is valid; apply it as written in review_3.md. Q2: yes, apply all five Should Fix items."
- **carries beyond this branch:** nothing beyond this branch

## question_2 — Finding 1's prescribed lead change cannot pass while the subtest pins REMOTE_WAIT_MAX_SECS to 2
- **raised by:** Phase G (Run gates), round 1, fix loop G.4: the `layer-implementer` (layer `cli`) on test-fix Finding 1; latest findings `harness-runs/test_fix_plans/fix_run_gates_background_run_handling_task_round_1.md` with `…_task_round_1/finding_1.md`; gate log `harness-runs/test_run_logs/fix_run_gates_background_run_handling/task_round_1.log`.
- **asked:**
  - **Q1 — How should Finding 1's subtest be fixed?** The subtest `a relaunch held off past the reset -> the in-job wait bound fires, wait-poller` in `cli/test/watcher-remote-job.test.mjs` (untouched by this branch) keeps a 2-second reset lead a loaded suite outruns. The prescribed `REPEAT_RESET_AHEAD_SECS` lead (about 15 s) fails every time, because `job_usage_wait_ok` in `scripts/autonomous-watcher.sh` waits in the job only when `reset - now <= REMOTE_WAIT_MAX_SECS`, and the subtest pins `REMOTE_WAIT_MAX_SECS: '2'` (applied and reverted; it failed 2 of 62 at `watcher-remote-job.test.mjs:895`). Options:
    - **(a) Run the subtest as self-hosted.** Add `RUNNER_ENVIRONMENT: 'self-hosted'` to its env. That skips the lead check, and `REMOTE_WAIT_MAX_SECS: '2'` and every assertion stay. The case then tests the self-hosted path instead of the hosted one, and a self-hosted case already exists near line 781.
    - **(b) Widen the bound.** Set `REMOTE_WAIT_MAX_SECS` to at least `REPEAT_RESET_AHEAD_SECS`, and change the `/the in-job wait passed 2s after the reset without a resume/` match to that value. It still tests the hosted path, but it changes an assertion, and the bound now waits about 15 seconds longer (still inside `WATCHER_RUN_TIMEOUT_MS`, 120 000).
    - **(c) Another fix:** describe it.
    - **(d) Leave it unfixed on this branch.** The test is untouched by this branch and fails under load. The run would close Finding 1 without a fix and carry on to Finding 2. A gate round can only `pass` once every test passes, though, so the next round would likely fail on it again.
- **answered:** "Q1: (a), combined with Finding 1's lead change — add `RUNNER_ENVIRONMENT: 'self-hosted'` to the subtest's env AND use `rateLimitRejected(REPEAT_RESET_AHEAD_SECS)` with `seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}`; keep `REMOTE_WAIT_MAX_SECS: '2'` and every assertion unchanged. Comment that the case asserts the post-reset bound (which applies self-hosted included), so self-hosted is used to bypass the hosted lead admission, which other cases cover."
- **carries beyond this branch:** a standing decision for `cli/test/watcher-remote-job.test.mjs`: a case that asserts the post-reset in-job wait bound runs self-hosted to bypass the hosted lead admission, keeping its tight `REMOTE_WAIT_MAX_SECS` and assertions; hosted lead admission is left to other cases.
