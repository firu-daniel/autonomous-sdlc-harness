`fix_headless_run_host_sleep` keeps the host awake for the whole life of every headless run the watcher launches. Today nothing in the harness does that. On a laptop with the lid closed, macOS sleeps while a run is in flight. The run doesn't fail; it freezes and continues on wake. On 2026-10-24 that cost two parallel runs about 66 minutes each.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The anchors were true at `ff0d612d` (`origin/dev`). Re-verify each one in the merged code before planning on it.

## What was observed

`fix_committer_plain_push_call` and `fix_swept_run_profile_leak` ran in parallel, both watcher-launched and local. `fix_committer_plain_push_call` changed three files, and its wall time was 132 min. In each run, six single model requests sat for 4–16 minutes and then returned 3–16 output tokens, usually one grep. The agents involved were the plan writer, the plan reviewer, the architecture reviewer and the orchestrator.

Both runs stalled at the same second and resumed at the same second, inside different agents. Each stall matches a sleep in `pmset -g log` (times are +03:00):

| Stall (both runs) | `pmset -g log` |
|---|---|
| 10:14:28 → 10:29:54 | `Sleep 10:14:27 … 'Clamshell Sleep'` → `DarkWake 10:29:47 … rtc/SleepService` |
| 10:30:06 → 10:37:52 | `Sleep 10:30:32 … 'Sleep Service Back to Sleep'` → `Wake 10:37:40 … HID Activity` |
| 10:41:38 → 10:58:08 | `Sleep 10:41:43 … 'Clamshell Sleep'` → `DarkWake 10:58:03` |
| 10:58:33 → 11:08:55 | `Sleep 10:59:03` → `DarkWake 11:08:36` |
| 11:09:19 → 11:13:37 | `Sleep 11:09:21 … 'Clamshell Sleep'` → `DarkWake 11:13:34` |
| 11:14:32 → 11:28:14 | `Sleep 11:14:33 … 'Maintenance Sleep'` → `Wake 11:28:10 … UserActivity` |

An independent cross-check comes from the session's own clock. The `result` event's `duration_ms` comes from a monotonic clock that does not advance while the host is suspended:
- `fix_committer_plain_push_call`: wall 132.4 min, `duration_ms` 66.5 min, a difference of 65.9 min.
- `fix_swept_run_profile_leak`: wall about 169 min, `duration_ms` 103.2 min, a difference of about 66 min.

That matches the summed sleep intervals after removing the short dark-wake windows.

The trigger: at 10:14:03 `pmset` logged `PID 74248(caffeinate) ClientDied PreventSystemSleep … 01:18:41`. That was a `caffeinate -dimsu` started by a shell function in the operator's `~/.zshrc`, which wraps **interactive** `claude` sessions only. The lid was already shut, so the Mac went into clamshell sleep 24 s later. At 11:33:22 the operator started a new `caffeinate -dimsu -w <shell pid>` by hand, and no run stalled after that.

Headless runs had been kept awake before only **by accident**: an interactive session or a caffeinated VS Code happened to be holding a `PreventSystemSleep` assertion. The headless `claude` binary itself spawns `caffeinate -i -t 300`, but `-i` only prevents **idle** sleep, not clamshell sleep.

## The cause

