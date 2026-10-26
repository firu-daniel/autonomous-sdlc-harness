### Task 1 — Add the `HARNESS_TEST_TIME_SCALE` helper `cli/test/helpers/timing.mjs`, scale and export `TICK_TIMEOUT_MS`, and test the helper

**Goal:** Give the test suite one multiplier. It is read once, in one place, and every timing ceiling goes through it. This task also moves the shared watcher bound `TICK_TIMEOUT_MS` onto that multiplier and exports it, then proves the parsing, the validation and one real bound scaling.

**Where this task stops.** This task owns the helper and `cli/test/helpers/watcher.mjs` only. The four watcher suites' own ceilings belong to **Task 2**. Those in `init.test.mjs`, `run-test-suite.test.mjs`, `outer-loop-scripts.test.mjs`, `docs-retrieval.test.mjs` and `test-timeout.test.mjs` belong to **Task 3**. Documenting the variable belongs to **Task 4**. This task does not edit any of those files. The helper's header still carries the list of bounds this branch leaves fixed (below), because that list belongs beside the rule it applies.

### Targets

- `cli/test/helpers/timing.mjs` (new): the multiplier and the scaling function.
- `cli/test/helpers/watcher.mjs`: `TICK_TIMEOUT_MS` scaled and exported, with its header's choice 4 updated.
- `cli/test/test-time-scale.test.mjs` (new): the helper's tests.

**Work:**

- [ ] **`timing.mjs` — the module.** Model it on `cli/test/helpers/concurrency.mjs`. It does nothing at import time except read the variable, and it states that `node --test test` loads it as a test file of its own. It exports the following:
  - `TIME_SCALE_VARIABLE = 'HARNESS_TEST_TIME_SCALE'`. Every message names the variable through this constant (`.claude/context/conventions.md`: an environment-variable name is a constant with an owner).
  - `DEFAULT_TIME_SCALE = 2` and `MAX_TIME_SCALE = 5`.
  - `parseTimeScale(value)`, a pure function. `undefined` returns `DEFAULT_TIME_SCALE`. A string matching `^[0-9]+(\.[0-9]+)?$` whose number is `> 0` and `<= MAX_TIME_SCALE` returns that number. Anything else throws an `Error` that quotes the value and states the accepted range: the empty string, `0`, `-1`, `2x`, `Infinity`, `1e3`, and anything over the cap such as `5.5`. Example message: *`HARNESS_TEST_TIME_SCALE is set to \`abc\`; it takes a number above 0 and at most 5, and \`1\` keeps every bound at its written value.`*
  - `TIME_SCALE = parseTimeScale(process.env[TIME_SCALE_VARIABLE])`, read once at load.
  - `scaleBound(base)`. It throws if `base` is not a positive integer, so a misuse fails by name. Otherwise it returns `Math.ceil(base * TIME_SCALE)`. It is unit-agnostic (ms, attempts, tenths) and always returns a positive integer, which `fixture.mjs` → `runBash` requires.
- [ ] **`timing.mjs` — the header.** Open with *"The rule this module exists to enforce"*. The rule: every "until X happens" ceiling in `cli/test/` goes through `scaleBound`, and nothing else does. The header carries:
  - **Constant, never measured.** The scale is constant for the whole run and never derived from host load, because a load reading is a snapshot that can change right after it is taken.
  - **Why a ceiling costs nothing.** A ceiling returns early on success, so it costs a passing run nothing.
  - **The default argument.** Repeat it from the story index `## Context`, **Default `2`**, and say that it is a judgement, not a measurement.
  - **The cap argument.** The largest scaled bound is `test-timeout.test.mjs` → `CHILD_TEST_TIMEOUT_MS`, 240 000 ms. At 5 it becomes 1 200 000 ms, which stays below `--test-timeout=1800000` (`cli/package.json` → `scripts.test`), so a bound still fires before the runner kills the file (`fixture.mjs` → choice 6).
  - **Adopting it after a rebase.** A suite outside this branch adopts the multiplier by importing `scaleBound`, or `watcher.mjs` → `TICK_TIMEOUT_MS`.
  - **The bounds left fixed, and why.** Reproduce this list verbatim in substance:
    - `test-timeout.test.mjs` → `CHILD_BOUND_MS`: the bound under test. The case proves that it fires.
    - `test-timeout.test.mjs` → `REAP_GRACE_MS`: a fixed wait before the process-table read that asserts no survivor.
    - `init.test.mjs` → `RETURNS_PROMPTLY_MS`: a discriminating bound. Above `DEV_SERVER_STUB_SECONDS` (5 s), a wrapper that waited for the server would pass, so scaling it by about 1.67 or more would stop the case from failing.
    - `outer-loop-scripts.test.mjs`, the sweep case's `ceiling = 3` (`HARNESS_FETCH_TIMEOUT`) and `HANGING_GIT`'s `sleep 300`: the bound under test and the simulated hang.
    - `run-test-suite.test.mjs` → `sleep(10000)`, `sleep(5000)` and `sleep(1000)`: windows waited out on purpose, covering stale heartbeat, session kill and interrupt.
    - `watcher-remote-job.test.mjs`, every `HONOUR_PAUSE(30)` site: a no-pause window waited out in full.
    - The `delay(500)` after a kill in `watcher-remote-job.test.mjs` and `watcher-remote-park-sequence.test.mjs`: a settle window that asserts the status stays `running`.
    - Stub lifetimes: `sleep 30` in the killed-job stubs, `HUNG_BODY`'s `sleep 60`, and the agent stub's `sleep 0.3` (`watcher.mjs` choice 1).
    - Reset leads: `REPEAT_RESET_AHEAD_SECS` (15), `runOnce`'s 2-second lead and `rateLimitRejected(100)`, plus the `HARNESS_JOB_DEADLINE_EPOCH` offsets.
    - Every `*_SECS` tunable passed to a watcher or wrapper, such as `STALL_WARN_SECS` / `STALL_KILL_SECS`, `POLL_INTERVAL_SECS` and `PUSH_RETRY_DELAY_SECS`: the behaviour under test.
    - Every poll interval, such as `delay(100)`, `sleep(50)`, the 20 ms waits and the stubs' `sleep 0.1`: a poll's cadence is not its ceiling, and the attempt count is what scales.
    - Epoch arithmetic (`nowSecs() ± n`, `Date.now() + 60_000`): timestamps under test.
