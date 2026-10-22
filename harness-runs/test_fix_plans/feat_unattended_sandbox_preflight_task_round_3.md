# Test Fix Plan: feat_unattended_sandbox_preflight — task round 3

## Context

**Branch:** `feat_unattended_sandbox_preflight`
**Test log:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_3.log`
**Earlier logs:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_1.log`, `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_2.log`
**Summary:** The typecheck gate passed. The test gate failed only on run-gates gate 4 (`npm test`), and only on three failing tests. All three have persisted since round 1, and both earlier rounds already judged them not fixable on this branch. Round 2's two findings cleared the other failures.

The gate wrapper keeps only each failing test's `not ok` line and the tail of the suite's output, so this log carries no assertion message for any failure. Every diagnosis below comes from the current tree. The last commits to touch `cli/templates/scripts/scratch-run.sh`, `cli/test/outer-loop-scripts.test.mjs`, `cli/test/test-timeout.test.mjs` and `cli/test/helpers/fixture.mjs` are merged pull requests from before this branch (`74e07fc5`, `92851f48`, `871e2411`). Round 2's fixes (`6e69449f`, `41dade21`) changed only `cli/test/watcher-remote-job.test.mjs`, `cli/test/run-copy-migration.test.mjs` and `cli/test/helpers/watcher.mjs`, and neither remaining failure goes through those files.

This round has **no fixable failure**.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else are informational only.

There are no entries this round. Every failure in the log is listed under `## Not fixable on this branch`.

---

## Must Fix

None. No failure in this round's log can be fixed on this branch.

---

## Not fixable on this branch

- **`probe.dart under dart`** (`cli/test/outer-loop-scripts.test.mjs`) and its parent **`the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status`**. This has persisted since round 1.

  ```
              not ok 4 - probe.dart under dart
          not ok 309 - the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status
  ```

  **Reason.** The cause is the host's `dart` interpreter, which is outside the tree.
  - The subtest skips any interpreter that is not on `PATH` (`if (!onPath(interpreter))`), so `dart` was present on the gate host.
  - The in-tree dispatch (`cli/templates/scripts/scratch-run.sh` → `SCRATCH_INTERPRETERS='py:python3 js:node mjs:node cjs:node rb:ruby dart:dart php:php'`) works the same way for every probe. Only the `dart` subtest failed. The `python3` and `node` probes passed through the same dispatch in the same fixture.
  - Neither the runner nor this test has changed on the branch.

  A Dart toolchain writes per-user state under the home directory, and the gate's sandbox does not let it write there. A refused write by `dart` is therefore the likely mechanism. The log has no refusal line to quote because the wrapper dropped the case's output.

  **Operator's remedy.** Outside this run, confirm that the host's `dart` can run a one-file script in the environment the gates run in. Alternatively, run the gates unsandboxed: set a named `sandbox.optOut` with its `reason` in `harness.config.json`, then run `npx autonomous-sdlc-harness init --force`. Choosing between these is the operator's decision. Under `layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**, nobody changes the code or the test to avoid the refusal, and nobody adds or requests a sandbox profile entry from inside the run.

- **`a hung watcher case fails by name with a timeout and leaves no process behind`** (`cli/test/test-timeout.test.mjs`). This has persisted since round 1.

  ```
          not ok 1029 - a hung watcher case fails by name with a timeout and leaves no process behind
  ```

  **Reason.** The failure is the sandbox refusing the process-table read that the case's last assertion depends on.
  - Round 1's Finding 3 ran this file on its own and recorded the failing assertion, `assert.equal(left.status, 1, …)` after `pgrep -f <fixtureDir>`. Its output was `sysmon request failed with error: sysmond service not found` and `pgrep: Cannot get process list`, with `pgrep` exiting 3.
  - No surviving process was listed, and assertions (1) to (3) passed.
  - The case, `cli/test/helpers/fixture.mjs` and the `pgrep` call (`const left = await execResult('pgrep', ['-f', fixtureDir]);`) have not changed since.

  **Operator's remedy.** The case can pass only on a host where `pgrep` can read the process table. Either confirm it by hand outside any harness session, or run the gates unsandboxed: set a named `sandbox.optOut` with its `reason` in `harness.config.json`, then run `npx autonomous-sdlc-harness init --force`. Choosing between these is the operator's decision. The case and its assertion stay as they are, and nobody adds or requests a sandbox profile entry from inside the run.

---

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0. There are no static failures.

**Gate `test` (`commands.test`):** exited 1. Run-gates gate 4 (`4 npm test`, exit 1) is the only failing run-gates gate (`run-gates: 1 failed, 22 passed`). The following are not failures and produce no finding:
- Gates 6f, 13d and 14d were `SKIPPED`.
- Gates 13a–13c were `BLOCKED`: the Python environment is not provisioned at `<home>/.cache/harness-docs-retrieval/venvs/…`.
- The script lists the gates it cannot run separately.

All of these are the same as in rounds 1 and 2. The failing tests, classed against the round 1 and round 2 logs:

| Failing test (as the log names it) | Suite file | Maps to | Class |
|---|---|---|---|
| `probe.dart under dart` | `cli/test/outer-loop-scripts.test.mjs` | `## Not fixable on this branch` | persisting |
| `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status` (parent of the above) | `cli/test/outer-loop-scripts.test.mjs` | `## Not fixable on this branch` | persisting |
| `a hung watcher case fails by name with a timeout and leaves no process behind` | `cli/test/test-timeout.test.mjs` | `## Not fixable on this branch` | persisting |

Round 2's other failures are absent from this round's log:
- `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree`. Round 2's Finding 2 cleared it.
- `a usage_resume_at lost after the gate paused -> repaired to the fallback, wait-poller` and its parent `usage: a short reset is waited out in the job, a reset past the deadline goes to the poller`. Round 2's Finding 1 cleared them.
