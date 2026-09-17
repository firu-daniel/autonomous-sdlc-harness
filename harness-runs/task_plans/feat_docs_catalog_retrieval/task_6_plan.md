### Task 6 — The `docs index` verb and the fixture-corpus suite

**Goal:** Add the CLI verb `docs` with its first sub-verb, `docs index`, which refreshes the checkout's index (or builds one in memory and writes nothing). Land the suite that proves Acceptance 3 on a fixture corpus: editing one section re-embeds only that section's chunk, deleting a document removes its chunks, and a change of embedder rebuilds.

**Depends on:**

- **Task 1:** `retrievalApplies(config: HarnessConfig): boolean` (`cli/src/config/model.ts`).
- **Task 3:** `resolveModels(options: { allowRemote: boolean }): Promise<{ embedder: Embedder; reranker: Reranker }>`, `MODEL_FILES`, `modelFilesPresent(cacheDir: string): { present: boolean; missing: readonly string[] }` and `RETRIEVAL_STUB_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB'` (`cli/src/retrieval/models.ts`). Task 2 provides `retrievalModelCacheDir()` (`cli/src/retrieval/runtime.ts`).
- **Task 5:** `openPgliteStore({ dataDir: string | undefined; dimensions: number }): Promise<DocStore>`, `indexDataDir(repoRoot, stateDir)`, and `refreshIndex({ repoRoot, config, store, embedder }): Promise<RefreshResult>`, where `RefreshResult` is `{ files, chunks, embedded, unchanged, deleted, rebuilt, warnings }`.

**This task owns `cli/src/commands/docs.ts` and `cli/test/docs-retrieval.test.mjs`.** Tasks 7 (`search`), 8 (`serve`) and 12 (`fetch-models`) each add one sub-verb row and their own cases, and each depends on this task.

### Targets

- `cli/src/commands/docs.ts` (new) — the `docs` `Subcommand`, its sub-verb dispatch and `index`.
- `cli/src/retrieval/session.ts` (new) — `openRetrieval`, shared by every sub-verb that reads the index.
- `cli/src/commands/registry.ts` — the `DOCS_COMMAND` row in `SUBCOMMANDS`.
- `cli/test/helpers/fixture.mjs` — the retrieval fixture helpers.
- `cli/test/docs-retrieval.test.mjs` (new).

**Work:**

- [ ] `retrieval/session.ts`: export `openRetrieval(options: { repoRoot: string; config: HarnessConfig; inMemory: boolean }): Promise<{ store: DocStore; embedder: Embedder; reranker: Reranker; refresh(): Promise<RefreshResult>; close(): Promise<void> }>`. Before loading anything it refuses, with a `HarnessError`:
  - a config where `retrievalApplies` is false, with the message `docs retrieval is off in harness.config.json: it needs phases.docs true and docs.retrieval true (\`npx autonomous-sdlc-harness config set docs.retrieval true\`)`;
  - a model cache missing files, even under the stub, with a message naming `modelFilesPresent`'s `missing` list and the remedy `npx autonomous-sdlc-harness init`.

  It then calls `resolveModels({ allowRemote: false })` and opens the store at `indexDataDir(...)`, or in memory.

  The module opens with a header comment, as every file under `cli/src/` does (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A module under `cli/src/`*). The header states what the module owns: opening the retrieval session (config gate, model-file gate, model load, store open) for every sub-verb that reads the index. It then states the module's rule in the words *"The rule this module exists to enforce"*: every sub-verb that reads the index opens it here; nothing is loaded before the retrieval-on and model-files-present refusals; and models load with remote loading disabled (`allowRemote: false`).
