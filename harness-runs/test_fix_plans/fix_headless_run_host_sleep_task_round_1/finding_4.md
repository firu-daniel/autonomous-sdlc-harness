### 4. Keep-awake (d): the keepAwake-false case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(d) execution.keepAwake false takes no hold, logs nothing, and status names it'` (near line 298). It builds `keepAwakeFixture(t, { keepAwake: false })` and runs one pass through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is:
- `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_resolve() {`, `keep_awake_start() {` and `print_status`'s `keep-awake: $KEEP_AWAKE_MODE — $KEEP_AWAKE_REASON` line.
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_mode_var() {`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(d) execution.keepAwake false takes no hold, logs nothing, and status names it`

**The failure, quoted from the log:**

```
        not ok 1078 - (d) execution.keepAwake false takes no hold, logs nothing, and status names it
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

With `execution.keepAwake` `false`, the case drops a task prompt. One pass cuts a clone and launches, and the case asserts no stub call, `keep_awake` `off`, no `keep-awake:` line, and the two `status` lines.

The suite passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The `status` lines or the resolved mode:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_resolve` / `print_status`, or in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_mode_var` / `hr_keep_awake`.
  - **The record or a log line:** the fault is in `keep_awake_start`.

  Fix it there. Record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0. A bare `runBash timed out after …` is recorded under **Deviations from plan:** as the next round's evidence, and nothing is changed.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **(a) Named test and file run:** `(d) execution.keepAwake false takes no hold, logs nothing, and status names it`, in `cli/test/watcher-keep-awake.test.mjs`, on `fedb50ec` (`cli` layer dispatch).
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root, foreground. The named test reported `ok 4 - (d) execution.keepAwake false takes no hold, logs nothing, and status names it` (`duration_ms: 19356.366666`). The file summary was `# tests 9`, `# pass 9`, `# fail 0`, `# duration_ms 171352.72925`. This agrees with the finding's diagnosis: a transient condition on the gate host, not a defect in the tree.
- **(c) No code file edited:** this section is the only change. `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` and their `scripts/` mirrors are untouched, so the `general` layer has nothing to copy.
