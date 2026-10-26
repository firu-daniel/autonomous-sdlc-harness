### Task 6 — Pin the stall watchdog's host-sleep discount with a simulated long sleep, and prove it still kills a genuinely hung run

**Goal:** A new suite drives the real `check_stalled_runs` of the `init`-written watcher. It proves that a run silent across a simulated long host sleep is not killed at the first pass after wake. The same run is killed once a full `STALL_KILL_SECS` of awake time has passed since the wake. A hang with no host sleep is killed exactly as before.

**Depends on:** Task 4 and Task 5.

**Task 4** fixes the mechanism in `cli/templates/scripts/autonomous-watcher.sh`:

- **State files:** `$LOGS_DIR/.host_last_tick` and `$LOGS_DIR/.host_woke_at` (`<state_dir>/autonomous_logs/`), each one epoch integer.
- **Wake detection:** `host_wake_pass` runs first in `tick`. When `now - last > POLL_INTERVAL_SECS + STALL_WAKE_GAP_SECS` it writes `now` to `.host_woke_at` and logs `host-wake: <gap>s since the last pass (over POLL_INTERVAL_SECS + STALL_WAKE_GAP_SECS) — the host slept or the watcher was not running; the stall watchdog measures silence from <time>`. It then always writes `now` to `.host_last_tick`.
- **The discount:** `check_stalled_runs` measures `staleness` from the later of the newest liveness mtime and `.host_woke_at`. When the wake is the later one and the raw silence is at least `STALL_WARN_SECS`, it logs once per wake `stall-watchdog: '<b>' silent <raw>s, but the host woke at <time> — measuring silence from the wake`, recording `stall_wake_noted`.
- **The kill line is unchanged:** `stall-watchdog: '<b>' is hung (<s>s with no output, pid <pid>) — killing its process tree`.

**Task 5** exports `DEFAULT_KEEP_AWAKE_PROBE` from `cli/test/helpers/watcher.mjs`. This suite's own pass script defines that override beside the sandbox one, so no case starts a real holder.

**Where this task stops.** Tests only. No template edit: a defect found here is reported against Task 4's file, not patched from this one.

### Targets

- `cli/test/watcher-stall-host-sleep.test.mjs` (new) — the simulated-sleep cases.

**Work:**

- [ ] **Header and harness.** Open with the rule: *"host-suspended time is never counted as a run's silence, and a run that is silent while the host is awake is still killed."* Build on `createWatcherFixture`, and write a pass script modeled on `cli/test/watcher-stall-reset-payloads.test.mjs` → `localStall`. The launch pass does not `wait` on a hung stub, and later passes run `tick` alone. It defines both `hr_sandbox_prereq_probe_var` from `DEFAULT_SANDBOX_PROBE` and `hr_keep_awake_probe_var` from `DEFAULT_KEEP_AWAKE_PROBE`. Use `STALL_CHECK_ENABLED=1`, `STALL_WARN_SECS=1`, `STALL_KILL_SECS=60`, `STALL_WAKE_GAP_SECS=60`, `POLL_INTERVAL_SECS=15`, `STALL_BUSY_CPU_PCT=100000` (lifting the CPU guard as that suite does) and `STALL_MAX_RESTARTS=0`. With the restart cap at 0, a kill ends the record `failed` (`stalled <s>s, exceeded 0 watchdog restarts`) instead of resetting and relaunching, so a case asserts the kill decision without the reset path, which `watcher-stall-reset-payloads` already covers. The stub body writes `hung` and then sleeps until a control file appears, so it stays alive and silent. Back-date liveness by `touch -t` on `<branch>.log` and `<branch>.stream.jsonl`, as the watcher header's `a stall` REPRO row does. Write epochs into the two state files from the test.
- [ ] **(a) Long sleep, first pass after wake.** Back-date both liveness files 4000 s. Write `.host_last_tick` = now − 4000, and leave `.host_woke_at` absent. Run one pass, and assert four things. `watcher.log` carries one `host-wake:` line and one `measuring silence from the wake` line for `feat_x`, and no `is hung` line. The record is still `running` with `stall_killing` empty. The recorded `pid` is alive. `.host_woke_at` holds an epoch within the pass's window, and `.host_last_tick` was rewritten to now.
- [ ] **(b) Still silent one window after the wake.** Continue the same run: rewrite `.host_woke_at` to now − 120, more than `STALL_KILL_SECS` ago, and `.host_last_tick` to now − 5, which is no gap. Run one pass. The `is hung` line appears, the record ends `failed` naming the restart budget, the recorded `pid` is gone, and no second `host-wake:` line is written. A wake the run's silence has outlasted by a full window no longer protects it.
- [ ] **(c) A genuinely hung run with no host sleep.** On a fresh fixture, back-date both liveness files 4000 s and write `.host_last_tick` = now − 5. Run one pass. No `host-wake:` line, no `measuring silence from the wake` line, and the `is hung` line and the `failed` record appear on this pass, which is today's kill decision unchanged.
- [ ] **(d) The first pass ever, and a non-integer file.** With no `.host_last_tick` at all, a pass writes one and logs no `host-wake:` line. With `.host_last_tick` holding `garbage`, the same holds. Neither file being unreadable as an epoch may defer a kill: repeat (c)'s back-date and assert the kill.

**Verification:**

- `npm test --workspace cli -- test/watcher-stall-host-sleep.test.mjs` passes.
- Cases (a) and (c) are each other's perturbation. They have the same back-date, the same thresholds and the same hung stub, differing only in the last-pass epoch, and one is killed while the other is not. The header says so, as `docs/outer-loop-verification.md` §2.6 says of its idle and spinning rows.
- Every case ends its stub through the control file and leaves no stub process behind.
