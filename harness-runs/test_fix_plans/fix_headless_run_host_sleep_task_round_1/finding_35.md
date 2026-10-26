### 35. Review drop: the clean reused clone launch fails

**Site:** `cli/test/watcher-review-drop-payloads.test.mjs` → `test('a clean reused clone launches, with the review placed and left uncommitted'` (near line 320).
- Its fixture, `async function createReviewFixture(`, first drops a task prompt and runs `await tick();`. That pass cuts the clone and launches, and the fixture asserts `create-worktree.sh cut no clone` against the record.
- The case then drops a review and runs one more pass. Both passes go through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`.

The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, which on this branch runs `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass, and `spawn_engine`'s new head: `keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`, then `exec "$AGENT_CLI"`.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs` — `a clean reused clone launches, with the review placed and left uncommitted`

**The failure, quoted from the log:**

```
        not ok 1139 - a clean reused clone launches, with the review placed and left uncommitted
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

This is the file's first case. Cases in this file run in series. The first ten fail (this one, then L2, L3, L5, L6, L8, L9, L10, L1 and L1c). Every later case passes through the same `createReviewFixture` task drop, clone cut and launch: L4, L7, L11, R1, the two remote-arm drops, R2 to R5, and the three legacy cases. A defect in that shared path fails every case that crosses it. Here the failures stop part-way through the file. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and pass passed for every case after the tenth in this file.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The fixture's `create-worktree.sh cut no clone`, the launch, the record or the placed review:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
