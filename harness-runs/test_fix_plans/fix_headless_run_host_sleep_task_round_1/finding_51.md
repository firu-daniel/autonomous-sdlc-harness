### 51. Stall reset (S7): the skip-worktree settings refusal fails

**Site:** `cli/test/watcher-stall-reset-payloads.test.mjs` → `test("(S7) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused"` (near line 522). It runs `f.localStall(…)`: the drop, the launch and the hung session, then the back-dated stall pass. The run is bounded by `const RUN_TIMEOUT_MS = 180_000;`, and the hung session's wait by `const HUNG_WAIT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {` (now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass`), `spawn_engine`'s new launch head, and `check_stalled_runs`.

**Failing test:** `cli/test/watcher-stall-reset-payloads.test.mjs` — `(S7) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused`

**The failure, quoted from the log:**

```
        not ok 1188 - (S7) a session-written .claude/settings.json hidden by a skip-worktree bit in the clone's index is refused
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The worktree-diff check and this case did not change on the branch. This is the seventh and last failing local case in the file. The very next case, S8 (`(S8) a replace ref on the merge base does not pass a payload tip`), passes, through the identical `localStall` drop, launch, back-dated pass and refused reset. So do S9, S4, S4c, S10 and the S4 legacy case after it. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the next case in this file, through the same `localStall` pass, passed.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The refusal, the branch tip or the record:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **`the session did not hang within 60000 ms`, or a bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
