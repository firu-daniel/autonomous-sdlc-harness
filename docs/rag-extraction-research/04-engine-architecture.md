# RAG extraction research — engine architecture the client never sees

**Who reads this:** the maintainer settling ruling R2.1, and the round 2 synthesis. **It owns:** the evidence on Python against Node/TypeScript for enterprise AI and RAG work; the architectures that hide which engine runs; what parity between two engines must cover; and a ranked recommendation for one maintainer. **It does not own:** the lexical engine and managed Postgres (`05-managed-postgres-lexical.md`), models and the default mode (`06-models-and-modes.md`), the shapes (`02-distribution-shapes.md`), or connection security (`03-sources-database-security.md`).

## How this was researched

**Date and route.** Every web source was retrieved on **2026-10-28** with WebSearch and WebFetch. Repository metadata (stars, last push, archive state, releases) came from `gh api repos/<owner>/<repo>`. Package metadata came from `pypi.org/pypi/<pkg>/json` and `registry.npmjs.org/<pkg>/latest`. Monthly downloads came from `pypistats.org/api/packages/<pkg>/recent` and `api.npmjs.org/downloads/point/last-month/<pkg>` (2026-09-27 to 2026-10-26). `pgembed` wheel names and sizes are from `pypi.org/pypi/pgembed/0.2.0/json`. Contents were listed with `unzip -l`: the `cp312-manylinux_2_28_x86_64` wheel by this fork, the `macosx_15_0_arm64` wheel and `pgembed`'s source by the reviewer (marked "review", `reviews/04-engine-architecture.md`).

**Download counts are a weak signal.** CI runs, mirrors and transitive installs inflate them, in unknown proportions. They are used only for ratios between sibling packages, never as user counts.

