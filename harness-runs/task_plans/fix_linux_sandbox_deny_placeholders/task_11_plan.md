### Task 11 — Sweep recorded leftovers ahead of every reader that a leftover breaks, including the watcher's own start

**Goal:** On a bubblewrap host, remove what a killed session left behind **before** any code that a leftover breaks reads it, in `cli/templates/scripts/autonomous-watcher.sh`. Those readers come before `spawn_engine` on every path that matters:

- the watcher's own start, where `hr_main_repo` runs `git -C "$SCRIPT_DIR" worktree list --porcelain` and a 0-byte `<main>/<scriptsDir>/.git` makes it fail, so the watcher `fatal`s with *"is not inside a git repository — refusing to start"*;
- the stall watchdog's recovery, which kills with `kill -9` and then runs `hr_run_copy_check_var "$RUN_MAIN" "$worktree"` in the same iteration;
- `process_inbox_file`'s `create-worktree.sh` call, which refuses with *"cannot place this script in a main checkout"*, and its `(2b) Review path` `hr_run_copy_check_var` calls, which go to `fail_before_launch`;
- `spawn_engine`'s launch check (Task 4), reached by the park and pause resumes.

**Where this task stops.** It calls Task 2's sweep. It does not change the sweep's five tests, the manifest format or the launch check. It adds no tunable.

**Depends on:**

- **Task 2**, which owns `cli/templates/scripts/lib/harness-run-lib.sh` before this task. This task adds only `hr_registry_live_count` and `hr_main_checkout_past_leftovers_nogit` to it and changes none of Task 2's functions. Task 2's library contracts:
  - `hr_placeholder_host_probe_var` sets `HR_PLACEHOLDER_HOST` to `1` or `0` and returns 0.
  - `hr_placeholder_leftover_var <path>` returns 0 when the path is a regular file, not a symbolic link, 0 bytes, carrying no write bit and owned by the effective user; otherwise it returns 1 and sets `HR_PLACEHOLDER_REASON`. It sets no shell option, logs nothing and removes nothing. It is the one home of that test, so this task restates none of its conditions.
  - `hr_run_profile_absent_file <slug> <branch>` prints `<hr_lane_dir>/run-profiles/<slug>/<sanitized branch>.absent`, or returns 1.
  - `hr_placeholder_sweep_var <manifest>...` removes only a 0-byte, read-only, self-owned regular file at a listed path, never one no manifest lists. It sets `HR_PLACEHOLDER_REMOVED`, one path per line, and `HR_PLACEHOLDER_KEPT`, one `<path>: <reason>` per line. It returns 0, or 1 when no manifest argument was readable. It runs no git.
