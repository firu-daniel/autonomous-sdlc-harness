### Task 4 — Add the container test of the refresh's end state, shown failing with the fix removed and passing with it

**Goal:** Pin goal 3 beside the package's own tests: after a Python refresh with deletes, and after the Python store's own fresh build on an empty database, every `bm25_get_current_score()` read through the forced BM25 index scan equals, exactly, the score a fresh build of the final corpus followed by `REINDEX INDEX chunks_bm25` ranks by. The test is shown failing with the fix removed and passing with it.

**Depends on:** Task 3, which makes `refresh_index` (`harness_docs_retrieval.refresh`) end every refresh that wrote, and every refresh whose `index_state` meta value was not `"rebuilt"`, with `store.rebuild_indexes()` followed by `write_meta("index_state", "rebuilt")`, and Task 1, which adds `INDEX_STATE_META_KEY`, `INDEX_STATE_PENDING`, `INDEX_STATE_REBUILT`, `BM25_INDEX`, and `DocStore.rebuild_indexes()` to `harness_docs_retrieval.store`. This task imports them and restates nothing.

**Where this task stops.** It changes no source file in the commit. `refresh.py` is **Task 3's**: this task edits it only temporarily, to remove the fix for one run, and restores it byte for byte before it returns. Recording the evidence in a document is **Task 8's**; this task leaves it in scratch.

**Source:** `cli/test/docs-retrieval-refresh-end-state.test.mjs` at `3063e12c`, the TypeScript test this ports.

### Targets

- `docs-retrieval-service/tests/test_refresh_end_state_postgres.py` (new)
- `docs-retrieval-service/tests/conftest.py`

**Work:**

- [ ] **`conftest.py`.** Move the body of `fresh_database_url` into one private context manager that creates a uniquely named database through `psycopg.sql.Identifier` and drops it `WITH (FORCE)` in a `finally`, and build both `fresh_database_url` and a new `reference_database_url` fixture from it, so a test can hold two throwaway databases and neither is copied code. The module header's rule is unchanged and now covers both fixtures.
- [ ] **The test file's plumbing.** `pytestmark = pytest.mark.container`. A header stating the rule — *after a refresh, every ranking score equals the score a fresh build of the final corpus ranks by, whatever the index's history* — and that scores are read through `bm25_get_current_score()` under `SET enable_seqscan = off`, which forces the index scan and never disables it, and compared exactly. The corpus is the committed `evals/docs-retrieval/corpora/fixture-catalog/docs/*.md`, read through `ts_bridge.CHECKOUT_ROOT` and written under `tmp_path`, with a configuration that indexes only `docs`; the queries are every `query` of `evals/docs-retrieval/queries/fixture-catalog.jsonl`. Vectors come from the `hash-v1` stub, so no weights load. Helpers:
  - `_refresh_into(root, url)`: `open_postgres_store` → `refresh_index` → `close`;
  - `_read_scores(url)`: a `psycopg.connect(url, cursor_factory=psycopg.RawCursor)` session that runs `SET enable_seqscan = off`, asserts each query's `EXPLAIN (COSTS OFF)` contains `Index Scan using chunks_bm25`, then reads `SELECT key, bm25_get_current_score() AS scan FROM chunks ORDER BY <BM25_ORDER_CLAUSE> LIMIT $2` with `LIMIT` the final corpus's chunk count, sorted by `(scan, key)` — equal scores come back in heap order, which history moves — with no rounding;
  - `_reference(files, url)`: `_refresh_into` the final corpus on the reference database, then a raw `REINDEX INDEX chunks_bm25`, then `_read_scores`;
  - an assertion that every query's reference list is non-empty and that each query's list equals the reference's exactly.
- [ ] **The four cases**, the port of the TypeScript file's three plus goal 3's fresh build:
  - **(a) a refresh with deletes:** refresh the full corpus; then append a fixed paragraph to `docs/labels.md`, delete `docs/webhooks.md`, add one invented document, and refresh again, asserting `embedded > 0 and deleted > 0`; compare against the reference of that final corpus;
  - **(b) the Python store's own fresh build on an empty database:** one refresh of the full corpus into `fresh_database_url`; compare against the reference of the same corpus;
  - **(c) a database the shipped code left:** refresh the corpus plus one extra document; delete that document's chunks through the store and its file from the tree, and delete the `index_state` row raw; an unchanged refresh (`embedded == 0`, `deleted == 0`) brings the scores to the reference of the final corpus;
  - **(d) the marker's two other branches**, by a counting `DocStore` wrapper written as a small class that delegates every protocol method: after a build `index_state` is `rebuilt`; an unchanged refresh over it calls `rebuild_indexes()` zero times; after writing `pending`, an unchanged refresh calls it once and leaves `rebuilt`.
- [ ] **Shown failing with the fix removed.** With the Edit tool, remove only the `if wrote or index_state != INDEX_STATE_REBUILT:` block from `refresh.py`. Run this file (command under **Verification:**). Cases (a), (b), (c) and (d) must each fail. Write the run's date, the command, the commit it ran on (`git rev-parse HEAD`) and each failing case's assertion line verbatim, with the Write tool, to `harness-runs/scratch/fix-bm25-python/end-state-test-fix-removed.txt`. Restore the block with the Edit tool, and confirm `git diff --exit-code -- docs-retrieval-service/src/harness_docs_retrieval/refresh.py` exits 0 — on every exit path, a `blocker:` included.
- [ ] **Passing with the fix.** Run the file again with `refresh.py` restored; every case passes. Write the date, command, commit and pass summary to `harness-runs/scratch/fix-bm25-python/end-state-test-fix-present.txt`.

**Stops — each returns `blocker:`, and none is resolved by editing an assertion:**

- A case that **passes with the fix removed** pins nothing. Case (b) is the one at risk: the lead that the Python fresh build is the unspilled state, which differs from the rebuilt one, is research. Report which case passed and its reading; do not swap the corpus or the queries to manufacture a failure without the maintainer's ruling.
- A case that **fails with the fix present.** Classify the difference: one hit, the `operator` value (`text <@> to_bm25query(…)`) identical, and `bm25_summarize_index('chunks_bm25')` identical on both databases is the ruled residual — record it in the fix-present scratch file and the return, recorded and not attributed; anything else is a stop. Either way, never add a tolerance, a retry or a re-score.
- The server's versions differ from PostgreSQL 18.6 and `pg_textsearch` 1.5.1.

**Verification:**

- Before the first run, `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d docs_retrieval -At -c "SELECT version()"` and `… -c "SHOW pg_textsearch.library_version"` read PostgreSQL 18.6 and `1.5.1`.
- The run command, both times, as one plain foreground command from the repository root: `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/docs_retrieval bash scripts/python-service.sh test tests/test_refresh_end_state_postgres.py`. No case is reported skipped.
- Both scratch files exist; the fix-removed one lists four failing cases.
- `git diff --stat` lists only the two targets; `refresh.py` is unchanged.
- Without `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` the file's cases are skipped by `conftest.py`'s collection hook, which is what keeps `scripts/run-gates.sh` green with no Docker.
