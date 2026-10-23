### Task 2 — Cover the heartbeat in `cli/test/run-test-suite.test.mjs`: an unsignalable live run, a run that died without a verdict, and the run form finding a live run

**Goal:** Prove, against the wrapper `init` writes into a throwaway fixture, that liveness is decided by the `.running` heartbeat and never by a signal. The file must keep every existing case passing. It adds the three cases the task prompt names: a live run whose liveness cannot be probed by signal, a run that died without a verdict, and the run form finding a live run of its label. It also adds the cases that keep the new signal honest at its edges.

**Depends on:** Task 1, which changes `cli/templates/scripts/run-test-suite.sh`. These are the contracts this file asserts:
- **Liveness.** A run is live exactly when `<label>.running` exists and its mtime is no older than `STALE_SECONDS`. The PID inside it is never signalled by a reader.
- **`RUN_TEST_SUITE_STALE`.** It overrides `STALE_SECONDS` (default 30) only when it matches `^[0-9]+$` and is `>= 3`; any other value, `1` and `2` included, leaves the default standing, because a live run's age reads up to 2 under whole-second mtimes. The heartbeat refreshes the mtime every second, `HEARTBEAT_SECONDS=1`, which has no override.
- **A stale heartbeat with no verdict.** Both forms treat it as no run in flight. The wait form refuses with exactly `run-test-suite.sh: no run in flight for <label>`, exit 2. The run form starts a fresh run.
- **A fresh heartbeat with no verdict.** The wait form prints `pending`, exit 3, after its slice (`RUN_TEST_SUITE_WAIT_SLICE`). The run form does the same and starts nothing.
- **Signals.** The run form runs each gate in its own foreground, as today, and sends no signal itself. What each signal stops:
  - a signal to the run form's **process group** (`SIGINT` as from Ctrl-C, `SIGTERM`, `SIGKILL`) reaches the gate too: the gate stops, then the trap removes `.running` (for `SIGKILL`, the heartbeat goes stale instead);
  - a trapped `SIGTERM`, `SIGINT` or `SIGHUP` to the run form's **PID alone** stops nothing at once: bash runs the trap only when the running gate returns, so the gate runs on, the heartbeat stays fresh and the label stays live until then. The run form then removes `.running` while the file holds its own PID, writes no further marker and no verdict, prints nothing, and exits `128 + <signal number>`;
  - a `SIGKILL` to the run form's PID alone orphans the gate, as today, and the heartbeat stops because the gate holds no copy of the heartbeat pipe. This case is not driven here.
- **Gate status.** Task 1's `run_gate` runs the gate's subshell in the foreground exactly as today (plus `3>&-`) and returns its exit status. A failing gate therefore still yields `fail <log path>`, exit 1.
- **Unchanged.** Every stdout line, exit status, marker line and path.

This task changes no wrapper code. A case that fails here is fixed in Task 1's file under Task 1's contract, never by loosening the assertion.

### Targets

- `cli/test/run-test-suite.test.mjs`: the module header; the `STUB`'s `pwd > ${PWD_RECORD}` line (one-for-one); one existing case, *"--wait for a label whose .running names a dead PID refuses: no run in flight"*; new helpers and cases.

**Work:**

- [x] **Keep lines 1–88 line-for-line, and amend the header within that budget.** `docs/work-report-research/test-fix-plan-writer.md` cites `cli/test/run-test-suite.test.mjs:83–85` for `GATE_MARKER`. So every edit above line 89 replaces a line with exactly one line. Add `utimesSync` to the existing `node:fs` import on its own line (line 25). Rewrite header lines in place so that the header states, in the same number of lines:
  - the rule: a run's liveness is the heartbeat, the mtime of `.running`, and never a signal to the PID it holds;
  - what a signal to the run form stops: a signal to its group stops the gate too, and a trapped signal to its PID alone leaves the label live until the gate returns;
  - the behaviours deliberately not covered, and why: the sandbox itself, which `docs/sandbox-verification.md` rows WF2–WF5 cover, and a `SIGKILL` to the run form's PID alone, whose orphaned gate is today's behaviour. Name the second `stat` spelling too: the wrapper reads the mtime through the library's `hr_lane_mtime`, and only one of its two spellings, BSD `stat -f %m` or GNU `stat -c %Y`, yields the value on a given host.

  Change the `STUB` array's `` `pwd > ${PWD_RECORD}` `` line, one-for-one, to `` `pwd > ${PWD_RECORD}; printf '%s\\n' "$$" > stub-pid.txt` ``, so the stub records the PID of the gate command itself.

  Put every new constant and helper below line 88:
  - `STALE_ENV = 'RUN_TEST_SUITE_STALE'`;
  - `plantRunning(dir, { pid, ageSeconds })`, which writes `<LOG_DIR>/task_round_1.running` holding `${pid}\n`, then sets its mtime to `ageSeconds` in the past with `utimesSync`;
  - a `pidOf(dir)` reader of that file;
  - `STUB_PID_RECORD = 'stub-pid.txt'`, with a comment naming the `STUB` line that writes the same literal, and a `stubPidOf(dir)` reader of it;
  - `isAlive(pid)`, which returns whether `process.kill(pid, 0)` succeeds and returns `false` when it throws `ESRCH`, rethrowing anything else. The test process is unsandboxed, so it may signal.
