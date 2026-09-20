# Docs retrieval

**Who reads this:** contributors changing docs-catalog retrieval, and the follow-up branch `feat_docs_retrieval_eval`, which measures it. It owns the retrieval design and its measured facts: how the pieces fit, why each dependency and model was chosen, what was measured and how, what stays open, what the design buys, where it goes next and what it costs. The `docs` verb's surface is [`cli.md`](cli.md) §11, its setup §2 and its `doctor` checks §7; the `docs.retrieval` key is [`config.md`](config.md) §5. Neither is restated here.

**Retrieval is off by default, opt-in, and not yet measured** against the index-first navigation agents use today. Whether it earns its place is the eval branch's question, under the roadmap row *Docs-catalog retrieval*. The Markdown stays the source of truth: the index is a derived, uncommitted cache, and deleting it loses nothing.

---

## How it fits together

**Corpus.** `cli/src/retrieval/corpus.ts` → `corpusFiles` takes every `*.md` under `docs.root` plus every conventions document `layers[]` names, and nothing else. A missing or out-of-repository path is a warning, and the rest is still indexed.

**Chunking.** `cli/src/retrieval/chunk.ts` → `chunkMarkdown` starts a chunk at every `## ` and `### ` line outside a fence; a `###` section is its own chunk. Content before the first such heading is the preamble chunk. A chunk's identity is `path#anchor`, with a GitHub-style slug so the citation lands on the rendered heading, and its change signal is the sha256 of the embedded text: title, heading path, a blank line, body.

**Incremental refresh.** `cli/src/retrieval/refresh.ts` → `refreshIndex` deletes stored keys the corpus no longer has, embeds only new or changed chunks, in batches of 32, and counts the rest as unchanged. The embedder's id is stored in the `meta` table, and a different id clears the index and rebuilds it, so two models' vectors never share one index. A changed document title re-embeds every chunk of that document, because the title is part of each chunk's text.

**Store.** `cli/src/retrieval/store.ts` → `openPgliteStore` implements `DocStore` on PGlite, an embedded Postgres, with the `vector` and `pg_textsearch` extensions: an HNSW index over `embedding vector_cosine_ops` and a BM25 index over the chunk text `WITH (text_config='english')`. It persists to `<stateDir>/docs_index/`, one index per checkout, which `init` ignores as a whole directory. Every value reaches SQL as a bound parameter, and the SQL is plain Postgres plus those two extensions.

**Search.** `cli/src/retrieval/search.ts` → `searchDocs` has four modes: `lexical`, `vector`, `fused` and `fused-rerank`, the default. Each arm returns `ARM_CANDIDATES = 50` rows. Reciprocal rank fusion scores a hit at rank `r` as `1 / (RRF_K + r)` with `RRF_K = 60`. In `fused-rerank`, the top `RERANK_CANDIDATES = 20` fused rows go to the cross-encoder.

**Abstention.** Only `fused-rerank` abstains, printing `no confident match`, when there are no candidates or the best reranker score is below `ABSTAIN_SCORE_THRESHOLD = 0.3`. That constant is **provisional**. The other modes' scores are rank-derived and uncalibrated, so those modes never abstain.