- **Task 3's** `tick` option `placeholderHost: true`, and its rule that a pass script which sources the watcher and calls `tick` installs the `hr_placeholder_host_probe_var` override.
- **Task 4**, which owns `cli/templates/scripts/autonomous-watcher.sh` before this task and creates `cli/test/watcher-placeholder-host.test.mjs`:
  - In `spawn_engine`, outside job mode on a placeholder host, Task 4 opens one block before `run_profile_render`, holding the launch check, and leaves its first statement for this task's sweep call.
  - Task 4 writes each spawn's manifest at `hr_run_profile_absent_file "$HARNESS_REPO_SLUG" "$branch"`.
  - Task 4 sets `RUN_CAP` per pass, which this task does not read.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/test/watcher-placeholder-host.test.mjs`
- `cli/test/watcher-running-count.test.mjs`

**Work:**

- [ ] Give the live-run rule and the no-git main-checkout walk each one home, in the library, that both the watcher's passes and its start-up step can reach. Today it lives only in `autonomous-watcher.sh` → `running_count`, and `running_count`, `registry_get`, `registry_branches` and `record_is_remote` are all defined below the `MAIN_REPO=` line and read the global `$REGISTRY`, which is not set yet when the start-up step runs. So the rule moves to the library rather than being copied (`.claude/context/conventions.md` → `### Where a new responsibility goes`):
  - Add `hr_registry_live_count <registry> [exclude_branch]` to `cli/templates/scripts/lib/harness-run-lib.sh`, beside `hr_registry_branches`. For every branch `hr_registry_branches "<registry>"` lists, it skips `<exclude_branch>` when one is given, skips a record whose `execution` (`hr_registry_get`) is `github-actions`, and counts a record whose `status` is `running` and whose `pid` is non-empty and answers `kill -0`. It prints the integer and nothing else, sets no shell option, logs nothing and returns 0. Its comment carries the reasoning now on `running_count` (why `running` is the only status that holds a slot, why a remote run holds none) and states it is the one home of that rule.
  - Make `running_count [exclude_branch]` a one-line delegation: `running_count() { hr_registry_live_count "$REGISTRY" "${1-}"; }`. No existing caller passes an argument, so its answers are unchanged, and it stays a pure reader. Its comment points at the library function as the rule's home. `record_is_remote` stays, for its other callers.
  - Likewise, the no-git checkout walk already lives in the library (`hr_checkout_top_nogit`, `hr_wrapper_main_of`), so the start-up step's walk goes there too rather than into the watcher. Add `hr_main_checkout_past_leftovers_nogit <dir>` beside `hr_checkout_top_nogit`, built on it rather than walking afresh: take `top=$(hr_checkout_top_nogit "<dir>")`; while `hr_placeholder_leftover_var "$top/.git"` returns 0, and `top` is not `/`, take `top=$(hr_checkout_top_nogit "<parent of top>")`; then print `top` and return 0 only when `$top/.git` is a real directory and not a symbolic link (`[ -d ] && [ ! -L ]`), as `hr_wrapper_main_of`'s directory arm accepts. Return 1, printing nothing, when any `hr_checkout_top_nogit` call fails or the final `.git` is anything else. It runs no git, sets no shell option, logs nothing and removes nothing. Its comment states why it exists (a leftover `<main>/<scriptsDir>/.git` hides the main checkout from `hr_main_repo` and `hr_checkout_top_nogit` alike) and that it carries no leftover test of its own.
- [ ] The sweep, as one function, `placeholder_sweep_pass <exclude_branch> <quiet>`:
  - It does nothing in job mode, and nothing unless `hr_placeholder_host_probe_var` answers `1`.
  - It sweeps only when `running_count "<exclude_branch>"` answers 0, that is, when no run of this repository other than `<exclude_branch>` is live.
  - It calls `hr_placeholder_sweep_var` over every `*.absent` file in the directory of `hr_run_profile_absent_file "$HARNESS_REPO_SLUG" x`, and writes one `log` line per removed path (`placeholder sweep: removed <path>`) and per kept one (`placeholder sweep: kept <path>: <reason>`).
  - When it skips for a live run, it writes `placeholder sweep: skipped, <n> run(s) of this repository live`, unless `<quiet>` is `1`.
  - These are the log lines Task 4's plan used, unchanged, which Task 9 documents.
- [ ] The call sites, each ahead of the reader it protects:
  1. `tick`, right after `reconcile_stale_runs` and before `check_stalled_runs`: `placeholder_sweep_pass "" 1`. This is quiet, because a live run would otherwise log the skip on every poll. It is ahead of the stall watchdog, both resume passes, the usage gate and the inbox loop.
  2. `check_stalled_runs`, in the KILL tier, after the two `kill -9` lines and before the give-up conditions:
     - Wait for the process tree to exit. Poll `kill -0` on `$pid` and every captured descendant, checking once before any sleep, then at most 10 more times with `sleep 1` between.
     - Once the tree is gone, call `placeholder_sweep_pass "$b" 0`. A run killed by `kill -9` leaves its placeholders on disk, which is phase D's condition, and this is the only point between that kill and `hr_run_copy_check_var`.
     - If the tree has not exited by the bound, log `placeholder sweep: skipped, '<b>''s process tree has not exited` and go on as today.
  3. `process_inbox_file`, for a local run, after the cap check passes and before the working-copy step (the `create-worktree.sh` call, the docs path's, and the `(2b) Review path`'s reuse and recreate): `placeholder_sweep_pass "" 0`. This closes the window where a run dies after the pass-start sweep was skipped.
  4. `spawn_engine`, as the first statement of Task 4's placeholder-host block, ahead of the launch check: `placeholder_sweep_pass "$branch" 0`.

  Update the header's `THE WATCHER'S GIT IN A RUN'S COPY` block, or the nearest block naming the per-run profile, with one paragraph listing these four points and the start-up step below.