- [ ] **`watcher.mjs`.** Import `scaleBound` from `./timing.mjs`. Change `const TICK_TIMEOUT_MS = 60_000;` to `export const TICK_TIMEOUT_MS = scaleBound(60_000);`. Amend header choice 4 so it says the bound and any `timeoutMs` a case passes are scaled by `HARNESS_TEST_TIME_SCALE` (`./timing.mjs`), and that they stay below the suite's `--test-timeout` at the cap. Leave `tick`'s signature and behaviour unchanged: callers that pass `timeoutMs` scale it themselves (Task 2).
- [ ] **`test-time-scale.test.mjs`.** Open with the rule the file enforces. Cover two groups of cases.
  - **(a) Pure cases on `parseTimeScale`, imported directly:**
    - `undefined` returns `DEFAULT_TIME_SCALE`;
    - `'1'` returns `1`;
    - `'2.5'` returns `2.5`;
    - `'5'` returns `5`, the cap, inclusive;
    - each of `'abc'`, `''`, `'0'`, `'-1'`, `'2x'`, `'1e3'` and `'Infinity'` throws a message containing `HARNESS_TEST_TIME_SCALE` and the quoted value;
    - `'5.5'` throws a message naming the cap `5`.
  - **(b) Load-time cases in a child process.** Run `process.execPath` with `--input-type=module -e <source>`. The source imports `helpers/timing.mjs` and `helpers/watcher.mjs` by `file://` URL and prints `JSON.stringify({ scale: TIME_SCALE, tick: TICK_TIMEOUT_MS })`. Build the child's environment from `process.env` with `HARNESS_TEST_TIME_SCALE` and `NODE_TEST_CONTEXT` deleted, then add the case's own value, so that a parent run that exports the variable cannot decide the result. Cases:
    - unset gives `scale === DEFAULT_TIME_SCALE` and `tick === 60_000 * DEFAULT_TIME_SCALE`;
    - `'1'` gives `tick === 60_000` exactly, so `1` keeps today's value;
    - `'3'` gives `tick === 180_000`, the one bound shown to scale;
    - `'abc'` makes the child exit non-zero with stderr containing `HARNESS_TEST_TIME_SCALE` and `abc`;
    - `'6'` makes the child exit non-zero with stderr naming the cap.
  - **No timing run.** No case measures wall time. Per `harness-runs/lessons.md`, in-run timing is never acceptance evidence.

**Verification:**

- `npm test --workspace cli -- test/test-time-scale.test.mjs`, run from the repository root as one plain foreground command, passes. That is the only test file this task runs.
- `bash scripts/typecheck.sh` exits 0.
- `grep -n "TICK_TIMEOUT_MS" cli/test/helpers/watcher.mjs` shows the one `export const TICK_TIMEOUT_MS = scaleBound(60_000)` declaration, the default parameter of `tick`, and the header references. No literal `60_000` is left elsewhere in the file.
- `grep -rnE "process\.env.*(TIME_SCALE|HARNESS_TEST_TIME_SCALE)" cli/test` hits only `helpers/timing.mjs`, the single read, and the lines in `test-time-scale.test.mjs` that build a child's environment. No other file under `cli/test` reads the variable.
