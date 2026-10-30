### 1. A stall kill inside a job leaves placeholder leftovers that break the rest of that job, because the manifest and the sweep skip job mode

**File:** `cli/templates/scripts/autonomous-watcher.sh` — `placeholder_sweep_pass` ("`[ "$JOB_MODE" != "1" ] || return 0`"), `spawn_engine` ("`if [ "$JOB_MODE" = "1" ]; then`" / "`settings_file="$SETTINGS_PROFILE"`" and "`if [ "$JOB_MODE" != "1" ] && [ "$HR_PLACEHOLDER_HOST" = "1" ]; then`"), `check_stalled_runs` (the KILL tier's "`A tree killed by `-9` leaves its placeholders on disk`" block and its "`if [ "$JOB_MODE" != "1" ]; then`"), `run_job` ("`# Reap every session subshell this job spawned`"), `placeholder_start_recover` ("`[ "${HARNESS_JOB_MODE:-}" != "1" ] || return 0`"), and the header paragraph "`On a placeholder host a killed session's leftovers break these reads`" plus the `JOB MODE` block. Also `cli/templates/scripts/lib/harness-run-lib.sh` — `hr_run_profile_absent_file` / `hr_run_profile_absent_files` ("`hr_run_profile_absent_files <repo slug> — print every existing manifest`") and the lane comment "`THE THREE CEILINGS ARE THE ONLY ENVIRONMENT VALUES THAT CARRY POLICY HERE`". Tests: `cli/test/watcher-placeholder-host.test.mjs`, `cli/test/placeholder-sweep-lib.test.mjs`, `cli/test/watcher-remote-job.test.mjs` (`jobEnv`).

**What the code does today.** Every placeholder step is turned off in job mode:

- `placeholder_sweep_pass` returns at once when `JOB_MODE` is 1.
- `spawn_engine` takes the job arm (`settings_file="$SETTINGS_PROFILE"`). It never calls `hr_placeholder_host_probe_var` there, so the manifest block, gated on `"$JOB_MODE" != "1"`, writes nothing.
- The KILL tier's wait-and-sweep block is gated on `"$JOB_MODE" != "1"`.
- `placeholder_start_recover` returns when `HARNESS_JOB_MODE` is 1.

A job passes the base profile. Its exact `denyWrite` entries include the checkout's absent `.mcp.json`, `.claude/settings.local.json` and a `.git` at each `<scriptsDir>` level (`cli/src/generators/writeProtection.ts` → `protectedPaths`). A `kill -9` from the stall watchdog therefore leaves those paths behind as `-r--r--r--` empty files. The user named what follows: `hr_wrapper_main_of` then refuses for the rest of the job, so the resumed session's `commit-on-branch.sh` and the post-session `push-branch.sh` both refuse.

**A second failure the user did not name, derived from the code.** The leftover breaks the watchdog's own recovery before the resumed session ever runs:

1. In job mode the recovery calls `hr_run_reset_var`.
2. That function runs `hr_run_surface_check_var "$HR_RUN_COPY_TIP" reset`.
3. In `reset` mode the check adds `hr_run_worktree_diff_var`. That compares the working tree on `hr_run_protected_rel_paths` against the tip and counts untracked and ignored files (`ls-files --others`). The protected set includes `.mcp.json` and `.claude/settings.local.json`.
4. So an untracked leftover `.claude/settings.local.json` makes the reset return 1 with "`the protected surface differs …`". `check_stalled_runs` then gives the run up as `failed`: "`the reset was refused`".

So the sweep has to run before `hr_run_copy_check_var` and the reset in job mode as well. That is where it already runs outside job mode. This is derived, not measured: a job-mode-shaped session is `docs/sandbox-verification.md` CS6, which is owed.

**How the user's suggestions held up against the code:**

- **Manifest under `$RUNNER_TEMP`: kept.** The machine lane is off in a job, and a hosted runner's lane directory would not outlive the job. `$RUNNER_TEMP` lasts for the whole job, including the post-session steps, and the runner empties it at the start and end of each job. It is outside every root the job's session can write:
  - the checkout, which is cwd and `--add-dir`;
  - `<checkout>/<stateDir>`, which is `--add-dir`;
  - the plugin roots from `permissions.additionalDirectories`, which `spawn_engine` adds as `--add-dir`. One of those, `$RUNNER_TEMP/harness-marketplace`, sits under `$RUNNER_TEMP`, so the manifest directory must be a sibling of it and never under it.
- **Sweep in the KILL tier: kept.** Also needed at two more points: the head of `spawn_engine`'s job arm, which covers every in-job relaunch, and `run_job`'s exit, which covers a watchdog give-up before the `Push the branch` step. The session's start on a fresh checkout needs no sweep, because no session has run yet. A post-session sweep for a job whose watcher was itself killed (a `stop` cancel or a step timeout) is **Finding 2**.
- **Launch check in job mode: not added — it does not apply.** The route omits the trio (`.git/commondir`, `.git/config.worktree`, `.git/objects/info/http-alternates`) only from a **clone's per-run copy**, and job mode renders no per-run copy. The base profile carries the trio rows only under the sibling-run-copy glob, which names no path in a job's checkout. The job's run copy is its main checkout, whose **whole** `.git` is an exact `denyWrite` directory entry (`protectedPaths` → "`objects reach it only through sync-in's fetch`"). That directory exists, so bubblewrap mounts no placeholder for it, and a sandboxed write of any trio file under it stays refused. CS6's expected *"`git add <file>` refused with `Operation not permitted` under `<job>/.git`"* is the owed measurement of that. `hr_run_copy_check_var` on a job takes the main-checkout arm, which has no clone condition 3 to apply, and `hr_wrapper_main_of` already refuses a `commondir` in a main `.git`. Leave `spawn_engine`'s job arm without the launch check.
- **A job-mode case in `watcher-placeholder-host.test.mjs`: kept** (Tests, below).
- **Docs and the story index: kept.** That work is **Finding 3**.

**Fix:**

- [ ] **Library: the job manifest's location** (`cli/templates/scripts/lib/harness-run-lib.sh`, beside `hr_run_profile_absent_file`):
  - Add `hr_job_absent_file <branch>`. It prints `${RUNNER_TEMP%/}/autonomous-sdlc-harness-placeholders/<hr_sanitize_branch branch>.absent`.
  - It returns 1 and prints nothing when `RUNNER_TEMP` is empty, is not absolute, or the branch fails to sanitize. It creates nothing.
  - Give the manifest listing one home, without copying `hr_run_profile_absent_files`' glob loop. Factor the loop so it takes the path a `*` branch yields, and have both the local and the job listing call it. Name the job one `hr_job_absent_files`.
  - Add `RUNNER_TEMP` to the comment that lists the file's location-anchor environment reads (`XDG_STATE_HOME`, `HOME`, …), and state there that only job mode reads it.
- [ ] **`spawn_engine`, the job arm:**
  - Call `hr_placeholder_host_probe_var` in the job arm too.
  - On a placeholder host, make `placeholder_sweep_pass "$branch" 0` the arm's first statement after the probe. This covers the initial launch, `job_auto_resume`, `resume_paused_runs`' usage-wait resume and the stall resume.
  - Do not add the launch check (see above).
- [ ] **`spawn_engine`, the manifest write in job mode:**
  - Widen the manifest block from local-only to both arms on a placeholder host.
  - The path is `hr_job_absent_file "$branch"` in job mode and `hr_run_profile_absent_file …` otherwise, chosen in one place.
  - The paths are every `denyWrite` string of `$settings_file` that carries no `*` (the same `jq`), plus `.mcp.json` under **every** `--add-dir` root the launch line passes. In job mode that includes each `extra_dir_args` root, so place the job write after `extra_dir_args` is built, or read the same list.
  - Refuse to write, with one `log` line and without refusing the launch, when the manifest path is under the checkout or under any `--add-dir` root. Compare canonical (`cd -P … && pwd -P`) paths, so a session-writable manifest is never read.
  - An unset `RUNNER_TEMP` logs `placeholder manifest: no path for '<branch>' — the next sweep removes nothing for this session`, the existing line, and launches.
- [ ] **`placeholder_sweep_pass`:**
  - Remove the job-mode early return.
  - In job mode, read the manifests through `hr_job_absent_files` rather than `placeholder_manifests_var "$HARNESS_REPO_SLUG"`. Branch inside `placeholder_manifests_var` so the sweep body stays one copy.
  - The live gate is unchanged. In a job, `running_count` counts the job's own record only.
  - Update its comment's first line, which says *"outside job mode"*.
- [ ] **`check_stalled_runs`, KILL tier:**
  - Drop the `[ "$JOB_MODE" != "1" ]` wrapper around the wait-for-exit loop and `placeholder_sweep_pass "$b" 0`, so the job's watchdog sweeps once the killed tree has exited. That is before `hr_run_copy_check_var`, `stall_job_surfaces_ok` and `hr_run_reset_var`.
  - Keep the placeholder-host gate.
  - Update Task 11's deviation comment if one names job mode.
- [ ] **`run_job`, at its exit:**
  - Directly after the `wait` that follows the supervision loop, and before `job_write_status`, call `placeholder_sweep_pass "" 0`. The probe gate is inside it.
  - This removes what a session the watchdog gave up on, or one that crashed, left behind, before the workflow's `Push the branch` step runs. By then the session has been reaped, so the live gate reads 0.
- [ ] **`placeholder_start_recover` in job mode:**
  - Let it run when `HARNESS_JOB_MODE` is 1 and the subcommand (`${1:-}`) is a job-mode one. It reads the manifests through `hr_job_absent_files` instead of the slug's run-profile directory.
  - Its job-mode trigger is the same `hr_main_repo "$SCRIPT_DIR"` failure. Its gate is the same `hr_registry_live_count` on the checkout's registry, and its output lines are the same.
  - A `job` start meets a fresh checkout, so this costs one `hr_main_repo` call there. It exists for Finding 2's post-session entry. Make it reachable here so Finding 2 adds no second copy.
- [ ] **Header:** rewrite the paragraph "`On a placeholder host a killed session's leftovers break these reads`" so it names the job-mode points:
  - the head of `spawn_engine`'s job arm;
  - the KILL tier;
  - `run_job`'s exit;
  - the job-mode start-up recovery;
  - the manifest's `$RUNNER_TEMP` location, with why the lane is not used.

  Add one bullet to the `JOB MODE` block saying the manifest and the sweep run there, without the launch check or the cap, and why. Keep `effective_max_parallel_runs` job-mode-free: the cap still does not apply in a job.
- [ ] **Tests** — `cli/test/watcher-placeholder-host.test.mjs`. Extend the header's rule with the job half: *in a job the watcher records what was absent under `$RUNNER_TEMP` and removes those leftovers before the watchdog's recovery and before the job ends*. Drive each job case through a pass script that:
  1. sources the watcher;
  2. enters job mode as the `job` entry does. Prefer factoring the `if [ "${1:-}" = "job" ]` block's body into one function that the entry and the pass script both call, so the test does not restate the forced-off list;
  3. installs the probe override answering `1`, unless the case says otherwise;
  4. points `RUNNER_TEMP` at a fixture directory;
  5. calls `run_job`.

  The cases:
  1. **Stall in a job.** A sleeping stub, `STALL_WARN_SECS=1`, `STALL_KILL_SECS=2`. Once the manifest under the fixture `RUNNER_TEMP` exists and the stub is live, create `0444` empty `<checkout>/<scriptsDir>/.git` and `<checkout>/.claude/settings.local.json`. Assert:
     - both files are gone;
     - `placeholder sweep: removed` names each;
     - `stall_restarts` is 1 and the resumed session was launched (the stub's second recorded prompt carries the pause-resume clause);
     - the run did not end with `the reset was refused`;
     - nothing was written under the fixture's `XDG_STATE_HOME`.
  2. **Give-up, then the exit sweep.** `STALL_MAX_RESTARTS=0`, with the same leftovers. After the job exits, both files are gone, and `hr_wrapper_main_of "<checkout>/<scriptsDir>"` (library sourced) prints the checkout.
  3. **Content kept.** A planted `<checkout>/<scriptsDir>/.git` with content is kept and logged with `has content`.
  4. **Seam off.** With the probe answering `0`, no manifest is written under `RUNNER_TEMP` and the leftovers stay.
  5. **No `RUNNER_TEMP`.** On a placeholder host with `RUNNER_TEMP` unset, the job launches, logs the `placeholder manifest: no path` line and writes no manifest.
- [ ] **Tests** — `cli/test/placeholder-sweep-lib.test.mjs`:
  - `hr_job_absent_file` prints the path under an absolute `RUNNER_TEMP`, and returns 1 with no output for an empty one and for a relative one;
  - `hr_job_absent_files` lists only regular, non-link `.absent` files there.
- [ ] **Tests** — `cli/test/watcher-remote-job.test.mjs`:
  - `jobEnv` sets `RUNNER_TEMP` to a directory inside each fixture. Its cases run the script directly, with no probe override, so on a Linux host the real probe answers `1` and the job now writes a manifest. This keeps that write inside the fixture, and never in a CI runner's real `$RUNNER_TEMP`.
  - Add one header sentence saying so.
  - The cases' assertions do not change.

- **Deviations from plan:**
  - `RUNNER_TEMP` in `watcher-remote-job.test.mjs` → `jobEnv`, and in the new `job:` cases, is a fixture-owned **sibling** of the checkout (`${w.dir}-runner-temp`, removed in `t.after`), not a directory inside it: a manifest path under the checkout is exactly what the new canonical-path refusal in `spawn_engine` declines to write, so a directory inside the fixture would test the refusal instead of the write. It still keeps every write out of a CI runner's real `$RUNNER_TEMP`.
  - `placeholder_manifest_writable_root` resolves a `~/` `--add-dir` root under `HOME` and any other relative one under the working copy before comparing, as the session resolves them; a root that still cannot be made canonical counts as containing the manifest (closed). The plan named only the canonical comparison.
  - The job-mode trigger reaches `placeholder_start_recover` as an argument (`placeholder_start_recover "${1-}"`) and `placeholder_manifests_var` takes `<job 0|1> <slug>`, because the start-up recovery runs before `JOB_MODE` is assigned.
  - Test case 2 (`STALL_MAX_RESTARTS=0`) as specified is swept by the KILL tier before the give-up, so it cannot show the `run_job` exit sweep on its own. Added case `job: (2b)`: a session that plants both leftovers and exits 2 with automatic resumes off, which only the exit sweep can clear. Case 3 and case 4 plant through the same session body instead of a stall.
  - Evidence downgrade: no red-once mutation run was made for the new `job:` cases; they were run green only (`npm test --workspace cli -- test/watcher-placeholder-host.test.mjs`: tests 22, pass 22, fail 0, on Darwin with the probe overridden). `watcher-remote-job.test.mjs` ran green on Darwin (tests 63, pass 63), where the real probe answers 0, so its job-mode manifest write under the new `RUNNER_TEMP` was not exercised there; a Linux host exercises it. The job-mode branch of `placeholder_start_recover` has no case of its own (the plan asks for none; Finding 2 adds its caller).