- [ ] The start-up recovery, `placeholder_start_recover`, defined and called after the PATH bootstrap and before `MAIN_REPO="$(hr_main_repo "$SCRIPT_DIR")"`:
  - **When it runs.** Only when `hr_main_repo "$SCRIPT_DIR"` fails and `HARNESS_JOB_MODE` is not `1`. On a healthy checkout it costs one extra `hr_main_repo` call and changes nothing.
  - **No probe gate.** It is not gated on the probe, which a test pass script installs only after sourcing. Manifests are only ever written on a placeholder host (Task 4), so on any other host it finds none and removes nothing.
  - **Locate the main checkout without git.** The candidate is `hr_main_checkout_past_leftovers_nogit "$SCRIPT_DIR"`'s answer. When it returns 1 there is no candidate and nothing is swept. The watcher carries no `.git` walk and no leftover test of its own.
  - **The live-run gate.** Load the candidate's configuration with `hr_config_load`, which reads `harness.config.json` with `jq` and runs no git. Take the registry at `hr_state_path "<candidate>" autonomous_logs` + `/registry.json`, and call `hr_registry_live_count "<that registry>"`. Sweep only when it prints 0. Any step that cannot be resolved sweeps nothing.
  - **The sweep.** `hr_placeholder_sweep_var` over every `*.absent` file in the directory of `hr_run_profile_absent_file "$(hr_repo_slug "<candidate>")" x`. Print one stderr line per removed and per kept path, prefixed `autonomous-watcher.sh: placeholder sweep at start:`. Hold the removed count, and once `log` exists, write `placeholder sweep at start: removed <n> path(s)` to the watcher log.
  - **Afterwards.** Call `hr_config_reset`, then fall through to today's `hr_main_repo` line. If it still fails, the `fatal` is today's.
  - **Why this cannot remove a person's file.** A path is removed only when a manifest the watcher wrote before a session listed it as absent, and the file is still 0-byte, read-only and the watcher user's.
- [ ] Tests:
  - `watcher-placeholder-host.test.mjs`: extend the header Task 4 wrote with the sweep half of the rule, *and removes only a recorded, 0-byte, read-only leftover, before the first reader that it breaks, including the watcher's own start*. All cases use `placeholderHost: true`, or a pass script installing `HR_PLACEHOLDER_HOST=1`, unless noted. A manifest is written by sourcing the library and calling `hr_placeholder_manifest_write` at `hr_run_profile_absent_file "$(hr_repo_slug <main>)" <branch>` under the fixture's `XDG_STATE_HOME`:
    1. **Fresh launch.** Use a pass script that sources the watcher with `status`, installs the seam answering `1`, then creates a recorded `0444` empty `<main>/<scriptsDir>/.git` and calls `tick; wait`. The drop launches: `create-worktree.sh` succeeds, the record goes `running`, the file is gone, and `placeholder sweep: removed` names it.
    2. **Stall-watchdog resume.** Use `a stall`'s setup from the watcher header's REPRO, with a sleeping stub, back-dated logs, `STALL_WARN_SECS=1` and `STALL_KILL_SECS=2`. While the stub is live, create a recorded `0444` empty `<clone>/.git/commondir`. The pass-start sweep skips, quietly, because the run is live, so the file is still there when the watchdog acts. The watchdog then kills, removes the file, and resumes: `stall_restarts` is 1 and the status is `running`, not `failed`.
    3. **Watcher start.** With a recorded `0444` empty `<main>/<scriptsDir>/.git` and no live run, `autonomous-watcher.sh tick` exits 0 rather than refusing to start: `hr_main_checkout_past_leftovers_nogit` passes over the leftover to `<main>`, and the sweep removes it. The file is gone, and the watcher log carries `placeholder sweep at start: removed 1 path(s)`. This case needs no seam override, because the start-up step takes none.
    4. **Watcher start, unlisted.** The same with the file not in any manifest: `hr_main_checkout_past_leftovers_nogit` still finds `<main>`, but no manifest lists the file, so the sweep keeps it, the watcher refuses to start with today's `fatal`, and the file is unchanged.
    - Plus one direct case of `hr_main_checkout_past_leftovers_nogit`, sourcing the library: from `<main>/<scriptsDir>` it prints `<main>` past a `0444` empty `<main>/<scriptsDir>/.git`, and returns 1, printing nothing, when that `.git` is a `0644` empty file or a symbolic link to a directory.
    5. **Content kept.** A recorded `<clone>/.git/commondir` with content is kept and logged with `has content`, and the resume is then refused by Task 4's launch check.
    6. **Another run live.** With another run live, a recorded leftover in the main checkout is kept, and `process_inbox_file`'s call logs `placeholder sweep: skipped, 1 run(s) of this repository live`.
    7. **Seam off.** With `placeholderHost` off, the same fixture's leftovers in cases 1 and 2 are left in place.
  - `watcher-running-count.test.mjs`: one case where the optional branch argument leaves that live run out of the count, and the existing cases unchanged. Through the delegation, these cases exercise `hr_registry_live_count` itself, the rule the start-up gate also calls.

