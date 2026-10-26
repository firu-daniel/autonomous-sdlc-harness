### 23. Run profile: the clone exit sync case fails

**Site:** `cli/test/watcher-run-profile.test.mjs` → `test('a clone run\'s exit syncs its branch into the main checkout'` (near line 361). Its stub commits through `commit-on-branch.sh` and then directly in the clone. Its `await f.tick();` goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. That pass runs `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, which on this branch runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass. It then launches through `spawn_engine`'s new head (`keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`, then `exec "$AGENT_CLI"`), whose exit `classify_run_exit` classifies and syncs.

**Failing test:** `cli/test/watcher-run-profile.test.mjs` — `a clone run's exit syncs its branch into the main checkout`

**The failure, quoted from the log:**

```
        not ok 1171 - a clone run's exit syncs its branch into the main checkout
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case's drop cuts a clone and launches a stub that makes two commits there. The case asserts that the main checkout's branch matches the clone's tip after the exit sync. Neither the exit sync nor this case changed on the branch. The pass does more work than its siblings (a wrapper commit, a direct commit and a sync) inside the same 60 s bound.

In the same file, the cases that run no clone-cutting drop pass, and every case that cuts a clone through a drop fails.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the failures stop part-way through files whose cases run in series.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The exit classification or the sync:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (`spawn_engine`'s launch head and `rc=${PIPESTATUS[0]}`, or `classify_run_exit`) or in `cli/templates/scripts/lib/harness-run-lib.sh`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
