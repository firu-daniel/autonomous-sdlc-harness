### 1. run-test-suite: a non-zero command collects exactly `fail <log path>` with exit 1 (new this round)

**Site:** `cli/test/run-test-suite.test.mjs`. The case is the second row of the table-driven `for (const [name, stubExit, expectedStdout, expectedStatus] of [` loop near the top of the file's tests (around line 317). Its row starts ``'a non-zero command collects exactly `fail <log path>` with exit 1',`` and runs with `stubExit` `'3'`. The code it exercises is the wrapper template `cli/templates/scripts/run-test-suite.sh`. `init` writes that template into the fixture as `scripts/run-test-suite.sh`. The relevant parts are the run form's start-up poll (`start_deadline=$((SECONDS + STALE_SECONDS))`), `wait_for_verdict`, and the worker's verdict lines (`verdict="fail $log_file"`).

**Failing test:** `cli/test/run-test-suite.test.mjs` — ``a non-zero command collects exactly `fail <log path>` with exit 1``

**Failure, from the log (gate `4 npm test`):**

> `FAIL  4 npm test (exit 1)`
> ``not ok 996 - a non-zero command collects exactly `fail <log path>` with exit 1``
> `# tests 2328` / `# pass 2323` / `# fail 1` / `# skipped 4`
> `npm error path cli`
> `npm error command sh -c node --test --test-timeout=1800000`

The log has no assertion message, `actual`/`expected` pair or stack for this test. `run-gates.sh` keeps only the `not ok` line.

**Diagnosis.**

- **New this round.** This test is absent from round 1's and round 2's failure lists, and round 2 ran the same 2328 tests. So it passed in round 2.
- **Its code did not change between rounds.** Since round 2's run, the branch's only code change is `ea4a69a1`, which edits `cli/test/helpers/watcher.mjs` and `cli/test/watcher-run-analytics.test.mjs`. `cli/test/run-test-suite.test.mjs` imports neither file. It imports only `./helpers/fixture.mjs` and `./helpers/timing.mjs`. Neither the test file nor `cli/templates/scripts/run-test-suite.sh` nor `cli/templates/scripts/lib/harness-run-lib.sh` changed.
- **Its deterministic path passes elsewhere in the same run.** Other tests in this file that passed in round 3 use the same `wiredFixture` → `runAndCollect` path and the same `fail ${LOG_DIR}/task_round_1.log\n` verdict line:
  - ``a finished `fail` run leaves its verdict, …`` (stub exit `1`)
  - ``two gates — typecheck passes, test fails: `fail` ``
  - the zero-exit sibling row of this same loop
- **Exit status 3 is not the cause.** The only input unique to this case is the stub's exit status `3`. In the wrapper, `run_gate` returns the gate's status and the worker folds every non-zero `test_status` into `status=1` / `verdict="fail $log_file"`. A gate status of `3` gets no special handling, even though `3` is also the wrapper's own `pending` exit code. The test also reads the wrapper's status only through `--wait`, which takes it from `emit_verdict`, never from the gate.
- **The likely cause is a timing bound under full-suite load.** The current tree gives no deterministic route to this failure, so the most likely cause is a time-bounded step in the case. The suite took about 38 minutes (`# duration_ms 2275710`). There are two candidate bounds:
  - **Start-up window.** `startRun` asserts `pending` from the run form. The run form refuses with `run-test-suite.sh: the detached run of task_round_1 did not start` (exit 2, empty stdout) if the detached worker has neither claimed `.running` nor written `.verdict` within `STALE_SECONDS` (30 s, unscaled). Before the worker's `printf '%s\n' "$$" > "$running_file"`, it re-sources the library and resolves both `commands.*` values.
  - **`collect`'s poll budget.** `POLL_LIMIT = scaleBound(600)`, and each poll is a `--wait` with a 1 s slice. This budget is far larger than the start-up window, so it is the less likely of the two.

  This is an inference: the log does not say which assertion failed.

**Fix.**

- [ ] If the named subtest passes on the current tree, the cause was outside the code. In that case this finding closes under `unit_loop_core.md` → `#### The already-passing close`, and the bullets below do not apply.
- [ ] If it fails, the assertion message names the site. Fix that site as follows:
  - **`startRun`'s `pending` assertion fails, with stderr `run-test-suite.sh: the detached run of task_round_1 did not start`.** The start-up window is too short under load. Do not shorten the window and do not loosen the `pending` assertion. Instead, make the window carry the same load headroom the suite's other bounds get:
    - In `cli/test/run-test-suite.test.mjs`, have `startRun` pass `RUN_TEST_SUITE_STALE` set to `scaleBound(30)` (from `./helpers/timing.mjs`) when the caller's `env` does not set it.
    - Update the `startRun` doc comment, which currently reads "No caller puts {@link STALE_ENV} in `env` …". Restate it so it says the start-up window is only ever lengthened by the scale factor, never shortened.
    - Leave the cases that deliberately pass a shortened `STALE_ENV` unchanged. Those are the "worker that never starts", stale-heartbeat and kill/SIGTERM cases.
  - **`result.stdout` is `pending\n` after `collect`, or `collect` reports `never observed: --wait task_round_1 to stop printing \`pending\``.** The worker did not finish within the poll budget. Look in the fixture's log for whether the `gate test exited 3` marker was written. If it was, the defect is in the wrapper's verdict write: fix `cli/templates/scripts/run-test-suite.sh` so that `.verdict` is renamed into place before `.running` is removed for every non-zero gate status. If it was not written, apply the same scaled-bound treatment to `collect`.
  - **Any other assertion fails** (the verdict text, the exit status, stderr, the log markers, or the run counter). The cause is deterministic and lies in the wrapper. Fix it in `cli/templates/scripts/run-test-suite.sh` and keep the test's assertions as they are.
- [ ] Do not delete, skip or weaken this test or any of its assertions.
