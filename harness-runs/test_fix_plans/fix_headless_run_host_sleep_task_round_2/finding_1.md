### 1. Keep-awake (l): the suite's polls and session passes run under unscaled, sub-pass bounds

**Site:** `cli/test/watcher-keep-awake.test.mjs`:
- `const WAIT_MS = 20_000;` (near line 36) and `const SESSION_TIMEOUT_MS = 180_000;` (near line 38).
- `keepAwakeFixture`'s `const waitFor = async (predicate, label) =>` (near line 147).
- `session()` → `const reached = (n) =>` (near line 223) and its launch wait `'the launch recorded no keep_awake'` (near line 229).
- `holderGone: (pid) =>` (near line 182).
- The import line `import { createWatcherFixture, DEFAULT_SANDBOX_PROBE } from './helpers/watcher.mjs';` (near line 24).

The bounds to adopt are `cli/test/helpers/timing.mjs` → `export function scaleBound(base)` and `cli/test/helpers/watcher.mjs` → `export const TICK_TIMEOUT_MS = scaleBound(60_000);`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true`

**Failure (from the log):**

```
        not ok 1082 - (l) macOS: a hold released by execution.keepAwake false is taken again once the key is true
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1079` under the same name. Round 1 closed it as already passing because the file passed when run alone. It failed again in this round's full-suite run, so the failure depends on host load.

This run started after `ed5e5658` merged `968f982a`, which made every "until X happens" ceiling in `cli/test/` go through `scaleBound` (`cli/test/helpers/timing.mjs`, header: *"every 'until X happens' ceiling in `cli/test/` goes through `scaleBound`, and nothing else does"*; default scale `2`). This file was not on `dev`, so it was not adopted. Its ceilings are still the written values:

- `WAIT_MS` = 20 000 ms bounds every `waitFor`. That covers `holderGone`, `session()`'s `reached(n)` and its launch wait.
- `reached(1)` waits for pass 1 under that same 20 000 ms. Pass 1 takes the inbox drop, cuts the clone and launches the engine with its holder. The shared driver now allows one such pass `TICK_TIMEOUT_MS`, which is 120 000 ms at the default scale.
- `SESSION_TIMEOUT_MS` = 180 000 ms bounds the whole session script, and is unscaled.

Case (l) crosses all three. It runs `f.session(MACOS_PROBE)` (pass 1 plus the launch wait), two `session.next()` passes, and `holderGone` twice, all inside one session script. On a host running the whole suite, any of those waits can run out before the watcher reaches the state. The same three waits passed when the file ran alone. Across this file, the cases that call `waitFor` fail, and the three that never do ((d), (j), the default-probe case) pass.

This is the most likely cause. The log cannot confirm it, because it has no assertion message.

**Fix:**

- [ ] In `cli/test/watcher-keep-awake.test.mjs`, import `scaleBound` from `./helpers/timing.mjs`, and add `TICK_TIMEOUT_MS` to the existing `./helpers/watcher.mjs` import. `TICK_TIMEOUT_MS` is already exported and already scaled, so do not scale it again.
- [ ] Scale the poll ceiling: `const WAIT_MS = scaleBound(20_000);`. This is a ceiling that returns early on success, so it falls under the rule in `timing.mjs`'s header. The `status` run's `{ timeoutMs: WAIT_MS, … }` in case (d) inherits it.
- [ ] Give `waitFor` an optional third parameter, the budget, defaulting to `WAIT_MS`. Use it in the deadline and in the failure message's `within … ms`.
- [ ] In `session()`, pass `TICK_TIMEOUT_MS` as the budget to `reached(n)`'s `waitFor` and to the `'the launch recorded no keep_awake'` wait. Each of these waits for one watcher pass, and that is the shared driver's bound for one pass (`cli/test/helpers/watcher.mjs` header, choice 4).
- [ ] Scale the session bound: `const SESSION_TIMEOUT_MS = scaleBound(240_000);`. The longest session ((l), and (e)-(h) in Finding 4) runs three passes and up to two holder-gone polls. A base of 240 000 ms covers three 60 000 ms passes plus those polls. At the cap of 5 it is 1 200 000 ms, below `--test-timeout=1800000` (`cli/package.json` → `scripts.test`). That also keeps `timing.mjs` header choice 3 true: its largest scaled bound is `CHILD_TEST_TIMEOUT_MS` = 240 000 ms. A larger base would have to amend that choice in the same edit.
- [ ] Update the doc comments on `WAIT_MS` and `SESSION_TIMEOUT_MS`, and add one sentence to the file header, saying that the bounds are scaled by `HARNESS_TEST_TIME_SCALE` (`helpers/timing.mjs`) and that `session()` waits for each pass under the shared driver's `TICK_TIMEOUT_MS`. Use the wording `watcher-stall-reset-payloads.test.mjs` uses for its `HUNG_WAIT_MS`.
- [ ] Leave every poll interval (`delay(100)`, the stubs' `sleep 0.1`) unscaled, as `timing.mjs`'s header requires. Change no assertion's expected value, and add no retry or skip.
