### 38. Review drop (L5): the committed settings change refusal fails

**Site:** `cli/test/watcher-review-drop-payloads.test.mjs` → `test('(L5) a committed .claude/settings.json change, the working-tree file untouched, is refused'` (near line 380). Its fixture, `async function createReviewFixture(`, first drops a task prompt and runs `await tick();`, which cuts the clone and launches. The case then commits a settings change in the clone and drops a review that must be refused. Every pass goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs` — `(L5) a committed .claude/settings.json change, the working-tree file untouched, is refused`

**The failure, quoted from the log:**

```
        not ok 1142 - (L5) a committed .claude/settings.json change, the working-tree file untouched, is refused
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The refusal and this case did not change on the branch. The fixture's own setup pass, a task drop that cuts the clone and launches, is still on this case's path. Cases in this file run in series. The first ten fail, and every later case passes through the same setup pass (L4, L7, L11, R1 to R5, the remote-arm drops and the legacy cases). That includes the refusals L4, L7, L11 and R1, which assert through the same `assertRefused`. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and pass passed for every case after the tenth in this file.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The refusal, the record, the archive or the notification:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
