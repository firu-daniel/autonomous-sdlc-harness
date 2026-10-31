# RAG extraction research — synthesis

**Who reads this:** the maintainer deciding whether, and how, to move docs retrieval out of this repository into its own product for users with large or very large documentation. **It owns:** the merged answer of six forks over two rounds; how the forks disagree or interact, and how that is resolved; the cross-fork risks; an ordered list of next steps; and one de-duplicated list of open questions. **It does not own:** the evidence. Each finding is cited to the fork section that holds it, and the sources are cited there. Nothing was re-researched, except the Node driver facts in §4 and the Transformers.js/ModernBERT facts in §5.1, which the synthesis reviews supplied.

## How this was researched

**Date and route.** Both rounds ran on **2026-10-28**. Round 1 ran against `dev` at `2ace325d`, round 2 on the `chore_rag_extraction_research` branch. A shared brief ([`_brief.md`](_brief.md)) set the question, the rules and the forks, and a review brief ([`_review_brief.md`](_review_brief.md)) set the reviewers' checks. Round 1 produced forks 01–03 and a first synthesis, which was itself reviewed ([`reviews/README.md`](reviews/README.md)). The maintainer then issued five round 2 rulings, and forks 04–06 answered them.

| Fork | Round | Review rounds and verdicts | Final state |
|---|---|---|---|
| [`01-current-mechanism.md`](01-current-mechanism.md) | 1 | **PASS** (0 MF, 9 SF, 4 NtH) | All applied |
| [`02-distribution-shapes.md`](02-distribution-shapes.md) | 1 | **FAIL** (3 MF), re-review **FAIL** (1 MF, 2 SF, 3 NtH) | All applied; verified by the synthesis reviewer |
| [`03-sources-database-security.md`](03-sources-database-security.md) | 1 | **FAIL** (1 MF, 16 SF), re-review **PASS** (1 SF, 1 NtH) | All applied |
| [`04-engine-architecture.md`](04-engine-architecture.md) | 2 | **FAIL** (3 MF, 7 SF, 3 NtH), re-review **PASS** (5 SF, 2 NtH) | All applied; no third review |
| [`05-managed-postgres-lexical.md`](05-managed-postgres-lexical.md) | 2 | **FAIL** (3 MF, 8 SF, 6 NtH), re-review **PASS** (2 SF, 2 NtH) | All applied; no third review |
| [`06-models-and-modes.md`](06-models-and-modes.md) | 2 | **FAIL** (1 MF, 12 SF, 7 NtH), re-review **PASS** (1 SF, 2 NtH) | All applied; no third review |

