### Task 2 — Cover the detached run form in `cli/test/run-test-suite.test.mjs`: immediate `pending`, collection by a later `--wait`, and the watchdog-kill path

**Goal:** Prove, against the compiled CLI's `init` output in a throwaway fixture, three things:
- the run form detaches the gate run and returns `pending` at once;
- a `--wait` issued immediately afterwards, and any later one, collects that run's verdict;
- a run whose starting "session" is killed the way the stall watchdog kills one keeps running and is collected by a re-issued run form of the same label, which starts nothing.

The existing cases are re-grounded on the new run form.

**Depends on:** Task 1. It makes `cli/templates/scripts/run-test-suite.sh`'s run form re-invoke itself as a worker, under an environment marker set to the label (Task 1 names it, for example `RUN_TEST_SUITE_WORKER`), with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown`. The run form prints `pending`, exit 3, only once `.running` holds the worker's PID **or** `.verdict` exists — the `.verdict` branch covers a worker whose gates finished between two polls and has already removed its `.running`; the run form has removed any stale `.verdict` / `.verdict.tmp` before starting the worker, so a `.verdict` seen afterwards is that worker's, and the run form still prints `pending`, leaving the verdict to the next `--wait`. It bounds that start-up poll by `STALE_SECONDS` (so by `RUN_TEST_SUITE_STALE` when that seam is set). Only a poll that sees neither `.running` holding the worker's PID nor `.verdict` within it is a refusal: exit 2, nothing on stdout, and one stderr line `run-test-suite.sh: the detached run of <label> did not start` (Task 1 fixes the exact wording; assert the text Task 1 ships). Task 1 invokes `nohup` by name, resolved on `PATH`. The worker runs today's body: `.running` ← its `$$`, the fd-3 heartbeat, both gates, `.verdict` renamed into place, `.running` removed. The wire is unchanged: `pass` / `fail <log>` / `pending`, exit 0/1/2/3, the refusal texts, the marker lines. Task 1 also records the worker's measured signal behaviour in the wrapper's `SIGNALS` header paragraph. This task asserts those observations and edits nothing under `cli/templates/`.

### Targets

- `cli/test/run-test-suite.test.mjs`: re-grounded cases, new cases, and its header.

**Work:**

- [ ] **Header and line budget.** Rewrite the header's rule (lines 1–21) to say the run form detaches the gate run and answers `pending` at once, the verdict is read through `--wait`, and liveness is the heartbeat. Move today's signal sentences to the worker. Update `Not covered here` to name the sandbox rows `docs/sandbox-verification.md` BG10 and WF5 and the residual of a gate that never exits. Keep lines 1–88 the same line count, so `GATE_MARKER` stays at lines 82–88: `docs/work-report-research/test-fix-plan-writer.md` cites `cli/test/run-test-suite.test.mjs:83–85`. Make the `STUB`'s hold loop also stop once its fixture is gone without adding a line, for example line 60 becoming `while [ ! -e "$STUB_RELEASE" ] && [ -e stub.sh ]; do sleep 0.1; done` (relative to the repository root it runs in). An orphaned held gate then ends when its fixture is removed rather than spinning forever.
- [ ] **A shared collect helper and a teardown.** Add a helper that issues the run form, asserts `pending` / exit 3, then re-issues `--wait` with `RUN_TEST_SUITE_WAIT_SLICE: '1'` until a non-`pending` line, and returns that line and status. **The start-up window is never shortened for a run form that starts a worker.** The helper, and every case that issues a starting run form, leaves `RUN_TEST_SUITE_STALE` unset on that call, so the worker gets the full default `STALE_SECONDS` to claim `.running`, and a loaded sandboxed Phase G run cannot flake into the start-up refusal. A shortened `RUN_TEST_SUITE_STALE` goes only to the later `--wait` calls and to a re-issued run form that finds the run live. A re-grounded case that today shortens the value so that a **planted** heartbeat reads stale to a run form which then starts a worker instead back-dates that heartbeat's mtime past the default `STALE_SECONDS` (`fs.utimesSync`), because the same value is now also the start-up window. The one exception is the start-up-refusal case below, whose subject is the window running out. Add a teardown every run-starting case uses. It writes the case's release file, waits until `.running` is gone, and only then lets the fixture be removed, whatever order `t.after` hooks run in. Do both in one hook. As a last resort it SIGKILLs the worker and gate PIDs it read from `.running` and `stub-pid.txt`. End a worker through its release file wherever the case allows. Send a signal only in the cases whose subject is a signal: the only measurement of a sandboxed process signalling a reparented worker is the one Task 1's `SIGNALS` paragraph records, taken sandboxed within one Bash call.
- [ ] **Re-ground the existing cases on the new run form.** Each still asserts what it asserts today, through the helper where it read the run form's own line:
  - the `pass` / `fail <log path>` pair;
  - one log per round, and only a re-run of the same label replacing one;
  - a finished run's `.verdict` re-read by `--wait` without re-running;
  - `--wait` `pending` while live;
  - a second run form on a live label;
  - fresh and stale planted heartbeats;
  - a run killed without a verdict, and the heartbeat outliving the stale window;
  - the unreadable heartbeat;
  - every refusal, the detached HEAD, the subdirectory, `<none>`, unset typecheck, and the typecheck-only `fail`.

  "Exactly once" stays a counter assertion, and the stub's output still reaches the log and neither stream. Re-target the two signal cases at the worker's PID read from `.running`, or the caller's process group, and assert what Task 1's `SIGNALS` paragraph records — the sandboxed, one-call observation, which is the shape this suite runs in under Phase G.
