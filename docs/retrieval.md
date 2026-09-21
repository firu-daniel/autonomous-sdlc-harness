# RAG (docs retrieval)

**Who reads this:** contributors changing this repository's RAG. The eval that measures it has run: how to run it and what each metric means is [`retrieval-eval.md`](retrieval-eval.md), and what it measured is [`retrieval-eval-results.md`](retrieval-eval-results.md). This document owns the retrieval design and its measured facts: how the pieces fit, why each dependency and model was chosen, what was measured and how, what stays open, what the design buys, where it goes next and what it costs. The `docs` verb's surface is [`cli.md`](cli.md) §11, its setup §2 and its `doctor` checks §7; the `docs.retrieval` key is [`config.md`](config.md) §5. Neither is restated here.

**Retrieval is off by default, opt-in, and not yet measured** against the index-first navigation agents use today — that comparison is the eval's arm A, which is built and deliberately not run, so the clause stands as written. Whether retrieval earns its place therefore stays the roadmap row *Docs-catalog retrieval*'s open question. What **was** measured is the retrieval side of the comparison, on the real models over two committed corpora: per-arm recall, MRR, latency and cost, the calibrated abstention threshold, the cold build and the index size on disk. [`retrieval-eval.md`](retrieval-eval.md) is how to run that eval, what each metric means and the decision rule; [`retrieval-eval-results.md`](retrieval-eval-results.md) is the record of what it measured, arm A's awaited hand run included. The Markdown stays the source of truth: the index is a derived, uncommitted cache, and deleting it loses nothing.

---

## How it fits together

**Corpus.** `cli/src/retrieval/corpus.ts` → `corpusFiles` takes every `*.md` under `docs.root` plus every conventions document `layers[]` names, and nothing else. A missing or out-of-repository path is a warning, and the rest is still indexed.

**Chunking.** `cli/src/retrieval/chunk.ts` → `chunkMarkdown` starts a chunk at every `## ` and `### ` line outside a fence; a `###` section is its own chunk. A `##` with no body of its own that has at least one `###` child is the one exception: it is folded into those children rather than emitted, because a house-template wrapper heading produces a near-empty row in every document of a catalog and those rows spend the fixed `ARM_CANDIDATES` budget while the wrapper's words stay searchable through each child's heading path. An empty section with no child at all is still emitted, because its words survive nowhere else in the index and skipping it would make that heading unfindable. Content before the first such heading is the preamble chunk. A chunk's identity is `path#anchor`, with a GitHub-style slug so the citation lands on the rendered heading, and its change signal is the sha256 of the embedded text: title, heading path, a blank line, body.

**Incremental refresh.** `cli/src/retrieval/refresh.ts` → `refreshIndex` deletes stored keys the corpus no longer has, embeds only new or changed chunks, in batches of 32, and counts the rest as unchanged. The embedder's id is stored in the `meta` table, and a different id clears the index and rebuilds it, so two models' vectors never share one index. A changed document title re-embeds every chunk of that document, because the title is part of each chunk's text.

**Store.** `cli/src/retrieval/store.ts` → `openPgliteStore` implements `DocStore` on PGlite, an embedded Postgres, with the `vector` and `pg_textsearch` extensions: an HNSW index over `embedding vector_cosine_ops` and a BM25 index over the chunk text `WITH (text_config='english')`. It persists to `<stateDir>/docs_index/`, one index per checkout, which `init` ignores as a whole directory. Every value reaches SQL as a bound parameter, and the SQL is plain Postgres plus those two extensions.

**Search.** `cli/src/retrieval/search.ts` → `searchDocs` has four modes: `lexical`, `vector`, `fused` and `fused-rerank`, the default. Each arm returns `ARM_CANDIDATES = 50` rows. Reciprocal rank fusion scores a hit at rank `r` as `1 / (RRF_K + r)` with `RRF_K = 60`. In `fused-rerank`, the top `RERANK_CANDIDATES = 20` fused rows go to the cross-encoder.

**Abstention.** Only `fused-rerank` abstains, printing `no confident match`, when there are no candidates or the best reranker score is below `ABSTAIN_SCORE_THRESHOLD = 0.32`. That constant is **calibrated** against the real reranker's measured score distribution; `docs/retrieval-eval-results.md` → `## Threshold calibration` is the record of how the value was chosen and on what, and this document restates none of it. The other modes' scores are rank-derived and uncalibrated, so those modes never abstain.

