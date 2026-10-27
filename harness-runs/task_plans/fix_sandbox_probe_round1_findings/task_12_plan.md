### Task 12 — Test teardown's evidence keeping and its stopping of tracked processes

**Goal:** Pin Task 3's teardown behaviour with a new suite:

- the session files of a leg that printed anything but `pass` survive teardown in a printed directory;
- a passing leg's do not;
- a process registered with `sp_track_pid` is gone afterwards;
- the probe's temp area is removed in every case.

**Depends on:**

- **Task 1:** `sp_result_line` records the leg of every `fail` / `not run` line in `SP_NONPASS_LEGS`, and `sp_leg_nonpass <leg>` answers from it.
- **Task 3:** `scripts/lib/sandbox-probe/session.sh` changed as follows.
  - **`sp_session <name> <settings> <prompt file> [--debug-file <f>] …`** records `${SP_CURRENT_LEG:--}`, `$SP_TMP/<name>.stream.jsonl`, `$SP_TMP/<name>.stderr`, the prompt file and the debug file. It runs `${SANDBOX_PROBE_AGENT_CLI:-claude}` with cwd = `--cwd` (default `SP_CLONE`) and writes its stdout to the stream.
  - **`sp_keep_file <path>`** adds a file to the current leg's record.
  - **`sp_track_pid <pid>`** registers a process.
  - **`sp_teardown`**, first, moves every recorded file of each leg `sp_leg_nonpass` names into `<dir>/<leg>/`, where `<dir>` is created by `mktemp -d "${TMPDIR:-/tmp}/sandbox-probe-evidence.XXXXXX"`. It stops each tracked PID. Its last stderr line is `sandbox-probe: evidence of the legs that did not pass kept in <dir>`, or nothing when nothing was kept. SP_TMP is still removed.

### Targets

- `cli/test/sandbox-probe-evidence.test.mjs` (new).

**Work:**

- [ ] **The header and harness.**
  - Open with the rule this suite enforces: *teardown keeps the evidence of every leg that did not pass, outside the clone and the main checkout, prints where, and leaves nothing else behind — and stops every process the probe started.*
  - Name what is left out: real sessions, since no case launches `claude`, and the clone steps, since no clone is registered.
  - Each case runs `bash -c` through `runBash` from `./helpers/fixture.mjs`, which blanks the main-checkout anchor. The shell sources `core.sh`, `judge.sh`, `preflight.sh` (for `sp_snapshot_check`, a no-op with no snapshot) and `session.sh` from `WORKSPACE_ROOT/scripts/lib/sandbox-probe/`.
  - Set `TMPDIR` to a per-case directory from `mkdtemp(join(tmpdir(), …))`, and set `SP_TMP`, `SP_CLONE`, `SP_MAIN` and `SP_STATE_DIR` to directories under it.
  - Use an agent stub, written by the case and passed as `SANDBOX_PROBE_AGENT_CLI`, that copies `cli/test/fixtures/sandbox-probe/ran.jsonl` to stdout.
  - Remove the per-case directory with `rm(…, { recursive: true, force: true })` in `t.after`.
- [ ] **A leg that did not pass keeps its files.**
  - With `SP_CURRENT_LEG=credentials`, run `sp_session credentials-case <settings> <prompt> --debug-file "$SP_TMP/case.debug.log"` (create the log), then `sp_keep_file "$SP_TMP/extra.log"`. Print a `not run` line for `credentials S1`, then call `sp_teardown`.
  - Assert:
    - the last `sandbox-probe: ` stderr line names a directory under the case's `TMPDIR` starting `sandbox-probe-evidence.`;
    - `<dir>/credentials/` holds `credentials-case.stream.jsonl`, `credentials-case.stderr`, the prompt file, `case.debug.log` and `extra.log`;
    - `SP_TMP` no longer exists.
- [ ] **A passing leg keeps nothing.** The same session under `SP_CURRENT_LEG=network`, followed by a `pass` line for `network N1` and `sp_teardown`. Assert:
  - no stderr line names an evidence directory;
  - no `sandbox-probe-evidence.*` entry exists under the case's `TMPDIR`;
  - `SP_TMP` is gone.
- [ ] **A tracked process is stopped.**
  - Start `sleep 300 &` inside the shell, `sp_track_pid $!`, then `sp_teardown`, then print `kill -0 <pid>`'s status.
  - Assert it is non-zero, and that teardown's exit-code accumulator (`SP_EXIT`) stays below 5.
- [ ] **No case touches this checkout.** Every path the shell writes is under the case's `TMPDIR`. Assert `SP_CLONE` and `SP_MAIN` hold nothing the case did not create.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-evidence.test.mjs` passes.
- Each case's temp directory is gone after the run, evidence directories included (`t.after`).
