### 43. Review drop (L1): the planted config.worktree refusal fails

**Site:** `cli/test/watcher-review-drop-payloads.test.mjs` → `test("(L1) a .git/config.worktree planted in the clone, carrying core.fsmonitor, is refused and never read"` (near line 472). Its fixture, `async function createReviewFixture(`, first drops a task prompt and runs `await tick();`, which cuts the clone and launches. The case then plants `.git/config.worktree` and drops a review through `async function assertClonePlantRefused(`. Every pass goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs` — `(L1) a .git/config.worktree planted in the clone, carrying core.fsmonitor, is refused and never read`

**The failure, quoted from the log:**

```
        not ok 1147 - (L1) a .git/config.worktree planted in the clone, carrying core.fsmonitor, is refused and never read
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The clone trust check and this case did not change on the branch. The fixture's setup pass, a task drop that cuts the clone and launches, is on this case's path. Cases in this file run in series. The first ten fail, and every later case passes through the same setup pass. That includes L11 and R1, which assert a planted-file refusal through the same `assertClonePlantRefused` shape. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and pass passed for every case after the tenth in this file.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The clone trust check's sentence, a payload marker or the record:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
