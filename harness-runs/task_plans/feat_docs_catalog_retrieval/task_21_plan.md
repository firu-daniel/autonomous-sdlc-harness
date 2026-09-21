### Task 21 — Write `docs/retrieval.md`: the design, the model choice, the measured facts and the trade-offs

**Goal:** Give docs retrieval its developer document of record. It covers what the feature is and is not, how the pieces fit, why each dependency and model was chosen, what was measured and how, what stays open, and the task prompt's trade-offs section. That section explains why the store is embedded and local, why both halves live in one Postgres engine rather than in two stores, and what changes at scale.

**Depends on:** Task 20, the last documentation task that states the verb's surface, which this document links rather than restates. The facts it records are Tasks 2–13's:

- **Loading.** `cli/src/retrieval/runtime.ts` (`loadRetrievalModule`, `retrievalCliEntry`, the runtime and model directories under `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/`).
- **Models.** `cli/src/retrieval/models.ts` (`EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5'`, q8, CLS, normalised, 384-d, MIT; `RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2'`, q8, sigmoid score, Apache-2.0; `MODEL_FILES`; the stub seam `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`).
- **Chunking.** `cli/src/retrieval/chunk.ts` (splits at `##` and `###`; identity is `path#anchor`; the change signal is a sha256 of the chunk text).
- **Store and refresh.** `cli/src/retrieval/store.ts` (`DocStore`; PGlite with `vector` and `pg_textsearch`; HNSW `vector_cosine_ops`; BM25 `text_config='english'`; index at `<stateDir>/docs_index/`) and `cli/src/retrieval/refresh.ts` (embedder id stored in `meta`, full rebuild on change).
- **Search.** `cli/src/retrieval/search.ts` (RRF `k=60`, 50 per arm, 20 reranked, `ABSTAIN_SCORE_THRESHOLD` provisional, four modes).
- **Server.** `cli/src/retrieval/server.ts` (`harness-docs`, `search_docs`).
- **Launcher.** `docs-search-server.sh` (Task 9).
- **Wiring.** The `.mcp.json` entry and profile fragment (Task 10).
- **Setup.** `init` (Tasks 11–12).
- **`doctor`.** The three checks (Task 13).

Read those modules' headers and constants before writing, and quote the values as they landed rather than as listed here.

### Targets

- `docs/retrieval.md` (new).

**Work:**

- [ ] Opening: state **who reads this and what it owns** (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, *A prose document under `docs/`*). It is written for contributors and for the follow-up eval branch `feat_docs_retrieval_eval`, and it owns the retrieval design and its measured facts. `cli.md` owns the verb, `config.md` the key. Then say, plainly: retrieval is **off by default, opt-in, and not yet measured** against index-first navigation. The Markdown stays the source of truth, and the index is a derived, uncommitted cache. The roadmap row is cited by its title, *Docs-catalog retrieval*, with **no** item number.
- [ ] `## How it fits together`: one short paragraph per stage (corpus, chunking, incremental refresh, store, search, abstention, server, launcher and registration, setup, `doctor`), each naming its module. Say why the runtime lives in a machine-shared cache directory rather than in the adopter's project. Say why the committed `.mcp.json` names a repository script instead of a machine path, following `cli/scripts/README.md`'s *"The daemon's program stays inside the repository it works on"*. And say why `setup-worktree.sh` does **not** warm the index: the first query refreshes incrementally, and warming would spend a model load on every worktree whatever the branch queries. Record the revisit condition. If the real-model cold build on a real catalog is long enough that a first `search_docs` call risks the agent runner's tool-call timeout, warming in `setup-worktree.sh` is the move. Record the stub cold-build time Task 6 noted beside its case (a), labelled as the stub's, never the model's.
- [ ] `## Measured, and how` — each fact with what was measured, the command and the exact output (`.claude/context/conventions.md` → `## Documents of record`):
  - **(a) `npx` peer resolution.** Measured 2026-09-17, macOS, Node v20.19.5. A package directory outside the project dynamically imported a bare specifier installed only in the project's `node_modules`. `node ../cache/node_modules/tool/cli.mjs`, run from the project, printed `not resolved: ERR_MODULE_NOT_FOUND`. That is why `init` installs into the runtime directory.
  - **(b) The store.** Measured 2026-09-17 on PGlite 0.5.8, in memory. `PGlite.create({ extensions: { vector, pg_textsearch } })` loaded both extensions, and the HNSW and BM25 indexes built. `ORDER BY body <@> to_bm25query($1, 'chunks_bm25')` for `permission profile` returned only the matching row, at score `-1.8455076217651367`. A query with no corpus term returned `[]`. The run took 924 ms.
  - **(c) The embedding model.** Measured by hand before the task prompt was queued, on macOS and Node 20: Transformers.js 4.3 ran `Xenova/bge-small-en-v1.5` (`dtype: 'q8'`, CLS, normalised) to 384 dimensions with an explicit `env.cacheDir`, in about 4 s cold, including a 33 MB download. `onnxruntime-node` is about 290 MB installed.
  - **(d)** Whatever Gate 10 (Task 22) records, left as a placeholder line naming that gate if it has not been run.
