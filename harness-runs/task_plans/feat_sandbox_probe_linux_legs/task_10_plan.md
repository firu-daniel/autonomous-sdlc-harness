### Task 10 — Add the `refusal` leg (RF1–RF3)

**Goal:** On a Linux host lacking `bubblewrap` or `socat`, measure the three things only such a host can show:

- **RF1:** Claude Code's own startup refusal under `failIfUnavailable: true`, quoted.
- **RF2:** the watcher's launch-time prerequisite decision. The probe calls the same library functions `spawn`'s host check calls: `hr_sandbox_opted_out`, then `hr_sandbox_prereq_probe_var`. On a definite missing piece they refuse, naming the package in `HR_SANDBOX_REFUSAL` (`scripts/autonomous-watcher.sh`, *"The sandbox preflight"*).
- **RF3:** CS8's invalid profile (`sandbox.failIfUnavailable` set to the string `"true"`) on such a host. If the file is ignored as on macOS (§5 F7), `failIfUnavailable` is never read, and the session may start unsandboxed with no startup refusal. The row records which.

**All three are recorded**, except where the outcome is the protection visibly failing:

- RF1's call running is a `fail`: a session ran under `failIfUnavailable: true` with no sandbox.
- RF2's check passing is a `fail`: the watcher would launch on a host it should refuse.

The watcher's archive of a drop as failed, which cuts no clone (RF4), and `doctor`'s rows (DP1–DP7) are hand rows in Gate 15 (Task 11). They change the registry, the inbox or the host, which the probe's footprint forbids.

**Depends on:**

- **Task 2.** The leg table declares `refusal` with rows `RF1,RF2,RF3`. `scripts/sandbox-probe.sh` sources `scripts/lib/sandbox-probe/legs-refusal.sh` when present. Its `refusal` subcommand sets `SP_PREFLIGHT_PREREQ=absent`, so preflight has already established four things: the host is Linux; `doctor` passes the three profile checks; `doctor` does **not** pass `sandbox-prerequisites`; and `sp_prereq_cmd bwrap` or `sp_prereq_cmd socat` does not resolve. The subcommand then calls `sp_setup` and `sp_leg_refusal`, and never runs it from `run`.
- **Task 1.** `sp_prereq_cmd bwrap|socat` prints the command name looked up, honouring `SANDBOX_PROBE_BWRAP` and `SANDBOX_PROBE_SOCAT`.

It reuses, unchanged:

- `session.sh` → `sp_session`, which returns the agent CLI's own exit status and writes `$SP_TMP/<name>.stderr`; also `sp_prompt_*`, `sp_departures`, `sp_scratch_profile`, `sp_track`, `sp_dd_cmd`, `SP_DD_RULE`, `SP_RUN_PROFILE`, `SP_MAIN`, `SP_CLONE`, `SP_TMP`;
- `legs-settings.sh` → `sp__ctl_literal` (through `controls.sh`) and CS8's helper shape: a script whose one command writes a marker under `$HOME`;
- the run library's `hr_sandbox_opted_out <main>` and `hr_sandbox_prereq_probe_var`, already sourced by preflight check 1. `hr_sandbox_prereq_probe_var` returns 1 with `HR_SANDBOX_REFUSAL` set on a definite missing piece, and 0 otherwise.

**Where this task stops.** One new library file, nothing else edited. Task 20 tests `sp__rf1_grade`, `sp__rf2_grade` and `sp__rf3_grade`. The record is Task 21's.

### Targets

- `scripts/lib/sandbox-probe/legs-refusal.sh` (new)

**Work:**

