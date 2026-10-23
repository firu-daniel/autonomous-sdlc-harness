### 1. The held-off-relaunch usage case keeps a 2-second reset lead a loaded suite outruns

**Site anchor:** `cli/test/watcher-remote-job.test.mjs`, the subtest `'a relaunch held off past the reset -> the in-job wait bound fires, wait-poller'`, its stub body `` `${rateLimitRejected(2)}; for i in $(seq 1 100); do if [ -f "$STATE/PAUSE" ]; then : > "$STATE/AUTONOMOUS_STOP"; …`` (near line 879, a navigation hint only). Related: the constants `REPEAT_RESET_AHEAD_SECS` / `REPEAT_PAUSE_WAIT_TENTHS` and their doc comment (near lines 87-92), and the sibling subtest `'a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller'`, which already takes them (near lines 846-850).

**Failing test:** `cli/test/watcher-remote-job.test.mjs` — `a relaunch held off past the reset -> the in-job wait bound fires, wait-poller` (subtest 4), and through it its parent `usage: a short reset is waited out in the job, a reset past the deadline goes to the poller`.

**Failure, from the gate log (gate 4, `npm test` in `cli/`):**

```
        not ok 992 - a run form killed with its session leaves the worker running, and a re-issued run form collects it
            not ok 4 - a relaunch held off past the reset -> the in-job wait bound fires, wait-poller
        not ok 1088 - usage: a short reset is waited out in the job, a reset past the deadline goes to the poller
...
        # tests 2276
        # pass 2269
        # fail 3
        # duration_ms 1964730.405667
```

The log carries the `not ok` lines and the totals only; it does not carry the failing assertion's message. The parent `1088` fails only because its subtest 4 failed — every other subtest of it passed.

**Class:** first round — no earlier log to compare against.

**Diagnosis.** This branch did not touch `cli/test/watcher-remote-job.test.mjs` or the watcher; the failure is a timing defect in the fixture, the one this file's own header already names. The subtest's stub emits a `rate_limit_event` whose reset is only **2 seconds** ahead (`rateLimitRejected(2)`) and waits at most 10 s (`seq 1 100` tenths) for `PAUSE`. The header's `HARNESS_JOB_USAGE_REPEAT` paragraph records what happens to that lead under load: *"a watcher's pass outlasts 2 seconds, the gate then reads an elapsed window and downgrades it (the watcher's usage-gate invariant 1), and the run completes unpaused on one prompt — a failure of the fixture's timing"*. The sibling lost-`usage_resume_at` subtest was already moved off the 2-second lead for exactly this reason (its comment: *"a 2-second lead lets a loaded gate downgrade the event and never pause"*). This round's suite ran about 33 minutes (`duration_ms 1964730`) alongside this branch's process-heavy `run-test-suite.test.mjs` cases, which is that load. When the event is downgraded, no `is usage-paused — waiting in the job for` line is logged and no `waiting in the job` notification is sent, so the subtest's first `waiting >= 0` assertion — or any later one that needs the pause — fails.

The lead has nothing to do with what the subtest asserts. The bound it checks is `REMOTE_WAIT_MAX_SECS: '2'` *after* the reset (`the in-job wait passed 2s after the reset without a resume`), not the distance to the reset. A 15-second lead is still waited out in the job: the repeated form of the first subtest runs at that lead and expects `job: completed stop` within the same job. So a longer lead keeps every assertion as it is and removes only the race with the clock.

**Concrete fix** (in `cli/test/watcher-remote-job.test.mjs` only; no assertion is removed or loosened):

- [ ] In the subtest `a relaunch held off past the reset -> the in-job wait bound fires, wait-poller`, change the stub so it uses the repeated case's lead and PAUSE wait: replace `rateLimitRejected(2)` with `rateLimitRejected(REPEAT_RESET_AHEAD_SECS)` and `seq 1 100` with `seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}`. The stub's template literal then reads `` `${rateLimitRejected(REPEAT_RESET_AHEAD_SECS)}; for i in $(seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}); do if [ -f "$STATE/PAUSE" ]; then : > "$STATE/AUTONOMOUS_STOP"; : > "$STATE/PAUSE_ACK"; exit 0; fi; sleep 0.1; done` ``.
- [ ] Leave `REMOTE_WAIT_MAX_SECS: '2'`, `USAGE_CHECK_INTERVAL_SECS: '1'`, `USAGE_RESUME_MARGIN_SECS: '0'` and every assertion, including the `/the in-job wait passed 2s after the reset without a resume/` match, unchanged.
- [ ] Add a short comment above the stub, worded like the lost-`usage_resume_at` subtest's: this case asserts the wait bound, not the in-job wait's timing, so it takes the repeated case's lead and wait, because a 2-second lead lets a loaded gate downgrade the event and never pause (the header's `HARNESS_JOB_USAGE_REPEAT` paragraph).
- [ ] Update the doc comment on `REPEAT_RESET_AHEAD_SECS` / `REPEAT_PAUSE_WAIT_TENTHS` — *"The lost-`usage_resume_at` case takes them too, for the same reason."* — so it also names the held-off-relaunch case.
- [ ] Confirm the subtest's total time stays well inside `WATCHER_RUN_TIMEOUT_MS` (120 000 ms): about 15 s of lead plus the 2 s bound plus the one-second poll intervals.
