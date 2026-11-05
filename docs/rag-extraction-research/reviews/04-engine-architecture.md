# Review — 04-engine-architecture.md
verdict: FAIL

Checked on 2026-10-28. Repository: 14 citations checked against source, plus `wc -l` re-runs. Web: 20 claims checked with WebFetch, WebSearch, `gh api`, `pypi.org/pypi/<pkg>/json`, `pypistats.org` and `api.npmjs.org`, and by downloading and listing two wheels (`pyright-1.1.414`, `pgembed-0.2.0` macOS arm64). Line numbers below are the reviewed file's.

## Must Fix

1. **A maintained, pip-installable embedded Postgres for Python exists, and it carries pgvector and `pg_textsearch`. This removes the premise the ranking is built on.** l.84 says Python embedded Postgres is "Unmaintained for Python. And none carries `pg_textsearch`". l.208 says "only JavaScript hosts it in process. Every maintained Python embedded option is a different engine", and calls that "the deciding fact". Both miss `pgembed`:
   - It describes itself as "Self-contained postgres server for your python applications". Version 0.2.0 shipped 2026-03-18, with wheels for manylinux and musllinux (x64 and arm64), macOS arm64 and Windows (`pypi.org/pypi/pgembed/json`).
   - Its repository is Apache-2.0, has 53 stars and was pushed 2026-10-06 (`gh api repos/Ladybug-Memory/pgembed`). It is not a GitHub fork of `pgserver`, but it carries the same summary and the same dependency set.
   - The README says: "Your users simply run `pip install yourapp`, and PostgreSQL comes bundled automatically". It lists pgvector, pgvectorscale and `pg_textsearch`.
   - Wheel listing: `bin/postgres` is PostgreSQL 17.9 (`pg_config.h`), with `vector--0.8.2.sql`, `pg_textsearch` `default_version = '0.6.1'`, `tsearch_data/` and ParadeDB's `pg_search.dylib`. The macOS arm64 wheel is 83 MB and the manylinux x86_64 wheel is 68 MB.

   Fork 05's verdict is portable `tsvector-bm25` in ordinary SQL on every Postgres (`05-managed-postgres-lexical.md` → `## Fork verdict`). Under that verdict, a Python engine on `pgembed` (embedded) and psycopg (remote) runs **one dialect and one tokenizer**. Today's `store.py` SQL would be reused on both sides. That is the property l.208 credits to TypeScript alone.

   It changes (b) on three lines:
   - l.88: the client can no longer tell the stores apart by relevance.
   - l.143: there are not "Two" dialects.
   - l.204: "a second store and a second tokenizer" no longer holds.

   It also changes the cost comparison. (c) must build a new `pg` store, pool, reconnect and TLS in Node (`README.md` → §7 steps 4–5). (b)+`pgembed` keeps the existing psycopg store and adds the embedded server lifecycle.

   Real caveats, to state rather than to use as a dismissal:
   - The package is young: 0.2.x, one organisation, 53 stars.
   - It runs PostgreSQL 17, not 18, though `tsvector` behaviour is unchanged across those majors (Unconfirmed until tested).
   - It is a child server process with a port or socket, not in-process.
   - It is cp312+ only, which uv's managed Python covers.
   - Its `pg_textsearch` is 0.6.1, far behind 1.5.1, but fork 05's default does not need it.
   - The wheel bundles ParadeDB `pg_search`, which is AGPL. A redistribution licence check is needed.

   Also note that `pgserver`, called unmaintained on l.84, still has 1.10M downloads a month (`pypistats.org/api/packages/pgserver/recent`). Python embedded Postgres is in active use.

   Change:
   - Add `pgembed` to the l.79 table.
   - Re-assess (b) as "one Python engine, Postgres both sides (`pgembed` embedded, psycopg remote)", next to the SQLite/LanceDB variant.
   - Remove or rewrite l.208's "deciding fact".
   - Re-rank §4.
   - Add `pgembed` start time, RSS and wheel size to §4's one-day experiment.

