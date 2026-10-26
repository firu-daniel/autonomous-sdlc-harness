### 33. Remote dispatch: the running remote record case fails

**Site:** `cli/test/watcher-remote-dispatch.test.mjs` → `test('a running remote record is never reconciled, counted, stall-killed or usage-paused'` (near line 407). It seeds a remote `feat_x` record and drops a local `feat_y_task_prompt.md`, then runs `await f.tick(env);` three times with `STALL_CHECK_ENABLED: '1'` and `USAGE_CHECK_ENABLED: '1'`. Each pass goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, now with `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` (which skips a remote record through `record_is_remote "$b" && continue`). Each pass also runs `check_stalled_runs`, with its new wake discount.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `a running remote record is never reconciled, counted, stall-killed or usage-paused`

**The failure, quoted from the log:**

```
        not ok 1105 - a running remote record is never reconciled, counted, stall-killed or usage-paused
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The local drop cuts a clone and launches `feat_y` beside the remote `feat_x`. The case asserts that `feat_x` stays `running` with no stall line, no pause and no `gh` call, and that `feat_y` completes. `keep_awake_pass` skips remote records. `check_stalled_runs`' discount only ever moves the silence start later, so it cannot turn a skip into a kill. In the same file, the four seeded remote-record cases that drop nothing pass.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop-and-launch path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the failures stop part-way through files whose cases run in series.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **A `stall-watchdog: 'feat_x'` line, a pause, a `gh` call or `feat_x`'s status:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs` / `keep_awake_pass` / the usage gate.
  - **`feat_y`'s launch or completion:** the fault is in the launch head.

  Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0. A bare `runBash timed out after …` is recorded under **Deviations from plan:** as the next round's evidence, and nothing is changed.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
