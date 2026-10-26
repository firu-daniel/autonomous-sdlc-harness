# Test Fix Plan: feat_run_analytics — task round 2

## Context

- **Branch:** `feat_run_analytics`
- **Log:** `harness-runs/test_run_logs/feat_run_analytics/task_round_2.log`
- **Earlier log:** `harness-runs/test_run_logs/feat_run_analytics/task_round_1.log`
- **Summary:** The typecheck gate passed. The test gate (`commands.test` → `bash scripts/test.sh` → `scripts/run-gates.sh`) exited 1 on one sub-gate. Gate `4 npm test` had 7 failing tests out of 2328, in three watcher suites. All 7 also failed in round 1, and all were closed in round 1 without a code change after passing in a run of their own file. The log gives the failing test names only, with no assertion messages.

Round 1 closed Findings 2–8 on a one-file run of each named test, and Findings 9–17 because "the round-1 failures came from a parallel gate run on the same host". Between the rounds, `origin/dev` merged `feat: run gates flake resilience (#178)`. That merge doubled every scaled test bound (`cli/test/helpers/timing.mjs` → `DEFAULT_TIME_SCALE = 2`), so `tick`'s bound is now 120 000 ms. Ten of round 1's 17 failures cleared. The 7 that remain persist across two full-suite runs. Of those, the four `watcher-run-analytics` subtests failed in both rounds, and that file is the only suite that drives this branch's new hook through a real session. **A one-file pass is therefore not enough evidence to close these findings again** (see each finding's fix).

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. It is walked top to bottom, and the first `[ ]` entry is the next unit. `[ ]` markers anywhere else, including the `- [ ]` sub-step bullets inside the per-finding files, are informational only.

1. [x] **Finding 1** — Launch commits both analytics files on the clone's branch and syncs them, under a full-suite load. _(layer: cli, general)_
2. [x] **Finding 2** — A resume that adds no session adds no analytics commit. _(layer: cli, general)_
3. [x] **Finding 3** — A `run-analytics.sh` that exits 1 changes no outcome. _(layer: cli, general)_
4. [x] **Finding 4** — A missing `run-analytics.sh` changes no outcome. _(layer: cli, general)_
5. [x] **Finding 5** — (d) The helper's default probe launches the stub and the record ends `completed`. _(layer: cli, general)_
6. [x] **Finding 6** — (L2) A nested repository's `core.fsmonitor` behind a gitlink: the review drop launches. _(layer: cli, general)_

## Must Fix

### 1. watcher-run-analytics: a launch commits run-analytics.json then run-analytics.md on the branch (persisting)
→ [finding_1.md](feat_run_analytics_task_round_2/finding_1.md)

### 2. watcher-run-analytics: a resume that adds no session adds no analytics commit (persisting)
→ [finding_2.md](feat_run_analytics_task_round_2/finding_2.md)

### 3. watcher-run-analytics: a run-analytics.sh that exits 1 changes neither the status nor the notifications (persisting)
→ [finding_3.md](feat_run_analytics_task_round_2/finding_3.md)

### 4. watcher-run-analytics: a missing run-analytics.sh changes neither the status nor the notifications (persisting)
→ [finding_4.md](feat_run_analytics_task_round_2/finding_4.md)

### 5. watcher-sandbox-refusal: (d) the helper's default probe launches the stub (persisting)
→ [finding_5.md](feat_run_analytics_task_round_2/finding_5.md)

### 6. watcher-review-drop-payloads: (L2) nested repository core.fsmonitor behind a gitlink, the drop launches (persisting)
→ [finding_6.md](feat_run_analytics_task_round_2/finding_6.md)

## Not fixable on this branch

- **Gate 13a / 13b / 13c — Python lint, typecheck and tests (BLOCKED).**
  > `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync`
  > `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/3004880420; run bash scripts/python-service.sh sync`

  The cause is on the host: the Python environment has not been provisioned. 13b and 13c print the same lines. `run-gates.sh` does not count BLOCKED as failed (`run-gates: 1 failed, 22 passed`). An operator fixes it by running `bash scripts/python-service.sh sync` on the host. No change on the branch fixes it.

## Source failures

**Gate typecheck (`commands.typecheck`):** exited 0. No failures.

**Gate test (`commands.test`):** exited 1. Sub-gates:

- `4 npm test` (exit 1): 7 failing tests:
  - `not ok 1145 - the session's analytics are committed on the run's branch, and a failing step changes no outcome` (`cli/test/watcher-run-analytics.test.mjs`, parent test). It fails because its four subtests fail. → **Finding 1**. **Persisting** (round 1: `not ok 1142`).
    - `not ok 1 - a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout` → **Finding 1**. **Persisting**.
    - `not ok 2 - a resume that adds no session adds no analytics commit` → **Finding 2**. **Persisting**.
    - `not ok 3 - a run-analytics.sh that exits 1 changes neither the status nor the notifications` → **Finding 3**. **Persisting**.
    - `not ok 4 - a missing run-analytics.sh changes neither the status nor the notifications` → **Finding 4**. **Persisting**.
  - `not ok 1161 - (d) the helper's default probe launches the stub` (`cli/test/watcher-sandbox-refusal.test.mjs`) → **Finding 5**. **Persisting** (round 1: `not ok 1158`).
  - `not ok 1123 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches` (`cli/test/watcher-review-drop-payloads.test.mjs`) → **Finding 6**. **Persisting** (round 1: `not ok 1120`).
- `13a Python lint`, `13b Python typecheck`, `13c Python tests` (BLOCKED, not counted as failed by `run-gates.sh`) → `## Not fixable on this branch`. **Persisting**.

No failure is new this round. Round 1's other failures did not recur: gate `6a`, and tests `1076`–`1079`, `1119`, `1121`, `1143`, `1145`, `1156` and `1160` (round-1 numbering). The log also reports `SKIPPED` lines for 6f, 13d and 14d. Each says it was not run, so none is a failure and none yields a finding.