**Three kinds of statement**, as in [`../copilot-foundry-research.md`](../copilot-foundry-research.md) → `## How this was researched`: **Documented** (a fork or review cites a source), **Inference** (this synthesis's own unless attributed), **Unconfirmed** (no source states it, or sources disagree).

**Maintainer rulings** (`_brief.md` → `## The question`, `## Round 2 rulings`). Round 1: (1) harness re-use is not the focus; (2) the stack is not locked; (3) models local by default, others by configuration; (4) a late entrant is fine; (5) one engine serves both stores. Round 2: **R2.1** withdraws (5): the engine may differ by store, Python is an enterprise lever, and **the client need not know which engine runs**; **R2.2** the `pg_textsearch` gap must be decided; **R2.3** the default is model-free and the MS MARCO reranker is not accepted; **R2.4** business-corpus measurement belongs to [#199](https://github.com/firu-daniel/autonomous-sdlc-harness/issues/199); **R2.5** the four security gaps are filed as #200–#203.

---

## Maintainer rulings after round 2 (2026-10-28)

Recorded after the synthesis; the sections below were not rewritten for them, so where they conflict, these win.

- **R3.1 Name.** The product is **RagScene** (`ragscene`), consistent with the harness's pending rename to DevScene. Every `ragscene` / `RAGSCENE_` name in this folder replaces the earlier working name `docsrag`.
- **R3.2 Platform.** RagScene will most likely always run on Linux, locally too (a container or VM on a Mac). `pgembed`'s missing macOS wheels (Intel, pre-15) therefore matter less.
- **R3.3 AGPL.** Building our own `pgembed` wheels without `pg_search` (the 6 × 3 matrix) is most likely not done; the AGPL licence of the bundled `pg_search` is to be checked instead (§7 step 7).
- **R3.4 Fallback.** If `pgembed` fails the one-day test, the fallback is Python against a local Postgres from RagScene's own Docker image, or TypeScript.
- **R3.5 Hosted tier.** A hosted RagScene is **on the roadmap**; round 1's "hosted SaaS deferred" now means "not first".
- **R3.6 Runtime not confirmed.** Python is the maintainer's lean, but not confirmed; the one-day `pgembed` test (§7 step 2) is filed as its own issue first, since it may surface unexpected points on Python.
- **R3.7 Order.** Finish the sandbox series, then the DevScene rename (expected to take a couple of days), and only then RagScene: one big task at a time. No RagScene work, the private `ragscenedev` repository included, starts before the rename is done.
- **R3.8 History.** The private `ragscenedev` repository is a workspace for early extraction, fixes and issues; at a stable point everything moves to the public `firu-daniel/ragscene` as a single initial commit. Git history is not kept, from the harness or from `ragscenedev`.

- **Extraction order.** How RagScene is started (private `ragscenedev`, the cut, adoption, the move to the public repository) is [`07-extraction-plan.md`](07-extraction-plan.md) → `## 6`. Where it departs from `## 7` below (#201–#202 land in RagScene; the copy comes first), `07` wins.

## 1. The answer in brief

- **Extraction is feasible, and the seam is thin.** Retrieval is pulled by agents, with no hooks (`01-current-mechanism.md → §2`, `§4`).
- **Default to model-free `lexical`** (R2.3; `06-models-and-modes.md → §4`): no download, no egress, no model licence question, and it matches this repository's one real measurement. Today's code cannot build a vectorless index in either runtime (§5.3).
- **Lexical engine: BM25 in plain SQL over a `tsvector` column on every Postgres, with `pg_textsearch` as the one fast path** (`05-managed-postgres-lexical.md → ## 4`). Scores should match to float precision right after a rebuild. That is a test to run; latency at 10⁶ chunks is the open risk.
- **Engine: the maintainer's choice between two close options** (§5.1). Fork 04 ranks one TypeScript engine narrowly ahead of one Python engine on `pgembed`, at low-to-moderate confidence. A one-day test separates them. Under either, the client sees only the install command, the config and the wire. Round 1's "one TypeScript engine" recommendation is superseded.
- **Opt-in hybrid modes use licence-clean models.** The English pair is IBM's Granite embedder and reranker. For multilingual reranking, NVIDIA's local Nemotron reranker is to be measured, with hosted rerank available by configuration meanwhile. Today's embedder, bge-small, is probably MS MARCO-trained too (`06 → §2.3`).
- **Shape (unchanged from round 1):** a CLI, stdio MCP, one `serve --http` (MCP + REST), an image, a registry entry, thin wrappers, fork 03's secure defaults (§3).
- **Business corpora are #199's to measure.** The literature supports hybrid + rerank on average, and only moderately where query wording differs from the documents'. Identifier queries favour BM25 (`06 → §1.3`). Step 1 builds the lexical engine before #199's eval branches.

## 2. How retrieval works today, and where it cuts

**Invocation and pipeline (`01 → §1`, `§3`).** A launcher picks TypeScript (PGlite) or Python (Postgres by URL). The MCP tool takes `{query, k}`, always runs `fused-rerank`, and abstains below a reranker score of `0.32`. Python's unshipped `POST /search` has no auth and writes on every call.

**Coupling (`01 → §4`).** Fourteen items: six renames or deletions, six moderate, one moderate-to-hard (#11, byte parity) and one hard (#8, the TS backend inside the harness npm package). The eval harness (#12) imports `cli/dist` in 15 modules.

**Gaps (`01 → §6`):** Markdown only, no chunk cap; local files only; refresh before every query; Postgres ≥ 18.4 with a preload and an extension-creating role; single tenant; one connection, no reconnect; English only. **After the cut (`01 → §7`, Inference)** the harness consumes a stdio MCP command with a configurable server name, the result format and `self-check`.

## 3. The product shape

**Core interfaces** (`02 → ## Recommendation`; `03 → §1`): a **store** (embedded, or remote Postgres by reference) at the `DocStore` seam, and a **model provider** read only when the mode needs it (`06 → §4.4`).

| Shape | Fork 02 | Fork 03 security |
|---|---|---|
| CLI: `index`, `search`, `serve`, `check`, `fetch-models`, `compare-modes` | `index` is the separate job large corpora need; `compare-modes` runs the eval's ad-hoc route on the user's own questions (`06 → §4.3`) | `check` reports extensions, preload, staleness and TLS mode |
| `serve --stdio` | The default MCP shape | Credentials from env |
| `serve --http`: MCP at `/mcp` + REST `POST /search` | An optional bearer key reaches every IDE agent and, when public, every Claude surface. OAuth is deferred to a proxy recipe | Loopback bind; `Host`/`Origin` and content-type checked on loopback too; a non-loopback bind is refused without a key file; serve under a read-only role |
| Docker image, registry entry, plugin without `bin/`, skills, `.mcpb` | Thin wrappers | The image ships without model weights until the licence policy is set (§6) |

**The engine stays invisible (`04-engine-architecture.md → §2`, `§3`, Inference).** A stdio or HTTP server is already a service boundary; every option gets the same kit (both serve modes, an image, one `server.json`, a thin client in the other language). A golden-file conformance contract replaces byte parity as the public behaviour spec. It pins tool names, schema, result grammar, REST JSON, config keys, chunk boundaries and anchors, and the default-path top-k refs in order. It needs a language-neutral chunking spec and a total order in the lexical SQL: score, then ref.

**Plugin secrets (round 1, Inference)** go into the server's environment; the config names only the variable.

## 4. Setup inputs: source, store, models, TLS

**The minimal file** (`03 → ## Minimal-setup proposal`):

```yaml
source: { path: ./docs }
```

Everything else defaults: an embedded store, model-free `lexical`, stdio, and an index built on first `serve` and then watched.

**The non-default blocks, merged from forks 03 and 06 and round 1** (Inference):

```yaml
search:
  mode: lexical                       # lexical | fused | fused-rerank; the MCP tool may ask for less, never more
store:
  kind: embedded                      # embedded | postgres
  postgres:
    url_env: RAGSCENE_DATABASE_URL     # no password in the URL
    password_env: RAGSCENE_DB_PASSWORD # or iam: aws-rds | azure-entra | gcp-cloudsql (minted per connect)
    schema: handbook
    lexical: auto                     # auto (pg_textsearch if loaded, else tsvector-bm25) | tsvector-bm25; never ts_rank
    tls: { mode: verify-full, ca: system, allow_weaker: false }   # ca: system | bundled | <file>
models:                               # read only when mode needs it
  embedder:  { provider: local, id: ibm-granite/granite-embedding-small-english-r2, revision: <sha> }
  reranker:  { provider: local, id: ibm-granite/granite-embedding-reranker-english-r2, revision: <sha>, abstain_below: auto }
  # reranker: { provider: cohere, id: rerank-v3.5, key_env: COHERE_API_KEY }
egress: deny                          # any hosted provider requires egress: allow
```

**Mode rules (`06 → §4.4`):** `lexical` never reads `models:` or downloads; a missing model is fetched on first need with its size stated, or refused offline; an embedder change re-embeds; `abstain_below: auto` resolves only for calibrated reranker ids, else abstention is off; allow-listed local ids carry a licence-provenance field.

**`lexical:` detection (`05 → ## 4`).** `pg_textsearch` is used if it is listed in `pg_extension` and its library is loaded; otherwise `tsvector-bm25`. The product never falls back silently to `ts_rank`.

**TLS depends on the engine.**
- **Under (c), TypeScript:** `pg` does `verify-full`, takes a CA file, takes a password as an async function, and has an `enableChannelBinding` option. `pg` has no service files, and its `.pgpass` support is deprecated. OS roots need `tls.getCACertificates('system')`, from Node 22.15 / 23.10. postgres.js skips verification under `require`. So the product maps `tls:` onto `pg` itself, with a **Node ≥ 22.15** floor (`reviews/README.md → ## Must Fix`).
- **Under (b-pg), Python:** libpq gives `verify-full`, `sslrootcert=system` and `channel_binding` natively (`03 → §2`).
- **Under either:** HTTPS fetches use the OS trust store, an optional CA, and no "insecure" switch (`03 → §4`).

**Source (`03 → §3`).** The product owns the local path and git. Everything else is "bring your own sync" into a directory. Real paths are resolved (#200).

**Store (`03 → §1`; `05 → ## 4`).** Extension install is an admin step. The schema holds a `text` column and a `to_tsvector('english', text)` column built from one expression and one `text_config`. Either index type can then be added later without changing the data. Tenancy is a schema or database per corpus.

## 5. Cross-fork decisions

### 5.1 Runtime: the maintainer's choice between (c) and (b-pg)

**Round 1 is superseded.** Round 1 recommended one TypeScript engine under ruling 5, which R2.1 withdrew. Fork 04 scored five architectures evenly, each with the same delivery kit, and ranks (c) one TypeScript engine narrowly ahead of (b-pg) one Python engine on `pgembed`, then (a) an engine per store type, (b-other) and (d), at **low to moderate** confidence (`04 → ## 4`). The top two are close; the choice is the maintainer's.

| | **(c) One TypeScript engine** | **(b-pg) One Python engine** |
|---|---|---|
| Embedded store | PGlite in process: PostgreSQL 18.6, single connection, 32-bit WASM, untested at 10⁵–10⁶ chunks | `pgembed`, a child Postgres **17.9** server; two sessions share one server (Documented) |
| Build cost | One-indexer lock or attach-to-`serve` for concurrent sessions (§5.4) | None for sessions; `pgembed` shares one server |
| Remote store | New `pg` store, pool and TLS mapping; Node ≥ 22.15 | Exists today on psycopg; libpq TLS is native |
| Same results on both stores? | One dialect; PGlite 18.6 against the remote host's major (**Unconfirmed** off 18) | One dialect under ordinary-SQL BM25; `pgembed` 17.9 against the remote host's major (**Unconfirmed**) |
| Primary / second install | `npx` / `uvx`, through a ~60 MB unofficial Node wheel (the `basedpyright` precedent) | `uvx` / `npx` with no clean precedent; MCPB favours Node |
| Platform gaps | Whether PGlite's WASM bundles in a wheel is **Unconfirmed** | No wheel for Intel Macs or macOS before 15; no `pg_textsearch` on Windows or Alpine |
| Licence | Own code + PostgreSQL | The wheel carries an unloaded AGPL `pg_search` binary with no notices; dropping it means a 6×3 build matrix per release |
| Eval harness | Kept as is | Ported: 15 modules, 56 imports |
| Python lever | Install path only | Install path and source |
| Measured with models | ~300 MB, 1.2 s first call, 2.0 GB RSS | 929 MB env, 6.9 s (wrapper included), 1.1 GB RSS |

Sources: `04 → (b) One Python engine`, `(c) One TypeScript engine`, `### The options, scored evenly`.

**The deciding facts (Inference).**
- **For (c):** it covers every platform; it keeps the eval harness; and it starts fastest as measured.
- **For (b-pg):** the remote store and its TLS already exist; sessions share one embedded server; and the code is in Python, which RAG engineers work in. The Python lever is Documented for RAG frameworks: LangChain's Python side is 6–15× its JavaScript side, and LlamaIndex archived its TypeScript port. That companies *require* Python is **Unconfirmed** (`04 → §1`).

**Opt-in models: a narrow tilt toward (b-pg) (Inference, this synthesis; opt-in modes only).**
- **Nemotron** runs only on PyTorch with remote code (`06 → §3.1`). Under (c) it needs a Python sidecar or a hosted reranker; under (b-pg) it still brings `torch` and `trust_remote_code`, a security-review point of its own.
- **Granite** does not tilt much. Transformers.js has supported ModernBERT since 3.2.1, and the embedder's community export is a Transformers.js model; only the reranker's sequence-classification export is untested there. The product owes its own ONNX export under either runtime (`06 → §3.2`). Loading it in Python as a `CrossEncoder` means `sentence-transformers` and `torch`, the 929 MB environment, unless Python also uses the ONNX export (`reviews/README.md → ## Round 2 review`).

**R2.3 narrows the measured gap:** the 2.0 GB and 6.9 s were measured with models loaded; the model-free default is unmeasured under both (`04 → ## 4`).

**The settling tests** (`04 → ## 4`, extended for symmetry): §7 step 2 is fork 04's one-day test, with two sessions run on PGlite as well as on `pgembed`; §7 step 3 is the embedded-store scale probe on both stores.

**Fork 04's ranking stands unless** a result moves it. Each outcome favours one side:
- a buyer requires Python source → (b-pg);
- PGlite fails the 10⁵-chunk probe, or two sessions on one directory even under the §5.4 lock or attach design → (b-pg);
- `pgembed` gains Intel and older-macOS wheels and a licence-clean build → (b-pg);
- `pgembed` fails its first run, two sessions or the scale probe → (c);
- a need for a recent `pg_textsearch` in the embedded store → (c) (`pgembed` ships 0.6.1).

Option (a) works today but builds every feature twice; (d) is a rewrite.

### 5.2 Lexical engine: BM25 in plain SQL everywhere, one fast path

**Round 1 left this provisional; round 2 decides it** (`05 → ## 4`, moderate confidence).
- **Why `pg_textsearch` alone fails.** It runs on 2 of fork 05's 8 provider rows (Cloud SQL/AlloyDB in Preview, and self-hosted); HorizonDB, outside those rows, is also in Preview. Supabase and DigitalOcean rank `tsvector` without IDF. Supabase's BM25 route is a separate ParadeDB replica. Neon's `lakebase_text` exists only on Neon and Databricks, under an unstated licence (`05 → ## 2`).
- **Built-in ranking is not a fallback:** no IDF, and `websearch_to_tsquery` requires every term; one practitioner run (**secondary**) gave `ts_rank` nDCG@10 0.07 against BM25's 0.69 (`05 → ## 3`).
- **The choice** is option (c) of fork 05's options (a) to (e2): `tsvector-bm25` on all 8 rows and in PGlite, plus `pg_textsearch` as the one fast path. PGlite takes the fast path. `pg_search`, VectorChord and `lakebase_text` are not first-release fast paths; `lakebase_text` is first in line if Neon users ask.
- **Parity is a test, not a hope.** `pg_textsearch`'s source shows the same tokeniser input, the IDF `log(1 + (N − df + 0.5)/(df + 0.5))`, length as the sum of positions, `k1` 1.2 and `b` 0.75. `pgembed`'s 0.6.1 uses the same formula (`reviews/05-managed-postgres-lexical.md → ## Re-review`).
- **The parity criterion.** Measure right after `REINDEX`, with `<@>` scores negated. Per query, the maximum absolute score difference on the shared top 10 must be ≤ 1e-3, and the order must be identical, except between rows whose scores differ by ≤ 1e-3.
- **Latency is the risk.** With no WAND, every matching row is scored. The only prior art found is about 1 s at 5×10⁵ rows. Two statistics designs are to be tested: per-term statistics written at index time, or per-query counts. A rare-term candidate bound stays off by default, because it would break parity.
- **The fallback.** If `tsvector-bm25` misses the budget at 10⁶ chunks, (c) is kept up to a stated size, and above it the product requires a `pg_textsearch` host or the product's image.

### 5.3 Default mode and models

**Default: model-free `lexical` (R2.3; `06 → §4`, high confidence).**
- **What it saves:** about 346 MB on TypeScript; up to about 1.15 GB on Python (an upper bound, since the venv without models was never measured); the model download; and every model licence question. Its cold start and build time are unmeasured; the build is expected to take seconds (**Inference**).
- **It cannot be built today**, in either runtime (`06 → §4.2`):
  - **Store:** `embedding vector(N) NOT NULL` (`store.ts:80`, `store.py:124`).
  - **Refresh:** it requires an embedder and embeds every changed chunk (`refresh.ts:58-63`, `:97`; `refresh.py:49-50`, `:94`).
  - **Session:** it loads both models before the mode is known (`session.ts:45-51`; `service.py:172-173`).
  - **Fix:** a nullable or separate vector column, a store opened without a dimension, and models loaded lazily by mode. Turning a model mode on later then costs one embedding pass, not a rebuild.

**The evidence for hybrid + rerank (`06 → §1.3`, Inference):**
- **Strong** on average over public benchmarks: BEIR +11 % nDCG@10, peer-reviewed.
- **Moderate at best** where query wording differs from the documents': a vendor study with LLM-judged labels, BEIR's FiQA and TREC-COVID, WixQA; EnterpriseRAG-Bench points the other way for vectors alone.
- **Contradicted** for identifier-style queries: Azure's keyword row and this repository's catalog both have lexical winning.

So the maintainer's lean toward hybrid + rerank for business corpora holds for vocabulary-mismatch corpora, at moderate strength. #199 sets how strongly to recommend it.

**Models for the opt-in modes (`06 → §3`, Inference, moderate confidence):**

| Role | Model | Licence and MS MARCO | Cost or gap |
|---|---|---|---|
| English embedder (`fused`) | `granite-embedding-small-english-r2` | Apache-2.0; MS MARCO excluded per IBM | Same 384 d and the same MTEB-v2 retrieval score as bge-small; 8192-token window; ONNX from the community only, so pin it or export one |
| English reranker (`fused-rerank`) | `granite-embedding-reranker-english-r2` | Apache-2.0; MS MARCO excluded per IBM | 149M parameters (~6.5× today's); third-party ONNX only; CPU latency **Unconfirmed**; the `0.32` threshold must be recalibrated |
| Multilingual embedder | `granite-embedding-97m-multilingual-r2` | Apache-2.0; the exclusion is inferred from a "permissive data" statement | Official ONNX, 384 d |
| Multilingual reranker | NVIDIA `llama-nemotron-rerank-1b-v2`, **to be measured on CPU**; becomes the local default if it passes | OpenMDW-1.1 plus Llama 3.2 terms; MS MARCO excluded per NVIDIA | 1.24B parameters, PyTorch with remote code, no ONNX |
| Hosted, by configuration | Cohere or Voyage rerank; embedding APIs | Vendor terms | `egress: allow`; text leaves the machine |

**The licence picture (`06 → §2`).** MS MARCO is for "non-commercial research purposes only". Whether trained weights inherit that is legally unsettled. In practice, IBM and NVIDIA exclude it and Microsoft defers to legal review. Today's pair is affected:
- The reranker (`ms-marco-MiniLM-L6-v2`) is trained on MS MARCO.
- bge-small is **likely** affected, through its recipe (mMARCO-Zh, and its sibling bge-m3); this is **Unconfirmed**.

So the risk sits on `fused` and `vector` too. Most popular alternatives (e5, nomic, gte, jina v2, Qwen3, all-MiniLM) also list MS MARCO.

**Abstention (`06 → §4.1`).** `lexical` ships **with no calibrated abstention claim**. An IDF-coverage figure for the top hit is exposed as a **signal to test on #199's negatives, not a claim**; it is related to the pre-retrieval IDF predictors in the literature, which are generally weak. A `near` negative shares the query's words by construction, so it is unlikely to separate. Abstention stays a property of `fused-rerank`, recalibrated for each reranker. Fork 05's dead-tuple drift matters only if a lexical threshold is ever adopted.

### 5.4 Embedded store at scale and concurrency

Round 1's concurrent-session risk: under (b-pg), `pgembed` sessions share one server, leaving a stale pid, network-filesystem locking and concurrent refreshes to test (`04 → (b-pg)`). Under (c) it stands: PGlite is single-connection, so one indexer per directory (a lock, or sessions attaching to a running `serve`). Either store at 10⁵–10⁶ chunks is **Unconfirmed** (§7 steps 2, 3 and 5); if it fails, large corpora use the remote mode.

## 6. Risks

**Licence** (`06 → §2`; `04 → (b-pg)`; `05 → ## 4`; `03 → §1`, `§3`; mitigations Inference):
- **MS MARCO in today's models:** the reranker certainly, bge-small likely. Mitigation: the model-free default plus the Granite pair. The image ships no weights until a policy exists.
- **Llama 3.2 terms on the Nemotron reranker:** a 700M monthly-active-user clause, an acceptable-use policy and attribution. How these combine with OpenMDW is a maintainer question. IBM's internal and synthetic training data is taken on IBM's word.
- **AGPL inside `pgembed` (option b-pg):** the wheel contains ParadeDB's `pg_search`, never loaded unless created, with no AGPL text, source offer or upstream notices, so scanners will flag it. A PyPI dependency does not redistribute it; an image or offline bundle does, with AGPL's duties for that binary (Inference, not legal advice).
- **ParadeDB, VectorChord (AGPL or ELv2), Airbyte (ELv2):** do not depend on them or bundle them. An ELv2 component would bar a hosted tier (`05 → ## 4`).

**Scale (`03 → §6`; `05 → ## 3`, Inference):**
- A model build at 10⁶ chunks takes about 17 h of wall time. A lexical-only build is unmeasured.
- PGlite's index would be about 17 GB.
- `tsvector-bm25` latency at 10⁶ chunks is untested.
- The `REINDEX` lock duration is unmeasured.

**`pg_textsearch` index-statistics drift (`05 → ## 3`).** `pg_textsearch` uses "physical index statistics, not MVCC-filtered corpus statistics". Dead tuples therefore count in `N`, `df` and `avg_doc_len` until `REINDEX` or compaction. Its scores match `tsvector-bm25` only right after a rebuild. Any score threshold shared across hosts must allow for this, or `tsvector-bm25` adopts the same "as of last rebuild" rule.

**Security gaps in today's code, now filed (R2.5):**
- [#200](https://github.com/firu-daniel/autonomous-sdlc-harness/issues/200): a symlink lets a file escape the corpus root (`03 → §3`).
- [#201](https://github.com/firu-daniel/autonomous-sdlc-harness/issues/201): `/health` returns the driver's error text unreduced (`03 → §2`).
- [#202](https://github.com/firu-daniel/autonomous-sdlc-harness/issues/202): HTTP on loopback lacks `Host`/`Origin`/content-type checks (`03 → §5`).
- [#203](https://github.com/firu-daniel/autonomous-sdlc-harness/issues/203): no reconnect after a Postgres restart (`03 → §2`).

Covered by the design instead: DDL and writes on every query (the index/serve split); prompt injection from third-party corpora (provenance with every hit).

**Positioning, stated neutrally (`02 → ## Positioning, store and runtime`).** mcp-local-rag already ships the local shape, and knowledge-rag self-reports a 75,016-chunk run. Two differentiators remain:
- a shared remote store, with **one ranking on every host**, which fork 05's design makes concrete;
- a published relevance record.

Round 1's "calibrated abstention" applies only to the opt-in `fused-rerank` and must be recalibrated for Granite.

## 7. What to do first

**Round 1's step list is superseded.** Its steps 1–2 split into steps 1, 3, 4 and 5 below (lexical build, embedded-store probe, #199's evals, 10⁶ latency); its licence step is step 7; its remote-store and reconnect steps are step 8; its steps 6–8 (extraction, serving, packaging) survive as step 10; steps 2, 6 and 9 are new. All thresholds are proposals (Inference) for the maintainer to confirm before the run (§8 #22).

| # | Step | Exit criterion |
|---|---|---|
| 1 | **Lexical-engine build branch, in both runtimes**, before steps 2–3 and #199's eval branches (`05 → ### The confirming experiment`, step 0). `tsvector-bm25` with both statistics designs and the bound off, in the TS PGlite store and the Python Postgres store (which also reaches `pgembed`); the two columns and detection; the vectorless store, refresh and lazy-model session from §5.3 in each session. Both runtimes are needed because steps 2–3 measure both | Passes on `fixture-catalog` and `self-docs`; fork 05's parity criterion against `pg_textsearch` on the three committed corpora; a lexical-only index builds with no model present, in each runtime |
| 2 | **One-day runtime test** (§5.1): model-free footprint of both backends; `pgembed` clean install and first run; two sessions refreshing at once on one `pgembed` directory **and** on one PGlite directory, the PGlite case run with the §5.4 lock or attach-to-`serve` design; fork 05's SQL on both embedded stores against the conformance corpus; the TS wheel from a PyPI-only mirror | Figures recorded; no error or corruption from two sessions on either store (for PGlite, under the lock or attach design) |
| 3 | **Embedded-store scale probe** at 10⁵ chunks (lexical-only), on PGlite and on `pgembed` | Per store, a go if build ≤ 3 h, RSS ≤ 4 GB and `lexical` p50 ≤ 200 ms (round 1's thresholds). With step 2, the maintainer picks (c) or (b-pg) |
| 4 | **#199's eval branches** (#199 designs them). Requested of them: fork 05's lexical arms, including an OR `ts_rank_cd` arm; the Granite pair beside today's models; the IDF-coverage signal on negatives; and, as a request touching #199's query-set question, queries tagged identifier or low-overlap | Parity holds on #199's corpora; a recommendation on when to turn on `fused` and `fused-rerank`; a go or no-go on lexical abstention |
| 5 | **Latency at 10⁶ chunks**, outside #199: #199's scale corpus replicated (no labels), on the product's server Postgres image (`tsvector-bm25` both designs, bound off and on; `pg_textsearch`) and on the chosen embedded store | `lexical` p50 ≤ 200 ms and p95 ≤ 1 s per store; the bound loses ≤ 1 % of the top 10, or stays off; above a failing size the fallback of §5.2 applies |
| 6 | **Model measurements**: Granite reranker CPU p50 and RSS at 20 and 10 candidates and its ONNX path in the chosen runtime; Nemotron on CPU; `abstain_below` for Granite | Figures recorded; Nemotron becomes the local multilingual default or stays measured |
| 7 | **Licence policy** (maintainer): an "avoid MS MARCO-trained weights" rule and its reach; the Llama 3.2 terms; `pgembed`'s AGPL binary if (b-pg) | A recorded decision before any image carries weights or `pgembed` |
| 8 | **Remote store for the chosen engine**: pool, reconnect (#203), per-connect tokens; a managed host without `pg_textsearch` (Supabase or RDS) | A restart survived; a token re-minted; the same scores as the local run, with no extension or superuser |
| 9 | **Security fixes #200–#202**, landable here now | Issues closed |
| 10 | **Extraction, index/serve split, `serve --http`, packaging** | `ragscene index` and `search` work on a non-harness directory; a cross-site `text/plain` POST is refused; each shape reaches a first query on a clean machine |

## 8. Open questions

Source (fork, open-question number), then who settles it.

**Engine**
1. Does a target buyer require Python source, or only a Python install path? 04 OQ1. Maintainer, through three to five prospect conversations.
2. Model-free RSS and cold start of each backend. 04 OQ4. Test (§7, 2).
3. Do PGlite and `pgembed` hold at 10⁵–10⁶ chunks (build, RSS, size, p50), and with two sessions on one directory? 01 OQ5; 02 OQ1; 03 OQ9; round 1 review. Test (§7, 2, 3).
4. Is `pgembed` fit: first run, shared-server edge cases, macOS coverage, maintenance outlook, AGPL? 04 OQ2. Test (§7, 2) plus a licence check.
5. Do PostgreSQL 16/17 give the same `tsvector` BM25 results as 18? Bears on both options (embedded store against remote host). 04 OQ3. Test.
6. Can the TypeScript engine, PGlite included, ship as a wheel from a PyPI-only mirror? 04 OQ5. Test (§7, 2).
7. Does a code-point chunking spec change anchors? Can one ONNX artifact narrow the tolerance band across runtimes? 04 OQ6, 7. Test.

**Lexical**

8. `tsvector-bm25` latency per statistics design at 10⁶ chunks, and the bound's recall cost. 05 OQ1. Test (§7, 5).
9. Score parity with `pg_textsearch`, after `REINDEX`. 05 OQ2. Test (§7, 1).
10. How far an OR `ts_rank_cd` trails BM25 on business docs. 05 OQ3. Test (§7, 4).
11. Write concurrency of the per-term statistics table under several indexers; tenancy by `search_path`; the open path on a pre-provisioned schema. 05 OQ5; 01 OQ4; 03 OQ2, 3. Test.
12. `lakebase_text`'s licence; whether the hyperscaler Previews reach GA, and at which version; Crunchy Bridge availability. 05 OQ4, 6; 03 OQ1. Documentation, watched over time.

**Models and modes**

13. Does hybrid + rerank beat `lexical` on business corpora, and for which query types? 06 OQ1; 01 OQ2. #199.
14. Does Granite's 8192-token window fix the long-section misses? 06 OQ3; 01 OQ6. #199 (its question 3).
15. Granite reranker CPU p50 and RSS, and its sequence-classification ONNX export in Transformers.js; Nemotron on CPU. 06 OQ2. Test (§7, 6).
16. `abstain_below` for Granite; can IDF coverage separate negatives? 06 OQ4. Test (§7, 4, 6).
17. Is "avoid MS MARCO-trained weights" the rule? Does it extend to undisclosed or scraped training data? Are the Llama 3.2 terms acceptable? 06 OQ5; 01 OQ9. Maintainer, possibly with legal advice (§7, 7).
18. Which hosted providers come first? 06 OQ6. Maintainer.
19. Lexical-only build time at 10⁵ chunks. 06 OQ7. Test (§7, 3).

**Product**

20. A hosted tier (which decides whether ELv2 could matter); per-user ACLs. 02 OQ6; 05 OQ7; 03 OQ10. Maintainer.
21. HNSW rows at `ef_search = 40`. 03 OQ5. #199 (its question 9). Refresh cost over a mount; Linux parity; download time; ChatGPT static keys. 01 OQ3, 8; 02 OQ3, 5. Test.
22. The §7 thresholds. Synthesis; 05 OQ8. Maintainer, before step 1.
23. Third-party contributions in the paths to be moved. 01 §7. Maintainer (`git log` audit).

## Fork files and reviews

| Fork | File | Review |
|---|---|---|
| Brief | [`_brief.md`](_brief.md) | [`_review_brief.md`](_review_brief.md) |
| 01 — current mechanism | [`01-current-mechanism.md`](01-current-mechanism.md) | [`reviews/01-current-mechanism.md`](reviews/01-current-mechanism.md) — PASS |
| 02 — distribution shapes | [`02-distribution-shapes.md`](02-distribution-shapes.md) | [`reviews/02-distribution-shapes.md`](reviews/02-distribution-shapes.md) — FAIL, FAIL; applied and verified |
| 03 — sources, database, security | [`03-sources-database-security.md`](03-sources-database-security.md) | [`reviews/03-sources-database-security.md`](reviews/03-sources-database-security.md) — FAIL, PASS |
| 04 — engine architecture | [`04-engine-architecture.md`](04-engine-architecture.md) | [`reviews/04-engine-architecture.md`](reviews/04-engine-architecture.md) — FAIL, PASS |
| 05 — managed Postgres and lexical | [`05-managed-postgres-lexical.md`](05-managed-postgres-lexical.md) | [`reviews/05-managed-postgres-lexical.md`](reviews/05-managed-postgres-lexical.md) — FAIL, PASS |
| 06 — models and modes | [`06-models-and-modes.md`](06-models-and-modes.md) | [`reviews/06-models-and-modes.md`](reviews/06-models-and-modes.md) — FAIL, PASS |
| 07 — extraction plan | [`07-extraction-plan.md`](07-extraction-plan.md) | [`reviews/07-extraction-plan.md`](reviews/07-extraction-plan.md) — FAIL, FAIL; all applied, no third review |
| Synthesis (round 1) | this file's predecessor | [`reviews/README.md`](reviews/README.md) — FAIL, PASS |

## Round 1 review response

Round 1's synthesis review (FAIL, then PASS) was applied in full; what it changed is either carried here (§4's Node driver facts, `allow_weaker`, §5.4) or superseded by round 2 (§5.1, §5.2, §7). Details: [`reviews/README.md`](reviews/README.md).

## Round 2 review response

Against `reviews/README.md → ## Round 2 review` (FAIL: 1 MF, 4 SF, 4 NtH). All applied.
- **MF1:** new §7 step 3 probes PGlite and `pgembed` at 10⁵ chunks with round 1's thresholds, marked as proposals; step 2 runs two sessions on both stores; step 5 names its stores; §8 #3 restored.
- **SF1:** the ranking is attributed to fork 04, and each reversal condition says which side it favours, including `pgembed` failing → (c).
- **SF2:** "one major version" removed; the version question applies to both options (§5.1 table, §8 #5).
- **SF3:** the model tilt is narrowed: Transformers.js supports ModernBERT, the ONNX export is owed either way, Python's `CrossEncoder` brings `torch`; Nemotron's `trust_remote_code` noted.
- **SF4:** step 1 builds in both runtimes, before steps 2–3.
- **NtH1–4:** step mapping corrected; HorizonDB separated from fork 05's two rows; §8 #14 and #21 point at #199 and the query tags are labelled a request; trimmed (the round 1 response and the §5.1 option list).

**Round 2 re-review** (PASS: 1 SF, 3 NtH), all applied: the PGlite two-session case now runs under the §5.4 lock or attach design, only a failure under it favours (b-pg), and the lock is a (c) build cost in the §5.1 table; l.3 names the Transformers.js facts; the step mapping says steps 2, 6 and 9 are new; §5.4 points at §7 steps 2, 3 and 5.
