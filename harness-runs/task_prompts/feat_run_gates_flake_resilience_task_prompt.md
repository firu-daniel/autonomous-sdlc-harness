`feat_run_gates_flake_resilience` adds one test-time multiplier, `HARNESS_TEST_TIME_SCALE`, so this repository's timing-bound test cases tolerate a slow or loaded host. Today their time limits are fixed constants sized for a fast, idle machine. On 2026-10-26 a full gate run failed 52 such cases with a second suite running alongside it, and 8 with no other suite running. Every one of those cases passed when its file ran alone.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The anchors were true at `c7d4cec4` (`origin/dev`). Re-verify each one before planning on it.

## How the limits behave

Every limit in scope is a **ceiling**, not a fixed wait. A polled wait (`waitFor` in the watcher suites) checks every 100 ms and returns as soon as its condition holds; `cli/test/helpers/fixture.mjs` → `runBounded` kills a process only if it is still running when its timer fires. So a larger limit costs a passing run nothing. It only lengthens how long a broken case waits before it fails.

## The goal

1. **One multiplier, read once, in one place.** A helper under `cli/test/helpers/` reads `HARNESS_TEST_TIME_SCALE` once at module load and exports the scaling function every bound goes through. It is a constant for the whole run, never derived from the host's load: a load reading is a snapshot and can change right after it is taken.
   - **Validation:** a positive number; anything else fails loudly at load with the value quoted. Cap it so the largest scaled bound stays below the suite's `--test-timeout` (`cli/package.json` → `scripts.test`), and state the cap.
   - **Default:** choose one above 1 and justify it from the figures above, or argue for 1. With the variable set to `1`, every bound is exactly today's value.
2. **Scale the "until X happens" ceilings.** At least `cli/test/helpers/watcher.mjs` → `TICK_TIMEOUT_MS`; `RUN_TIMEOUT_MS` and `HUNG_WAIT_MS` in `watcher-stall-reset-payloads.test.mjs`; `RUN_TIMEOUT_MS` in `watcher-remote-park-sequence.test.mjs`; `WATCHER_RUN_TIMEOUT_MS` in `watcher-remote-job.test.mjs`; every polled-wait budget; and every `timeoutMs` a case passes to `runBash` / `runBounded`. Find the rest by searching `cli/test/`.
3. **Leave alone what is not a ceiling:**
   - a window a case waits out on purpose to assert that something does **not** happen (scaling it makes every passing run slower);
   - a duration that is the behaviour under test, such as a stall or heartbeat bound passed to the watcher or a simulated host-sleep gap.
   List every bound you leave fixed and say why.
4. **Document it** where this repository documents running its tests, with one line on when to raise it (a slow machine, a small CI runner).

## Constraints

- No assertion changes, no retries, no skips: only the time allowed changes.
- No change to `scripts/run-gates.sh`, `run-test-suite.sh`, Phase G or any plugin document.
- `fix_headless_run_host_sleep` (not merged) adds `watcher-keep-awake.test.mjs` and `watcher-stall-host-sleep.test.mjs`, whose `session()` helper is being moved onto `TICK_TIMEOUT_MS` there. Cover the suites on this branch; the helper is the one place those suites adopt after a rebase.
- **Tests:** the helper's parsing and validation (unset, `1`, a valid value, junk, over the cap), and one bound shown to scale.
- `scripts/run-gates.sh` passes.

## Out of scope

Capping test concurrency, keeping failure reasons in the gate log, re-running failing files before a test fix plan, and serialising gate runs across runs. None of them is planned.
