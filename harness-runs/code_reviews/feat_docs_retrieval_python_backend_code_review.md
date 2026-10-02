# Code Review: feat_docs_retrieval_python_backend

## Context

**Branch:** `feat_docs_retrieval_python_backend`
**Date:** 2026-10-01
**Reviewed:** the whole branch diff against `dev` (50 files). That covers:

- the new `docs-retrieval-service/` package: `pyproject.toml` and `uv.lock`, the `harness_docs_retrieval` modules (`jscompat`, `corpus`, `chunk`, `models`, `stubs`, `store`, `search`, `refresh`, `wire`, `service`, `mcp_server`, `http_app`, `self_check`, `cli`), the `pytest` suite with its TypeScript bridge, the service and Postgres images, the compose file and the README;
- the new `scripts/python-service.sh` wrapper;
- gate 13 in `scripts/run-gates.sh` and `docs/development.md` → `## 5. Verifying a change`;
- the `.gitignore` backstop.

23 run-artifact files excluded from the reviewed diff.

Every module was read against the TypeScript module it ports (`cli/src/retrieval/{corpus,chunk,models,store,search,refresh,server,session}.ts`). Chunking, slugging, the stubs, RRF fusion, abstention, snippet cutting, rendering, argument parsing and the tool definition all match line for line. The statements in `store.py` → `statements` are `store.ts`'s, character for character. Every symbol the TS bridge imports (`cli/test/helpers/fixture.mjs`, `evals/docs-retrieval/corpora.mjs`, `cli/dist/retrieval/*`) exists. No file under `plugin/` or `cli/` and no `harness.config.json` is touched, and the diff names no machine path.

**Tests.** Every module ships its suite, and the four no-container parity cases plus the container-gated end-to-end case are present. Whether they pass is the Run gates phase's to establish. No Python test has run yet on this branch, and this review runs no suite.

**What the tests cannot reach.** The real-model path. No gate installs the `models` extra, and the lock lands that extra on a 2022 `sentence-transformers` that cannot run the loader's own calls (Finding 1). Parity is off (`phases.parity: false`), so there is no `<reference_impl>` cross-check and the call-out section is empty.

Pass 2 found no per-unit review folder under `harness-runs/task_plan_point_reviews/feat_docs_retrieval_python_backend_task_plan/`, so it carried nothing over.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom. The committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves to `harness-runs/code_reviews/feat_docs_retrieval_python_backend_code_review/finding_<K>.md` through its `**Finding K**` reference. Entries are sorted from smallest and safest to the one that reaches the network.

1. [x] **Finding 3** — Correct `run-gates.sh`'s header from "the other five automatable gates" to "the other six" _(layer: general)_
2. [x] **Finding 4** — Spell `JS_WHITESPACE` and `_ATX_HEADING`'s line-separator class with `\u` escapes instead of invisible literals _(layer: general)_
3. [x] **Finding 2** — Record in `## The seam, as found` and in `store.py`'s departures that the index is one per database, not one per checkout _(layer: general)_
4. [x] **Finding 1** — Floor the `models` extra at `sentence-transformers>=4.0`, re-lock, and guard the locked version from `tests/test_lock.py` _(layer: general)_

---

## Must Fix

### 1. The `models` extra locks a 2022 `sentence-transformers` that the loader's own API calls cannot run on
→ [finding_1.md](feat_docs_retrieval_python_backend_code_review/finding_1.md)

---

## Should Fix

### 2. `## The seam, as found` omits that the index is now one per database, not one per checkout
→ [finding_2.md](feat_docs_retrieval_python_backend_code_review/finding_2.md)

### 3. `run-gates.sh`'s header still says "the other five automatable gates" after gate 13 made it seven
→ [finding_3.md](feat_docs_retrieval_python_backend_code_review/finding_3.md)

---

## Nice to Have

### 4. The two JS-whitespace rules are spelled with invisible literal characters instead of `\u` escapes
→ [finding_4.md](feat_docs_retrieval_python_backend_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
