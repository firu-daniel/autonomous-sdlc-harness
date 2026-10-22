# Test Fix Plan: feat_unattended_sandbox_preflight — task round 2

## Context

**Branch:** `feat_unattended_sandbox_preflight`
**Test log:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_2.log`
**Earlier log:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_1.log`
**Summary:** The typecheck gate passed. The test gate failed on run-gates gate 4 (`npm test`) with six failing tests: the round-1 `doctor` failure is gone, four failures persist from round 1, and one case in `cli/test/watcher-remote-job.test.mjs` (with its parent) is new this round.

The gate wrapper keeps only each failing test's `not ok` line and the tail of the suite's output, so no failure in this log carries its assertion message. Every diagnosis below is from the current tree. Since round 1 the tree changed only in `cli/test/doctor.test.mjs` (round 1's Finding 1), which no failure below exercises, so the new failure is not a regression from round 1's fix.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-finding files, are informational only.

Each entry resolves to a self-contained `feat_unattended_sandbox_preflight_task_round_2/finding_<K>.md` through its `**Finding K**` reference. Entries are sorted with the lowest blast radius first.

1. [ ] **Finding 1** — Make the lost-`usage_resume_at` job case independent of host load: a reset lead the gate cannot miss, a longer PAUSE wait, and a fallback bound taken from the job's start. _(layer: cli)_
2. [ ] **Finding 2** — Give the fresh-drop legacy-migration case's two-launch watcher pass a larger `tick` bound. _(layer: cli)_

---

## Must Fix

### 1. The lost-usage_resume_at job case depends on the gate seeing a 2-second window
→ [finding_1.md](feat_unattended_sandbox_preflight_task_round_2/finding_1.md)

### 2. The legacy-run migration case with a fresh drop fails again under suite load
→ [finding_2.md](feat_unattended_sandbox_preflight_task_round_2/finding_2.md)

---

## Not fixable on this branch

- **`probe.dart under dart`** (`cli/test/outer-loop-scripts.test.mjs`, a subtest of `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status`). Persisting from round 1.

  ```
              not ok 4 - probe.dart under dart
          not ok 309 - the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status
  ```

  **Reason.** The cause is the host's `dart` interpreter, outside the tree. The case skips an interpreter that is not on `PATH`, so `dart` was found on the gate host. The in-tree dispatch (`cli/templates/scripts/scratch-run.sh` → `SCRATCH_INTERPRETERS`) is the same for every probe, and the `probe.py`, `probe.js` and `probe.mjs` subtests passed through it in the same fixture. The branch touches neither `scratch-run.sh` nor this test file. A Dart toolchain keeps per-user state under the home directory, which the gate's sandbox does not let it write, so a refused write by `dart` is the likely mechanism. The log carries no refusal line, because the wrapper kept none of the case's output.

  **Operator's remedy.** Outside this run, confirm that the host's `dart` can run a one-file script in the environment the gate runs in. Under `layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**, a refusal here is not to be worked around in the code or the test.

- **`a hung watcher case fails by name with a timeout and leaves no process behind`** (`cli/test/test-timeout.test.mjs`). Persisting from round 1.

  ```
          not ok 1029 - a hung watcher case fails by name with a timeout and leaves no process behind
  ```

  **Reason.** Round 1's Finding 3 ran this file and recorded the failing assertion (`test-timeout.test.mjs:108`, `assert.equal(left.status, 1, …)`) together with its output: `sysmon request failed with error: sysmond service not found` and `pgrep: Cannot get process list`, with `pgrep` exiting 3. That is the sandbox refusing the process-table read the case uses to check for survivors. No surviving process was found. Assertions (1) to (3) passed, and nothing in the tree has changed on this path since. The case and its assertion stay as they are.

  **Operator's remedy.** The case can pass only on a host where `pgrep` can read the process table. Either confirm it by hand, outside any harness session, or run the gates unsandboxed by setting a named `sandbox.optOut` with its `reason` in `harness.config.json` and then running `npx autonomous-sdlc-harness init --force`. Choosing between these is the operator's decision. No sandbox profile entry is to be added or requested from inside the run.

---

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0. No static failures.

**Gate `test` (`commands.test`):** exited 1. run-gates gate 4 (`4 npm test`, exit 1) is the only failing run-gates gate. Gates 6f, 13d and 14d were `SKIPPED` and gates 13a–13c were `BLOCKED` (the Python environment is not provisioned at `<home>/.cache/harness-docs-retrieval/venvs/…`). The gates the script cannot run are listed separately. None of those is a failure, and each one is the same as in round 1. The failing tests, classed against round 1's log:

| Failing test (as the log names it) | Suite file | Maps to | Class |
|---|---|---|---|
| `a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller` | `cli/test/watcher-remote-job.test.mjs` | Finding 1 | new this round |
| `usage: a short reset is waited out in the job, a reset past the deadline goes to the poller` (parent of the above) | `cli/test/watcher-remote-job.test.mjs` | Finding 1 | new this round |
| `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree` | `cli/test/run-copy-migration.test.mjs` | Finding 2 | persisting |
| `probe.dart under dart` | `cli/test/outer-loop-scripts.test.mjs` | `## Not fixable on this branch` | persisting |
| `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status` (parent of the above) | `cli/test/outer-loop-scripts.test.mjs` | `## Not fixable on this branch` | persisting |
| `a hung watcher case fails by name with a timeout and leaves no process behind` | `cli/test/test-timeout.test.mjs` | `## Not fixable on this branch` | persisting |

Round 1's `doctor` failures (`a unit that sets the agent CLI variable is graded against the CLI it names`, its parent and the `doctor` suite) are absent from this round's log. Round 1's Finding 1 cleared them.
