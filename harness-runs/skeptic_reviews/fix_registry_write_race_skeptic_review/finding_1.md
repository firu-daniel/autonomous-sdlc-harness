### 1. The in-job usage wait's bound ignores the gate's throttle, so any `REMOTE_WAIT_MAX_SECS` under about 75 s ends a wait that was about to resume

> **Self-contained per-finding file** for the `fix_registry_write_race` skeptic-review index (`harness-runs/skeptic_reviews/fix_registry_write_race_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`run_job`, the supervision loop's `paused` → `usage)` arm), at `[ "$(date +%s)" -gt $((usage_wait_ra + REMOTE_WAIT_MAX_SECS)) ]; then`. Also the header's JOB MODE block, the text `A wait still paused` / `REMOTE_WAIT_MAX_SECS past the later of that reset and its own start ends`, and `docs/remote-execution.md` → `### Resuming without the local watcher` plus the variables-table row `REMOTE_WAIT_MAX_SECS`.

**The problem.** The new bound on the in-job usage wait fires once the record is still `paused` `REMOTE_WAIT_MAX_SECS` seconds past `usage_wait_ra` (the later of the reset and the wait's start). The only thing that ends the wait normally is the gate's own resume: `usage_gate` drops `RESUME`, then `resume_paused_runs` relaunches. But `usage_gate` is throttled. Its first lines return early unless `USAGE_CHECK_INTERVAL_SECS` have passed since `LAST_USAGE_CHECK`:

```bash
[ $((now - LAST_USAGE_CHECK)) -ge "$USAGE_CHECK_INTERVAL_SECS" ] || return 0
```

The loop body also sleeps `POLL_INTERVAL_SECS` before each gate call. So the gate's first resume pass after the reset can land up to `USAGE_CHECK_INTERVAL_SECS + POLL_INTERVAL_SECS` after it. In a real job neither variable is mapped from a repository variable (`cli/templates/github/workflows/harness-run.yml` maps `REMOTE_WAIT_MAX_SECS` and neither of the others), so that lag is the defaults: 60 s + 15 s = 75 s.

`REMOTE_WAIT_MAX_SECS` **is** mapped (`REMOTE_WAIT_MAX_SECS: ${{ vars.REMOTE_WAIT_MAX_SECS }}`), and `docs/development.md` → Gate 12 tells a maintainer to set it to `0`. With any value below about 75, the bound usually fires on an iteration before the gate's throttled pass. The run was never stuck, but:

- the job ends `wait-poller` instead of resuming in the same job;
- it sends the false notification *"the in-job wait passed Ns after the reset without a resume — run /autonomous-sdlc-harness:branch-resume …"*;
- the run waits up to one poller interval (30 min as shipped) plus a new job's setup.

Before this branch, a self-hosted runner always waited in the job until the gate resumed it. So on a self-hosted runner that shares a low repository-wide value, this is a regression on every usage pause. On a hosted runner the job waits in the job only when `ra - now <= REMOTE_WAIT_MAX_SECS` at the decision. That happens when the engine takes long enough to reach its checkpoint that the reset is near or past, and that wait is then cut short the same way.

The default of 600 is well above 75, so a repository that leaves the variable unset is unaffected. That is why this is Should Fix, not Must Fix.

**Proof.** The order inside the `usage)` arm is `sleep "$POLL_INTERVAL_SECS"`, then `usage_gate`, which returns early while throttled, then `resume_paused_runs`, then the status read, then the bound check. `LAST_USAGE_CHECK` was last set by the gate pass during the `running` arm. With `REMOTE_WAIT_MAX_SECS=0`, the first iteration whose `date +%s` exceeds `usage_wait_ra` while the gate is still throttled takes the `decision=wait-poller` branch.

**Fix.** Give the bound the gate's worst-case lag, so it measures `REMOTE_WAIT_MAX_SECS` past the gate's last chance to resume, not past the reset itself. The notification and `detail` strings stay as they are: *"passed Ns after the reset"* is still true when more time than that has passed. The existing case *"a relaunch held off past the reset -> the in-job wait bound fires, wait-poller"* sets `USAGE_CHECK_INTERVAL_SECS=1`, and the job fixture sets `POLL_INTERVAL_SECS=1`. Its bound moves by 2 s, and none of its assertions change.

- [ ] In `run_job`, replace

  ```bash
              elif [ "$status" = "paused" ] &&
                [ "$(date +%s)" -gt $((usage_wait_ra + REMOTE_WAIT_MAX_SECS)) ]; then
                # The bound on the wait itself, self-hosted included: past the
                # reset it waited on by REMOTE_WAIT_MAX_SECS with no resume, the
                # job hands the run over rather than waiting on nothing.
  ```

  with

  ```bash
              elif [ "$status" = "paused" ] &&
                [ "$(date +%s)" -gt $((usage_wait_ra + USAGE_CHECK_INTERVAL_SECS + POLL_INTERVAL_SECS + REMOTE_WAIT_MAX_SECS)) ]; then
                # The bound on the wait itself, self-hosted included. It is measured
                # from the gate's last chance to resume, not from the reset: the gate
                # is throttled to USAGE_CHECK_INTERVAL_SECS and runs after a
                # POLL_INTERVAL_SECS sleep, so its resume can lag the reset by both.
                # REMOTE_WAIT_MAX_SECS past that with no resume, the job hands the
                # run over rather than waiting on nothing.
  ```

- [ ] In the header's JOB MODE block (`THE DECISION, when the run leaves running:`), replace the sentence `A wait still paused REMOTE_WAIT_MAX_SECS past the later of that reset and its own start ends in `wait-poller` with one notification, on every runner;` with the text below, rewrapped to the block's comment width:

  > A wait still paused REMOTE_WAIT_MAX_SECS past the gate's last chance to resume it — the later of that reset and its own start, plus USAGE_CHECK_INTERVAL_SECS and POLL_INTERVAL_SECS, the most the throttled gate can lag the reset — ends in `wait-poller` with one notification, on every runner;

- [ ] In `docs/remote-execution.md` → `### Resuming without the local watcher`, in the **Wait in the job** bullet, replace `once it is still paused `REMOTE_WAIT_MAX_SECS` past the later of the reset and its own start,` with:

  > once it is still paused `REMOTE_WAIT_MAX_SECS` past the gate's last chance to resume it (the later of the reset and its own start, plus the gate's check interval and the job's poll interval, 75 seconds at the defaults),

- [ ] In the same file's variables table, in the row `REMOTE_WAIT_MAX_SECS`, replace `and how far past the reset any in-job wait, self-hosted included, stays paused before it ends in `wait-poller`` with:

  > and how far past the gate's last resume pass after the reset any in-job wait, self-hosted included, stays paused before it ends in `wait-poller`

This fix edits no test file, so it runs no test. The full suite runs later, in the Run gates phase.
