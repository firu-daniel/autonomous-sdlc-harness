# Story: The watcher stops counting a finished run as live through a reused pid

## Context

This branch fixes `docs/sandbox-verification.md` §5 **PD19**. `running_count` in the watcher counts every local registry record whose saved `pid` answers `kill -0`, and never reads the record's `status`. A run that reaches `completed` or `failed` keeps its `pid`, and macOS reuses process ids, so a finished run can read as live. Every comparison against `MAX_PARALLEL_RUNS` calls `running_count`, so each reused `pid` takes a launch slot. The sandbox probe's preflight refusal 4 (`scripts/lib/sandbox-probe/preflight.sh`) reads the same count, and this is how the defect showed up. The fix has two halves. `running_count` counts only records whose status holds a slot, and every write of a terminal status also drops the `pid`.

**Which statuses hold a slot: `running`, and only `running`.** This follows from the launch and resume paths. Every local path writes `status running` **before** `spawn_engine`. `spawn_engine` writes the `pid` as its last statement (`registry_set "$branch" pid "$!"`, after the backgrounded subshell). The paths are:

- `launch_run`: `registry_set "$branch" status running`, then `registry_set "$branch" pid ""`, then `spawn_engine`.
- `begin_park_resume` (from `resume_parked_run` and `run_job`) and `begin_pause_resume` (from `resume_paused_run` and `run_job`): each writes `status running` before its caller's `spawn_engine`.
- The stall watchdog's restart in `check_stalled_runs`: `registry_set "$b" status running`, then `spawn_engine "$b" …`.
- `run_job`: `registry_set "$branch" status running` before the spawn `case`.

So a record whose `pid` is a live session subshell is `running` for that session's whole life. Only `classify_run_exit` rewrites the status, inside that subshell, just before the subshell exits. It writes `parked`, `paused`, `park_loop`, `completed` or `failed`, and each one means the engine has already exited. A record in the middle of a launch is `running` with an empty `pid`. It counts `0` today and still counts `0` after the fix, so the filter cannot count out a run being launched. The watcher is one process, and every launch path runs `spawn_engine` to completion before the next capacity read, so a second launch cannot slip past the cap between the two writes. Remote records (`execution: github-actions`) are still skipped by `record_is_remote`, as they are today.

