### 2. The worker's heartbeat stalls while the worker and its gate are alive, so a killed session's run reads free

**Site anchor:** `cli/templates/scripts/run-test-suite.sh` and its self-adopted copy `scripts/run-test-suite.sh`, which are byte-identical and must stay that way. In each:

- the function `heartbeat_loop()` (near line 305);
- the function `run_gate()`, whose body is `( set +u +o pipefail; eval "$1" ) 3>&- < /dev/null >> "$log_file" 2>&1` (near line 324);
- `on_signal()` (near line 330);
- the worker's start-up lines `exec 3> >(heartbeat_loop > /dev/null 2>&1)` and `rm -f "$heartbeat_stop_file"` (near lines 413-414);
- the closing `exec 3>&-` (near line 448);
- `heartbeat_stop_file="$running_file.stop.$$"` (near line 259).

Line numbers are navigation hints only.

**Failing test:** `cli/test/run-test-suite.test.mjs` — `a run form killed with its session leaves the worker running, and a re-issued run form collects it`.

**Failure, from the gate log (gate 4, `npm test` in `cli/`):**

```
        not ok 992 - a run form killed with its session leaves the worker running, and a re-issued run form collects it
```

The log carries the `not ok` line and the totals only (`# fail 3` over 2276 tests); it does not carry the failing assertion's message.

**Class:** first round — no earlier log to compare against.

**Diagnosis.** The test starts a run form from a holder shell, waits until the run is in flight, SIGKILLs the holder, and sleeps 5 s. Then, with `RUN_TEST_SUITE_STALE=3`, it requires `--wait` to print `pending`, which needs `.running`'s mtime (the heartbeat) to be no older than 3 s. The assertion message on that line is `the heartbeat went stale with the session`.

This branch's own implementing run already recorded this exact case failing intermittently, with the heartbeat stopping while the worker and the gate were both alive (`harness-runs/task_plans/fix_run_gates_background_run_handling/task_2_plan.md` → **Deviations from plan:**):

- the case failed in 1 of 3 sandboxed runs;
- a probe saw the heartbeat go stale in 2 of 14 holder-shaped runs, one of them with **no signal sent at all**;
- `.running.stop.<pid>` never appeared, so the reader never saw end of file;
- that run recorded *"The toucher stopped refreshing without a stop file, and the cause was not established"*, and handed the defect back as a template defect.

Commit `47fea6ec` then *recorded* the stall in the wrapper's header (the `A heartbeat can also stop with NO signal sent` paragraph) without changing the mechanism. So the mechanism still fails this test, and the shipped wrapper keeps the consequence the header itself names: a live run's label reads free after `STALE_SECONDS`, and a re-issued run form starts a second worker that races the first for `.running`.

The defect is in how the heartbeat is produced. Liveness is meant to answer "is the worker alive?", but the mtime is refreshed by neither the worker nor the gate. It is refreshed by a third process: a backgrounded `( while …; touch -c; sleep; done ) &` toucher inside a process substitution (`exec 3> >(heartbeat_loop …)`), tied to the worker only through the fd-3 pipe. That toucher is the process observed to stop. Nothing in the worker notices or repairs it, and its cause could not be established because `ps` is refused under the sandbox. The heavily loaded 33-minute suite gives a 3-second stale window even less margin.

**Concrete fix** — make the worker itself the only process that refreshes the heartbeat, while it waits on its own gate. That removes the separate toucher, the fd-3 pipe and the stop file. Apply the identical edit to `cli/templates/scripts/run-test-suite.sh` and `scripts/run-test-suite.sh`:

- [ ] **Run each gate as the worker's own background child and refresh the heartbeat from the worker while it lives.** Replace `run_gate()`'s body with the gate started in the background, followed by a refresh loop:
  ```bash
  run_gate() {
    local gate_pid
    ( set +u +o pipefail; eval "$1" ) < /dev/null >> "$log_file" 2>&1 &
    gate_pid=$!
    while kill -0 "$gate_pid" 2>/dev/null; do
      touch -c "$running_file"
      sleep "$HEARTBEAT_SECONDS"
    done
    wait "$gate_pid"
  }
  ```
  `kill -0` here goes only to the worker's own child within the same process. The wrapper's `WHY NOT A SIGNAL` paragraph records that form as measured to work under the sandbox (*"`kill -0` within one call on that call's own child exited 0"*). The cross-call liveness readers (`run_alive`, `heartbeat_age`) stay file-only and unchanged. A non-interactive bash starts an `&` job with INT and QUIT ignored, which keeps the measured INT behaviour (the gate survives INT to the calling group).
- [ ] **Delete the separate heartbeat process:** the `heartbeat_loop()` function, the `heartbeat_stop_file=…` assignment, the `rm -f "$heartbeat_stop_file"` and `exec 3> >(heartbeat_loop > /dev/null 2>&1)` start-up lines, and the closing `exec 3>&-`.
- [ ] **Keep the measured TERM contract: the label stays live until the gate returns, then there is no verdict and no further marker.** A trap now runs between loop iterations rather than after the gate returns, so it must not exit at once:
  - Change `on_signal()` to record the signal only, e.g. `signalled=$1`, initialised to empty before the traps are set.
  - Add a `finish_signalled` step: remove `.running` only while it still holds `$$` (the existing ownership check), then `exit $((128 + signalled))`.
  - Call that step immediately after each `run_gate` call returns and **before** that gate's `exited` marker is written, so a TERM that arrives during the typecheck never starts the test gate.
  - A TERM therefore leaves the worker refreshing `.running` until its gate ends, which is exactly what the case `a SIGTERM to the worker's PID alone leaves the label live until the gate returns, then no verdict` asserts.
- [ ] **Update the wrapper's header comments to the new shape**, keeping each measured fact attributed to the shape it was measured on:
  - `HOW THE RUN FORM WAS STARTED DOES NOT MATTER`: replace the heartbeat-process / fd-3 / `3>&-` sentences with "the worker refreshes `.running` while it waits on its own gate, so the heartbeat stops when the worker stops".
  - The `A heartbeat can also stop with NO signal sent` paragraph: say that the stall was observed with the former separate heartbeat process, that that process has been removed, and that BG10 remains the row that would show a stall on a real run. Claim no measured figure for the new shape.
  - `SIGNALS`: state that its bullets were measured against the former heartbeat process. The KILL-to-worker residual now becomes "the heartbeat stops with the worker, and the label reads free after `STALE_SECONDS` while an orphaned gate may still run". Drop the "KILL sent to the internal heartbeat process alone" residual.
  - `BESIDE THE LOG`: remove the `<label>.running.stop.<pid>` entry.
  - `WHY NOT A SIGNAL`: narrow its last sentence to "sends no signal to a process another call started, and lists no process".
  - The comment above `run_gate()`: drop the `3>&-` sentence.
- [ ] **Update the test file's header to match** (`cli/test/run-test-suite.test.mjs`, the module doc comment): the `Not covered here` sentence about *"a KILL to the worker's PID alone, whose heartbeat the wrapper's `SIGNALS` paragraph records as unreliable"* should follow the reworded `SIGNALS` paragraph. Do not change, remove, skip or loosen any test case or assertion, and keep `RUN_TEST_SUITE_STALE: '3'` in the failing case as it is.
- [ ] Confirm the two script copies are byte-identical after the edit, and that nothing else references `heartbeat_loop`, `.running.stop.` or the fd-3 pipe. A grep over `cli/`, `scripts/` and `docs/` at planning time found no reference outside the two scripts. `docs/sandbox-verification.md`'s F5 row and its paragraph after BG10 are dated records and stay as written.
