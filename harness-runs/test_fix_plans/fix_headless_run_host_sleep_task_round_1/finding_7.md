### 7. Keep-awake (i): the refused Linux lock case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(i) Linux: a refused lock logs once, still launches, and is never retried on mains'` (near line 396). It drives a task drop through the watcher under a recording `systemd-inhibit` whose probe exits 1, with its passes bounded by `cli/test/helpers/watcher.mjs` → `const TICK_TIMEOUT_MS = 60_000;` or by the suite's `const SESSION_TIMEOUT_MS = 180_000;`. The code under test is:
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_hold_var() {` (its `refused` arm).
- `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_start() {` and `keep_awake_pass() {`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(i) Linux: a refused lock logs once, still launches, and is never retried on mains`

**The failure, quoted from the log:**

```
        not ok 1081 - (i) Linux: a refused lock logs once, still launches, and is never retried on mains
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case's drop cuts a clone and launches. The case asserts one `not holding for 'feat_x' — systemd-inhibit exited 1 — …` line, a recorded prompt, `keep_awake` `refused`, and no new hold on a later pass on mains.

The suite passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The refusal line, the record or a retry:** the fault is in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_hold_var`, or in `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_start` / `keep_awake_pass`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare timeout:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
