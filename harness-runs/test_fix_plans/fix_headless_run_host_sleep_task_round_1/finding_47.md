### 47. Stall reset (S2): the committed settings hook refusal fails

**Site:** `cli/test/watcher-stall-reset-payloads.test.mjs` → `test('(S2) a .claude/settings.json committed with a hook is refused, and the working-tree file is not installed'` (near line 452). It runs `f.localStall(…)`: the drop, the launch and the hung session, then the back-dated stall pass. The run is bounded by `const RUN_TIMEOUT_MS = 180_000;`, and the hung session's wait by `const HUNG_WAIT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {` (now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass`), `spawn_engine`'s new launch head, and `check_stalled_runs`.

**Failing test:** `cli/test/watcher-stall-reset-payloads.test.mjs` — `(S2) a .claude/settings.json committed with a hook is refused, and the working-tree file is not installed`

**The failure, quoted from the log:**

```
        not ok 1184 - (S2) a .claude/settings.json committed with a hook is refused, and the working-tree file is not installed
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The reset's surface check and this case did not change on the branch. Cases in this file run in series. The first seven local cases fail, and the next six pass through the identical `localStall` path. Among them, S8 and S9 refuse the same `.claude/settings.json` surface through the same `assertGivenUp`. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the same `localStall` pass passed for the six local cases after the seventh in this file.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **A payload marker, the refusal, the record or the working-tree file:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **`the session did not hang within 60000 ms`, or a bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
