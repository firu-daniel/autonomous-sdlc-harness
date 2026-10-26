### 5. Keep-awake (i): the refused Linux lock case fails in the full suite

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(i) Linux: a refused lock logs once, still launches` (near line 396). It calls `f.setProbeStatus(1)`, then `f.session(LINUX_PROBE)`, then one `session.next()` through `session()` → `const reached = (n) =>`, and then `session.end()`. These run under `const WAIT_MS = 20_000;` and `const SESSION_TIMEOUT_MS = 180_000;`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(i) Linux: a refused lock logs once, still launches, and is never retried on mains`

**Failure (from the log):**

```
        not ok 1084 - (i) Linux: a refused lock logs once, still launches, and is never retried on mains
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1081` under the same name. Round 1 closed it because the file passed when run alone.

The case has two waits, and both go through `session()` under the unscaled 20 000 ms `WAIT_MS`. The first is the launch pass, `reached(1)` plus the `'the launch recorded no keep_awake'` wait. The second is the later pass, `reached(2)`.

Each of these waits for a full watcher pass. The shared driver bounds such a pass at `TICK_TIMEOUT_MS`, 120 000 ms at the default scale. The refused-lock assertions (`keep_awake === 'refused'`, one `systemd-inhibit` call, one `not holding` line) are deterministic once each pass has returned. The log cannot confirm which wait ran out.

**Suspected shared cause:** likely the same cause as Finding 1 — both of this case's waits are `session()` pass waits that Finding 1 moves onto `TICK_TIMEOUT_MS` and scales.

**Fix:**

- [ ] Make sure `session()` in `cli/test/watcher-keep-awake.test.mjs` waits for `reached(n)` and for the launch under `TICK_TIMEOUT_MS`, and that `SESSION_TIMEOUT_MS` is `scaleBound(240_000)`. If Finding 1 has landed, both are already in place: confirm them with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared.
- [ ] Do not change the `probe-status` control or the once-only log-line assertion, and add no retry.
