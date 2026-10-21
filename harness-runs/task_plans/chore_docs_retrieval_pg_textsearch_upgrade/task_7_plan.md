### Task 7 — Port the old-index handling to the Python store and open the 1.3.1-built database with it

**Goal:** `open_postgres_store` issues the same old-index handling `openPgliteStore` issues, character for character. That is the parity rule of `docs-retrieval-service/src/harness_docs_retrieval/store.py`'s header: *"Every statement is `store.ts`'s, character for character"*. Pin it in two ways: against the running TypeScript through the bridge, and against the 1.5.1 compose Postgres. Then open the database that Task 6 left, which the 1.3.1 server built, with the Python store. Record what happens, and drop the database.

**Depends on:**

- **Task 4**, which exported the handling from `cli/src/retrieval/store.ts`. On the expected branch these are `STALE_EXTENSIONS_QUERY`, the `SELECT` listing the store's extensions whose `extversion` differs from `default_version`, and `EXTENSION_UPDATE_STATEMENTS`, a frozen record from `vector` and `pg_textsearch` to each one's `ALTER EXTENSION <name> UPDATE`. `openPgliteStore` issues the update of each listed extension right after `CREATE EXTENSION IF NOT EXISTS …`, and nothing when none is listed. If Task 4 took the rebuild or the refusal branch, `openPgliteStore`'s doc comment lists the names it exported, and this task ports exactly those.
- **Task 6**, which rebuilt the default compose project on `pg_textsearch` `v1.5.1`. It left the database `pg_textsearch_upgrade_old`, built by the 1.3.1 server with segments and memtable rows, untouched since the rebuild, and recorded its pre-open readings in `docs-retrieval-service/README.md` → `## The seam, as found`, item 4.

**Where this task stops.** It ports and pins the handling, and records the Python half of goal 2. No `REINDEX`, spill or other end-state change goes into `docs-retrieval-service/src/`. `docs/retrieval.md` is **Task 12's**, and Task 12 reads this task's README sentence.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/store.py`
- `docs-retrieval-service/tests/ts_bridge.mjs`: the `constants` command gains the new exports.
- `docs-retrieval-service/tests/test_store_statements.py`
- `docs-retrieval-service/tests/test_store_postgres.py`
- `docs-retrieval-service/README.md` → `## The seam, as found`, item 4 (one sentence appended after Task 6's)

**Work:**

- [ ] **`store.py`.**
  - Add `STALE_EXTENSIONS_QUERY` and `EXTENSION_UPDATE_STATEMENTS`, equal to `store.ts`'s, carried in `statements()` the way every other statement is.
  - In `open_postgres_store`, issue each listed extension's update right after `sql["create_extensions"]`, inside the existing `try`, so that a failure maps onto the same `ServiceError`.
  - Amend the header's spliced-token sentence exactly as Task 4 amended `store.ts`'s.
  - Add no entry to `Departures from store.ts:`, because this is not a departure.
- [ ] **`ts_bridge.mjs` and `test_store_statements.py`.** Add the two new exports to the bridge's `constants` → `store` object. Extend `test_constants_match_typescript` to assert `STALE_EXTENSIONS_QUERY` and `EXTENSION_UPDATE_STATEMENTS` equal the TypeScript values, and add a `%s` / `%(` check that covers them, as the existing statements have.
- [ ] **`test_store_postgres.py`**: one `container` case on a `fresh_database_url` database. After `open_postgres_store`, `pg_extension.extversion` equals `pg_available_extensions.default_version` for both extensions, and `SHOW pg_textsearch.library_version` equals `pg_textsearch`'s `extversion`. A second open leaves both unchanged. No version literal is asserted. No old-catalog case is possible here: the `v1.5.1` build installs `pg_textsearch--1.5.1.sql` as its only install script, so this server cannot create a 1.3.1 catalog. Say that in the case's docstring, and point to the README sentence for the measured old-database outcome.
- [ ] **Open the old database with the Python store**, through the Python package's own index sub-command against `HARNESS_DOCS_RETRIEVAL_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/pg_textsearch_upgrade_old` with `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, via `bash scripts/python-service.sh run …`. Before it, confirm with `psql` that the database's `pg_textsearch` `extversion` still reads `1.3.1`. If it does not, the database is no longer the 1.3.1 state, and the task records that and does not claim the outcome. Then record:
  - the index command's result or exact error;
  - both `extversion`s after it;
  - `bm25_summarize_index('chunks_bm25')`;
  - the same hand-run lexical statement Task 6 ran, and its result.

  Append one sentence to README item 4 after Task 6's, with the date: what `open_postgres_store` did to that database. Then drop `pg_textsearch_upgrade_old`.
