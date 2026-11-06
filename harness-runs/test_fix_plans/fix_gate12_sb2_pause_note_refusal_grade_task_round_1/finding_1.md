### 1. The single-run usage case's 2-second reset lead elapses under suite load, so the run never pauses

**Site:** `cli/test/watcher-remote-job.test.mjs`. The failure is in the `test('usage: a short reset is waited out in the job, a reset past the deadline goes to the poller', …)` block, in its subtest `'a reset 2 seconds ahead -> the run completes in the same job'`, at the line `await runOnce('', 2, PAUSE_WAIT_TENTHS);` (near line 865). Related sites:
- the file header paragraph that opens `**\`HARNESS_JOB_USAGE_REPEAT\` repeats the case *"a reset 2 seconds ahead"* concurrently.**` (near line 68);
- the doc comment above `const REPEAT_RESET_AHEAD_SECS = 15;` (near line 120);
- `docs/development.md`, the sentence `It runs the case *"a reset 2 seconds ahead -> the run completes in the same job"*` (near line 306).

**Failing test:** `cli/test/watcher-remote-job.test.mjs`. The subtest `a reset 2 seconds ahead -> the run completes in the same job` failed, and with it its parent `usage: a short reset is waited out in the job, a reset past the deadline goes to the poller`.

**Failure (from the log):**

```
not ok 1 - a reset 2 seconds ahead -> the run completes in the same job
  duration_ms: 54653.337917
  location: 'cli/test/watcher-remote-job.test.mjs:847:11'
  error: |-
    Expected values to be strictly equal:
    1 !== 2
  expected: 2
  actual: 1
  stack: |-
    runOnce (file://cli/test/watcher-remote-job.test.mjs:861:14)
    async TestContext.<anonymous> (file://cli/test/watcher-remote-job.test.mjs:865:7)
not ok 1576 - usage: a short reset is waited out in the job, a reset past the deadline goes to the poller
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
```

**Diagnosis:** Round 1, so there is no earlier log to classify this against. The branch did not cause it. Its diff touches only `cli/test/gate12-sandbox-round-*.test.mjs`, `scripts/lib/gate12-sandbox-round/*.sh` and two docs. It leaves this test file and `scripts/autonomous-watcher.sh` / `cli/templates/scripts/autonomous-watcher.sh` untouched.

Line 861 is `assert.equal(j.prompts().length, 2, label);`. The run got one prompt instead of two, which means it completed without ever being usage-paused and relaunched. The earlier asserts (exit 0, last line `job: completed stop`) passed.

The file header already documents this exact failure mode, for the repeated variant only. It says that under load *"a watcher's pass outlasts 2 seconds, the gate then reads an elapsed window and downgrades it (the watcher's usage-gate invariant 1), and the run completes unpaused on one prompt — a failure of the fixture's timing, not of the race."* So the repeated path (`JOB_USAGE_REPEAT > 1`) uses `REPEAT_RESET_AHEAD_SECS` (15) and `REPEAT_PAUSE_WAIT_TENTHS`. Two sibling cases, *"a usage_resume_at lost after the gate paused"* and *"a relaunch held off past the reset"*, already took that lead and wait for the same reason, and their comments say so.

The single-run path (`JOB_USAGE_REPEAT === 1`) still passes a 2-second lead and `PAUSE_WAIT_TENTHS`. In this round the full suite ran for about 1916 s under that load, and this one case took about 55 s. That load is the same condition the header describes for N concurrent watchers. The 2-second reset had elapsed before the gate read it, so the gate downgraded it to `allowed` and the run completed on one prompt. The suite runs this case on every gate run, so it fails whenever the host is loaded enough.

The 15-second lead is admissible on the default hosted runner. `REMOTE_WAIT_MAX_SECS` defaults to `600` (`scripts/autonomous-watcher.sh`, the `REMOTE_WAIT_MAX_SECS="${REMOTE_WAIT_MAX_SECS:-600}"` line). The repeated path already runs this case with that lead and no `RUNNER_ENVIRONMENT` override.

**Fix:** Make the single run take the same load-tolerant lead and wait as the repeated run. Keep the assertions unchanged. Weaken no assertion and do not touch the watcher.

- [ ] In `cli/test/watcher-remote-job.test.mjs`, in the subtest's `if (JOB_USAGE_REPEAT === 1)` branch, replace `await runOnce('', 2, PAUSE_WAIT_TENTHS);` with `await runOnce('', REPEAT_RESET_AHEAD_SECS, REPEAT_PAUSE_WAIT_TENTHS);`. Every call to `runOnce` then passes the same two values. You may drop `runOnce`'s `aheadSecs` / `pauseTenths` parameters and read the two constants directly, but only if the call sites stay as clear.
- [ ] Rename the subtest title from `'a reset 2 seconds ahead -> the run completes in the same job'` to `'a reset inside the in-job wait -> the run completes in the same job'`. The title must no longer state a lead the case does not use.
- [ ] Rewrite the file-header paragraph that begins `**\`HARNESS_JOB_USAGE_REPEAT\` repeats the case *"a reset 2 seconds ahead"* concurrently.**`. It must use the new case title. It must say that every run, N = 1 included, takes `REPEAT_RESET_AHEAD_SECS` and `REPEAT_PAUSE_WAIT_TENTHS`, because a loaded full-suite run outlasts a 2-second lead just as N concurrent watchers do. Keep the existing explanation of the downgrade and of why the race window does not depend on the lead. Do **not** write this round's measured durations into the header (`harness-runs/lessons.md`: a wall-clock figure in a document of record is never one a run measured inside its own session).
- [ ] Update the doc comment above `const REPEAT_RESET_AHEAD_SECS = 15;` ("The repeated case's reset lead and PAUSE wait …"). It must say the single run takes these values too. Keep the constant names, so the other cases that cite "the repeated case's lead and wait" stay accurate without edits.
- [ ] In `docs/development.md`, in the sentence `It runs the case *"a reset 2 seconds ahead -> the run completes in the same job"* as N concurrent job-mode watchers`, replace the quoted case name with the new title, character for character. That file is the `general` layer's, so this step runs after the `cli` edits.
- [ ] Grep the repository, excluding `harness-runs/`, for `reset 2 seconds ahead`. Only `cli/test/watcher-remote-job.test.mjs` and `docs/development.md` hold it today. No hit may remain.
