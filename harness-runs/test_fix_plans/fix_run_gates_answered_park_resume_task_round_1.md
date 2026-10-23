# Test Fix Plan: fix_run_gates_answered_park_resume — task round 1

## Context

- **Branch:** `fix_run_gates_answered_park_resume`
- **Log:** `harness-runs/test_run_logs/fix_run_gates_answered_park_resume/task_round_1.log`
- **Summary:** the typecheck gate passed; the test gate failed on exactly one `node:test` case out of 2281 (`cli/test/run-test-suite.test.mjs` → `a worker that finishes inside the start-up poll still answers \`pending\`, and one --wait collects it`), a timing race in the test itself, in a file and a wrapper this branch does not touch.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan are informational only.

1. [x] **Finding 1** — Make the start-up-poll case wait for the verdict before its one `--wait`. _(layer: cli)_

## Must Fix

### 1. Make the start-up-poll case wait for the verdict before its one `--wait`

→ [finding_1.md](fix_run_gates_answered_park_resume_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

**Gate `typecheck`** (`commands.typecheck`): exited 0 — no failures.

**Gate `test`** (`commands.test`): exited 1, from the repository gate script's gate 4 (`npm test`, exit 1).

- `not ok 988 - a worker that finishes inside the start-up poll still answers \`pending\`, and one --wait collects it` (`cli/test/run-test-suite.test.mjs`) → **Finding 1**. Class: first round — no earlier log to compare against.

Reported by the gate script but not failures, so no finding: `13a`, `13b`, `13c` BLOCKED (the Python docs-retrieval service's environment is not provisioned on this machine); `6f`, `13d`, `14d` SKIPPED (a tool absent from the host, or an opt-in not set). The script's own tally is `run-gates: 1 failed, 22 passed`.
