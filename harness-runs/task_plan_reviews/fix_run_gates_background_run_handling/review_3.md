# Task plan review — iteration 3

Round-2 Must Fix 1 (write the `SIGNALS` driver as `.mjs` and run it through `scratch-run.sh`) is applied in `task_1_plan.md`, and round-2 Should Fix 6 (fixture cleanup in a `try` / `finally`) is applied too. I re-ran the scope register's D1, D2, D3 and D5 command entries verbatim and re-walked D4. Every site they reach is a row, so there is no closure finding. The index has no `## Rejected findings` section. Round 2's Should Fix items 1–5 are neither resolved in the artifact nor recorded there, so they are raised again below at their original severity.

## Must Fix

1. **`task_1_plan.md`: the `SIGNALS` fixture holds the wrapper without its library, so every measured case is a refusal**
   `**Header — SIGNALS.**`, step 3, says to *"Copy the edited template `cli/templates/scripts/run-test-suite.sh` into it, and run that copy's run form from inside the fixture"*. It names no other file. The wrapper finds its library next to its own path and refuses when the library is not there, before it resolves configuration or starts any run:
   - `cli/templates/scripts/run-test-suite.sh` → `script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`, `hr_lib="$script_dir/lib/harness-run-lib.sh"`, `[ -r "$hr_lib" ] || refuse "cannot read '$hr_lib'"`.
   - It then calls `hr_repo_root`, `hr_state_dir`, `hr_current_branch` and `hr_command`, which all come from that library.

   If the step is followed as written, the run form in each of the four cases (TERM, KILL, INT to the calling group, HUP) exits 2 with `run-test-suite.sh: cannot read '<fixture>/lib/harness-run-lib.sh'`. No worker starts, `.running` is never claimed, and step 4 has no PID to signal. Task 2 asserts *"exactly these sandboxed observations"*, so the header paragraph its signal cases depend on would record nothing usable. The existing suite gets around this by running `init`, which writes the library beside the wrapper (`cli/test/run-test-suite.test.mjs` → `WRAPPER = 'scripts/run-test-suite.sh'`, built through `runCli`).
   **Fix:** In `task_1_plan.md`, `**Header — SIGNALS.**`, step 3:
   - Copy both `cli/templates/scripts/run-test-suite.sh` → `<fixture>/scripts/run-test-suite.sh` and `cli/templates/scripts/lib/harness-run-lib.sh` → `<fixture>/scripts/lib/harness-run-lib.sh`, keeping that relative layout.
   - Issue the run form as `spawnSync('bash', ['scripts/run-test-suite.sh', <label>], { cwd: <fixture> })`, and make the same change to the INT case's `bash -c` string.
   - Add a pre-flight check to the driver: if the first run form exits 2, print its stderr line and stop. Record a wrapper refusal as a setup fault of the driver, never as a sandbox refusal or as an observation.

## Should Fix

1. **`task_2_plan.md`: the start-up refusal Task 1 adds is still not covered** (raised in rounds 0, 1 and 2). Task 1 adds the exit-2 refusal *"the detached run of <label> did not start"*, and no case in Task 2 asserts it. Do one of two things: add a case where the worker never claims `.running` and assert the bytes on disk (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*), or name this case under the header's `Not covered here` with the reason. Alternatively, record the decision under `## Rejected findings` with its reason.

2. **`task_1_plan.md`: a worker that claims `.running` after the start-up window has closed** (raised in rounds 0, 1 and 2). By then the run form has already returned the refusal, which G.1 escalates, while a live run sits behind it. State what happens next, for example that a re-issued run form collects that run through one-run-per-label, and record it among the header's residuals.

3. **`task_4_plan.md`: no separator before the appended clause** (raised in rounds 1 and 2). The plan core's D.2 *"Run gates (Phase G): passed on round N"* bullet ends *"… never a remembered number"* with no period, so *"Then report …"* would follow straight on and run two sentences together. Specify `. ` before *"Then report"*.

4. **`task_4_plan.md` / `task_8_plan.md`: "re-launched" conflicts with G.1's own re-entry case** (raised in round 2). Task 4's step 2 keeps the case *"because this session or an earlier one re-entered the phase while it runs"*. The Done-summary clause counts exactly that as **re-launched** (*"this session issuing the run form for a label it had already issued it for"*). Either drop *"this session or"* from step 2, or narrow the **re-launched** definition so that a run form answered `pending` by an already-live run is not counted.

5. **`task_2_plan.md`: a 3-second start-up window in the watchdog-kill case** (raised in round 2). Task 1 bounds the run form's start-up poll by `STALE_SECONDS`, so if `RUN_TEST_SUITE_STALE` (3) is also passed to the run form, the worker has only 3 s to claim `.running`. A sandboxed Phase G run under load could then flake with the new refusal. Say that the shortened value goes only to the later `--wait` calls and the re-issued run form, or state why 3 s is safe.
