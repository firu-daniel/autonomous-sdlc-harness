### Task 13 — Export the embedder's extraction options from `models.ts` as one constant, with no value changed

**Goal:** Give the embedder's extraction options, CLS pooling with `normalize: true`, one exported home in `cli/src/retrieval/models.ts`. `loadModels` then reads that constant itself, and the eval's matched-precision leg (**Task 7**) can import it instead of retyping it. No value changes, so the embedder `id` (`Xenova/bge-small-en-v1.5:q8:cls:384:v1`), every vector and both backends' search behaviour stay exactly as they are.

**Why this task exists.** `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*, and *"Before adding a copy of anything, grep for it."* Also `.claude/context/cli.md` → `## How a module in this layer is written` → *"One string, one producer"*. The loading parameters are part of the embedder's identity: the `MODEL_VERSION` doc comment says it is *"Bumped by hand when any loading parameter above changes, so the embedder's `id` changes with it"*. So a copy of them in `evals/` would let the matched-precision leg silently measure a different embedder from the one the TypeScript backend runs.

**Where this task stops.** It exports the options and nothing else. It does **not** export or parameterise `MODEL_DTYPE`, because the fp32 dtype is local to Task 7's leg. It does not touch `env.cacheDir` / `env.allowRemoteModels` handling, `fetchModels`, the reranker or the stubs. It does not bump `MODEL_VERSION`, because no loading parameter's value changes. **Task 7** is the one consumer. It imports the constant from `cli/dist/retrieval/models.js` beside `EMBEDDING_MODEL`.

### Targets

- `cli/src/retrieval/models.ts` — one new exported constant, the `loadModels` call site that reads it, and the doc comments that name it.

**The interface this task produces — Task 7 restates it verbatim:**

```
// cli/src/retrieval/models.ts, compiled to cli/dist/retrieval/models.js
export const EMBEDDING_EXTRACT_OPTIONS  // { pooling: 'cls', normalize: true }, read-only
```

**Work:**

- [ ] **The constant.** Declare `export const EMBEDDING_EXTRACT_OPTIONS` with the value `{ pooling: 'cls', normalize: true }`, read-only (`as const` or a `Readonly<…>` annotation). Place it after `EMBEDDING_MODEL` and **above** `MODEL_VERSION`, so that comment's *"any loading parameter above"* still covers it. Its doc comment says three things: these are the embedder's extraction options; they are part of the embedder's identity, so a change to them bumps `MODEL_VERSION`; and they are exported for the eval's matched-precision leg (`evals/docs-retrieval/vector-agreement.mjs`), which loads the same model at fp32 and must extract exactly as this module does.
- [ ] **`loadModels` reads it.** In `loadModels`'s `embed`, replace the inline `{ pooling: 'cls', normalize: true }` with `EMBEDDING_EXTRACT_OPTIONS`. If the pipeline's option type refuses a read-only object, spread the constant into a fresh object at the call site (`{ ...EMBEDDING_EXTRACT_OPTIONS }`). Never re-spell either value. After the edit, the literal `pooling: 'cls'` appears in this module only in the constant's declaration.
- [ ] **The doc comments.** Amend `EMBEDDING_MODEL`'s doc comment, *"Loaded with `dtype: 'q8'`, CLS pooling and `normalize: true`"*, to cite `{@link EMBEDDING_EXTRACT_OPTIONS}` for the pooling and normalisation instead of restating them. The module header's rule, that `env.allowRemoteModels` is set in `loadModels` alone and the package is reached only through `loadRetrievalModule`, is unaffected and stays as it is (`.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"*).
- [ ] **No test file.** This task creates and edits no test. No value changes. No `cli/test` suite loads a real model (`.claude/context/cli.md` → `## What "done" means here`: *"No test loads … a real background service … or reaches the network"*; every retrieval suite runs under `RETRIEVAL_STUB_ENV`). A constant is not a new unit in `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`. The existing suites, run once at Phase G, hold the unchanged behaviour.

**Verification:**

- `bash scripts/typecheck.sh` passes. It runs `npm run build`, so it also refreshes `cli/dist/retrieval/models.js`, which Task 7 imports.
- `grep -n "pooling" cli/src/retrieval/models.ts` returns only the constant's declaration line and, at most, its doc comment. It never returns a hit inside `loadModels`.
- `git diff cli/src/retrieval/models.ts` leaves `MODEL_VERSION = 1`, `MODEL_DTYPE = 'q8'` and the `id:` template line of the embedder and of the reranker untouched.
- A scratch launcher, `harness-runs/scratch/extract-options-probe.mjs`, imports `EMBEDDING_EXTRACT_OPTIONS` and `EMBEDDING_MODEL` from `cli/dist/retrieval/models.js` and prints both. Run it with `bash scripts/scratch-run.sh harness-runs/scratch/extract-options-probe.mjs`. It prints `{ pooling: 'cls', normalize: true }` and `Xenova/bge-small-en-v1.5`.
