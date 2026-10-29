### Task 8 — Add the `detached` leg (BG9, WF5)

**Goal:** Take on Linux the two Run gates liveness facts `fix_run_gates_background_run_handling` and `fix_run_gates_wait_form_sandbox` rest on. Both rows are in `docs/sandbox-verification.md` → §5.

- **BG9**, BG2's Linux counterpart. A process started with `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` inside one sandboxed call outlives the call and the session. BG2, the macOS baseline, ran its full 1524 s.
- **WF5**, narrowed by the task prompt to its Linux question. `hr_lane_mtime` (`scripts/lib/harness-run-lib.sh`) reads an advancing mtime from a sandboxed process through its GNU `stat -c %Y` arm. That arm is the one reached when `stat -f %m` prints no integer.

BG9 is graded against the run form's design: a detached run that dies with the session is a finding (`fail`) for a follow-up task prompt, never a probe change. WF5 is `fail` when the mtime does not advance, which would mean the heartbeat cannot show liveness on Linux.

**Depends on:**

- **Task 2.** The leg table declares `detached` with rows `BG9,WF5`. `scripts/sandbox-probe.sh` sources `scripts/lib/sandbox-probe/legs-detached.sh` when present, and calls `sp_leg_detached` only on Linux.
- **Task 3.** Every judge call here expects layer `ran`, so the `unrecognised` layer does not arise. A permission-layer refusal is `not run`.

It reuses, unchanged:

- `session.sh` → `sp_session`, `sp_prompt_*`, `sp_departures`, `sp_track`, `SP_RUN_PROFILE`, `SP_CLONE`, `SP_TMP`;
- `controls.sh` → the `written` control, `sp_ctl_held`, `sp_row_result`;
- `judge.sh` → `sp_judge_call`;
- the run library's `hr_scripts_dir` and `hr_lane_mtime`, already sourced by preflight check 1.

**Where this task stops.** One new library file, nothing else edited. Task 19 tests `sp__bg9_grade` and `sp__wf5_grade`. Gate 15 states BG9 takes BG2's shape only, not BG1–BG8 (Task 11). The record is Task 21's.

### Targets

- `scripts/lib/sandbox-probe/legs-detached.sh` (new)

**Work:**

- [ ] **The header**, as every sibling's. It states:
  - the two rows and their macOS baseline;
  - the files the worker writes;
  - the bound, `SP_BG9_SECONDS=20`;
  - the grading functions with their signatures;
  - *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **Two helpers, written by the probe under `SP_TMP` before the session and tracked.**
  - **`bg9-worker.sh`** writes `$$` to `<clone>/sbx_bg9.pid`. Then it runs `SP_BG9_SECONDS` iterations, each a `touch <clone>/sbx_bg9.beat` and a `sleep 1`. In iterations 2 and 5 it sources `<clone>/<scriptsDir>/lib/harness-run-lib.sh`, by its literal path, and appends `hr_lane_mtime <clone>/sbx_bg9.beat`'s output to `<clone>/sbx_wf5.mtimes` as a line `mtime <n>`. Before the first such line it writes one line `stat -f %m: <stat -f %m's first output line on the beat file, or empty>`. At the end it writes `<clone>/sbx_bg9.done`.
  - **`bg9-start.sh`** runs `nohup bash <SP_TMP>/bg9-worker.sh </dev/null >/dev/null 2>&1 &`, then `disown`, prints `sbx_bg9_started`, and exits 0.

  This is BG2's shape (*"detached by the helper itself (`nohup … &`, `disown`)"*), and the run form's own. Every path is spelled as a literal when the probe writes the helpers.
- [ ] **`sp__bg9_grade <stream> <start command> <session end epoch> <last beat epoch> <done: 1|0>`** reads only its arguments and the stream, and sets `SP_VERDICT` and `SP_EVIDENCE`:
  - the start call refused at the permission layer, absent, or carrying no `sbx_bg9_started` line → `not run`;
  - `<done>` `1` and the last beat later than the session end → `pass`, `outlived the call and the session: last beat <n>s after the session ended, the worker finished`;
  - the last beat at or before the session end + 1 and `<done>` `0` → `fail`, `the detached process did not outlive the session: last beat <n>s after it ended, no done marker`;
  - anything else → `not run`, naming the three values.
- [ ] **`sp__wf5_grade <mtimes file>`** reads only the file, and sets `SP_VERDICT` and `SP_EVIDENCE`:
  - two `mtime` lines, both integers, the second greater than the first and the first greater than 0 → `pass`, `hr_lane_mtime advanced <a>..<b> in a sandboxed process (stat -f %m gave '<raw>', so the GNU stat -c %Y arm answered)`;
  - two equal values → `fail`, `did not advance`;
  - a value of `0` → `fail`, `neither stat arm answered`;
  - the file missing, or fewer than two lines → `not run`, `the worker did not reach the hr_lane_mtime calls`.
- [ ] **`sp_leg_detached`:**
  1. Resolve `scripts_rel` with `hr_scripts_dir "$SP_CLONE"`; if it cannot be resolved, print both rows `not run`.
  2. `sp_track` the five `<clone>/sbx_bg9.*` and `sbx_wf5.mtimes` paths.
  3. One session, `detached`, on `SP_RUN_PROFILE`, cwd the clone, with `--allowed "Bash(bash $SP_TMP/bg9-start.sh)"`. Its prompt issues `bash $SP_TMP/bg9-start.sh`, then the control `written` `dd` of `$SP_CLONE/sbx_bg9_ctl`, tracked.
  4. Record the session's end with `date +%s` as soon as `sp_session` returns.
  5. Poll from outside, once a second, for `<clone>/sbx_bg9.done`, for at most `SP_BG9_SECONDS + 10` seconds.
  6. Read the last beat with `hr_lane_mtime`, then grade.
  7. Print BG9 through `sp_row_result --direct`, since a dead worker is a `fail` that needs no control, and WF5 through `sp_row_result`.

**Verification:**

- The type check passes.
- `grep -n 'sleep\|while' scripts/lib/sandbox-probe/legs-detached.sh` shows every loop bounded by `SP_BG9_SECONDS`, the worker's iterations or the outside poll.
- By hand, `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/legs-detached.sh; f=$(mktemp "${TMPDIR:-/tmp}/wf5.XXXXXX"); printf "stat -f %%m: ?\nmtime 100\nmtime 103\n" >"$f"; sp__wf5_grade "$f"; echo "$SP_VERDICT: $SP_EVIDENCE"; rm -f "$f"'` prints `pass: hr_lane_mtime advanced 100..103 …`.

