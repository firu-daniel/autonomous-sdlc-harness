# RAG extraction research — Managed Postgres and the lexical engine

**Who reads this:** the maintainer deciding ruling R2.2: which lexical engine(s) the extracted product ships, and what it does on a managed Postgres without `pg_textsearch`. **It owns:** why Supabase, DigitalOcean, Neon, RDS, Railway and Render are popular with small and medium AI teams; the lexical and vector search each offers today; what the lexical options are worth; the lexical-engine decision; and the experiment that confirms it. **It does not own:** the managed-Postgres × `pg_textsearch` table, the engine licence table and the store's privilege needs (`03-sources-database-security.md` → `## 1. Store and database`, extended here, not repeated); the runtime split (`04-engine-architecture.md`); models and the model-free default (`06-models-and-modes.md`); #199's design.

## How this was researched

Date: 2026-10-28; every web URL was retrieved that day. Route: the round 1 synthesis (`README.md` → `## 4`, `### 5.2`, `## 7`) and fork 03 → `## 1`; vendor docs and pricing pages; the Stack Overflow 2025 survey; Datadog's State of Postgres; vendor and practitioner benchmarks; the PostgreSQL manual; the GitHub API for `supabase/postgres` and `timescale/pg_textsearch` (README and source); `gh issue view 199`. Statements are **Documented** (URL, or `path → heading`), **Inference** or **Unconfirmed**, as in `docs/copilot-foundry-research.md` → `## How this was researched`; an unlabelled sentence carrying a citation is Documented. **Vendor-reported** marks a company's number about itself, **vendor benchmark** a benchmark by the seller of the thing measured, **secondary** a blog, mirror or press report.

