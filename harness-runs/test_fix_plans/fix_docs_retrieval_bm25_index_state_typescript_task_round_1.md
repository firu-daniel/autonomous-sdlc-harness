# Test Fix Plan: fix_docs_retrieval_bm25_index_state_typescript — task round 1

## Context

- **Branch:** `fix_docs_retrieval_bm25_index_state_typescript`
- **Log:** `harness-runs/test_run_logs/fix_docs_retrieval_bm25_index_state_typescript/task_round_1.log`
- **Summary:** The typecheck gate passed; the test gate failed on one check, `6a no machine paths`, because a committed architecture review for this branch quotes an absolute path under the home directory.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Remove the home-directory path quoted in this branch's architecture review. _(layer: general)_

## Must Fix

### 1. Remove the home-directory path quoted in this branch's architecture review
→ [finding_1.md](fix_docs_retrieval_bm25_index_state_typescript_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

**Gate `typecheck` (`commands.typecheck`)** — exited 0; no failures.

**Gate `test` (`commands.test`)** — exited 1.

- `6a no machine paths` → Finding 1. Class: first round, no earlier logs, so not classified against a previous round.
