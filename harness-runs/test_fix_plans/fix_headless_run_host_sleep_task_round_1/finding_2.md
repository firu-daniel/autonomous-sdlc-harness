### 2. Keep-awake (a)(c): the macOS caffeinate hold case fails

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(a)(c) macOS: caffeinate waits on the engine\'s own pid` (near line 252). Its `await f.pass(MACOS_PROBE);` goes through `cli/test/helpers/watcher.mjs` → `async tick(`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. Its `f.holderGone(…)` poll is bounded by `const WAIT_MS = 20_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_start() {` and `spawn_engine`'s launch head `keep_awake_start "$branch" "$(exec sh -c 'echo "$PPID"')"`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream`

**The failure, quoted from the log:**

```
        not ok 1075 - (a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

The case drops a task prompt. One watcher pass then cuts a clone and launches the stub engine through the new launch head, with a recording `caffeinate` first on `PATH`. The case asserts the stub's argv `-s -i -w <engine pid>`, the `held` record and the `keep-awake: holding …` line.

The suite is the branch's own. It passed in isolation on `b49bf998`: `# tests 9`, `# pass 9`, `# fail 0`, as recorded in `harness-runs/code_reviews/fix_headless_run_host_sleep_code_review/finding_1.md`. Since then, only `harness-runs/flow_progress/fix_headless_run_host_sleep_progress.md` has changed.

Across the run, the failures do not behave like a defect in this path:
- In `cli/test/watcher-stall-reset-payloads.test.mjs` and `cli/test/watcher-review-drop-payloads.test.mjs`, whose cases run in series, the same drop path fails for the first consecutive cases and then passes for every later one.
- The suite ran for `# duration_ms 2757435.082709`.

The likely cause is a transient condition on the gate host during part of the run, such as a host sleep or a load spike that pushes a pass past its bound. This log cannot confirm it.

**Suspected shared cause:** likely the same cause as Finding 1 — the case crosses the same drop-and-pass path as every other failure, and the suite it belongs to passed 9/9 in isolation on the tree under test.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names.
  - **The hold's argv, record, log line or holder lifetime:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_start` / the launch head, or in `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_keep_awake_hold_var`. Fix it there. Record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **A bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **(a) Named test and file run:** `(a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream`, in `cli/test/watcher-keep-awake.test.mjs`, on `8c80061c` (`cli` layer dispatch).
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root, foreground. The named test reported `ok 1 - (a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream` (`duration_ms: 10425.409417`). The file summary was `# tests 9`, `# pass 9`, `# fail 0`, `# duration_ms 91981.445666`. This agrees with the finding's diagnosis: a transient condition on the gate host, not a defect in the tree.
- **(c) No code file edited:** this section is the only change. `cli/templates/scripts/autonomous-watcher.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` and their `scripts/` mirrors are untouched, so the `general` layer has nothing to copy.
