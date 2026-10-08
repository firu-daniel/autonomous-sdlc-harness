# Test Fix Plan: feat_docs_retrieval_backend_comparison — task round 3

## Context

**Branch:** `feat_docs_retrieval_backend_comparison`
**Test log:** `harness-runs/test_run_logs/feat_docs_retrieval_backend_comparison/task_round_3.log`
**Earlier logs:** `harness-runs/test_run_logs/feat_docs_retrieval_backend_comparison/task_round_1.log`, `harness-runs/test_run_logs/feat_docs_retrieval_backend_comparison/task_round_2.log`
**Summary:** Only gate 13b (Python typecheck) still fails. mypy parses numpy's `.pyi` stubs despite `follow_imports = "skip"`, because mypy applies `follow_imports` to stub files only when `follow_imports_for_stubs` is set.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, such as the sub-step bullets inside a per-finding file, are informational only.

1. [ ] **Finding 1** — Add `follow_imports_for_stubs = true` to the numpy/torch/sentence_transformers mypy override in `docs-retrieval-service/pyproject.toml`, so the existing skip also reaches `.pyi` stubs. _(layer: general)_

---

## Must Fix

### 1. mypy ignores `follow_imports = "skip"` for numpy because numpy ships `.pyi` stubs
→ [finding_1.md](feat_docs_retrieval_backend_comparison_task_round_3/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

- **13b Python typecheck** — `FAIL (exit 1)`, `numpy/__init__.pyi:737: error: Type statement is only supported in Python 3.12 and greater  [syntax]`. → Finding 1. Class: persisting (identical in rounds 1 and 2).
- **13d Python container tests** — `SKIPPED`, not opted in with `HARNESS_GATES_CONTAINERS=1`. This is an opt-in skip and not a failure, so it has no finding.
- **6a no machine paths** — failed in rounds 1 and 2, and passes in round 3. No finding.