**Three kinds of statement**, as in `docs/copilot-foundry-research.md` → `## How this was researched`: **Documented** (a source states it; a URL, or `path:line` / `path → ## heading`), **Inference** (this fork's own conclusion), **Unconfirmed** (no source checked states it, or sources disagree). Secondary sources are marked.

**Settled inputs.** R2.1 withdraws "one TypeScript engine" and asks for an architecture the client does not see. R2.3 makes the default mode model-free: chunking, a lexical index and rendering only. Fork 05 recommends BM25 computed in ordinary SQL over a `tsvector` column on every Postgres and PGlite, with `pg_textsearch` as a detected fast path (`05-managed-postgres-lexical.md` → `## Fork verdict`).

---

## 1. The enterprise Python lever

### What the evidence says

| Evidence | What it states | Kind |
|---|---|---|
| Stack Overflow 2025 | Used in the past year, all respondents: JavaScript 66%, Python 57.9%, TypeScript 43.6%; professionals 68.8%, 54.8%, 48.8%. Python +7 points, credited to AI, data science and back end (https://survey.stackoverflow.co/2025/technology) | Documented |
| Stack Overflow 2026 | JavaScript 62.0%, Python 58.0%, TypeScript 43.8%. The page states no base and no professional split (https://survey.stackoverflow.co/2026/technology) | Documented; base Unconfirmed |
| GitHub Octoverse 2025 | TypeScript became the most used language on GitHub in August 2025, ~42k contributors ahead of Python. "Python remains dominant in AI and data science"; it "powers nearly half of all new AI repositories (582,196; +50.7% YoY)" (https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) | Documented |
| LangChain | PyPI `langchain` 170.5M and `langchain-core` 144.8M a month; npm `langchain` 11.7M and `@langchain/core` 23.5M. Ratio 6.2–14.6× | Documented |
| LlamaIndex | `llama-index-core` 6.6M a month and maintained. **LlamaIndex.TS is archived**: "This project is deprecated and no longer maintained" (`gh api repos/run-llama/LlamaIndexTS`, last push 2026-03-11) | Documented |
| Haystack | Python only; `@haystack-ai/core` does not exist on npm | Documented |
| Vector-store clients | Python leads: `qdrant-client` 12.0M against 3.1M; `lancedb` 7.7M against 2.1M; `chromadb` 6.5M against 0.9M. Chroma's JS client "must connect to a Chroma server" (https://docs.trychroma.com/docs/run-chroma/clients) | Documented |
| Model vendors' SDKs | Official in both languages: OpenAI, Anthropic, Cohere, Voyage, Mistral, Google GenAI, Pinecone (registry metadata) | Documented |
| A TS tool on PyPI | pyright's PyPI wrapper (third-party, `RobertCraigie/pyright-python`) has 40.3M a month against 3.0M on npm, 13× | Documented |

**Reading (Inference).** General usage is roughly level. **In the RAG framework layer Python leads decisively.** Hosted models are reachable from either runtime. Python users also install JavaScript tools through PyPI.

### Procurement and security review

- **Mirrors carry both.** Sonatype Nexus supports npm, PyPI, Docker/OCI and a Hugging Face proxy "in all distributions" (https://help.sonatype.com/en/formats.html). A company that mirrors PyPI but blocks npm is **Unconfirmed**.
- **Both registries have had serious incidents.** CISA warned of the npm worm Shai-Hulud, which compromised more than 500 packages (https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem). On PyPI, malicious Ultralytics releases went out through a compromised workflow and a leftover token (https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/).
- **A runtime bundled inside a package gets flagged.** `nodejs-wheel-binaries`, which puts Node in a wheel, calls itself an "unoffical Node.js package". It is maintained by one individual (`gh api repos/njzjz/nodejs-wheel`: 28 stars), and its 24.19.0 wheels are 56–61 MB per platform. Scanners flag such runtimes: ReversingLabs fails several older Windows wheels on vulnerabilities (https://secure.software/pypi/packages/nodejs-wheel-binaries/versions, **secondary**), and OpenSearch Dashboards' bundled Node drew CVE reports later ruled not applicable (https://forum.opensearch.org/t/potential-security-issues-with-the-bundled-node-js/17365, **secondary**). No source shows a company refusing such a wheel. `basedpyright`, which requires it, has 13.8M downloads a month.
- **Container-only deployment** hides the runtime inside an image. Review then turns on the image's SBOM and base, not on the language (Inference).
- **"Approved runtime" lists.** No primary source was found stating that companies require Python for third-party tools: **Unconfirmed**.

**Where the lever bites (Inference).** An MCP-client user sees the runtime only in one install command, and an image hides it entirely. The data or ML engineer who wires retrieval into a pipeline or audits it works in Python. So the lever is strong for **extension, library use and code audit**, weak for MCP and Docker. That RAG engineers *work* in Python is well evidenced; that companies *require* it is not.

---

## 2. Architectures that hide the engine

**What the client can see (Inference).** Three surfaces: the **install command**, the **config file** and the **wire** (MCP tool, result text, REST JSON). Today the two backends differ on the wire only in `serverInfo.version` and stderr prefixes (`docs-retrieval-service/README.md:135-138`). The hard parts are the install command, and results that differ by engine.

**The common delivery kit (e), applied to every option.** A service boundary hides the engine by construction. Qdrant, Meilisearch, Typesense and Ollama (a Go server with `ollama-python` and `ollama-js`) are servers with thin clients. Without Docker, Meilisearch installs as a binary (https://www.meilisearch.com/docs/learn/self_hosted/install_meilisearch_locally), and Embedded Weaviate's client downloads and runs one, experimentally (https://docs.weaviate.io/deploy/installation-guides/embedded). **A stdio MCP server is already this boundary**: the client spawns the engine and speaks JSON-RPC (Inference). So every option below gets the same kit: `serve --stdio` and `serve --http`, a Docker image, a `server.json` listing every package (`02-distribution-shapes.md` → `## Recommendation`, item 6), and a thin REST client in the other language. What differs is the core, its embedded store and its **second registry's front door**. "Server-only, Docker first" fails the no-Docker first run, so it is not ranked alone.

### (a) Engine per store type, both runtimes

TypeScript on PGlite embedded, Python on psycopg remote: today's arrangement, selected by `docs.retrievalBackend` (`01-current-mechanism.md` → `### Who starts the server`).

- **Can the client tell?** By install: the remote mode needs Python beside Node. By relevance: on 2026-10-08 the backends "disagree, and the reason is not yet identified" (`docs/retrieval-eval-results.md:27728-27744`). On the 2026-10-22 reading "arm B agrees on every query" (`docs/retrieval-eval-results.md:28065-28067`), but moving a corpus from local to team can still change its answers in model modes.
- **Maintenance:** two cores, two suites, two pipelines. Parity costs `jscompat.py` (208 lines), seven parity test files, `ts_bridge.py` (74) and `ts_bridge.mjs` (190): **1 518 lines** by `wc -l`. Every feature is built twice, or exists for only one store kind.

### (b) One Python engine

**Embedded stores Python can host**, as of 2026-10-28:

| Store | Status | Same dialect and tokenizer as remote Postgres? |
|---|---|---|
| **`pgembed`** | "a fork of pgserver" (README `## History`); 0.2.0 (2026-03-18), Apache-2.0, 53 stars, pushed 2026-10-06. Downloads 12–18k a month May–September 2026, then a spike to ~83k in October (pypistats `/overall`, via review). `get_server(dir)` "handles `initdb`, port management, and process cleanup" (https://github.com/Ladybug-Memory/pgembed). Wheels, cp312–cp314: manylinux x64/arm64 68 MB; **macOS 15 arm64 only**, 83 MB (no Intel or pre-15 wheel); musllinux and Windows 12.6–14.4 MB, **without `pg_textsearch`** ("NOT available on Alpine Linux or Windows"). The manylinux wheel holds PostgreSQL **17.9**, `vector`, `pg_textsearch` 0.6.1 and ParadeDB's `pg_search` (AGPL, a 77.6 MB `.so`); the macOS wheel adds `pg_duckdb` (~50 MB) | **Yes**, for fork 05's ordinary-SQL BM25 |
| `pgserver` | `pgembed`'s parent; last push 2024-06-10, but **1.10M downloads a month** | Yes; stale |
| `py-pglite` | "PGlite wrapper in Python for testing"; runs `npm install` and Node (review); 0.12M a month; last push 2025-09-17 | Yes, but needs **Node** |
| SQLite FTS5 + `sqlite-vec` | FTS5 is in the standard `sqlite3` module (checked locally, SQLite 3.43.2). `sqlite-vec` v0.1.9, pre-1.0 | No: another dialect and tokenizer |
| Tantivy (`tantivy`) | "Official Python bindings", 0.27.0, abi3 wheels for macOS, manylinux and Windows, 2.01M a month, pushed 2026-10-26 | No: mature BM25, a different tokenizer from Postgres `english` |
| LanceDB | v0.40.0, Rust core; Lance-native BM25 FTS in Python and TypeScript. New rows are not searchable until `optimize()`; the default `base_tokenizer` is `"simple"`, so stemming is opt-in (https://docs.lancedb.com/search/full-text-search) | No |
| DuckDB FTS + VSS | VSS is "experimental", with possible "data loss or corruption of the index" (https://duckdb.org/docs/2.0/core_extensions/vss.html) | No |

**(b-pg): Python on `pgembed` embedded and psycopg remote.**

- **Client sees:** `uvx ragscene`. uv fetches a managed Python if none is present (https://docs.astral.sh/uv/concepts/python-versions/), so the only prerequisite is the `uv` binary.
- **Can the client tell?** Not by relevance. The same SQL and the same `tsvector` tokenizer run on both sides. PostgreSQL 17 embedded against 18 remote is **Unconfirmed** as identical for `tsvector` until tested.
- **Maintenance:** one core. The remote store exists today: every SQL statement `store.ts` issues runs unchanged through psycopg (`docs-retrieval-service/README.md:142`). Pool and reconnect remain. libpq gives fork 03's TLS defaults natively, which Node needed mapped by hand (`README.md` → §4). **The eval harness must be ported**: 15 modules, 56 imports of `cli/dist` (`grep -rn 'cli/dist' evals/docs-retrieval/*.mjs`; `01-current-mechanism.md` → §4 #12). Under (c) it moves as is.
- **Shared server, Documented.** The `pgserver` README says "if other process use same pgadata, server process will be shutdown when all stop". `pgembed/postgres_server.py` implements it: an inter-process lock, a per-directory `.handle_pids.json`, stop on the last handle (review). Two stdio sessions share one server, answering round 1's concurrency risk (`README.md` → §5.4). Left to test: a SIGKILLed session's stale pid, the lock on a network filesystem, and two sessions refreshing at once.
- **Embedded caveats:** a young package from one organisation. A child server process, with `initdb` on first run, and a resident Postgres, both unmeasured. PostgreSQL 17. **Platform gaps:** no wheel for Intel Macs or macOS before 15, which build from source; no `pg_textsearch` fast path on Windows or Alpine (the ordinary-SQL default is unaffected).
- **AGPL (Inference, not legal advice).** `pg_search` loads only through `CREATE EXTENSION`, which nothing in `pgembed` or the product runs, so it is never loaded (review). The wheel carries only its own Apache-2.0 `LICENSE`: no AGPL text, no source offer, no PostgreSQL, pgvector or `pg_duckdb` notices, so scanners will flag it. A PyPI dependency does not redistribute it; a Docker image or offline bundle containing it does, bringing AGPL's duties (licence text, corresponding source) for that binary, while §5's aggregation clause keeps the product's code out of scope. **The fallback**, building without it (`make EXTENSIONS="pgvector pgtextsearch" all`), is a standing build matrix of 6 platform tags × 3 CPython versions per release, tracking PostgreSQL minors; the 12.6–14.4 MB Rust-free wheels indicate its size.
- **Second front door:** `npx` for a Python engine has no clean precedent. MCPB recommends Node "because Claude Desktop ships it" (`02-distribution-shapes.md` → `## The systems surveyed`).

**(b-other): Python on SQLite, Tantivy or LanceDB.** One language, but two lexical engines and tokenizers. The parity problem moves from language to store.

### (c) One TypeScript engine

PGlite in process, plus a new remote store on `pg` (`README.md` → §5.1).

- **Can the client tell?** No. PGlite 0.5.10 bundles PostgreSQL 18.6, the server image's minor (`docs-retrieval-service/README.md:147`).
- **Maintenance:** one core. To build: a `pg` store, pool, reconnect, and explicit TLS mapping with a Node ≥ 22.15 floor (`README.md` → §4, §7 steps 4–5). PGlite is single-connection and 32-bit WASM (`docs/retrieval-eval-results.md:27957-27959`), and its behaviour at 10⁵–10⁶ chunks is untested (`README.md` → §5.4).
- **Second front door:** `uvx` through a wheel that depends on `nodejs-wheel-binaries`. The precedent is **`basedpyright`**: a hard dependency on `nodejs-wheel-binaries>=20.13.1`, a 13.7 MB wheel, 13.8M downloads a month. Cost: ~60 MB of unofficial Node per platform plus the engine and PGlite's WASM, pinned by a third party and flagged by scanners (§1). That PGlite's assets bundle cleanly is **Unconfirmed**.
- **The Python lever:** install path yes; Python source no.

### (d) A Rust core with Python and Node bindings

The pattern of LanceDB, Chroma, tantivy-py, Hugging Face tokenizers and Polars; the client cannot tell. maturin and napi-rs generate the CI (https://www.maturin.rs/distribution.html, https://napi.rs/docs/deep-dive/release), but the result is one package per platform per registry. It means rewriting 2 011 TypeScript and 2 632 Python source lines (`wc -l`). No Rust crate hosts PGlite, so it is two stores again unless the core adopts Tantivy or Lance.

### (f) Other options

One engine with two front doors is folded into (b-pg) and (c). A WASM component core run by Node and `wasmtime` is **Unconfirmed** as feasible (no Python host for PGlite found). A hosted-only API contradicts "local by default".

### The options, scored evenly

Every option carries the same kit (stdio/HTTP boundary, Docker, `server.json`, a thin client in the other language). Footprint figures are measured with models loaded (`docs/retrieval-eval-results.md` → `### Footprint`, `### Cold start`). Model-free figures are unmeasured everywhere.

| | Primary door / second door | Engine visible by relevance? | Cores / suites / pipelines | Embedded store risk | Remote store work | Python source | Measured footprint |
|---|---|---|---|---|---|---|---|
| (a) per store, both | `npx` / `uvx`, both needed for remote | Today partly | 2 / 2 + 1 518 parity lines / 2 | PGlite scale | Pool, reconnect | Half | TS ~300 MB disk, 1.2 s first call, 2.0 GB RSS; Py 929M env, 6.9 s, 1.1 GB |
| (b-pg) Python + `pgembed` | `uvx` / `npx` with no clean precedent; MCPB disfavoured | No (PG 17 vs 18 to test) | 1 / 1 / 1; **eval port (15 modules)** | Young package, macOS 15 arm64 only, AGPL notices, `initdb` | Pool, reconnect; TLS native in libpq | Yes | Py as above; `pgembed` 68–83 MB wheel; start unmeasured |
| (b-other) Python + SQLite/Tantivy/Lance | `uvx` / as (b-pg) | Yes, across stores | 1 / 1 per store / 1; eval port | Second dialect | As (b-pg) | Yes | Unmeasured |
| (c) TypeScript | `npx` / `uvx` via ~60 MB unofficial Node wheel (basedpyright precedent) | No | 1 / 1 / 1 + wheel job | PGlite single connection, 32-bit, scale | New `pg` store, pool, reconnect, TLS mapping | No | TS as above |
| (d) Rust core | `pip` / `npm`, native | No | 1 + 2 bindings / 1 / 2 + platform matrix | Two stores | New | Bindings only | Unmeasured; a rewrite |

Python's 6 864 ms "covers the `bash` wrapper, `uv` and the server's start", with `torch` loaded (`docs/retrieval-eval-results.md:28138-28139`).

---

## 3. The parity question

### What today's record shows

Byte parity is asserted on chunk keys and hashes, stubs, rendering, store statements, MCP listing and end-to-end output (`docs-retrieval-service/README.md:155-163`). `jscompat.py` exists because "a JavaScript string or number operation the TypeScript backend performs is reproduced here exactly, or a byte difference appears that has nothing to do with retrieval" (`jscompat.py:3-5`). It covers UTF-16 slicing, JS whitespace, `toFixed`, `JSON.stringify` and key order. The measured divergences were quantization, ONNX against PyTorch, and BM25 index state (`docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`).

### What R2.3 removes

A model-free default takes quantization and ONNX against PyTorch off the default path. The index-state divergence was already gone on 2026-10-22: "All 12 queries return the same five ordered refs on both sides" (`docs/retrieval-eval-results.md:28065-28067`). Fork 05's ordinary-SQL BM25 removes `pg_textsearch`'s index state altogether. **Inference:** on the default path, the same SQL on the same tokenizer should give the same ordered refs. What remains is chunking, tie order and rendering.

### What must be identical, and what need not be

| Must be identical (the contract) | Why |
|---|---|
| MCP server and tool names, description, input schema, `k` clamp, refusals | Agents and permission strings quote them (`01-current-mechanism.md` → §4 #4) |
| Result text grammar: ranked `path#anchor (score x.xxx)` lines, `note:` lines, the abstention line | Agents read it |
| REST JSON schema and error codes | Thin clients depend on it |
| Config keys, defaults and precedence | One config, whatever runs |
| **Chunk boundaries and anchors** | Refs are citations; moving from local to team must not change them |
| Default-path top-k refs, in order, on a fixed corpus | Otherwise the client can tell |

| Need not be identical | Why |
|---|---|
| `serverInfo.version`, stderr and logs, timings | Already allowed (`docs-retrieval-service/README.md:135-138`) |
| Internal hashes and ids, when no index is shared between engines | Under engine per store type, each index has one writer and reader (Inference) |
| Bound vector text (`1` against `1.0`) | Same number (`docs-retrieval-service/README.md:148`) |
| Opt-in vector, fused and reranked order | Judged by tolerance (recall@k and MRR within a delta, rank overlap), not bytes |

### Can a shared contract replace byte parity?

**Precedents.** The MCP conformance suite drives any server by URL, checks each message against the spec schema, keeps a baseline of known failures, and runs SDKs in any language (https://github.com/modelcontextprotocol/conformance). sqllogictest checks SQL engines against files of expected results (https://github.com/risinglightdb/sqllogictest-rs); DuckDB prefers "`ORDER BY` in the query to generate deterministic query answers" (https://duckdb.org/docs/2.0/dev/sqllogictest/result_verification.html).

**Applied here (Inference).** Yes for the default path, given three things:

1. **A language-neutral chunking spec**, in code points or UTF-8 bytes, with a fixed whitespace class. Most of `jscompat.py` goes, at the price of one TypeScript chunker change and a rebuild.
2. **A total order** in the lexical SQL: score, then ref by byte order.
3. **A conformance corpus with golden files:** chunks, top-k refs per mode, rendered text, wire transcripts. Each engine checks against them in its own CI. No test needs both runtimes, so `ts_bridge` goes.

Opt-in model modes get a tolerance band, perhaps narrowed by one ONNX artifact on both sides (**Unconfirmed**). The contract replaces the 1 518 parity lines with data, but not (a)'s duplicated features. Under one engine it is still the public behaviour spec.

---

## 4. The recommendation

Ranked for one maintainer, a target user with large docs who wants to plug in, and rulings R2.1–R2.3, with every option carrying the same kit (Inference throughout).

| Rank | Option | Why |
|---|---|---|
| **1** | **(c) one TypeScript engine** | One core, one dialect, every platform, the eval kept; costs a new `pg` store, an unofficial-Node `uvx` door, PGlite's limits |
| 2 | (b-pg) one Python engine: `pgembed` embedded, psycopg remote | One core, one dialect, existing store, Python source; costs the gaps listed below and a weak `npx`/MCPB door |
| 3 | (a) engine per store type, with the §3 contract | Works today, but two cores mean every feature is built twice, and the install changes with the store |
| 4 | (b-other) Python on SQLite, Tantivy or LanceDB | One language, but two lexical engines; relevance differs by store |
| 5 | (d) Rust core | A rewrite plus a two-registry platform matrix for one maintainer, and still two stores |

**Why (c) now edges (b-pg) (Inference, low-to-moderate confidence).** The previous revision ranked (b-pg) first; the re-review's facts reverse it. Each has one awkward front door and embedded-store risk. (b-pg) keeps an existing remote store, libpq TLS, a shared server and Python source. Four things outweigh them for a plug-in product run by one person:

- `pgembed` cannot install from a wheel on Intel Macs or macOS before 15.
- Dropping its AGPL binary means owning a 6×3 Postgres build matrix every release.
- The eval harness, the product's only quality evidence, must be ported.
- First run adds `initdb` and a resident server to a Python start measured at 6.9 s (with models and the launcher), against 1.2 s for TypeScript.

(c)'s own risks, PGlite's scale and the unofficial Node wheel, are serious but each has a fallback: the remote store at scale, and `npx` or Docker for the install.

**What would change the ranking.**

- **`pgembed` gains Intel and older macOS wheels, and a licence-clean build** (or ships without `pg_search`), and §4 step 1 passes: (b-pg) moves to 1.
- **A buyer requires Python source**: (b-pg) moves to 1.
- **PGlite fails round 1's scale probe** (`README.md` → §7 step 2): (b-pg) moves to 1.
- **PostgreSQL 17 against 18 changes `tsvector` results:** this counts against (b-pg).
- **Fork 05's latency fallback needs `pg_textsearch`:** `pgembed`'s 0.6.1 is far behind 1.5.1, which also counts against (b-pg).
- **A library-based lexical engine** (Tantivy, Lance FTS) replaces SQL: (d)-by-adoption becomes cheap.

**The cheapest experiment that settles it** (about one day, Inference):

1. **Model-free footprint of both backends** in `lexical` mode, with no model libraries imported and Python launched without the `bash`/`uv` wrapper. This shows how much of TypeScript's 2.0 GB and Python's 6.9 s is models.
2. **`pgembed` on a clean macOS 15 arm64 and Linux x64:**
   - a `uvx` install with no Postgres and no Node;
   - first-run time including `initdb`, and RSS of Python plus Postgres;
   - a SIGKILLed session's stale handle, and two sessions refreshing at once;
   - fork 05's BM25 SQL compared with PGlite on the conformance corpus.
3. **The `basedpyright`-style wheel** for (c), installed from a PyPI-only mirror.

(c) stands unless step 2 is clean and `pgembed`'s platform and licence gaps close.

## Open questions

1. **Does any target buyer require Python source, or only a Python install path?** Maintainer, through three to five prospect conversations.
2. **Is `pgembed` fit as the embedded store?** Its first-run time, the edge cases of its shared server, its macOS coverage, its maintenance outlook, and its unnoticed AGPL binary. Test (§4 step 2) plus a licence check.
3. **Does PostgreSQL 17 give the same `tsvector` BM25 results as 18** on the conformance corpus? Test.
4. **Model-free RSS and cold start of each backend.** Test (§4 step 1).
5. **Can the TypeScript engine, PGlite's WASM included, ship as a wheel** that installs from a PyPI-only mirror, and do scanners flag its Node? Test (§4 step 3).
6. **Does a code-point chunking spec change anchors on existing corpora?** Test on the three eval corpora.
7. **Can one ONNX artifact give a narrow tolerance band** across onnxruntime-node and onnxruntime-python for the opt-in modes? Test.

## Fork verdict

The evidence supports a Python lever for **RAG engineering**: LangChain's Python side is 6–15× its JavaScript side, LlamaIndex archived its TypeScript port in 2026, and Haystack is Python only. It does not show that companies require Python for a tool they run, since vendor SDKs are dual-language and mirrors carry both registries. The client never needs to know the engine if the engine sits behind the stdio/HTTP boundary, with a Docker image and thin clients, and every option can carry that kit. Scored evenly, **one TypeScript engine** narrowly ranks first. It has one Postgres dialect, installs on every platform, keeps the eval harness and starts fastest as measured. Its `uvx` door follows `basedpyright`'s precedent but rests on an unofficial Node wheel. **One Python engine on `pgembed` and psycopg** is a close second. It keeps one dialect under fork 05's ordinary-SQL BM25, reuses the existing store and libpq TLS, shares one server between sessions, and meets the Python lever in source. It loses on `pgembed`'s macOS 15-arm64-only wheels, its unnoticed AGPL binary (or a standing build matrix to drop it), the eval port, and first-run `initdb`. Engine per store type ranks third, viable only with a golden-file conformance contract instead of byte parity, which R2.3's model-free default makes reachable. Confidence is low to moderate. The one-day tests in §4, or a buyer requiring Python source, could reverse the top two.

## Review response

Review: `reviews/04-engine-architecture.md` (FAIL: 3 MF, 7 SF, 3 NtH). All applied.

- **MF1, `pgembed`:** added to (b)'s table with its version, wheels, extensions, PostgreSQL 17.9, sizes and the AGPL `pg_search` caveat. (b) is split into (b-pg) and (b-other). The "only JavaScript hosts it" claim is removed, and fork 05's ordinary-SQL verdict is stated as what makes (b-pg) one dialect. `pgembed` checks are added to §4's experiment and to the open questions.
- **MF2, pyright:** `basedpyright` (hard `nodejs-wheel-binaries` dependency, 13.7 MB wheel, 13.8M a month) is now the precedent. pyright is kept in §1 only as a TypeScript tool that leads on PyPI (40.3M against 3.0M on npm), marked third-party. The verdict sentence is fixed.
- **MF3, even scoring:** the delivery kit (boundary, Docker, `server.json`, thin client in the other language) is applied to every option. "Server-only" is no longer ranked separately. The sunk-cost (PGlite) and shared-cost (eval port) reasons are dropped. Each option's second front door is scored: `npx`/MCPB for Python, the ~60 MB Node wheel for TypeScript. Re-ranked: (b-pg), (c), (a), (b-other), (d).
- **SF1:** 1 518 lines, including `ts_bridge.mjs`.
- **SF2:** the 2026-10-22 result is cited at `:28065-28067`.
- **SF3:** the Node-in-wheel evidence (unofficial, one maintainer, 56–61 MB, secondary scanner and CVE-triage reports, `basedpyright`'s uptake) is in §1 and in (c)'s cost.
- **SF4:** cold start is attributed to the wrapper, `uv` and the server start, per `:28138-28139`.
- **SF5:** Tantivy row added.
- **SF6:** LanceDB's `optimize()` requirement and `"simple"` tokenizer added.
- **SF7:** cut by trimming §1's roles, (d)'s mechanics, (g), and repeated footprint figures.
- **NtH1:** 2 632 Python and 2 011 TypeScript lines. **NtH2:** JetBrains kept as one row marked secondary and Unconfirmed. **NtH3:** `pgserver` 1.10M and `py-pglite` 0.12M a month added.

### Re-review response

Re-review: PASS, with 5 SF and 2 NtH open. All applied, none rebutted.

- **SF1, downloads:** `pgembed` now reads 12–18k a month May–September 2026 and ~83k in October.
- **SF2, platforms:** macOS 15 arm64 only, no `pg_textsearch` on Windows or musllinux, and `pg_duckdb` (~50 MB) in the macOS wheel, in the table and in (b-pg)'s caveats. Checked: the manylinux wheel holds `pg_search` but not `pg_duckdb`.
- **SF3, AGPL:** the facts are stated: never loaded unless created; no AGPL text, source offer or upstream notices; no redistribution through PyPI, but redistribution in an image or bundle. The fallback is restated as a standing 6×3 build matrix.
- **SF4, two processes:** the shared server is Documented from the `pgserver` README and `pgembed`'s source. The test is narrowed to a stale pid, NFS locking and concurrent refreshes.
- **SF5, eval port:** restored as a (b-pg) and (b-other) cost: 15 modules, 56 imports.
- **NtH1, cold start and `initdb`:** both are weighed in the "Why".
- **NtH2, sourcing:** "a fork of pgserver" is quoted, and the wheels are cited from PyPI's file list, with this fork's own `unzip -l` of the manylinux wheel.
- **Outcome:** re-checked, and **(c) now edges (b-pg)**, because of the macOS gap, the build-matrix fallback, the eval port and first-run cost. New order: (c), (b-pg), (a), (b-other), (d). The body was trimmed to about 4 000 words to make room.