- [ ] `## Still open`, each item with what would settle it: whether `Xenova/ms-marco-MiniLM-L-6-v2` runs the same way (Gate 10); whether any of this holds on Linux (Gate 10 on a Linux host); whether the agent runner starts the `.mcp.json` server with the checkout root as its working directory, which the relative launcher path relies on (Gate 10); and the abstain threshold, **provisional**, with the fixture scores its constant's doc comment records, calibrated by `feat_docs_retrieval_eval`.
- [ ] `## Trade-offs` (the task prompt's §6 section):
  - **Local, not hosted.** An adopter's docs never leave their machine, and there is no hosted vector database and no embedding or rerank API.
  - **Embedded and in-process.** No server to install, and a per-checkout cache that a worktree owns and can rebuild.
  - **One Postgres engine rather than two stores.** BM25 and vectors share one transaction, one set of chunk ids and one refresh, so lexical and vector results can never describe different corpus states, and there is one dependency to pin rather than two.
  - **At scale.** At millions of chunks the move is a real Postgres with the same two extensions (`pgvector`, `pg_textsearch`) behind the same `DocStore` interface, by connection string. This branch does not build that.
  - **The costs, stated plainly.** About 300 MB of runtime per machine, a pinned PGlite version the two extensions dictate, and an index that is a second representation of the docs, which is why it is never committed and always rebuildable.

  Write any command a reader runs in a fenced block, one command per line.

**Verification:**

- `docs/retrieval.md` opens with its reader and ownership statement, and contains `## How it fits together`, `## Measured, and how`, `## Still open` and `## Trade-offs`.
- Every constant value quoted matches the landed source: `grep -n "RRF_K\|ARM_CANDIDATES\|RERANK_CANDIDATES\|ABSTAIN_SCORE_THRESHOLD" cli/src/retrieval/search.ts` agrees with the text.
- `grep -n -E "items? [0-9]+" docs/retrieval.md` is empty, and `bash scripts/run-gates.sh` gate 6a (no machine paths) passes. The document names `$HOME/.cache` and `XDG_CACHE_HOME` symbolically, never an absolute home path.

**Deviations from plan:**

- Measured facts (a) and (b) were re-run with scratch probes on 2026-09-17 (macOS, Node v20.19.5). (a) reproduced `not resolved: ERR_MODULE_NOT_FOUND`. (b) did **not** reproduce "only the matching row" on a three-row table: the planner chose `Seq Scan on chunks` and `ORDER BY body <@> to_bm25query($1, 'chunks_bm25') LIMIT 50` returned every row, non-matches at score `0`; `SET enable_seqscan = off` and a 2003-row table both gave only the match and `[]` for a non-match, and the landed `DocStore.lexicalSearch` on a stub-built three-chunk index returned only the match and `[]`. `docs/retrieval.md` keeps the planning figures and adds the re-run under (b), plus a `## Still open` item on whether the lexical arm filters on every index. The `store.ts` comment *"returns only rows matching a term"* rests on the planner choosing the index; that is a `cli`-layer question, not changed here.
- Gate 6a: `bash scripts/test.sh` exits 1 with 6a as its only failure; its hits are the worktree's `.git` pointer file, `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md` and `harness-runs/scratch/task6-test.log`, none in `docs/retrieval.md`. `grep -c` for the home path over `docs/retrieval.md` returns `0`.
- Item (d) is a placeholder: Gate 10 (Task 22) has not been run.
