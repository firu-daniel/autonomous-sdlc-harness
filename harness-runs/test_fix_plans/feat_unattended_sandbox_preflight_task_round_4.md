# Test Fix Plan: feat_unattended_sandbox_preflight — task round 4

## Context

**Branch:** `feat_unattended_sandbox_preflight`
**Test log:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_4.log`
**Earlier logs:** `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_1.log`, `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_2.log`, `harness-runs/test_run_logs/feat_unattended_sandbox_preflight/task_round_3.log`
**Summary:** The typecheck gate passed. The test gate failed only on run-gates gate 4 (`npm test`), and only on the same three failing tests round 3 judged not fixable. The user has since settled them in this branch's scope.

**Why these are fixable this round.** Round 3 parked on `fixable: 0`. The user answered the park in `harness-runs/clarifications/feat_unattended_sandbox_preflight/answer_1.md`, Q1 → Option 3, covering both tests in this branch. Their evidence: run unsandboxed on this branch's tip, both cases pass. Their rules:

- each case skips only on a capability the test itself measures at the moment it needs it, never on detecting the sandbox;
- the skip message follows the existing "not on PATH" skips and quotes the tool's own output;
- no assertion is loosened or deleted;
- no sandbox profile entry is added and `sandbox.optOut` is not touched.

Both findings below implement that answer and nothing more.

The gate wrapper keeps only each failing test's `not ok` line. The assertion detail cited in the findings comes from round 1's single-file run and from the current tree.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, including the `- [ ]` sub-step bullets inside the finding files, are informational only.

1. [x] **Finding 1** — Skip the hung-watcher survivor check only when `pgrep` cannot read the process table. _(layer: cli)_
2. [ ] **Finding 2** — Give every scratch-runner probe a direct-interpreter control run, and skip only when the interpreter itself cannot run the probe. _(layer: cli)_

---

## Must Fix

### 1. Skip the hung-watcher survivor check only when `pgrep` cannot read the process table

→ [finding_1.md](feat_unattended_sandbox_preflight_task_round_4/finding_1.md)

### 2. Give every scratch-runner probe a direct-interpreter control run, and skip only when the interpreter itself cannot run the probe

→ [finding_2.md](feat_unattended_sandbox_preflight_task_round_4/finding_2.md)

---

## Not fixable on this branch

None. This round, every failure in the log maps to a finding.

---

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0. There are no static failures.

**Gate `test` (`commands.test`):** exited 1. Run-gates gate 4 (`4 npm test`, exit 1) is the only failing run-gates gate (`run-gates: 1 failed, 22 passed`). The following are not failures and produce no finding:

- Gates 6f, 13d and 14d were `SKIPPED`.
- Gates 13a–13c were `BLOCKED`: the Python environment is not provisioned at `<home>/.cache/harness-docs-retrieval/venvs/…`.
- The script lists the gates it cannot run separately.

All of these are the same as in rounds 1 to 3.

The failing tests, classed against the round 1, 2 and 3 logs:

| Failing test (as the log names it) | Suite file | Maps to | Class |
|---|---|---|---|
| `a hung watcher case fails by name with a timeout and leaves no process behind` | `cli/test/test-timeout.test.mjs` | Finding 1 | persisting (rounds 1–4) |
| `probe.dart under dart` | `cli/test/outer-loop-scripts.test.mjs` | Finding 2 | persisting (rounds 1–4) |
| `the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status` (parent of the above) | `cli/test/outer-loop-scripts.test.mjs` | Finding 2 | persisting (rounds 1–4) |

No failure is new this round: round 4's `not ok` lines are identical to round 3's.
