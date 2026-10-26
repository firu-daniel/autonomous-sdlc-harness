/**
 * The suite's one timing multiplier.
 *
 * **The rule this module exists to enforce: every "until X happens" ceiling in `cli/test/` goes
 * through {@link scaleBound}, and nothing else does.** A ceiling is a bound a case waits *up to* for
 * something to happen — a process to exit, a file to appear, a poll to see a state. It returns early
 * on success, so scaling it costs a passing run nothing; only a genuinely broken case waits longer to
 * fail. The multiplier is {@link TIME_SCALE}, set by the variable {@link TIME_SCALE_VARIABLE} names;
 * `1` keeps every bound at its written value.
 *
 * `node --test test` treats every file beneath a directory named `test` as a test file, so this one
 * is loaded as a test file of its own (as `fixture.mjs`'s header records). Reading the variable is
 * the only thing it does at import time, so a bad value fails that load by name.
 *
 * A suite outside this branch adopts the multiplier by importing {@link scaleBound}, or the
 * already-scaled `watcher.mjs` → `TICK_TIMEOUT_MS`.
 *
 * ## Four non-obvious choices
 *
 * 1. **Constant, never measured.** The scale is fixed for the whole run and never derived from host
 *    load: a load reading is a snapshot that can change right after it is taken.
 * 2. **The default is {@link DEFAULT_TIME_SCALE}, `2` — a judgement, not a measurement.** Every
 *    failing case passed alone, a full run alone failed 8 cases and the same run beside a second
 *    suite failed 52, so failures grow with host load, and the load those figures name is two
 *    suites' worth of work. Twice the old budget covers that doubled load.
 * 3. **The cap is {@link MAX_TIME_SCALE}, `5`.** The largest scaled bound is
 *    `test-timeout.test.mjs` → `CHILD_TEST_TIMEOUT_MS`, 240 000 ms; at 5 it is 1 200 000 ms, below
 *    `--test-timeout=1800000` (`cli/package.json` → `scripts.test`), so a bound still fires before
 *    the runner kills the file (`fixture.mjs`, choice 6).
 * 4. **These bounds stay fixed**, because scaling any of them changes what its case proves:
 *    - `test-timeout.test.mjs` → `CHILD_BOUND_MS`: the bound under test; the case proves it fires.
 *    - `test-timeout.test.mjs` → `REAP_GRACE_MS`: a fixed wait before the process-table read that
 *      asserts no survivor.
 *    - `init.test.mjs` → `RETURNS_PROMPTLY_MS`: a discriminating bound. Above
 *      `DEV_SERVER_STUB_SECONDS` (5 s) a wrapper that waited for the server would pass, so a scale
 *      of about 1.67 or more would stop the case from failing.
 *    - `init.test.mjs` → `PID_GONE_ATTEMPTS`: the post-signal pid poll, discriminating against the
 *      same 5 s stub lifetime; scaled, a pid that ignored the signal would die by itself inside it.
 *    - `outer-loop-scripts.test.mjs`, the sweep case's `ceiling = 3` (`HARNESS_FETCH_TIMEOUT`) and
 *      `HANGING_GIT`'s `sleep 300`: the bound under test and the simulated hang.
 *    - `run-test-suite.test.mjs` → `sleep(10000)`, `sleep(5000)` and `sleep(1000)`: windows waited
 *      out on purpose — stale heartbeat, session kill and interrupt.
 *    - `watcher-remote-job.test.mjs`, every `HONOUR_PAUSE(30)` site: a no-pause window waited out in
 *      full.
 *    - The `delay(500)` after a kill in `watcher-remote-job.test.mjs` and
 *      `watcher-remote-park-sequence.test.mjs`: a settle window asserting the status stays `running`.
 *    - Stub lifetimes: `sleep 30` in the killed-job stubs, `HUNG_BODY`'s `sleep 60`, and the agent
 *      stub's `sleep 0.3` (`watcher.mjs`, choice 1).
 *    - Reset leads: `REPEAT_RESET_AHEAD_SECS` (15), `runOnce`'s 2-second lead and
 *      `rateLimitRejected(100)`, plus the `HARNESS_JOB_DEADLINE_EPOCH` offsets.
 *    - Every `*_SECS` tunable passed to a watcher or wrapper — `STALL_WARN_SECS` /
 *      `STALL_KILL_SECS`, `POLL_INTERVAL_SECS`, `PUSH_RETRY_DELAY_SECS` and the like: the behaviour
 *      under test.
 *    - Every poll interval — `delay(100)`, `sleep(50)`, the 20 ms waits, the stubs' `sleep 0.1`: a
 *      poll's cadence is not its ceiling, and its attempt count is what scales.
 *    - Epoch arithmetic (`nowSecs() ± n`, `Date.now() + 60_000`): timestamps under test.
 */

/** The environment variable that sets {@link TIME_SCALE}. */
export const TIME_SCALE_VARIABLE = 'HARNESS_TEST_TIME_SCALE';

/** {@link TIME_SCALE} when the variable is unset (choice 2). */
export const DEFAULT_TIME_SCALE = 2;

/** The largest accepted {@link TIME_SCALE}, inclusive (choice 3). */
export const MAX_TIME_SCALE = 5;

/**
 * Unset: {@link DEFAULT_TIME_SCALE}. A plain decimal above 0 and at most {@link MAX_TIME_SCALE}:
 * that number. Anything else: refused by name.
 *
 * @param {string | undefined} value the variable's raw value.
 * @returns {number}
 */
export function parseTimeScale(value) {
  if (value === undefined) return DEFAULT_TIME_SCALE;
  if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
    const scale = Number(value);
    if (scale > 0 && scale <= MAX_TIME_SCALE) return scale;
  }
  throw new Error(
    `${TIME_SCALE_VARIABLE} is set to \`${value}\`; it takes a number above 0 and at most ${MAX_TIME_SCALE}, and \`1\` keeps every bound at its written value.`,
  );
}

/** The multiplier every ceiling is scaled by, read once at load. */
export const TIME_SCALE = parseTimeScale(process.env[TIME_SCALE_VARIABLE]);

/**
 * A ceiling scaled by {@link TIME_SCALE}, rounded up. Unit-agnostic — ms, attempts, tenths — and
 * always a positive integer, which `fixture.mjs` → `runBash` requires of its `timeoutMs`.
 *
 * @param {number} base the ceiling at its written value; a positive integer.
 * @returns {number}
 */
export function scaleBound(base) {
  if (!(Number.isInteger(base) && base > 0)) {
    throw new Error(`scaleBound: base must be a positive integer, got ${String(base)}`);
  }
  return Math.ceil(base * TIME_SCALE);
}
