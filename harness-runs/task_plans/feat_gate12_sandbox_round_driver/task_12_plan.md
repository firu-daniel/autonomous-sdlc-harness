### Task 12 — Test `default-branch`: the restore on success, on failure and on a signal

**Goal:** Prove that round step 8 leaves the repository as it found it whatever happens:
- the GitHub default branch is restored on every exit path, an interrupt included;
- `STALL_WARN_SECS` / `STALL_KILL_SECS` go back to their prior values, or are deleted when they were absent;
- `<other branch>` is kept for `teardown`;
- the leg refuses to start while a planted run is still in flight.

**Depends on:**
- Task 10: `makeGate12Fixture` (its `remoteRunExit` option, default `0`, sets the stub `<scriptsDir>/remote-run.sh`'s exit code; this suite's failed-dispatch case passes `remoteRunExit: 3`), `ghStub` (its mutable state for `repo edit --default-branch`, `variable set/delete/list`), `runRound`, `spawnRound` (the same command and environment as `runRound`, returning the child so this suite can signal it; its environment blanks `MAIN_REPO_ANCHOR_VARIABLE` in the same object) and `cleanup`. This suite spawns nothing itself.
  - The run-ID lookup for the JS3 branch, whose name carries a run-time stamp: a `run list` route with `synthesiseRun: true` answers `run list … --branch <b>` with one run titled `harness run <b>`, its `databaseId` allotted sequentially per distinct branch from `firstId` (default `1001`) and stable across lookups. `ghStubRuns(dir)` returns the `{ <branch>: <databaseId> }` map.
  - `gh run view <id> --json status` is answered by an ordinary `run view` prefix route (for example `{"status":"in_progress"}`, or `{"status":"queued"}` for the time-out and signal cases), whatever the ID.
- Task 3's `g12_branch_push <row> <arm> <branch> <commit>`, which Task 5 calls for the JS3 branch: it records `{name,row,arm,commit}` in `branches[]` **before** the push.
- Task 5's contract for `default-branch --repo <slug> [--other-branch <name>] [--stall-warn-secs <n>] [--stall-kill-secs <n>] [--wait-secs <n>]`, in order:
  1. Refuse (2) while any recorded run is `queued` / `waiting` / `requested` / `pending` / `in_progress`, and refuse (2), naming `teardown`, when `other_branch` is already recorded.
  2. Record `default_branch` and `variables.<NAME>` `{present,value,restored}`.
  3. `trap … EXIT INT TERM HUP`.
  4. Record `other_branch`, **then** `git push --no-verify origin refs/remotes/origin/<default>:refs/heads/<other>`.
  5. `gh repo edit <slug> --default-branch <other>`.
  6. `gh variable set` for both stall variables.
  7. Build, record-and-push through `g12_branch_push JS3 stall …`, and dispatch JS3 (prompt commit only).
  8. Poll `gh run view --json status` until `in_progress` or `completed`, or `--wait-secs` passes, setting `stall_values_unconfirmed` on time-out.
  9. Restore.
  
  A failed restore step prints its hand command and exits 5.

### Targets

- `cli/test/gate12-sandbox-round-default-branch.test.mjs` (new).

**Work:**

- [ ] Header. The rule: the leg changes the GitHub default branch and two repository variables, and it restores every one of them on every exit path, signal included. It keeps `<other branch>` recorded for `teardown`, and refuses while another planted run is in flight. State that it reads no tree.
- [ ] Success. The stub starts with default `main`, `STALL_WARN_SECS` present at `900` and `STALL_KILL_SECS` absent. After the run:
  - the stub's default is `main`;
  - `STALL_WARN_SECS` is `900` and `STALL_KILL_SECS` is deleted;
  - the stub's call log shows `repo edit --default-branch <other>` **before** the dispatch and `repo edit --default-branch main` after the `in_progress` answer;
  - the state carries `other_branch`, a JS3 `runs[]` entry whose `run_id` is the ID `ghStubRuns` maps its branch to, the stub's call log shows a `run view <that id>` call, a JS3 `branches[]` entry (row `JS3`, arm `stall`, its `name` equal to the `runs[]` entry's `branch`, its `commit` equal to that branch's tip on the bare origin) and `restored: true` on both variables;
  - the bare origin holds `<other>` at the seed tip.
- [ ] Failure paths, each ending with the default `main` and the variables restored:
  - the dispatch's `remote-run.sh` stub exits 3, through a fixture made with `remoteRunExit: 3` — and the state still carries the JS3 `branches[]` entry, so `teardown` can delete the pushed branch;
  - the `gh run view` route never leaves `queued` with `--wait-secs 1`, which also asserts `stall_values_unconfirmed: true`;
  - a `SIGINT` sent through `spawnRound`'s child while it polls, which asserts that the child exited non-zero after restoring.
- [ ] A restore step whose `gh repo edit` route fails exits 5, and stderr carries the `gh repo edit fixture/gate12 --default-branch main` command.
- [ ] Refusals, each exiting 2 with no push to the bare origin (its `git for-each-ref refs/heads` unchanged) and no `repo edit` call in the stub log:
  - a state file with a recorded run the stub reports `in_progress`;
  - a state file whose `other_branch` is already recorded (for example the state the failed-dispatch case above leaves), whose stderr names `teardown`.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-default-branch.test.mjs` passes. It is this task's own new test file.
