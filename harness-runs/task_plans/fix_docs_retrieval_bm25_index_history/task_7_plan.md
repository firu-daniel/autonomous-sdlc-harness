### Task 7 — Pin the Python fix with a container test beside the package's own

**Goal:** Meet goal 4 for the Python backend. Add a test, beside the package's own tests and needing the compose Postgres like the other container tests, that builds an index, removes and changes documents, refreshes, and compares the BM25 scores with those of a fresh index of the final corpus, exactly. It must fail with Task 6's rebuild call removed and pass with it. Where no test database is configured, it is skipped like the existing container tests, so `scripts/run-gates.sh` still passes with no Docker (task prompt → `## Constraints`, fourth bullet).

**Depends on:** Task 6, which adds `DocStore.rebuild_lexical_index()` and `BM25_REINDEX` to `store.py`, and calls it from `refresh_index` exactly once when the refresh cleared the table, deleted a key, or re-embedded a stored key. This test drives `refresh_index` as shipped and never calls `rebuild_lexical_index` itself.

### Targets

- `docs-retrieval-service/tests/test_refresh_bm25_history.py` (new).
- `docs-retrieval-service/tests/conftest.py`, only if a second throwaway database is needed in one test: a fixture beside `fresh_database_url` that creates and drops a second database by the same mechanism, rather than a copy of it inside the test file.

**Work:**

- [ ] Header: the rule the file enforces, carried over from Task 5's TypeScript test, with a citation of `docs/retrieval-eval-results.md` → `### The index's history, measured`. `pytestmark = pytest.mark.container`, as `tests/test_store_postgres.py` sets it, so the module is skipped loudly with `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` unset (`tests/conftest.py` → `CONTAINER_SKIP_REASON`).
- [ ] Fixture: a throwaway corpus under `tmp_path`, built as `tests/test_refresh.py` builds its corpus and config, and the `hash-v1` stub through `stubs.resolve_models`, exactly as `tests/test_store_postgres.py` takes it, so no weights are read. Database X, from `fresh_database_url`, is refreshed incrementally. Database Y, a second throwaway database, is refreshed once from the final corpus.
- [ ] Scoring helper: on each store's database, run `SELECT key, (text <@> to_bm25query($1, '<BM25_INDEX>'))::float8 …` composed from `store.py`'s `CHUNKS_TABLE`, `BM25_INDEX` and `BM25_ORDER_CLAUSE`, bound and never spliced, for a fixed set of queries. Return key → score.
- [ ] Three cases, the same as Task 5's: **(a) delete**, which removes a corpus file; **(b) update**, which changes a section body; **(c) embedder change**, `hash-v1` then `hash-v2`. Each asserts that X's score map equals Y's, and that the `RefreshResult` shows the deletion or re-embedding it exercised.
- [ ] Show it failing: with the `rebuild_lexical_index()` call in `refresh.py` temporarily removed, run the package's container tests with the compose Postgres up and confirm that cases (a), (b) and (c) fail on the score comparison. Restore the call and confirm all pass. Nothing of the removal is committed.

**Verification:**

- `bash scripts/python-service.sh container-test`, with the compose `postgres` service up, passes with the call in place. The failing run with it removed is reported in the task's completion note, with its failure count.
- `bash scripts/run-gates.sh` without `HARNESS_GATES_CONTAINERS=1` reports gate 13d `SKIPPED`, as before, and passes (`scripts/run-gates.sh` → the 13d leg).
- `ruff` and `mypy`, as gate 13 runs them, pass on the new file.
