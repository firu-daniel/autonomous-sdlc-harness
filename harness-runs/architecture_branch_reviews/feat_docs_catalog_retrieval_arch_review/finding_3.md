### 3. The machine-cache writes are missing from the cli layer's list of machine-scoped writes, and `core/writer.ts` names the wrong writer for the model download

**Severity:** Should Fix. **Layer:** cli.

**Sites:**
- `cli/src/core/writer.ts`, module header: *"The docs-retrieval runtime and model cache under `machineCacheDir()/retrieval/` are machine state of the same class: outside the repository, written by `npm` and Transformers.js, and created by `cli/src/retrieval/setup.ts` → `setUpRetrieval`."*
- `cli/src/retrieval/setup.ts` → `setUpRuntime`: `mkdirSync(runtimeDir, { recursive: true });` then `npm install --prefix <runtimeDir> …`
- `cli/src/retrieval/models.ts` → `fetchModels` / `loadModels`: `env.cacheDir = retrievalModelCacheDir(); env.allowRemoteModels = options.allowRemote;`. This code is reached through `cli/src/commands/docs.ts` → `fetchModelsVerb`, which `setup.ts` → `setUpModels` spawns as a child process.

**Problem.** `.claude/context/cli.md` → `## How a module in this layer is written` states: *"Machine-scoped state is not an adopter's file. What this layer writes outside the repository it was aimed at is enumerated and each piece has one owner: the registry (`cli/src/machine/registry.ts`), the daemon unit (`cli/src/daemon/units.ts`), the push settings (`cli/src/generators/notifications.ts`)."*

This branch adds two more machine-scoped pieces under `machineCacheDir()/retrieval/`: the retrieval runtime installation and the model-weight cache.
- `cli/src/retrieval/runtime.ts` owns both paths.
- `cli/src/retrieval/setup.ts` writes the runtime.
- `cli/src/retrieval/models.ts` → `fetchModels` writes the model cache, through Transformers.js, in the `docs fetch-models` child. `setup.ts` only spawns that child.

Two things are therefore wrong:
1. The `core/writer.ts` header records `setup.ts` as the creator of both pieces. So the one written record of this exception names the wrong module for the model download. A reader who greps for the owner of the model cache's write lands on a module that never touches it.
2. The enumeration in the conventions document no longer covers every machine-scoped write, and nothing raises that. The story index's `## Corpus staleness` raises the in-repository index and the stdout exception, but not this one. A conventions document is never an implementing run's target, so the route is a `stale-rule` entry.

**Fix.**
1. In `cli/src/core/writer.ts`'s module header, reword the machine-state sentence so each piece names its own writer. The runtime installation is created by `cli/src/retrieval/setup.ts` → `setUpRuntime` through `npm`. The model cache is written by `cli/src/retrieval/models.ts` → `fetchModels` through Transformers.js, run by `docs fetch-models`, which `setUpModels` spawns. Both paths are owned by `cli/src/retrieval/runtime.ts`.
2. In `cli/src/retrieval/setup.ts`'s header, correct the last paragraph the same way. It currently reads *"Both steps write machine state outside the repository, through `npm` and Transformers.js"*. It should say that the model download's write belongs to `models.ts` → `fetchModels`, in the child process.
3. Append a `stale-rule` entry to `## Corpus staleness` in `harness-runs/story_plans/feat_docs_catalog_retrieval_story_plan.md`. Follow the shape of the existing entries and quote the enumeration sentence of `.claude/context/cli.md` → `## How a module in this layer is written`. Restatement: the list gains the docs-retrieval runtime (`cli/src/retrieval/setup.ts`) and the model cache (`cli/src/retrieval/models.ts` → `fetchModels`), both under `machineCacheDir()/retrieval/`, with their paths owned by `cli/src/retrieval/runtime.ts`. Route: a supervised `/harness-analyze cli` re-run or a hand edit. Do **not** edit `.claude/context/cli.md` itself.
