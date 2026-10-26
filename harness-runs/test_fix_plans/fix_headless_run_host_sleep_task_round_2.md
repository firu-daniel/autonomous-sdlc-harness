# Test Fix Plan: fix_headless_run_host_sleep — task round 2

## Context

**Branch:** `fix_headless_run_host_sleep`
**Test log:** `harness-runs/test_run_logs/fix_headless_run_host_sleep/task_round_2.log`
**Earlier logs:** `harness-runs/test_run_logs/fix_headless_run_host_sleep/task_round_1.log`
**Summary:** The typecheck gate passed. The test gate failed only on run-gates gate 4 (`npm test`), with 10 failing cases (`# fail 10`): six in `cli/test/watcher-keep-awake.test.mjs`, three in `cli/test/watcher-stall-host-sleep.test.mjs` and one in `cli/test/watcher-run-profile.test.mjs`. All ten also failed in round 1.

**What the log can and cannot show.** The gate wrapper keeps only each failing case's `not ok` line and the tail of the suite's output. No assertion message is on record for any failure, so every diagnosis below comes from the current tree.

**The pattern that drives this plan.** This run started after `ed5e5658` merged `origin/dev`, which brought in `968f982a` (*run gates flake resilience*). That change adds `cli/test/helpers/timing.mjs`: `scaleBound(base)` multiplies every "until X happens" ceiling in `cli/test/` by `HARNESS_TEST_TIME_SCALE` (default `2`, cap `5`). It adopted the multiplier in the suites that existed on `dev`, including the shared driver's `TICK_TIMEOUT_MS` in `cli/test/helpers/watcher.mjs`, which is now `scaleBound(60_000)`. The two suites this branch added were not on `dev`, so neither imports `scaleBound`:

- `cli/test/watcher-keep-awake.test.mjs` still has `const WAIT_MS = 20_000;` and `const SESSION_TIMEOUT_MS = 180_000;`.
- `cli/test/watcher-stall-host-sleep.test.mjs` still has `const WAIT_MS = 30_000;` and `const SESSION_TIMEOUT_MS = 180_000;`.

Also, both files' `session()` helpers wait for each watcher pass under `WAIT_MS`. That covers the launch pass, which cuts a clone, even though the shared driver now allows one pass `TICK_TIMEOUT_MS` (120 000 ms at the default scale).

The failures follow that line. In the keep-awake suite, every failing case polls through `waitFor` under the unscaled `WAIT_MS`, either through `holderGone` or through `session()`. The three cases that pass ((d), (j) and the default-probe case) never call `waitFor`. In the stall suite, all three cases go through `session()`. Every other suite in this run passed, and those suites now run under scaled bounds. This run's suite took `# duration_ms 3201467.67125` (about 53 minutes), against about 46 minutes in round 1.

**A single-file pass is not evidence for these findings.** Round 1 closed the keep-awake and stall-host-sleep failures as already passing because each file passed when run alone. All of them failed again in the full suite. Findings 1 and 7 change the bounds that make these cases load-sensitive. The other watcher findings name one of those two as their suspected shared cause.

Finding 10 is in a suite this branch does not edit. Its only time bound is the shared driver's `tick`, which is already scaled, and the tree does not explain the failure. Its finding makes the case report its own cause.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only.

Order:

1. The keep-awake suite's suspected root cause (Finding 1), then the five cases it probably clears.
2. The stall suite's suspected root cause (Finding 7), then its two cases.
3. Last, the case whose cause the tree does not show (Finding 10).

Every change is confined to test files.

1. [x] **Finding 1** — Keep-awake (l): the suite's polls and session passes run under unscaled, sub-pass bounds. _(layer: cli)_
2. [x] **Finding 2** — Keep-awake (a)(c): the holder-gone poll runs under the unscaled `WAIT_MS`. _(layer: cli)_
3. [x] **Finding 3** — Keep-awake (b)(c): the holder-gone poll runs under the unscaled `WAIT_MS`. _(layer: cli)_
4. [ ] **Finding 4** — Keep-awake (e)-(h): the Linux logind session case fails in the full suite. _(layer: cli)_
5. [ ] **Finding 5** — Keep-awake (i): the refused Linux lock case fails in the full suite. _(layer: cli)_
6. [ ] **Finding 6** — Keep-awake (k): the kill-switch battery release case fails in the full suite. _(layer: cli)_
7. [ ] **Finding 7** — Stall host sleep (a)(b): the suite's polls and session passes run under unscaled, sub-pass bounds. _(layer: cli)_
8. [ ] **Finding 8** — Stall host sleep (c): the genuine-hang case fails in the full suite. _(layer: cli)_
9. [ ] **Finding 9** — Stall host sleep (d): the missing last-pass file case fails in the full suite. _(layer: cli)_
10. [ ] **Finding 10** — Run profile: the per-run copy launch case fails, with no cause in the log or the tree. _(layer: cli)_

