### 3. Keep-awake (b)(c): the holder-gone poll runs under the unscaled `WAIT_MS`

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(b)(c) macOS: an engine exiting 3 is classified failed under a hold` (near line 269). It sets the stub to `f.engineBody('exit 3')`, then runs one shared-driver pass (`await f.pass(MACOS_PROBE);`), then `await f.holderGone(record.keep_awake_pid);`. That call is `holderGone: (pid) => waitFor(…)` under `const WAIT_MS = 20_000;` (near line 36).

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text`

**Failure (from the log):**

```
        not ok 1079 - (b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1076` under the same name. Round 1 closed it because the file passed when run alone.

This case has the same shape as Finding 2: one pass through the shared driver's scaled bound, then a `holderGone` poll under the unscaled 20 000 ms `WAIT_MS`.

The default-probe case also runs `exit 3` through the same driver, and it passed in this round. It differs from (b)(c) in only two ways: it takes no hold, and it makes no `holderGone` call. That points at the poll and not at the exit classification. The log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the only wait this case has beyond the scaled shared pass is `waitFor` under the unscaled `WAIT_MS` that Finding 1 scales.

**Fix:**

- [ ] Make sure `const WAIT_MS` in `cli/test/watcher-keep-awake.test.mjs` is `scaleBound(20_000)` (`./helpers/timing.mjs`). If Finding 1 has landed, this is already in place: confirm it with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared.
- [ ] Do not change the `record.status === 'failed'` or stream assertions, and add no retry.
