### Task 8 — Take T3 through Phase G's launcher spelling, and stop its post-session wait on a stale heartbeat

**Goal:** On Linux, the probe's `gates` leg takes T3 the way an autonomous run now takes Run gates. The session issues the main checkout's launcher, `bash <main>/<scripts_dir>/launch-sandboxed-gates.sh <clone> sbx_probe_t2`, and collects the round with the clone's own repo-relative `--wait`, as G.1 step 3 does.

- **Grading.** T3 is graded as T2 is, from the lane's `.verdict` and `.log`, once the launcher's call printed `pending`. Any other launcher answer is `not run`, quoted.
- **The wait.** The post-session wait stops once the worker's heartbeat has gone stale, instead of waiting 1800 s on a `.running` a dead worker left. That is the second Linux run's T3 evidence.
- **The PID.** The worker's `.running` now holds a PID inside the launcher's namespace, so the probe no longer tracks it as a host PID.

T2, the macOS row, does not change.

**Depends on:**

- **Task 2,** the launcher's contract: `launch-sandboxed-gates.sh <target> <label>` prints `pending` (exit 3), `in-session` (exit 4), or one refusal line on stderr (exit 2). Its run writes the same lane files as the run form's worker. `.running` holds the PID inside the launcher's own namespace, and its mtime, refreshed every second, is the heartbeat.
- **Task 6,** Phase G's autonomous spelling, `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh <repo_root> <label>`, which T3 mirrors with `<MAIN_REPO>` = the probe's main checkout and `<repo_root>` = the probe clone.
- **Task 7,** which puts `scripts/launch-sandboxed-gates.sh` in the main checkout.

This task changes only the probe. The tests for its new functions are **Task 12's**. The leg's `--list` text is **Task 10's**.

**This is a catch-all task** (`path` `"."`). The probe sits under `scripts/`. Its implementer reads every configured layer's conventions document.

### Targets

- `scripts/lib/sandbox-probe/legs-local.sh`: its header comment, `sp_leg_gates`' T2/T3 block, a new `SP_T2_STALE_SECONDS`, and two new grading helpers.

**Work:**

- [ ] **The T3 spelling, on the T3 row only.** `sp_leg_row_for T2 T3` returns `T3` on Linux. On that row:
  - build `cmd` as `bash $SP_SCRIPTS/launch-sandboxed-gates.sh $SP_CLONE $SP_T2_LABEL`, where `SP_SCRIPTS` is the main checkout's scripts directory `session.sh` already sets;
  - keep `wait_cmd` as the repo-relative `bash $scripts_rel/run-test-suite.sh --wait $SP_T2_LABEL`;
  - refuse the row `not run`, naming the reason, when `sp__ctl_literal clone "$SP_CLONE"` or `sp__ctl_literal "main scripts directory" "$SP_SCRIPTS"` fails.

  The prompt's one exception to *"do not retry"* is unchanged. T2's `cmd`, `wait_cmd` and prompt stay byte-identical: the macOS legs do not change.
- [ ] **`sp__t3_grade <stream> <launch command> <verdict file> <log file>`** (new).
  - It calls `sp__t2_grade` with its four arguments unchanged, then reads the launch call's first output line through `sp__first_line "$(sp__local_text)"`. Read it before any later judge call.
  - When that line is `pending`, keep the verdict and prefix the evidence with `the launcher answered pending; `.
  - When it is anything else, and the call ran, set `SP_VERDICT="not run"` with the evidence `the launcher answered '<line>', not pending, so no sandboxed gate run was started: ` followed by `sp__t2_grade`'s evidence. A call that did not run keeps `sp__t2_grade`'s `not run`.

  Grade the T3 row through it, and T2 through `sp__t2_grade` as today.
- [ ] **`sp__t2_lane_state <has verdict 0|1> <has running 0|1> <running mtime> <now> <stale seconds>`** (new, pure arithmetic). It prints `verdict` when the first argument is `1`; else `gone` when the second is `0`; else `live` when `now - mtime` ≤ `<stale seconds>`; else `stale`. A non-numeric mtime or now reads `stale`.
  - Add `SP_T2_STALE_SECONDS=30` beside the leg's constants. Its comment declares it a mirror of `run-test-suite.sh`'s `STALE_SECONDS`.
  - **On the T3 row only**, change the post-session wait in three ways:
    - track no PID read from `.running`. The comment says why: it is the launcher's namespace PID, never a host one;
    - loop while `sp__t2_lane_state` with `hr_lane_mtime "$lane.running"` and `date +%s` prints `live`, bounded by `SP_T2_COLLECT_SECONDS` as today;
    - leave on `stale` with the note `the gate worker's heartbeat on .running went stale (older than ${SP_T2_STALE_SECONDS}s) ${waited}s after the session, without a verdict`.
  - T2's loop, its PID tracking and its notes stay byte-identical.
- [ ] **The header.** Rewrite the T3 sentence of `legs-local.sh`'s header to say what T3 now does: Phase G's launcher spelling, the `pending` precondition and its `not run`, the untracked namespace PID, and the stale-heartbeat stop. Add the two new functions to *THE GRADING FUNCTIONS*, with their signatures as above.

**Verification:**

- `bash scripts/typecheck.sh` passes. Its shell-parse gate covers this file under the Bash 3.2 floor.
- `git diff -- scripts/lib/sandbox-probe/legs-local.sh` changes no line that T2's path alone executes. Read every hunk: each new branch is guarded by the row being `T3`, or lives in a new function.
- `bash scripts/sandbox-probe.sh --list` still prints the `gates` leg with rows `T2,W7,T3`.

- **Deviations from plan:**
  - `sp__t3_grade` reads the launcher's answer through `sp__message_line`, stripping its `Exit code <n>: ` prefix, rather than through `sp__first_line` alone. The launcher prints `pending` with exit 3 (`scripts/launch-sandboxed-gates.sh` → `echo pending` / `exit 3`), and the Bash tool opens a non-zero result on a bare `Exit code 3` header (`scripts/lib/sandbox-probe/judge.sh` → `sp__message_line`, PD18), so `sp__first_line` would read `Exit code 3` and grade every T3 run `not run`. `sp__output_line` (`legs-runner-isolation.sh`) does the same skip but sits outside the files a grading function may call.
  - "Read it before any later judge call" holds by order: `sp__t2_grade` judges only the launch call, so `SP__TEXT` is still that call's text when `sp__t3_grade` reads it after.
  - The T3 wait's `.running`-already-stale case at the session's end is noted even with `waited` 0; the other three end states are noted only once the wait ran, as T2's are. Two existing lines changed outside a new function: the wait's `if` became `elif` behind the new `if [ "$row" = T3 ]` branch, and the `sp__t2_grade` call is re-indented inside an `if [ "$row" = T3 ]` / `else`. Neither changes what T2 executes.
  - Evidence downgrade: the pure helpers (`sp__t2_lane_state`, the `Exit code 3\npending` parse) were not exercised — the direct `bash -c` call that sourced the file was refused at the permission layer ("Permission to use Bash has been denied"), and a `.sh` probe cannot go through `scratch-run.sh`. Their correctness rests on reading the code, plus `bash scripts/typecheck.sh` (shell parse under `/bin/bash` 3.2.57: 106 files, 0 failed; `PASS: typecheck`). Task 12's tests cover them.