---

## Must Fix

### 1. Keep-awake (l): the suite's polls and session passes run under unscaled, sub-pass bounds
→ [finding_1.md](fix_headless_run_host_sleep_task_round_2/finding_1.md)

### 2. Keep-awake (a)(c): the holder-gone poll runs under the unscaled `WAIT_MS`
→ [finding_2.md](fix_headless_run_host_sleep_task_round_2/finding_2.md)

### 3. Keep-awake (b)(c): the holder-gone poll runs under the unscaled `WAIT_MS`
→ [finding_3.md](fix_headless_run_host_sleep_task_round_2/finding_3.md)

### 4. Keep-awake (e)-(h): the Linux logind session case fails in the full suite
→ [finding_4.md](fix_headless_run_host_sleep_task_round_2/finding_4.md)

### 5. Keep-awake (i): the refused Linux lock case fails in the full suite
→ [finding_5.md](fix_headless_run_host_sleep_task_round_2/finding_5.md)

### 6. Keep-awake (k): the kill-switch battery release case fails in the full suite
→ [finding_6.md](fix_headless_run_host_sleep_task_round_2/finding_6.md)

### 7. Stall host sleep (a)(b): the suite's polls and session passes run under unscaled, sub-pass bounds
→ [finding_7.md](fix_headless_run_host_sleep_task_round_2/finding_7.md)

### 8. Stall host sleep (c): the genuine-hang case fails in the full suite
→ [finding_8.md](fix_headless_run_host_sleep_task_round_2/finding_8.md)

### 9. Stall host sleep (d): the missing last-pass file case fails in the full suite
→ [finding_9.md](fix_headless_run_host_sleep_task_round_2/finding_9.md)

### 10. Run profile: the per-run copy launch case fails, with no cause in the log or the tree
→ [finding_10.md](fix_headless_run_host_sleep_task_round_2/finding_10.md)

---

## Not fixable on this branch

None. The log has no sandbox-refusal line, and no failing case has a cause that the log shows to lie outside the tree.

---

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0 (`PASS: typecheck`). There is no static failure to map.

**Gate `test` (`commands.test`):** exited 1 (`FAIL: test (exit 1)`). Run-gates gate 4 (`  FAIL  4 npm test (exit 1)`) is the only failing run-gates gate (`run-gates: 1 failed, 22 passed`), and its ten failing cases are mapped below. The suite reports `# fail 10`, and the log names exactly ten `not ok` lines.

The following produce no finding because they are not failures:
- gates 6f, 13d and 14d, reported `SKIPPED`;
- gates 13a to 13c, reported `BLOCKED` because the Python environment is not provisioned under `<home>/.cache/harness-docs-retrieval/venvs/…`;
- the gates the script lists as ones it cannot run.

The class is set against `task_round_1.log`, matching each case by name rather than by its `not ok` number. No failure is new this round. Round 1's fix commits changed only the fix plan's readiness markers, so none of these failures can be a regression from them. Round 1's other 42 failures do not appear in this log.

| Failing test (as the log names it) | Suite file | Class | Maps to |
|---|---|---|---|
| `(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true` | `cli/test/watcher-keep-awake.test.mjs` | persisting (round 1 `not ok 1079`) | Finding 1 |
| `(a)(c) macOS: caffeinate waits on the engine's own pid, is gone once the session is, and stays off the stream` | `cli/test/watcher-keep-awake.test.mjs` | persisting (round 1 `not ok 1075`) | Finding 2 |
| `(b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text` | `cli/test/watcher-keep-awake.test.mjs` | persisting (round 1 `not ok 1076`) | Finding 3 |
| `(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session` | `cli/test/watcher-keep-awake.test.mjs` | persisting (round 1 `not ok 1080`) | Finding 4 |
| `(i) Linux: a refused lock logs once, still launches, and is never retried on mains` | `cli/test/watcher-keep-awake.test.mjs` | persisting (round 1 `not ok 1081`) | Finding 5 |
| `(k) Linux: under the global kill switch a pass on battery still releases the hold` | `cli/test/watcher-keep-awake.test.mjs` | persisting (round 1 `not ok 1083`) | Finding 6 |
| `(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills` | `cli/test/watcher-stall-host-sleep.test.mjs` | persisting (round 1 `not ok 1179`) | Finding 7 |
| `(c) a genuinely hung run with no host sleep is killed on the pass, as before` | `cli/test/watcher-stall-host-sleep.test.mjs` | persisting (round 1 `not ok 1180`) | Finding 8 |
| `(d) a missing or non-integer last-pass file records no wake and never defers a kill` | `cli/test/watcher-stall-host-sleep.test.mjs` | persisting (round 1 `not ok 1181`) | Finding 9 |
| `a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries` | `cli/test/watcher-run-profile.test.mjs` | persisting (round 1 `not ok 1162`) | Finding 10 |
