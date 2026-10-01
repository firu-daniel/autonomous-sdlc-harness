# Test Fix Plan: feat_docs_retrieval_python_backend — task round 1

## Context

**Branch:** `feat_docs_retrieval_python_backend`
**Test log:** `harness-runs/test_run_logs/feat_docs_retrieval_python_backend/task_round_1.log`
**Summary:** Two of 23 gates failed. 6a failed because this run's leftover gitignored scratch probe and `__pycache__` bytecode in the working tree contain the home directory. 13a failed because `ruff format --check` would reformat 6 Python files: wrapped signatures and expressions that fit inside the package's 100-column `line-length`.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and only the committing role flips an entry to `[x]`. `[ ]` markers anywhere else, including sub-step bullets inside a per-finding file, are informational only.

1. [ ] **Finding 1** — Remove the leftover scratch probes and the `__pycache__` bytecode that put the home directory in the working tree. _(layer: general)_
2. [ ] **Finding 2** — Collapse the over-wrapped Python constructs `ruff format` would join at `line-length = 100`. _(layer: general)_

---

## Must Fix

### 1. Leftover scratch probe and `__pycache__` bytecode carry the home directory (gate 6a)
→ [finding_1.md](feat_docs_retrieval_python_backend_task_round_1/finding_1.md)

### 2. Six Python files are not in `ruff format` form (gate 13a)
→ [finding_2.md](feat_docs_retrieval_python_backend_task_round_1/finding_2.md)

---

## Not fixable on this branch

None. Every failure in the log is caused by something inside the working tree.

---

## Source failures

| Failure in the log | Maps to | Class |
|---|---|---|
| `6a no machine paths` | Finding 1 | new this round (round 1, no earlier log) |
| `13a Python lint` | Finding 2 | new this round (round 1, no earlier log) |

`13d Python container tests` is reported `SKIPPED` and is not a failure, so it is not mapped here.