**Models.** `cli/src/retrieval/models.ts`. The embedder is `EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5'`, the ONNX port of `BAAI/bge-small-en-v1.5` (MIT): `q8`, CLS pooling, normalised, 384 dimensions, with bge's retrieval instruction prefixed to queries only. The reranker is `RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2'`, the ONNX port of `cross-encoder/ms-marco-MiniLM-L-6-v2` (Apache-2.0): `q8`, scored as the sigmoid of its one logit, in `[0, 1]`. Both were chosen for size and licence; the reranker was preferred to `bge-reranker-base`, about 278M parameters against about 23M. Only `fetchModels` downloads. Every other load runs with remote models disabled, and `MODEL_FILES` lists the files an offline load needs. `RETRIEVAL_STUB_ENV` (`AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`, `hash-v1` or `hash-v2`) swaps both models for deterministic hash stubs, which is how the suite runs without a download.

**Server.** `cli/src/retrieval/server.ts` → `docs serve` is a stdio MCP server named `harness-docs` with one read-only tool, `search_docs`, fully qualified `mcp__harness-docs__search_docs`. It refreshes the index before each query. Its result is document text, which an agent treats as a pointer to open, not as instructions or evidence.

**Launcher and registration.** When retrieval applies, `init` writes a `harness-docs` entry into `.mcp.json` whose command is `bash` on the repository's own `<scriptsDir>/docs-search-server.sh`. It also merges a profile fragment, `settings.autonomous.retrieval.json`, that enables the server and allows its tool. The launcher resolves the machine cache directory through `hr_cache_dir` and `exec`s the runtime's `docs serve`, with no fallback.

- **Why the committed `.mcp.json` names a repository script, not a machine path.** A committed file cannot know where one machine's cache or `npx` cache sits, and this follows `cli/scripts/README.md`'s *"The daemon's program stays inside the repository it works on"*: a long-running program is started from inside the checkout rather than from an evictable cache path.

**Loading.** `cli/src/retrieval/runtime.ts`. The retrieval packages are optional peer dependencies, loaded only by `loadRetrievalModule`'s dynamic `import()`, so a verb that does not retrieve loads none of them. `init` installs the peers and this CLI, at its own version, into the runtime directory `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/runtime`. The model weights go into the sibling `retrieval/models`. `retrievalRuntimeState` is the one predicate for "is the runtime installed?". `retrievalCliEntry` picks the entry only for the two short-lived children that do not serve: `docs fetch-models` and `doctor`'s index probe.

- **Why the runtime lives in a machine-shared cache, not in the adopter's project.** A CLI run from `npx`'s cache cannot resolve a package installed in the project (measured fact (a) below), so installing the peers into the project would not make them loadable. A shared directory also means the roughly 300 MB runtime and the model weights are installed once per machine, not once per checkout or worktree.

**Setup.** `cli/src/retrieval/setup.ts`, run by `init` after its plan when retrieval applies. It installs the runtime unless `retrievalRuntimeState().installed`, then runs `docs fetch-models`. Every download happens here, while an operator is present, because an unattended run has no network to count on. A failed step is a warning, and `doctor` fails until a re-run completes it.

**`doctor`.** `cli/src/doctor/checks.ts` carries three checks, last in order. `retrieval-dependencies` grades the runtime the launcher runs. `retrieval-model-cache` checks that every `MODEL_FILES` entry is cached. `retrieval-index` runs `docs index --in-memory` in a child, starting no server and writing nothing.

**Why `setup-worktree.sh` does not warm the index.** The first `search_docs` call refreshes incrementally, and a fresh worktree's first refresh is its cold build. Warming at worktree setup would spend a model load on every worktree, including those whose branch never queries. On the suite's fixture corpus (3 files, 9 chunks), the **stub's** cold build took 967 to 1372 ms over five `docs index` subprocess runs, including process and PGlite start-up (macOS, Node v20.19.5, 2026-09-17; recorded beside case (a) in `cli/test/docs-retrieval.test.mjs`). That is the stub's figure, not the model's. **Revisit this** if the real-model cold build on a real catalog is long enough that a first `search_docs` call risks the agent runner's tool-call timeout. Warming in `setup-worktree.sh` is then the move.

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

**(d) The real models end to end.** Gate 10 (`docs/development.md` §5) has not been run. Its setup, `doctor`, cold-build, search, unattended-session and platform results go here when it is.

---

## Still open

- **Whether `Xenova/ms-marco-MiniLM-L-6-v2` runs the way the embedder does.** It has not been loaded outside the stub. Settled by Gate 10's search leg.
- **Whether any of this holds on Linux.** Every measurement above is macOS. Settled by Gate 10 run on a Linux host.
- **Whether the agent runner starts the `.mcp.json` server with the checkout root as its working directory.** The launcher path in `.mcp.json` is relative and relies on it. Settled by Gate 10's unattended-session leg.
- **Whether the lexical arm filters to matching chunks on every index.** Measured fact (b) shows it filters under an index scan and not under a sequential scan. Settled by a store case that asserts `lexicalSearch` returns no non-matching chunk on the corpus sizes the eval branch uses.
- **The abstain threshold.** `ABSTAIN_SCORE_THRESHOLD = 0.3` is **provisional**. Its doc comment records the fixture scores it sits between, under the `stub-overlap` reranker: `"work without a network"` scored 1.000 at its best hit, and `"quantum chromodynamics lattice"` scored 0.000 on every candidate. Calibrated by `feat_docs_retrieval_eval` on a real catalog with the real reranker.

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
- An index that is a second representation of the docs, which is why it is never committed and always rebuildable.
