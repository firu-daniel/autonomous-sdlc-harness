### Task 7 — Port `DocStore` onto a real Postgres with the same SQL (`store.py`)

**Goal:** Implement the `DocStore` contract on a real Postgres with `pgvector` and `pg_textsearch`, reached by connection string, issuing **the same statements** `cli/src/retrieval/store.ts` issues. The two that decide every relevance number, the lexical arm's `ORDER BY text <@> to_bm25query($1, 'chunks_bm25')` and the vector arm's `ORDER BY embedding <=> $1::vector`, must be the same text against a different engine. This is the first thing ever fitted to the seam `store.ts`'s header declares.

**Depends on:** Task 2 (`jscompat.py` → `js_trim`, for the empty-query test `query.trim() === ''`), Task 1 (`psycopg>=3.2` in the base set; `tests/conftest.py` → the `container` marker and the `fresh_database_url` fixture), Task 3 (`chunk.py` → `DocChunk` with `key, path, anchor, heading, text, body, hash`), Task 4 (`tests/ts_bridge.py` → `run_bridge("constants")["store"]` with `CHUNKS_TABLE, BM25_INDEX, BM25_INDEX_DEFINITION, BM25_ORDER_CLAUSE, CHUNK_TEXT_COLUMN, EMBEDDER_META_KEY, embeddingColumn384`) and Task 6 (`stubs.py` → the `hash-v1` stub embedder, used by the container test to make real 384-wide vectors).

**Ported from:** `cli/src/retrieval/store.ts`: the exported constants, `StoredChunk`, `RankedId`, `DocStore`, `vectorLiteral` and `openPgliteStore`. Its rule carries over verbatim: **every value reaches SQL as a bound parameter, and the SQL stays plain Postgres plus the `vector` and `pg_textsearch` extensions.** The only spliced tokens are the checked-integer `vector(<dimensions>)` and the constant index name.

**How the statements carry over unchanged.** psycopg's default cursor takes `%s` placeholders. psycopg ≥ 3.2's **`AsyncRawCursor`** takes PostgreSQL-native `$1`, `$2`, … placeholders, so open the connection with `cursor_factory=psycopg.AsyncRawCursor` and copy every statement from `store.ts` character for character. Where one genuinely cannot carry over, for example a multi-statement `exec` the driver refuses or an extension setting PGlite supplies through its `extensions` option, issue the nearest equivalent and **record it in `store.py`'s module docstring under a paragraph headed `Departures from store.ts:`**, one item per departure with its reason, or the single line `Departures from store.ts: none.` when every statement carried over. That paragraph is durable. Task 17 reads it to write the README's `## The seam, as found`, because a return message does not outlive the run. Do not edit `store.ts`.

