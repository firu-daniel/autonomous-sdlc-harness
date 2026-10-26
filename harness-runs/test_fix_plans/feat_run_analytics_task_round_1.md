# Test Fix Plan: feat_run_analytics — task round 1

## Context

- **Branch:** `feat_run_analytics`
- **Log:** `harness-runs/test_run_logs/feat_run_analytics/task_round_1.log`
- **Summary:** The typecheck gate passed. The test gate (`commands.test` → `bash scripts/test.sh` → `scripts/run-gates.sh`) exited 1 on two sub-gates: gate 6a found the home directory spelled out in a committed task plan, and gate 4 (`npm test`) had 17 failing tests out of 2308, all in watcher suites that cut a sibling clone. The log gives the failing test names only, with no assertion messages. In the same run, other tests on the same clone-launch and remote-dispatch paths passed.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. It is walked top to bottom, and the first `[ ]` entry is the next unit. `[ ]` markers anywhere else, including the `- [ ]` sub-step bullets inside the per-finding files, are informational only.

1. [x] **Finding 1** — Remove the spelled-out home directory from task 9's plan. _(layer: general)_
2. [x] **Finding 2** — Launch commits both analytics files on the clone's branch and syncs them. _(layer: cli, general)_
3. [ ] **Finding 3** — A resume that adds no session adds no analytics commit. _(layer: cli, general)_
4. [ ] **Finding 4** — A `run-analytics.sh` that exits 1 changes no outcome. _(layer: cli, general)_
5. [ ] **Finding 5** — A missing `run-analytics.sh` changes no outcome. _(layer: cli, general)_
6. [ ] **Finding 6** — A clean reused clone launches with the review placed and left uncommitted. _(layer: cli, general)_
7. [ ] **Finding 7** — (L2) A nested repository's `core.fsmonitor` behind a gitlink: the drop launches. _(layer: cli, general)_
8. [ ] **Finding 8** — (L3) A `core.fsmonitor` in the clone's submodule config: the drop launches. _(layer: cli, general)_
9. [ ] **Finding 9** — A task drop launches on a per-run profile copy. _(layer: cli, general)_
10. [ ] **Finding 10** — Another linked worktree's `.git` pointer is in the clone run's per-run copy. _(layer: cli, general)_
11. [ ] **Finding 11** — (b) A taken `sandbox.optOut` exempts the drop and the stub launches. _(layer: cli, general)_
12. [ ] **Finding 12** — (d) The helper's default probe launches the stub. _(layer: cli, general)_
13. [ ] **Finding 13** — An honest hung run resumes with the branch unmoved. _(layer: cli, general)_
14. [ ] **Finding 14** — A remote task drop is committed, pushed and dispatched, never spawned. _(layer: cli, general)_
15. [ ] **Finding 15** — The usage hold and the cap do not gate a remote drop. _(layer: cli, general)_
16. [ ] **Finding 16** — A failed dispatch leaves the record failed with one failed notification. _(layer: cli, general)_
17. [ ] **Finding 17** — A push that origin refuses blocks the dispatch. _(layer: cli, general)_

## Must Fix

### 1. Gate 6a: the home directory is spelled out in `task_9_plan.md`
→ [finding_1.md](feat_run_analytics_task_round_1/finding_1.md)

### 2. watcher-run-analytics: a launch commits run-analytics.json then run-analytics.md on the branch
→ [finding_2.md](feat_run_analytics_task_round_1/finding_2.md)

### 3. watcher-run-analytics: a resume that adds no session adds no analytics commit
→ [finding_3.md](feat_run_analytics_task_round_1/finding_3.md)

### 4. watcher-run-analytics: a run-analytics.sh that exits 1 changes neither the status nor the notifications
→ [finding_4.md](feat_run_analytics_task_round_1/finding_4.md)

### 5. watcher-run-analytics: a missing run-analytics.sh changes neither the status nor the notifications
→ [finding_5.md](feat_run_analytics_task_round_1/finding_5.md)

### 6. watcher-review-drop-payloads: a clean reused clone launches, with the review placed and left uncommitted
→ [finding_6.md](feat_run_analytics_task_round_1/finding_6.md)

### 7. watcher-review-drop-payloads: (L2) nested repository core.fsmonitor behind a gitlink, the drop launches
→ [finding_7.md](feat_run_analytics_task_round_1/finding_7.md)

### 8. watcher-review-drop-payloads: (L3) core.fsmonitor in the clone's submodule config, the drop launches
→ [finding_8.md](feat_run_analytics_task_round_1/finding_8.md)

### 9. watcher-run-profile: a task drop launches on a per-run copy at hr_run_profile_file
→ [finding_9.md](feat_run_analytics_task_round_1/finding_9.md)