- [x] **Replace the dead-PID case. Its premise, that the PID decides liveness, is what this branch removes.** In the `for … of` table that holds it, change the second row to *"--wait for a label whose .running heartbeat is stale refuses: no run in flight"*. That row plants `plantRunning(dir, { pid: deadPid(), ageSeconds: 120 })`, older than the default 30. The table body and its assertions stay as they are: exit 2, empty stdout, the exact refusal line, and the tree snapshot unchanged.
  - Add the **unsignalable live run** case next to it. Plant `plantRunning(dir, { pid: deadPid(), ageSeconds: 0 })`, a fresh heartbeat with a PID that signal 0 would call dead, then issue `--wait` with `RUN_TEST_SUITE_WAIT_SLICE: '1'`. Assert stdout `pending\n`, exit 3 and empty stderr, and that the tree snapshot is unchanged (the wait form writes nothing). Under the old `kill -0` check this case refuses, so it tells the two designs apart.
- [x] **The run form against a planted heartbeat.** Two cases, each starting from a planted `task_round_1.log` holding a sentinel line.
  - **Live:** with a fresh heartbeat and a dead PID, the run form issued with `RUN_TEST_SUITE_WAIT_SLICE: '1'` prints `pending\n` and exits 3. `counterLines(dir)` stays `[]`, the log still holds exactly the sentinel, and `.running` still holds the planted PID.
  - **Stale:** with a heartbeat 120 s old, the run form prints `pass\n` and exits 0. The counter reads `['ran']`, the log no longer holds the sentinel because the re-run truncated it, and `.running` is gone.
- [x] **A real run that dies without a verdict, and a real run that outlives the stale window.**
  - **Killed.** Start the run form through `runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal })`, where `signal` comes from an `AbortController`. Poll until `.running` exists, the counter reads `['ran']` and `stub-pid.txt` exists, then `abort()`. That kills the whole group with `SIGKILL`, which no trap sees, and the promise rejects with `runBash aborted:`, so assert that rejection. Poll until `isAlive(stubPidOf(dir))` is `false`: the group signal reached the gate. Then issue one `--wait` with `RUN_TEST_SUITE_STALE: '3'`, the smallest accepted window, and `RUN_TEST_SUITE_WAIT_SLICE: '30'`. Assert exit 2, empty stdout, the exact refusal line, no `.verdict`, and that `.running` is still present: the refusal came from staleness, not from a missing file. Write the release file afterwards, so nothing can survive the test.
  - **Outlives the window.** Start a run held on `STUB_RELEASE`. Once it is in flight, wait about 10 s, twice a window of `RUN_TEST_SUITE_STALE: '5'`, so one scheduling stall of a second or two under a parallel `node --test` run cannot make a healthy run read dead. Do it with `await new Promise((r) => setTimeout(r, 10000))` in the test process, never with a `sleep` in a command. Then issue `--wait` with `RUN_TEST_SUITE_STALE: '5'` and `RUN_TEST_SUITE_WAIT_SLICE: '1'` and assert `pending\n`, exit 3: the heartbeat was refreshed. Release the run, poll `--wait` to `pass\n`, and assert the counter reads `['ran']`.