**Models.** `cli/src/retrieval/models.ts`. The embedder is `EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5'`, the ONNX port of `BAAI/bge-small-en-v1.5` (MIT): `q8`, CLS pooling, normalised, 384 dimensions, with bge's retrieval instruction prefixed to queries only. The reranker is `RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2'`, the ONNX port of `cross-encoder/ms-marco-MiniLM-L-6-v2` (Apache-2.0): `q8`, scored as the sigmoid of its one logit, in `[0, 1]`. Both were chosen for size and licence; the reranker was preferred to `bge-reranker-base`, about 278M parameters against about 23M. Only `fetchModels` downloads. Every other load runs with remote models disabled, and `MODEL_FILES` lists the files an offline load needs. `RETRIEVAL_STUB_ENV` (`AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`, `hash-v1` or `hash-v2`) swaps both models for deterministic hash stubs, which is how the suite runs without a download.

**Server.** `cli/src/retrieval/server.ts` → `docs serve` is a stdio MCP server named `harness-docs` with one read-only tool, `search_docs`, fully qualified `mcp__harness-docs__search_docs`. It refreshes the index before each query. Its result is document text, which an agent treats as a pointer to open, not as instructions or evidence.

**Query log.** `cli/src/retrieval/queryLog.ts` owns `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG`, whose value is a path to a file: set and non-empty, the server appends one JSON line per `search_docs` call, carrying the outcome (answered, refresh failure or search failure), the UTC timestamp, the query as received, `k` as resolved, the hit count, the best score, whether the call abstained, the refresh counts and the wall time in milliseconds; unset or empty, nothing is opened and nothing is written. This is what the eval branch starts from, and it is the only thing that distinguishes a tool no agent reaches for from one agents reach for and get nothing from (an argument refusal is not recorded: it precedes the resolved query and `k` the record's fixed key set requires). It is not a `harness.config.json` key, a failed append degrades to a warning on stderr rather than failing the call, and nothing is ever written to stdout, which belongs to the MCP transport.

- **How the variable reaches the server, since an export does not.** The agent runner starts the server from `.mcp.json` and passes only the MCP SDK's fixed inherited set — `DEFAULT_INHERITED_ENV_VARS` in `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM` and `USER` on POSIX — so a variable exported in the shell that starts the runner never reaches `docs-search-server.sh`. The route is an entry the operator adds by hand to the `harness-docs` server's `env` object in their own `.mcp.json`, which `init` merges rather than overwrites, so the hand-added key survives a re-run. `init` never generates it and no shipped template carries the spelling: an adopter who wants no log gains no surface to read. Give an **absolute** path: whether the agent runner starts this server with the checkout root as its working directory is still open (`## Still open`), so a relative one is not safe.

  ```json
  "harness-docs": {
    "type": "stdio",
    "command": "bash",
    "args": ["scripts/docs-search-server.sh"],
    "env": { "AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG": "/absolute/path/to/docs-queries.jsonl" }
  }
  ```

  `command`, `args` and `type` are `init`'s and already correct for your configured `scriptsDir`; add only the `env` key.

**Launcher and registration.** When retrieval applies, `init` writes a `harness-docs` entry into `.mcp.json` whose command is `bash` on the repository's own `<scriptsDir>/docs-search-server.sh`. It also merges a profile fragment, `settings.autonomous.retrieval.json`, that enables the server and allows its tool. The launcher resolves the machine cache directory through `hr_cache_dir` and `exec`s the runtime's `docs serve`, with no fallback.

- **Why the committed `.mcp.json` names a repository script, not a machine path.** A committed file cannot know where one machine's cache or `npx` cache sits, and this follows `cli/scripts/README.md`'s *"The daemon's program stays inside the repository it works on"*: a long-running program is started from inside the checkout rather than from an evictable cache path.

**Loading.** `cli/src/retrieval/runtime.ts`. The retrieval packages are optional peer dependencies, loaded only by `loadRetrievalModule`'s dynamic `import()`, so a verb that does not retrieve loads none of them. `init` installs the peers and this CLI, at its own version, into the runtime directory `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/runtime`. The model weights go into the sibling `retrieval/models`. `retrievalRuntimeState` is the one predicate for "is the runtime installed?". `retrievalCliEntry` picks the entry only for the two short-lived children that do not serve: `docs fetch-models` and `doctor`'s index probe.

- **Why the runtime lives in a machine-shared cache, not in the adopter's project.** A CLI run from `npx`'s cache cannot resolve a package installed in the project (measured fact (a) below), so installing the peers into the project would not make them loadable. A shared directory also means the roughly 300 MB runtime and the model weights are installed once per machine, not once per checkout or worktree.

**Setup.** `cli/src/retrieval/setup.ts`, run by `init` after its plan when retrieval applies. It installs the runtime unless `retrievalRuntimeState().installed`, then runs `docs fetch-models`. Every download happens here, while an operator is present, because an unattended run has no network to count on. A failed step is a warning, and `doctor` fails until a re-run completes it.

**`doctor`.** `cli/src/doctor/checks.ts` carries three checks, last in order. `retrieval-dependencies` grades the runtime the launcher runs. `retrieval-model-cache` checks that every `MODEL_FILES` entry is cached. `retrieval-index` runs `docs index --in-memory` in a child, starting no server and writing nothing.

