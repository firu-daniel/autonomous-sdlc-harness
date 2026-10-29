# Review — 02-distribution-shapes.md
verdict: FAIL

Checked on 2026-10-28. Repository: 14 citations checked against source. Web: 17 claims checked with WebFetch, WebSearch and `gh api`. Line numbers below are the reviewed file's.

## Must Fix

1. **The Claude custom-connector auth question is answered: static credentials are documented.** l.120, l.208, l.229 (Open question 3), and the verdict (l.237: "in-process OAuth … the route to claude.ai") treat static-bearer acceptance as **Unconfirmed** and say these clients "in practice" expect OAuth. The page the file already cites says otherwise. Under "Request headers", it says to "add fixed credentials such as API keys that Claude sends on every request … if your MCP server authenticates with an API key, bearer token, or other fixed credential instead of OAuth", and that the values are "stored encrypted" (https://support.claude.com/en/articles/11175166, fetched 2026-10-28). Change: mark it **Documented**. Drop open question 3. In shape 3's Clients line and the dropped-shapes table, say a public HTTPS server with the planned optional bearer key already reaches claude.ai, Claude Desktop connectors, Cowork and mobile. Narrow "OAuth deferred" to ChatGPT. For ChatGPT, vendor guides list only OAuth, none or mixed, with no API key (zuplo.com/docs/mcp-gateway/connect-clients/chatgpt and docs.atlan.com/…/chatgpt-remote-mcp, both **secondary**; OpenAI's own page was not found). Restate the verdict sentence to match.

2. **The survey misses two open-source local docs-RAG MCP servers that match the claimed differentiators.** The verdict (l.237) says "the no-key local models and the embedded-Postgres first run are the two properties no surveyed open-source docs server matches", and l.219 says the same. Both claims depend on two systems the survey left out:
   - `shinpr/mcp-local-rag`: MIT, TypeScript, 425 stars, pushed 2026-10-22 (`gh api repos/shinpr/mcp-local-rag`). Its README says "No API key, Docker, Python, or external database is required. After the initial model download, text ingestion and search work offline." It is semantic plus keyword hybrid search over embedded LanceDB. It ships as `npx -y mcp-local-rag` for MCP, has CLI verbs `ingest`/`sync`/`query`/`status`, and installs skills with `skills install --claude-code|--codex`. It carries an MCP Registry badge.
   - `lyonzin/knowledge-rag`: MIT, 300 stars, pushed 2026-10-25. Its description reads "hybrid search (semantic + BM25), cross-encoder reranking … Zero external servers, zero API keys". It is installed with `pip install knowledge-rag`, runs FastEmbed ONNX over ChromaDB, uses the same reranker (`Xenova/ms-marco-MiniLM-L-6-v2`), and offers stdio or streamable HTTP.

   What is still unique is narrower: Postgres-grade BM25 (`pg_textsearch`) and a path to a shared remote Postgres. Change: add both to the table and to "MCP docs servers". Reword l.184, l.219 and the verdict so the differentiator is Postgres, meaning one engine from an embedded store to a remote one, not "no-key local models". Note that `mcp-local-rag` already ships almost exactly the recommended shape (npx CLI, stdio MCP and skills). That supports the shape verdict, but it also makes the product a late entrant there. The runtime and positioning paragraphs should say so.

3. **The Python install-size gap is measured in this repository, and the file calls it unmeasured.** l.220 says the torch download is "**Unconfirmed** size; not measured here". The verdict (l.237) says "the install-size gap is unmeasured". Open question 4 asks for the measurement. `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Footprint` and `### The trade-off, stated` record, on 2026-10-08:
   - a 929M Python environment with the `models` extra;
   - 225M of fp32 weights, against 56M of q8 TypeScript weights;
   - a 657MB Postgres image;
   - process cold start of 6864.1 ms against 1169.9 ms (`### Cold start`).

   The TypeScript runtime is "About 300 MB" (`docs/retrieval.md` → `## What it costs`). The first-run download time is the only thing still unmeasured. Change: cite these figures in reason 2 and in the verdict. Shrink open question 4 to first-run download time on a clean machine. The TypeScript lean then rests on measurement rather than ecosystem counts, so the confidence wording can rise.

## Should Fix

1. **The runtime recommendation leaves out the measured costs that cut against TypeScript.** Resident memory: the TypeScript server 2044608 KB, against 1066256 KB for the Python subtree plus 37.96MiB of Postgres (`### Footprint`, `### The trade-off, stated`: "Its resident memory is about half"). Warm latency is slightly lower on Python (499.4 against 551.0 / 567.8 ms p50, one repetition, loaded host). Relevance shows no gain either way. For the "team server over very large corpora" case at l.223, memory matters more than install size. Change: add one sentence weighing memory for long-running HTTP deployments. Also note that PGlite's embedded store does not serve a shared team index (`docs/retrieval.md` → `## How it fits together`, **Store.**: "one index per checkout"). Shapes 3, 4 and 8 on a TypeScript runtime therefore depend on the connection-string store that open question 5 leaves open. The verdict should say so.

2. **The parity-burden citation is misrepresented.** l.223 says doubling backends is a cost "this repository already records as a large cost (`## The Python backend against the TypeScript one`)". That section records that the backends "disagree, and the reason is not yet identified" (`### Which case this is`) and lists operational costs. It does not record parity or test burden as a cost. Change: cite `### Which case this is` and say "unexplained divergence after a full comparison pass", labelled **Inference**.

3. **The plugin's reach is understated.** l.104 and l.187 say "Claude Code only" and "A plugin reaches one client". The plugins reference says "claude.ai and Cowork don't install a plugin that has this directory [`bin/`], including one you distribute through claude.ai organization settings" (https://code.claude.com/docs/en/plugins-reference → `## Standard layout`). So plugins install beyond the Claude Code CLI. Change: say plugins reach Claude Code plus Cowork and claude.ai via org distribution. Note that a plugin's stdio MCP still runs locally. The matrix's client-reach score of 1 stays defensible, but the wording has to change.

4. **The unchecked vendors can now be described.** l.9, l.51 and l.233:
   - **Kapa.ai.** It has a hosted MCP at `https://<subdomain>.mcp.kapa.ai`, with auth fixed at creation: an API key bearer, public OAuth via Google or GitHub, or internal Kapa accounts with SAML. Tools are `search_<product>_knowledge_sources` and an optional documents tool. It also offers HTTP retrieval APIs and SDKs (https://docs.kapa.ai/retrieval/hosted-mcp-server).
   - **Ragie.** `docs.ragie.ai` still fails the TLS handshake. However, `ragieai/ragie-mcp-server`'s README (via `gh api`) states that the npx stdio server "is no longer needed. Ragie now supports MCP natively as a streamable HTTP server". That is the same legacy-stdio-to-remote move Ref made, worth stating as a pattern.
   - **Vertex AI Search.** No Google-published MCP endpoint for search data stores was found. Google's Vertex AI MCP reference (https://docs.cloud.google.com/vertex-ai/docs/reference/mcp) lists generate, predict, models and similar tools, with no search tool. Only community servers exist (ubie-oss/mcp-vertexai-search, **secondary** listings). Keep it **Unconfirmed**, with that note.

   Change: replace the "not checked" entries with these.

5. **"Most-used" is asserted without usage data.** l.164 says "the most-used docs-retrieval products ship the same engine in three to six shapes". No source checked gives usage. The only adoption proxy in the file is GitHub stars. Change: say "the most visible", or name the systems.

6. **The authorization paragraph overstates DCR's position.** l.94 is correct that DCR "is deprecated and retained for backwards compatibility". But the 2026-07-28 text also keeps DCR as a **MAY**, and CIMD is a **SHOULD** (https://modelcontextprotocol.io/specification/latest/basic/authorization → `## Overview`, items 2–3). Change: state both levels. This matters for the OAuth-recipe cost because ChatGPT is reported to register dynamically (zuplo, **secondary**).

7. **The file is over length (`wc -w`: 4,894 against 2,000–4,000).** Cuts worth about 1,100 words:
   - Fold the per-system "Documented" bullets (l.53–94) into the table as a "Config / auth" column, and keep prose only for Context7, docs-mcp-server, Microsoft Learn, Claude Code plugins, MCPB and the Registry (about 600 words).
   - Merge the eight "### N." shape blocks (l.100–162) into one table with the columns Install / Config / Clients / Auth / Evidence. They repeat the matrix rationale (about 350 words).
   - Drop the "Generic Postgres MCPs" bullet (l.68), the OpenAI storage price (l.75, secondary and unused) and the Web UI row (l.210).
   - Keep the remote-MCP auth paragraph to the four auth patterns plus the query-string rule. The spec detail belongs to fork 03.

## Nice to Have

1. GitBook (l.63) can move from **secondary** to **Documented**. The page fetched directly gives "GitBook supports HTTP transport only", "read-only" and "latest published version only". It also adds `{site}/~gitbook/mcp/auth` for partially authenticated sites.
2. The registry ownership field names (l.88) can drop **secondary**: https://modelcontextprotocol.io/registry/package-types confirms `mcpName`, `mcp-name:` and the `io.modelcontextprotocol.server.name` label, and adds Cargo as a package type. The `.mcpb` registry entry needs `fileSha256` and a URL containing "mcp", which bears on recommendation item 6.
3. The Pinecone note that Claude Desktop "needs a proxy (supergateway) for remote URLs" (l.72) may be stale now that Desktop takes remote custom connectors. Re-check it or label it as Pinecone's statement.
4. The Microsoft Learn row (l.29) has blank licence and activity fields while the repo is public. Fill them from `gh api repos/MicrosoftDocs/mcp` or mark them n/a.
5. The matrix's unweighted "Sum" column ranks the CLI kit first, which the text does not rely on. Drop the column or say the sums are not used.

## Verified, no finding

- **Repository:** `docs/retrieval.md` → `## How it fits together` (two backends, PGlite, **Server.** refreshes before each query), `## What this buys you`, `## What it costs` (about 300 MB); `docs-retrieval-service/README.md` → `## Standing it up` (`serve-http`, `POST /search`, `GET /health`); `docs-retrieval-service/pyproject.toml` `models` extra (`sentence-transformers`, `torch`); `compose.yaml` binds 127.0.0.1; `docs/copilot-foundry-research.md` → `## How this was researched`; the TypeScript store is PGlite-only (`cli/src/retrieval/store.ts` imports); the 1,960-chunk build (`## Cold build and index size`).
- **Web:**
  - Microsoft Learn: hosted MCP, Claude Code plugin, Copilot CLI plugin, `@microsoft/learn-cli` and the `mslearn setup` skill installer (github.com/MicrosoftDocs/mcp).
  - Context7: setup flags, the remote URL with a bearer header, `.claude-plugin`/`.cursor-plugin`/`gemini-extension.json`, private backend, and pricing.
  - pgai and Verba archived; R2R v3.6.5 released 2025-06-06; the Qdrant, Chroma, txtai and docs-mcp-server release data match (`gh api`).
  - MCP 2026-07-28: auth OPTIONAL, stdio from the environment, RFC 9728 MUST, no tokens in the query string.
  - The Registry is "currently in preview", metadata only, aggregators first, no private servers.
  - Custom connectors connect "from Anthropic's cloud infrastructure", and the server must be reachable from Anthropic's IP ranges.
  - MCPB: a zip plus `manifest.json`, formerly DXT, node/python/uv/binary, Node recommended because it ships with Claude, and only Claude for macOS and Windows named.
  - Plugin `mcpServers` accepts a `.mcpb` path or URL; `sensitive` values go to secure storage; `${user_config.KEY}` substitutes into server config.
  - Onyx MCP: `/mcp/`, `MCP_SERVER_ENABLED`, OAuth PKCE `read:search`, PAT or API key.

## Re-review

verdict: FAIL

Re-checked on 2026-10-28 against the revised file and the two new framing points in `_brief.md` (stack not locked; models local by default, others by config). Line numbers below are the revised file's.

**Earlier findings.**
- **All three Must Fix are resolved.**
  - MF1: static connector headers are now Documented with the quote (l.83). OAuth is narrowed to ChatGPT.
  - MF2: mcp-local-rag and knowledge-rag are added, the differentiator is narrowed and "late entrant" is stated (l.146–152).
  - MF3: the measured figures are cited (l.162–169), and the open question is cut to download time.
- **Six of the seven Should Fix are resolved:**
  - SF1: memory weighed, and the PGlite "one index per checkout" limit noted (l.167, l.171).
  - SF2: the parity citation now points to `### Which case this is`, labelled Inference.
  - SF3: plugin reach (l.70, l.116).
  - SF5: "most visible", with the systems named.
  - SF6: CIMD SHOULD, DCR a deprecated MAY.
  - SF7: `wc -w` is 3,997, under 4,000 with about nothing to spare.
- **SF4 is resolved in substance:** Kapa and Ragie are described and Vertex AI Search stays Unconfirmed. Its sourcing is weak, though; see Nice to Have 2 below.

**New claims spot-checked (8).** Six are accurate. Two are not:
- **mcp-local-rag:** `MODEL_NAME` defaults to `Xenova/all-MiniLM-L6-v2`; mean pooling; a keyword boost (`RAG_HYBRID_WEIGHT`); `RAG_RERANK_CMD` with the warning that text "may leave your machine". Checked against the README via `gh api`.
- **knowledge-rag:** the `models.embedding.profile` values `compact`/`quality`/`multilingual`/`custom`, `models.reranker.enabled`, `server.auth.bearer_token`, `knowledge-rag init` scaffolding `config.yaml`, and FastEmbed bge-small-en-v1.5 at 384 dimensions.
- **Qdrant MCP:** `EMBEDDING_PROVIDER`, "currently only "fastembed" is supported" (github.com/qdrant/mcp-server-qdrant).
- **LiteLLM:** the `cohere/`, `voyage/` and `gemini/` prefixes, and `openai/` plus `api_base` for compatible servers (docs.litellm.ai/docs/embedding/supported_embedding).
- **docs-mcp-server:** the `--embedding-model` / `DOCS_MCP_EMBEDDING_MODEL` setting and the `vertex:`, `gemini:`, `aws:` and `microsoft:` prefixes are correct. The cited secondary URL is dead, though (Should Fix 1).
- **Microsoft Learn:** CC-BY-4.0, pushed 2026-10-25 (`gh api`).
- **R2R:** the TOML keys match the search results, but the cited page returned 404 (Should Fix 2).
- **Not accurate:** the knowledge-rag scale claim (Must Fix 1) and the "not stated" re-index cells (Should Fix 1).

The `provider:model` setting proposed at l.181 is a sound Inference from the survey. It follows docs-mcp-server and LiteLLM. Its consequences are stated: confirm before a billable rebuild, size the vector column from the model, and warn when text leaves the machine. All three match documented practice (see Should Fix 1).

### Must Fix (open)

1. **The claim that knowledge-rag says nothing about scaling is wrong.** l.149 lists "scaling claims for very large corpora (**Unconfirmed** for both: not stated, not tested)" as something neither competitor documents. The fork verdict's "defensible ground" partly rests on it. knowledge-rag's README says: "**Verified at scale:** production reproduction on a **5 889-doc / 75 016-chunk corpus** with concurrent queries during a nuclear rebuild — zero downtime, zero errors". It also ships staging rebuilds and an async `reindex_documents` / `get_reindex_status` (`gh api repos/lyonzin/knowledge-rag/readme`, README l.318–319, l.366). That is a stated, self-reported claim at about 38× this repository's 1,960-chunk build, with indexing kept apart from serving.

   Change:
   - Mark the claim **Documented (vendor self-report)** for knowledge-rag.
   - Keep "not stated" for mcp-local-rag only.
   - Drop the scaling bullet from the differentiators, or reword it to "no published relevance record at that scale".
   - Rest the positioning on the shared remote store and the calibrated abstention with a relevance record. Both still hold.
   - Add knowledge-rag to the "indexing is separate from serving" examples at l.125.

### Should Fix (open)

1. **The model-choice table's re-index cells understate two systems, and one source is dead** (l.98–99).
   - **mcp-local-rag:** "not stated" is wrong. Its README says "When changing embedding models, build a fresh index at a new `DB_PATH`. Vectors from different models are not comparable, even when their dimensions match."
   - **docs-mcp-server:** it does more than "re-scrape with `--replace`". Its guide documents a startup prompt, "Proceed with model change? (y/N)", and, under an MCP client with no terminal, a hard failure unless `--accept-model-change` / `DOCS_MCP_ACCEPT_MODEL_CHANGE=true` is set. On confirmation "the server deletes all stored vectors and recreates the vector index with the new dimension".
   - **Source:** the cited `mintlify.com/arabold/docs-mcp-server/guides/embedding-models` returns HTTP 410. The primary source is the repository's `docs/guides/embedding-models.md` (https://github.com/arabold/docs-mcp-server/blob/main/docs/guides/embedding-models.md). It also confirms the provider prefixes, so the row can drop **secondary**.

   Change: fix both cells and swap the URL. Then cite docs-mcp-server's prompt as prior art for recommendation item 1's "confirm before a rebuild".
2. **The R2R source is dead** (l.103). WebFetch of `https://r2r-docs.sciphi.ai/documentation/configuration/ingestion/embedding` returned 404. Search snippets of the same page still show the cited content (`provider` options `ollama`/`litellm`/`openai`, `base_model` as `provider/model`, and `base_dimension` matching the model). They also show `rerank_model` support conflicting between pages. Change: cite `py/core/configs/` in SciPhi-AI/R2R or the self-hosting page (`https://r2r-docs.sciphi.ai/self-hosting/configuration/embedding`), and drop `rerank_model` from the row or mark it **Unconfirmed**.

### Nice to Have (open)

1. **knowledge-rag's store is described imprecisely** (l.31). Its README calls SQLite FTS5 an "opt-in lexical retrieval" fast path. BM25 is its own inverted index over ChromaDB. Write "ChromaDB + BM25; optional FTS5".
2. **The Vertex AI Search line cites this review as its source** (l.57: "as reported by this fork's review"). Cite the Google URL directly with the retrieval date, or mark it **secondary**.
3. **The recommendation names `jina:` and `voyage:` as reranker providers** (l.181). That was not confirmed against LiteLLM's `/rerank` provider list, which was not checked. It is a proposal, so this is low risk, but label it Inference or name only Cohere.

**Open findings: 6** (1 Must Fix, 2 Should Fix, 3 Nice to Have).
