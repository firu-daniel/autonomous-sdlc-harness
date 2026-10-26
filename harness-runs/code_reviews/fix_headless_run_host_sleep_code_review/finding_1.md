### 1. A hold released to `off` mid-run is never taken again — not when the key is turned back on, and not after one unreadable config pass

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`keep_awake_pass`, `keep_awake_retake`): "case \"$KEEP_AWAKE_MODE\" in". Its byte-identical mirror is `scripts/autonomous-watcher.sh`.

**What goes wrong.** `tick` calls `keep_awake_resolve` and then `keep_awake_pass` on every pass. When `KEEP_AWAKE_MODE` resolves to `off`, the pass's `off)` arm kills every live holder and rewrites the record to `keep_awake off keep_awake_pid ""`. When the mode later resolves to a holding mode again, nothing takes the hold back:

- **`caffeinate`:** `keep_awake_pass` has no arm for this mode, so it does nothing.
- **`logind`:** the pass re-takes a hold only from `held` or `battery`. Its `elif` reads `{ [ "$state" = "held" ] || [ "$state" = "battery" ]; } && hr_on_mains_power`, so a record in `off` is never re-taken.

The run then finishes with no hold, while `execution.keepAwake` is `true`, and a closed lid freezes it.

`off` is reached in two ways while a run is in flight:

1. **The operator turns the key off and then on again.** `docs/cli.md` §6 promises that the watcher "reads the key from the main checkout on its next pass, with no restart". Turning it back on is never applied to a running engine.
2. **One pass that cannot read the configuration.** `hr_keep_awake_mode_var` treats `hr_keep_awake`'s status `2` as `off`, and `hr_keep_awake` returns `2` whenever `hr_config_load` fails. That covers an editor's non-atomic save, a `git checkout` rewriting `harness.config.json` in the main checkout, or a briefly missing `defaultBranch`. One such pass, out of a run lasting hours, drops the hold for every running engine for good.

This is the case `harness-runs/lessons.md` → `## Unattended control loops` names: *"A process that turns off a shared switch another actor can turn on must check the enabling condition again after switching it off, and switch it back on if needed."* No suite reaches the `off)` arm of `keep_awake_pass`. `cli/test/watcher-keep-awake.test.mjs` case `(d)` launches with the key already `false`, and no case changes the key while a session is live.

**Fix.** Apply every script edit below to both `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`, byte for byte. Run `cmp` on the pair afterwards.

1. Give `keep_awake_retake` a mode argument. Keep the existing logind log line, because the `MAINS_RETAKE` constant in `cli/test/watcher-keep-awake.test.mjs` matches it:

```sh
# keep_awake_retake <branch> <engine_pid> <mode> — the hold taken again by the
# pass below: on `logind` once mains power is back, and on either mode once the
# mode holds again after a release to `off`.
keep_awake_retake() {
  local b="$1" epid="$2" mode="$3" tool="caffeinate"
  [ "$mode" != "logind" ] || tool="systemd-inhibit"
  hr_keep_awake_hold_var "$mode" "$epid" "$b" || :
  registry_set "$b" keep_awake "$HR_KEEP_AWAKE_STATE" keep_awake_pid "$HR_KEEP_AWAKE_PID"
  if [ "$HR_KEEP_AWAKE_STATE" = "held" ] && [ "$mode" = "logind" ]; then
    log "keep-awake: mains power — holding the host awake for '$b' again ($tool pid $HR_KEEP_AWAKE_PID)"
  elif [ "$HR_KEEP_AWAKE_STATE" = "held" ]; then
    log "keep-awake: holding the host awake for '$b' again ($tool pid $HR_KEEP_AWAKE_PID)"
  else
    log "keep-awake: not holding for '$b' — $HR_KEEP_AWAKE_DETAIL"
  fi
}
```

2. In `keep_awake_pass`, add a `caffeinate)` arm and widen the `logind)` arm so that it also re-takes from `off`. Leave the `off)` arm and the existing `held`-with-a-live-holder branch as they are:

