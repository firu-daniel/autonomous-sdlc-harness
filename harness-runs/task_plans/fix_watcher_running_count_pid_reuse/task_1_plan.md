### Task 1 — Count only `running` records in `running_count` and drop the `pid` on every terminal write, in the watcher template

**Goal:** Change the shipped watcher template, `cli/templates/scripts/autonomous-watcher.sh`, in two ways, and add the suite that proves both:

- `running_count` counts a record only when its `status` is `running` **and** its `pid` answers `kill -0`.
- Every write of `completed` or `failed` also drops the record's `pid`, in the same write.

**Where this task stops.** This task edits the **template** only. It does not touch `scripts/autonomous-watcher.sh`, the root copy, which is the `general` layer's file. **Task 3** brings that copy level with this one, byte for byte, so make every watcher change here and nowhere else. This task does not touch the sandbox probe or its suite either: **Task 2** adds refusal 4's cases, and it relies on the `running_count` contract below exactly as stated. Nor does it touch `cli/templates/scripts/remote-run.sh`: **Task 2** adds the `pid ""` clear to `verb_stop`'s terminal write (the table below says why). Do not touch `docs/` at all.

**The contract later tasks rely on** (Task 2 restates it):

- `running_count` is still a pure reader whose only stdout is one integer.
- It counts a local record (not `execution: github-actions`) if and only if `registry_get <b> status` is exactly `running` and `kill -0 <pid>` succeeds on a non-empty `pid`.
- A record that is `completed`, `failed`, `parked`, `paused` or `park_loop` counts `0`, whatever its `pid`.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`: `running_count`, the terminal-status writes listed below, and the comments these changes falsify.
- `cli/test/watcher-running-count.test.mjs` (new): the accompanying behavioural suite.
- `cli/test/watcher-remote-dispatch.test.mjs` → `with the key absent the same drop launches the agent and sends nothing to gh`: its one `pid` assertion, which this task's `classify_run_exit` change falsifies (see the last Work bullet). Nothing else in the file changes.

### Why `running` alone holds a slot (the evidence the filter rests on)

Every local launch and resume path writes `status running` before `spawn_engine`. `spawn_engine` writes the pid as its last statement, `registry_set "$branch" pid "$!"`, after the backgrounded subshell. The paths are:

- `launch_run`: `registry_set "$branch" status running`, then `registry_set "$branch" pid ""`, then `spawn_engine`.
- `begin_park_resume` and `begin_pause_resume`: each writes `registry_set "$branch" status running` before its caller's `spawn_engine` (`resume_parked_run`, `resume_paused_run`, `run_job`).
- `check_stalled_runs`'s restart: `registry_set "$b" status running`, then `spawn_engine "$b" "$worktree" "$log_path" "" 1`.
- `run_job`: `registry_set "$branch" status running` before its spawn `case`.

Only `classify_run_exit` moves a record off `running`, and it runs inside the session's subshell after the engine has exited. Two consequences follow:

- A record mid-launch is `running` with an empty `pid`, so it counts `0` before this change and after it.
- The watcher is one process, and each path runs `spawn_engine` to completion before the next capacity read. So no second launch can pass the cap between the status write and the pid write.

**The reverse-order window, and why it is harmless.** `spawn_engine` forks `( … classify_run_exit "$branch" "$worktree" "$log_path" "$rc" ) &` and only then runs `registry_set "$branch" pid "$!"` in the parent. If the engine exits fast enough, the subshell's `status completed pid ""` (or `status failed pid ""`) can land **before** the parent's `pid "$!"`. The record then ends terminal while holding the pid of a subshell that has already exited. The status filter makes that record count `0` whatever its `pid`, so capacity is unaffected. That pid can only be reused later, and a reuse is exactly the case the filter covers. The parent's write landing first is near-certain but not guaranteed. So **no assertion in this task, and no comment it writes, may claim a terminal record's `pid` is always `""`**. A test asserts the disjunction instead: `pid` is `''`, **or** it no longer answers `kill -0`. It also asserts that `running_count` gives `0`, where the case can read it.

Copy the gist of this into `running_count`'s comment. Do not cite line numbers there.

### The audit of every other `kill -0` on a registry pid

This audit is informational, and it changes no code beyond the Work below.

| Site | Status test before the `kill -0` | Result |
|---|---|---|
| `reconcile_stale_runs` | acts only under `[ "$(registry_get "$b" status)" = "running" ]` | no gap; it is a terminal writer, so it gains the `pid` clear below |
| `footprint_live_runs` | `select(.value.status == "running")` | no gap |
| `keep_awake_pass` (`engine_pid`, `keep_awake_pid`) | `[ "$(registry_get "$b" status)" = "running" ] \|\| continue` first | no gap |
| `check_stalled_runs` | the same line first | no gap |
| `process_inbox_file` duplicate test | `[ "$existing_status" = "running" ] && … kill -0 "$existing_pid"` | no gap |
| `usage_running_alive` | `[ "$(registry_get "$b" status)" = "running" ] \|\| return 1` first | no gap |
| `running_count` | none | **the gap**, fixed below |

`cli/src/doctor/checks.ts` → `liveRunCount` filters on `status === 'running'` as well. Its comment is Task 2's to correct.

### The terminal writes, and what each one does

| Site | Write today | After this task |
|---|---|---|
| `classify_run_exit`, the `rc -eq 0` arm | `registry_set "$branch" status completed` | `registry_set "$branch" status completed pid ""` |
| `classify_run_exit`, the final `else` arm | `registry_set "$branch" status failed` | `registry_set "$branch" status failed pid ""` |
| `reconcile_stale_runs` | `registry_set "$b" status failed` | `registry_set "$b" status failed pid ""` |
| `check_stalled_runs`, both give-up arms (`log "stall-watchdog: '$b' -> failed ($why)"`) | `registry_set "$b" status failed` | `registry_set "$b" status failed pid ""` |
| `fail_before_launch` | `registry_set "$branch" status failed` | `registry_set "$branch" status failed pid ""` |
| `spawn_refused` | already writes `status failed`, then `pid ""` | unchanged |
| `launch_remote_run`'s failed arm | `registry_set "$branch" status failed` on a record `hr_remote_record_init` already wrote with `pid ""` | unchanged; a remote record carries no pid |
| `cli/templates/scripts/remote-run.sh` → `verb_stop` | `hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" status failed` | `hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" status failed pid ""` — **Task 2's edit, not this task's** (see below) |

**`remote-run.sh stop` is a terminal writer on local records too, and Task 2 owns it.** `stop` passes the verb gate's `*)` arm, which tests only `execution.target`, not the record's `execution` field. `verb_stop` then writes `status failed` to any existing record of the branch. A run keeps the execution it started with, so a local record holding a `pid` can exist in a repository whose target is now `github-actions`. `cli/test/registry-writer.test.mjs` → *"a remote-run.sh stop racing the watcher's writes loses neither, every round"* drives exactly that: a record with no `execution` field ends `failed`. The clear goes in the same `hr_registry_set` call, by the ordering rule in the Work below. This task is at the 20-point cap, so **Task 2** makes that edit in `cli/templates/scripts/remote-run.sh` and Task 3 brings the root copy level. Do not touch `remote-run.sh` in this task.

`remote-run.sh sync`'s no-bundle `status failed` write (`set_many_or_fail status failed remote_detail …`) stays out of scope. The `status|sync)` gate refuses a record that does not carry `execution: github-actions` (*"refused, nothing written: the local record of '$branch' does not carry execution: github-actions"*). So `sync` only ever writes a remote record, which `hr_remote_record_init` wrote with `pid ""`, and `running_count` skips remote records anyway.

**`engine_pid` and `keep_awake_pid` are not cleared.** Their one reader, `keep_awake_pass`, skips any record that is not `running` first. The header documents `engine_pid` as *"Overwritten by the next launch, never cleared"*. `cli/test/watcher-keep-awake.test.mjs` reads `record.engine_pid` after a session has ended.

**Work:**

- [ ] `running_count`: after the existing `record_is_remote "$b" && continue` line and before the `pid` read, add `[ "$(registry_get "$b" status)" = "running" ] || continue`, which is the idiom `check_stalled_runs` and `keep_awake_pass` already use. Keep the function a pure reader with one integer on stdout. Rewrite its comment so it says three things: the status filter is what keeps a finished record's reused `pid` from holding a slot; `running` is the only status that holds one; and the status-before-pid evidence above is why the filter cannot count out a run being launched.
- [ ] Apply the terminal-write table above, every row except `verb_stop`'s, which is Task 2's. Each `pid ""` goes in the **same** `registry_set` call as its status, never in a separate call after it. The reason is ordering: a relaunch on the same branch key can begin only once the record is no longer `running`, and it then writes its own `pid ""` and new `pid`. A later separate clear from the old subshell could wipe the new session's pid. Leave `classify_run_exit`'s other writes (the watchdog counters, `park_loop_cycles`) exactly as they are.
- [ ] Correct the comments these two changes falsify:
  - `footprint_live_runs`'s comment: *"THE STATUS FILTER IS THIS REPORT'S OWN. running_count tests only the pid, which is sound locally because reconcile_stale_runs demotes a dead `running` record first"*. Say instead that `running_count` applies the same status filter, and keep the foreign-root reason and the `EPERM` difference.
  - The registry field list's `pid` entry (`#   pid                 the launched process`): say it is the launch subshell's pid, written by `spawn_engine` after `status running`, cleared in the same write when the run reaches `completed` or `failed`, and cleared again by a fresh launch. Add one clause for the reverse-order window above: a session that ends before the parent's pid write can leave a terminal record holding its own dead subshell's pid, which the status filter ignores. Say also that a `parked`, `paused` or `park_loop` record keeps it until the next spawn overwrites it, and that no reader trusts it on a record that is not `running`.
  - The header REPRO block: add one line under `the count` stating that the live-pid record with `"status":"completed"` gives exactly `0`.
