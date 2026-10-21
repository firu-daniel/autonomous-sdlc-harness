### 3. `docs/retrieval.md` says the BM25 scores no longer depend on the index's history, but the measurement it cites records a residual

**File:** `docs/retrieval.md` → `## How it fits together` → **Incremental refresh.**: "This is so the BM25 scores a search ranks by no longer depend on the index's history: measured in"

The sentence makes an unqualified claim and cites `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` → `#### The shipped end state at refresh level` as its evidence. That part's own **The outcome.** paragraph says otherwise. The shipped end state matches `reference-reindex` in **11 of the 12** TypeScript scenarios. `self-docs` `file-edited` still differs on 1 hit in `scan` (`q-sd-stack-detection` → `docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls`, a difference of 2.384185791015625e-7, one float32 ULP), and a second `REINDEX` leaves the same hit. The maintainer ruled that hit recorded and not attributed. `#### Route 2 on the real catalog` likewise records a 1-hit `scan` residual in `other-corpus`, which recurred exactly on the second run.

**docs/retrieval.md** is the behaviour document, so it is the page a reader of the Python port (`fix_docs_retrieval_bm25_index_state_python`) or of the backend comparison will take the TypeScript backend's guarantee from. Read as written, it says the end state is bit-identical to a fresh build in every case. That reader would then treat any residual the Python port meets as a Python-side defect, when the TypeScript backend carries the same class of residual on record. The ruling decided how to attribute the hit, not that it was absent. The behaviour document should state what the measurement found.

**Fix:** in that paragraph, replace the sentence that opens *"This is so the BM25 scores a search ranks by no longer depend on the index's history"* and runs to its end. Change nothing else in the paragraph:

```markdown
This is so the BM25 scores a search ranks by no longer depend on the index's history. Measured in `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` → `#### The shipped end state at refresh level`, the shipped end state matches a fresh build followed by `REINDEX` in 11 of the 12 TypeScript scenarios at 0 differing hits; `self-docs` `file-edited` differs on 1 hit by one float32 ULP, which a second `REINDEX` leaves, and `#### Route 2 on the real catalog` records a 1-hit residual of its own in `other-corpus`. Both are recorded and not attributed. The property is pinned by `cli/test/docs-retrieval-refresh-end-state.test.mjs`.
```

Documentation only. The fix runs no test.
