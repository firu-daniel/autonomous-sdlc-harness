### 2. Keep-awake (a)(c): the holder-gone poll runs under the unscaled `WAIT_MS`

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(a)(c) macOS: caffeinate waits on the engine\'s own pid` (near line 252). It runs one pass through the shared driver (`await f.pass(MACOS_PROBE);`, which is `w.tick(…)` under the scaled `TICK_TIMEOUT_MS`) and then `await f.holderGone(record.keep_awake_pid);`. That call is `holderGone: (pid) => waitFor(…)` under `const WAIT_MS = 20_000;` (near line 36).

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream`

**Failure (from the log):**

```
        not ok 1078 - (a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1075` under the same name. Round 1 closed it because the file passed when run alone.

This case's pass goes through the shared driver, whose bound `968f982a` scaled. Its only other wait is `holderGone`. That poll has three parts:
- `alive(pid)`, which spawns a `bash` per attempt;
- a 100 ms `delay`;
- the unscaled 20 000 ms `WAIT_MS` budget.

The `caffeinate` stub exits on its own 0.1 s `kill -0` poll once the engine is gone. Under a full-suite load, spawning the stub's `sleep`s and the case's `alive` probes can push the holder's observed exit past 20 s.

Three cases in this file run the same single shared-driver pass but never call `waitFor`: (d), (j) and the default-probe case. All three passed in this round. The assertions before `holderGone` are deterministic for a given pass (the recorded `caffeinate` argv, the record, the `HOLDING` line), so the poll is the likeliest point of failure. The log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — `holderGone` polls through the file's one `waitFor` under the unscaled `WAIT_MS` that Finding 1 scales.

**Fix:**

- [ ] Make sure `const WAIT_MS` in `cli/test/watcher-keep-awake.test.mjs` is `scaleBound(20_000)` (`./helpers/timing.mjs`). `holderGone`'s `waitFor` then runs under the scaled budget. If Finding 1 has landed, this is already in place: confirm it with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared. Round 1 closed this case that way, and it failed again in the full suite.
- [ ] Do not shorten the stub's `sleep 0.1` poll, do not drop the `holderGone` assertion, and add no retry.
