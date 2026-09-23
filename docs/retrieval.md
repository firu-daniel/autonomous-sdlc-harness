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

- **How the variable reaches the server, since an export does not.** The agent runner starts the server from `.mcp.json` and passes only the MCP SDK's fixed inherited set — `DEFAULT_INHERITED_ENV_VARS` in `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM` and `USER` on POSIX — so a variable exported in the shell that starts the runner never reaches `docs-search-server.sh`. The route is an entry the operator adds by hand to the `harness-docs` server's `env` object in their own `.mcp.json`, which `init` merges rather than overwrites, so the hand-added key survives a re-run. `init` never generates it and no shipped template carries the spelling: an adopter who wants no log gains no surface to read. Give an **absolute** path. Gate 10's leg (v) (`## Measured, and how`, item (d)) started a session **at the checkout root** and the relative launcher path resolved from that session's working directory, so the launch path works when the session starts there. What it does not show is which of the two the runner uses — the session's working directory or the checkout root — because in that run they were the same directory (`## Still open`). An absolute path is the one form correct either way, and whichever client starts the server.

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

**Why `setup-worktree.sh` does not warm the index.** The shipped script does not warm it, and the decision below is the standing one rather than a deferral: it should not.

The first `search_docs` call refreshes incrementally, and a fresh worktree's first refresh is its cold build.

The two cold-build figures, the stub's and the models':

- The **stub's**, on the suite's fixture corpus (3 files, 9 chunks): 967 to 1372 ms over five `docs index` subprocess runs, including process and PGlite start-up (macOS, Node v20.19.5, 2026-09-17; recorded beside case (a) in `cli/test/docs-retrieval.test.mjs`). That is the stub's figure, not the model's.
- The **real models'**, on both corpora they have been measured over — this repository's own `docs/` at 177 chunks, and a real documentation catalog at 1,960 chunks: `docs/retrieval-eval-results.md` → `## Cold build and index size` holds the wall times, the per-phase and per-chunk breakdown and the index size for each, every figure under its own host and corpus stamp, and is the only place those numbers are written.

**Every published cost figure is the one measured on the recording host: a slower host, or a slower route, pays more, and no scaling factor for other hardware is published here.** Cold-build time is dominated by embedding throughput, which is a property of the machine. This document has a second, independent demonstration of the same point. Download throughput on the recording host is **route-dependent rather than a single figure** — about 1.1–1.4 MB/s over Cloudflare and npm against about 17.5–19.1 MB/s from HuggingFace **on the same connection** — so a single-number reading predicted about six minutes for gate 10's leg (i) where the measured cold setup was **128 s** (npm ships compressed tarballs in parallel, and installed size is not transfer size). A single bandwidth figure standing for the host, and any wall-clock prediction derived from one, is an error this document does not reintroduce. Whether the harness should detect host speed at run time is a different question and not this document's.

**The cold build stays inside the first `search_docs` call, because that is the only mechanism serving every entry point.** A session that never ran `setup-worktree.sh` — a plain interactive session in the main checkout — still gets a built index, which a warm performed by a script on the autonomous path would not give it. **Roadmap item 17 is cancelled on that reason rather than deferred**, and no later branch makes the move.

**The 60-second rule this paragraph used to state is struck, and no constant replaces it.** It moved a cold build out of the agent's path once its wall time crossed a threshold, on the premise that the agent runner's MCP tool-call timeout defaults to 60 s, and that premise is false. `MCP_TOOL_TIMEOUT` governs MCP tool-call **execution** and defaults to `1e8` ms, about 27.8 hours. `MCP_TIMEOUT`'s 30,000 ms is a **different setting** — MCP server **startup** — and conflating the two is the likeliest origin of the error. What can end a long call is **silence, not duration**: `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT` is 1,800,000 ms for **stdio** servers, which the `harness-docs` server is, and `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` moves a long call to a background task rather than failing it. Source: `strings -a` over the installed binary at `~/.local/share/claude/versions/2.1.278` — Claude Code 2.1.278, macOS arm64, 2026-09-22 — with the full reading in `docs/retrieval-eval-results.md` → `## Cold build and index size`. **No number stands in the struck one's place** — not 1,800 s, not `${MCP_TOOL_TIMEOUT}`, not a fresh crossover chunk count — because the premise that wall time causes a failure is false on every path the harness uses, and a rule restated against a new number would carry the same defect in a new coat. What the build owes instead is a property rather than a threshold: **it must not go silent for longer than the idle timeout**, and a build that reports progress cannot trip anything above.

