### 1. `docs/retrieval.md` cites only the TypeScript end-state figures, so the Python backend reads as measured the same way on the real catalog

**File:** `docs/retrieval.md` (`## How it fits together` → **Incremental refresh.**) — "Both are recorded and not attributed."

Task 7 added the sentence saying `refresh.py` → `refresh_index` *"applies the same rule with the same `index_state` marker"*, and named the Python container test as a pin. Task 7 committed this paragraph at `0a2d8665`, before Task 8 took the Python figures, so the paragraph's measurement sentences still describe the TypeScript backend only:

- *"the shipped end state matches a fresh build followed by `REINDEX` in 11 of the 12 TypeScript scenarios"*;
- *"`#### Route 2 on the real catalog` records a 1-hit residual of its own in `other-corpus`. Both are recorded and not attributed."*

`docs/retrieval-eval-results.md` now records a different Python result in the same two subsections. **Python, on `fix_docs_retrieval_bm25_index_state_python`** under `#### The shipped end state at refresh level` matches in 11 of 12 scenarios, with `self-docs` `file-edited` differing on 1 hit, which is the ruled shape. **Python (Postgres), on `fix_docs_retrieval_bm25_index_state_python`** under `#### Route 2 on the real catalog` is a result that is **not** the ruled one-hit shape. There, `scan` differs from `reference-reindex` on 1 to 39 hits, in two scenarios in run 1 and four in run 2, the hits differing between runs, while `operator` differs on 0 hits. The maintainer accepted that result as a residual for this real-catalog Python run only.

**The reader who gets it wrong:** someone choosing the backend reads `docs/retrieval.md`, the behaviour document. The paragraph tells them both backends apply the same rule. It then says the real catalog leaves a single 1-hit residual. From that they conclude that the Python backend's real-catalog end state is as close to a fresh build, and as repeatable, as the TypeScript one. The record says otherwise, and the Python result stood only by a maintainer ruling scoped to that run.

**Fix:** in `docs/retrieval.md` → **Incremental refresh.**, replace the sentence

```
Both are recorded and not attributed.
```

with

```
Both are recorded and not attributed. The Python backend's figures are the **Python** parts of the same two subsections: its shipped end state matches in 11 of the 12 scenarios, `self-docs` `file-edited` differing on 1 hit in `scan`, and on the real catalog its `scan` reading differs from the reference on 1 to 39 hits, in two to four scenarios and differently in each of two runs, with `operator` identical everywhere — not the one-hit shape, and recorded as a residual by the maintainer's ruling on that run alone.
```

Change nothing else in the paragraph. This is a prose-only edit, so no test file is touched and no test is run.
