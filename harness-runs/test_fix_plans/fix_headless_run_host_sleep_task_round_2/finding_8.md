### 8. Stall host sleep (c): the genuine-hang case fails in the full suite

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs` → `test('(c) a genuinely hung run with no host sleep is killed on the pass, as before'` (near line 271). In order, it calls:
- `f.session()`;
- `f.backDate()` and `f.writeState('.host_last_tick', epoch() - 5)`;
- one `session.next()`;
- `assertKilled(f, pid)` and `assertStubGone(f, stub)`.

Every wait runs under `const WAIT_MS = 30_000;`, inside a session script bounded by `const SESSION_TIMEOUT_MS = 180_000;`.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(c) a genuinely hung run with no host sleep is killed on the pass, as before`

**Failure (from the log):**

```
        not ok 1183 - (c) a genuinely hung run with no host sleep is killed on the pass, as before
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1180` under the same name. Round 1 closed it because the file passed when run alone.

Every wait this case makes goes through `waitFor` under the unscaled 30 000 ms `WAIT_MS`:
- the launch pass and its two launch waits;
- the kill pass;
- two pid-gone polls.

The launch pass cuts a clone, which the shared driver allows `TICK_TIMEOUT_MS` for (120 000 ms at the default scale). The kill decision is deterministic once the pass has returned: one `is hung` line, a `failed` record, no `host-wake: ` line.

The case is also exposed to the coupling Finding 7 records. Its `.host_last_tick` is written 5 s back, and the wake threshold is 75 s (`POLL_INTERVAL_SECS` 15 + `STALL_WAKE_GAP_SECS` 60). A `go-2` pass that started more than 70 s later would log a wake and fail `f.count(HOST_WAKE) === 0`. That would take an extreme stall between two adjacent statements, so the budget is the likelier point of failure. The log cannot confirm either.

**Suspected shared cause:** likely the same cause as Finding 7 — every wait this case makes is a `session()` / `waitFor` bound that Finding 7 rebinds and scales.

**Fix:**

- [ ] Make sure `cli/test/watcher-stall-host-sleep.test.mjs` has all three: `WAIT_MS = scaleBound(30_000)`, `session()`'s pass and launch waits under `TICK_TIMEOUT_MS` (from `./helpers/watcher.mjs`, already scaled), and `SESSION_TIMEOUT_MS = scaleBound(240_000)`. If Finding 7 has landed, they are already in place: confirm them with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared.
- [ ] Leave the `epoch() - 5` offset and `STALL_ENV` unchanged, because they are the behaviour under test. Add no retry.