**What the move would have cost, and what it would have wasted.** The index is built **once per worktree** and shared by every dispatch in it, so the question is never *which* agents query but only *whether the worktree queries at all* — and the build is paid either way the moment one agent does. The agents that carry `mcp__harness-docs__search_docs` in their `tools:` allowlist are the roster `plugin/agents/README.txt` → `The docs-retrieval grant — one roster, one wire` holds, which is that set's one home and carries the command to re-derive it. What matters here is that `task-plan-writer` is on it and is dispatched by every code flow's planning phase, so a worktree that reaches planning queries. Two states never query, and they are states rather than a class of agent: a run that stalls before its first planning dispatch, and — the structural one — the docs-catalog engine `/autonomous-sdlc-harness:branch-start-docs-autonomous`, which dispatches only `docs-writer` and `docs-reviewer`, neither of which is on that roster, so its runs never query the index at all.

The model load is not the cost either. The measured phase breakdown at 1,960 chunks (`docs/retrieval-eval-results.md` → `## Cold build and index size`) puts the model load at a fraction of a percent of the total and the **refresh** at almost all of it, and the refresh is paid at the first query if it is not paid at setup. So warming would waste one model load on the rare worktree that never queries and would **move** rather than add the refresh everywhere else: the move is close to free rather than a trade. It is cancelled on coverage, not on cost, and saying so keeps this paragraph from overstating a cost the measurement does not support.

**What would reopen the question.** Not a clock, since no clock fails a slow build. A cost argument: evidence that the refresh a worktree pays at its first query costs a run more than a wasted warm costs the worktrees that never query, or an entry point `setup-worktree.sh` covers that the in-line build does not — which would take away the coverage reason the cancellation rests on.

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

**(d) The real models end to end.** Gate 10 (`docs/development.md` §5) has been **run by hand, in full, all six legs**, on **2026-09-22**, against a real documentation catalog rather than a fixture.

**Host.** MacBook Air, Apple M4, 10 cores (4 performance + 6 efficiency), 16 GB, macOS 15.7.4 (24G517), `uname -sr` → `Darwin 24.6.0`, arm64, Node `v22.23.2`, npm 10.9.8, Claude Code 2.1.278, package under test `autonomous-sdlc-harness@0.2.0` from the registry, load average `1.92 1.76 1.76`, nothing else of consequence running but the session driving the run. The Node version differs from the 2026-09-21 figures' `v20.19.5`: recorded, not reconciled.

**Corpus.** A private real documentation catalog held outside this checkout, at commit `010c50e`, **156 files, 1,960 chunks** — identified by its commit, its size and its character, never by a filesystem path. The gate's roughly 1,500-chunk floor is cleared by 31%.

**Two environment faults the run hit, recorded because they are facts about the shipped product.** `npx autonomous-sdlc-harness` resolved a **shadowed global link at `0.1.0`** rather than the registry package, so every leg pinned `@0.2.0`; that link has since been removed and the bare name now answers `0.2.0`, but any adopter with a linked or globally installed copy hits the same thing and the gate's unpinned commands give no way to notice. And `npx … docs index` **cannot load the optional peers** — it answered `autonomous-sdlc-harness: docs retrieval needs the optional package @huggingface/transformers, which this installation cannot load.` — so legs (iii) and (iv) ran through the route `scripts/docs-search-server.sh` itself execs, `node "$cache/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js"`.