- [ ] `commands/docs.ts`: a module header following `cli/src/commands/daemon.ts`'s sub-verb shape. The usage lines and the sub-verb table are one declaration. `docs index [--in-memory]` resolves the repository root through `cli/src/core/git.ts`, loads the config through `cli/src/config/io.ts`, and calls `openRetrieval(...)` then `refresh()`. It prints warnings through `ctx.report.warn` and exactly one `ctx.report.result` line, plain ASCII: `docs index: <files> files, <chunks> chunks; embedded <e>, unchanged <u>, deleted <d><rebuilt ? '; rebuilt for a new embedder' : ''>`. `--in-memory` writes nothing to the repository; that is `doctor`'s probe (Task 13). An unknown sub-verb or flag is a refusal naming `docs --help`. Add `DOCS_COMMAND` to `SUBCOMMANDS` in `registry.ts`, with summary `Search the docs catalog and conventions: build the index, query it, serve it over MCP`. Leave `roadmapItem` unset, because roadmap numbers are about to change (story index `## Context`).
- [ ] `fixture.mjs`: export `retrievalEnv(cacheHome)`, which returns `{ XDG_CACHE_HOME: cacheHome, AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB: 'hash-v1' }`, and `plantModelFiles(cacheHome)`, which creates, as empty files under `<cacheHome>/autonomous-sdlc-harness/retrieval/models/<model id>/`, every path `cli/src/retrieval/models.ts` → `MODEL_FILES` lists for both models. Restate that list as a literal here, since the suite asserts against the contract rather than importing the source. Export `plantRetrievalRuntime(cacheHome, options?: { version?: string })`, which plants, under `<cacheHome>/autonomous-sdlc-harness/retrieval/runtime/`, exactly the three things Task 2's `retrievalRuntimeState()` tests: `node_modules/autonomous-sdlc-harness/dist/cli.js` (a one-line script that exits 0), `node_modules/autonomous-sdlc-harness/package.json` holding `{ "version": <options.version, else cli/package.json's version read at call time> }`, and `node_modules/<name>/package.json` holding `{}` for every `cli/package.json` → `peerDependencies` name whose `peerDependenciesMeta[name].optional` is `true`. It returns the sorted list of paths it planted, so a caller can prove no install added to them. Its doc comment says it is how every retrieval-on `init` and `doctor` case (Tasks 10, 11, 12, 13) stays offline: the runtime counts as installed, so `setUpRetrieval` runs no `npm`. Export `writeRetrievalConfig(dir)`, which writes a valid `harness.config.json` with `phases.docs: true`, `docs: { root: 'docs', retrieval: true }` and a catch-all layer whose conventions is `conventions.md`. Every helper builds under the fixture's own temp directory.
- [ ] `docs-retrieval.test.mjs` (header: Acceptance 3, and the rule that the suite never downloads a model). Use this fixture corpus.

  `docs/guide.md`, one line per entry, in this order:
  1. `# Guide`
  2. `Intro paragraph about the guide.`
  3. `## Setup`
  4. `Install the tool. A fence follows.`
  5. a fence opener of three backticks
  6. `## not a heading`
  7. the matching fence closer
  8. `### Offline`
  9. `Work without a network.`
  10. `## Usage`
  11. `Run the tool against a repository.`
  12. `## Setup`
  13. `A second setup section.`

  Also `docs/other.md` (`# Other`, one intro line, `## Topic`, one body line) and `conventions.md` (`# Conventions`, one intro line, `## Rules`, one body line). Each of those two has a non-blank preamble, so each gives 2 chunks. The expected counts are 5 chunks for `guide.md` (preamble, `#setup`, `#offline`, `#usage`, `#setup-1`) plus 2 for each of the other two files: **9 chunks, 3 files**. The cases are:
  - (a) The first `docs index` prints `3 files, 9 chunks; embedded 9, unchanged 0, deleted 0`.
  - (b) A second run prints `embedded 0, unchanged 9, deleted 0`.
  - (c) After editing only the `## Usage` body, it prints `embedded 1, unchanged 8, deleted 0`.
  - (d) After deleting `docs/other.md`, it prints `2 files, 7 chunks; embedded 0, unchanged 7, deleted 2`.
  - (e) With the stub env set to `hash-v2`, it prints `embedded 7, unchanged 0, deleted 0; rebuilt for a new embedder`. A rebuild's `clear()` is not counted as deletions; `refreshIndex`'s doc comment states this, and this case asserts it.
  - (f) `docs index --in-memory` on a fresh fixture leaves the tree byte-identical (`snapshotTree`).
  - (g) With `docs.retrieval` false, `docs index` exits non-zero with the "retrieval is off" message.
  - (h) With the model files removed, `docs index` exits non-zero naming a missing file.

  Record the wall time of case (a) in a comment beside it, as the stub cold-build figure `docs/retrieval.md` cites.

**Verification:**

- `bash scripts/test.sh` exits zero, with cases (a) to (h) green. The fenced `## not a heading` line is not a chunk: case (a)'s count is 9, not 10.
- `node cli/dist/cli.js --help` lists `docs`, and `node cli/dist/cli.js docs --help` lists `index`.
- `session.ts` opens with its module header: it names what the module owns, and `grep -n "The rule this module exists to enforce" cli/src/retrieval/session.ts` hits inside that header, which names both refusals and `allowRemote: false`.
- Task 2's `retrieval-loading.test.mjs` stays green: `docs` is not among its verbs, and no module this task adds statically imports a peer.