**Why `setup-worktree.sh` does not warm the index.** This lead-in states what the shipped script does; the decision below is that it should change, and this branch does not change it.

The first `search_docs` call refreshes incrementally, and a fresh worktree's first refresh is its cold build. The cost of warming at worktree setup is a model load per worktree, spent on **agents that do not query** — not on branches that never query, which is close to an empty category, since every branch runs planning and every plan agent holds the grant.

The two cold-build figures, the stub's and the model's:

- The **stub's**, on the suite's fixture corpus (3 files, 9 chunks): 967 to 1372 ms over five `docs index` subprocess runs, including process and PGlite start-up (macOS, Node v20.19.5, 2026-09-17; recorded beside case (a) in `cli/test/docs-retrieval.test.mjs`). That is the stub's figure, not the model's.
- The **real models'**, on this repository's own `docs/`: `docs/retrieval-eval-results.md` → `## Cold build and index size` measures 12.2 s total at 177 chunks, of which the refresh is 62.51 ms per chunk — the only phase that scales with the corpus.

**The standing rule is that a cold build costing more than 60 seconds moves out of the agent's path and into `setup-worktree.sh`**, because the agent runner's MCP tool-call timeout defaults to 60 s. Applied to that refresh figure, a mature catalog of roughly 1,500 chunks extrapolates to 93.8 s of refresh and 94.8 s in total, crossing 60 s in total at about 940 chunks: **the rule trips, and the recorded decision is that the cold build belongs in `setup-worktree.sh`** rather than in an agent's first `search_docs` call. This branch does not make that move — it changes no script — so what ships is still the in-line build, correct for any catalog under that crossover and over budget above it. The move is owed by **roadmap item 17** (`docs/development.md` → `## 6. The roadmap this tree defers to`), whose row carries the extrapolation this conclusion rests on and the per-worktree model load the move accepts.

What settles it on a measured rather than an extrapolated number is `docs/development.md` §5 gate 10's hand run against a real catalog, whose leg (iii) wall time replaces the extrapolation. A measurement there that comes back under 60 s at a real catalog's chunk count overturns the conclusion and the paragraph stays as the lead-in reads.

---

## Measured, and how

**(a) `npx` does not resolve peers installed in the project.** Measured 2026-09-17, macOS, Node v20.19.5, and re-run on this branch on the same date and host with the same output. A package directory outside the project dynamically imported a bare specifier installed only in the project's `node_modules`. Run from the project directory:

```bash
node ../cache/node_modules/tool/cli.mjs
```

printed:

```text
not resolved: ERR_MODULE_NOT_FOUND
```

Node resolves a bare `import()` from the importing file's location, so `init` installs into the runtime directory.

**(b) The store.** Measured 2026-09-17 on PGlite 0.5.8, in memory. `PGlite.create({ extensions: { vector, pg_textsearch } })` loaded both extensions, and the HNSW and BM25 indexes built. `ORDER BY body <@> to_bm25query($1, 'chunks_bm25')` for `permission profile` returned only the matching row, at score `-1.8455076217651367` (lower is better). A query with no corpus term returned `[]`. The `vector <=> $1` ordering returned all three rows. The run took 924 ms.

A re-run on this branch (same date, macOS, Node v20.19.5; `@electric-sql/pglite` 0.5.8, `@electric-sql/pglite-pg_textsearch` 0.0.10, `@electric-sql/pglite-pgvector` 0.0.9) showed that **the "only matching rows" behaviour belongs to the BM25 index scan, not to the operator.** On a three-row table with the index built after the inserts, the planner chose `Seq Scan on chunks`, and the same `ORDER BY … LIMIT 50` returned all three rows: the match at `-1.8913201093673706`, the other two at `0`. With `SET enable_seqscan = off` it returned only the match, and `[]` for `quantum chromodynamics`. On 2003 rows the planner used the index unforced, returning one row for the match and none for the non-match. The landed `DocStore.lexicalSearch`, over a stub-built three-chunk index, returned `[{"id":2,"rank":1}]` for `frobnicator` and `[]` for `zzzqqq`.

**(c) The embedding model.** Measured by hand before the task prompt was queued, on macOS and Node 20. Transformers.js 4.3 ran `Xenova/bge-small-en-v1.5` (`dtype: 'q8'`, CLS, normalised) to 384 dimensions, with an explicit `env.cacheDir`, in about 4 s cold, including a 33 MB download. `onnxruntime-node` is about 290 MB installed.

**(d) The real models end to end.** Gate 10 (`docs/development.md` §5) is **partly** satisfied: that gate is defined against a throwaway repository outside this checkout whose `docs/` indexes to at least ~1,500 chunks, and no run has had one — so its own six legs stay owed, and the figures below were taken over the two committed eval corpora instead.

