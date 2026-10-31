# Review — 03-sources-database-security.md
verdict: FAIL

Checked on 2026-10-28. Repository: 30 citations checked against source. Web: 26 claims checked with WebFetch, WebSearch and `gh api`. Line numbers below are the reviewed file's. Framing: the file treats the stack as not locked (engines table, pluggable `DocStore`, three backends) and keeps models local by default with hosted APIs as an opt-in (l.63-71, l.277-284). Both maintainer framing points are met, and no finding below is about framing.

## Must Fix

1. **The scale cost is mislabelled and understated, and the repository already measures what the file calls unconfirmed.** The file says "~17 CPU-hours at 10⁶ chunks" (l.283), labels 62.51 ms/chunk as "Embedding" (l.230), calls the Python rate **Unconfirmed** (l.230, Open question 7), and says the scale figures are "extrapolated from a 177-chunk measurement" (l.325). The sources say otherwise:
   - `docs/retrieval-eval-results.md:26370`: 62.51 ms is the whole `refreshIndex` phase (read, chunk, embed, insert, `REINDEX`), not embedding alone.
   - `:26429-26505`: the 1,960-chunk real-catalog build ran on a MacBook Air M4, with "CPU sat at 452–459%" and "~4.5-core load". It measured 60.87 ms/chunk total wall time and 55.1 ms/chunk like-for-like refresh, which confirms the 177-chunk rate at 11× the size.
   - `:28156-28171`: the Python backend indexed 331 chunks cold in `real 21.48`, `user 34.80`, `sys 5.50`, model load included. That is about 65 ms/chunk wall and about 120 ms/chunk CPU.

   So 10⁶ chunks is about 17 **wall**-hours on a 10-core laptop running about 4.5 cores. That is roughly 75–80 CPU-hours for TypeScript and roughly 34 CPU-hours for Python fp32, not 17 CPU-hours. Change:
   - say "~17–18 h wall on a 10-core laptop (multi-threaded ONNX), single process" at l.230 and l.283;
   - relabel the row "Cold refresh (embed-dominated)";
   - cite `:28156-28171` for Python and drop Open question 7's first half;
   - restate the verdict's confidence sentence as "extrapolated linearly from 177- and 1,960-chunk TypeScript builds and a 331-chunk Python build";
   - add the measured index size as well: 37.9 kB/chunk at 1,960 chunks, fit "~40.1 MB fixed + ~17.4 kB per chunk" (`:26484-26490`, PGlite). It is the only measured storage figure, and §6 omits it.

## Should Fix

1. **Aurora and Supabase can be settled as "No".** Both are marked **Unconfirmed** (l.40-41, l.47, Open question 1, verdict).
   - **Aurora:** AWS's Aurora extension tables for Aurora PostgreSQL 12–18 list none of `pg_textsearch`, `pg_search`, `vchord` or `vchord_bm25`. pgvector is 0.8.2 on 18.6/18.4 (https://docs.aws.amazon.com/AmazonRDS/latest/AuroraPostgreSQLReleaseNotes/AuroraPostgreSQL.Extensions.html).
   - **Supabase:** its image source lists no BM25 extension. `gh api 'repos/supabase/postgres/contents/nix/ext?ref=develop'` returns `pgvector.nix`, `pgroonga`, `rum.nix`, `timescaledb.nix` and others, with no `pg_textsearch`, `pg_search` or `vchord*`. The docs page the file cites lists no extensions at all, so it is not evidence for the row's "vector: Yes (widely documented)". Cite the `pgvector.nix` entry instead.
   - **Crunchy Bridge:** still unconfirmed. `docs.crunchybridge.com/extensions-and-languages/extensions` returns 404 and searches found nothing. Keep it **Unconfirmed**.

   Change: mark Aurora and Supabase **No** (documented by absence, with the sources above), and narrow Open question 1 and the verdict's "medium on Supabase, Crunchy Bridge and Aurora" to Crunchy Bridge only.

