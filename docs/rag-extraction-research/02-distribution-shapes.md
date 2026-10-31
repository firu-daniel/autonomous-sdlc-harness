# RAG extraction research — distribution shapes

**Who reads this:** the maintainer deciding what a standalone docs-retrieval product ships as, and the synthesis that follows the three forks. **It owns:** how comparable docs-retrieval and RAG systems are packaged, installed, configured and invoked; how they expose a choice of model provider; the shapes side by side; and which combination fits the target user. **It does not own:** how the current mechanism works or where it cuts out (`01-current-mechanism.md`), or ingestion from docs sources, the Postgres the store needs and the security of both connections (`03-sources-database-security.md`). Remote-MCP auth is covered here only as a packaging question.

## How this was researched

**Date and route.** Every web source was retrieved on **2026-10-28** with WebSearch and WebFetch. GitHub activity, stars, licences and latest releases came from the GitHub REST API (`gh api repos/<owner>/<repo>`, `.../releases/latest`) on the same day.

**Sources.** Official docs and READMEs first: modelcontextprotocol.io, code.claude.com, support.claude.com, code.visualstudio.com, and vendor docs and repositories. Aggregators, forums and search summaries are marked **secondary**.

**Three kinds of statement**, as in `docs/copilot-foundry-research.md` → `## How this was researched`:

1. **Documented**: a source states it, and the URL is given.
2. **Inference**: this fork's own conclusion.
3. **Unconfirmed**: no source checked states it, or sources disagree.

**What is being distributed.** A hybrid search: BM25 through `pg_textsearch` plus pgvector, fused by RRF, then a cross-encoder rerank that abstains below a calibrated threshold. The models are bge-small-en-v1.5 and ms-marco-MiniLM-L-6-v2, both local. Markdown is chunked by heading. The result is served as the stdio MCP tool `search_docs` (`docs/retrieval.md` → `## How it fits together`). There are two backends:

- The TypeScript backend embeds PGlite, with one index per checkout (**Store.**).
- The Python backend uses a Postgres reached by connection string. It also serves `POST /search` and `GET /health` (`docs-retrieval-service/README.md` → `## Standing it up`).

Per the brief, **this stack is not locked**. The store, the lexical engine and the models may all change, and local models stay the default while other providers come by configuration (`docs/rag-extraction-research/_brief.md`).

## The systems surveyed

There are 30 systems. "Py" means Python. The activity column comes from `gh api`.

