`fix_watcher_running_count_pid_reuse` stops the watcher counting a finished run as live because the process ID its record still holds has been reused by an unrelated process. Recorded as `docs/sandbox-verification.md` §5 **PD19**.

> ⚠️ **Find every anchor in this prompt by its quoted text or function name, never by line number.**

## The defect

`running_count` in `scripts/autonomous-watcher.sh` (and its template, `cli/templates/scripts/autonomous-watcher.sh`) counts every local registry record whose saved `pid` answers `kill -0`. It never reads the record's `status`, though its own comment says it counts "Runs marked `running` whose process is still alive".

A run that reaches `completed` or `failed` keeps its `pid`. On 2026-10-28 the main checkout's registry held 24 `completed` or `failed` records with a `pid`. macOS reuses process IDs, so any of them can come back to life as an unrelated process.

**What it did.** Before probe run 3, with the watcher stopped and nothing running, `bash scripts/sandbox-probe.sh preflight` refused (exit 2):

```
sandbox-probe: refusing to start: the watcher has 1 run(s) in flight; wait for them or stop them first
```

The record `fix_forge_run_control_gate12_findings`, `completed` and last updated 2026-10-02, still held `pid` `63912`. macOS had given that number to `RemoteManagementAgent`, started 2026-10-27. Blanking the `pid` by hand let the preflight pass. The probe's refusal 4 (`scripts/lib/sandbox-probe/preflight.sh`) calls `running_count` in a child shell that sources the watcher.

**Why it matters beyond the probe.** `running_count` is "the same liveness test every capacity decision here makes": each comparison against `MAX_PARALLEL_RUNS` calls it. Every reused `pid` takes a launch slot, so with enough of them the watcher queues drops while nothing runs, and says only that it is at capacity.

## Read first

- `scripts/autonomous-watcher.sh`:
  - `running_count`, `reconcile_stale_runs`, `usage_running_alive`, the stall watchdog's loop (`[ "$(registry_get "$b" status)" = "running" ] || continue`), and the status report's liveness column (its comment: "THE STATUS FILTER IS THIS REPORT'S OWN"). The last three filter on `status` before `kill -0`; `running_count` does not.
  - Every `registry_set … status completed` / `status failed` site, and the three sites that already clear `pid` (`spawn_refused`, the reused-key reset before a launch, the job-mode seed).
  - Every caller of `running_count`.
- `docs/sandbox-verification.md` §5 PD19 and §0 *The probe's third run*.
- `cli/test/`, for the watcher suites and how they drive the registry (the `vanished pid` repro in the watcher's header uses `{"runs":{"feat_x":{"status":"running","pid":999999}}}`).

## The goal

1. **`running_count` counts only records whose status says the run holds a slot**, and whose process is alive. The plan decides which statuses hold a slot by reading every launch and resume path: in particular, whether `status` is written before or after `pid` on a launch, so that a run being launched is never counted out and a second launch slips past the cap. It states the answer with the code it rests on.
2. **A run that reaches a terminal status drops its `pid`**, wherever a run reaches `completed` or `failed`, `reconcile_stale_runs` included. The plan decides whether to also clear `engine_pid` and `keep_awake_pid`, from what reads them after the run ends.
3. **Records written before this branch** keep a stale `pid` until something clears it. Goal 1 alone makes them harmless; say so in the plan, and do not add a migration unless goal 1 leaves a reader that still trusts a terminal record's `pid`.
4. **Every other `kill -0` on a registry `pid`** is audited for the same gap, and each is listed in the plan with its result.
5. **Tests**, under `cli/test/`: a `completed` and a `failed` record whose `pid` is a live process (the test's own child) are not counted; a `running` record with a live `pid` is; and the probe's refusal 4 does not fire on the first case.
6. **The record.** PD19's follow-up cell in `docs/sandbox-verification.md` names this branch. Nothing else in the record changes.

## Constraints

- `scripts/autonomous-watcher.sh` and `cli/templates/scripts/autonomous-watcher.sh` stay byte-identical.
- No change to the probe's preflight beyond what goal 1 gives it for free.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.

