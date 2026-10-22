### 1. The lost-usage_resume_at job case depends on the gate seeing a 2-second window

**Site:** `cli/test/watcher-remote-job.test.mjs` → `await t.test('a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller', …)` (near line 835), inside `test('usage: a short reset is waited out in the job, a reset past the deadline goes to the poller', …)`. Its stub body is `` `${rateLimitRejected(2)}; for i in $(seq 1 100); do if [ -f "$STATE/PAUSE" ]; then ${loseResumeAt}; … `` and its fallback assertion is `Number(j.status().usage_resume_at) >= nowSecs() + 3600 - 30`. The code it exercises is `cli/templates/scripts/autonomous-watcher.sh` → `usage_gate`, which applies invariant 1 (`if [ "$r" -gt 1 ] && [ "$horizon" -gt 0 ] && [ "$horizon" -le "$now" ]; then r=1; fi`), then `run_job`'s `usage)` arm, `job_usage_wait_ok` and `usage_resume_at_var` (`USAGE_RESUME_AT=$(($(date +%s) + USAGE_FALLBACK_RESUME_SECS))`).

**Failing test:** `cli/test/watcher-remote-job.test.mjs` — `a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller` (and its parent `usage: a short reset is waited out in the job, a reset past the deadline goes to the poller`)

**The failure, quoted from the log:**

```
            not ok 3 - a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller
        not ok 1076 - usage: a short reset is waited out in the job, a reset past the deadline goes to the poller
```

The gate wrapper keeps only the `not ok` lines and the tail of the suite's output, so the assertion message is not in the log. The failure is **new this round**: the case passed in round 1's log. It is not a regression from round 1's fix, which changed only `cli/test/doctor.test.mjs`. The branch's own diff does not reach this path either. Job mode launches through `spawn_engine` and never enters `process_inbox_file`, where the branch's sandbox preflight sits. `autonomous-watcher.sh` and `harness-run-lib.sh` changed nothing that the job's usage path reads.

**Diagnosis, from the current tree.** The case passes only if the gate pauses the run, and the gate can pause it only during a window that is 2 seconds wide at the moment the stub emits its event:

1. The stub sleeps 0.3 s, then prints a `rejected` event whose `resetsAt` is `$(date +%s) + 2`. The job loop sleeps `POLL_INTERVAL_SECS` (1) before each `usage_gate`, and the gate is throttled to `USAGE_CHECK_INTERVAL_SECS` (1). If its first assessment runs after `resetsAt`, invariant 1 downgrades the event to `allowed` and the gate never drops PAUSE. The stub's loop then waits its 100 tenths (10 s), finds no PAUSE, and exits 0, and the job ends `job: completed stop`, not `job: paused wait-poller`. This file's own header (the `HARNESS_JOB_USAGE_REPEAT` paragraph) records exactly this outcome under load for a 2-second lead: *"a watcher's pass outlasts 2 seconds, the gate then reads an elapsed window and downgrades it … — a failure of the fixture's timing, not of the race."* This round's suite ran 2,199 s across 2,264 tests with suites running concurrently, so the host was loaded.
2. A second candidate, under the same load: the fallback check compares the repaired value with `nowSecs()` read **after** the job returns, with 30 s of slack. If more than 30 s pass between the repair and that read, the assertion fails even though the repair is correct.

Unlike the case's first sibling, *"a reset 2 seconds ahead"*, this case does not need a short lead. It asserts the repair of a value the stub erased after the PAUSE. The pause side of `usage_gate` skips a record already tagged `paused_by=usage` (`[ "$(registry_get "$b" paused_by)" = "usage" ] && continue`), so a window that is still open cannot re-record `usage_resume_at` after the stub erased it. The job-mode resume side skips an empty value. The repaired value (now + 3600) is past `REMOTE_WAIT_MAX_SECS` (600) whatever the lead was, so the job still goes to `wait-poller`.

**Fix.** All edits are in `cli/test/watcher-remote-job.test.mjs`, in this case only. No assertion is removed or loosened.

- [x] Give the stub a reset lead the gate cannot miss under load: replace `rateLimitRejected(2)` with `rateLimitRejected(REPEAT_RESET_AHEAD_SECS)` (15 s, already declared near line 88). Widen the stub's PAUSE wait from `$(seq 1 100)` to `$(seq 1 ${REPEAT_PAUSE_WAIT_TENTHS})` (600 tenths), so a late gate still finds the stub alive. Both stay well under `WATCHER_RUN_TIMEOUT_MS` (120 000 ms).
- [x] Add a short comment above the stub. It should say that this case asserts the repair rather than the timing of the in-job wait, so it takes the repeated case's lead and wait, and that a 2-second lead lets a loaded gate downgrade the event and never pause (the file header's `HARNESS_JOB_USAGE_REPEAT` paragraph).
- [x] Take the fallback bound from the job's start, not from after it returns. Add `const before = nowSecs();` immediately before `const result = await j.job(…)`. Replace the `assert.ok(Number(j.status().usage_resume_at) >= nowSecs() + 3600 - 30, …)` check with a two-sided one: the value is at least `before + 3600` and at most `nowSecs() + 3600`, read after the job. Keep the existing message (`usage_resume_at … is not the one-hour fallback`). This is tighter than the old check: it brackets the repair between the job's start and its end, and it no longer depends on how long the job took.
- [x] If the file header's sentence *"none of them waits on the fallback hour"*, or its description of the `usage:` cases, no longer holds after these edits, amend it in the same edit. It should still hold, because nothing here waits on the hour.

**On a single-file run of this case.** Under `## The test-run rule` point 1 this unit may run the named file. A pass in isolation does not show that the case is fine: it passed in round 1 and failed only under this round's suite load. A green isolated run shows the edits are correct, not that they were unnecessary.

**Suspected shared cause:** likely the same cause as Finding 2. Both are wall-clock-bounded watcher cases that pass in isolation and fail under the gate's concurrent, roughly 37-minute suite run.