### 10. watcher-run-profile: another live linked worktree's .git pointer is in the clone run's per-run copy
→ [finding_10.md](feat_run_analytics_task_round_1/finding_10.md)

### 11. watcher-sandbox-refusal: (b) a taken sandbox.optOut exempts the drop
→ [finding_11.md](feat_run_analytics_task_round_1/finding_11.md)

### 12. watcher-sandbox-refusal: (d) the helper's default probe launches the stub
→ [finding_12.md](feat_run_analytics_task_round_1/finding_12.md)

### 13. watcher-stall-reset-payloads: an honest hung run resumes, the branch unmoved
→ [finding_13.md](feat_run_analytics_task_round_1/finding_13.md)

### 14. watcher-remote-dispatch: a remote task drop is committed, pushed and dispatched, never spawned
→ [finding_14.md](feat_run_analytics_task_round_1/finding_14.md)

### 15. watcher-remote-dispatch: the usage hold and the cap do not gate a remote drop
→ [finding_15.md](feat_run_analytics_task_round_1/finding_15.md)

### 16. watcher-remote-dispatch: a failed dispatch leaves the record failed with one failed notification
→ [finding_16.md](feat_run_analytics_task_round_1/finding_16.md)

### 17. watcher-remote-dispatch: a push origin refuses blocks the dispatch
→ [finding_17.md](feat_run_analytics_task_round_1/finding_17.md)

## Not fixable on this branch

- **Gate 13a / 13b / 13c — Python lint, typecheck and tests (BLOCKED).**
  > `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync`
  > `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/3004880420; run bash scripts/python-service.sh sync`

  The cause is on the host: the Python environment was never provisioned. 13b and 13c print the same lines. `run-gates.sh` does not count BLOCKED as failed (`run-gates: 2 failed, 21 passed`). An operator fixes it by running `bash scripts/python-service.sh sync` on the host. No change on the branch fixes it.

## Source failures

Earlier logs: none. This is round 1, so no failure can be classed as new this round or persisting. Every entry below is **first round (no earlier log)**.

**Gate typecheck (`commands.typecheck`):** exited 0. No failures.

**Gate test (`commands.test`):** exited 1. Sub-gates:

- `6a no machine paths`: `harness-runs/task_plans/feat_run_analytics/task_9_plan.md:31` → **Finding 1**. First round.
- `4 npm test` (exit 1): 17 failing tests:
  - `not ok 1142 - the session's analytics are committed on the run's branch, and a failing step changes no outcome` (`cli/test/watcher-run-analytics.test.mjs`, parent test): fails only because its four subtests fail. Mapped to **Finding 2**, the subtest the other three depend on. First round.
    - `not ok 1 - a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout` → **Finding 2**. First round.
    - `not ok 2 - a resume that adds no session adds no analytics commit` → **Finding 3**. First round.
    - `not ok 3 - a run-analytics.sh that exits 1 changes neither the status nor the notifications` → **Finding 4**. First round.
    - `not ok 4 - a missing run-analytics.sh changes neither the status nor the notifications` → **Finding 5**. First round.
  - `not ok 1119 - a clean reused clone launches, with the review placed and left uncommitted` → **Finding 6**. First round.
  - `not ok 1120 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches` → **Finding 7**. First round.
  - `not ok 1121 - (L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches` → **Finding 8**. First round.
  - `not ok 1143 - a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries` → **Finding 9**. First round.
  - `not ok 1145 - another live linked worktree's .git pointer is in the clone run's per-run copy` → **Finding 10**. First round.
  - `not ok 1156 - (b) a taken sandbox.optOut exempts the drop: the stub is launched` → **Finding 11**. First round.
  - `not ok 1158 - (d) the helper's default probe launches the stub` → **Finding 12**. First round.
  - `not ok 1160 - an honest hung run resumes: the edit discarded, the branch unmoved, the note written` → **Finding 13**. First round.
  - `not ok 1076 - a remote task drop is committed, pushed and dispatched, never spawned` → **Finding 14**. First round.
  - `not ok 1077 - the usage hold and the cap do not gate a remote drop; the kill switch still defers it` → **Finding 15**. First round.
  - `not ok 1078 - a failed dispatch leaves the record failed with one failed notification` → **Finding 16**. First round.
  - `not ok 1079 - a push origin refuses blocks the dispatch` → **Finding 17**. First round.
- `13a Python lint`, `13b Python typecheck`, `13c Python tests` (BLOCKED, not counted as failed by `run-gates.sh`) → `## Not fixable on this branch`. First round.

The log also reports `SKIPPED` lines for 6f, 13d and 14d. Each states it was not run, so none is a failure and none yields a finding.