- [ ] **New: detaching and immediate collection.** With the gate held on its release file, except where a case below says otherwise:
  - the run form resolves with `pending`, exit 3, empty stderr, while the gate is still held. That it resolves at all, with stdout closed, is the proof its streams were redirected away;
  - `.running` already holds a PID other than the run form's own, and the stub's PID differs from it;
  - a `--wait` issued **immediately** after prints `pending`, never the refusal;
  - a second run form issued immediately prints `pending`, the counter stays at one line, and the log is not truncated;
  - after release, a later `--wait` prints the verdict, and `.verdict` holds it.
  - **A worker that finishes inside the start-up poll.** With an **un-held** stub gate (no release file to wait on, so both gates finish in milliseconds) and `RUN_TEST_SUITE_STALE` unset, issue the run form. Assert it prints `pending`, exit 3, empty stderr — never the `the detached run of <label> did not start` refusal. Then issue one `--wait` (`RUN_TEST_SUITE_WAIT_SLICE: '1'`) and assert it prints the verdict (`pass` for a passing stub) with the matching exit status, without re-running anything: `COUNTER` (`stub-counter.txt`) still holds exactly one line. This is the case the re-grounded un-held cases (the `pass` / `fail <log path>` pair, one log per round, `<none>`, the typecheck-only `fail`) depend on through the shared collect helper.
  - **The start-up refusal**, Task 1's new exit-2 line, as the failure side of start-up. Prepend a fixture-local directory to `PATH` holding an executable `nohup` stub that exits 0 and starts nothing, and issue the run form with `RUN_TEST_SUITE_STALE: '3'` — here the short window is the case's subject. Assert exit 2, empty stdout, and stderr exactly the one refusal line. Then assert on the bytes on disk (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*): for this label the log directory holds no `.running`, no `.verdict` and no `.log`, and neither `COUNTER` (`stub-counter.txt`) nor `TC_COUNTER` (`typecheck-stub-counter.txt`) exists, so no gate ran. No worker was started, so the case needs no release and no signal.
- [ ] **New: the watchdog-kill path, without `pgrep` or `ps`.** Start the run form, with `RUN_TEST_SUITE_STALE` unset, inside a holder process standing in for the session, for example `bash -c '<run form>; exec sleep 600'` spawned detached in its own group. Once the run form's `pending` has been printed, `SIGKILL` the holder, as the watchdog kills the session PID and its then-enumerable descendants. The worker is no longer among them. Then assert:
  - the held gate is still in flight: the heartbeat stays fresh across longer than a shortened `RUN_TEST_SUITE_STALE` (3), passed to these `--wait` calls only, and `--wait` prints `pending`;
  - a re-issued run form of the same label, given the same shortened value because it finds the run live and so starts no worker, prints `pending`, the counter stays at one line, and the log is not truncated, which is one-run-per-label collecting the run for the resumed session;
  - after release, `--wait` collects the verdict.

**Verification:**

- `npm test --workspace cli -- test/run-test-suite.test.mjs`, from the repository root, as one plain foreground command: every case passes. Read the counts and the exit status, not a summary line.
- `grep -nE 'pgrep|ps -p|ps -o' cli/test/run-test-suite.test.mjs` prints nothing.
- Lines 83–85 of the file are still the three `typecheckHeader` / `typecheckExited` / `typecheckNotRun` entries of `GATE_MARKER`.
- After the run, no process from this file is left holding a fixture. The teardown is the guarantee, and a held stub also ends once its fixture is gone.
