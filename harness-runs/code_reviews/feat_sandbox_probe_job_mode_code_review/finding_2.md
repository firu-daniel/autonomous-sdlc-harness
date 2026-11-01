### 2. Job mode overwrites the placeholder manifest before every session and never sweeps between sessions, so an earlier session's placeholders stay in the adopted checkout

**File:** `scripts/lib/sandbox-probe/job.sh` (`sp_job_manifest_write`) — "manifest=\"$(RUNNER_TEMP=\"$SP_JOB_RUNNER_TEMP\" hr_job_absent_file \"$SP_BRANCH\")\"". Its caller is `scripts/lib/sandbox-probe/session.sh` (`sp_session`) — "sp_job_manifest_write \"$settings\" \"$cwd\"".

**Problem.** On a placeholder host (Linux, so every runner leg), `sp_session` calls `sp_job_manifest_write` before each job-mode session. That function always writes the same per-branch file, `hr_job_absent_file "$SP_BRANCH"`, through `hr_placeholder_manifest_write`. `scripts/lib/harness-run-lib.sh` → `hr_placeholder_manifest_write` keeps only the paths that are absent at write time (`if [ ! -e "$p" ] && [ ! -L "$p" ]; then printf …`) and replaces the file (`mv -f "$tmp" "$manifest"`). The only sweep is in `sp_job_teardown`, after the last session.

So:

- Session A leaves a bubblewrap placeholder at an absent `denyWrite` path P. That placeholder outlives the session: `docs/sandbox-verification.md` §5 **F9**.
- Before session B, the manifest is rewritten. P now exists, so the new manifest leaves it out.
- At teardown, `job-sweep` reads only the last manifest. P is never removed and stays in the adopted checkout after the probe, which breaks the "leaves the checkout as it found it" promise in `cli/test/sandbox-probe-job-mode.test.mjs`. The same holds for a local `run --job` in the Linux container.
- Every session after A also runs in a checkout carrying A's placeholders. A real job never presents that state, and F9 showed such placeholders break git in the working copy. The `wrappers`, `planted-files` and `job-layout` legs read git state there.

The watcher does not have this gap. `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine` sweeps before it writes each spawn's manifest, in job mode too: in the `if [ "$JOB_MODE" = "1" ]; then` arm, `placeholder_sweep_pass "$branch" 0` runs before `settings_file="$SETTINGS_PROFILE"` is set. Job mode exists to reproduce the job rather than approximate it, and `job.sh`'s header mirrors only the job's after-run sweep, not this pre-spawn one.

**Fix.** Run the job's own sweep before every job-mode manifest write, as `spawn_engine` does before every spawn.

1. In `scripts/lib/sandbox-probe/job.sh`, add `sp__job_sweep <label>`. It runs the command `sp_job_teardown` step 1 runs today: `cd "$SP_MAIN" && HARNESS_JOB_MODE=1 RUNNER_TEMP="$SP_JOB_RUNNER_TEMP" bash "$SP_SCRIPTS/autonomous-watcher.sh" job-sweep "$SP_BRANCH" </dev/null 2>&1` in a command substitution. It prints each non-empty output line through `sp_refuse "<label>: $line"` and returns the sweep's exit status.
2. In `sp_job_teardown` step 1, replace the inline command substitution and its `while … sp_refuse "job-sweep: $line"` loop with `sp__job_sweep job-sweep; rc=$?`. Keep the `git status` line and the `sp__td_fail` line exactly as they are, so teardown's output does not change.
3. In `sp_job_manifest_write`, right after the `[ "$SP_JOB_PLACEHOLDER_HOST" = 1 ] || return 0` line, add:

   ```bash
   # spawn_engine sweeps before every spawn, so a placeholder an earlier session left is removed before
   # this session's manifest is taken; without it, the next manifest omits that path and nothing sweeps it.
   local sweep_rc
   sp__job_sweep "job-sweep before this session"
   sweep_rc=$?
   [ "$sweep_rc" -eq 0 ] || sp_refuse "job-sweep before this session exited $sweep_rc"
   ```

   A failed pre-session sweep does not stop the session. The watcher's `placeholder_sweep_pass` returns 0 whatever happened.
4. In `job.sh`'s header, change the `sweep` mirror line so it lists both callers: `the job's Sweep the sandbox placeholders step at teardown, and spawn_engine's placeholder_sweep_pass before every spawn, both as HARNESS_JOB_MODE=1 autonomous-watcher.sh job-sweep <branch> (job_sweep)`. In the `sp_job_manifest_write` entry, add `first runs the job's sweep (sp__job_sweep)`.
5. In `scripts/lib/sandbox-probe/session.sh`'s header, in the `sp_session` entry, the sentence "In job mode it first writes job.sh's placeholder manifest." is wrapped across two comment lines, so a literal search for it finds nothing. Locate it by its second line, "mode it first writes job.sh's placeholder manifest. Every @SP_AGENT_PID@ in", and replace that one line with these two, keeping the 28-space indent after `#`:

   ```bash
   #                            mode it first sweeps the job's placeholders and writes job.sh's placeholder
   #                            manifest. Every @SP_AGENT_PID@ in
   ```

   The line before it, ending "sets SP_STREAM. In job", and the line after it, starting "the prompt or an --allowed rule", stay as they are.
6. In `docs/development.md` → **Gate 15**, change "before each session on a placeholder host the probe writes the job-mode manifest the watcher writes" to `before each session on a placeholder host the probe runs the job's sweep, as the watcher does before each spawn, and then writes the job-mode manifest the watcher writes`.
7. In `cli/test/sandbox-probe-job-launch.test.mjs` → `test('the job-mode placeholder manifest', …)`:
   - In `lists exactly the absent deny paths and the absent .mcp.json` and `a runner temp under a root: no file, one line saying so`, read the probe's lines through `probeLines(run.stderr).filter((l) => !l.startsWith('sandbox-probe: job-sweep before this session: '))` before asserting them. The pre-session sweep now logs through the real watcher.
   - In `no watcher under SP_SCRIPTS: no file, one line saying so`, apply the same filter. Then expect `sandbox-probe: job-sweep before this session exited 127` (what `bash` returns for a script that does not exist) ahead of the existing manifest line.
   - Add a case `a placeholder an earlier session left is swept and listed again`. In one sourced body, call `sp_job_manifest_write` once, create an empty regular file at `m.absentOne` (`: > <absentOne>`), then call `sp_job_manifest_write` again. Assert that `m.absentOne` no longer exists and that the manifest at `manifestAt(rt)` still lists `m.absentOne` on its first line.

   That suite is the file the fix edits, so it is the test file the fix runs.
