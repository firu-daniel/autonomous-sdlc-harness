### 1. JS3's plant credits the idle `node` call alone with keeping the watchdog's busy-CPU guard closed, but the guard sums the run's whole process tree

**File:** `scripts/lib/gate12-sandbox-round/default-branch.sh` (the file header, the paragraph that opens "An honest task does not go STALL_KILL_SECS silent on its own") — "and an idle `node` process stays under STALL_BUSY_CPU_PCT, so the watcher counts it silent"

**The claim.** The header says JS3's stall works because an idle `node` process stays under `STALL_BUSY_CPU_PCT`, so the watcher counts the run as silent. That is the justification for the plant's route, and the code it relies on does not support it.

**What the watcher actually checks.** `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`, past the `STALL_KILL_SECS` tier:

```bash
tree_cpu="$(ps -o %cpu= -p "$pid" $(collect_descendants "$pid") 2>/dev/null | awk '{s+=$1} END{printf "%.0f", s}')"
...
if [ "$tree_cpu" -ge "$STALL_BUSY_CPU_PCT" ]; then
  log "stall-watchdog: '$b' silent ${staleness}s but its process tree is at ~${tree_cpu}% CPU — busy, not hung; deferring the kill"
  continue
fi
```

`$pid` is the registry's spawn subshell. `collect_descendants` walks `pgrep -P` recursively, so the sum covers the agent CLI and every process under it, not only the `node` that `scratch-run.sh` execs. The idle `node` is one term of that sum. The header's "so the watcher counts it silent" reasons from that one term alone.

**Why the gap matters on the runner JS3 targets.** JS3 runs on a GitHub-hosted Linux runner. procps `ps -o %cpu` reports each process's CPU time divided by its elapsed lifetime, not the decaying one-minute average the watcher's own comment beside `STALL_BUSY_CPU_PCT` describes (that holds for BSD/macOS `ps`). By the time the stall starts, the agent CLI has been running the delivery flow for minutes. Its lifetime average is not near zero just because its current Bash call is idle. The default threshold is 1. `cli/templates/github/workflows/harness-run.yml` passes only `STALL_WARN_SECS`, `STALL_KILL_SECS` and `STALL_MAX_RESTARTS` from repository variables, so the driver has no way to move `STALL_BUSY_CPU_PCT`. Whether the tree stays under 1 during the stall has not been measured. If it does not, the watchdog logs "deferring the kill" every pass until the `node` call returns after `S` seconds, and JS3 grades `not run` again.

**Fix.** Make the header state what is known and what is not. In `scripts/lib/gate12-sandbox-round/default-branch.sh`, replace the exact substring

```
a scratch-run.sh call because that is allow-listed and guard-allowed in the job's profile, and an idle
# `node` process stays under STALL_BUSY_CPU_PCT, so the watcher counts it silent.
```

with

```
a scratch-run.sh call because that is allow-listed and guard-allowed in the job's profile. The watcher
# kills a silent run only while its whole process tree, the agent CLI included, sums under
# STALL_BUSY_CPU_PCT (autonomous-watcher.sh → check_stalled_runs), which harness-run.yml does not set; on
# a Linux runner `ps -o %cpu` is each process's lifetime average, so whether the tree stays under it
# during the stall is not measured, and a "deferring the kill" line in the job's watcher log is that guard.
```

Keep the `#` comment prefix and the line breaks of the surrounding paragraph as they are. This edits a comment only: it changes no behaviour and no fixture, and it calls for no test run.
