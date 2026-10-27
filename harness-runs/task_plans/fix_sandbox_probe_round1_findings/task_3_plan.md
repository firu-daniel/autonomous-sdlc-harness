### Task 3 — Keep the evidence of every leg that did not pass, stop the probe's own processes at teardown, and drop the pipe in `sp_extra_clone`

**Goal:** Stop the probe deleting the evidence of every row it could not grade (defect 8). Teardown moves the session files of every leg that printed anything but `pass` into a directory outside the clone and the main checkout, and prints that directory. Teardown also gains a way to stop a process the probe started, for Task 6's loopback listener. The same pipe-into-an-early-exiting-reader shape as defect 10 is removed from `sp_extra_clone`.

**Depends on:** Task 1, which adds `sp_leg_nonpass <leg>` to `scripts/lib/sandbox-probe/core.sh`. It returns status 0 when `sp_result_line` printed a `fail` or `not run` line for that leg, or refused one of its lines. This task calls it, and defines no record of its own.

**Where this task stops.** It changes no leg's measurement. The legs that start a process (Task 6) or keep an extra file (Task 4) call the two registration functions defined here. Gate 15's paragraph describing the kept directory is Task 1's. Task 12 tests the behaviour.

### Targets

- `scripts/lib/sandbox-probe/session.sh`: `sp_session`, the new `sp_keep_file` and `sp_track_pid`, `sp_teardown`, `sp_extra_clone`, and the header's API list.
- `scripts/sandbox-probe.sh`: the `run` loop, and the header (including its `It changes nothing outside its own temp area…` sentence) and usage text.

**Work:**

- [ ] **The session registry.**
  - `sp_session` appends one record per launch with five tab-separated fields:
    1. `${SP_CURRENT_LEG:--}`;
    2. the stream path (`$SP_TMP/<name>.stream.jsonl`);
    3. the stderr path (`$SP_TMP/<name>.stderr`);
    4. the prompt file it was given;
    5. the `--debug-file` path, or empty.
  - Records go to a newline-separated `SP__SESSIONS`. Append the record before the launch, so a session that crashed is kept too.
  - Add `sp_keep_file <path>`, which appends a record for the current leg carrying `<path>` alone. It refuses an empty path or one carrying a newline, as `sp_track` does.
- [ ] **Teardown keeps evidence first.** Add a first step to `sp_teardown`, before step 1 (clones) and before the tracked-files pass, since `write-protection.debug.log` is `sp_track`ed. For each record whose leg `sp_leg_nonpass` names:
  - create the evidence directory once, with an explicit template: `mktemp -d "${TMPDIR:-/tmp}/sandbox-probe-evidence.XXXXXX"`. macOS ignores `TMPDIR` without one (`docs/sandbox-verification.md` §5 F2).
  - refuse to use it if its canonical path is inside `SP_MAIN` or `SP_CLONE`: say so on stderr and keep nothing.
  - `mv` each existing file in the record into `<dir>/<leg>/`, creating the leg directory as needed.
  - leave a passing leg's records alone, for the existing SP_TMP removal.
  - after the step, as teardown's **last** stderr line (after `sp_snapshot_check`), print `sandbox-probe: evidence of the legs that did not pass kept in <dir>`. Print nothing when nothing was kept.
  - a failed move is named on stderr with `sp_refuse` and does not change the exit code. SP_TMP's removal still removes the file, so nothing is left behind.
- [ ] **`sp_track_pid <pid>`.**
  - It registers a process the probe started (digits only; anything else is refused).
  - Teardown, after the evidence step and before the clones, sends each one `kill` (TERM). It waits, bounded by a stated count of short polls, for `kill -0` to fail. If the process is still alive after the bound, teardown names it with `sp__td_fail` (exit 5) and the command to stop it by hand.
  - A process already gone is not an error.
- [ ] **`sp_extra_clone`'s registration test.** Replace `printf '%s' "$SP__TRACKED_BRANCHES" | grep -qxF -- "$branch"` with a pipe-free whole-line match: `case $'\n'"$SP__TRACKED_BRANCHES" in *$'\n'"$branch"$'\n'*)`. Its refusal text is unchanged.
- [ ] **The entry point.**
  - In `scripts/sandbox-probe.sh`'s `run` loop, set `SP_CURRENT_LEG="$sp_leg"` before calling the leg function (or `sp_leg_missing`), and clear it after.
  - Add one line to the header and to `usage()`: the directory that keeps the evidence of non-passing legs is printed last on stderr.
  - Beside that header line, amend the header sentence `# It changes nothing outside its own temp area, the probe clone and the probe branch.` to name the one exception: the evidence directory under `TMPDIR`, kept only when a leg does not pass and printed last. Task 1 makes the same correction to Gate 15's sentence in `docs/development.md`.
  - The exit map is unchanged.
  - Update `session.sh`'s header API list with `sp_keep_file`, `sp_track_pid` and the teardown's new first step.

**Verification:**

- `grep -nE '\| *grep' scripts/lib/sandbox-probe/session.sh` finds nothing.
- The evidence step sits in `sp_teardown` above the `hr_clone_remove_var` loop and above the tracked-files `rm -f` pass.
- The only recursive removal in the probe is still `sp_rm_tree`'s: `grep -n 'rm -rf' scripts/lib/sandbox-probe/*.sh` shows that one line.
- `bash scripts/sandbox-probe.sh --help` prints the new line, and its exit-code lines are unchanged.
- `grep -n 'nothing outside its own temp area' scripts/sandbox-probe.sh` shows the header sentence naming the kept evidence directory as its one exception.

**Deviations from plan:**

- The header's amended sentence and its new "printed last on stderr" line are written as one three-line comment, so that the grepped line names the evidence directory itself (`…, but one evidence directory:`).
- Things the plan leaves open, and how they were settled. An `sp_keep_file` record is `<leg>\t<path>`. Records whose leg is `-`, `.`, `..` or carries a `/` are never kept. A file whose name is already taken in `<dir>/<leg>/` is moved as `<name>.2`, `<name>.3` and so on. If no file was moved, the evidence directory is removed with `rmdir` and nothing is printed. When the directory is refused (no canonical path, or inside `SP_MAIN` / `SP_CLONE`), it is removed with `rmdir` and nothing is moved. A `kill` that fails (the process is already gone, or is not ours) counts as gone. The wait bound is `SP__PID_POLLS=50` polls, 0.1 s apart.
- Evidence downgrade, `bash -n` on `session.sh`: the plain command was refused by the tool layer. Parse evidence comes from two runs. `bash scripts/typecheck.sh` printed `check-shell-parse: 89 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and `PASS: typecheck`. `bash scripts/sandbox-probe.sh --help` sources `session.sh` and printed the full usage, including the new line.
- Evidence downgrade, `kill -0` after TERM: a `bash -c` check of whether `kill -0` succeeds on a TERMed background child that bash has not yet reaped was refused by the tool layer. The PID step rests on bash reaping its children through its SIGCHLD handler, and nothing in this unit ran to confirm that. Task 12's tracked-PID case is the behavioural test.
- Evidence downgrade, evidence step and PID step: neither has been run. The plan's `**Verification:**` bullet on step order was checked by reading the line numbers `grep -nE` reported (`sp__td_keep_evidence` and `sp__td_stop_pids` come before `hr_clone_remove_var` and the tracked-files `rm -f`). Behaviour is Task 12's.