**(i) Setup, cold.** `time npx --yes autonomous-sdlc-harness@0.2.0 init --docs --docs-retrieval --non-interactive` → `13.17s user 7.33s system 16% cpu 2:08.08 total`, **128.08 s**, with the cache **cold**: no `_cacache`, no `_npx` and no harness retrieval cache existed. `du -sh` returned **551M** for the runtime and **57M** for the models. A re-install with npm **warm** cost 17 s, which is a warm-cache elapsed time and not a setup time. Wiring confirmed in the initialized repository: `phases.docs: true`, `docs.retrieval: true`, `stateDir: "sdlc-harness/"`, and a `.mcp.json` declaring the `harness-docs` stdio server. This establishes that the adopter-facing provisioning path works end to end from the registry, which the published `0.1.0` — cut before every retrieval module — could not show. **The bandwidth caveat travels with the 128 s**: it is what this host's routes cost on that date, throughput here is route-dependent rather than a single figure, and no wall-clock number in this document is derived from one — see **Why `setup-worktree.sh` does not warm the index.** above.

**(ii) `doctor`.** The normal run reported `retrieval-dependencies`, `retrieval-model-cache` and `retrieval-index` **all PASS**, `retrieval-index` printing `docs index: 156 files, 1960 chunks; embedded 1960, unchanged 0, deleted 0`, at `Summary: 30 pass, 5 warn, 1 fail` — the one FAIL being `remote` in a scratch repository, gate 5's subject and exactly what gate 10 says to expect. With the model directory moved aside, `retrieval-dependencies` was unchanged PASS while `retrieval-model-cache` and `retrieval-index` **both FAILED**, naming the same 8 missing model files, at `Summary: 28 pass, 5 warn, 3 fail`. This establishes that the three checks grade what they claim to and fail for the stated reason. The machine-wide model cache was restored **in the same command** that moved it, and verified back at 57M.

**(iii) Cold build.** Its four wall times and the thermal cause of their spread, the per-chunk refresh cost, the `du -sh` index figure and the eval-route cross-check are recorded in `docs/retrieval-eval-results.md` → `## Cold build and index size`, which is their one home; none of them is restated here. What that leg establishes for this document is that the real-model cold build was measured on a catalog above the floor: all four runs printed the same summary line, `docs index: 156 files, 1960 chunks; embedded 1960, unchanged 0, deleted 0`.

**(iv) Search.** Default `fused-rerank` mode, so the reranker ran. The positive query *"How do I configure a proxy for the Vite dev server?"* returned `docs/vite/config/server-options.md#serverproxy` first, at score **1.000**, naming the known section exactly; the negative query *"What is the recommended marinade time for lamb souvlaki?"* printed **`no confident match`**. The calibration recorded in `docs/retrieval-eval-results.md` → `## Threshold calibration` therefore holds on a real catalog at both ends. That is a confirmation and not a re-calibration: `ABSTAIN_SCORE_THRESHOLD` stays at `0.32`.

**(v) The unattended session through `.mcp.json`.** `claude -p …` with `--settings .claude/settings.autonomous.json --permission-mode acceptEdits --output-format stream-json --verbose`, and **no permission-bypass flag**. From the stream: `system/init` carried `mcp_servers: [{"name":"harness-docs","status":"connected","source":"project"}, …]`; `mcp__harness-docs__search_docs` was present in the session's tool list and was called once; **no permission denial appears anywhere in the stream**; the call returned the same ranked list the CLI printed, `#serverproxy` at 1.000 first; `result: subtype=success, is_error=false, num_turns=3, duration_ms=9235`, exit 0. The returned results are what prove that **the relative launcher path in `.mcp.json` resolved from the session's working directory**. One observation the gate does not ask for and which the next reader needs: the session reached the tool through a `ToolSearch` call first (`select:mcp__harness-docs__search_docs`), because on this runner version the MCP tool arrives **deferred** rather than pre-loaded. It cost one of the three turns and required no additional grant.

