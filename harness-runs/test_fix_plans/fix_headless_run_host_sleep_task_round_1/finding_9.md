### 9. Keep-awake (k): the kill-switch battery release case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(k) Linux: under the global kill switch a pass on battery still releases the hold'` (near line 425). It runs a multi-pass `f.session(LINUX_PROBE)`, bounded by `const SESSION_TIMEOUT_MS = 180_000;`, with polls bounded by `const WAIT_MS = 20_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, whose `keep_awake_pass` call sits ahead of the `if kill_switch_active; then` return, and `keep_awake_pass() {`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(k) Linux: under the global kill switch a pass on battery still releases the hold`

**The failure, quoted from the log:**

```
        not ok 1083 - (k) Linux: under the global kill switch a pass on battery still releases the hold
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case launches a held session from a task drop, which cuts a clone, and then engages the kill switch. It writes battery power and runs a pass, and asserts both the `global kill switch active` line and `on battery — released the hold for 'feat_x'`.

The suite passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The release under the brake, the record or a log line:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `tick`'s call order or `keep_awake_pass`'s `logind)` arm. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0.
  - **A bare timeout:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **(a) Named test and file run:** `(k) Linux: under the global kill switch a pass on battery still releases the hold`, in `cli/test/watcher-keep-awake.test.mjs`, on `f2598455` (`cli` layer dispatch).
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root, foreground. The named test reported `ok 9 - (k) Linux: under the global kill switch a pass on battery still releases the hold` (`duration_ms: 18764.792583`). The file summary was `# tests 9`, `# pass 9`, `# fail 0`, `# duration_ms 147921.968709`. This agrees with the finding's diagnosis: a transient condition on the gate host, not a defect in the tree.
- **(c) No code file edited:** this section is the only change. `cli/templates/scripts/autonomous-watcher.sh` and its `scripts/` mirror are untouched, so the `general` layer has nothing to copy.
