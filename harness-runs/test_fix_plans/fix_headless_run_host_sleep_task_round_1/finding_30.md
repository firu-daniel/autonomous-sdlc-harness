### 30. Remote dispatch: the remote review drop case fails

**Site:** `cli/test/watcher-remote-dispatch.test.mjs` → `test('a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks'` (near line 299). Its passes each go through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. Each pass runs `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, which on this branch runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks`

**The failure, quoted from the log:**

```
        not ok 1102 - a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case's task drop cuts a clone. Its review drop then fast-forwards, commits, pushes and dispatches, and a re-push against a refusing origin blocks. Neither the review placement, the push, the dispatch nor this case changed on the branch. In the same file, the four seeded remote-record cases pass, and every case that drops into the inbox fails.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the remote review drops `a remote drop fast-forwards an honest origin/<branch>, commits the review, pushes and dispatches once` and R1 to R5 pass after the file's first ten cases failed.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the same remote review drop passed later in the run in `cli/test/watcher-review-drop-payloads.test.mjs`.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The fast-forward, the commit, the push or the dispatch:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
