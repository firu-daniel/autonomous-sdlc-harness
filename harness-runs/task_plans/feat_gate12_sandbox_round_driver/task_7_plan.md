### Task 7 — Add `grade-state.sh`: the SB2, SB4 and JS3 grades and the hand-step rows

**Goal:** Grade the bundle rows and the default-branch row from the planted runs, and print a `not run` line naming the reason for every row the script cannot take, so that `grade`'s output covers all of `docs/sandbox-verification.md` → `## 10.`.

**Depends on:** Task 5 and Task 6. Task 6 calls `g12_grade_state` when it is defined, and provides the following:
- `g12_run_done <id>`;
- `g12_step_ran <id> <step>` (true only for `success` / `failure`);
- `g12_step_log <id> <step>` (prints the step's lines, or makes the row `expired` when the log is gone);
- `g12_artifact <id>` (`none` | `expired` | a download directory);
- `g12_evidence <row> <text>`.

Task 1 provides `g12_result_line` (results include `source`), `g12_row_field <row> <n>` (field 3 is the route — `full-run` | `plant` | `reads-SB2` | `default-branch` | `hand`, with SB4 alone `reads-SB2` and JS3N, SB3 and RJ3 `hand` — field 5 the note) and `G12_ROWS_SELECTED`. Task 2's state provides `runs[]` (`row`, `arm`, `branch`, `run_id`) and `tokens.SB2`.

It also reads `stall_values_unconfirmed`, the optional `runs[]` key declared in Task 2's `state.sh` header (boolean, read as `false` when absent), which Task 5 sets `true` on the JS3 (`stall`) entry when its wait for the run to start times out.

### Targets

- `scripts/lib/gate12-sandbox-round/grade-state.sh` (new).

**Work:**

- [ ] SB2, from the `clarifications` arm's run:
  - `Save the state bundle` ran and concluded `success`.
  - Its log carries `remote state bundle: skipped <path>: <path> is a symbolic link`, with `<path>` ending in the planted `clarifications/<branch>/gate12-link.md` (both fields the same absolute path). The string comes from `hr_remote_copy_tree` in `cli/templates/scripts/lib/harness-run-lib.sh`, which `hr_remote_bundle_write` (called by `verb_save` in `cli/templates/scripts/remote-run.sh`) runs over the `clarifications/<branch>/` directory source; cite both by symbol in a comment. Match on the fixed prefix `remote state bundle: skipped `, the planted path and the fixed suffix ` is a symbolic link`.
  - Do **not** grade on `remote-run.sh: save: skipped …`: that form is printed only by `save_link_free` (for `autonomous_logs/registry.json`) and by `verb_save`'s linked-`remote_status.json` fallback, neither of which this arm plants. A linked source **component** prints `hr_remote_bundle_source_ok`'s `remote state bundle: skipped <root>/<rel>: <linked> is a symbolic link`; this arm's link sits inside the directory, so the `hr_remote_copy_tree` form is the one expected.
  - The downloaded artifact holds no link (`find <dir> -type l` prints nothing) and no token (`grep -r -F -- <tokens.SB2> <dir>` finds nothing).
  - If a later `harness run <branch>` run exists, its `Restore the previous job's state` log carries `restored the bundle of run <id>`. Otherwise that clause goes into the evidence as `not run`.
  - The verdict is `fail` when any planted-arm check fails, `expired` when the artifact is expired, and otherwise **`not run`**. The evidence names the planted arm's outcome and says that the `PAUSE_PROGRESS.md` arm and the `remote_status.json` variant are hand steps, quoting the row's note from `G12_ROWS`. It is never a pass, because a clause of the row was not taken.
- [ ] SB4, the bundle half of SB2's artifact:
  - No link and no token gives `pass`. An expired artifact gives `expired`. No artifact, or SB2's run not done, gives `not run`. Otherwise `fail`.
  - The evidence ends `optional half: a hand step (throwaway upload workflow, background process)`.
- [ ] JS3, graded **only on the lines that reach the `Run the harness` step log**, plus the run's recorded status. The doctor report itself never reaches that log: `check_stalled_runs` in `cli/templates/scripts/autonomous-watcher.sh` runs `stall_job_surfaces_ok >>"$log_path" 2>&1`, which sends the report to the per-branch run log (`<stateDir>/autonomous_logs/<branch>.log`, the bundle's `run.log`). Only the watcher's `log` (`printf '%s [watcher] %s\n' … | tee -a "$WATCHER_LOG"`) reaches the step log. Cite `check_stalled_runs` and `log` by symbol in a comment. Match on these fixed substrings of `check_stalled_runs`'s two outcome lines, with `<b>` the JS3 branch:
  - **`pass`:** a `stall-watchdog: '<b>' -> reset to the last commit and resume (restart #` line, **and** the downloaded `status.json` `status` is not `failed`.
  - **`fail`:** a `stall-watchdog: '<b>' -> failed (` line carrying `the branch's own commits change a job surface, or that could not be checked`. Any other `stall-watchdog: '<b>' -> failed (` reason (the restart cap, a missing working copy, a refused reset), or a reset line followed by a `failed` `status.json`, is also `fail`, because the row requires the run *not* `failed`; the evidence quotes the reason in full.
  - **`not run`:** no `stall-watchdog: '<b>'` line at all: no stall happened, so the arm was not exercised. The same when the run is not done.
  - **`expired`:** the step log is gone (`g12_step_log`'s rule), or the line is present but the artifact needed for `status` is expired.
  - The doctor report in the artifact's `run.log` is **evidence only**, passed to `g12_evidence JS3` when the row does not pass, never a verdict check, because it is not in JS3's Read from.
  - Print, after the graded line, a `source` line for the row's *"from a temporary directory"* clause, which no step-log line shows: `row="JS3" result="source" evidence="cli/templates/scripts/autonomous-watcher.sh stall_job_surfaces_ok: mktemp -d then cd into it before doctor --job-surfaces" departure="none"`, the way Task 8 prints FR1's `--settings` clause.
  - When the run's state carries `stall_values_unconfirmed: true`, the departure says the lowered values may not have reached the job.
- [ ] The hand rows. For each row whose route (field 3) is `hand` — JS3N, SB3 and RJ3 — print `not run` with the evidence `hand step: <note>`, so the list is complete. SB4's route is `reads-SB2` (Task 1), not `hand`, so it is graded once, above, and never printed as a hand row. The three `sandbox1h` checks are not rows of `## 10.` and are not printed.
- [ ] The file opens with `#!/usr/bin/env bash` on the first line (`.claude/context/conventions.md` → `## Shell assets`), then a header stating what it grades and the sourced-library rule (no shell option set).

**Verification:**

- With the stubbed `gh`, an SB2 run whose save log carries the skip line, and whose artifact has neither a link nor the token, prints `SB2 not run` with the planted arm passing in its evidence, and `SB4 pass`. Planting the token into the stub artifact makes both `fail`.
- `grade --row SB3` prints `SB3 not run` with the note. `grade` with no `--row` prints SB4 exactly once.
- A JS3 step log carrying the `-> reset to the last commit and resume (restart #1)` line, with a `paused` `status.json`, prints `JS3 pass` and one `JS3 source` line; a step log carrying only a doctor report and no `stall-watchdog:` line prints `JS3 not run`.
- `commands.typecheck` passes.

**Deviations from plan:**
- SB2 with no `harness-state` artifact, or with no `tokens.SB2` in the state file, grades that clause `not run` (the bundle cannot be inspected); the plan names only `expired` for the artifact. SB4 takes the same reading, as the plan states for it.
- SB2 next job: the first `harness run <branch>` run (by `gh run list --workflow harness-run.yml --branch <branch>`, title `harness run <branch>`) whose `databaseId` exceeds the planted run's. A next job that exists but is not completed, or whose `Restore the previous job's state` did not run, is reported `not run` like an absent one; a completed one whose restore log lacks `restored the bundle of run <id>` is a planted-arm `fail`.
- JS3: `stall-watchdog: '<b>'` lines with neither outcome line (a warn or deferral, the kill never reached) grade `not run`; a reset line with no `harness-state` artifact grades `not run`, since the recorded status was not read; an unparseable `status.json` grades `fail`, as RJ2 does.
- JS3 `stall_values_unconfirmed: true` sets the departure of the graded JS3 line; the `source` line keeps `departure="none"` as the plan quotes it.
- JS3 with no recorded run says `take the default-branch leg first` instead of the shared `plant JS3 first`.
- Evidence downgrade: there is no test file yet (Task 13 adds one), so each Verification bullet was run through a throwaway probe under `harness-runs/scratch/` with `bash scripts/scratch-run.sh`, using a stubbed `gh` against a throwaway fixture repository under `$TMPDIR`, under `/bin/bash` 3.2.57: all 16 cases printed `OK` (SB2 `not run` with the planted arm passed and SB4 `pass`; token planted gives both `fail`; `--row SB3` gives `not run` with the note; plain `grade` prints SB4 once; JS3 reset + `paused` gives `pass` and one `source` line; a doctor report alone gives `not run`).
