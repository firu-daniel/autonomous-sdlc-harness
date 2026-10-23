`fix_run_gates_wait_form_sandbox` makes `run-test-suite.sh`'s liveness check work inside the unattended sandbox. Today the wait form cannot follow a gate run that is still in flight, and the run form's one-run-per-label guard cannot see one either.

**What was observed.** `feat_unattended_sandbox_preflight`, resumed at Phase G round 4 on 2026-10-22 (Claude Code 2.1.308, macOS, headless, through the watcher):
- the run form, `bash scripts/run-test-suite.sh task_round_4`, was moved to the background and wrote `task_round_4.running` holding PID `11343`;
- `ps` from an unsandboxed shell showed that PID alive (`bash scripts/run-test-suite.sh task_round_4`);
- a separate foreground call, `bash scripts/run-test-suite.sh --wait task_round_4`, refused with `run-test-suite.sh: no run in flight for task_round_4` (exit 2);
- the session tried a direct `kill -0 58081` probe to confirm. That call was refused by the **permission layer**, because the command is not allow-listed: it appears in the run's `permission_denials`. So it is **not** evidence about the sandbox either way.

**The cause, measured after the run (goal 1).** `run_alive` (`cli/templates/scripts/run-test-suite.sh:139`) decides liveness with `kill -0 "$pid"`. The sandbox refuses even signal 0 aimed at a process that another Bash call started: `Operation not permitted`, exit 1. In the same run, the sandbox also refused `pgrep`'s read of the process list: `sysmon request failed with error: sysmond service not found`, then `pgrep: Cannot get process list`, exit 3 (`cli/test/test-timeout.test.mjs`).

**Why it matters beyond one wait.**
- G.1 (`plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.1 Run the gates`) prescribes `--wait` as the only way to collect a backgrounded verdict, and treats a `--wait` refusal as the no-verdict-line case, which escalates. Under the sandbox, then, every gate run that outlasts the Bash tool's foreground window either escalates or pushes the session into improvising. In this run it improvised: it ended its turn with the run in flight, the thing G.1 forbids by name.
- `run_alive` also guards the run form, at `cli/templates/scripts/run-test-suite.sh:194` ("ONE RUN PER LABEL"). A session that re-enters Phase G while its earlier run is still live would start a second run of the same label, and that second run truncates the live run's log.

## The goal

1. **The cause is measured. Record it, and re-take it only to cite it.** Measured 2026-10-23 on Claude Code 2.1.309 (macOS), in a headless session on the watcher's launch line under this checkout's live profile. Raw results: `<home>/Work/harness-sandbox-tests/sbx2-results-20261023-083639/`, session `A`, driven by `sbx2-probes.sh` beside it.
   - **The target was alive.** It was started with the Bash tool's own background option (a script that records its PID and sleeps), and an unsandboxed `ps -p` from outside confirmed it alive throughout.
   - **`kill -0` from a later sandboxed call:** `kill: (68252) - Operation not permitted`, exit 1.
   - **`kill -0` within the same call** on a child it had just started: exit 0. So the sandbox refuses a signal, even signal 0, aimed at a process another call started.
   - **`ps` is refused outright, even within the same call:** `/bin/ps: Operation not permitted`, exit 126. It is no alternative.
   - **A process the wrapper detaches itself** (`nohup … &`, `disown`) gives the same `kill -0` refusal from the next call.
   - **Conclusion:** no process-table or signal check can tell the wait form whether a run is alive under the sandbox. The new signal has to be file-based. A heartbeat whose mtime the run form refreshes is the likely shape, and the wait form treats a stale heartbeat as a dead run.
   - Re-run the measurement only to quote it in `docs/sandbox-verification.md`. Add a row there with these results and the version.
2. **Replace the liveness signal with one the sandbox allows**, used by both `run_alive` callers.
   - It may not depend on signalling or listing another process.
   - It must tell apart three cases: a run that is live, a run that finished (the verdict file is present), and a run that died without writing a verdict.
   - The third case must stay detectable. The wait form must never print `pending` forever for a crashed run.
   - A file-based heartbeat is one candidate: the run form refreshes a file's mtime while the gates run, and the wait form treats a stale heartbeat as dead. Choose the design from the measurement, and state in the script's header why the old check failed.
3. **Keep the wire unchanged.**
   - the `pass` / `fail <log>` / `pending` lines;
   - the exit map 0/1/2/3;
   - the `.running` / `.verdict` names;
   - the label pattern;
   - the log path.

   `cli/test/run-test-suite.test.mjs` keeps passing. Add cases for the following:
   - a live run whose liveness cannot be probed by signal;
   - a run that died without a verdict;
   - the run form finding a live run of its label.
4. **Re-render this checkout's `scripts/run-test-suite.sh`** with the self-adopt recipe in `docs/development.md`, and restore the hand-kept files the recipe names.
5. **Record the result** in `docs/sandbox-verification.md`, as a row for the wait form under the sandbox, with the measurement from goal 1.

## Constraints

- The wrapper still never runs a second gate run of a live label, and the wait form still never runs anything.
- Each `--wait` call stays bounded by `WAIT_SLICE_SECONDS`. No correctness may depend on how long the suite takes.
- The change works with both BSD (macOS) and GNU (Linux) userland. Record the Linux sandbox as not measured rather than inferring it from macOS.
- Add no sandbox profile entry to make `kill -0` or `ps` work. The fix is in the wrapper.
- **Scope against `sandbox2c`.** This branch fixes the liveness signal only, not how the gate run is started. Separately from this bug, a gate run the Bash tool moves to the background is stopped about 20 minutes later on 2.1.308. `sandbox2c` owns that, and may change the run form so that the wrapper detaches the gates itself and returns `pending` at once. The new signal must therefore work whichever way the run form is started: as a tool-level background task, or as a process the wrapper detaches. It must not depend on the Bash call that started the run still being alive.
