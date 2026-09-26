### 2. A failed exit after the hosted budget's PAUSE is auto-resumed with that PAUSE deleted and never re-dropped, so the run is cut off by the step timeout instead of yielding cleanly

> **Self-contained per-finding file** for the `feat_remote_execution_github_actions` skeptic-review index. The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`job_auto_resume`) — "begin_pause_resume "$branch" "$state_abs""

**The problem.** On a GitHub-hosted runner, `job_budget_pass` drops `<state_dir>/PAUSE` once `REMOTE_SELF_PAUSE_AFTER_SECS` has passed. By default that is 240 minutes, inside a 330-minute step timeout. The pass records `pause_reason budget` and sets `JOB_BUDGET_PAUSE_DROPPED=1`. The flag makes the pass one-shot: its first line is `[ "$JOB_BUDGET_PAUSE_DROPPED" = "0" ] || return 0`.

The session can exit non-zero before it reaches a clean checkpoint where it would honour that PAUSE, for example on an API error. The record is then `failed`, and the supervision loop's `failed)` arm calls `job_auto_resume`. That function declines only for `pause_reason user`. Here the reason is `budget`, so it goes ahead:

1. it clears `pause_reason`;
2. it calls `begin_pause_resume`, which runs `rm -f "$state_abs/PAUSE" "$state_abs/RESUME" "$state_abs/PAUSE_ACK"`;
3. it relaunches the session.

`JOB_BUDGET_PAUSE_DROPPED` is still `1`, so `job_budget_pass` never drops PAUSE again. The relaunched session keeps working with no pause pending until the step's `timeout-minutes` kills the whole step, up to 90 minutes later with the default margin.

**Why it matters.** The self-pause exists so a hosted job yields at a dispatch boundary: its work is committed and pushed, and the next job chains from a clean ledger (`harness-run.yml` header, "THE SELF-PAUSE POINT, MEASURED"). After this sequence the job ends by being killed instead:

- the in-flight unit's uncommitted work is lost;
- up to the whole remaining margin of billed minutes is spent on work that is thrown away.

The chain still recovers. The last `job_control_poll` left `status.json` saying `continue`, so the next job resumes from the pushed ledger. The cost is the lost unit and the minutes, not the run. The branch's own tests do not reach this path. `watcher-remote-job.test.mjs` → `'budget: a hosted self-pause continues, silently'` drives a budget pause the session honours. `'auto-resume: bounded, and reset by a user action'` drives an auto-resume with no budget PAUSE pending.

**Fix.** When the budget PAUSE has already been dropped, the auto-resume puts it back after `begin_pause_resume` has cleared the sentinels. The relaunched session then yields at its next clean checkpoint, as the first one would have. The existing `paused` / `budget` arm then chains, with decision `continue`.

- [ ] In `job_auto_resume`, directly after the line `begin_pause_resume "$branch" "$state_abs"`, insert:
  ```bash
  # begin_pause_resume just removed the hosted budget's PAUSE, and job_budget_pass
  # is one-shot: put it back, so the relaunched session still yields at its next
  # clean checkpoint instead of running on until the step timeout kills it.
  if [ "$JOB_BUDGET_PAUSE_DROPPED" = "1" ]; then
    touch "$state_abs/PAUSE"
    registry_set "$branch" pause_reason budget
    log "job: the hosted time budget's PAUSE was pending at the resume of '$branch' after $why — re-dropped it"
  fi
  ```
  The `registry_set "$branch" pause_reason ""` line above it stays as it is. The new block runs after it, so a budget reason is restored only when the budget PAUSE is.
- [ ] In the header's JOB MODE block, where the bounded auto-resume is described, add one sentence: "A resume taken after the hosted budget's PAUSE was dropped re-drops it, so the relaunched session still yields at the budget."
- [ ] In `cli/test/watcher-remote-job.test.mjs`, add a case under `'budget: a hosted self-pause continues, silently'` with `REMOTE_SELF_PAUSE_AFTER_SECS=1` and `REMOTE_AUTO_RESUME_DELAY_SECS=0`:
  - The agent stub's first launch sleeps past the budget and then exits `2`.
  - Its second launch, which is the pause resume, writes `PAUSE_ACK` when `<state_dir>/PAUSE` exists and exits `0`, the way the existing budget case's stub honours a pause.
  - Assert that the job prints `job: paused continue`, and that `remote_status.json` carries `pause_reason` `budget` and `auto_resumes` `"1"`.
