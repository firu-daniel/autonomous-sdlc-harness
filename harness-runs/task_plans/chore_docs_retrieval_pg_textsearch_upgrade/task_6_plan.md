### Task 6 — Move the compose image to `pg_textsearch` `v1.5.1` and record what it does to a database 1.3.1 built

**Goal:** Build the compose Postgres's `pg_textsearch` from the upstream tag `v1.5.1`, update both records of why that tag was chosen, and show that the rebuilt server reports `pg_textsearch.library_version` `1.5.1` and installs `1.5.1`. Before rebuilding, leave a database that the **1.3.1** server built. Afterwards, record what the 1.5.1 server does with that database before any store opens it. Task 7 then opens it with the Python store.

**Depends on:** Task 3, which moved PGlite to `pg_textsearch` 1.5.1. The compose engine follows it here, so that both engines carry the same `pg_textsearch` version from this commit on. (Task 4 changed only the TypeScript store, and this task does not depend on it.)

**Where this task stops.**

- The Python store's handling of the old database is **Task 7's**. This task leaves the database untouched after the rebuild: no `ALTER EXTENSION`, no store open, no refresh. Task 7 opens it, records the outcome, and drops it.
- The image's base, `pgvector/pgvector:0.8.1-pg18`, **stays**. The story index's `## Context` records that decision. This task records the divergence it leaves (PGlite now bundles `vector` 0.8.7) and changes nothing about it.
- `docs/retrieval.md` is Task 12's.

### Targets

- `docs-retrieval-service/postgres/Dockerfile`: `ARG PG_TEXTSEARCH_TAG`, and the header's records 1 and 2.
- `docs-retrieval-service/README.md` → `## The seam, as found`, item 4, **Extension and server versions.**

**Work:**

- [ ] **On the 1.3.1 server, before any edit, leave an old database.** Confirm that the running default project reads `1.3.1` with `docker compose -f docs-retrieval-service/compose.yaml exec -T postgres psql -U harness -d docs_retrieval -c "SHOW pg_textsearch.library_version"`. If it does not, stop and report: this database must be 1.3.1-built. Then:
  - Create the database `pg_textsearch_upgrade_old` (`CREATE DATABASE` through the same `psql`).
  - Index this repository's documentation into it with the Python package's own index sub-command, with `HARNESS_DOCS_RETRIEVAL_DATABASE_URL=postgresql://harness:harness@127.0.0.1:5432/pg_textsearch_upgrade_old` and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, so no weights are loaded. Take the sub-command and its flags from `bash scripts/python-service.sh run --help`, and run it through `bash scripts/python-service.sh run …`.
  - Record that database's `extversion` for both extensions, `SELECT count(*) FROM chunks` and `bm25_summarize_index('chunks_bm25')`. Its segments and memtable are what the upgrade has to carry.
- [ ] **`Dockerfile`.**
  - Set `ARG PG_TEXTSEARCH_TAG=v1.5.1`.
  - Rewrite **record 1**. It now says that `@electric-sql/pglite-pg_textsearch` 0.0.12's bundled `pg_textsearch.control` reads `default_version = '1.5.1'` (verify it from `node_modules/@electric-sql/pglite-pg_textsearch/dist/pg_textsearch.tar.gz`, read without extracting into the tree), that the tag was chosen to match it, and that the tag is now verified against the upstream repository because this image's build downloads it.
  - Rewrite **record 2**. It now says that `@electric-sql/pglite-pgvector` 0.0.11 bundles `vector` `0.8.7` (verify it the same way), while this image's base stays `pgvector/pgvector:0.8.1-pg18`, so the two engines' `vector` versions now differ. It states that the base image was deliberately left unchanged on this branch, and drops the claim that the two match.
  - Record 3 is unchanged.
- [ ] **Rebuild and restart the default project**, each as one plain command from the repository root: `docker compose -f docs-retrieval-service/compose.yaml build postgres`, then `docker compose -f docs-retrieval-service/compose.yaml up -d --wait postgres`. A plain `up` would reuse the stale image, which is why the build comes first. Confirm `pg_textsearch_upgrade_old` survived the container's recreation (`psql -l`). **If it did not survive, stop and report**, and do not improvise a 1.3.1 build to recreate it. Then read:
  - `SELECT version()`, and `SHOW pg_textsearch.library_version`, which must read `1.5.1`;
  - in a new scratch database, `CREATE EXTENSION pg_textsearch`, then its `extversion`, which must read `1.5.1`. Drop that scratch database afterwards.
  - on `pg_textsearch_upgrade_old`, untouched: both extensions' `extversion` against `pg_available_extensions.default_version`, `bm25_summarize_index('chunks_bm25')`, and the store's lexical statement run once by hand: `SELECT id FROM chunks ORDER BY text <@> to_bm25query('<a word the corpus carries>', 'chunks_bm25') LIMIT 50`. Record its result or its exact error.
- [ ] **README item 4.**
  - Replace the `pg_textsearch` sentences: the image builds the upstream tag `v1.5.1`, chosen to match PGlite's bundled `default_version`, and verified by the build that downloads it.
  - Replace the `pgvector` clause with the divergence: `0.8.1` here, `0.8.7` in PGlite 0.5.10's `pglite-pgvector` 0.0.11.
  - Add one sentence, with the date and the statements, stating what the 1.5.1 server does with a database the 1.3.1 server built before any store opens it: the `extversion`s it reports and what the lexical statement returned. The same item cites `postgres/Dockerfile` records 1 and 2 rather than restating them.

**Verification:**

- `SHOW pg_textsearch.library_version` reads `1.5.1` on the rebuilt default project, and a new database's `CREATE EXTENSION pg_textsearch` installs `1.5.1`.
- `pg_textsearch_upgrade_old` still exists after the rebuild, and no statement but the read-only ones above has touched it. It is left for Task 7.
- `git grep -n "v1.3.1" -- docs-retrieval-service` has no hit. `git grep -n "0.8.1" -- docs-retrieval-service` hits only the base-image line, `ARG PGVECTOR_IMAGE=pgvector/pgvector:0.8.1-pg18`, and the record-2 and item-4 sentences that state the divergence.
- `docker compose -f docs-retrieval-service/compose.yaml config` parses (`compose.yaml` itself is unchanged).
