# Test Fix Plan: feat_docs_retrieval_python_backend — task round 2

## Context

**Branch:** `feat_docs_retrieval_python_backend`
**Test log:** `harness-runs/test_run_logs/feat_docs_retrieval_python_backend/task_round_2.log` (earlier round: `harness-runs/test_run_logs/feat_docs_retrieval_python_backend/task_round_1.log`)
**Summary:** Gate 13a (Python lint) still fails. `ruff check` reports four E501 docstring lines over the 100-column limit, and `ruff format --check` wants one generator expression in `chunk.py` joined. This is the "sixth file" the round-1 fix plan could not identify. Every other gate passes. 6a was fixed in round 1.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when its commit lands. `[ ]` markers anywhere else, such as sub-step bullets in a per-finding file, are informational only.

Sorted lowest blast-radius first. The two findings are independent: each clears a different part of 13a's output, and the gate passes only when both have landed.

1. [x] **Finding 1** — Join the over-wrapped generator expression in `heading_slug` that `ruff format --check` flags at `src/harness_docs_retrieval/chunk.py:58`. _(layer: general)_
2. [x] **Finding 2** — Rewrap the four docstring lines over 100 columns (E501) in `chunk.py`, `tests/ts_bridge.py`, `tests/test_stubs.py` and `tests/test_chunk_parity.py`. _(layer: general)_

---

## Must Fix

### 1. `heading_slug` generator expression is not in `ruff format` form
→ [finding_1.md](feat_docs_retrieval_python_backend_task_round_2/finding_1.md)

### 2. Four docstring lines exceed the 100-column limit (E501)
→ [finding_2.md](feat_docs_retrieval_python_backend_task_round_2/finding_2.md)

---

## Not fixable on this branch

None. The only skipped item is 13d (Python container tests, `SKIPPED … opt in with HARNESS_GATES_CONTAINERS=1`). That is an opt-in skip, not a failure, so this plan does not cover it.

---

## Source failures

- **13a Python lint** (`FAIL  13a Python lint (exit 1)`) is **persisting**: it also failed in round 1. Its two parts:
  - `ruff check`: `Found 4 errors.` The log shows only one of them in full, `E501 Line too long (101 > 100)` at `tests/ts_bridge.py:4:101`, and its first lines are cut off. Reading the tree finds the other three (see Finding 2). These errors first appear in this round's log. They are not a regression: none of the four files changed in the round-1 fix commit, and the round-1 log showed only the formatter's tail. The round-1 Finding 2 notes had already listed these same four lines as over 100 columns. → **Finding 2**
  - `ruff format --check`: `unformatted: File would be reformatted --> src/harness_docs_retrieval/chunk.py:58:11` and `1 file would be reformatted, 38 files already formatted`. This is **persisting**. It is the sixth of round 1's "6 files would be reformatted", which the round-1 fix plan could not identify. → **Finding 1**