**Verification:**

- `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs` and `npm test --workspace cli -- test/watcher-running-count.test.mjs` pass.
- `git grep -n 'placeholder_sweep_pass\|placeholder_start_recover' -- cli/templates/scripts/autonomous-watcher.sh` shows the two definitions, the start-up call above the `MAIN_REPO=` line, and the four call sites in `tick`, `check_stalled_runs`, `process_inbox_file` and `spawn_engine`, with no job-mode path reaching one.
- `git grep -n 'hr_registry_live_count' -- cli/templates/scripts` shows the library definition, `running_count`'s one-line body and the call in `placeholder_start_recover`. `running_count`'s body carries no `kill -0` of its own.
- `git grep -n 'hr_main_checkout_past_leftovers_nogit\|hr_placeholder_leftover_var' -- cli/templates/scripts` shows the library definitions, the walk's call to `hr_placeholder_leftover_var`, and in `autonomous-watcher.sh` only the call in `placeholder_start_recover`.
- `git grep -nE '/\.git"? *\]|\.git/\.\.|cd -P' -- cli/templates/scripts/autonomous-watcher.sh` shows no line inside `placeholder_start_recover`: the watcher carries no `.git` walk of its own.
- `git diff --name-only` lists no `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` or `create-worktree.sh`.

**Deviations from plan:**

- Call site 2: the KILL tier's wait-for-exit loop runs only outside job mode and only when `hr_placeholder_host_probe_var` answers `1`. The plan put the wait ahead of `placeholder_sweep_pass`, which does both checks itself, so the wait would otherwise add up to 10 s to every watchdog kill on a host that sweeps nothing, and in job mode. The sweep's own gates stay as specified.
- `placeholder_start_recover`: when `<logs>/registry.json` does not exist, the live count is taken as 0 without calling `hr_registry_live_count`. Through `hr_registry_branches` → `hr_registry_init` that call would create the registry, and a start that still ends in the `fatal` must create nothing (header: IT REFUSES TO START … before anything is created). The gate is otherwise as specified.
- `placeholder_start_recover` logs `placeholder sweep at start: removed <n> path(s)` whenever the start-up sweep ran, `0` included. It logs nothing when the sweep did not run.
- Test case 6 calls `process_inbox_file` directly from a pass script with `RUN_CAP=5`. On a placeholder host the cap is clamped to 1, so with another run live, `tick` defers the drop at the cap check, before the sweep call can be reached. The test file's header says so.
- Test case 1 shows the launch through the stub's recorded prompt and the record's `copy_kind` `clone` / `worktree`. It does not read `status` `running`, because `tick; wait` returns only after the stub has exited and been classified.
- Evidence note: both stall cases (case 2 and case 7's stall half) take about 70 s each. The seam-off half shows that time without the new wait loop. It comes from the hung stub's `sleep 60` and the shared `wait`, not from this change. Not investigated further, because the test-run rule keeps this unit to its own test files and the tree guards.
