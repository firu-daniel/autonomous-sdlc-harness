# Test Fix Plan: feat_unattended_sandbox_preflight — task round 1

## Context

**Branch:** `feat_unattended_sandbox_preflight`
**Test log:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_1.log`
**Summary:** The typecheck gate passed. The test gate failed on run-gates gate 4 (`npm test`): six tests failed. They come from five failing cases in four suites: `doctor`, `outer-loop-scripts`, `run-copy-migration` and `test-timeout`.

The gate wrapper (`scripts/run-gates.sh` → `gate`) keeps only each failing test's `not ok` line and the last 25 lines of the suite's output, and it deletes its own log afterwards. None of the five failures carries its assertion message in the log, so every diagnosis below is from the current tree. Finding 1's cause is confirmed by reading the code. Findings 2 and 3 name the evidence that is missing and choose their fix by the message the case reports.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-finding files, are informational only.

Each entry resolves to a self-contained `feat_unattended_sandbox_preflight_task_round_1/finding_<K>.md` through its `**Finding K**` reference. Entries are sorted with the lowest blast radius first.

1. [x] **Finding 1** — Match the agent binary as a graded entry, not a substring, in the daemon-path override case, so a temp path containing `claude` no longer fails it. _(layer: cli)_
2. [x] **Finding 2** — Fix the fresh-drop legacy-migration case's single watcher pass: a bound sized for its two launches, or the probe override reaching the inbox pass. _(layer: cli)_
3. [ ] **Finding 3** — Fix the hung-watcher timeout case: the child runner's file bound, or the group reap it asserts. _(layer: cli)_

---

## Must Fix

### 1. The daemon-path override case rejects its own temp paths as the default agent CLI
→ [finding_1.md](feat_unattended_sandbox_preflight_task_round_1/finding_1.md)

### 2. The legacy-run migration case with a fresh drop fails in its one watcher pass
→ [finding_2.md](feat_unattended_sandbox_preflight_task_round_1/finding_2.md)

### 3. The hung-watcher timeout case fails
→ [finding_3.md](feat_unattended_sandbox_preflight_task_round_1/finding_3.md)

---

## Not fixable on this branch

- **`probe.dart under dart`** (`cli/test/outer-loop-scripts.test.mjs`, a subtest of `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status`).

  ```
              not ok 4 - probe.dart under dart
          not ok 309 - the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status
  ```

  **Reason.** The cause is the host's `dart` interpreter, which lies outside the tree. The case skips any interpreter that is not on `PATH`, so `dart` resolved on the gate host. The in-tree code this subtest exercises is the same for every probe: `scratch-run.sh` → `SCRATCH_INTERPRETERS` (`… dart:dart php:php`) and the case's `runScratch`. The `probe.py` (python3), `probe.js` and `probe.mjs` (node) subtests drove that same dispatch in the same fixture and passed. Only the interpreter differs between them. Neither `cli/templates/scripts/scratch-run.sh` nor `cli/test/outer-loop-scripts.test.mjs` is touched by this branch.

  The log carries no sandbox-refusal line, because the wrapper kept none of the case's output. A Dart toolchain does keep per-user state under the home directory, though, and the gate ran inside the agent's sandbox, whose write set excludes the home directory. That makes a refused write by `dart` itself the likely mechanism.

  **Operator's remedy.** Confirm that the host's `dart` can run a one-file script from the environment the gate runs in, outside this run. Under `layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**, a refusal here is never routed around in code or in the test.

---

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0. No static failures.

**Gate `test` (`commands.test`):** exited 1. run-gates gate 4 (`4 npm test`, exit 1) is the only failing run-gates gate. Gates 6f, 13d and 14d were `SKIPPED`, gates 13a–13c were `BLOCKED`, and the gates the script cannot run are listed. None of those is a failure. Each failing test is listed below with its class, against no earlier round:

| Failing test (as the log names it) | Suite file | Maps to | Class |
|---|---|---|---|
| `a unit that sets the agent CLI variable is graded against the CLI it names` | `cli/test/doctor.test.mjs` | Finding 1 | new this round |
| `the daemon-path check grades the installed unit, and never above a warning` (parent of the above) | `cli/test/doctor.test.mjs` | Finding 1 | new this round |
| `doctor` (the suite holding the above) | `cli/test/doctor.test.mjs` | Finding 1 | new this round |
| `probe.dart under dart` | `cli/test/outer-loop-scripts.test.mjs` | `## Not fixable on this branch` | new this round |
| `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status` (parent of the above) | `cli/test/outer-loop-scripts.test.mjs` | `## Not fixable on this branch` | new this round |
| `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree` | `cli/test/run-copy-migration.test.mjs` | Finding 2 | new this round |
| `a hung watcher case fails by name with a timeout and leaves no process behind` | `cli/test/test-timeout.test.mjs` | Finding 3 | new this round |