Both models loaded and ran **outside the stub** on 2026-09-21, host `Daniels-MacBook-Air.local`, Node `v20.19.5`, embedder `Xenova/bge-small-en-v1.5:q8:cls:384:v1` and reranker `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1`. The reranker's real load and run is what retires the reranker question that stood under `## Still open`. Each figure is cited rather than restated, because the eval's results file is its one home:

- Per-arm recall, MRR, latency and cost, each with the corpus stamp, the models and the abstention threshold it was taken under — `docs/retrieval-eval-results.md`, the generated region.
- The cold build, per phase and per chunk, and the index size on disk — `docs/retrieval-eval-results.md` → `## Cold build and index size`.
- The shipped stdio MCP server driven over the larger corpus with the real models, with its server-side and client-side latency — `docs/retrieval-eval-results.md` → `## The query-log pass`. That server was started with an explicit working directory against a throwaway fixture repository, which is **not** the `.mcp.json` launch path and settles nothing about it.
- The shipped default mode `fused-rerank` measured against `fused` on both corpora — it scores lower on every relevance column and abstains on every negative query where `fused` abstains on none — `docs/retrieval-eval-results.md` → `## The shipped default against fusion alone`.

Three legs remain unrun, and none of them is something this repository can supply for itself:

- **The adopter-facing provisioning path, leg (i).** `cli/src/retrieval/setup.ts` installs `<own manifest name>@<own manifest version>` **from the registry**, and `cli/package.json`'s version has not moved off `0.1.0` since the initial commit — which predates every retrieval module — so the published `0.1.0` carries no `dist/retrieval` and the path cannot be exercised until a version carrying retrieval is published. Publishing is its own decision on its own branch: it is neither worked around here nor version-bumped for.
- **The unattended session through `.mcp.json`, leg (v).** Nothing has started the server the way the agent runner does.
- **Any Linux host.** Every measurement in this document is macOS.

---

## Still open

- **Whether any of this holds on Linux.** Every measurement above is macOS. Settled by Gate 10 run on a Linux host.
- **Whether the agent runner starts the `.mcp.json` server with the checkout root as its working directory.** The launcher path in `.mcp.json` is relative and relies on it. Settled by Gate 10's unattended-session leg.
- **Whether the lexical arm filters to matching chunks on every index.** Narrowed, not closed. `cli/test/docs-retrieval-store.test.mjs` case (a) measures that `lexicalSearch` returns the matching chunk alone — and nothing at all for a term no chunk carries — at 40, 166 and 1024 rows, which covers both committed corpora's sizes and one far above them; it holds there because `openPgliteStore` creates the BM25 index before any row exists, so the planner has no statistics for `chunks` and takes the index scan at every size. What stays open is the other plan: case (b) bisects the crossover on a stats-informed plan, with the index built after the rows, to **63 rows**, so an index whose statistics do describe its rows — after a `REINDEX`, or a dump restore — can sit below that crossover and return non-matching rows at score `0`. The number is a planner decision rather than a contract, and a PGlite or `pg_textsearch` bump can move it, which is why that case asserts it in a band and fails when it moves instead of trusting it.
- **The abstain threshold on a real catalog.** `ABSTAIN_SCORE_THRESHOLD` is now calibrated, at `0.32` in `cli/src/retrieval/search.ts`; `docs/retrieval-eval-results.md` → `## Threshold calibration` is the record of how that value was chosen and on what. What stays open is confirmation against a real catalog, which is a hand run this repository has not made.

---

## What this buys you

- **Local, not hosted.** An adopter's docs never leave their machine. There is no hosted vector database and no embedding or rerank API, so there is no key to manage and nothing to reach from an unattended run.
- **Embedded and in-process.** There is no database server to install or keep running. The index is a per-checkout cache that its worktree owns and can rebuild.
- **One Postgres engine rather than two stores.** BM25 and vectors share one transaction, one set of chunk ids and one refresh, so lexical and vector results can never describe different corpus states. There is also one dependency to pin rather than two.

---

## Where it goes next

The adapter seam is deliberately kept open. At millions of chunks, the move is a real Postgres with the same two extensions, `pgvector` and `pg_textsearch`, behind the same `DocStore` interface, reached by connection string. The store keeps its SQL to plain Postgres plus those extensions so that stays possible. This branch does not build it.

---

## What it costs

- About 300 MB of runtime per machine.
- A PGlite version pinned exactly, because the two extension packages dictate it.
- An index that is a second representation of the docs, **per checkout** — 43.2 MB for this repository's own 177 chunks, extrapolating to a few hundred megabytes at a mature catalog's ~1,500, with a 12.2 s cold build (`docs/retrieval-eval-results.md` → `## Cold build and index size`, whose size row is an upper bound). It is never committed and always rebuildable, which is why deleting it loses nothing.