**Records written before this branch** keep their stale `pid` until a fresh launch on the same key clears it (`launch_run`'s `registry_set "$branch" pid ""`). The status filter alone makes them harmless, so the plan adds **no migration**. The audit below found that every other reader of a registry `pid` already checks `status = running` before its `kill -0`, so no reader is left that trusts a terminal record's `pid`.

**The audit of every other `kill -0` on a registry pid** (goal 4). Each is restated in Task 1's file with the code it rests on.

- `reconcile_stale_runs`: acts only when the status is `running`. No gap. It is also a terminal writer, so Task 1 makes it drop the `pid`.
- `footprint_live_runs`: its `jq` selects `status == "running"`. No gap.
- `keep_awake_pass` (`engine_pid`, `keep_awake_pid`): `[ "$(registry_get "$b" status)" = "running" ] || continue` comes first. No gap.
- `check_stalled_runs`: the same status line comes first. No gap.
- `process_inbox_file`'s duplicate test: `[ "$existing_status" = "running" ] && … kill -0 "$existing_pid"`. No gap.
- `usage_running_alive`: the status test comes first. No gap.
- `cli/src/doctor/checks.ts` → `liveRunCount`: filters on `status === 'running'` before `pidIsAlive`. No gap.

The other `kill -0` sites in the tree do not read a registry `pid`. They are `harness-run-lib.sh`'s lane-owner test on `HR_LANE_OWNER_PID`, the keep-awake waiter, `cleanup-merged-worktrees.sh`, `run-test-suite.sh`, `start-dev-server.sh` and the probe's own session and network legs, and each tests a process its own script started or a lane-file owner. `restart-watcher.sh` filters by status alone and makes no `kill -0`. **`running_count` was the only gap.**

**`engine_pid` and `keep_awake_pid` are not cleared.** Their one reader, `keep_awake_pass`, skips any record that is not `running` before it reads either field. The header documents `engine_pid` as *"Overwritten by the next launch, never cleared"*. `cli/test/watcher-keep-awake.test.mjs` asserts `record.engine_pid` after a session has ended. Clearing either field would change a documented contract to fix nothing.

**The terminal writers outside the watcher.** `remote-run.sh stop` also writes `status failed` to a local record. Its verb gate's `*)` arm tests only `execution.target`, never the record's `execution` field, and a run keeps the execution it started with. So a local record holding a `pid` can be stopped in a repository whose target is now `github-actions`, and `cli/test/registry-writer.test.mjs`'s stop-race test drives exactly that record. Task 2 adds `pid ""` to `verb_stop`'s `hr_registry_set` call, in the same call as the status. `remote-run.sh sync`'s no-bundle `status failed` write is left alone, because the `status|sync)` gate refuses any record that does not carry `execution: github-actions`, and a remote record carries no `pid`.

**The layers and the byte-identity constraint.** `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/remote-run.sh` are the `cli` layer's files. `scripts/autonomous-watcher.sh` and `scripts/remote-run.sh` are this checkout's adopted copies, at the root, so they belong to the `general` catch-all. Each root copy must stay byte-identical to its template (both are today), and each keeps its own file mode. Task 1 makes every watcher change in its template. Task 2 makes the `remote-run.sh` change in its template. Task 3 brings both root copies level and checks the bytes of each. Task 2 also adds the probe's refusal-4 cases, and those need only the watcher template, because the fixture's probe sources the watcher that `init` wrote from `cli/templates/`. Task 2 also corrects the two `cli` comments the fix falsifies. Task 3 then names this branch in PD19's follow-up cell and changes nothing else in the record. The Bash 3.2 floor binds every shell edit: no associative arrays, no `${var,,}`, no `mapfile`.

**A known limit, out of this branch's scope.** A `running` record whose process died while the watcher was down, and whose `pid` was then reused, still reads as live: `reconcile_stale_runs` cannot tell it from a live run with `kill -0`. The task prompt asks about terminal records, so this branch neither fixes nor claims to fix that case.

**Top risks:** The first risk is a status filter that counts a launching run out and lets a second launch past the cap. Task 1 rests the filter on the status-before-pid order quoted above, and its suite asserts a `running` record with a live pid still counts. The second is a `pid` clear that lands **after** a fresh launch on the same branch key and wipes the new session's pid. Task 1 writes each clear in the **same** `registry_set` call as the terminal status, so no relaunch can come between the two writes. The third is a root copy (`scripts/autonomous-watcher.sh` or `scripts/remote-run.sh`) drifting from its template. Task 3 checks each pair with `cmp` rather than by eye.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_watcher_running_count_pid_reuse/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [ ] **Task 1** — Count only `running` records in `running_count` and drop the `pid` on every terminal write, in the watcher template _(layer: cli)_ _(points: 20)_
2. [ ] **Task 2** — Cover the probe's refusal 4 against a finished run's live pid, drop the pid on `remote-run.sh stop`, and correct the two doctor comments the fix falsifies _(layer: cli)_ _(points: 15)_
3. [ ] **Task 3** — Bring the root watcher and `remote-run.sh` level with their templates and name this branch in PD19's follow-up cell _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"PD19's follow-up cell in `docs/sandbox-verification.md` names this branch. Nothing else in the record changes."*

**Derivation entry — corpus files (command).** Re-run verbatim from the checkout root: `git grep -n -e 'PD19' -e 'running_count' -- docs README.md ARCHITECTURE.md plugin examples`

**Derivation entry — standing-artifact rows.** None is owed. No standing tracked matrix under `harness-runs/` covers `docs/sandbox-verification.md` or any other target of this plan.

**Closure invariant:** every site the command entry reaches appears as a row below.

| # | Site (path + symbol or quoted anchor) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → §5 PD19 row, its follow-up cell ("Owed a follow-up (no branch or issue yet), in the watcher, not the probe.") | — | command entry, `PD19` | `change` | Task 3 |
| 2 | `docs/sandbox-verification.md` → §5 PD19 row, its observation cell ("which counts every local registry record whose saved `pid` answers `kill -0`, whatever the record's status") | — | command entry, `PD19` and `running_count` | `no-change` | a measured fact of record, stated as of 2026-10-28; the predicate says nothing else in the record changes |
| 3 | `docs/sandbox-verification.md` → §0 "The probe's third run (2026-10-28)" ("The cause was a stale registry `pid` that macOS had reused (§5 PD19)") | — | command entry, `PD19` | `no-change` | the run's own record; the predicate says nothing else in the record changes |
| 4 | `docs/sandbox-verification.md` → §5 "The probe's own defects (2026-10-27 and 2026-10-28)" ("PD18 and PD19 are what the third run found") | — | command entry, `PD19` | `no-change` | the section's provenance sentence, still true; the predicate says nothing else in the record changes |