**Where this task stops.** The store holds no search logic: fusion, rerank and abstention are Task 8's, and they call only the `DocStore` methods below. Refresh, the only writer of chunks, is Task 9's. Opening the store from the service's configured connection string is Task 10's `open_session`, which calls `open_postgres_store(database_url, dimensions)` exactly as declared here.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/store.py` (new)
- `docs-retrieval-service/tests/test_store_statements.py` (new) — no container needed.
- `docs-retrieval-service/tests/test_store_postgres.py` (new) — marked `container`.

**Work:**

- [ ] **Constants, records and the protocol.**
  - The constants `CHUNKS_TABLE`, `BM25_INDEX`, `BM25_INDEX_DEFINITION`, `BM25_ORDER_CLAUSE`, `CHUNK_TEXT_COLUMN` and `chunk_embedding_column(dimensions: int) -> str`, composed exactly as in `store.ts`.
  - `DIMENSIONS_META_KEY = "dimensions"`, `EMBEDDER_META_KEY = "embedder"` and `DATABASE_URL_ENV = "HARNESS_DOCS_RETRIEVAL_DATABASE_URL"`.
  - Frozen dataclasses `StoredChunk(id: int, key: str, path: str, anchor: str, heading: str, body: str)` and `RankedId(id: int, rank: int)`, with `rank` 1-based within its arm.
  - `class DocStore(Protocol)`, with all methods `async`: `read_meta(key: str) -> str | None`, `write_meta(key: str, value: str) -> None`, `list_chunk_hashes() -> Mapping[str, str]`, `upsert_chunks(chunks: Sequence[DocChunk], embeddings: Sequence[Sequence[float]]) -> None`, `delete_chunks(keys: Sequence[str]) -> None`, `clear() -> None` (meta is kept), `lexical_search(query: str, limit: int) -> list[RankedId]`, `vector_search(embedding: Sequence[float], limit: int) -> list[RankedId]`, `get_chunks(ids: Sequence[int]) -> list[StoredChunk]` (in the given order, unknown ids skipped) and `close() -> None`.
  - Carry `store.ts`'s interface comments across, including that `lexical_search` may return non-matching rows at score `0` when the planner seq-scans.
- [ ] **`async open_postgres_store(database_url: str, dimensions: int) -> DocStore`.** It refuses a non-positive or non-integer `dimensions` as a programming error. It connects with `autocommit=True` and `cursor_factory=psycopg.AsyncRawCursor`. A connection failure raises `ServiceError` naming `DATABASE_URL_ENV` and the driver's message, never the connection string, which may carry a password. Then it runs `openPgliteStore`'s sequence in order: both `CREATE EXTENSION IF NOT EXISTS` statements; `CREATE TABLE IF NOT EXISTS meta …`; when the stored `dimensions` meta differs from `str(dimensions)`, `DROP TABLE IF EXISTS chunks` and `DELETE FROM meta WHERE key = $1` for the embedder record; the `chunks` `CREATE TABLE` with the same columns; `chunks_hnsw` `USING hnsw (embedding vector_cosine_ops)`; the BM25 index from `BM25_INDEX_DEFINITION`; and writing `dimensions`. Keep every statement in one module-level function `statements(dimensions: int) -> Mapping[str, str]` that the methods read, so the test reads the very strings the store issues.
- [ ] **The methods, statement for statement:**
  - `upsert_chunks` runs inside one `async with conn.transaction()`. It refuses a length mismatch, and an embedding whose width differs from `dimensions`, as a programming error. Each embedding is bound as the pgvector text literal `[v1,v2,…]`, numerically equal to `vectorLiteral`'s output, and cast with `$8::vector`.
  - `delete_chunks` returns early on an empty list and otherwise binds `ANY($1::text[])`.
  - `lexical_search` returns `[]` for a query whose `js_trim` is empty.
  - `vector_search` and `get_chunks` (`ANY($1::int[])`) follow the TypeScript ordering and skipping exactly.
- [ ] `test_store_statements.py`, which needs no container, opens with the module's rule. It asserts:
  - each exported constant, and `chunk_embedding_column(384)`, equals `run_bridge("constants")["store"]`'s value;
  - `statements(384)`'s lexical-arm statement contains `ORDER BY ` + `BM25_ORDER_CLAUSE`, and its vector-arm statement contains `ORDER BY embedding <=> $1::vector LIMIT $2`. That second string is not exported by `store.ts`, so the test also asserts it appears verbatim in `cli/src/retrieval/store.ts`'s source. It is a source guard used as a last resort, with the reason in the test header, per `.claude/context/conventions.md` → `## The testing bar`;
  - no value of `statements(384)` contains `%s` or `%(`.
- [ ] `test_store_postgres.py`, marked `container`, takes `fresh_database_url`. Over three chunks from `chunk_markdown` and `hash-v1` stub embeddings it asserts:
  - an open followed by an upsert lists the right hashes;
  - a lexical search for a word only one chunk holds ranks that chunk first;
  - a vector search with a chunk's own vector ranks it first;
  - `get_chunks([b, missing, a])` returns `[b, a]`;
  - a query of `'); DROP TABLE chunks; --` returns without error and leaves the table intact;
  - `delete_chunks` and `clear` behave as specified, with `clear` keeping meta;
  - reopening at a different width drops the chunks and the embedder meta;
  - `close` releases the connection.

**Verification:**

- `tests/test_store_statements.py` and `tests/test_store_postgres.py` pass (subject to the story index's test-run note). The second skips loudly with the reason from `tests/conftest.py` wherever `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` is unset, and Task 15's `container-test` runs it.
- `store.py`'s docstring carries the `Departures from store.ts:` paragraph, listing every statement that did not carry over verbatim with its reason, or the `none` line.
- `grep -n 'f"\|\.format(' docs-retrieval-service/src/harness_docs_retrieval/store.py` shows interpolation only of the module's own constants and the checked `dimensions`.

**Deviations from plan:**

- Deferred to the Run gates phase: `tests/test_store_statements.py`, `tests/test_store_postgres.py`, Python lint and Python type-check were not run. No conventions document states a single-file Python command (story index `## Context`, the test-run note). Evidence downgrade: the statement-for-statement claim rests on an executed scratch probe (`harness-runs/scratch/store_statements_probe.py`, run through `scripts/scratch-run.sh`). It extracted all 16 SQL strings from `store.ts`, substituted the spliced constants, and found each one verbatim among `statements(384)`'s 16 values, with no extras. The psycopg API use (`AsyncRawCursor`, how a parameterless multi-statement `execute` behaves, list-to-array binding) rests on reading only.
- The `f"` grep also lists three `ValueError` messages and the `ServiceError` message. These interpolate counts, a chunk key, the rejected `dimensions` and the driver's redacted message. None of them reaches SQL.
- The connection-failure `ServiceError` replaces any occurrence of the connection string in the driver's message with `<connection string>`, because libpq quotes a malformed conninfo back whole. `test_store_statements.py` also covers the refusals that need no database: a bad width, a refused port and a malformed string.
- `Departures from store.ts:` lists four items rather than `none`. No SQL statement departs. The items are the server-side extension loading, the absent `dataDir`, the `repr` vector-literal text and `ValueError` standing in for `internal(…)`.
