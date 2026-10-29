### Task 3 — Default the placeholder-host seam to off in every watcher test pass, with a `placeholderHost` option to turn it on

**Goal:** Keep every existing watcher suite host-independent once Task 4 gates behaviour on `hr_placeholder_host_probe_var`. CI runs on Linux, and without this default every `tick` there would take the bubblewrap arms: the trio omitted, the sweep, the launch check and a cap of 1. Give a case a way to opt in.

**Depends on:** Task 2, which defines `hr_placeholder_host_probe_var` in `cli/templates/scripts/lib/harness-run-lib.sh`. Its contract: it sets `HR_PLACEHOLDER_HOST` to `1` on a bubblewrap host and `0` otherwise, always returns 0, and is a seam tests redefine. **Task 4** is the first caller, and **Task 11** the second. This task only installs the override, the way `hr_keep_awake_probe_var` is overridden today.

### Targets

- `cli/test/helpers/watcher.mjs`
- `cli/test/watcher-stall-reset-payloads.test.mjs` → `localStall`
- `cli/test/watcher-stall-host-sleep.test.mjs`
- `cli/test/watcher-keep-awake.test.mjs` → `session`

**Work:**

- [ ] `helpers/watcher.mjs`:
  - Export `DEFAULT_PLACEHOLDER_HOST_PROBE = 'HR_PLACEHOLDER_HOST=0; return 0'`.
  - Have `tick` install `hr_placeholder_host_probe_var() { … }` from it, beside the `hr_sandbox_prereq_probe_var` and `hr_keep_awake_probe_var` overrides and in the same position relative to the watcher's sourcing.
  - Accept a `placeholderHost` option that, when `true`, installs `HR_PLACEHOLDER_HOST=1; return 0` instead.
  - Extend header item 5 by one sentence naming the new override and why: a Linux CI host would otherwise take the bubblewrap arms of `spawn_engine` and the cap.
- [ ] The three suites that build their own `tick` pass script rather than going through the helper's `tick`. Each installs `hr_sandbox_prereq_probe_var` from `DEFAULT_SANDBOX_PROBE` and `hr_keep_awake_probe_var` before its first `tick`. Add a third override, `hr_placeholder_host_probe_var() {\n${DEFAULT_PLACEHOLDER_HOST_PROBE}\n}`, beside those two, and add `DEFAULT_PLACEHOLDER_HOST_PROBE` to each file's import from `./helpers/watcher.mjs`:
  - `watcher-stall-reset-payloads.test.mjs` → `localStall`;
  - `watcher-stall-host-sleep.test.mjs`, the pass script that installs `DEFAULT_KEEP_AWAKE_PROBE`;
  - `watcher-keep-awake.test.mjs` → `session(probe)`. Its script is `'. "$1" status >/dev/null'`, then the sandbox override, then `hr_keep_awake_probe_var() {\n${probe}\n}`, then `tick` and the later `tick`s of its `until` loop. Its import line today names only `createWatcherFixture, DEFAULT_SANDBOX_PROBE, TICK_TIMEOUT_MS`.
- [ ] Close the set. Run `git grep -ln '\. "\$1" status' -- cli/test` and read each file it lists outside the four targets. A pass script that sources the watcher and then calls `tick` or `spawn_engine` gets the same override, and is **edited here** and added to `### Targets` — unless another task of this plan already owns that file, in which case that task installs it. A pass script that calls neither, only individual functions such as `registry_set` or `running_count`, reaches no code Task 4 gates on the seam and needs no override. At planning time the command also lists `cli/test/registry-writer.test.mjs` and `cli/test/watcher-running-count.test.mjs`, which call neither, and `cli/test/watcher-run-profile.test.mjs`, which is Task 4's target: it runs `tick` only through the helper (`f.tick()`), so the helper's default covers it, and its sourcing-only script calls functions such as `run_profile_entries` directly, where an `HR_PLACEHOLDER_HOST` that was never set does not read as `1`.

**Verification:**

- `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs`, `npm test --workspace cli -- test/watcher-stall-host-sleep.test.mjs` and `npm test --workspace cli -- test/watcher-keep-awake.test.mjs` pass.
- `git grep -n 'DEFAULT_PLACEHOLDER_HOST_PROBE' -- cli/test` lists the export, its use in `tick`, and an import and a use in each of `watcher-stall-reset-payloads.test.mjs`, `watcher-stall-host-sleep.test.mjs` and `watcher-keep-awake.test.mjs`.
- Every file `git grep -ln '\. "\$1" status' -- cli/test` lists whose own pass script calls `tick` or `spawn_engine` installs `hr_placeholder_host_probe_var`: no such file without it.
