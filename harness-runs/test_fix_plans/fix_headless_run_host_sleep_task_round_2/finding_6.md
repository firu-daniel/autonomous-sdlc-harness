### 6. Keep-awake (k): the kill-switch battery release case fails in the full suite

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(k) Linux: under the global kill switch a pass on battery still releases the hold'` (near line 425). In order, it calls:
- `f.session(LINUX_PROBE)`;
- one `session.next()` through `session()` → `const reached = (n) =>`, with `${STATE_DIR}/AUTONOMOUS_STOP` written and the power set to battery;
- `f.holderGone(holder)`;
- `session.end()`.

These run under `const WAIT_MS = 20_000;` and `const SESSION_TIMEOUT_MS = 180_000;`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(k) Linux: under the global kill switch a pass on battery still releases the hold`

**Failure (from the log):**

```
        not ok 1086 - (k) Linux: under the global kill switch a pass on battery still releases the hold
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1083` under the same name. Round 1 closed it because the file passed when run alone.

All of this case's waits go through `waitFor` under the unscaled 20 000 ms `WAIT_MS`: the launch pass, the second pass and the holder-gone poll. The two passes are whole watcher passes, which the shared driver bounds at `TICK_TIMEOUT_MS`, 120 000 ms at the default scale.

The kill-switch and battery-release assertions are deterministic once the pass has returned. The log cannot confirm which wait ran out.

**Suspected shared cause:** likely the same cause as Finding 1 — the case waits only through the `session()` / `holderGone` bounds that Finding 1 rebinds and scales.

**Fix:**

- [ ] Make sure `cli/test/watcher-keep-awake.test.mjs` has all three: `WAIT_MS = scaleBound(20_000)`, `session()`'s pass and launch waits under `TICK_TIMEOUT_MS`, and `SESSION_TIMEOUT_MS = scaleBound(240_000)`. If Finding 1 has landed, they are already in place: confirm them with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared.
- [ ] Do not change the kill-switch file handling or its `t.after` cleanup, and add no retry.

## Already passing

- **(a) Test and fix site:** `(k) Linux: under the global kill switch a pass on battery still releases the hold` in `cli/test/watcher-keep-awake.test.mjs`; fix site read at `const WAIT_MS`, `const SESSION_TIMEOUT_MS`, `keepAwakeFixture` → `waitFor` / `holderGone`, and `session()` → `reached` and the launch `waitFor`.
- **(b) Evidence:** Finding 1's commit `d2acb123` (an ancestor of HEAD) put all three in place. Grep shows `const WAIT_MS = scaleBound(20_000);`, `const SESSION_TIMEOUT_MS = scaleBound(240_000);`, and `TICK_TIMEOUT_MS` as the budget of both `reached(n)` and `'the launch recorded no keep_awake'`. `holderGone` waits through `waitFor`, whose default budget is `WAIT_MS`. `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, run after that commit: `ok 9 - (k) Linux: under the global kill switch a pass on battery still releases the hold` (11261 ms), and the file had `# tests 9`, `# pass 9`, `# fail 0`.
- **(c) No code file edited:** `cli/test/watcher-keep-awake.test.mjs` is unchanged; the kill-switch handling and its `t.after` cleanup are untouched and no retry was added.