`git log --all -S caffeinate` finds nothing; the harness has never held a sleep assertion. `scripts/autonomous-watcher.sh` → `launch_run` → `spawn_engine` starts `"$AGENT_CLI" -p "$launch_prompt" …` in a background subshell. The service manager starts the watcher (`daemon install`'s launchd or systemd unit), so no shell rc file wraps it.

## The goal

1. **macOS: hold `PreventSystemSleep` for exactly the life of the engine process.**
   - When `spawn_engine` starts a run, also start `caffeinate -s -i -w <engine pid>`. `-w` makes it exit when the engine exits, so it can never outlive the run or leak.
   - Gate it on `uname` = Darwin and `command -v caffeinate`, like `open_log_terminal`. Leave it off for a job run (`HARNESS_JOB_MODE=1`).
   - `-s` is valid only on AC power (`man caffeinate`). That is the intended behaviour: on battery, closing the lid still sleeps the Mac, and the run resumes on wake as it does today.
   - Include `-i`, so an open lid on battery doesn't idle-sleep either. Leave out `-d`, because the display can sleep.
   - Find the pid that is actually the engine. The engine is the first element of a pipeline inside a subshell, so `$!` is the subshell's pid. One option is to run `caffeinate -s -i -w $BASHPID` from inside the subshell. The plan decides the mechanism and checks that the hold ends when the run ends, whether that is a normal exit, a crash, the stall watchdog's kill or a usage-gate pause.
2. **Linux: the same, on AC power only, best-effort.**
   - When `systemd-inhibit` is present and logind answers, hold `systemd-inhibit --what=sleep:handle-lid-switch --mode=block --who=autonomous-sdlc-harness --why="run <branch>"` for the life of the engine. Use the wrapping form or an equivalent that holds for the pid.
   - Both lock kinds are needed. logind's default `LidSwitchIgnoreInhibited=yes` makes a closed lid ignore a plain `sleep` lock, but it always honours a `handle-lid-switch` lock (`man logind.conf`).
   - **AC only, to match macOS.** Unlike `caffeinate -s`, a logind lock also holds on battery, so a closed laptop in a bag would stay awake. Take the lock only while `/sys/class/power_supply/*/online` reports mains power. Release it when the host switches to battery, and take it again on AC; the watcher's poll tick is a fine granularity for that. A host with no power-supply entries, such as a desktop or server, counts as AC.
   - Taking the lock goes through polkit. That is allowed by default for an active local session, but the watcher runs as a systemd **user** service, possibly lingering with no active session, and there polkit may refuse. When the lock is absent or refused, launch unchanged and write one log line.
   - No hold on GitHub Actions runners.
3. **The stall watchdog must not kill a run because the host slept.** The kill in `check_stalled_runs` needs two signals: a stale mtime measured on the wall clock (`STALL_KILL_SECS`, 2700 s) and an idle process tree (`STALL_BUSY_CPU_PCT`).
   - After a sleep longer than 45 min (on battery, where goals 1 and 2 do not hold, or with `keepAwake: false`), both signals look true at the first tick after wake, while the in-flight request is about to complete. The watchdog would then kill the process tree and restore the last commit, discarding any uncommitted work.
   - Make the watchdog discount host-suspended time. For example, compare the stale window against the host's sleep intervals, or against a monotonic-clock reading that excludes suspend. Alternatively, defer the kill decision for one full `STALL_KILL_SECS` window after a detected wake.
   - The plan picks the mechanism and pins it with a test that simulates a long sleep. The watchdog must still kill a genuinely hung run.
4. **An opt-out setting.** Add a `harness.config.json` key, for example `keepAwake`, defaulting to `true`, so an adopter can turn the hold off. Add it to `schemas/harness.config.schema.json`, `cli/src/config/model.ts` and `docs/config.md` → `## 5. Key reference`. The plan settles the exact name and where it sits. When it is `false`, goals 1 and 2 do nothing and the watcher's start-up `tunables:` line says so. Goal 3 applies either way.
5. **WSL2: detect and hand off, no hold.** Inside WSL2 nothing can keep Windows awake. When Windows sleeps, the WSL VM is frozen, and `systemd-inhibit` there has no effect on the host. The lid follows the Windows power plan's "When I close the lid" action, which no program can override. So on WSL take no lock, write one log line at launch, and leave the adopter-facing guidance to #160 `feat_wsl2_support`, which owns the WSL `doctor` checks and the Windows setup docs. If this branch lands first, its `doctor` check reports WSL2 as "cannot hold" with a pointer to setting the lid action to "Do nothing" on AC. If #160 lands first, plug into its WSL detection rather than adding a second one.
6. **`doctor`**: add a check that reports whether this host can hold a sleep assertion for a run. It is informational and never fails, with the remedy in its message:
   - macOS: `caffeinate` exists, noting that the hold applies on AC power only;
   - Linux: `systemd-inhibit` exists, logind answers, and a test lock can actually be taken from the watcher's context;
   - WSL2: per goal 5;
   - `keepAwake: false`: reported as off.
7. **Docs**: in `docs/cli.md` → "**What a host needs.**", state that a local run keeps the host awake on AC power only, that a closed lid on battery suspends the run until wake, that `keepAwake` turns the hold off, and what WSL2 needs, pointing at #160's Windows setup section.

## Constraints

- `scripts/` and `cli/templates/scripts/` are kept identical. Apply every script change to both.
- No per-request kill or retry timer. A request that is merely slow, or frozen by host sleep, must not be killed, because killing a session discards uncommitted work in the run copy.
- The hold must never outlive the run. Leaving a stray `caffeinate` holding `PreventSystemSleep` for days is the failure the operator's own shell function was rewritten to avoid.
- The hold must not change the engine's exit code: `rc=${PIPESTATUS[0]}` keeps reading the engine's status.
