### 24. Remote dispatch: the remote task drop case fails

**Site:** `cli/test/watcher-remote-dispatch.test.mjs` → `test('a remote task drop is committed, pushed and dispatched, never spawned'` (near line 149). Its `await f.tick();` goes through `createDispatchFixture`'s `tick: (env = {}) => w.tick({ HARNESS_GH_CLI: ghStub, STUB_LOG: ghLog, ...env })` into `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. That pass runs `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, which on this branch runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass. The pass then cuts a clone, commits, pushes and dispatches.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `a remote task drop is committed, pushed and dispatched, never spawned`

**The failure, quoted from the log:**

```
        not ok 1096 - a remote task drop is committed, pushed and dispatched, never spawned
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case launches nothing locally, so the new launch head is not on its path; only `tick`'s new prelude is. Neither the remote dispatch nor this case changed on the branch. In the same file, the four seeded remote-record cases pass, and they run the same `tick` with no drop. Every case in the file that drops into the inbox fails.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one. That includes the remote drops R1 to R5 in the review-drop file, which commit, push and dispatch as this case does.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the failures stop part-way through files whose cases run in series.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The watcher's record, a log line, the commit, the push or the dispatch:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
