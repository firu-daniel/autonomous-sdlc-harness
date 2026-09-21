### Task 7 — The query-log pass over MCP against the real models

**Goal:** Exercise the opt-in query log against the real models, as its own pass: start the stdio MCP server over the larger corpus with `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` naming a file, issue the query set over MCP, assert one record per call carrying every field `cli/src/retrieval/queryLog.ts` declares, repeat with the variable unset and assert nothing is created anywhere — and report that pass's latency **separately** from library-level arm E.

**Depends on:** Task 2, which committed `evals/docs-retrieval/queries/self-docs.jsonl`. Task 3, whose `evals/docs-retrieval/corpora.mjs` exports `corpusConfig({ repoRoot, corpus, docsRoot, conventions }) → { id, config }` and whose `evals/docs-retrieval/queries.mjs` exports `loadQueries(path)`. Task 4, whose `docs/retrieval-eval-results.md` carries an empty `## The query-log pass` section below its `<!-- eval:generated:end -->` marker, and whose generated region holds library-level arm E's p50/p95 for `self-docs`, which this pass is compared against.

**Why this is a separate pass and not a by-product of the arm runs.** `logQuery` is called from `cli/src/retrieval/server.ts` alone, so a runner driving `searchDocs` directly — which is what arms B–E do — writes **no records at all**. The server hardcodes `mode: 'fused-rerank'` and accepts only `query` and `k`, so every record it can write is an arm E record. And its latency is the only number that includes the per-call incremental refresh and the MCP round trip, which is what an agent actually waits for; the gap between it and library arm E is the line worth reporting.

**Why a throwaway fixture repository.** `docs serve` refuses unless `retrievalApplies` — `phases.docs` **and** `docs.retrieval` both true — and this repository's `harness.config.json` has neither and is deliberately left alone. The pass therefore builds a fixture repository under the system temp directory, never inside this checkout, in the shape `.claude/context/conventions.md` → `## The testing bar` already requires of a fixture.

**Do not re-implement the assertions.** `cli/test/docs-retrieval.test.mjs` already carries them verbatim as `serve (h)` (one call appends one record carrying every field), `serve (i)` (variable unset, nothing written anywhere) and `serve (j)` (an unwritable path still answers). What is net-new is that those cases run under the stub and this is the first thing to make real-model calls; assert the same two properties here against real models, and do not add a fourth case or a "say so and skip" note.

### Targets

- `evals/docs-retrieval/query-log-pass.mjs` (new) — the pass.
- `docs/retrieval-eval-results.md` → `## The query-log pass` (the section Task 4 created empty).

**Work:**

