### Task 2 — Pin the store's width-change marker removal and the matching-only filter on the Seq Scan plan in `test_store_postgres.py`

**Goal:** Prove against a real Postgres the two store behaviours Task 1 ported that no statement comparison can see: reopening at another width removes the `index_state` record with the embedder record, and `lexical_search` returns only the matching chunk on the `Seq Scan` plan a rebuilt small index takes — the port of `cli/test/docs-retrieval-store.test.mjs` case (c).

**Depends on:** Task 1, which adds to `harness_docs_retrieval.store`: `INDEX_STATE_META_KEY` (`"index_state"`), `LEXICAL_SEARCH_STATEMENT` (`SELECT id, text <@> to_bm25query($1, 'chunks_bm25') AS score FROM chunks ORDER BY text <@> to_bm25query($1, 'chunks_bm25') LIMIT $2`), `async DocStore.rebuild_indexes() -> None` (issues `REINDEX INDEX chunks_bm25`), and a `lexical_search` that drops every score-`0` row. This task imports those names and restates no statement.

**Where this task stops.** It changes no source file. The refresh's end state is **Task 3's**, and its history test is **Task 4's**.

### Targets

- `docs-retrieval-service/tests/test_store_postgres.py`

**Work:**

- [ ] **The width-change case.** In `test_reopening_at_another_width_drops_the_chunks_and_the_embedder`, write `INDEX_STATE_META_KEY` = `"rebuilt"` beside the embedder record before closing, and assert `await narrow.read_meta(INDEX_STATE_META_KEY) is None` after the narrow reopen. Rename the case to say it drops the index-state record too, and import `INDEX_STATE_META_KEY` and `INDEX_STATE_REBUILT` rather than typing either value.
- [ ] **The Seq Scan case**, a new `container` case on `fresh_database_url`, with the `hash-v1` stub (`monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")`, as `_run` does):
  - Build 40 chunks with `chunk_markdown` from one generated document of 40 `##` sections, exactly one of which carries a probe term no other section carries (e.g. `quokka`), and one absent term no section carries. Embed them with the stub, `open_postgres_store(url, EMBEDDING_DIMENSIONS)`, `upsert_chunks`, then `rebuild_indexes()` — the rows exist before the BM25 index is rebuilt, which is what gives the planner the real row estimate.
  - On a separate `psycopg.connect(url, cursor_factory=psycopg.RawCursor)` connection, `EXPLAIN (VERBOSE, COSTS OFF) ` + `LEXICAL_SEARCH_STATEMENT` with `[probe, 50]` must contain `Seq Scan on public.chunks`; otherwise fail with a message saying the case no longer reaches the plan it exists for, and print the plan.
  - `lexical_search(probe, 50)` returns exactly one `RankedId` with rank `1` and the probe chunk's id (read through `list_chunk_hashes` / `get_chunks`, never assumed); `lexical_search(absent, 50)` returns `[]`.
- [ ] **The file header.** Add one sentence: the Seq Scan case reaches the plan through the store itself, `rebuild_indexes()` below the crossover, and asserts the filter holds there, as `cli/test/docs-retrieval-store.test.mjs` case (c) does on PGlite.

**If the plan at 40 rows is not `Seq Scan`:** return `blocker:` naming the plan text and the row count. Do not add `ANALYZE` to the store, do not change the row count past the 63-row crossover band's low end without saying so, and never assert on a plan the case did not reach.

**Verification:**

- Before running, read the server's versions: `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d docs_retrieval -At -c "SELECT version()"` and `… -c "SHOW pg_textsearch.library_version"` read PostgreSQL 18.6 and `1.5.1`. Different values stop the task with a `blocker:` naming them.
- `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/docs_retrieval bash scripts/python-service.sh test tests/test_store_postgres.py` passes, as one plain foreground command from the repository root, with no case reported skipped in the `-rs` summary.
- `git diff --stat` lists only `docs-retrieval-service/tests/test_store_postgres.py`.
- **Deviations from plan:**
  - The limit `50` is imported as `ARM_CANDIDATES` from `harness_docs_retrieval.search` (value `50`) rather than typed, per the conventions document's import-from-owner rule; it is the limit the lexical arm calls with, as the reference case (c) imports it.
  - The probe chunk's id is read back through `get_chunks([hit.id])` and asserted to carry the probe chunk's key, rather than assumed; `list_chunk_hashes` carries no ids.
  - Outside this unit's verification list, `bash scripts/python-service.sh lint` was also run: its one finding in this unit's file (`E501` in `tests/test_store_postgres.py`) was fixed and lint rerun clean for that file; the remaining `E501` at `tests/test_store_statements.py` line 9 and the `ruff format` diff at `src/harness_docs_retrieval/store.py` (`END_STATE_STATEMENTS` comprehension) lie in Task 1's files, which this task does not edit. `bash scripts/python-service.sh typecheck` reports no issues.
