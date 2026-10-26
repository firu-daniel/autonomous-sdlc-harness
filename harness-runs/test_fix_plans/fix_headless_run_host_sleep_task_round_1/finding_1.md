### 1. The keep-awake default-probe case fails: the shared root-cause check

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('the driver\'s default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold'` (near line 283), and its single `await f.pass();`. That call goes through `cli/test/helpers/watcher.mjs` → `async tick(`, which defaults `keepAwakeProbe = DEFAULT_KEEP_AWAKE_PROBE` and is bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh`:
- `tick() {` (near line 4840), which now runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the kill-switch return.
- `keep_awake_start() {` (near line 2371).
- `spawn_engine`'s launch head, `keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')" </dev/null >/dev/null 2>&1` followed by `exec "$AGENT_CLI" -p "$launch_prompt"` (near line 2782).

The library's side is `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_mode_var() {`. `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh` are byte-identical mirrors of these two templates (`cmp` exits 0 on both pairs today).

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold`

**The failure, quoted from the log:**

```
        not ok 1077 - the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log, because this is the branch's first Run gates round. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

This case is the most direct check of the code the branch added to every launch. It uses the shared driver's own default probe (`HR_KEEP_AWAKE_HOST=unsupported`, the silent `off` arm). It asserts `keep_awake` `off`, `status` `failed` for an engine exiting 3, and no `keep-awake:` line. So a defect in `keep_awake_start`, in the `exec` launch head or in the `rc=${PIPESTATUS[0]}` it feeds would show here first. That is why this finding goes first.

The evidence across the whole run points away from a defect in the tree:

1. **51 of the 52 failures are cases whose pass routes an inbox drop that cuts or reuses a clone.** In the same files, the cases that drive no such drop pass:
   - `watcher-run-profile.test.mjs`: the parked legacy resume and the `run_profile_check` case.
   - `watcher-remote-dispatch.test.mjs`: the four seeded remote-record cases.
   - `watcher-sandbox-refusal.test.mjs`: (a) and (c), which refuse before any copy.
   - `run-copy-migration.test.mjs`: its other two cases.

   The 52nd failure, Finding 34, is a job-mode sequence and cuts no clone. It is the only one of four cases sharing `playSequence` that waits under a fixed poll bound (`KILL_WAIT_TENTHS = 100`) for a launch, and the other three pass.
2. **The same drop path passes later in the same run, in the same files.** Cases in these files run in series, in file order.
   - In `cli/test/watcher-stall-reset-payloads.test.mjs`, the first seven local cases fail (the honest case, then S1, S2, S3, S5, S6, S7). The next six cases pass through the identical `localStall` drop, launch and pass script: S8, S9, S4, S4c, S10 and the S4 legacy case.
   - In `cli/test/watcher-review-drop-payloads.test.mjs`, the first ten cases fail, and L4, L7, L11 and R1 to R5 pass after them.

   A defect in the tree fails every case that crosses it. It does not fail a run of consecutive cases and then stop part-way through a file.
3. **This suite passed in isolation on the tree under test.** `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md` records the isolated result of `cli/test/watcher-keep-awake.test.mjs` on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`. Since `b49bf998`, `git diff --stat b49bf998 HEAD` shows only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md`.
4. **The suite ran long: `# duration_ms 2757435.082709`.** The previous branch's round-2 plan recorded runs of 2,342 s and 2,199 s.

The likely shared cause is therefore a transient condition on the gate host during part of the run, such as a host sleep or a load spike. A pass caught in it exceeds its bound, and `cli/test/helpers/fixture.mjs` → `runBounded` rejects it as `runBash timed out after <n> ms: …`, or a bounded poll gives up. This log cannot prove that, because it keeps no assertion message.

**Fix.** No assertion in this case or in any other is deleted, skipped or loosened. No code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, its assertion message names the fault:
  - **If it names `keep_awake`, `engine_pid`, a `keep-awake:` line or the record's `status`:** the defect is in `cli/templates/scripts/autonomous-watcher.sh`, at `keep_awake_start`, at `spawn_engine`'s launch head and its `rc=${PIPESTATUS[0]}`, or at `tick`'s `host_wake_pass` / `keep_awake_resolve` / `keep_awake_pass` prelude. It may also be in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_mode_var`. Fix it there, in the `cli` layer.
  - **The `general` layer's part:** copy the same edit into `scripts/autonomous-watcher.sh`, and `scripts/lib/harness-run-lib.sh` where the library changed, until `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` and `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` both exit 0. Amend the KEEP AWAKE header block in the same edit if the fix changes what it states.
  - **If it is `runBash timed out after …` with no other fault:** record the message under **Deviations from plan:** as the evidence the next round's plan needs, and change no bound and no code on this finding.
- [ ] If this case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`, and the `general`-layer dispatch has nothing to copy.

## Already passing

- **(a) Named test and file run:** `the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold`, in `cli/test/watcher-keep-awake.test.mjs`, on `52133750` (`cli` layer dispatch).
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root, foreground. The named test reported `ok 3 - the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold` (`duration_ms: 9792.364625`). The file summary was `# tests 9`, `# pass 9`, `# fail 0`, `# duration_ms 92092.194958`. This agrees with the finding's diagnosis: a transient condition on the gate host, not a defect in the tree.
- **(c) No code file edited:** this section is the only change. `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` and their `scripts/` mirrors are untouched, so the `general` layer has nothing to copy.
- **`general` layer dispatch, on `52133750`:**
  - **(a) Named test and file run:** the same named test, in `cli/test/watcher-keep-awake.test.mjs`, run again before any edit; the mirror pairs were also checked.
  - **(b) Command and result:** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root, foreground: `ok 3 - the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold` (`duration_ms: 10040.1295`), and `# tests 9`, `# pass 9`, `# fail 0`, `# duration_ms 93479.490625`. `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` and `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` both exited 0 with no output.
  - **(c) No code file edited:** this sub-bullet is the only change this dispatch made, and `git status --short` showed only this file modified.