- [x] Build the fixture **from the resolved `self-docs` config, never from a hand-composed list**: call `corpusConfig({ repoRoot, corpus: 'self-docs' })` — the module already imports it — and take the file set from what that config resolves. Copy exactly the files its `docs.root` names and exactly the documents its `layers[].conventions` entries name, into a directory under `os.tmpdir()`, `git init`-ed with one commit. Write the fixture's `harness.config.json` `layers[]` by **mapping those same resolved entries onto their copied paths**, one entry per entry, so the fixture's layer list is derived rather than typed. **No layer count and no conventions path is typed into this module**: add a layer to this repository's `harness.config.json` and the fixture grows with the `self-docs` corpus it exists to mirror, which is what `cli/src/retrieval/corpus.ts`'s module header and `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` (*"Nothing caches it and nothing mirrors it"*) require. The only values the fixture **adds** are its own rather than a mirror of anything — `phases.docs: true`, `docs: { root, retrieval: true }` and a `stateDir` — and they are added because `docs serve`'s `retrievalApplies` gate needs them, which this repository's own configuration deliberately does not satisfy. Tear the directory down at the end, including on failure.
- [x] The logged leg: spawn `node cli/dist/cli.js docs serve --cwd <fixture>` as a child whose environment sets the log variable to a path inside the fixture and leaves the stub variable **unset**. **Neither variable name is typed as a literal anywhere in this module** — the child's environment keys, the two leg names in any message this module prints, and the fill text below all read `RETRIEVAL_LOG_ENV` from `cli/dist/retrieval/queryLog.js` and `RETRIEVAL_STUB_ENV` from `cli/dist/retrieval/models.js`, the same modules this task already reads the `QueryLogRecord` key list and the model predicates off. That is `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` — *"An environment-variable name is a constant with an owner too… never retyped as a literal — including in the message that names it to a reader"* — and it is the same rule this task already applies to the adjacent record key list. Then speak MCP over its stdio the way `cli/test/docs-retrieval.test.mjs`'s `serve (a)-(d)` cases do, and call `mcp__harness-docs__search_docs` once per query in `self-docs.jsonl`, timing each round trip from the client side. Then assert: the log holds exactly one JSON line per call, in call order, and every line carries every key of `QueryLogRecord` — `outcome`, `timestamp`, `query`, `k`, `hits`, `bestScore`, `abstained`, `refresh` and `durationMs` — with `outcome` one of the three `QueryOutcome` values and no key absent. Read the key list off `cli/src/retrieval/queryLog.ts` rather than from this file.
- [x] The unset leg: run the same query set again with the log variable unset — deleting the `RETRIEVAL_LOG_ENV` key from the child's environment, never a retyped string — and assert nothing was created — neither the previous log path nor any new file anywhere under the fixture. Compare a file listing of the fixture taken before and after.
- [x] Read the eval's own per-query figures **back out of the JSONL** rather than out of the client: each record's `durationMs` is the server-side figure and each record's `hits`, `bestScore` and `abstained` are what the server answered. Report both — server-side `durationMs` and client-side round trip — as p50 and p95, plus the `refresh` counts, which show what the per-call incremental refresh costs after the first call.
- [x] Fill `docs/retrieval-eval-results.md` → `## The query-log pass`: the two legs and what each asserted, the server-side and client-side p50/p95, the library-level arm E p50/p95 for `self-docs` read out of the generated region, **the gap between them in one sentence naming its two causes** (the per-call incremental refresh and the MCP round trip), the `refresh` counts for the first call against the rest, and that every number was taken with the stub variable unset and the real reranker loaded. Where the prose names either variable to the reader, the module composes that sentence from `RETRIEVAL_LOG_ENV` and `RETRIEVAL_STUB_ENV` rather than typing the name into the fill text, so a rename in `cli/src` cannot leave a wrong name in a document of record. Name the fixture repository and its configuration, so a reader knows the numbers are not this repository's own configuration.

**Verification:**

- Run the pass through `bash scripts/scratch-run.sh harness-runs/scratch/query-log-pass.mjs`, a launcher that imports and calls it. A bare `node …` tool call matches no entry in `.claude/settings.autonomous.json` and stalls the run.
- Before running, confirm `modelFilesPresent(retrievalModelCacheDir()).present` and `retrievalRuntimeState().installed` are both true, and **stop and say so** rather than improvising an install if either is false — naming the paths `modelFilesPresent(retrievalModelCacheDir()).missing` holds. `modelFilesPresent` returns `{ present, missing }`, not a boolean (`cli/src/retrieval/models.ts`), so the check is on `.present`.
- The record count equals the call count exactly — twenty queries, twenty lines — and a spot-checked record's `query` field is byte-identical to the query as sent.
- The unset leg leaves the fixture's file listing unchanged, and the log path from the first leg is not re-opened or extended.
- `git status --porcelain` shows only `docs/retrieval-eval-results.md` changed: nothing was written inside this checkout, and the fixture directory was removed.
- `git grep -n 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_' -- evals/docs-retrieval/query-log-pass.mjs` returns nothing: both names reach this module through their owner constants, in the environment it sets and in every sentence it writes.
- **The fixture cannot drift from the corpus it mirrors.** Count the files the fixture copied and the files `corpusConfig({ repoRoot, corpus: 'self-docs' })` resolves, and assert the two are equal — in the pass itself, not only by eye — so a layer added to `harness.config.json` grows both or fails here. Alongside it, `git grep -nE "conventions.md|layers *:" -- evals/docs-retrieval/query-log-pass.mjs` shows no conventions path and no hand-written layer list in this module.
- `bash scripts/run-gates.sh` passes.

