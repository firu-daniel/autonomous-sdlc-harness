# Task plan review — iteration 2

Iteration 1's two Must Fix findings are resolved. Task 11 now sweeps ahead of each reader that a leftover breaks: at the pass start (`tick`, before `check_stalled_runs`), in the KILL tier before the give-up conditions and the recovery's `hr_run_copy_check_var`, in `process_inbox_file` before `create-worktree.sh`, and at the head of `spawn_engine`. It also adds the start-up recovery ahead of `MAIN_REPO="$(hr_main_repo "$SCRIPT_DIR")"`, with test cases for each. Iteration 1's Should Fix items are also addressed:
- Task 4 now prints the enforced cap, after the `keep-awake:` line.
- Task 9 states the person's-own-session residual.
- Task 6's header and usage now say what `sweep` changes.

The scope register's command was re-run from the checkout root. It prints `cli/templates/claude/settings.autonomous.json`, `docs/cli.md`, `docs/sandbox-verification.md`, `docs/watcher.md` and `examples/notes-app/.claude/settings.autonomous.json`, and every one is a row.

## Must Fix

1. **Job mode on Linux is left out of the recovery, the plan does not list it as an unmet goal, and Task 9 would record a false statement about it** (`task_9_plan.md`, the **Job mode** item of the new **Linux placeholders** residual; plus the route bullets in `## Context` of `fix_linux_sandbox_deny_placeholders_story_plan.md`)
   The plan leaves job mode out of every new behaviour:
   - Task 4: "Job mode is untouched on every host".
   - Task 11: `placeholder_sweep_pass` "does nothing in job mode", and `placeholder_start_recover` runs only when `HARNESS_JOB_MODE` is not `1`.

   Task 9 then gives the reason it would publish in `docs/cli.md` §6: *"**Job mode** keeps the base profile, which has no exact run-copy entries. How placeholders behave there is not measured."* That is not what the tree says:
   - A job's run copy **is** its main checkout (`autonomous-watcher.sh` → header `JOB MODE`: *"the run copy is the main checkout"*; `docs/cli.md` → *"A remote job passes the base profile, checked"*).
   - The job generates its base profile for its own checkout path with `init --plugin-root-entries` (`docs/remote-execution.md` → **The permission profile.**). So the job's session runs under exact `denyWrite` entries for that checkout's `.mcp.json`, `.claude/settings.local.json` and a `.git` at each `scriptsDir` level (`docs/cli.md` §6, the protected-set paragraph). All of these are absent in a fresh checkout.
   - These are the same entries as the measured **"Absent, in the main checkout"** row: after a `SIGKILL`, each is left behind as a `-r--r--r--` empty file, and the leftover `<main>/scripts/.git` makes `hr_wrapper_main_of` return 1.
   - Job mode runs only on Linux GitHub-hosted runners, under bubblewrap (`docs/remote-execution.md` → *"GitHub-hosted runners that work"*). It runs the same stall watchdog, which kills with `-9` and resumes inside the same job (`autonomous-watcher.sh` → header `JOB MODE`: *"stall watchdog and usage gate a local run gets"*).

   So by the measured mechanism, a job-mode stall kill leaves `<checkout>/<scriptsDir>/.git` on disk. After that, the resumed session's `commit-on-branch.sh` refuses with *"cannot place this script in a main checkout"*, and so does the job's unsandboxed post-session `push-branch.sh` step. That is exactly the case the prompt's goal rules out: *"a run that a killed or crashed session does not break: the next launch or resume finds no placeholder left behind in the main checkout or the run copy, or is not affected by one"*. The prompt also requires the interim position to *"state what an adopter on Linux can and cannot run"*, and a remote run is something an adopter runs on Linux. Under `.claude/context/conventions.md` → `## Documents of record`, Task 9 cannot record "no exact run-copy entries" and "not measured" when the base names the job's own checkout by exact path and the container measurement covers those entries.
   **Fix:** Either:
   - **(a)** Extend the recovery to job mode. In `task_4_plan.md` and `task_11_plan.md`: write the job's manifest somewhere a job can write (for example under `$RUNNER_TEMP`, since the machine state directory is off in job mode); run the sweep in the job-mode stall watchdog's KILL tier, before its reset and resume; and add a job-mode case to `watcher-placeholder-host.test.mjs`.
   - **(b)** Keep job mode out, but say so truthfully. In `task_9_plan.md`, replace the **Job mode** item with a derived (not measured) statement:
     - the job's base profile names its own checkout's `.mcp.json`, `.claude/settings.local.json` and `<scriptsDir>/.git` as absent exact paths;
     - a job-mode stall-watchdog kill therefore leaves them on disk, and the leftover `<scriptsDir>/.git` makes `commit-on-branch.sh` and the post-session `push-branch.sh` refuse for the rest of that job;
     - give the remedy, and say what lifts it.

     Then add a bullet to the index's `## Context` naming this as a goal case the route does not meet, with the reason.

## Should Fix

1. **The pass-start sweep logs a kept path on every poll** (`task_11_plan.md`, `placeholder_sweep_pass`)
   Quiet mode (`<quiet>` = `1`) suppresses only the skip line. Suppose a path a manifest recorded as absent later becomes a real file. For example, an adopter adds `<main>/.mcp.json` with content after a run's manifest was written. Then every pass writes `placeholder sweep: kept <main>/.mcp.json: has content` once per `POLL_INTERVAL_SECS`, until `cleanup-merged-worktrees.sh` deletes that manifest, which happens only at merge. Either make the pass-start call quiet for `kept` lines too, while the other three call sites stay loud, or log each kept path once per watcher process.

2. **The machine-footprint "no cell differs in VALUE" statement goes stale** (`task_4_plan.md`)
   `cli/src/doctor/checks.ts` → `footprintRow`'s comment says that, between `doctor`'s row and `machine_footprint_report`'s, *"no cell of either row differs in VALUE"*. On a bubblewrap host, Task 4's `cap=$RUN_CAP` makes the watcher's own-repository cell `1` while `doctor` prints the inherited default. Have Task 4 (or Task 9 for `docs/watcher.md` §7) state the clamp where that difference is described.

3. **Two self-verification commands would fail on text the same task plans** (`task_1_plan.md`, `task_8_plan.md`)
   - Task 1's `git grep -n 'bubblewrapDenyWrite' -- cli/src` expects "nothing else", but the task's own second Work bullet writes `bubblewrapDenyWrite` into the module header's mirror bullet. Allow for that hit.
   - Task 8's last Verification bullet requires every quoted message in the new §0 block to be found by `grep -F` in the task prompt. But the `config.worktree` paragraph that the same task places "below that table" quotes `hooks_config_write`'s `git -C … config` lines, which are not in the prompt. Either scope the check to the measurement block, or name `cli/templates/scripts/setup-worktree.sh` as the second source.

## Nice to Have

1. `task_7_plan.md`'s Verification cites `docs/sandbox-verification.md` §0 for the `Ubuntu 24.04.4 VM, aarch64` environment string. In that document the string sits in the §5 **Stamp.** line, while §0's stamp lines carry `aarch64` and `git version 2.39.5` but not `24.04.4`. Cite both places.
