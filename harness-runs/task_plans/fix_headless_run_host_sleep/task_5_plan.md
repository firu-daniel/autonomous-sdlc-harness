### Task 5 — Drive the written watcher's keep-awake hold end to end, and give the shared watcher driver a silent default keep-awake probe

**Goal:** A new suite launches a session through the real `init`-written `autonomous-watcher.sh` and proves five things. The hold waits on the engine's own pid. It ends when the engine ends. It leaves the exit classification and the stream untouched. It follows mains power on Linux. And every off arm behaves as specified. The shared driver `cli/test/helpers/watcher.mjs` gains a default probe override, so every suite built on it stays hermetic.

**Depends on:** Task 4, which fixes this wire in `cli/templates/scripts/autonomous-watcher.sh`:

- **Registry fields:** `engine_pid`, `keep_awake` (`held`|`battery`|`refused`|`failed`|`off`), `keep_awake_pid`.
- **Log lines**, byte for byte: `keep-awake: holding the host awake for '<branch>' (<caffeinate|systemd-inhibit> pid <h>, engine pid <e>)`, `keep-awake: '<branch>' launched on battery — no hold until mains power returns`, `keep-awake: not holding for '<branch>' — <detail or reason>`, `keep-awake: mains power — holding the host awake for '<branch>' again (systemd-inhibit pid <h>)`, `keep-awake: on battery — released the hold for '<branch>'`.
- **`status`:** the `tunables:` line ends `… STALL_WAKE_GAP_SECS=<n> KEEP_AWAKE=<mode>` and is followed by `keep-awake: <mode>[ — <reason>]`.
- **The per-pass Linux power check** (`keep_awake_pass`) runs in `tick` right after the mode is re-resolved, ahead of the kill-switch early return, so it runs on braked passes too.

Task 2's library supplies the probe seam this suite overrides: `hr_keep_awake_probe_var`, setting `HR_KEEP_AWAKE_HOST` and `HR_KEEP_AWAKE_TOOL`. It also supplies the power seam `HR_POWER_SUPPLY_DIR` and the reason strings `execution.keepAwake is false` and `WSL2 — nothing inside WSL can keep Windows awake; …`.

**Where this task stops.** Tests and the shared driver only. The watchdog's wake discount is **Task 6**'s suite.

### Targets

- `cli/test/helpers/watcher.mjs` — `DEFAULT_KEEP_AWAKE_PROBE` and the `keepAwakeProbe` option of `tick`.
- `cli/test/watcher-keep-awake.test.mjs` (new) — the end-to-end cases.

**Work:**