| System | Shape(s) | Runtime | Store / models | Config and auth | Licence | Last push / release |
|---|---|---|---|---|---|---|
| **shinpr/mcp-local-rag** | npx stdio MCP + CLI + skills installer | TS | LanceDB embedded; `Xenova/all-MiniLM-L6-v2` local; keyword boost, no reranker | env (`BASE_DIR`, `DB_PATH`, `MODEL_NAME`); no auth, single user | MIT | 2026-10-22 |
| **lyonzin/knowledge-rag** | pip, stdio / SSE / streamable HTTP, Docker | Py | ChromaDB + BM25, optional FTS5; FastEmbed ONNX bge-small; RRF; reranker `Xenova/ms-marco-MiniLM-L-6-v2` | `config.yaml` (`knowledge-rag init`); optional `server.auth.bearer_token` | MIT | 2026-10-25 |
| arabold/docs-mcp-server | npx stdio + streamable HTTP, Docker, web UI | TS | SQLite; FTS without a model, vectors via a provider | config file, env, flags; provider keys in env | MIT | v3.4.1, 2026-10-25 |
| Context7 (Upstash) | hosted remote MCP, `ctx7` CLI + skills, client plugins | TS | closed backend | `Authorization: Bearer`; OAuth in `npx ctx7 setup` | MIT (client) | 2026-10-28 |
| Ref | remote MCP; legacy npx stdio | TS | hosted | `?apiKey=` or `x-ref-api-key` header; `REF_API_KEY` | MIT (client) | 2026-10-24 |
| Ragie | remote MCP; npx stdio repo now "no longer needed" | — | hosted | — | MIT (old client) | 2026-02-04 |
| Kapa.ai | hosted MCP at `https://<subdomain>.mcp.kapa.ai` | — | hosted, agentic retrieval | API-key bearer, public OAuth (Google/GitHub) or Kapa accounts | proprietary | — |
| GitMCP | hosted remote MCP, self-hostable | TS | GitHub docs | none | Apache-2.0 | 2026-05-08 |
| Microsoft Learn MCP | hosted MCP + Claude Code plugin + Copilot CLI plugin + CLI + skill | TS | hosted | none | CC-BY-4.0 (repo) | 2026-10-25 |
| AWS Documentation MCP | uvx stdio, Docker | Py | AWS search API | env | Apache-2.0 | — |
| Mintlify / GitBook | per-site hosted HTTP MCP | — | hosted | public; OAuth on authed endpoints | proprietary | — |
| Qdrant MCP | uvx stdio / SSE / streamable HTTP, Docker | Py | Qdrant; FastEmbed local | env only (`QDRANT_URL`, `QDRANT_API_KEY`, `EMBEDDING_MODEL`) | Apache-2.0 | v0.8.1, 2025-12-10 |
| Chroma MCP | uvx stdio | Py | Chroma ephemeral / persistent / http / cloud | flags = `CHROMA_*` env, `.chroma_env` | Apache-2.0 | v0.2.6, 2025-08-14 |
| Cloudflare AI Search | hosted MCP per instance | — | hosted hybrid | public, or Access service-token headers | proprietary | — |
| Pinecone Assistant | hosted MCP + local Docker MCP | — | hosted | `Authorization: Bearer <API key>` | proprietary | — |
| Azure AI Search, Bedrock KB, OpenAI file_search, Mixedbread, Vectara, LlamaCloud | hosted retrieval; MCP via preview endpoint, AgentCore Gateway, or stdio clients | — | hosted | key, IAM or RBAC (Azure, Vectara, LlamaCloud **secondary**) | proprietary | — |
| RAGFlow | compose app, REST, built-in MCP | Py | own stack | `RAGFLOW_MCP_*` env; bearer per request in `host` mode | Apache-2.0 | v1.0.0-rc2, 2026-10-16 |
| Onyx | `onyx-cli` installer → compose / Helm, built-in MCP | Py | own stack | OAuth PKCE, PAT or API key | MIT CE + EE | v5.0.1, 2026-10-26 |
| R2R | pip light / compose full, REST | Py | Postgres | TOML + env; `OPENAI_API_KEY` | MIT | v3.6.5, 2025-06-06 (stale) |
| txtai | library + YAML API + MCP | Py | own | `app.yml` | Apache-2.0 | v9.14.0, 2026-10-06 |
| Haystack + Hayhooks | library; REST, OpenAI-compatible, MCP | Py | pluggable | code + env | Apache-2.0 | v3.4.1 / v2.1.0 |
| LlamaIndex OSS | library | Py | pluggable | `Settings.embed_model` | MIT | v0.14.25 |
| AnythingLLM, PrivateGPT, Khoj, Kotaemon | desktop / Docker apps | JS / Py | own | UI + env | mixed | active 2026; Verba, pgai **archived** |
| ParadeDB | Postgres + `pg_search` BM25 | Rust | Postgres | — | AGPL-3.0 + commercial | v0.26.3 |

Sources, in row order: https://github.com/shinpr/mcp-local-rag, https://github.com/lyonzin/knowledge-rag, https://github.com/arabold/docs-mcp-server, https://github.com/upstash/context7, https://github.com/ref-tools/ref-tools-mcp, the `ragieai/ragie-mcp-server` README (`gh api`), https://docs.kapa.ai/retrieval/hosted-mcp-server, https://github.com/idosal/git-mcp, https://github.com/MicrosoftDocs/mcp, https://github.com/awslabs/mcp/tree/main/src/aws-documentation-mcp-server, https://mintlify.com/docs/ai/model-context-protocol, https://gitbook.com/docs/ai-and-search/mcp-servers-for-published-docs, https://github.com/qdrant/mcp-server-qdrant, https://github.com/chroma-core/chroma-mcp, https://developers.cloudflare.com/ai-search/api/search/mcp/, https://docs.pinecone.io/guides/assistant/mcp-server, https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html, https://developers.openai.com/api/docs/guides/tools-file-search, https://ragflow.io/docs/use_ragflow_as_mcp_server, https://docs.onyx.app/deployment/configuration/mcp_server.md, https://github.com/SciPhi-AI/R2R, https://github.com/neuml/txtai, https://github.com/deepset-ai/hayhooks, https://github.com/paradedb/paradedb.

