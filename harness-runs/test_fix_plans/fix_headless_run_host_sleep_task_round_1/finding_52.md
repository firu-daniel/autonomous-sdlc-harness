### 52. Run-copy migration: the new drop beside a legacy run fails

**Site:** `cli/test/run-copy-migration.test.mjs` → `test('a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree'` (near line 182). Its single pass is `await f.tick({}, { timeoutMs: 180_000 });`, and the comment above it says the pass resumes one run (commit and push) and launches a second. That call goes through `cli/test/helpers/watcher.mjs` → `async tick(`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass, and `spawn_engine`'s new launch head, which this one pass crosses twice.

**Failing test:** `cli/test/run-copy-migration.test.mjs` — `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree`

**The failure, quoted from the log:**

```
        not ok 998 - a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log on this branch. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

This case has a history of failing under suite load. The previous branch's round-2 plan (`harness-runs/test_fix_plans/feat_unattended_sandbox_preflight_task_round_2/finding_2.md`) records two consecutive load failures of it. That plan's fix raised this pass's bound to the `180_000` it carries today, and the case then passed in that branch's round 3. In isolation it took about 12.7 s.

On this branch, the pass also runs the new prelude, and both of its launches go through the new launch head. In the same file, the two cases that cut no new clone pass. Across the run, the failures do not behave like a defect in that path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and it has failed before under suite load alone.

**Fix.** No assertion is deleted, skipped or loosened, no bound is raised again, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The legacy profile, the new run's launch or record, or the sweep:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after 180000 ms: …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