- [ ] **The header**, as every sibling's. It states:
  - the three rows;
  - the host the `refusal` subcommand admits;
  - that these sessions carry **no positive control**, because there is no sandbox to control for: RF1's call *is* the startup check, and RF2 launches nothing;
  - the grading functions with their signatures;
  - *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **The grading functions.** Each reads only its arguments, the stream and the stderr file, and sets `SP_VERDICT` and `SP_EVIDENCE`.
  - **`sp__rf1_grade <stream> <stderr file> <agent exit status> <command>`:**
    - the call has a `tool_result` that is not a permission-layer refusal → `fail`, `the session ran its call although failIfUnavailable is true and the sandbox cannot start: <result's first line>`;
    - no call issued and a non-zero exit → `pass`, `refused at startup (exit <n>): <the stderr file's first non-empty line, else the stream's result event text, else (no message)>`;
    - a permission-layer refusal → `not run`;
    - no call and exit 0 → `not run`, quoting the result text.
  - **`sp__rf2_grade <status> <refusal>`:**
    - `1` with a refusal naming `bwrap` or `socat` → `pass`, `the watcher would refuse the launch: <refusal>`;
    - `0` → `fail`, `the watcher's prerequisite probe passes on a host lacking bwrap or socat`;
    - `3` → `not run`, `sandbox.optOut is taken in <main>'s harness.config.json, so the watcher does not judge the host`;
    - anything else → `not run`, naming it.
  - **`sp__rf3_grade <stream> <stderr file> <agent exit status> <command> <marker written: 1|0>`:**
    - marker written → `pass`, `the invalid file was ignored: failIfUnavailable was never read, and the session ran unsandboxed with no startup refusal`;
    - no call and a non-zero exit → `pass`, `refused at startup (exit <n>): <line>`, the line found as in RF1;
    - the call reached the sandbox layer and was refused → `pass`, `started sandboxed and refused the write: <line>`, recorded for what it is;
    - a permission-layer refusal, or anything else → `not run`.
- [ ] **RF1 and RF3**, one session each, both on the clone. Each prints its row through `sp_result_line`, with `sp_departures` as the departure, extended for RF3 by `--settings <bad> (failIfUnavailable the string "true")`.
  - **Session `refusal-rf1`** runs on `SP_RUN_PROFILE`, with one call, `sp_dd_cmd $SP_CLONE/sbx_rf1_ctl` (tracked), through `--allowed "$SP_DD_RULE"`. The agent CLI's exit status is `sp_session`'s return.
  - **Session `refusal-rf3`** runs on `$(sp_scratch_profile sbx_rf3 '.sandbox.failIfUnavailable = "true"')`, with one call, `bash $SP_TMP/rf3-helper.sh`, through its exact `--allowed` rule. The helper's one command writes `$HOME/sbx_rf3_marker`, tracked.
    - A marker already present before the session prints RF3 `not run`, naming it, as CS8 does.
    - The marker is checked right after the session.
- [ ] **RF2** runs `hr_sandbox_opted_out "$SP_MAIN"` (status 0 means opted out, which is status `3` for the grade), then `hr_sandbox_prereq_probe_var` directly in the probe's shell, with the probe's own `PATH`. It grades with `sp__rf2_grade`, prints through `sp_result_line` with departure `none`, and launches nothing.
  - The evidence also names which of `sp_prereq_cmd bwrap` and `sp_prereq_cmd socat` resolves (`command -v`). The watcher's probe looks up the real `bwrap` and `socat` names, so a seam that disagrees with `PATH` shows here.

**Verification:**

- The type check passes.
- `grep -n 'sp_ctl_\|sp_row_result' scripts/lib/sandbox-probe/legs-refusal.sh` finds nothing, consistent with the header's no-control statement. Every row prints through `sp_result_line`.
- `grep -n 'autonomous_inbox\|registry.json\|apt-get\|dnf' scripts/lib/sandbox-probe/legs-refusal.sh` finds nothing: the leg touches no inbox, no registry and no package.

**Deviations from plan:**

- `sp__rf2_grade` takes an optional third argument, `<main>`, so the `3` arm's evidence names the main checkout while the function still reads only its arguments; with it absent the evidence says `<main>`. The two-argument call Task 20 tests is unchanged.
- RF1 and RF3 grade a call that was issued but has no `tool_result` as `not run` (`the call was issued but has no tool_result`), a case the plan's arm list does not name. RF3 grades a `tool_result` at any layer other than `sandbox` or `permission` with the marker absent as `not run` under the plan's "anything else" arm.
- RF2's `1` arm with a refusal naming neither `bwrap` nor `socat` prints `not run` quoting the refusal, under the plan's "anything else" arm.
- Evidence downgrade: the grading functions were not exercised against a recorded stream in this unit. The only verification run was `bash scripts/typecheck.sh` (shell parse of 96 files under `/bin/bash` 3.2.57 plus `tsc`, verdict `PASS: typecheck`) and the plan's two greps (both exit 1, no match). A bash probe has no route through `scripts/scratch-run.sh`, which refuses `.sh`; Task 20 owns the tests of `sp__rf1_grade`, `sp__rf2_grade` and `sp__rf3_grade`, and RF1–RF3 themselves need a Linux host lacking bwrap or socat.
</content>
</invoke>
