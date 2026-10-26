### 7. Stall host sleep (a)(b): the suite's polls and session passes run under unscaled, sub-pass bounds

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs`:
- `const WAIT_MS = 30_000;` (near line 39) and `const SESSION_TIMEOUT_MS = 180_000;` (near line 41).
- `sleepFixture`'s `const waitFor = async (predicate, label) =>` (near line 105).
- `session()` → `const reached = (n) =>` (near line 191), plus its launch waits `'the session did not hang'` and `'the record is not running with a pid'` (near lines 197–198).
- The import line `import { createWatcherFixture, DEFAULT_KEEP_AWAKE_PROBE, DEFAULT_SANDBOX_PROBE } from './helpers/watcher.mjs';` (near line 31).

The bounds to adopt are `cli/test/helpers/timing.mjs` → `export function scaleBound(base)` and `cli/test/helpers/watcher.mjs` → `export const TICK_TIMEOUT_MS = scaleBound(60_000);`.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills`

**Failure (from the log):**

```
        not ok 1182 - (a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1179` under the same name. Round 1 closed it because the file passed when run alone.

This file was added on this branch, so `968f982a`'s adoption of `scaleBound` across `cli/test/` did not reach it. Its waits are still at their written values:

- `WAIT_MS` = 30 000 ms bounds every `waitFor`. That covers `session()`'s per-pass `reached(n)`, its two launch waits, and `assertKilled` / `assertStubGone`'s pid-gone polls.
- `reached(1)` waits for the launch pass, which cuts the clone and starts the hung stub. The shared driver bounds such a pass at `TICK_TIMEOUT_MS`, 120 000 ms at the default scale.
- `SESSION_TIMEOUT_MS` = 180 000 ms bounds the whole session script, and is unscaled.

The sibling `localStall` pattern this file copies (`cli/test/watcher-stall-reset-payloads.test.mjs`) now waits `HUNG_WAIT_MS = scaleBound(60_000)` and `RUN_TIMEOUT_MS = scaleBound(180_000)`, and every case there passed in this round.

Case (a)(b) runs the most passes in this file: the launch, the wake pass and the kill pass. It also runs two pid-gone polls. All three cases in this file fail in the full suite and pass alone. The watchdog arithmetic they assert is deterministic once each pass has returned. The pass and poll budgets are what change with load. The log cannot confirm which wait ran out.

**A residual timing coupling this fix leaves alone.** Before the kill pass, the case writes `.host_last_tick` as `epoch() - 5`. `host_wake_pass` (`cli/templates/scripts/autonomous-watcher.sh`) counts a wake only when the gap is over `POLL_INTERVAL_SECS + STALL_WAKE_GAP_SECS`, which is 75 s here. So a second `host-wake: ` line would need the `go-3` pass to start more than 70 s after that write. Those tunables are the behaviour under test, and `timing.mjs`'s header keeps every `*_SECS` tunable unscaled. If a later round's unit run shows a `host-wake: ` count of 2 at (b), record it as that round's evidence rather than widening the tunable.

**Fix:**

- [ ] In `cli/test/watcher-stall-host-sleep.test.mjs`, import `scaleBound` from `./helpers/timing.mjs`, and add `TICK_TIMEOUT_MS` to the existing `./helpers/watcher.mjs` import. `TICK_TIMEOUT_MS` is already scaled, so do not scale it again.
- [ ] Scale the poll ceiling: `const WAIT_MS = scaleBound(30_000);`.
- [ ] Give `waitFor` an optional third parameter, the budget, defaulting to `WAIT_MS`. Use it in the deadline and in the failure message.
- [ ] In `session()`, pass `TICK_TIMEOUT_MS` as the budget to `reached(n)`, to `'the session did not hang'` and to `'the record is not running with a pid'`. Each waits for one watcher pass to have run.
- [ ] Scale the session bound: `const SESSION_TIMEOUT_MS = scaleBound(240_000);`. A base of 240 000 ms covers (a)(b)'s three 60 000 ms passes plus its polls. At the cap of 5 it is 1 200 000 ms, below `--test-timeout=1800000` (`cli/package.json` → `scripts.test`), which keeps `timing.mjs` header choice 3's "largest scaled bound" true. A larger base would have to amend that choice in the same edit.
- [ ] Update the doc comments on `WAIT_MS` and `SESSION_TIMEOUT_MS`, and add one sentence to the file header, saying that the bounds are scaled by `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`) and that `session()` waits for each pass under `TICK_TIMEOUT_MS`.
- [ ] Leave `STALL_ENV` (`STALL_KILL_SECS`, `STALL_WAKE_GAP_SECS`, `POLL_INTERVAL_SECS` and the rest), `SLEPT_SECS`, the `epoch() - n` offsets and every poll interval unscaled, as `timing.mjs`'s header requires. Change no assertion's expected value, and add no retry or skip.