2. **HorizonDB is Documented, not a search summary.** l.37 says "Search summary only … **Unconfirmed**". The page itself (ms.date 2026-07-07) says "`pg_textsearch` is in **preview**". Setup is a parameter group with `shared_preload_libraries` and `azure.extensions` including `pg_textsearch`, and it "composes with `pgvector` and DiskANN". Change: mark the row Documented and Preview, with `vector` Yes. Add HorizonDB to the "Preview" list at l.47, l.308 and l.325.

3. **Tiger Cloud's version is stated by its own page.** l.34 says "Version run there: **Unconfirmed**". The cited page says "pg_textsearch v1.1.0 is production-ready on Tiger Cloud". Change: record v1.1.0 (the page may lag). Note that the shipped code and its score-determinism measurements were taken on 1.5.1 (`postgres/Dockerfile:31`, `docs/retrieval.md:17`), so behaviour on 1.1.0 needs a test. Add this to Open question 1.

4. **libpq version in the wheel is answerable.** l.91 and Open question 8 say the bundled libpq is **Unconfirmed**. `uv.lock:1167-1186` pins `psycopg`/`psycopg-binary` 3.3.6. Psycopg's news says 3.2.3 ships "PostgreSQL 17 libpq" and 3.2.4 "Bump libpq to 17.2 in Linux and macOS binary packages … 16.4 in Windows" (https://www.psycopg.org/psycopg3/docs/news.html). `sslrootcert=system` arrived in libpq 16 ("This is enabled with `sslrootcert=system`, which also enables `sslmode=verify-full`", https://www.postgresql.org/docs/16/release-16.html). So `system` works with the locked wheel on every platform. Change:
   - say so;
   - recommend raising `pyproject.toml:11`'s floor from `>=3.2` to `>=3.2.4`;
   - note that libpq 18's OAuth (l.105) is not in the binary wheel, so it would need a system libpq;
   - note that the PgBouncer prepared-statement path (libpq 17+) holds on Linux/macOS only.

5. **REINDEX privilege is answerable.** l.126 marks `MAINTAIN` **Unconfirmed**. PG 18 `REINDEX` reference: "Reindexing a single index or table requires having the `MAINTAIN` privilege on the table" (https://www.postgresql.org/docs/18/sql-reindex.html). Change: mark it Documented. Note that the indexer still needs ownership for the DDL at l.24, but a scheduled-REINDEX job could run with `GRANT MAINTAIN` alone.

6. **The `/health` finding misstates the leak and the fix.** l.97 says a libpq error "could echo host or user details" and should go "through the same redaction". `session.probe()` runs `read_meta` on the already-open connection (`service.py:151-155`). It never connects, so the URL never appears in its errors, and the connect-time redaction (`store.py:376-381`, a URL substitution) would change nothing. What `str(error)` adds is libpq's full multi-line text (DETAIL, HINT, `LINE` pointers, a lost connection's tail). `/search` already reduces this with `driver_message` (`service.py:244`, `store.py:411-424`), so the two endpoints are inconsistent. Change: reword the finding to "unreduced driver text, unlike `/search`", and make the fix "use `driver_message`, or a fixed string, in `/health`". Keep the code citation `http_app.py:103-106`, which is accurate.

7. **Loopback bind is not secure by default for the HTTP app, and the proposal treats it as if it were.** l.216 records the missing `Origin` check, but "Secure defaults" (l.288) and `serve:` (l.271-274) rely on loopback plus an API key only off-loopback. `/search` parses the body with `await request.json()` (`http_app.py:60`), and Starlette does not check the content type. A cross-site `text/plain` POST from any web page therefore reaches `127.0.0.1:8080/search` without a CORS preflight. Each call runs a full refresh and possibly a `REINDEX` (`service.py:241`, `refresh.py:98-100`), so a drive-by page can force writes and lock the index. DNS rebinding also lets a page read the results. The MCP spec's reason for its `Origin` MUST is exactly this ("attackers could use DNS rebinding to interact with local MCP servers", https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http). Change: add "validate `Host` and `Origin` and require `Content-Type: application/json`, on loopback too" to Secure defaults and to the `serve:` block.

