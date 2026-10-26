### 6. Keep-awake (e)-(h): the Linux logind session case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass` (near line 356). It runs a multi-pass `f.session(LINUX_PROBE)`, bounded by `const SESSION_TIMEOUT_MS = 180_000;`, with polls bounded by `const WAIT_MS = 20_000;`. Its power seam is a temp `HR_POWER_SUPPLY_DIR`. The code under test is:
- `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass() {` (its `logind)` arm) and `keep_awake_retake() {`.
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_hold_var() {` and `hr_on_mains_power() {`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session`

**The failure, quoted from the log:**

```
        not ok 1080 - (e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case launches a long-lived session from a task drop, which cuts a clone, under a recording `systemd-inhibit`. It then flips the temp power supply's `online` between passes, and asserts the hold, its release on battery, its re-take on mains and its end with the session.

The suite passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **A hold state, a holder pid or a `keep-awake:` line:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass`'s `logind)` arm / `keep_awake_retake`, or in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_hold_var` / `hr_on_mains_power`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare timeout:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
