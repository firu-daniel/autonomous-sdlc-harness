### 11. Stall host sleep (c): the genuine-hang case fails

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs` → `test('(c) a genuinely hung run with no host sleep is killed on the pass, as before'` (near line 271). Its session script is bounded by `const SESSION_TIMEOUT_MS = 180_000;`, and its polls by `const WAIT_MS = 30_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `host_wake_pass() {` and `check_stalled_runs`'s kill line `is hung (`.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(c) a genuinely hung run with no host sleep is killed on the pass, as before`

**The failure, quoted from the log:**

```
        not ok 1180 - (c) a genuinely hung run with no host sleep is killed on the pass, as before
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case launches a hung stub from a task drop, which cuts a clone. It back-dates the liveness files 4000 s, writes `.host_last_tick` 5 s back, and asserts the `is hung` line and the `failed` record on that pass, with no `host-wake:` line. No isolated result for this file is on record.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs`, the same drop, launch and back-dated stall pass fails for the first seven local cases. It then passes for S8, S9, S4, S4c, S10 and the S4 legacy case, all of which reach the same kill.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the same kill passed later in the run in `cli/test/watcher-stall-reset-payloads.test.mjs`.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **A spurious `host-wake:` line, or a kill deferred with no gap:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `host_wake_pass`'s gap test or `check_stalled_runs`'s `woke` read. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0.
  - **A bare timeout:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