2. **The pyright precedent is misstated in the verdict, and its 40M downloads do not evidence the PyPI-only route.** l.237 says "pyright shows a TypeScript engine shipped on PyPI with a bundled Node at 40M downloads a month". l.124 is accurate, but the verdict sentence is not.
   - The `pyright` wheel (6.2 MB, `py3-none-any`) bundles pyright's JavaScript (`pyright/dist/…`, 5 418 files). It does **not** bundle Node.
   - `requires_dist` has `nodeenv` unconditionally and `nodejs-wheel-binaries` only under the `nodejs` and `all` extras.
   - `pyright/node.py` resolves Node in this order: global Node (`PYRIGHT_PYTHON_GLOBAL_NODE`, default true), then `nodejs_wheel` only if it is already installed, then `nodeenv`. `nodeenv` downloads Node from nodejs.org, which fails behind a PyPI-only mirror.
   - The PyPI package is third-party (`RobertCraigie/pyright-python`), not Microsoft's.
   - So the 40.3M a month mostly measures installs that use a system Node or download one. No source says how many use the extra.

   The exact precedent is `basedpyright`:
   - It has a hard `requires_dist` of `nodejs-wheel-binaries>=20.13.1` and 13.8M downloads a month (`pypistats.org/api/packages/basedpyright/recent`).
   - Its 1.40.2 wheel is 13.7 MB, `py3-none-any`.

   Change:
   - Fix the verdict sentence.
   - Cite `basedpyright` as the precedent for the Node-carrying wheel, and keep pyright as evidence that a TS tool can lead on PyPI. Its PyPI downloads, 40.3M, are 13× its npm downloads, 3.0M (`api.npmjs.org/downloads/point/last-month/pyright`).
   - Mark pyright-python as third-party.

