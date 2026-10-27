### 1. N3's loopback listener stays registered for teardown after the leg has stopped it, so teardown TERMs its PID again, possibly a reused one

**File:** `scripts/lib/sandbox-probe/legs-network.sh` (`sp__net_listener_stop`), at `if ! sp_stop_pid "$pid"; then`

**What is wrong.** `sp__net_listener_start` registers the listener with `sp_track_pid "$!"`, which appends the PID to `SP__PIDS`. `sp__net_listener_stop` stops the listener in the middle of the leg through `sp_stop_pid`, but it never removes the PID from `SP__PIDS`. Only `sp_teardown` clears that list, and only at its end. So at teardown `sp__td_stop_pids` calls `sp_stop_pid` again on a PID whose process ended during the network leg. That second call happens after the retry, repo-settings, credentials and invalid-profile legs, each of which launches `claude` sessions and so creates many processes.

- If the PID is unused at teardown, `kill` fails and `sp_stop_pid` returns 0 without a message. That is the usual case, which is why this goes unnoticed.
- If the PID has been reused, teardown sends TERM to a process the probe never started. If that process ignores TERM for longer than `SP__PID_POLLS` polls, teardown raises exit 5 and prints `process <pid> the probe started is still running after TERM; stop it with: kill -9 <pid>`. A maintainer who follows that instruction kills an unrelated process.

**Why this is net-new, and why it contradicts the branch's own contract.** Code-review Finding 4 added `sp_untrack_pid` to `scripts/lib/sandbox-probe/session.sh` for exactly this hazard. Its comment reads: *"teardown no longer stops this process: it has ended on its own, and its PID may be reused before teardown runs"*. THE SESSION API header lists it as *"drop a tracked process that ended on its own, so teardown never stops a reused PID"*. `sp_leg_gates` (`legs-local.sh`) now untracks T2's worker on both branches where the worker is known to have ended. The N3 listener is the only other process the probe tracks. It is stopped and confirmed gone on the leg's normal path, but it is never untracked, so the header's "never stops a reused PID" guarantee does not hold for it. Neither the code review nor the architecture review raised this. The architecture review moved the stop into `sp_stop_pid`, and the code review added untracking for T2 only.

**Proof (caller grep under `scripts/` and `cli/test/`):**
- `sp_track_pid`: `legs-local.sh` (T2 worker) and `legs-network.sh` → `sp__net_listener_start` (`sp_track_pid "$!"`).
- `sp_untrack_pid`: `legs-local.sh` only, twice, both for T2's worker.
- `sp_stop_pid`: `session.sh` → `sp__td_stop_pids` and `legs-network.sh` → `sp__net_listener_stop`.

`sp__net_listener_stop` runs on both of the listener's stop paths: the start-failure path in `sp__net_listener_start` and the graded path in `sp_leg_network`, after the probe's own `reply` request. So the listener's PID stays in `SP__PIDS` on every run that starts it.

**Fix.** In `scripts/lib/sandbox-probe/legs-network.sh` → `sp__net_listener_stop`, untrack the PID once `sp_stop_pid` has confirmed the process is gone. Leave it tracked when the process survived, so teardown stays the backstop. Replace the function body with:

```bash
sp__net_listener_stop() {
  local pid="$SP__NET_LISTENER_PID"
  SP__NET_LISTENER_PID=""
  [ -n "$pid" ] || return 0
  if ! sp_stop_pid "$pid"; then
    sp_refuse "N3's loopback listener $pid is still running after TERM; teardown stops it"
    return 1
  fi
  # Gone: untracked, so teardown never TERMs this PID again once another process may hold it.
  sp_untrack_pid "$pid"
  return 0
}
```

`legs-network.sh` is sourced after `session.sh` (see the fixed source order in `scripts/sandbox-probe.sh`), so `sp_untrack_pid` is defined when the leg runs. Change nothing else. No result line or row changes, so nothing in `docs/sandbox-verification.md` or Gate 15 changes.

No test changes. `sp__net_listener_stop` needs a live `python3` listener started by the leg, and no suite drives it. `cli/test/sandbox-probe-remote-legs.test.mjs` does not call it. So this fix runs no test, and the full suite runs later, in the Run gates phase.
