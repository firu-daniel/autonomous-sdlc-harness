### Task 3 — Embedder and reranker interfaces, the Transformers.js models and the deterministic stubs

**Goal:** Put the embedder and the reranker behind two small interfaces. Implement both with local Transformers.js models, and provide deterministic stubs so that tests never download a model and the follow-up eval can swap either half.

**Depends on:** Task 2, which exports `loadRetrievalModule<T>(specifier: string): Promise<T>` and `retrievalModelCacheDir(): string` from `cli/src/retrieval/runtime.ts`. This task loads `@huggingface/transformers` only through that loader, and points the library's cache at that directory.

**Where this task stops.** Nothing here stores, chunks or searches. The consumers are Task 5 (the embedder, through refresh), Task 7 (the reranker), Tasks 6 and 13 (`MODEL_FILES` and `modelFilesPresent`) and Task 12 (`fetchModels`, the one place a download is allowed).

### Targets

- `cli/src/retrieval/models.ts` (new).

**Work:**

- [ ] Header, with the rule: *"The rule this module exists to enforce: a model is downloaded only by `fetchModels`, at setup time. Every other load runs with remote models disabled, so a run never reaches the network."* Export these interfaces:
  - `interface Embedder { readonly id: string; readonly dimensions: number; embedDocuments(texts: readonly string[]): Promise<number[][]>; embedQuery(text: string): Promise<number[]> }`
  - `interface Reranker { readonly id: string; score(query: string, passages: readonly string[]): Promise<number[]> }`. Every score lies in `[0, 1]`, and higher is better.

  `Embedder.id` is the value Task 5 stores in the index. A change to it forces a full rebuild.
- [ ] The model constants, each with a doc comment giving size and licence:
  - `EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5'` (ONNX port of `BAAI/bge-small-en-v1.5`, MIT). It uses `dtype: 'q8'`, CLS pooling, `normalize: true` and 384 dimensions.
  - `EMBEDDING_QUERY_PREFIX = 'Represent this sentence for searching relevant passages: '`, bge-v1.5's retrieval instruction, applied to queries only.
  - `RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2'` (ONNX port of `cross-encoder/ms-marco-MiniLM-L-6-v2`, Apache-2.0). It uses `dtype: 'q8'`, and each score is the sigmoid of its single logit.
  - `MODEL_VERSION = 1`, bumped by hand when any loading parameter changes.

  The real embedder's `id` is `` `${EMBEDDING_MODEL}:q8:cls:384:v${MODEL_VERSION}` ``.
- [ ] `MODEL_FILES: Readonly<Record<string, readonly string[]>>`, keyed by model id. It lists the files, relative to `<retrievalModelCacheDir()>/<model id>/`, that must exist for an offline load. **Read the exact layout off the installed library's own hub/cache code under `node_modules/@huggingface/transformers/`** for `env.cacheDir` with `dtype: 'q8'`, rather than assuming it. The expected shape is `config.json`, `tokenizer.json`, `tokenizer_config.json` and `onnx/model_quantized.onnx`; record the source function you read in the doc comment. Export `modelFilesPresent(cacheDir: string): { present: boolean; missing: readonly string[] }`, which is file existence only.
- [ ] `loadModels(options: { allowRemote: boolean }): Promise<{ embedder: Embedder; reranker: Reranker }>`. It loads `@huggingface/transformers` through `loadRetrievalModule` and sets `env.cacheDir = retrievalModelCacheDir()` and `env.allowRemoteModels = options.allowRemote` **before** any `from_pretrained`. The embedder uses a `feature-extraction` pipeline with `{ pooling: 'cls', normalize: true }`. The reranker uses `AutoTokenizer` plus `AutoModelForSequenceClassification`, with `text_pair` batches and a sigmoid over the logits. `fetchModels(): Promise<void>` calls `loadModels({ allowRemote: true })`, embeds and reranks one throwaway string so both weights are materialised, and returns.
- [ ] The stubs. `RETRIEVAL_STUB_ENV = 'AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB'` is the owner of that variable name, and it is never retyped elsewhere in `cli/src`. `resolveModels(options)` returns the stubs when `process.env[RETRIEVAL_STUB_ENV]` is `hash-v1` or `hash-v2`, throws a `HarnessError` naming both legal values for any other non-empty value, and otherwise delegates to `loadModels`.
  - **Stub embedder.** `id` is `stub-hash:<v>` and `dimensions` is 384. Lower-case the text, split it on non-alphanumerics, keep tokens of length 2 or more, and hash each with `node:crypto` sha256 to a bucket modulo 384. `hash-v2` salts the hash with `v2`, so it has a different `id` and different vectors. Count the buckets, then L2-normalise, and use an all-zero vector when no token survives.
  - **Stub reranker.** `id` is `stub-overlap`. The score is the fraction of distinct query tokens of length 3 or more that appear in the passage's token set, or `0` when the query has none.
  - The header states that this seam exists because the suite drives the compiled CLI in a subprocess and has no mocking framework (`.claude/context/conventions.md` → `## The testing bar`).

**Verification:**

- `bash scripts/typecheck.sh` exits zero. `models.ts` has no static value import of `@huggingface/transformers`; types come from `import type`. Task 2's source guard stays green.
- `grep -rn "allowRemoteModels" cli/src` reports `models.ts` only, set from `options.allowRemote`. `grep -rn "allowRemote: true" cli/src` reports `fetchModels` only.
- The stubs are exercised end to end by Task 6's suite, whose fixture sets `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`. The real models are exercised by Gate 10 (Task 22) by hand.