**Vertex AI Search stays Unconfirmed.** Google's Vertex AI MCP reference lists no search tool (https://docs.cloud.google.com/vertex-ai/docs/reference/mcp, retrieved 2026-10-28; the part read shows RAG `ragCorpora`/`retrieveContexts` methods, not Search data stores, and the page was not read to the end). Only community servers were found (**secondary**).

**Prose for the systems the conclusions rest on (Documented):**

- **mcp-local-rag** is the closest match to the recommended shape: `claude mcp add local-rag --env BASE_DIR=… -- npx -y mcp-local-rag`; "No API key, Docker, Python, or external database is required"; CLI verbs `ingest`/`sync`/`query`/`status`; `skills install --claude-code|--codex`; no built-in reranker.
- **knowledge-rag** already ships this repository's model pair locally without `torch`: "semantic + BM25" with RRF, then `Xenova/ms-marco-MiniLM-L-6-v2` reranking over FastEmbed bge-small (384 dimensions); "Zero external servers, zero API keys"; three transports, optional HTTP bearer token. Its README self-reports a "5 889-doc / 75 016-chunk corpus" run with concurrent queries during a rebuild, and async `reindex_documents`.
- **docs-mcp-server** takes websites, repos, packages, folders and archives into SQLite, serving stdio and HTTP from one npx package or Docker image.
- **Microsoft Learn** ships one engine six ways: a no-auth hosted MCP, a Claude Code plugin (`/plugin install microsoft-docs@claude-plugins-official`), a Copilot CLI plugin, `codex mcp add`, a CLI (`npx @microsoft/learn-cli search …`) and a skill installer.
- **Context7** ships hosted MCP, the `ctx7` CLI, skills and plugins over a backend "private and not in this repo"; free 1,000 calls/month, self-hosting only at Enterprise (https://context7.com/docs/plans-pricing).
- **Ref and Ragie** moved from legacy npx stdio to native streamable-HTTP MCP (Ragie: "no longer needed").
- **Claude Code plugins.**
  - `mcpServers` takes a `.mcp.json`, an inline map, a `.mcpb` path or URL, or a remote `url`.
  - `userConfig` options marked `sensitive: true` are masked and stored "in secure storage", and substituted as `${user_config.KEY}` into the server's `env`, `args` or `headers`.
  - Reach goes beyond the CLI. "claude.ai and Cowork don't install a plugin that has [a top-level `bin/`] directory, including one you distribute through claude.ai organization settings", which implies plugins without `bin/` do install there (https://code.claude.com/docs/en/plugins-reference → `## Standard layout`).
  - A plugin's stdio MCP server still runs on the local machine.
- **MCPB.** `.mcpb`, formerly DXT, is a zip of a local server plus `manifest.json`. Runtimes are node, python, uv and binary. Node is recommended because Claude Desktop ships it (https://github.com/modelcontextprotocol/mcpb).
- **The official MCP Registry.**
  - It is "currently in preview", metadata only (`server.json`), aggregator-first, and "does not support private servers" (https://modelcontextprotocol.io/registry/about).
  - Ownership is proven by `mcpName` in package.json, an `mcp-name:` string in a PyPI README, or the `io.modelcontextprotocol.server.name` Docker label. Cargo is also a package type.
  - An `.mcpb` entry needs a `fileSha256` and a URL containing "mcp" (https://modelcontextprotocol.io/registry/package-types).

**Client reach and auth (Documented).**

- **Clients.** One remote URL reaches Claude Code, Codex, Cursor and VS Code (Mintlify page above); VS Code also takes stdio (https://code.visualstudio.com/docs/copilot/customization/mcp-servers).
- **Claude custom connectors.**
  - They connect "from Anthropic's cloud infrastructure, rather than from your local device" on claude.ai, Claude Desktop, Cowork and mobile. The server must therefore be publicly reachable, or allowlist Anthropic's IPs.
  - They **accept static credentials**: "add fixed credentials such as API keys that Claude sends on every request … if your MCP server authenticates with an API key, bearer token, or other fixed credential instead of OAuth". The values are "stored encrypted" (https://support.claude.com/en/articles/11175166).
- **ChatGPT developer-mode connectors.** Vendor guides list only OAuth, no auth, or mixed. None lists an API key (zuplo.com, docs.atlan.com, **secondary**). OpenAI's own page was not found, so this stays **Unconfirmed**.
- **MCP auth spec, 2026-07-28** (https://modelcontextprotocol.io/specification/latest/basic/authorization → `## Overview`): authorization **OPTIONAL**; stdio takes credentials from env; HTTP servers that support it **MUST** publish RFC 9728 metadata; CIMD **SHOULD**; DCR **MAY**, "deprecated and retained for backwards compatibility"; tokens "MUST NOT be included in the URI query string".
- **The four auth patterns in practice:**
  1. none (GitMCP, Microsoft Learn, public Mintlify and GitBook);
  2. a static bearer key (Pinecone, Context7, Kapa, RAGFlow, knowledge-rag);
  3. gateway headers (Cloudflare Access);
  4. OAuth with a bearer fallback (Onyx, authed Mintlify, Kapa public).

## How comparable systems expose the model choice

Every self-hosted system surveyed treats the embedder as configuration, and most treat a change of it as a re-index (Documented, except where marked):

| System | Mechanism | Re-index / dimension handling |
|---|---|---|
| docs-mcp-server | `embeddings.model` / `DOCS_MCP_EMBEDDING_MODEL` / `--embedding-model`, provider prefix (`openai:`, `vertex:`, `gemini:`); keys `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`; Ollama through an OpenAI-compatible base URL (https://github.com/arabold/docs-mcp-server/blob/main/docs/guides/embedding-models.md) | startup prompt "Proceed with model change? (y/N)"; without a terminal, fails unless `--accept-model-change`; then "deletes all stored vectors and recreates the vector index with the new dimension" (same guide) |
| mcp-local-rag | `MODEL_NAME`, any Transformers.js model with mean pooling; reranking via `RAG_RERANK_CMD`, with a warning that text may leave the machine | "build a fresh index at a new `DB_PATH`. Vectors from different models are not comparable, even when their dimensions match" (README) |
| knowledge-rag | `models.embedding.profile`: `compact` / `quality` / `multilingual` / `custom`; `models.reranker.enabled` | not stated |
| Qdrant MCP | `EMBEDDING_PROVIDER` (only `fastembed`), `EMBEDDING_MODEL` | not stated |
| LlamaIndex | global `Settings.embed_model` (e.g. `HuggingFaceEmbedding`, `OpenAIEmbedding`), or per index (https://developers.llamaindex.ai/python/framework/module_guides/models/embeddings/) | the integrator's job |
| R2R | TOML `[embedding] provider = "litellm"`, `base_model = "openai/text-embedding-3-small"`, `base_dimension = 512`; `rerank_model` present only as a comment (`py/r2r/r2r.toml` in SciPhi-AI/R2R, via `gh api`; the docs pages return 404) | a comment pairs each model with its dimension; re-index behaviour **Unconfirmed** |
| Onyx | admin UI Search Settings; cloud providers (Cohere, Google …) with credentials, or self-hosted models | "Onyx will need to re-index all of your data". The old model serves during the swap (https://docs.onyx.app/admins/advanced_configs/search_configs, **secondary**). |
| RAGFlow | Model Providers page per tenant, or `user_default_llm` in config before first login | embedder fixed once a dataset has chunks. 0.22.1 allows a switch only if re-encoded sample chunks score ≥0.9 similarity (ragflow.io docs and blog, **secondary**). |
| LiteLLM | routes by model-string prefix (`cohere/…`, `voyage/…`, `gemini/…`, `openai/` + `api_base` for any compatible server) (https://docs.litellm.ai/docs/embedding/supported_embedding) | n/a |

**Inference.** The common shape is a prefix-routed `provider:model` string, the key in env, a stored model id and a forced rebuild on change. This repository has the last two ("a different id clears the index and rebuilds it", `docs/retrieval.md` → **Incremental refresh.**). The vector width follows the model, so a dimension change is a schema change, and with a hosted embedder a very large rebuild is metered.

## The shapes side by side

Step counts are to a first successful query, and are **Inference** from the documented install lines.

| Shape | Install and first run | Config / secrets | Clients | Auth | Evidence |
|---|---|---|---|---|---|
| Claude Code plugin | 2 (`marketplace add`, `install`) + `userConfig` dialog | `userConfig`; `sensitive` in OS store | Claude Code; Cowork and claude.ai via org distribution if no `bin/`; stdio MCP still local | inherits the server's | Microsoft Learn, Context7: one route among several |
| Stdio MCP (npx / uvx) | 1 entry + model download; + DB URL if remote | flags and env in client config | Claude Code, Claude Desktop (local config / MCPB), Cursor, VS Code, Codex | env, per spec | mcp-local-rag, knowledge-rag, docs-mcp-server, AWS, Qdrant, Chroma |
| Remote MCP, self-hosted | 2–4: run server, add URL per client | server env and file; client URL + header or OAuth | all IDE agents; claude.ai, Desktop connectors, Cowork, mobile if public HTTPS (bearer OK); ChatGPT OAuth (**secondary**) | bearer floor; OAuth for ChatGPT | Onyx, RAGFlow, knowledge-rag, docs-mcp-server |
| REST API, self-hosted | same server; ≥1 integration step per consumer | header key | any HTTP client | API key | R2R, txtai, Hayhooks, this repo's `serve-http` |
| Hosted SaaS | 3–5: sign up, key, upload or connect, add URL | dashboard | everything | key or OAuth | Context7, Kapa, Pinecone, Cloudflare, Bedrock, OpenAI |
| Library / SDK | 2+, and code | code / YAML | the host app | none | Haystack, LlamaIndex, txtai |
| CLI kit | 1–2 (`index`, `search`) | flags, env, file | humans, scripts, agents via shell or skills | none | `ctx7`, `@microsoft/learn-cli`, mcp-local-rag, `onyx-cli` |
| Docker / compose | 1–3 after Docker | env, `.env`, mounts | whatever it serves; stdio via `docker run -i` | as served | RAGFlow, Onyx, docs-mcp-server, Pinecone local, this repo's `compose.yaml` |

**Two patterns (Inference).** The most visible products (by vendor size and stars) ship one engine in three to six shapes: Microsoft Learn, Context7, docs-mcp-server, mcp-local-rag. And indexing is separate from serving (docs-mcp-server `scrape`, mcp-local-rag `ingest`, knowledge-rag async `reindex_documents`, RAGFlow, Onyx), whereas this server refreshes before every query (`docs/retrieval.md` → **Server.**), putting a very large cold build inside a tool call.

## Comparison matrix

Each criterion is scored from 3 (good) to 1 (poor), all **Inference**. Maintainer burden is scored inversely, so 3 means a low burden. The rows are not summed; the recommendation weighs them below.

| Shape | Setup steps | Local-first | Remote use | Very large corpora | Client reach | Maintainer burden |
|---|---|---|---|---|---|---|
| Claude Code plugin | 3 | 3 | 1 | 2 | 1–2 | 2 |
| Stdio MCP | 3 | 3 | 1 | 2 | 2 | 3 |
| Remote MCP, self-hosted | 2 | 2 | 3 | 3 | 3 | 2 |
| REST, self-hosted | 2 | 2 | 3 | 3 | 1 | 2 |
| Hosted SaaS | 2 | 1 | 3 | 3 | 3 | 1 |
| Library / SDK | 1 | 3 | 1 | 2 | 1 | 2 |
| CLI kit | 3 | 3 | 1 | 3 | 2 | 3 |
| Docker / compose | 2 | 3 | 2 | 3 | 2 | 2 |

Remote MCP scores 2 on burden: a bearer key reaches every Claude surface.

## Positioning, store and runtime

**Positioning (maintainer ruling, `_brief.md`).** The product is a late entrant: mcp-local-rag (npx, LanceDB, stdio, CLI, skills) and knowledge-rag (pip, ChromaDB + BM25, the same local reranker, HTTP with a bearer token, a self-reported 75,016-chunk run) already offer no-key local retrieval. That is a fact, not a weakness. What neither documents (Inference from their READMEs):

- a **shared remote store**: both are single-machine, embedded stores;
- a calibrated abstention threshold with a published relevance record (`docs/retrieval-eval-results.md` → `## Threshold calibration`).

**Store, building on the accepted one-engine direction (`_brief.md`) (Inference).** Competitors show LanceDB, or SQLite FTS5 plus a vector store, give a zero-server first run, so the embedded side need not be Postgres. PGlite's edge is the same SQL as the remote Postgres, one store contract rather than two. So:

- keep a store interface;
- keep **remote Postgres as a supported store**;
- treat the embedded default as replaceable. PGlite today; SQLite FTS5 + sqlite-vec or LanceDB if they measure better on footprint.

Managed `pg_textsearch` availability is fork 03's.

**Runtime, from this repository's measurements, not ecosystem counts (Documented, 2026-10-08).** Sources: `docs/retrieval-eval-results.md` → `### Footprint`, `### Cold start`, `### The trade-off, stated`, and `docs/retrieval.md` → `## What it costs`.

- **Install and disk, TypeScript:** about 300 MB of runtime and 56M of q8 weights.
- **Install and disk, Python:** a 929M environment with `torch`, 225M of fp32 weights, and a 657MB Postgres image.
- **Process cold start:** 1169.9 ms for TypeScript against 6864.1 ms for Python.
- **Counter-fact, resident memory:** the TypeScript server holds **2044608 KB (about 2.0 GB)**. The Python subtree holds 1066256 KB (about 1.1 GB) plus 37.96MiB of Postgres.
- **Warm latency:** 499.4 ms p50 for Python against 551.0–567.8 ms for TypeScript, from one repetition on a loaded host.
- **Relevance:** no gain either way.

**Inference.** For a stdio server that a desktop client spawns per session, TypeScript's install and cold-start lead dominates. For a long-running team HTTP server over a very large corpus, memory dominates, and there Python leads. The TypeScript HTTP and remote shapes also do not exist yet. PGlite is "one index per checkout", so a TypeScript team server depends on a connection-string store that fork 01 must scope. knowledge-rag shows that Python with FastEmbed ONNX runs this same model pair without `torch`, which would close most of the install gap.

Verdict: TypeScript for the shipped local path, moderate confidence; Python on ONNX if the team-server case leads. Pick **one** runtime: after a full comparison pass the two backends "disagree, and the reason is not yet identified" (`docs/retrieval-eval-results.md` → `### Which case this is`). Carrying both means carrying an unexplained divergence (Inference).

## Recommendation

**Building on the accepted one engine for an embedded and a remote Postgres store: model and store as configuration, five shapes plus wrappers (Inference).**

1. **Core engine.** It owns chunking, refresh, search, rerank and abstention, behind two interfaces:
   - **Store:** embedded by default; remote Postgres by `--database-url` or an env var.
   - **Model provider:** `embedder` and `reranker`, each a `provider:model` string. The defaults are local ONNX models, with no key and no cost. Opt-in, with keys from env: `openai:` or an OpenAI-compatible `base_url` for embeddings; `cohere:`, `voyage:`, `jina:` for embeddings or reranking (all three are LiteLLM `/rerank` providers: https://docs.litellm.ai/docs/rerank). Larger or multilingual local models are the same setting.
   - Confirm before a rebuild on a large index (billable with a hosted embedder), as docs-mcp-server's prompt and `--accept-model-change` do; size the vector column from the model; warn that a hosted reranker sends text off the machine, as mcp-local-rag does.
2. **CLI** (`npx` or `uvx`): `index`, `search`, `serve`, `doctor`, `fetch-models`. Precedence is flags, then env, then config file. `index` is the separate job very large corpora need.
3. **`serve --stdio`**: the default MCP shape.
4. **`serve --http`**: streamable-HTTP MCP at `/mcp` plus REST `POST /search` in one process.
   - Loopback by default; an optional static bearer key, which reaches every IDE agent and, when public, every Claude surface. OAuth (RFC 9728; CIMD SHOULD, DCR deprecated MAY) is deferred to a reverse-proxy or IdP recipe for ChatGPT.
5. **Docker / compose image**: the server plus a Postgres with the lexical and vector extensions, weights baked in. Publish it to GHCR with the registry label.
6. **Registry entry**: one `server.json` listing the npm or PyPI package, the OCI image and later an `.mcpb` (with `fileSha256`).
7. **Thin wrappers, no logic**:
   - A Claude Code plugin with no top-level `bin/`, so org distribution can carry it to Cowork and claude.ai. `userConfig` holds the docs path, the DB URL (`sensitive`) and the provider keys (`sensitive`).
   - A skills installer, as mcp-local-rag and Microsoft Learn ship.
   - An `.mcpb` for Claude Desktop.

**What dropping or deferring costs (Inference).**

| Dropped or deferred | Lost |
|---|---|
| Hosted SaaS | zero-install for non-technical users; metered revenue (Context7, Kapa, Pinecone); reach without the user exposing a server. Avoided: custody of others' docs, uptime, billing. |
| In-process OAuth | ChatGPT connectors (**secondary** evidence that they need OAuth). Avoided: running an authorization server. |
| Plugin as the main vehicle | Cursor, Copilot, Codex and ChatGPT users. Rejected as primary, kept as a wrapper. |

## Open questions

1. **Very large index time.** Time `index` at 10–100× the measured 1,960 chunks, embedded and remote.
2. **Embedded store choice.** Compare PGlite, SQLite FTS5 + sqlite-vec and LanceDB on footprint, cold start and relevance against this repository's eval.
3. **First-run download time** on a clean machine for each runtime. Sizes are measured; transfer time is not.
4. **One runtime.** TypeScript plus a connection-string store, or Python on ONNX instead of `torch`. With fork 01's seam analysis.
5. **ChatGPT connector auth.** Whether it accepts a static key.
6. **Hosted tier.** Whether it is ever in scope.

## Fork verdict

Comparable products ship one engine in several shapes, and none ships only a plugin. The fit for a user with large docs and minimal setup is one engine with configurable store and model provider (local by default), a CLI, stdio MCP, a combined streamable-HTTP MCP and REST server with an optional bearer key (which reaches every Claude surface when public), a Docker/compose image, a registry entry, and thin plugin, skills and `.mcpb` wrappers.

Hosted SaaS and OAuth (needed only for ChatGPT) are deferred. The product enters a niche mcp-local-rag and knowledge-rag already occupy; what it adds is the accepted one engine spanning an embedded store and a shared remote Postgres, with measured relevance and abstention. Measurements favour TypeScript for install and cold start (about 300 MB, 1.2 s against 929M + 657MB, 6.9 s) and Python for memory (1.1 GB against 2.0 GB): a moderate TypeScript lean that the team-server case could reverse. Confidence in the shape combination is high.

## Review response

- **First review**: all 3 Must Fix, 7 Should Fix and 5 Nice to Have accepted and applied — static connector headers Documented and OAuth narrowed to ChatGPT; mcp-local-rag and knowledge-rag added; measured footprint, cold start and RSS cited; parity citation moved to `### Which case this is`; plugin reach widened; Kapa and Ragie described; "most visible"; CIMD/DCR levels; length cut.
- **Brief additions**: store interface, embedded-store question and model-provider survey and setting added; remote Postgres kept.
- **Re-review MF1** (knowledge-rag scale): accepted; self-report cited, scale dropped, added to indexing-apart examples.
- **Re-review SF1**: accepted; both re-index cells fixed, docs-mcp-server's own guide cited, its prompt named as prior art.
- **Re-review SF2** (R2R): docs pages 404; now cites `py/r2r/r2r.toml`; `rerank_model` noted as commented out.
- **Re-review NtH 1–3**: FTS5 marked optional; Vertex cited to Google directly; `voyage:`/`jina:` verified as LiteLLM rerank providers.
- **Maintainer rulings**: late entrant stated as fact; recommendation builds on the one-engine decision.