```sh
      caffeinate)
        if [ "$state" = "off" ] && ! { [ -n "$hpid" ] && kill -0 "$hpid" 2>/dev/null; }; then
          keep_awake_retake "$b" "$epid" caffeinate
        fi
        ;;
      logind)
        if [ "$state" = "held" ] && [ -n "$hpid" ] && kill -0 "$hpid" 2>/dev/null; then
          # … unchanged: release on battery, re-read power, keep_awake_retake "$b" "$epid" logind …
        elif { [ "$state" = "held" ] || [ "$state" = "battery" ] || [ "$state" = "off" ]; } && hr_on_mains_power; then
          keep_awake_retake "$b" "$epid" logind
        elif [ "$state" = "off" ]; then
          registry_set "$b" keep_awake battery keep_awake_pid ""
          log "keep-awake: on battery — no hold for '$b' until mains power returns"
        fi
        ;;
```

Inside the unchanged branch, change its one existing call from `keep_awake_retake "$b" "$epid"` to `keep_awake_retake "$b" "$epid" logind`. `refused` and `failed` stay outside every re-take condition, so a refused lock is still never retried.

3. **Header.** In the header's `KEEP AWAKE` block, replace the bullet's clause *"and when the key turns `off` every live holder is dropped"* with: *"when the mode turns `off` every live holder is dropped, and when it holds again — the key turned back on, or a configuration that reads again — a released record is held again, on either platform"*. Update the comment above `keep_awake_pass` to match: *"release every hold when the mode is `off`, take it again on a record released to `off` once the mode holds, and on `logind` follow mains power"*.

4. **Docs.** In `docs/cli.md` §6, the **Keeping the host awake.** paragraph's closing text reads *"The watcher reads the key from the main checkout on its next pass, with no restart, and releases any hold a running engine carries."* Append to that sentence: *", and takes the hold again for a running engine when the key is turned back on."*

5. **Test.** Add a case to `cli/test/watcher-keep-awake.test.mjs`, built on `f.session(MACOS_PROBE)` the way case `(k)` uses `f.session(LINUX_PROBE)`:
   - After pass 1, assert `keep_awake` is `held` and keep its `keep_awake_pid` as the first holder.
   - Rewrite `harness.config.json` in `f.dir` with `execution.keepAwake: false` and call `session.next()`. Assert that the record reads `keep_awake: 'off'`, that `watcher.log` carries `keep-awake: released 'feat_x' — execution.keepAwake is false`, that `f.holderGone(first)` holds, and that the engine is still alive.
   - Rewrite the file with `execution.keepAwake: true` and call `session.next()`. Assert that the record is `held` again with a new, live `keep_awake_pid`, and that the last `f.recorded('caffeinate')` entry is `['-s', '-i', '-w', <engine pid>]`. End the session.

   Run that file's own suite only: `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`. The full suite runs later, in the Run gates phase.

- **Deviations from plan:** Dispatched on the `cli` layer (path `cli`), so only `cli/templates/scripts/autonomous-watcher.sh` (fix steps 1–3) and `cli/test/watcher-keep-awake.test.mjs` (step 5) were edited. The mirror `scripts/autonomous-watcher.sh` and `docs/cli.md` (step 4) lie in the `general` layer and were not touched: `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` now reports `differ: char 9552, line 134` (exit 1). A `general`-layer dispatch must copy the same three script edits (the header bullet, `keep_awake_retake`, `keep_awake_pass` and its comment) into `scripts/autonomous-watcher.sh` until `cmp` exits 0, and append the step-4 clause to `docs/cli.md` §6. In the comment above `keep_awake_pass`, the existing sentence "`caffeinate` needs nothing, because `-s` already lapses on battery" was reworded to "needs nothing more", because the new `caffeinate)` arm makes the old wording false. The new test case is `(l)`, placed after `(d)`. `npm test --workspace cli -- test/watcher-keep-awake.test.mjs` returned `# tests 9`, `# pass 9`, `# fail 0`. `bash scripts/typecheck.sh` printed `PASS: typecheck`.
- **Deviations from plan:** `general`-layer dispatch: copied the step 1–3 edits (header bullet, `keep_awake_retake`, the comment above `keep_awake_pass`, the `caffeinate)` arm and the widened `logind)` arm) into `scripts/autonomous-watcher.sh`; `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` now exits 0 with no output. Appended the step-4 clause to the **Keeping the host awake.** paragraph of `docs/cli.md` §6. This dispatch edited no test file, so step 5's single-file run was not repeated here; the suite that covers `scripts/autonomous-watcher.sh` and `cli/test/watcher-keep-awake.test.mjs` is deferred to the Run gates phase. `bash scripts/typecheck.sh` printed `PASS: typecheck`.
