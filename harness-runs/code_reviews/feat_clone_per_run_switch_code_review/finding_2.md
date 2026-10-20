### 2. The watcher's new exit sync skips silently on an unplaced main checkout, and its header's class list omits it

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`classify_run_exit`) — "if [ \"$(registry_get \"$branch\" copy_kind)\" = \"clone\" ] && [ -n \"$RUN_MAIN\" ]; then", and the header section *THE WATCHER'S GIT IN A RUN'S COPY* — "and a call that cannot be anchored refuses. Class by class:"

This branch adds a sync at every run exit to `classify_run_exit`: on a clone, `hr_run_copy_check_var "$RUN_MAIN" "$worktree"` brings the clone's branch into the main checkout. That call writes to the main checkout. Through `hr_copy_sync_in_var`, it fetches objects and moves `refs/heads/<branch>` by compare-and-swap, and it can also heal the clone's ref.

The script's own header governs every git call the watcher makes against a run's copy. Under *THE WATCHER'S GIT IN A RUN'S COPY* it says *"RUN_MAIN … anchors every call, and a call that cannot be anchored refuses"*, and then lists each class of such call. Every other hardened site that finds `RUN_MAIN` empty reports `RUN_MAIN_REFUSAL`: the watchdog (`why="stalled ${staleness}s, $RUN_MAIN_REFUSAL"`), the artifact commit (`echo "$self: $RUN_MAIN_REFUSAL — refusing to commit"`) and the reuse path (`reuse_fail="$RUN_MAIN_REFUSAL"`).

The new site does not follow that rule in two ways:

- When `RUN_MAIN` is empty, it skips without a log line. The run's commits then never reach the main checkout's branch, and `watcher.log` says nothing. `docs/watcher.md` §2, however, tells an operator that the watcher syncs in at every run exit.
- The header's class list (READS, CALLS THAT RUN CODE, A FRESH COPY, READS ON REGISTRY ROOTS, IN JOB MODE) has no entry for a call that writes to the main checkout's ref at exit. `.claude/context/cli.md` → `## What "done" means here` says *"Where the header states a rule, the change either satisfies it or amends the header in the same edit"*.

**Fix:** both edits are in `cli/templates/scripts/autonomous-watcher.sh`.

1. In `classify_run_exit`, replace the sync block with one that logs the refusal when `RUN_MAIN` is empty:

```bash
  if [ "$(registry_get "$branch" copy_kind)" = "clone" ]; then
    if [ -z "$RUN_MAIN" ]; then
      log "classify: could not sync the clone of '$branch' into the main checkout ($RUN_MAIN_REFUSAL) — its branch there may lag the run's commits"
    elif ! hr_run_copy_check_var "$RUN_MAIN" "$worktree" >>"$log_path" 2>&1; then
      log "classify: could not sync the clone of '$branch' into the main checkout ($HR_RUN_REFUSAL) — its branch there may lag the run's commits"
    fi
  fi
```

2. In the header section *THE WATCHER'S GIT IN A RUN'S COPY*, add a bullet after the `* CALLS THAT RUN CODE` bullet:

```bash
#   * THE EXIT SYNC — at every run exit, a clone's branch is brought into the
#     main checkout by `hr_run_copy_check_var` (its sync-in: a fetch into the
#     main repository and a compare-and-swap of `refs/heads/<branch>`), so the
#     main checkout's branch shows what the run committed; a refusal, an
#     unplaced RUN_MAIN included, is one log line and never changes how the
#     run's exit is classified.
```

No test file is edited, so this fix runs no test. `cli/test/watcher-run-profile.test.mjs` → *"a clone run's exit syncs its branch into the main checkout"* already covers the sync path, and the Run gates phase runs it.
