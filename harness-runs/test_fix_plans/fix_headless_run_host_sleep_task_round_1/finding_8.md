### 8. Keep-awake (j): the WSL2 not-holding case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(j) WSL2: one not-holding line naming WSL2, and no tool invoked'` (near line 413). It runs one pass with `WSL2_PROBE` through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is:
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_mode_var() {` (its `wsl2)` arm).
- `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_start() {`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(j) WSL2: one not-holding line naming WSL2, and no tool invoked`

**The failure, quoted from the log:**

```
        not ok 1082 - (j) WSL2: one not-holding line naming WSL2, and no tool invoked
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case's drop cuts a clone and launches under the WSL2 probe. The case asserts exactly one `not holding for 'feat_x' — WSL2 — …` line and no stub invocation.

The suite passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The WSL2 line, its count or a tool invocation:** the fault is in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_mode_var`'s `wsl2)` reason, or in `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_start`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
