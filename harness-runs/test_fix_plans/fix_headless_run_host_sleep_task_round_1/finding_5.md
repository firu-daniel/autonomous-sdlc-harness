### 5. Keep-awake (l): the re-taken macOS hold case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true'` (near line 318). It runs a multi-pass `f.session(MACOS_PROBE)`, whose script is bounded by `const SESSION_TIMEOUT_MS = 180_000;` and whose polls are bounded by `const WAIT_MS = 20_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass() {` (its `off)` and `caffeinate)` arms) and `keep_awake_retake() {`, both added by `b49bf998`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true`

**The failure, quoted from the log:**

```
        not ok 1079 - (l) macOS: a hold released by execution.keepAwake false is taken again once the key is true
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case launches a long-lived session from a task drop, which cuts a clone, under a recording `caffeinate`. It then rewrites `execution.keepAwake` to `false` and runs a pass, then back to `true` and runs another pass. It asserts the release, the re-take and the holder's argv.

The case was written for `b49bf998`, and its suite passed in isolation on that commit: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **A release, a re-take, a `keep-awake:` line or the holder's argv:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass` / `keep_awake_retake`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0.
  - **A bare timeout (`runBash timed out after …`, or a `within 20000 ms` poll):** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