**Deviations from plan:**

- **Two one-word `export` additions outside the Targets list, and what they do to the `git status`
  check.** The plan's precheck bullet and its percentile reporting both already have owners:
  `evals/docs-retrieval/index-build.mjs` carries the three real-model refusals verbatim (stub set,
  model cache incomplete, runtime not installed, the last two naming their `.missing` arrays) and
  `evals/docs-retrieval/metrics.mjs` carries the nearest-rank percentile the arms are scored with. A
  private copy of either in the new module would be the duplicate
  `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"Before adding a copy of
  anything, grep for it"*) forbids, and a second percentile definition would make the pass's p50/p95
  incomparable with the arm E row it is published beside. Both functions were therefore exported —
  one keyword each, with the reason in the doc comment — and imported. So `git status --porcelain`
  shows three changed files and one new one rather than only `docs/retrieval-eval-results.md`; the
  substance of that verification bullet holds, in that the pass itself wrote nothing inside this
  checkout and the fixture directory under the system temp directory was removed.
- **The tool is called through `SEARCH_TOOL_NAME`, not the permission spelling.** The plan's logged-leg
  bullet says to call `mcp__harness-docs__search_docs`; over a direct MCP client the request carries
  the tool's own name, and `mcp__…` is how that tool is spelled in a `tools:` allowlist. The module
  imports `SEARCH_TOOL_NAME` from `cli/dist/retrieval/server.js`, so the name is read off its owner
  either way.
- **The two single-source greps were run as working-tree `grep`, not `git grep`.** `git grep` searches
  tracked files, and the new module is untracked until this task's commit lands, so both checks would
  have passed vacuously. Run against the file itself, `grep -n
  'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_'` and `grep -nE "conventions.md|layers *:"` each exit 1 with no
  output. Re-run them as `git grep` after the commit and they grade the same property.
- **The gap is reported with a repeatability note, because a single pass does not support the
  one-sentence claim the plan asked for.** The plan's fill bullet asks for the gap in one sentence
  naming its two causes; the pass was run five times on this tree while it was being built and the
  sign of the p50 gap changed between runs (server-side p50 `575`, `637`, `649`, `702`, `819` ms
  against library-level arm E's `600.7`; p95 `816`, `819`, `842`, `917`, `956` against `748.2`). The
  section therefore carries the one sentence naming both causes and a `**Repeatability…**` paragraph
  giving all five figures, so the published +218.3 ms / +207.8 ms gap is read as the widest of the
  five rather than as a measurement. The two causes are still separated where the data allows it: the
  MCP round trip is the client-side minus the server-side figure, 1.8-3.3 ms at p50 in every run, and
  the refresh re-embeds nothing after the first call.
- **The pass's figures, recorded here rather than in a commit body** (the branch's standing rule that
  a plan file's "in the commit body" means the producing task's deviations block). Published run,
  2026-09-21T18:18:03.552Z, host `Daniels-MacBook-Air.local`, Node `v20.19.5`: 20 calls, 20 records,
  server-side p50/p95 `819.0`/`956.0` ms, client-side `822.3`/`959.2` ms, unset-leg client-side
  `873.2`/`908.8` ms, 13 answered at `hits: 5` with the lowest `bestScore` `0.33899036049842834`, 7
  abstained, cold build `{ embedded: 177, unchanged: 0, deleted: 0 }` and `{ embedded: 0, unchanged:
  177, deleted: 0 }` on each of the other 19 calls.
- **The pass's own corpus stamp is 13 files / 177 chunks, not the region's 13 / 173.** The mirrored
  corpus moves with this checkout and `docs/retrieval-eval-results.md` has grown since Task 4
  generated the region, so the section states its own stamp beside the region's and says the two
  latency rows are never read as a before/after pair — the snapshot rule of the story index's
  `## Context`.
