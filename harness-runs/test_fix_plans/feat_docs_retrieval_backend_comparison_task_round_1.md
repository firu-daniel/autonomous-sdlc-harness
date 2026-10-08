# Test Fix Plan: feat_docs_retrieval_backend_comparison — task round 1

## Context

**Branch:** `feat_docs_retrieval_backend_comparison`
**Test log:** `harness-runs/test_run_logs/feat_docs_retrieval_backend_comparison/task_round_1.log` (machine-local, uncommitted; every detail it holds that a fix needs is quoted in the per-finding files)
**Summary:** `scripts/run-gates.sh` reported 2 failed and 21 passed: gate 6a (no machine paths) failed on the gitignored backend-comparison captures and probe outputs under `harness-runs/scratch/`, and gate 13b (Python typecheck) failed because mypy, pinned to `python_version = "3.11"`, followed the installed `models` extra into numpy 2.5.3's stubs, which use the 3.12 `type` statement.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The loop walks the `[ ]` entries below top to bottom, and only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only and never the iteration source.

Each entry resolves to a self-contained `finding_<K>.md` in this plan's per-finding folder. Sorted lowest blast radius first. The two findings are independent: neither depends on the other.

1. [x] **Finding 1** — Stop mypy following imports into the optional `models` extra (`follow_imports = "skip"` on the existing `sentence_transformers.*` / `torch.*` override in `docs-retrieval-service/pyproject.toml`). _(layer: general)_
2. [x] **Finding 2** — Exclude the gitignored `scratch` directory from gate 6a's `$HOME` grep, in `scripts/run-gates.sh` and in the gate's stated command in `docs/development.md` §5. _(layer: general)_

---

## Must Fix

### 1. mypy follows the installed `models` extra into numpy stubs that need Python 3.12
→ [finding_1.md](feat_docs_retrieval_backend_comparison_task_round_1/finding_1.md)

### 2. Gate 6a scans the gitignored scratch directory, where the branch's own capture protocol writes machine paths
→ [finding_2.md](feat_docs_retrieval_backend_comparison_task_round_1/finding_2.md)

---

## Not fixable on this branch

None. Both failures have causes in the tree.

---

## Source failures

The prompt named no earlier-round logs, so every failure is classed *new this round* by default. With no earlier log to compare against, that class does not show that the previous round's fix caused it.

- **Gate 6a — no machine paths** (`FAIL  6a no machine paths (printed output, which is the finding)`) → **Finding 2**. Class: new this round (first round; no earlier log).
- **Gate 13b — Python typecheck** (`FAIL  13b Python typecheck (exit 1)`) → **Finding 1**. Class: new this round (first round; no earlier log).
