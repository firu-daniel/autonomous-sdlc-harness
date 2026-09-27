### Task 2 — Drive `run-test-suite.sh` in a new `cli/test/run-test-suite.test.mjs`

**Goal:** Prove the wrapper's contract by running it. This suite is the `cli/test/` evidence for the story's acceptance criterion 2 and for the "exactly once" half of criterion 1. Task 23 cites it by file name and case titles.

**Depends on:** Task 1. That task ships `cli/templates/scripts/run-test-suite.sh` and its `OUTER_LOOP_SCRIPTS` row, `{ file: 'run-test-suite.sh', mode: 0o755, agentInvocable: true }`. Its contract, restated here so this suite asserts it literally:
- **Invocation:** `bash <scriptsDir>/run-test-suite.sh <label>`, with `<label>` matching `^[A-Za-z0-9][A-Za-z0-9._-]*$`.
- **Command:** the configured `commands.test` string, `eval`'d from the repository root with stdin `/dev/null`.
- **Log:** stdout and stderr go to `<stateDir>/test_run_logs/<sanitized branch>/<label>.log`, truncated at start.
- **Output:** stdout is exactly `pass\n` (exit 0) or `fail <repo-relative log path>\n` (exit 1).
- **Verdict and in-flight files:** beside the log, `<label>.running` holds the wrapper's PID while the command runs and is removed afterwards; `<label>.verdict` holds the same line the wrapper prints, written by rename once the command exits, and any stale copy is removed at start.
- **Wait form:** `bash <scriptsDir>/run-test-suite.sh --wait <label>` never runs the command and writes nothing. With a verdict file it prints that line (exit 0 for `pass`, 1 for `fail <log>`). With a live run and no verdict it polls for at most one wait slice — `WAIT_SLICE_SECONDS`, overridden by the environment variable `RUN_TEST_SUITE_WAIT_SLICE` — then prints exactly `pending\n` and exits 3. With neither file, or a dead PID and no verdict, it refuses: `run-test-suite.sh: no run in flight for <label>`.
- **Refusals:** exit 2, with one `run-test-suite.sh: <reason>` stderr line, empty stdout and no log, verdict or in-flight file, for:
  - an argument list that is neither `<label>` nor `--wait <label>`;
  - no run in flight, in the wait form;
  - a bad label;
  - an unresolvable configuration;
  - an unset `commands.test`;
  - no current branch.

### Targets

- `cli/test/run-test-suite.test.mjs` (new).

**Work:**

- [ ] **Header and fixture.**
  - The file opens with the rule it enforces, before any case. The wrapper hands the orchestrator one line and nothing else, runs the configured command exactly once per invocation, and versions its log per round.
  - The header also names what it does not cover: the Run gates phase's own sequencing, which is instruction prose that Task 23's walk covers.
  - Build every fixture with `createFixture` under the system temp directory, then run `init` through `runCli`.
  - Seed `harness.config.json` → `commands.test` with a stub that appends one line to a counter file and prints a marker string to both stdout and stderr, before exiting with a chosen status.
  - No fixture is created inside this checkout, and no case is aimed at it.
- [ ] **Pass and fail cases.**
  - A zero-exit stub gives stdout exactly `pass\n` and exit 0.
  - A non-zero stub gives stdout exactly `fail <stateDir>/test_run_logs/<branch>/<label>.log\n` and exit 1.
  - In both cases, the log holds the stub's stdout and stderr markers, neither marker appears in the wrapper's stdout or stderr, and the counter file holds exactly one line.
- [ ] **Log versioning, the verdict file and the wait form.**
  - Running `task_round_1` then `task_round_2` leaves two log files, and round 1's log is byte-identical after round 2 ran.
  - Re-running `task_round_1` with a different stub output replaces that one file's content.
  - After a finished run, `<label>.verdict` holds exactly the line the wrapper printed, no `<label>.running` remains, and `--wait <label>` prints that same line with the matching exit (0 for `pass`, 1 for `fail <log>`) and leaves the counter file at one line — the wait form never re-runs the command.
  - **Pending, then verdict.** Start the wrapper asynchronously with a stub that blocks until a release file exists. With `RUN_TEST_SUITE_WAIT_SLICE=1`, `--wait <label>` prints exactly `pending\n` and exits 3 while `<label>.running` exists. Create the release file, then re-issue `--wait <label>` until it stops printing `pending`; it prints `pass\n` (or `fail <log>\n` for a failing stub) and the counter file holds one line. This is the re-issue loop Task 9's G.1 prescribes.
  - `--wait` for a label never run, and for a label whose `.running` names a dead PID with no verdict, each refuse with exit 2, `^run-test-suite\.sh: no run in flight for `, empty stdout, and no file created.
- [ ] **Refusals.** For no argument, two arguments that are not `--wait <label>`, `--wait` alone, a label containing `/`, and a label starting with `.`: exit 2, one `^run-test-suite\.sh: ` stderr line, empty stdout, and no new file under `test_run_logs`. Add a detached-`HEAD` case with the same assertions.
- [ ] **Run from anywhere.** Invoked from a subdirectory of the fixture, the script still runs the stub from the repository root; the stub records `pwd` and the case asserts it.

**Verification:**

- `bash scripts/typecheck.sh` passes.
- `cli/test/run-test-suite.test.mjs`, which this unit creates, is run on its own where a single-file test command is stated in the conventions documents. Where none is stated, the run is skipped and recorded, per `plugin/instructions/unit_loop_core.md` → `## The test-run rule` once Task 5 lands.
- Every assertion names a literal, such as `pass\n`, the log path shape or the exit code, rather than a value read back out of the script under test (`.claude/context/conventions.md` → `## The testing bar`).
