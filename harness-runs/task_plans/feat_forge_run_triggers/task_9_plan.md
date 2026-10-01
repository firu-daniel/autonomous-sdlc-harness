### Task 9 — Share a remote run's initial registry record between the watcher and the remote script

**Goal:** Move the field list the watcher writes when it starts a remote record into one library function, `hr_remote_record_init`. Today `launch_remote_run` writes that list; tomorrow `remote-run.sh adopt` (Task 10) must write the same record for a run the watcher never dispatched. A second copy of the list would drift the first time one side gains a field.

**Depends on:** Task 4, which last edited `autonomous-watcher.sh` and `outer-loop-scripts.test.mjs`; this task edits both after it.

**Where this task stops.** The function writes the fields a remote record starts with. It does not set `status`, because the watcher writes `running` only after its dispatch returned 0, and `adopt` writes it only after its mirror exists. It does not dispatch. The `adopt` verb that calls it is Task 10's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — `hr_remote_record_init`, and the registry write exception's list of writing functions.
- `cli/templates/scripts/autonomous-watcher.sh` — `launch_remote_run` calls it.
- `cli/test/outer-loop-scripts.test.mjs` — one library case.

**Work:**

- [ ] **`hr_remote_record_init <registry> <branch> <worktree> <log_path> <engine>`** writes, through `hr_registry_set`, exactly the fields `launch_remote_run` writes today before its dispatch:
  - `worktree`, `log_path` and `engine` from its arguments;
  - `execution` = `github-actions`;
  - `started_at` in the watcher's `date '+%Y-%m-%dT%H:%M:%S'` form;
  - empty `pid`, `remote_dispatched_at`, `stall_warned`, `stall_killing`, `paused_by`, `usage_resume_at` and `resume_kind`;
  - `stall_restarts` = 0 and `park_loop_cycles` = 0.

  Write them in as few `hr_registry_set` calls as the pair form allows, so the record never shows half of them. Returns 1 when any write failed. Add the function to write exception 2's list of registry writers in the header.
- [ ] **`launch_remote_run`** replaces its field writes with one `hr_remote_record_init "$REGISTRY" "$branch" "$worktree" "$log_path" "$engine_kind"` call and keeps everything after it (the dispatch, the `running` / `failed` writes, the log lines, both notifications) exactly as it is. Its header comment names the library function as the one list.
- [ ] **`outer-loop-scripts.test.mjs`**: one `test(...)` that calls the function on a fresh registry and asserts:
  - `.runs.feat_x` carries every field above with its value;
  - `status` is absent;
  - a second call over a record whose `status` is `parked` leaves `status` untouched while resetting the counters.

**Verification:**

- `npm test -- test/outer-loop-scripts.test.mjs` from `cli/` passes.
- `grep -n 'registry_set "$branch" execution' cli/templates/scripts/autonomous-watcher.sh` prints nothing: the watcher no longer spells the list.