Rulings applied: R2.1 (engine may differ by store; the client never sees which), R2.2, R2.3 (model-free default: the lexical engine **is** the default retrieval), R2.4 (#199 owns business-corpus measurement).

---

## 1. Why these providers keep coming up

### What the developer sees first

| Provider | Free tier | First paid step | AI pitch | Source |
|---|---|---|---|---|
| Supabase | 500 MB per project, 2 active projects, paused after 1 week idle | Pro from $25/month, 8 GB disk | Whole backend plus pgvector; its own hybrid-search guide | https://supabase.com/pricing, https://supabase.com/docs/guides/ai/hybrid-search |
| Neon | 1 GB per project, 20 GB total, 100 CU-hours, suspends after 5 min | Usage-based, "no monthly minimum"; $0.106/CU-hour | Branching, scale to zero; `lakebase_vector`, `lakebase_text` | https://neon.com/pricing, https://neon.com/guides/lakebase-vector-bm25-search |
| DigitalOcean | None; $5 credit | $15.15/month: 1 vCPU, 1 GiB, 10 GiB | "Vector databases": Weaviate, OpenSearch or PostgreSQL | https://www.digitalocean.com/pricing/managed-databases, https://docs.digitalocean.com/products/vector-databases/ |
| Railway, Render | — | — | Run any image; ParadeDB's one-click Railway template | https://www.paradedb.com/docs/deploy/overview, https://railway.com/deploy/paradedb |

### Adoption evidence

- **Stack Overflow 2025, all respondents:** databases: PostgreSQL 55.6 %, Supabase 6 %. Cloud platforms: AWS 43.3 %, Azure 26.3 %, Google Cloud 24.6 %, DigitalOcean 10.7 %, Supabase 5.4 %, Railway 1.5 %; Render and Neon not listed (https://survey.stackoverflow.co/2025/technology/).
- **Datadog, data to May 2026:** 65 % of organisations running Postgres in production have a cloud instance (62 % a year earlier), 44.6 % a self-hosted one (47.6 %); pgvector usage grew 24 % in five months, "the fastest-growing non-bundled extension"; no per-provider split (https://datadoghq.com/state-of-postgres).
- **Supabase funding, Oct 2026 ($150M, Turso acquisition):** "approximately 70% of new databases are being created by agents or AI-driven tools … adding more than 1 million users and 4 million databases per month", "more than 13 million developers" (https://pulse2.com/supabase-raises-150-million-and-acquires-turso/, **vendor-reported**, **secondary**). At the June 2026 Series F the CEO said "Agents are now deploying the majority of databases on our platform" (https://itbrief.co.uk/story/supabase-raises-usd-500-million-in-series-f-round, **secondary**).
- **Databricks–Neon, May 2025:** "over 80 percent of databases provisioned on Neon were created automatically by AI agents" (https://www.techrepublic.com/article/news-databricks-neon-acquisition/, **vendor-reported**, **secondary**).
- Timescale's State of PostgreSQL 2024 gives no per-provider split found; DB-Engines ranks engines, not hosts (**Inference**: not usable here).

**Why (Inference).** Supabase: a free tier plus a whole backend, and the default database of AI app builders. Neon: scale-to-zero and branching, which agent-provisioned databases want. DigitalOcean: flat prices for teams already on it; with no free tier, its 10.7 % is a general-cloud figure. All sell pgvector as "AI ready"; none of that implies large corpora.

### Who serves 10⁵–10⁷ chunks

- Supabase tests HNSW up to 1,000,000 vectors: **Large** compute at 384 dimensions, **2XL** at 1536 (https://supabase.com/docs/guides/ai/choosing-compute-addon). Their prices were not gathered (**Unconfirmed**).
- DigitalOcean recommends pgvector for "small to medium vector datasets" and OpenSearch where hybrid keyword and vector search is core (https://docs.digitalocean.com/products/vector-databases/postgresql/).
- Neon claims `lakebase_vector` scales "to over 1 billion vectors on a single index" (guide above; **vendor claim**).
- **Inference:** at ~17 kB per chunk (`03-sources-database-security.md` → `## 6. Scale`), 10⁵ chunks is ~1.7 GB, past every free tier; 10⁶ (~17 GB) is a paid instance anywhere.
- **Large companies (Inference, weakly evidenced):** the hyperscaler they already contract with (AWS leads at 43.3 %): RDS/Aurora, Azure Flexible Server, Cloud SQL/AlloyDB, plus self-hosted (44.6 % of organisations per Datadog). Procurement, IAM and residency decide, not search features. No source ranks Supabase or Neon in large enterprises (**Unconfirmed**).

**Consequence.** The target user is most likely on RDS/Aurora, Azure, Cloud SQL or self-hosted, then on Supabase or Neon for small teams. Of those, only Cloud SQL, AlloyDB and HorizonDB offer `pg_textsearch`, in Preview (fork 03).

---

## 2. Lexical and vector search per provider, today

What each offers **instead of** `pg_textsearch`, extending fork 03's table.

| Provider | Lexical/BM25 offered | Vector | Custom extensions |
|---|---|---|---|
| Supabase | Built-in FTS; the hybrid guide ranks with `ts_rank_cd(fts, websearch_to_tsquery(...))`, RRF with pgvector, `rrf_k` 50, `match_count` capped at 30 (hybrid guide). PGroonga, for "Japanese, Chinese, etc." (https://supabase.com/docs/guides/database/extensions/pgroonga), scored by "how many keywords are included", not BM25 (https://pgroonga.github.io/reference/functions/pgroonga-score.html). `rum` in the image. No `pg_search`, `pg_textsearch` or `vchord_bm25` (`supabase/postgres` → `nix/ext`, GitHub API). **Partner route:** ParadeDB as "a logical replica of your primary database", deployed by the user "in an environment reachable from Supabase" (https://supabase.com/partners/integrations/paradedb) | `pgvector` | `pg_tle` in the image |
| DigitalOcean | `tsvector` + GIN "hybrid full-text and vector search", no BM25 named (vector-databases PostgreSQL page). No `pg_search`, `pg_textsearch`, `vchord_bm25`, PGroonga; `rum` on PG 14–17 (https://docs.digitalocean.com/products/databases/postgresql/details/supported-extensions/). A public request for `pg_search`/`pg_textsearch` exists (https://ideas.digitalocean.com/managed-database/p/i-am-currently-evaluating-digitalocean-managed-databases-for-a-production-worklo) | `vector`, `vectorscale` | Standard: vote or submit an idea; Advanced: contact support (same list) |
| Neon | `pg_search` deprecated 2026-03-19, retired 2026-09-21 (https://neon.com/docs/extensions/pg_search). `lakebase_text`: `lakebase_bm25` index on a `tsvector` column, `<@>` with `to_bm25query()`, PG 16+ (guide above); "available to all Neon users on Postgres 16+", needs shared preload libraries and a compute restart (https://neon.com/docs/changelog/2026-06-26) | `pgvector`, `lakebase_vector` | Neon's list |
| Databricks Lakebase | `lakebase_text`, Beta on GCP: `tsvector` column, `tsvector_bm25_ops`, `k1` 1.2–2.0 (default 1.2), `b` 0.75, `default_limit` 1000 (https://docs.databricks.com/gcp/en/oltp/projects/lakebase-text) | — | — |
| RDS, Aurora | Built-in FTS; no BM25 in the lists (fork 03) | `vector` 0.8.2 | `pg_tle` (**Unconfirmed**, not re-fetched) |
| Azure Flexible Server | Built-in FTS; no BM25 (fork 03) | `vector` | `azure.extensions` allowlist |
| Azure HorizonDB | `pg_textsearch`, "in **preview**"; indexes "plain `text` directly, not a persisted `tsvector` column" (https://learn.microsoft.com/en-us/azure/horizondb/ai/full-text-search) | `vector` | — |
| AlloyDB, Cloud SQL | BM25 **is** `pg_textsearch`, Preview, PG 17/18, `alloydbsuperuser` (https://docs.cloud.google.com/alloydb/docs/ai/create-bm25-index); Cloud SQL Preview (fork 03). Whether AlloyDB's hybrid guide uses BM25: **Unconfirmed** | `vector` | — |
| Tiger Cloud | `pg_textsearch` GA (fork 03) | `vector`, `pgvectorscale` | — |
| ParadeDB Cloud, BYOC | `pg_search`; Cloud is "our fully managed platform", GA not stated (https://www.paradedb.com/docs/deploy/overview) | `vector` | — |
| Railway, Render, Fly.io, DO App Platform | Render's managed PG: no BM25 (https://render.com/docs/postgresql-extensions). All run images: ParadeDB Community on all four, "no high availability or read replicas" (ParadeDB deploy page) | Per image | The image's |

**Findings (Inference unless cited).**

1. **No popular small-team provider offers a BM25 the product can use unchanged.** Supabase and DigitalOcean rank `tsvector` only; Supabase's BM25 route is a second, AGPL database the user runs. Neon's `lakebase_text` exists only on Neon and Databricks Lakebase, and neither page states a licence (`neon.com/docs/extensions/lakebase_text` returned 404).
2. **`lakebase_text` indexes a `tsvector` column; `pg_textsearch` indexes `text`.** A schema with both a `text` and a `to_tsvector('english', text)` column can take either index later without a data change.
3. **The hyperscalers converge on `pg_textsearch`** (Google, Microsoft), in Preview; AWS and Azure Flexible ship nothing.
4. **"Run the image" is a real route.** Railway, Render, Fly.io and a droplet run the product's Postgres image (pgvector + `pg_textsearch`), without managed HA or backups.
5. Fork 04 is weighing `pgembed`, an embedded Postgres 17 for Python whose wheel listing holds pgvector, `pg_textsearch` 0.6.1 and `pg_search` (`04-engine-architecture.md` → `### (b) One Python engine`, `pgembed` row). Its extensions are optional pip packages (`pgembed-pgtextsearch`; the README shows `'pgtextsearch': False` and does not name `pg_search`) (https://github.com/Ladybug-Memory/pgembed), so the fast path there depends on the install. It is an embedded host, not a managed one, and changes no row above.

---

## 3. What the lexical options are worth

### Built-in ranking

- "The ranking functions do not use any global information" (https://www.postgresql.org/docs/18/textsearch-controls.html): no IDF. Length normalisation is opt-in flags (`1`: 1 + log length; `2`: length; `8`/`16`: unique words), not against the corpus average as BM25's `b` does. HorizonDB's page lists "no term saturation, no length normalization, no native IDF" (Learn page above).
- `plainto_tsquery`/`websearch_to_tsquery` match AND-like: every term must be present (https://www.pedroalonso.net/blog/postgres-bm25-search/). Supabase's guide therefore returns only chunks holding every query word (**Inference**).

### Published comparisons

| Source | Corpus | Result | Caveat |
|---|---|---|---|
| Pedro Alonso (**secondary**, practitioner) | BEIR SciFact, 5,183 abstracts, 300 queries; `pg_textsearch` 1.3.0 | nDCG@10: `ts_rank` **0.07**, BM25 **0.69**, vector 0.66, hybrid RRF 0.70 | The author blames AND matching; no OR `ts_rank` arm (URL above) |
| VectorChord-bm25 (**vendor benchmark**) | BEIR (trec-covid, scifact, nq, fever…) | nDCG@10 "comparable" to Elasticsearch; top-1000 QPS ~3× | No `ts_rank` arm (https://blog.vectorchord.ai/vectorchord-bm25-revolutionize-postgresql-search-with-bm25-ranking-3x-faster-than-elasticsearch) |
| This repository | Real catalog, 1,960 chunks | `pg_textsearch` `lexical` recall@5 0.909 vs `fused-rerank` 0.795; p50 1.7 vs 1099.7 ms | One repetition, technical corpus (`01-current-mechanism.md` → `## 5`) |

No independent run of an OR `ts_rank` against BM25 was found (**Unconfirmed** size of the pure ranking gap). **Inference:** the 0.07 measures the AND filter, not IDF.

### Does a weak lexical arm matter under fusion and reranking?

- RRF fuses ranks only (`docs/retrieval.md` → **Search.**). In Alonso's run hybrid added 0.01 over BM25.
- RRF is "sensitive to its parameters", and a tuned convex combination beats it (Bruch, Gai, Ingber, https://arxiv.org/abs/2210.11934); equal-weight RRF adds a weak arm's noise at full weight (**Inference**).
- A reranker reorders candidates only. An AND-filtered arm returns fewer, and misses exactly the vocabulary-mismatch cases #199 is about (**Inference**).
- **Under R2.3 this is mostly moot:** the default has no vector arm and no reranker. A weak arm can be tolerated inside the `fused-rerank` option, not as the default (**Inference**).

### BM25 in ordinary tables (`tsvector-bm25`): prior art

| Prior art | Design | Scale or speed found |
|---|---|---|
| Lantern, PGConf EU 2024, "A Simple Version of BM25 in Postgres" | `doc_id, term, tf, doc_len` rows: "Too slow!"; then one row per term with `doc_ids[]`, `fqs[]`, `doc_lens[]`, scored by a custom aggregate | 500k Quora rows: naive "Unusable", JSON aggregation ~3 s, custom aggregate ~1 s; no hardware and no per-query qualifier given. An "acceptable version" needs PL/Rust (https://www.postgresql.eu/events/pgconfeu2024/sessions/session/6012/slides/592/Di_Qi_LT_BM25.pdf, text decoded from the PDF) |
| `plpgsql_bm25` (Unlicense) | PL/pgSQL with its own tokeniser and stopword lists and several BM25 variants, so **not** a `tsvector` design | No numbers; "Adding a new document … requires rebuilding the whole BM25 index" (https://github.com/jankovicsandras/plpgsql_bm25) |
| ParadeDB guide (**vendor**, competing product) | `tsvector` + `ts_stat` BM25 is "very convoluted and very slow", a "proof-of-concept" | None (https://www.paradedb.com/learn/search-in-postgresql/bm25) |
| ParadeDB history | `pg_bm25` on Tantivy, renamed `pg_search` at v0.6.0 (https://www.paradedb.com/blog/introducing-search) | — |
| VectorChord-bm25 | Index method on `bm25vector`, Block-WeakAnd, at most `bm25_limit` (100) rows, "only tested against English" (https://github.com/tensorchord/VectorChord-bm25) | Vendor benchmark above |
| `pgx-bm25` 1.0, `pg_fts` 0.2.0 | C index methods, PostgreSQL licence; `pgx-bm25` for PG 17 and 18 on Snowball dictionaries, released 2026-10-07 (https://www.postgresql.org/about/news/pgx-bm25-10-postgresql-bm25-3396/); `pg_fts` PG 17+ (https://master.pgxn.org/dist/pg_fts/0.2.0/META.json) | None; no managed provider ships either (**Inference**: none of §2's lists names them) |

### What `pg_textsearch` computes, from source

- It parses `text` with the index's `text_config` and takes terms and frequencies from the resulting `TSVector` (`timescale/pg_textsearch` → `src/access/build.c` → `tp_extract_terms_from_tsvector`, lines 1102–1158). Document length is the sum of per-lexeme position counts (lines 1146–1152).
- IDF is `log(1 + (N − df + 0.5) / (df + 0.5))` (`src/scoring/bm25.c:27-38`); `avg_doc_len` is kept by the index (line 164). Defaults `k1` 1.2, `b` 0.75 (README). Statistics are per partition (README → `### Partitioned Tables`).

**So `tsvector-bm25` can reproduce it (Inference, by construction).** Over `to_tsvector('english', text)` built from the **same input expression and `text_config`** as the `pg_textsearch` index, use that IDF, `length = Σ positions` (capped by `to_tsvector` identically on both paths), `k1` 1.2, `b` 0.75. Scores should then agree to float precision. Relevance parity becomes a test to confirm, not a risk. **One drift:** `pg_textsearch` uses "physical index statistics, not MVCC-filtered corpus statistics" (`timescale/pg_textsearch` → `ARCHITECTURE.md`), so dead tuples count in `N`, `df` and `avg_doc_len` until `REINDEX` or compaction. A `tsvector-bm25` reading live rows matches it only right after a rebuild, which today's store issues after every refresh that wrote (`docs/retrieval.md` → `## How it fits together`, **Incremental refresh.**); write-time statistics could adopt the same "as of last rebuild" rule instead.

**Latency is the risk, as round 1 said.** Without WAND, every row matching any query term is scored; the only number found is ~1 s at 5×10⁵ short rows. Two designs to test: (i) **write-time statistics**, a `terms(lexeme, df)` table plus `N` and total length in `meta`, updated in the refresh transaction, where hot rows serialise concurrent writers; (ii) **query-time statistics**, `df` per query lexeme as a GIN count, with no write maintenance but a large count for common terms at 10⁶. A **rare-term candidate bound** (candidates from the rarer lexemes' GIN postings, scored with all lexemes) caps work but changes answers on the portable path only; it breaks cross-host parity unless it is off by default or the fast path is bounded the same way.

---

## 4. The options, decided

Coverage counts eight provider rows: Supabase, Neon, DigitalOcean, RDS/Aurora, Azure Flexible, Cloud SQL/AlloyDB, Railway/Render managed PG, self-hosted.

| Option | Real BM25 on | Relevance | Operating cost | Licence | Under R2.3 |
|---|---|---|---|---|---|
| (a) `pg_textsearch` only | 2 of 8 (Preview on the hyperscalers), plus Tiger, the product's image, PGlite | Best measured here | Least code; does not run on Supabase, Neon, DO, RDS, Azure Flexible, Render | PostgreSQL | Default cannot run where most users are |
| (b) Adapter with several native fast paths (`pg_textsearch`, `pg_search`, VectorChord-bm25, `lakebase_text`), fallback `tsvector-bm25` | 8 of 8 | Same on the fallback; each fast path has its own tokeniser and scorer (`pg_search` Tantivy, VectorChord its own, `lakebase_text` `k1` up to 2.0 and a 1000-row cap), so answers diverge by host unless each is parity-tested | One DDL, refresh rule, determinism test and parity test per engine | Using AGPL/ELv2 engines on the user's server is not distribution; shipping them in an image is; ELv2 bars a hosted tier (**Inference**; legal review **Unconfirmed**) | Default works everywhere; the cost is N parity tests |
| (c) `tsvector-bm25` everywhere; `pg_textsearch` as the one fast path | 8 of 8, PGlite included | Same scores by construction (§3); latency at 10⁶ untested | One scorer plus one parity test | Own code + PostgreSQL | Same ranking on every host |
| (d) Lexical outside Postgres: Tantivy (MIT) or SQLite FTS5 beside remote pgvector | 8 of 8 | Real BM25 | Two stores: lexical and vector results can describe different corpus states, which today's single store rules out (`docs/retrieval.md` → `## What this buys you`); each client or server keeps its own lexical copy | Permissive | Works, but the shared Postgres no longer holds the index |
| (e1) The product's image as the "remote" Postgres | Container hosts, self-hosted | `pg_textsearch` | User runs a database | PostgreSQL | Fine; self-hosting by another name |
| (e2) Search in a second system: Supabase's ParadeDB replica, or OpenSearch as DO recommends | Supabase (partner), DO | Real BM25 | A second, unmanaged database; breaks the one-store property like (d) | AGPL (ParadeDB), Apache-2.0 (OpenSearch) | Contradicts "plug in a Postgres" |

Read fairly, (b) and (c) differ only in **how many native fast paths** are admitted: zero, one or several. Each extra one adds a parity test and a licence question, and buys speed only.

### Recommendation

**Option (c): `tsvector-bm25` everywhere, with `pg_textsearch` as the one fast path. Confidence: moderate.**

1. Under R2.3 the default retrieval must be real BM25 on every Postgres the target user has. (a) fails most providers; (d) and (e2) break the one-store guarantee.
2. One fast path keeps parity work to one engine whose scoring is known from source (§3), so switching to it changes speed, not answers or scores. Scores matter because any lexical abstention threshold, still open (`README.md` → `### 5.2`), is one number across hosts; the dead-tuple drift (§3) is why parity is pinned at the post-`REINDEX` state.
3. Schema: a `text` column (indexed by `pg_textsearch`) **and** a `to_tsvector('english', text)` column (used by `tsvector-bm25`, a GIN index, and later `lakebase_bm25`), both from one expression and one `text_config`. Detection at connect: `pg_textsearch` in `pg_extension` and its library loaded (`SHOW pg_textsearch.library_version`), else `tsvector-bm25`. Never a silent fall to `ts_rank`; `ts_rank` is not offered as an engine.
4. `pg_search`, VectorChord-bm25 and `lakebase_text` are not first-release fast paths. `lakebase_text` is first in line if Neon users ask: same `tsvector` column, but its `k1` range and `default_limit` must be pinned for parity, and its licence is unstated.
5. **PGlite defaults to the fast path** (it runs `pg_textsearch`), so step 1's parity test also covers the embedded store. If fork 04 picks SQLite FTS5 or `pgembed` instead, that store needs its own parity row.

**What would change it.** If `tsvector-bm25` misses the latency budget at 10⁶, keep (c) up to a stated size and require a `pg_textsearch` host or the image (e1) above it. If scores differ beyond float precision, the scorer is wrong, since the inputs are the same, and is fixed rather than replaced by (b).

### The confirming experiment

#199 is a research branch: it "changes no code, no corpus, no query set and no eval" and ends in a proposed branch sequence (`gh issue view 199`), including a TTS-handbook eval run and a later GitLab-handbook scale eval. Its out-of-scope list excludes provisioning any remote Postgres. So this experiment needs a **code branch that builds `tsvector-bm25`** at the `DocStore` seam first (no store has one today), then rides as **extra arms** in the eval branches #199's document proposes. Thresholds are proposals (**Inference**) for the maintainer (`README.md` → `## 8` #16).

| Step | Where | Arms | Exit criterion | Round 1 `## 7` |
|---|---|---|---|---|
| 0. Build | New code branch, before #199's eval branches | `tsvector-bm25`, both statistics designs, candidate bound off | Passes on `fixture-catalog` and `self-docs` | Replaces step 1's build part |
| 1. Parity and relevance | #199's proposed TTS eval-run branch; also the three existing corpora | `lexical`: `pg_textsearch`, `tsvector-bm25`, OR `ts_rank_cd` with normalisation `1`, Supabase's `websearch_to_tsquery` + `ts_rank_cd`; `fused` with the first two | Right after `REINDEX`, with `<@>` scores negated (lower is better, `cli/src/retrieval/store.ts:276`): per query, max absolute score difference ≤ 1e-3 on the shared top-10, and identical order except between rows whose scores differ by ≤ 1e-3; `ts_rank` rows quantify what a non-BM25 default would lose | Replaces step 1's "within 0.02" with a score-level test |
| 2. Scale corpus | #199's proposed scale-eval branch (GitLab handbook) | Step 1's lexical arms | Step 1's criterion; build time and write cost per 1,000 chunks | Extends step 2's lexical part |
| 3. Latency at 10⁶ | Outside #199: GitLab chunks replicated to 10⁶; needs no labels | `tsvector-bm25` both designs, bound off and on; `pg_textsearch` | `lexical` p50 ≤ 200 ms, p95 ≤ 1 s; the bound loses ≤ 1 % of top-10, else it stays off | Extends step 2's 10⁵ p50 to 10⁶ |
| 4. Managed host | Outside #199: Supabase or RDS | Step 1's `tsvector-bm25` arms | Same scores as the local run; no extension or superuser | Narrows step 4 to the lexical arm |

---

## Open questions

1. `tsvector-bm25` latency at 10⁶, per statistics design, and the bound's recall cost. Test (step 3).
2. Score parity with `pg_textsearch`: formula and length are known from source (§3); confirm by test (step 1).
3. How far an OR `ts_rank_cd` trails BM25 on business docs; no published number. Test (step 1).
4. `lakebase_text`'s licence, and its GA on Databricks (Beta on GCP). Documentation or vendor.
5. Write concurrency of a `terms` table under several indexers. Test, with round 1's tenancy question (`README.md` → `## 8` #8).
6. Whether the hyperscaler Previews reach GA, at which `pg_textsearch` version. Watch.
7. Whether a hosted tier is planned; it decides whether ELv2 could matter. Maintainer.
8. The thresholds in §4. Maintainer, before step 1.

## Fork verdict

Supabase, Neon and DigitalOcean are popular for free or flat-priced, low-friction Postgres with pgvector, and Supabase and Neon say most new databases on them are created by AI tools (vendor-reported). None offers a BM25 the product can use unchanged: Supabase and DigitalOcean rank `tsvector` without IDF, Supabase's BM25 route is a separate ParadeDB replica, and Neon's `lakebase_text` is Neon/Databricks-only with no stated licence. `pg_textsearch` is GA only on Tiger Cloud and in Preview at Google and Microsoft, so (a) would leave the model-free default unable to run where most users are. This fork recommends (c): BM25 in ordinary SQL over a `tsvector` column on every Postgres, with `pg_textsearch` as the one fast path, used by PGlite too, and no silent `ts_rank` fallback. Confidence is moderate. Score parity is likely right after a rebuild, because `pg_textsearch`'s source shows the same tokeniser input, IDF and length; between rebuilds its dead-tuple statistics drift, which a shared abstention threshold must allow for; latency at 10⁶ chunks is the untested risk, with ~1 s at 5×10⁵ rows the only prior art. The experiment is a `tsvector-bm25` build branch, then extra lexical arms in the eval branches #199's document will propose, plus a label-free 10⁶ latency probe and a managed-host run outside #199.

## Review response

Against `reviews/05-managed-postgres-lexical.md`.

- **MF1 (#199):** applied: step 0 build branch; steps 1–2 ride #199's proposed branches; 3–4 outside #199.
- **MF2 (Supabase 70 %):** applied: Oct 2026 row, Pulse2 (secondary).
- **MF3 (`text` column):** applied: both columns, one expression, one `text_config`.
- **SF1 (OQ2 from source):** applied in §3; OQ2 is "confirm by test".
- **SF2 (scores, bound):** applied: score test; bound off by default.
- **SF3 (fair (b)):** applied: `tsvector-bm25` fallback.
- **SF4 (Supabase–ParadeDB):** applied, in §2 and (e2).
- **SF5 (`lakebase_text`):** applied. Neon changelog (primary), Databricks Lakebase row, 404 noted, OQ4 narrowed.
- **SF6 (HorizonDB primary):** applied; Learn page cited.
- **SF7 (round 1 §7):** applied; a column maps each step to the round 1 step it replaces or extends.
- **SF8 (PGlite path):** applied; recommendation 5.
- **Nice to Have:** 1 (PGroonga quote), 2 (DO extension route, ideas request), 3 (`pgx-bm25`), 4 (Lantern caveat), 5 (`plpgsql_bm25` not a `tsvector` design) applied; 6 (length) applied by trimming §1. Fork 04's `pgembed` is mentioned in §2 finding 5.

**Re-review (`## Re-review`).**

- **SF1 (physical index statistics):** applied. §3 names the dead-tuple drift; step 1 measures right after `REINDEX`; recommendation 2 and the verdict tie it to the shared abstention threshold.
- **SF2 (order vs tolerance):** applied. Order is checked except between rows within 1e-3, and `<@>` scores are negated first.
- **NH1 (`pgembed`):** applied. Fork 04's row is cited, and the extensions are noted as optional pip packages.
- **NH2 (`pgx-bm25`):** applied. It is listed for PG 17 and 18, and "no managed provider" is labelled Inference.