- [x] **Signals to the run form: one to its PID alone, one to its group.** Each case starts a run held on `STUB_RELEASE` and polls until `.running` exists, the counter reads `['ran']` and `stub-pid.txt` exists.
  - **`SIGTERM` to the PID alone.** Start the run form through `wrapper(…)`. Send `process.kill(pidOf(dir), 'SIGTERM')` from the unsandboxed test process. Before writing the release file, assert that the label is still live: `.running` still exists, `isAlive(stubPidOf(dir))` is `true`, and one `--wait` with `RUN_TEST_SUITE_WAIT_SLICE: '1'` prints `pending\n`, exit 3. Then write the release file and await the run-form promise. Assert: status 143 and empty stdout; `.running` gone; no `.verdict`; `isAlive(stubPidOf(dir))` is `false`; the log holds no `GATE_MARKER.testExited(…)` line; and one `--wait` without `RUN_TEST_SUITE_STALE` refuses at once with the exact refusal line, exit 2.
  - **`SIGINT` to the group.** Start the run form through `runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal })`, so `bash` leads its own process group and `pidOf(dir)` is that group's id. Send `process.kill(-pidOf(dir), 'SIGINT')`, the shape of a terminal Ctrl-C. **Without** writing the release file, poll until `.running` is gone, and assert `isAlive(stubPidOf(dir))` is `false` **at that point**: the interrupt stopped the gate command itself, before any release. Then assert: the run-form promise resolves with status 130 and empty stdout; no `.verdict`; and one `--wait` without `RUN_TEST_SUITE_STALE` refuses at once with the exact refusal line, exit 2.

  Write the release file at the end of each case, so nothing can survive the test.

**Verification:**

- `npm test --workspace cli -- test/run-test-suite.test.mjs`, from the repository root, as one plain foreground command. This is the one test file this task edits. It exits 0, and its `# fail` count is `0`.
- Every case that existed before this task still exists, with its assertions unchanged, apart from the one replaced row named above. `git diff -- cli/test/run-test-suite.test.mjs` shows no removed `assert` line outside that row.
- `git diff -U0 -- cli/test/run-test-suite.test.mjs` shows every hunk above line 89 replacing lines one-for-one, so lines 83–85 still carry `GATE_MARKER`'s first entries.
- The existing failing-gate cases pass unchanged under Task 1's new `run_gate`, and this run is what ties the two together: *"a non-zero command prints exactly `fail <log path>` and exits 1"*, the three-row typecheck/test table (*"typecheck fails, test passes"*, *"typecheck passes, test fails"*, *"both gates fail"*), *"with the test failing, the round fails: `<none>` masks nothing"*, and *"--wait after a run that failed on typecheck alone reprints its `fail` …"*. Each still asserts exactly `fail <log path>` and exit 1. A pass printed for any of them means `run_gate` is not returning its subshell's status, and is fixed in Task 1's file.
- The unsignalable-live-run case carries a one-line comment saying why it tells the two designs apart: its planted PID is dead, so the old `kill -0` body would refuse it.
- No existing case's assertion changes because of `stub-pid.txt`: it lands beside `stub-pwd.txt` in the fixture root, and the tree-snapshot cases are refusals in which the stub never runs.
- No fixture is created inside this checkout. Every case goes through `wiredFixture`, under the system temp directory.

**Deviations from plan:**
- Beyond the helpers the plan lists, added `RUNNING`, `VERDICT`, `LOG` and `REFUSAL` path/line constants and an `untilInFlight(dir)` poll helper (`.running`, one counter line, `stub-pid.txt`) shared by the four in-flight cases, all below line 88.
- The header's 21 lines now carry the heartbeat rule, the signal behaviour and the not-covered list; the "nothing else" prose was compressed to fit the one-for-one budget. `git diff -U0` shows only one-for-one hunks above line 89 (`@@ -8 +8`, `-10,5 +10,5`, `-16,5 +16,5`, `-25 +25`, `-56 +56`).
- The "no `GATE_MARKER.testExited(…)` line" assertion matches on the marker's prefix, derived as `GATE_MARKER.testExited('#').split('#')[0]`, so it covers any status.
- Verification run: `npm test --workspace cli -- test/run-test-suite.test.mjs` from the repository root: `# tests 30`, `# pass 30`, `# fail 0`. `bash scripts/typecheck.sh`: `PASS: typecheck`. No mutation of the wrapper was run to show the unsignalable-live-run case fails under `kill -0`; that claim rests on reading the Task 1 diff of `run_alive`.
