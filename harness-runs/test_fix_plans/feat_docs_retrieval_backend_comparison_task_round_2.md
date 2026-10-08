# Test Fix Plan: feat_docs_retrieval_backend_comparison — task round 2

## Context

**Branch:** `feat_docs_retrieval_backend_comparison`
**Test log:** `harness-runs/test_run_logs/feat_docs_retrieval_backend_comparison/task_round_2.log` (machine-local, uncommitted; every detail a fix needs is quoted in the per-finding files)
**Earlier log:** `harness-runs/test_run_logs/feat_docs_retrieval_backend_comparison/task_round_1.log`
**Summary:** `scripts/run-gates.sh` reported 2 failed and 21 passed. Gate 13b (Python typecheck) failed with the same numpy-stub syntax error as round 1, because mypy also reaches numpy through `psycopg`'s `TYPE_CHECKING` import, which round 1's fix did not cover. Gate 6a (no machine paths) failed on a different set of files from round 1: gitignored `__pycache__/*.pyc` files under `docs-retrieval-service/src/`. A gate 13c test writes these files because it starts the service with an environment that drops `PYTHONDONTWRITEBYTECODE`.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The loop walks the `[ ]` entries below top to bottom, and only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only and never the iteration source.

Each entry resolves to a self-contained `finding_<K>.md` in this plan's per-finding folder. Sorted lowest blast radius first. The two findings are independent: neither depends on the other.

1. [ ] **Finding 1** — Add `numpy` / `numpy.*` to the skipped mypy override in `docs-retrieval-service/pyproject.toml`, so psycopg's type-only numpy import no longer leads mypy into numpy's 3.12-syntax stubs. _(layer: general)_
2. [ ] **Finding 2** — Stop the launcher e2e test from writing bytecode into the source tree, and exclude `__pycache__` from gate 6a's `$HOME` grep. _(layer: general)_

---

## Must Fix

### 1. mypy still reaches numpy's 3.12-only stubs, through psycopg's type-only import
→ [finding_1.md](feat_docs_retrieval_backend_comparison_task_round_2/finding_1.md)

### 2. Gate 6a matches gitignored bytecode that a gate 13c test writes into `docs-retrieval-service/src/`
→ [finding_2.md](feat_docs_retrieval_backend_comparison_task_round_2/finding_2.md)

---

## Not fixable on this branch

None. Both failures have causes in the tree.

---

## Source failures

- **Gate 6a — no machine paths** (`FAIL  6a no machine paths (printed output, which is the finding)`) → **Finding 2**. Class: persisting as a gate, but its hits are *new this round*. Round 1's hits were all under `harness-runs/scratch/`, and round 1's Finding 2 cleared them. This round's 16 hits are `docs-retrieval-service/src/harness_docs_retrieval/__pycache__/*.cpython-314.pyc`, none of which round 1's log names. The files are timestamped during round 1's gate 13 run, which came after round 1's 6a, so this is not a regression from round 1's fix.
- **Gate 13b — Python typecheck** (`FAIL  13b Python typecheck (exit 1)`) → **Finding 1**. Class: persisting. The error line is identical to round 1's. Round 1's fix (`follow_imports = "skip"` on `sentence_transformers.*` / `torch.*`) did not take effect because those packages are not the only route to numpy.
