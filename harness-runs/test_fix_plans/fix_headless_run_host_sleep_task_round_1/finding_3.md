### 3. Keep-awake (b)(c): the exit-3 macOS hold case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(b)(c) macOS: an engine exiting 3 is classified failed under a hold` (near line 269). Its `await f.pass(MACOS_PROBE);` goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh`:
- `spawn_engine`'s launch head: `keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`, then `exec "$AGENT_CLI"`.
- `rc=${PIPESTATUS[0]}`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text`

**The failure, quoted from the log:**

```
        not ok 1076 - (b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case drops a task prompt. One pass then cuts a clone and launches a stub engine that exits 3 under a recording `caffeinate`. The case asserts `keep_awake` `held`, `status` `failed`, the holder gone, and no `keep-awake` text in the stream.

The suite passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and its suite passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The record's `status` (the exit classification):** the fault is in the launch head's `exec` and `rc=${PIPESTATUS[0]}` in `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`.
  - **The hold fields or the stream:** the fault is in `keep_awake_start` there.

  Fix it there. Record under **Deviations from plan:** that the `general`-layer mirror `scripts/autonomous-watcher.sh` needs the same edit until `cmp` exits 0. A bare `runBash timed out after …` is recorded under **Deviations from plan:** as the next round's evidence, and nothing is changed.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.
