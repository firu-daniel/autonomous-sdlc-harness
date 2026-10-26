# Task plan review — iteration 1

All four Must Fix items from iteration 0 are resolved in the artifact:
- Scope register row 31 and the sixth derivation entry are in place, and Task 9 owns the reworded `docs/config.md` sentence.
- Task 4 extends the `Registry helpers.` field set.
- Task 8 adds the `KEEP_AWAKE_LOCK_PROBE_ENV` seam in `ISOLATED_ENV`.
- Tasks 2 and 3 count only mains-class, non-`Device` supplies.

I re-ran all six command entries verbatim and re-walked both procedure entries (the §2.6 table's ten rows, and the ledger). Every site they reach is a row.

## Must Fix

1. **A braked watcher never releases the Linux hold on battery, and never applies a switch to `off`** — `task_4_plan.md`.
   Task 4 calls `keep_awake_pass` "in `tick` right after `check_stalled_runs`". In `cli/templates/scripts/autonomous-watcher.sh` → `tick`, `check_stalled_runs` sits **after** the kill-switch early return:
   ```
   if kill_switch_active; then
     log "global kill switch active — not launching or resuming runs this pass"
     lane_release_if_idle
     return 0
   fi
   ```
   The kill switch stops launches and resumes only. Runs already in flight keep running under it.
   - So while the switch is on, a `held` logind lock is never re-checked against `hr_on_mains_power`. A laptop unplugged and closed in a bag stays awake for the rest of the run.
   - That is the outcome goal 2 rules out: *"Release it when the host switches to battery, and take it again on AC; the watcher's poll tick is a fine granularity for that."*
   - The same gap leaves a `config set execution.keepAwake false` made while braked unapplied.
   - The plan already handles this case for wake tracking: `host_wake_pass` is placed "before the kill-switch return, so a braked watcher still tracks its passes". The power pass was not given the same placement.

   **Fix:** in `task_4_plan.md`:
   - In the `keep_awake_pass` Work bullet, have the pass run on every local pass, braked passes included. Either call it ahead of the kill-switch return (after `keep_awake_resolve`), or call it in the braked branch before `return 0` as well as after `check_stalled_runs`.
   - State why in the header's KEEP AWAKE block: the brake stops launches, not in-flight runs, so the hold they carry must still follow mains power.
   - Optionally, name a matching case in `task_5_plan.md` → **Linux and WSL2 cases**: with the kill switch active, writing `0` still releases the hold.

## Should Fix

1. **The accepted test cost still covers only macOS** (carried from iteration 0, Should Fix 1) — story index, `## Context` → **Accepted test cost**. The unedited suites that run their own pass script (`watcher-stall-reset-payloads`, `watcher-sandbox-refusal`) use the real `hr_keep_awake_probe_var`. On a Linux developer host, each launch then does one of two things:
   - with `systemd-inhibit` present, it runs the real `timeout 10 systemd-inhibit … true` probe and takes a real block lock;
   - with the tool missing, or on WSL2, it writes a non-quiet `keep-awake: not holding …` line to `watcher.log`.

   Either state those costs, or give those suites' pass scripts the silent default probe.
2. **A long pass reads as a host wake** (carried from iteration 0, Should Fix 2) — `task_4_plan.md`. `host_wake_pass` writes `.host_last_tick` only at the start of a pass, so the gap it measures includes the previous pass's own duration. Any pass over `STALL_WAKE_GAP_SECS` (300 s) defers a hung run's kill by one window. Also write `now` to `.host_last_tick` at the end of `tick`, on every return path, or state this cost beside the watcher-downtime cost in the header.
3. **`GITHUB_ACTIONS` is read as a bare literal** (carried from iteration 0, Should Fix 4) — `task_8_plan.md` → `probeKeepAwakeHost` reads `process.env['GITHUB_ACTIONS']`. `.claude/context/conventions.md` → *"An environment-variable name is a constant with an owner too … never retyped as a literal"*. Declare the name once (for example in `cli/src/doctor/keepAwake.ts`, Task 7) and read it through that constant.
4. **Task 10's closure check names a stale count** — `task_10_plan.md` → **Verification:** says "Re-run the story index's five `## Scope register` command entries verbatim". The index now carries six. Drop the cardinal ("every command entry"), so the sixth entry, which reaches `docs/config.md`, is not skipped.