- [ ] **Run the two edited test files**, each as one plain foreground command from the repository root, after `npm run build` (the bridge runs `cli/dist`):
  - `bash scripts/python-service.sh test tests/test_store_statements.py`;
  - `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/docs_retrieval bash scripts/python-service.sh test tests/test_store_postgres.py`, against the rebuilt default project.

**Verification:**

- Both test files pass. `test_store_postgres.py`'s new case runs against the 1.5.1 server rather than skipping: the `-rs` summary shows no skip for it.
- The Python lint and typecheck are not run by this task: they run at the Run gates phase as gates 13a and 13b (`scripts/run-gates.sh`), which the test-run rule bars a unit from running.
- `git grep -n "REINDEX\|bm25_spill_index" -- docs-retrieval-service/src` gains no hit.
- README item 4 carries Task 6's pre-open sentence and this task's post-open sentence, each with its date and statements. `pg_textsearch_upgrade_old` no longer exists (`psql -l`).

**Deviations from plan:**

- **`EXTENSION_UPDATE_STATEMENTS` in `statements()`.** `statements()` is a flat `str` → `str` map, so the record is carried as one key per extension, `update_extension_<extname>`, built from the module-level `EXTENSION_UPDATE_STATEMENTS` (a `MappingProxyType`, the frozen record), beside `stale_extensions`. `open_postgres_store` reads both from `sql`. The `%s` / `%(` check is a new case, `test_the_extension_statements_carry_no_psycopg_placeholder`, which also asserts each statement is one `statements()` carries.
- **No `psql` on the host.** Every `psql` reading ran as `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d pg_textsearch_upgrade_old -At -c …`.
- **Before the open (2026-10-21):** `pg_textsearch` `1.3.1` / `default_version` `1.5.1`, `vector` `0.8.1` / `0.8.7`; `SHOW pg_textsearch.library_version` = `1.5.1`; `count(*)` = `825`; `bm25_summarize_index('chunks_bm25')`: `total_docs: 825`, `docs_persisted: 825`, memtable `terms: 0`, `documents: 0`, four L0 segments (`docs=57`, `373`, `163`, `232`; 233 pages, 24837 terms), `on-disk: 3612672 bytes` — identical to Task 6's post-rebuild reading. The database was still the 1.3.1 state.
- **The open:** `HARNESS_DOCS_RETRIEVAL_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/pg_textsearch_upgrade_old AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1 bash scripts/python-service.sh run index --repo .. --docs-root docs` (the `--docs-root docs` Task 6 built it with) printed `index: 71 files, 825 chunks; embedded 0, unchanged 825, deleted 0`, exit 0.
- **After it:** `pg_textsearch` `1.5.1` / `1.5.1`, `vector` `0.8.7` / `0.8.7`; `count(*)` = `825`; `bm25_summarize_index` unchanged from the pre-open reading (same four segments, empty memtable, `on-disk: 3612672 bytes`); `SELECT id FROM chunks ORDER BY text <@> to_bm25query('harness', 'chunks_bm25') LIMIT 50` returned 50 rows, first ids `166, 339, 337, 178, 183` (as Task 6's), no error; `EXPLAIN`: `Index Scan using chunks_bm25 on chunks`. `docker logs --since 10m` matched no `error|warn|fatal|textsearch` line.
- **`pg_textsearch_upgrade_old` NOT dropped.** `docker exec harness-docs-retrieval-postgres-1 psql -U harness -d postgres -c "DROP DATABASE pg_textsearch_upgrade_old"` was refused by the session's auto-mode classifier (`Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Cloud Storage Mass Delete]`). Not routed around. The verification bullet "`pg_textsearch_upgrade_old` no longer exists" is unmet; the operator runs that one command.
- **Python lint and typecheck** not run by this unit: deferred to the Run gates phase (gates 13a / 13b), as the plan states.