3. **The ranking compares a composite TypeScript option against bare Python options. On R2.1 this re-argues the withdrawn ruling rather than weighing the Python lever evenly.**
   - Rank 1 is "(c) + (e) + (f)": the TS engine, plus the stdio/HTTP boundary, plus a second registry, plus Docker, plus a thin Python REST client.
   - (b) at rank 3 gets none of these, yet each applies to a Python engine just as well. A stdio/HTTP boundary is engine-neutral (l.119). A Docker image hides Python as well as Node (l.40). A thin TS/npm client over the same REST contract mirrors the thin Python client.
   - The one asymmetric front door is `npx` for a Python engine. Fork 02 records that MCPB favours Node because Claude Desktop ships it. That cost belongs to (b) and should be named as such.
   - Conversely, `uvx` needs only the `uv` binary, because uv downloads a managed Python (l.87). Option 1's `uvx` door needs a ~56–61 MB unofficial Node wheel (finding SF3).
   - Two of rank 3's reasons do not discriminate. "The PGlite investment lost" is a sunk cost. "The eval harness to port" also falls on (c), because the product moves the eval in any case (`README.md` → §7 step 6: "move the eval; retire parity tests").
   - l.205 says rank 4 "is option 1 anyway" because the engine ships as a binary. That holds only if the core is TS. A Python engine on `pgembed` ships through `uvx` with no Docker either.

   Change: score every option with the same edge kit (boundary, Docker, the other registry's thin client), or score them all bare. Drop the sunk-cost and shared-cost reasons. State the one real asymmetry, MCPB and Claude Desktop's bundled Node, against the one real Python advantage: Python source for RAG engineers, plus an install that needs no unofficial Node binary. Then re-rank together with Must Fix 1. A single TS engine may still come first, but the file must show it wins on that basis.

## Should Fix

1. **"About 1 330 lines" leaves out half of the TS bridge.** l.71 names `ts_bridge` among the counted files. `wc -l` gives 1 328 for `jscompat.py` (208), the seven test files and `ts_bridge.py` (74). Adding `tests/ts_bridge.mjs` (190) makes the total 1 518. Change: state 1 518 with the `.mjs`, or say that the `.mjs` is excluded. l.192 repeats the figure.

2. **The 2026-10-22 citation points at the reading's setup, not its result.** l.70 and l.159 cite `docs/retrieval-eval-results.md:27945-27950`. Those lines are the heading and the "Who reads this" paragraph. The result is at `:28065` ("**The answer: arm B agrees on every query.** All 12 queries return the same five ordered refs"). Change the citation to `:28065-28067`.

3. **Corporate review of a Node-carrying wheel: evidence exists that the file does not weigh.** l.216 and l.229 leave "scanner reaction" fully open. What was found:
   - `nodejs-wheel-binaries`' own PyPI summary reads "unoffical Node.js package". It is maintained by one individual (`gh api repos/njzjz/nodejs-wheel`: owner `njzjz`, 28 stars). A supply-chain review would ask for that provenance.
   - ReversingLabs' Spectra Assure marks several older 20.x Windows wheels as failing on vulnerabilities (https://secure.software/pypi/packages/nodejs-wheel-binaries/versions, **secondary**, not verified to CVE level).
   - OpenSearch Dashboards' bundled Node 18.6.0 drew critical-CVE reports, which AWS later ruled not applicable (https://forum.opensearch.org/t/potential-security-issues-with-the-bundled-node-js/17365, forum, **secondary**). Bundled runtimes get flagged, and teams then spend time triaging the flags.
   - No source was found showing a company refusing such a wheel. Evidence of acceptance: `basedpyright`'s 13.8M downloads a month.
   - Size: the 24.19.0 wheels are 56–61 MB per platform (`pypi.org/pypi/nodejs-wheel-binaries/json`).

   Change: put these in §1 "Procurement and security review" and in option (f). Replace "~Node-sized wheel (Unconfirmed)" at l.147 with ~60 MB plus the engine. Make "runtime pinned by a third party" an explicit (f) cost.

4. **The Python cold-start figure is attributed to `torch` alone.** l.90 says the 6 864 ms "include `torch`". The source says it "covers the `bash` wrapper, `uv` and the server's start, because the pass spawns the server through `scripts/python-service.sh`" (`docs/retrieval-eval-results.md:28138-28139`). Change: say so. The model-free Python figure then depends on how it is launched too.

5. **Tantivy is missing from (b)'s embedded-store table.** It appears only under (d). `tantivy` (official Python bindings) is 0.27.0, with abi3 wheels for macOS, manylinux and Windows released 2026-10-22, 2.01M downloads a month, and a repository pushed 2026-10-26 (`pypi.org/pypi/tantivy/json`, `gh api repos/quickwit-oss/tantivy-py`). It gives real BM25 with no SQL. It is also fork 05's option (d). Change: add a row. Its fit is mature BM25, but a different tokenizer from Postgres `english`, so it shares SQLite's store-parity problem.

6. **The LanceDB row omits two facts relevant to store parity.**
   - New rows are not in the FTS index until `table.optimize()`.
   - The default `base_tokenizer` is `"simple"`, so stemming is opt-in. Postgres `english` stems by default (https://docs.lancedb.com/search/full-text-search).

   Change: add both facts to the l.81 row. They are the parity cost of a LanceDB embedded store.

7. **Length.** The file is 4 624 words against "about 2 000 – 4 000". Cut about 600. Candidates:
   - §2(g);
   - the maturin and napi-rs mechanics in (d), which can be one sentence;
   - the footprint figures repeated across (a), (c), the side-by-side table and §4;
   - §1's role list, which can be one paragraph.

## Nice to Have

1. l.108 gives "~2 400 Python source lines". `wc -l docs-retrieval-service/src/harness_docs_retrieval/*.py` totals 2 632, and TypeScript is 2 011. Use 2 600.
2. l.26: the JetBrains row adds nothing that is checked. Drop it, or keep it as one clause marked secondary.
3. Add `pgserver`'s 1.10M a month and `py-pglite`'s 0.12M a month to the l.83–84 rows, so the reader can see how much these packages are used.

## Verified, no finding

- Stack Overflow 2025: JS 66% / 68.8%, Python 57.9% / 54.8%, TS 43.6% / 48.8%, and the Python gain credited to AI, data science and back end.
- Stack Overflow 2026: 62.0 / 58.0 / 43.8, with no base or professional split on the page.
- Octoverse 2025: TS first in August 2025, ~42k ahead, Python "dominant in AI", 582,196 repositories, +50.7%.
- LangChain:
  - `langchain` 170,457,766 and `langchain-core` 144,826,657 on PyPI;
  - `langchain` 11,710,945 and `@langchain/core` 23,483,842 on npm;
  - 148,614 against 18,302 stars;
  - ratio 6.2–14.6×.
- `llama-index-core` 6,574,473. LlamaIndexTS: archived, pushed 2026-03-11, and the npm `llamaindex` package still has 0.52M a month.
- Haystack: every deepset-ai Haystack code repository is Python, and `@haystack-ai/core` returns "not found" on npm.
- `py-pglite`:
  - Description: "PGlite wrapper in Python for testing".
  - Version 0.5.3, pushed 2025-09-17.
  - It needs Node and npm: `src/py_pglite/manager.py` runs `["npm", "install"]` and sets `NODE_PATH`.
- `pgserver`: pushed 2024-06-10, 104 stars. `postgresql-wheel`: pushed 2022-06-26.
- `sqlite-vec`: v0.1.9 on 2026-03-31, pushed 2026-05-18. LanceDB: v0.40.0 on 2026-10-07, and its FTS is BM25 in Python and TypeScript.
- DuckDB FTS: no automatic update unless `incremental`, plus `match_bm25` (Okapi BM25).
- DuckDB VSS: "experimental", with the persistence, "data loss or corruption" and "do not use … in production" quotes.
- pyright 40,336,972 and `nodejs-wheel-binaries` 16,679,039 a month. pyright's summary is "Command line wrapper for pyright".
- Repository:
  - `docs-retrieval-service/README.md:135-138`, `:142`, `:147`, `:148` and `:155-163`;
  - `jscompat.py:3-5`;
  - `docs/retrieval-eval-results.md:27728-27744`;
  - `### Cold start` (1 169.9 / 6 864.1 ms);
  - `### Footprint` (2 044 608 KB, 1 066 256 KB, 929M);
  - `### The trade-off, stated` and `### Divergence sources, in the order checked`;
  - `README.md` → §7 step 2;
  - `01-current-mechanism.md` → §4 #12;
  - PGlite 0.5.10 / PostgreSQL 18.6.

## Re-review
verdict: PASS

Re-checked on 2026-10-28 against the revised file, which ends with `## Review response`. Line numbers below are the revised file's.

**Resolved:**
- MF1, MF2 and MF3.
- SF1–SF7, checked as follows:
  - 1 518 lines (l.59);
  - `:28065-28067`;
  - the Node-wheel evidence (l.40, l.91);
  - cold start attributed to the wrapper (l.116);
  - Tantivy (l.71);
  - LanceDB (l.72);
  - length.
- NtH1–3.
- The new citation `docs/retrieval-eval-results.md:27957-27959` (PGlite "32-bit") is correct.

**Length:** 3 994 words up to `## Review response`, and 4 284 with it. The body is within the brief.

**Even scoring:** mostly even now. Every option carries the same kit, and each core's awkward second door is named. (b-pg) carries its youth, licence and PostgreSQL 17 costs. Two points tilt slightly toward Python (Should Fix 4 and 5 below). Neither is large enough to flip a ranking that is stated as "close" with low-to-moderate confidence, so the ranking holds provisionally, pending §4 step 1.

### Should Fix (open)

1. **`pgembed`'s "~16k downloads a month" (l.67, l.174) is not a stable figure.**
   - `pypistats.org/api/packages/pgembed/recent` returns `last_month` 15 888 but `last_week` 46 694, which contradicts itself.
   - The `/overall` series without mirrors is: 2026-05 12 072, 06 15 677, 07 18 307, 08 15 676, 09 13 078, and 2026-10 to date 83 169.

   Change: say "12–18k a month May–September 2026, with a spike to ~83k in October", and drop the single figure.

2. **`pgembed`'s platform coverage is narrower than l.67 and the "platform gaps" test imply.**
   - PyPI lists macOS wheels for `macosx_15_0_arm64` only. Intel Macs and macOS versions before 15 have no wheel, so they would build from source.
   - The musllinux and Windows wheels are 12.6–14.4 MB, against 68–83 MB for manylinux and macOS (`pypi.org/pypi/pgembed/json`). The README says `pg_textsearch` and `pgvectorscale` are "NOT available on Alpine Linux or Windows (requires Rust)".
   - So fork 05's `pg_textsearch` fast path is absent on Windows and Alpine. The ordinary-SQL default is unaffected.
   - The wheel also bundles `pg_duckdb` (50.5 MB `pg_duckdb.dylib`, `pg_duckdb--1.0.0.sql`), which the file does not mention.

   Change: add the macOS 15/arm64-only gap and the Windows/musl extension gap to the l.67 row and to (b-pg)'s caveats. Note `pg_duckdb` alongside `pg_search`.

3. **The AGPL caveat needs its facts stated, and the fallback is understated.** Wheel and source, inspected:
   - **`pg_search` stays unused unless the product enables it.** `pg_search.control` is version 0.21.14, `schema = paradedb`. It loads only through `CREATE EXTENSION` (`pgembed/postgres_server.py` → `create_extension`). Nothing in `postgres_server.py`, `__init__.py`, `utils.py` or `_commands.py` sets `shared_preload_libraries`. The product's SQL never creates it, so `pg_search` is never loaded.
   - **The wheel ships no third-party licence text.** It carries only `pgembed-0.2.0.dist-info/licenses/LICENSE` (Apache-2.0). There is no AGPL text and no source offer for `pg_search` (`gh api repos/paradedb/paradedb` → `AGPL-3.0`). The PostgreSQL, pgvector and `pg_duckdb` notices are missing as well. That is an upstream compliance gap that a corporate licence scanner would flag.
   - **Declaring `pgembed` as a dependency does not redistribute it** (Inference); PyPI serves the wheel. A Docker image, a vendored wheel or an offline bundle that contains it **does redistribute** an AGPL binary. That brings AGPL's conveyance duties: the licence text, and corresponding source for that binary. AGPL's aggregation clause (§5) keeps the product's own code out of scope.
   - These are Inference, not legal advice, and need the licence check that l.80 already asks for.
   - **Excluding it is possible.** The README documents `make EXTENSIONS="pgvector pgtextsearch" all`. But that makes the product the publisher of its own embedded-Postgres wheels: 6 platform tags × 3 CPython versions per release, tracking PostgreSQL minors. l.174 calls this "a packaging job, not a rewrite". It is a standing build matrix, comparable in kind to (d)'s.

   Change: put these facts under (b-pg)'s caveats. Restate the fallback as a recurring cost, and give its size: the 12.6–14.4 MB Windows and musllinux wheels indicate the size without the Rust extensions.

4. **Two processes on one data directory is documented. It is not only a thing to test.** l.80 and l.186 treat it as untested.
   - The `pgserver` README, from which `pgembed` is forked, says: "if other process use same pgadata, server process will be shutdown when all stop".
   - `pgembed/postgres_server.py` implements this:
     - a `fasteners.InterProcessLock` under the user runtime directory;
     - a per-data-directory `.handle_pids.json` handle list;
     - the server stopped only when the last handle exits (`cleanup_mode="stop"`);
     - a Unix socket in a socket directory on POSIX, and a TCP port on Windows.
   - The same file kills a stale server found with the same `pgdata`.

   So two stdio sessions share one real server. That answers the concurrency risk in `README.md` → §5.4 better than the file claims, and favours (b-pg).

   Change: mark the shared-server behaviour **Documented** (pgserver README, `pgembed` source). Narrow the test to:
   - a SIGKILLed session leaving its pid in `.handle_pids.json`;
   - lock behaviour on NFS (a code comment warns about it);
   - concurrent refreshes from two sessions.

5. **The eval-harness port is a real (b-pg) cost, and my original MF3 overstated it as shared.**
   - `evals/docs-retrieval/` has 15 modules and 56 import lines on `cli/dist` (`grep -rn 'cli/dist' evals/docs-retrieval/*.mjs | wc -l` → 56; `01-current-mechanism.md` → §4 #12).
   - Under (c) they move with the TypeScript code they import.
   - Under (b-pg) they must be ported to Python, or rewritten to drive the engine over the wire.
   - "Move the eval" (`README.md` → §7 step 6) is not "port the eval". The PGlite sunk-cost reason was rightly dropped. This one was not a sunk cost.

   Change: restore it as a (b-pg) and (b-other) maintenance line in the l.111–112 rows, and in the l.174 "Why".

### Nice to Have (open)

1. **The "Why" (l.174) does not weigh cold start or footprint.** Python's measured first call is 6.9 s against 1.2 s, with models and the launcher. (b-pg) adds `initdb` on first run and a resident Postgres process. Both are unmeasured model-free, and §4 step 1 measures them. Name them as a (b-pg) risk in the "Why", next to PGlite's scale risk, so the risks are listed evenly on both sides.
2. **Two sourcing fixes.**
   - `pgembed`'s README `## History` says "pgembed is a fork of pgserver". Say so on l.68 instead of "same summary and dependencies".
   - l.7 cites this review as the source of the wheel listings. Cite the wheel file names on `pypi.org/pypi/pgembed/json` instead, with "listed with `unzip -l`", so the claim stands without the review.