**Deviations from plan:**

- The session also carries `--allowed "$SP_DD_RULE"`, not just the start rule. The control is a `dd`, and `session.sh` → `SP_DD_RULE` is the rule every run-profile session that writes through `dd` carries. `legs-glob.sh` and `legs-registry.sh` pass it for the same control. Without it, a `dontAsk` session could deny the control, and WF5 would print `not run`.
- `sp__wf5_grade` has two arms the plan does not name, and both are `not run`. (1) A `stat -f %m:` value that is all digits means the BSD arm answered, so the GNU arm WF5 asks about was never reached. (2) An `mtime` value that is not an integer means the worker did not source the run library. A second value lower than the first is `fail`, `did not advance`, the same as equal values. A `0` is checked before the advance test, so two zeros read `neither stat arm answered`.
- In `sp__bg9_grade`'s `fail` arm, a last beat of `0` gives the evidence `no beat was written`. That is `hr_lane_mtime`'s answer when the beat file is absent, and a delta from epoch 0 means nothing. The verdict is still `fail`.
- The worker's pid is recorded in BG9's evidence (`worker pid <n>: …`) and never passed to `sp_track_pid`. Inside the sandbox on Linux, `$$` may be a PID-namespace number, so a `kill` from outside could hit an unrelated process. The worker stops on its own, bounded by `SP_BG9_SECONDS`.
- The leg prints both rows `not run` and launches no session when any of `sbx_bg9.pid`, `sbx_bg9.beat`, `sbx_bg9.done`, `sbx_wf5.mtimes` or `sbx_bg9_ctl` already exists in the clone. A stale `sbx_bg9.done` would fake a `pass`. This follows `legs-registry.sh`'s rule that the probe never removes a file it did not create.
- A copy of `sbx_wf5.mtimes` is kept with the leg's evidence through `sp_keep_file`, at `$SP_TMP/detached.wf5.mtimes`. The clone's own files are removed after grading, because later legs share the clone.
- **Evidence downgrade — parse check and the by-hand line.** `bash scripts/typecheck.sh` printed `PASS: typecheck` (`check-shell-parse: 94 files checked … 0 failed`), but its parse step covers only tracked files, so it missed the new, untracked `legs-detached.sh`. The permission layer refused the by-hand `bash -c '…'` line (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`). Both checks were run instead with `bash scripts/scratch-run.sh harness-runs/scratch/task8_detached.py <repo_root>`. Results:
  - `/bin/bash -n` gave `parse rc=0`.
  - The plan's by-hand line, verbatim, printed `pass: hr_lane_mtime advanced 100..103 in a sandboxed process (stat -f %m gave '?', so the GNU stat -c %Y arm answered)`.
  - Synthetic inputs graded as follows. WF5: equal values `fail`, zeros `fail`, one line `not run`, missing file `not run`, BSD integer `not run`, non-integer `not run`. BG9: a pass case `pass`, a 1 s delta with no done marker `fail`, no beat `fail`, a beat before the session's end with the done marker `not run`, no started line `not run`, a permission denial `not run`, and an absent call `not run`.
  - The helpers, written with a 6-iteration bound and run unsandboxed on macOS, printed `sbx_bg9_started` and produced all four clone files. `sbx_wf5.mtimes` held `stat -f %m: 1793193435 | mtime 1793193435 | mtime 1793193438`, which grades `not run` (the BSD arm answered), as it should off Linux.

  No Linux host was used, so neither row's live Linux behaviour is measured here. The Run gates phase's whole-tree run parses the file once it is tracked. The permission layer also refused removing the probe file, so it is still under the ignored `harness-runs/scratch/`.
</content>
</invoke>