8. **The RLS quotation is not verbatim.** l.139 quotes "Corpus statistics include rows hidden by RLS, so users may infer some frequency information". The README (`gh api repos/timescale/pg_textsearch/contents/README.md`, `## Limitations` → `### Row-Level Security`) reads: "BM25 corpus statistics include all indexed rows, including rows hidden by RLS. A user who already knows a term can infer frequency information affected by inaccessible rows, though the index does not reveal unknown terms." `allow_rls` defaulting to `on` is correct (`superuser-only`). Change: quote the actual text. Its last clause (no unknown terms are revealed) also belongs in the risk statement.

9. **REINDEX-policy option 4 omits a hard dependency.** l.241 offers "relying on `pg_textsearch` background compaction (v1.5.0, beta)". The README says managed background mode "uses pg_durable 0.2.8 or newer … pg_durable must be preloaded, initialized in the current database, and granted to the index owner". The v1.5.0 notes say "beta support … through pg_durable". None of the managed offerings in the table is shown to carry `pg_durable`. Change: state the dependency. Note that the default `inline` compaction is what is actually available, and that compaction is not equivalent to the `REINDEX` end state the determinism test pins.

10. **VectorChord-bm25's licence rests on a secondary source although the primary one is readable.** l.55 says "AGPL-3.0 (secondary: pigsty …; **Unconfirmed** upstream)". The upstream `LICENSE` (`gh api repos/tensorchord/VectorChord-bm25/contents/LICENSE`) is a "Dual License Notice: … AGPLv3 … Elastic License v2 (ELv2)". Change: cite upstream and write "AGPL-3.0 or ELv2".

11. **Airbyte's licence can be confirmed.** l.167 marks it **Unconfirmed** (search summary). The repository `LICENSE` is "Elastic License 2.0 (ELv2)". Each docs-relevant connector's `metadata.yaml` carries `license: ELv2`: `source-confluence`, `source-notion`, `source-google-drive`, `source-s3`, `source-file`, `source-gcs`, `source-azure-blob-storage`, `source-github`, `source-microsoft-sharepoint` and `source-microsoft-onedrive` (`gh api repos/airbytehq/airbyte/contents/airbyte-integrations/connectors/<name>/metadata.yaml`). Change: mark it Documented, ELv2. Note that ELv2 allows a user running their own sync but forbids offering it "as a hosted or managed service", which bears on any hosted mode of the product.

