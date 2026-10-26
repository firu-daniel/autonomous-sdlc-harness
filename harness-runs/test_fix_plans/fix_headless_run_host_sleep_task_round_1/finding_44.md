### 44. Review drop (L1c): the off-allow-list fsmonitor refusal fails

**Site:** `cli/test/watcher-review-drop-payloads.test.mjs` → `test("(L1c) a core.fsmonitor in the clone's .git/config, off the allow-list, is refused and never run"` (near line 480). Its fixture, `async function createReviewFixture(`, first drops a task prompt and runs `await tick();`, which cuts the clone and launches. The case then sets `core.fsmonitor` in the clone's `.git/config` and drops a review through `async function assertClonePlantRefused(`. Every pass goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `tick() {`, now running `host_wake_pass`, `keep_awake_resolve` and `keep_awake_pass` ahead of the inbox pass.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs` — `(L1c) a core.fsmonitor in the clone's .git/config, off the allow-list, is refused and never run`

**The failure, quoted from the log:**

```
        not ok 1148 - (L1c) a core.fsmonitor in the clone's .git/config, off the allow-list, is refused and never run
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The clone config check and this case did not change on the branch. This is the tenth and last failing case in the file. The very next case, L4 (`(L4) a clean filter the clone's .git/config defines for a committed .gitattributes is refused and never run`), passes. L4 goes through the same `createReviewFixture` setup pass and refuses a key in the same `.git/config`. Every case after it passes too. The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during the first part of this file's run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the next case in this file, through the same fixture, pass and config check, passed.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **The off-allow-list sentence, a payload marker or the record:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