- [ ] **The shared driver.** Export `DEFAULT_KEEP_AWAKE_PROBE = 'HR_KEEP_AWAKE_HOST=unsupported; HR_KEEP_AWAKE_TOOL=; return 0'`. Give `tick` a `keepAwakeProbe` option defaulting to it, and define the override in the pass script right after the sandbox one: `hr_keep_awake_probe_var() {\n<body>\n}`. The pass re-resolves the mode at the top of `tick`, so the override governs every launch. The start-up resolution that runs while the script is sourced for `status` uses the real probe, and its output is already discarded. Extend the module header's choice 5 to say that an unsupported host is the silent `off` arm, so no suite built here starts a real `caffeinate` or `systemd-inhibit` or gains a log line. Also name the suites that run their own pass script, `cli/test/watcher-stall-reset-payloads.test.mjs` → `localStall` among them, as not covered by it (story index `## Context`, *Accepted test cost*).
- [ ] **Harness for the new suite.** Open it with its rule: *"the hold waits on the engine's own pid and ends with it, and never changes the engine's exit classification or its stream."* Build on `createWatcherFixture`. Prepend a stub directory to `PATH` holding a recording `caffeinate` and a recording `systemd-inhibit`, each behaving as in `cli/test/keep-awake-lib.test.mjs`: argv to a file, `-w` / waiter honoured, and the probe's exit taken from a control file. Set `GITHUB_ACTIONS: ''` in every pass's environment. The stub engine's body (`setStub`) writes `$$` to a file. For the multi-pass Linux cases, the session must outlive a pass. Follow `watcher-stall-reset-payloads.test.mjs` → `localStall`: one script launches without `wait`, later passes run `tick` alone, and a control file ends the stub. Bound every wait.
- [ ] **macOS cases.** These use the probe body `HR_KEEP_AWAKE_HOST=macos; HR_KEEP_AWAKE_TOOL=caffeinate; return 0`.
  - **(a)** A task drop launches. The stub records argv `-s -i -w <pid>`, where `<pid>` equals the stub engine's `$$`. `watcher.log` carries `keep-awake: holding the host awake for 'feat_x' (caffeinate pid <h>, engine pid <same pid>)`. The record carries `engine_pid` and `keep_awake` `held`. Once the pass's `wait` returns, the holder pid is gone.
  - **(b)** The same with a stub body `exit 3`. The record ends `failed`, exactly as it does without a hold, because `rc` is the engine's.
  - **(c)** `<branch>.stream.jsonl` contains no `keep-awake` text in either case.
  - **(d)** With `execution.keepAwake` set to `false` in the fixture's `harness.config.json`, written as this repository's suites already change a fixture's configuration: no stub invocation, `keep_awake` `off`, no `keep-awake:` line in `watcher.log`. `status` prints `KEEP_AWAKE=off` on its `tunables:` line, then `keep-awake: off — execution.keepAwake is false`.
- [ ] **Linux and WSL2 cases.** These use the probe body `HR_KEEP_AWAKE_HOST=linux; HR_KEEP_AWAKE_TOOL=systemd-inhibit; return 0` and a temp `HR_POWER_SUPPLY_DIR` with `AC/online` beside `AC/type` = `Mains`. Task 2 counts only an entry whose `type` is `Mains` or the `USB` family, and whose `scope` is not `Device`, so an `AC/` with no `type` file would be skipped and read as AC whatever its `online` said.
  - **(e)** On `1`, with the probe answering `0`, the session launches `held`. The holder argv ends `keep-awake-wait <engine pid>`.
  - **(f)** Write `0` and run a pass. `on battery — released the hold for 'feat_x'`, `keep_awake` `battery`, and the holder is gone while the session lives.
  - **(g)** Write `1` and run a pass. `mains power — holding the host awake for 'feat_x' again`, `held`, and a live new holder.
  - **(h)** End the session. The holder exits.
  - **(i)** With the probe answering `1`: one `not holding for 'feat_x' — systemd-inhibit exited 1 — …` line, the prompt is still recorded (the launch went ahead), `keep_awake` `refused`, and a later pass on mains takes no new hold.
  - **(j)** With the probe body `HR_KEEP_AWAKE_HOST=wsl2; HR_KEEP_AWAKE_TOOL=; return 0`: exactly one `not holding for 'feat_x' — WSL2 — …` line, and no stub invocation.
  - **(k)** With the session `held` on mains, engage the global kill switch the way `cli/test/watcher-remote-dispatch.test.mjs` and `cli/test/watcher-remote-job.test.mjs` already do, then write `0` and run a pass. The pass logs `global kill switch active`, and also `on battery — released the hold for 'feat_x'`. The record reads `keep_awake` `battery`, and the holder is gone while the session lives. Release the switch before the case ends.
- [ ] **The default probe stays silent.** In one case, a launch through the driver's default `tick` leaves `watcher.log` with no `keep-awake:` line and records `keep_awake` `off`. That proves the helper's override is in effect.

**Verification:**

- `npm test --workspace cli -- test/watcher-keep-awake.test.mjs` passes.
- After the suite, no `caffeinate`, `systemd-inhibit` or `keep-awake-wait` stub process survives. Every case asserts its holder gone before it ends.
- The driver is used by suites this task does not run. Its edit is confined to the new export, the new option and the header choice, and `git diff cli/test/helpers/watcher.mjs` shows no other change.