12. **The embedded-engine survey misses DuckDB and a LanceDB caveat.** The verdict picks the embedded default from LanceDB or SQLite FTS5 + sqlite-vec.
    - **DuckDB:** its FTS extension implements Okapi BM25 (`match_bm25`, k 1.2, b 0.75). "By default, the FTS index will not update automatically", and an `incremental = 1` trigger mode is the alternative (https://duckdb.org/docs/2.0/core_extensions/full_text_search.html). It is in-process and MIT, with the `vss` extension for HNSW.
    - **LanceDB:** per the page the file cites, new rows "aren't indexed until you call `table.optimize()`", and unindexed fragments fall back to a flat scan. That bears directly on incremental refresh.

    Change: add a DuckDB row. Add LanceDB's optimize requirement and DuckDB's rebuild/incremental mode to the Note column, and to Open question 9.

13. **A full-BM25 option on any Postgres is not considered.** The file offers only `pg_textsearch` or `ts_rank` without IDF (l.56, l.61, l.264). BM25 over plain `tsvector` with corpus statistics kept in ordinary tables (document frequency per lexeme, average length) needs no extension and runs on RDS, Azure Flexible, Neon and the rest. It costs write-time maintenance and query-time SQL. It is the option that would let "bring any Postgres" keep real BM25. Change: add it to the engines table as **Inference**, with its cost, and add it as an eval candidate beside Open question 4.

14. **The minimal-setup proposal has five coherence gaps.**
    - (a) `tls.ca_bundle` covers HTTPS only. There is no key for a Postgres private CA (`sslrootcert`), and none for the "explicit, noisy override" that l.299 refuses by default.
    - (b) l.282 and l.306 require the egress opt-in to be "named … in the config", but no field does that; choosing `api:*` is the only signal. Add, for example, `models.egress: allow`.
    - (c) `lexical: auto` (l.264) silently degrades ranking on most managed Postgres. That runs against the file's own "declared degraded mode" (l.61). Make it `pg_textsearch | builtin`, with `auto` refusing to start rather than warning.
    - (d) The proposal splits `index` from `serve`, but it never says when indexing runs in the default embedded/stdio flow: on `serve` start, through a watcher, or by hand. Without that, "plug it in, then invoke it" is unspecified.
    - (e) `iam:` offers only `gcp-proxy`, though l.102-107 show that AWS and Azure need a token minted at each connect.

    Change: fill these in. Also show the actual minimal file, `source: { path: ./docs }`, with every other key defaulted, so "minimal" is visible.

15. **The length is over the brief.** `wc -w` gives 4,943 words against "about 2 000 – 4 000". Change: cut about 900 words. The Node/Python TLS bullets (l.194-197) and the multi-tenancy table can be shortened most safely.

16. **A citation is broken and a statement kind is non-standard.**
    - l.220 cites "`docs/retrieval.md:29` → **Models.**". Line 29 is **Abstention.**, and **Models.** is l.31.
    - l.216 ends with "**Verified.**", which is not one of the brief's three kinds. Use Documented.

## Nice to Have

1. l.150: the same lexical-only check also lets a symlinked `layers[].conventions` file escape. `inside_repo` is lexical (`corpus.py:125`), then `os.path.isfile` follows the link (`corpus.py:127`). Name both routes when proposing real-path resolution.
2. l.166: Onyx's permission sync, which pulls "metadata, permissions", sits under the `ee` directories, which carry the Onyx Enterprise License, not MIT (`gh api repos/onyx-dot-app/onyx/contents/LICENSE`). Qualify "MIT Community Edition" for the permissions part. The 61 connector directories are confirmed.
3. l.56: the Azure HorizonDB page states the IDF point directly ("`ts_rank` - no term saturation, no length normalization, no native IDF"). It is a plainer citation than the normalisation sentence from the PG docs.
4. Postgres fallback mode: managed `vector` is 0.8.2 on RDS, Aurora and Azure Flexible, against the 0.8.7 the image ships. Note that nothing in the store should depend on 0.8.3–0.8.7, or test it.
5. `pg_textsearch` is also packaged by EDB for EPAS/PGE/PostgreSQL 17–18 on self-managed Linux (https://www.enterprisedb.com/docs/pg_extensions/pg_textsearch/compatibility). Its hosted-cloud availability is unstated. It is worth a line under "self-hosted" routes.

Checked and correct:
- Code and docs: `store.py:89-102`, `:156-160`, `:206-254`, `:291-310`, `:373-381`, `:385-397`; `corpus.py:39-52`, `:69-76`, `:137-143`; `http_app.py:57-113`; `cli.py:53`; `Dockerfile:46`; `compose.yaml:15`, `:17`, `:37-38`; `postgres/Dockerfile:20-24`, `:26-49`; README `:144-153`; `docs/retrieval.md:15`, `:17`, `:229`, `:235`, `:250`; `wire.py:28-34`; `service.py:232-241`; `refresh.py:77-100`; the neither-control-file-trusted claim (`gh api` on both control files).
- Web: the absences on RDS, Azure Flexible, DigitalOcean and Neon (retired 2026-09-21, replaced by `lakebase_text`); AlloyDB (Preview, PG 17/18, `alloydbsuperuser`); Cloud SQL (Preview, PG 17+, 2026-09-19); the libpq `prefer` default and `sslrootcert=system` semantics; `CREATE EXTENSION` privilege text; psycopg PgBouncer conditions; Cloud SQL connectors (pg8000/asyncpg only); both MCP 2026-07-28 quotes; the Tiger Data benchmark figures; bge-m3; licences for ParadeDB (AGPL-3.0), LanceDB (Apache-2.0), sqlite-vec (Apache-2.0/MIT), R2R (MIT, pushed 2025-11-07), Docling, MarkItDown (MIT) and pandoc (GPL-2.0).

The fork verdict's direction (a pluggable store, an embedded default, Postgres optional, local models by default, own local and git sources, decoupled ingest) is supported by the evidence and survives these findings. Must Fix 1 changes the cost figures and the confidence sentence, not the recommendation.

## Re-review
verdict: PASS

Re-checked on 2026-10-28 against the revised file, which now ends with `## Review response`, and against the new `_brief.md` rulings (`_brief.md:16`: being a late entrant is fine; one engine serves both a local embedded store and a remote Postgres). Line numbers below are the revised file's.

**Resolved.** Must Fix 1, Should Fix 1–16 and Nice to Have 1–5 are all addressed as the response says. Spot-checks:
- **Scale figures (l.206-208) recomputed:**
  - TypeScript: 62.51 ms × 10⁶ = 17.4 h wall; 60.87 ms × ~4.5 cores ≈ 77 CPU-hours, against the stated "~75–80".
  - Python: 21.48 s / 331 = 64.9 ms/chunk, so 18.0 h wall; (34.80 + 5.50) s / 331 = 122 ms/chunk CPU, so 33.8 CPU-hours, against the stated "~34".
  - Citations `:26438-26478`, `:26484-26490` and `:28156-28171` match the source.
- **The ~17 GB index figure is arithmetically right.** It uses the marginal fit: 40.1 MB + 17.4 kB × 10⁶ = 17.44 GB. It does not use the 37.9 kB/chunk average, which would give ~38 GB. That is the correct choice. It is a two-point PGlite fit extrapolated about 500× past its largest anchor, and the column header labels it "Inference, linear". That labelling is adequate.
- **"BM25 on plain `tsvector` with table-kept statistics" is honestly labelled.** It reads "Yes (**Inference**)" and "Untested" (l.58), "the candidate to evaluate" (l.300), "Low on table-kept BM25 quality until it is measured" (l.307), and it is Open question 4.
- **Other fixes:**
  - The RLS quotation is now verbatim (l.131).
  - `/health` is reworded correctly (l.94).
  - The loopback CSRF/rebinding risk is stated as Inference (l.192).
  - `pg_durable` is added (l.220).
  - The Aurora, Supabase, HorizonDB and Tiger Cloud rows match their sources (l.34-45).
  - The **Models.** citation is now `:31`, and no "Verified" label remains.
- **Length:** `wc -w` gives 3,864, under 4,000.
- **Framing:** the verdict now follows the "one engine, local and remote" ruling, and makes no late-entrant point.

## Still open

### Should Fix

1. **The default "embedded" store is not concrete for the product it describes, and its scale is unmeasured.**
   - **The claim:** l.232 and l.240 make "an embedded store under the user data directory … (PGlite/local PG)" the one-line default. The verdict (l.300) says "embedded locally (PGlite or a local Postgres)".
   - **Why that is not concrete:** PGlite is an in-process WASM Postgres for Node. It is today's TypeScript backend (`docs/retrieval.md:11`: "PGlite, an embedded Postgres, in process"). The Python service cannot embed it in-process. A "local Postgres" is a server the user installs and runs, which is not the "no database" one-line setup.
   - **Why the scale is unmeasured:** the largest PGlite build measured is 1,960 chunks (`docs/retrieval-eval-results.md:26429`). The target is 10⁵–10⁶, and PGlite is a single connection in one process.
   - **Change:**
     - say which runtime hosts the embedded engine: a Node product with PGlite, or a Python product with a bundled or managed local Postgres;
     - mark PGlite at 10⁵–10⁶ chunks **Unconfirmed**;
     - add an open question: build time, query latency and the size fit at ≥10⁵ chunks on PGlite.

### Nice to Have

1. l.120: the `MAINTAIN` privilege exists from PostgreSQL 17. Say "PG 17+", because the scheduled-REINDEX-by-`MAINTAIN` route does not exist on PG 16 and earlier.

Open: 0 Must Fix, 1 Should Fix, 1 Nice to Have.
