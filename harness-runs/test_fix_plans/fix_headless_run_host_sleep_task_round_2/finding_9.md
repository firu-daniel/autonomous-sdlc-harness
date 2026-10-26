### 9. Stall host sleep (d): the missing last-pass file case fails in the full suite

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs` → `test('(d) a missing or non-integer last-pass file records no wake and never defers a kill'` (near line 291). It runs two `await f.tick(STALL_ENV);` passes through the shared driver, which are under the scaled `TICK_TIMEOUT_MS`. Then it runs `f.session()`, one `session.next()`, `assertKilled(f, pid)` and `assertStubGone(f, stub)`, under `const WAIT_MS = 30_000;` and `const SESSION_TIMEOUT_MS = 180_000;`.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(d) a missing or non-integer last-pass file records no wake and never defers a kill`

**Failure (from the log):**

```
        not ok 1184 - (d) a missing or non-integer last-pass file records no wake and never defers a kill
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1181` under the same name. Round 1 closed it because the file passed when run alone.

The case's first two passes go through the shared driver, which `968f982a` scaled. Its session half has the same waits as (c) (Finding 8): the launch pass, the kill pass and two pid-gone polls, each through `waitFor` under the unscaled 30 000 ms `WAIT_MS`.

Its `.host_last_tick` and `.host_woke_at` are written as `garbage` before the kill pass. That means no gap is computed, so this case does not have Finding 7's wake-gap coupling. The budget is the only load-sensitive part. The log cannot confirm which wait ran out.

**Suspected shared cause:** likely the same cause as Finding 7 — the session half waits only through the `session()` / `waitFor` bounds that Finding 7 rebinds and scales.

**Fix:**

- [ ] Make sure `cli/test/watcher-stall-host-sleep.test.mjs` has all three: `WAIT_MS = scaleBound(30_000)`, `session()`'s pass and launch waits under `TICK_TIMEOUT_MS`, and `SESSION_TIMEOUT_MS = scaleBound(240_000)`. If Finding 7 has landed, they are already in place: confirm them with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared.
- [ ] Do not change the `garbage` state writes or the `/^\d+\n$/` assertions, and add no retry.