- [ ] `cli/test/watcher-running-count.test.mjs` (new). Its header opens with the rule it enforces: *a record holds a slot only while its status is `running` and its pid is alive, and a run that reaches `completed` or `failed` drops its pid*. The header also names what it does not drive, and why: the stall watchdog's two give-up arms and `fail_before_launch` need the watchdog's timing or a failed working-copy build. Their edit is the same one-write `pid ""` pair as the arms it does drive. Use `createWatcherFixture` (`cli/test/helpers/watcher.mjs`). For the live pid, spawn a child of the test (for example `sleep 300`) and kill it in `t.after`. Run `running_count` the way the header's REPRO does: `bash -c '. "$1" status >/dev/null; running_count' _ <watcherPath>` under `f.watcherEnv()`, and assert stdout is exactly `0\n` or `1\n`. Seed the registry by writing `sdlc-harness/autonomous_logs/registry.json` with as many records as the case needs. The cases:
  - a `completed` record and a `failed` record, each holding the live child's pid, count `0`;
  - a `parked` and a `paused` record with the live pid count `0`;
  - a `running` record with the live pid counts `1`, and adding it beside the two terminal ones still gives `1`;
  - a seeded `running` record whose pid is dead becomes `failed` with `pid` `""` after one `f.tick()`. For the dead pid, use a child the test spawned and has already reaped, not a fixed number;
  - a parked run resumed on its answer (`seedRecord()`, then `writeQuestion(1, …)` and `writeAnswer(1, …)`, then `f.tick()`) ends `completed`, and its `pid` is `''` or no longer answers `kill -0` (the reverse-order window above). `running_count` then gives `0`. With `setStub('exit 3')`, the same resume ends `failed`, with the same `pid` disjunction and the same `0`. (The reaped-pid case above is written by the watcher's own `reconcile_stale_runs`, not a session subshell, so no window applies and it asserts `pid` `""` exactly.)
- [ ] `cli/test/watcher-remote-dispatch.test.mjs` → `with the key absent the same drop launches the agent and sends nothing to gh`. Replace `assert.match(String(record.pid), /^\d+$/);` with an assertion of the new contract, keeping the line's intent by other means. Today the line shows that the run was local and went through `spawn_engine`. The test already shows that through `assert.equal(f.prompts().length, 1, …)`, `assert.deepEqual(f.ghCalls(), [])` and `assert.equal('execution' in record, false)`, so the rewrite does not need it. The new assertion is that the `completed` record's `pid` is `''`, or a pid that no longer answers `kill -0` (a `process.kill(Number(record.pid), 0)` that throws `ESRCH`), per the reverse-order window above. Add a one-line comment stating why. Change nothing else in the file. **The grep for other terminal-record `pid` assertions**, `git grep -n 'assert.*pid' -- 'cli/test/*.mjs'`, finds this line and none that this task breaks. `watcher-remote-dispatch.test.mjs`'s `assert.equal(record.pid, '')` reads a remote `running` record. `watcher-stall-host-sleep.test.mjs` captures `f.record().pid` while the record is `running`, and `assertKilled` reads only `status` from the record after the give-up. `watcher-keep-awake.test.mjs` reads `engine_pid`, which this task does not clear. The rest (`init.test.mjs`, `run-test-suite.test.mjs`, `keep-awake.test.mjs`) read no registry `pid`.

**Verification:**

- `npm test --workspace cli -- test/watcher-running-count.test.mjs` passes. Its `running`-with-live-pid case returning `1` shows the filter does not count out a slot-holding run, which is the first `Top risks:` entry.
- `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs` passes. This task edits that file, so the test-run rule permits the run.
- Run `git grep -n 'assert.*pid' -- 'cli/test/*.mjs'`. Every hit is one the last Work bullet accounts for, or is in this task's own new suite.
- Run `git grep -n 'status completed\|status failed' -- cli/templates/scripts/autonomous-watcher.sh`. Every `registry_set` hit carries `pid ""` in the same call, with two exceptions: `spawn_refused`'s, which clears the pid on the next line as before, and `launch_remote_run`'s, which acts on a pid-less remote record. Comment hits are not writes.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` parses clean. The unit's whole-tree type check (`commands.typecheck`) passes.
- `git diff -- cli/templates/scripts/autonomous-watcher.sh` adds no write to `engine_pid` or `keep_awake_pid`, and no file outside this task's Targets changes.

**Deviations from plan:** The free-standing `bash -n cli/templates/scripts/autonomous-watcher.sh` was refused by the permission layer (don't-ask mode). The parse claim rests instead on `bash scripts/typecheck.sh`, whose `check-shell-parse.sh` step reported `90 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`; that script parses every listed `*.sh`, the template included, and exists because a free-standing `bash -n` is refused in unattended runs.
