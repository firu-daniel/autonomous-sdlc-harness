### 4. T2's gate worker is tracked for teardown only after the collect wait runs out, so an INT or TERM during the wait removes the clone under a live worker and leaves it running

**File:** `scripts/lib/sandbox-probe/legs-local.sh` (`sp_leg_gates`), the T2 block from `if [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ]; then` to its closing `fi`. Also `scripts/lib/sandbox-probe/session.sh`, beside `sp_track_pid`.

The `harness-runs/lessons.md` entry *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike…"* (`## Remote and branch-scoped operations`) is a named check. The story index's risk entry relies on it too: "Task 4 bounds T2's waits so teardown never removes a clone under a live gate worker without first waiting for its verdict."

T2's worker is started by `run-test-suite.sh` inside the session as `nohup … &` and `disown`. It is detached from the probe, so the probe's INT does not reach it and nothing in the probe's process tree stops it. The probe learns its PID only from `$lane.running`. Today `sp_leg_gates` reads that PID and calls `sp_track_pid` only in the `elif [ -f "$lane.running" ]` branch, which runs **after** the collect loop `while [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ] && [ "$waited" -lt "$SP_T2_COLLECT_SECONDS" ]` has used up its full 1800 s.

The likeliest moment for a maintainer to press Ctrl-C is during that wait of up to 30 minutes. When they do, or a TERM arrives:
1. `sp__on_signal` runs `sp_teardown`.
2. `sp__td_stop_pids` finds no worker PID in `SP__PIDS`.
3. The clone loop removes `SP_CLONE` while the worker is still running in it.
4. The worker keeps running, with its working directory deleted, after the probe has exited.

That is the race the plan says Task 4 closes, on an exit path the lesson requires and the current code does not cover. The fix tracks the worker before the wait. It untracks the worker once it has ended on its own, so a reused PID is never TERMed at teardown.

**Fix:**

1. In `scripts/lib/sandbox-probe/session.sh`, add this function right after `sp_track_pid`:

```bash
# sp_untrack_pid <pid> — teardown no longer stops this process: it has ended on its own, and its PID
# may be reused before teardown runs.
sp_untrack_pid() {
  local p rest=""
  while IFS= read -r p; do
    [ -n "$p" ] && [ "$p" != "${1:-}" ] && rest="$rest$p"$'\n'
  done <<EOF
$SP__PIDS
EOF
  SP__PIDS="$rest"
}
```

   In the `THE SESSION API.` header list, add this line right after the `sp_track_pid <pid>` line:

```bash
#   sp_untrack_pid <pid>     drop a tracked process that ended on its own, so teardown never stops a reused PID
```

2. In `scripts/lib/sandbox-probe/legs-local.sh` → `sp_leg_gates`, replace the whole T2 block that starts `if [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ]; then` and ends at its matching `fi` (the one before `if [ -f "$lane.log" ] && cp -- …`) with:

```bash
    if [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ]; then
      # Tracked before the wait, so the EXIT/INT/TERM teardown stops a live worker before it removes the
      # clone under it on every exit path, not only when the wait runs out.
      pid=""
      IFS= read -r pid <"$lane.running" || true
      case "$pid" in '' | *[!0-9]*) pid="" ;; *) sp_track_pid "$pid" ;; esac
      waited=0
      while [ ! -f "$lane.verdict" ] && [ -f "$lane.running" ] && [ "$waited" -lt "$SP_T2_COLLECT_SECONDS" ]; do
        sleep "$SP_T2_POLL_SECONDS"
        waited=$((waited + SP_T2_POLL_SECONDS))
      done
      if [ -f "$lane.verdict" ]; then
        note="the verdict was collected by the probe after the session, ${waited}s later"
        [ -z "$pid" ] || sp_untrack_pid "$pid"
      elif [ -f "$lane.running" ]; then
        note="no verdict ${waited}s after the session and the gate worker still holds .running"
      else
        note="the gate worker removed .running ${waited}s after the session without a verdict"
        [ -z "$pid" ] || sp_untrack_pid "$pid"
      fi
    fi
```

   The `elif` branch stays tracked, so teardown stops a worker that outlives the wait, as it does today. Teardown already stops tracked processes before it removes any clone: `sp__td_stop_pids` runs before the clone loop in `sp_teardown`.

3. In the header comment of `legs-local.sh`, replace the sentence `A worker still running after the session is polled for up to SP_T2_COLLECT_SECONDS, so teardown never removes the clone under it.` with: `A worker still running after the session is tracked for teardown and polled for up to SP_T2_COLLECT_SECONDS, so teardown never removes the clone under it, interrupted or not.`

This change needs no new test case and runs no tests. `sp_leg_gates` launches sessions, and no test drives it. `sp_track_pid`'s teardown stopping is already driven by `cli/test/sandbox-probe-evidence.test.mjs`. The full suite runs later, in the Run gates phase.