**(vi) Platform.** `uname -sr` → `Darwin 24.6.0`; `node --version` → `v22.23.2`; `claude --version` → `2.1.278 (Claude Code)`; `npx autonomous-sdlc-harness --version` → `0.1.0`, the shadowed global link above rather than the registry package. What every leg actually measured was `node …/runtime/…/dist/cli.js --version` → **`0.2.0`**.

**The eval-corpora figures, taken separately.** Both models loaded and ran **outside the stub** on 2026-09-21, host `darwin 24.6.0`, Node `v20.19.5`, embedder `Xenova/bge-small-en-v1.5:q8:cls:384:v1` and reranker `Xenova/ms-marco-MiniLM-L-6-v2:q8:sigmoid:v1`. The reranker's real load and run is what retires the reranker question that stood under `## Still open`. Each figure is cited rather than restated, because the eval's results file is its one home:

- Per-arm recall, MRR, latency and cost, each with the corpus stamp, the models and the abstention threshold it was taken under — `docs/retrieval-eval-results.md`, the generated region.
- The cold build, per phase and per chunk, and the index size on disk — `docs/retrieval-eval-results.md` → `## Cold build and index size`.
- The shipped stdio MCP server driven over the larger corpus with the real models, with its server-side and client-side latency — `docs/retrieval-eval-results.md` → `## The query-log pass`. That server was started with an explicit working directory against a throwaway fixture repository, which is **not** the `.mcp.json` launch path; leg (v) above is what settles that path.
- The shipped default mode `fused-rerank` measured against `fused` on both corpora — it scores lower on every relevance column and abstains on every negative query where `fused` abstains on none — `docs/retrieval-eval-results.md` → `## The shipped default against fusion alone`.

**One gap remains, and it is a platform gap rather than a leg.** Every measurement in this document was taken on macOS, and no Linux host has run any of it. The two legs that stood unrun are both recorded above: the published `0.2.0` carrying `dist/retrieval` is what made leg (i) runnable, and leg (v) started the server the way the agent runner does.

**The machine-wide model cache is in the state gate 10 left it**: moved aside and restored in the same leg (ii) command, verified back at 57M, and untouched by any of this branch's own work, which runs no index build.

---

## Still open

- **Whether any of this holds on Linux.** Every measurement above is macOS. Settled by Gate 10 run on a Linux host.
- **Whether the agent runner resolves `.mcp.json`'s relative launcher path against the checkout root or against the session's own working directory.** Narrowed, not closed. Gate 10's leg (v) started its session at the checkout root, where the two are the same directory, and the server started and answered; a session started from a subdirectory has not been run, and under the second reading it would find no `scripts/docs-search-server.sh` and get no `harness-docs` server at all. Settled by one leg (v) repeated from a subdirectory of the same checkout.
- **Whether the lexical arm filters to matching chunks on every index.** Narrowed, not closed. `cli/test/docs-retrieval-store.test.mjs` case (a) measures that `lexicalSearch` returns the matching chunk alone — and nothing at all for a term no chunk carries — at 40, 166 and 1024 synthetic rows, which bracket both committed corpora's recorded sizes — 41 and 177 chunks — and reach far above them; it holds there because `openPgliteStore` creates the BM25 index before any row exists, so the planner has no statistics for `chunks` and takes the index scan at every size. What stays open is the other plan: case (b) bisects the crossover on a stats-informed plan, with the index built after the rows, to **63 rows**, so an index whose statistics do describe its rows — after a `REINDEX`, or a dump restore — can sit below that crossover and return non-matching rows at score `0`. The number is a planner decision rather than a contract, and a PGlite or `pg_textsearch` bump can move it, which is why that case asserts it in a band and fails when it moves instead of trusting it.

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
- An index that is a second representation of the docs, **per checkout**. Its size is measured at two corpus sizes, this repository's own 177 chunks and a real catalog's 1,960, in `docs/retrieval-eval-results.md` → `## Cold build and index size`, whose two-point fit over those anchors shows the index is **fixed-cost dominated**: most of it is overhead that does not scale with the corpus, and no projection beyond the two anchors is published. It is never committed and always rebuildable, which is why deleting it loses nothing.
