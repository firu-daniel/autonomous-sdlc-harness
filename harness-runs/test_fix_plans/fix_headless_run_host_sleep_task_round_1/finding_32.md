### 32. Remote dispatch: the key-absent library routing case fails

**Site:** `cli/test/watcher-remote-dispatch.test.mjs` → `test('with the key absent a drop routes through the library: task engine on its branch, junk rejected'` (near line 373). It builds a fixture with `execution.target` absent and runs its passes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. Each pass runs `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, which on this branch runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass. It then launches through `spawn_engine`'s new head: `keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`, then `exec "$AGENT_CLI"`.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `with the key absent a drop routes through the library: task engine on its branch, junk rejected`

**The failure, quoted from the log:**

```
        not ok 1104 - with the key absent a drop routes through the library: task engine on its branch, junk rejected
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case's task drop cuts a clone and launches the task engine on its branch, and a junk drop is rejected. Neither the inbox routing nor this case changed on the branch. In the same file, the four seeded remote-record cases pass, and every case that drops into the inbox fails.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop-and-launch path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the failures stop part-way through files whose cases run in series.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The routing, the record or the launch:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
