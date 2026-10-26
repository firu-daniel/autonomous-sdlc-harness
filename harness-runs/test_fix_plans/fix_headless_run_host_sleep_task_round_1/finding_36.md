### 36. Review drop (L2): the nested-repository fsmonitor case fails

**Site:** `cli/test/watcher-review-drop-payloads.test.mjs` → `test("(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches"` (near line 334). Its fixture, `async function createReviewFixture(`, first drops a task prompt and runs `await tick();`, which cuts the clone and launches. The case then plants a nested repository and drops a review. Every pass goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass, and `spawn_engine`'s new launch head `keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs` — `(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches`

**The failure, quoted from the log:**

```
        not ok 1140 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The clone trust check and this case did not change on the branch. Cases in this file run in series. The first ten fail, and every later case passes through the same `createReviewFixture` task drop, clone cut and launch (L4, L7, L11, R1 to R5, the remote-arm drops and the legacy cases). A defect in that shared path would not stop failing part-way through the file. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and pass passed for every case after the tenth in this file.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **A payload marker, the launch or the record:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
