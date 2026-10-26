### 20. Run profile: the empty-base refusal fails

**Site:** `cli/test/watcher-run-profile.test.mjs` → the refusal loop's row `['an empty base file', () => '']` (near line 277), run by `test(\`the launch is refused on ${name}\`` (near line 280) through `async function assertLaunchRefused(f)`. That helper's `await f.tick();` goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. That pass runs `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, which on this branch runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass. The pass cuts a clone before `spawn_engine` refuses the launch.

**Failing test:** `cli/test/watcher-run-profile.test.mjs` — `the launch is refused on an empty base file`

**The failure, quoted from the log:**

```
        not ok 1167 - the launch is refused on an empty base file
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case's drop cuts a clone, and the launch is refused on an empty base profile. The refusal comes before the new launch head runs. Neither the refusal check nor this case changed on the branch.

In the same file, the cases that run no clone-cutting drop pass, and every case that cuts a clone through a drop fails.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the failures stop part-way through files whose cases run in series.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The `not launching` line, the record or the notification:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
