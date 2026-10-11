### Task 2 — Pin the CLI's two retrieval models to immutable revisions in `cli/src/retrieval/models.ts`

**Goal:** Have `loadModels`, and therefore `fetchModels`, load `EMBEDDING_MODEL` and `RERANK_MODEL` at a fixed Hugging Face commit instead of whatever `main` holds at fetch time. Have the offline presence check look where `@huggingface/transformers` 4.3.0 actually caches a pinned revision. A change to an upstream `main`, whether a re-export, new tokenizer files or a compromised account, then stops reaching adopters silently.

**The pins** are each repository's `main` on 2026-10-11, from `https://huggingface.co/api/models/<id>/revision/main` → `sha`:

- `Xenova/bge-small-en-v1.5` → `ea104dacec62c0de699686887e3f920caeb4f3e3`
- `Xenova/ms-marco-MiniLM-L-6-v2` → `a09144355adeed5f58c8ed011d209bf8ee5a1fec`

For both models, each `MODEL_FILES` entry in the gate-10 cache (fetched 2026-09-22) is byte-identical to that file at these revisions. The two `onnx/model_quantized.onnx` files match on LFS sha256: `6c9c6101…dfe4` for the embedder and `e9d8ebf8…9fbe` for the reranker. `config.json`, `tokenizer.json` and `tokenizer_config.json` match on git blob id. **So `MODEL_VERSION` stays `1`, and neither model's `id` moves.** No adopter's index is forced to rebuild, because no vector changes.

**The cache key moves, and this task owns that.** `node_modules/@huggingface/transformers/src/utils/hub.js` → `buildResourcePaths` → `proposedCacheKey` uses `<model id>/<filename>` only when `revision === 'main'`, and `<model id>/<revision>/<filename>` otherwise. So after this task every `MODEL_FILES` path is relative to `<retrievalModelCacheDir()>/<model id>/<revision>/`. An existing cache reads as missing until one re-fetch, which `init`'s setup performs on its own: `cli/src/retrieval/setup.ts` fetches whenever `modelFilesPresent(cacheDir).present` is false. **Task 14** tells adopters about the re-fetch. The old `<model id>/<file>` files are no longer read.

**Where this task stops.** It changes the TypeScript path only. The Python service's pins are **Task 6**'s. **Task 9**'s drift script consumes the constants this task exports, through `cli/dist/retrieval/models.js`, as this exact interface:

```ts
export const EMBEDDING_REVISION = 'ea104dacec62c0de699686887e3f920caeb4f3e3';
export const RERANK_REVISION = 'a09144355adeed5f58c8ed011d209bf8ee5a1fec';
/** Every model id this module loads, mapped to the revision it is pinned to. */
export const MODEL_REVISIONS: Readonly<Record<string, string>>; // { [EMBEDDING_MODEL]: EMBEDDING_REVISION, [RERANK_MODEL]: RERANK_REVISION }
```

`evals/docs-retrieval/vector-agreement.mjs` → `fp32Vectors` is deliberately left alone. It loads a hand-provisioned fp32 export, offline and with no revision, from a directory the operator arranges as `<model id>/<file>`. It is a measurement tool, not a retrieval path an adopter runs, and pinning it would move that hand-arranged layout for no supply-chain gain. `modelFilesPresent`'s signature is unchanged, so `cli/src/commands/docs.ts`, `cli/src/doctor/checks.ts`, `cli/src/retrieval/session.ts`, `cli/src/retrieval/setup.ts`, `evals/docs-retrieval/check-floor.mjs` and `evals/docs-retrieval/index-build.mjs` need no edit.

### Targets

- `cli/src/retrieval/models.ts` — the revision constants, `loadModels`, `MODEL_FILES`' doc comment, and `modelFilesPresent`.
- `cli/test/helpers/fixture.mjs` — `RETRIEVAL_MODEL_FILES` and `plantModelFiles`, the test-side restatement of the contract.
- `cli/test/docs-retrieval.test.mjs` — case `(h) docs index refuses with the model files removed, naming a missing file`.

**Work:**

- [ ] `models.ts`: add `EMBEDDING_REVISION`, `RERANK_REVISION` and `MODEL_REVISIONS` exactly as specified above, each with a doc comment. Two-step approach: build `MODEL_REVISIONS` from the two named constants so neither SHA is spelled twice. The comment states that a revision is a loading parameter, so **a pin bump bumps `MODEL_VERSION` in the same edit**, which changes both `id`s and forces the rebuild a changed model needs. It also says why this first pin did not bump it: the byte-identity measurement above. Extend the module header's rule paragraph with one sentence: every remote and offline load names its pinned revision, so a download fetches a fixed commit.
- [ ] `models.ts` → `loadModels`: pass `revision: EMBEDDING_REVISION` in the `pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: MODEL_DTYPE, revision: … })` options, and `revision: RERANK_REVISION` to both `AutoTokenizer.from_pretrained(RERANK_MODEL, { revision })` and `AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, { dtype: MODEL_DTYPE, revision })`.
- [ ] `models.ts` → `MODEL_FILES` doc comment: replace "keys a `FileCache` entry at `<model id>/<filename>` on the `main` revision" with the 4.3.0 fact for a pinned load, `<model id>/<revision>/<filename>` (`buildResourcePaths` → `proposedCacheKey`), and say the listed files are relative to `<model id>/<revision>/`. In `modelFilesPresent`, test `join(cacheDir, modelId, revision, file)` and report a missing file as `<model id>/<revision>/<file>`, the path an operator would look for on disk. A model id with no `MODEL_REVISIONS` entry is this module's own fault, so throw it through `internal()` (`cli/src/core/errors.ts`), never as an ordinary `HarnessError`. Update the doc comment's `missing` description to match.
- [ ] `cli/test/helpers/fixture.mjs`: restate the two pins beside `RETRIEVAL_MODEL_FILES`, as a contract restatement in keeping with that constant's own doc comment ("restated … so the suites assert against the contract rather than the source"). Make `plantModelFiles` plant each file at `<retrievalCacheDir>/models/<model id>/<revision>/<file>`. Update its doc comment.
- [ ] `cli/test/docs-retrieval.test.mjs` case `(h)`: the asserted missing name becomes `/Xenova\/bge-small-en-v1\.5\/ea104dacec62c0de699686887e3f920caeb4f3e3\/config\.json/`.

**Verification:**

- Run `commands.typecheck` (`bash scripts/typecheck.sh`). It must exit 0, and `noUncheckedIndexedAccess` is why the `MODEL_REVISIONS` lookup needs its `internal()` branch.
- Run the one test file this task edits: `npm test --workspace cli -- test/docs-retrieval.test.mjs`. Case `(h)` names the revision-qualified path, and every other case still finds the cache `plantModelFiles` planted. `fixture.mjs` is a helper, not a test file. The suites that import it (`init`, `doctor`, `profile`) run at Phase G.
- **The real pinned fetch, once, after the single-file test run above.** That run's `pretest` script (`cli/package.json` → `scripts.pretest`, `npm run build` inside the `cli` workspace) has already compiled `cli/dist` from this task's source, so no separate build is run — the root `npm run build` is gate 2a, which no unit runs. Run `node cli/dist/cli.js docs fetch-models` from the repository root. It must print `docs fetch-models: Xenova/bge-small-en-v1.5 and Xenova/ms-marco-MiniLM-L-6-v2 cached in <dir>`, and the printed `<dir>` must then hold `Xenova/bge-small-en-v1.5/ea104dacec62c0de699686887e3f920caeb4f3e3/onnx/model_quantized.onnx` and `Xenova/ms-marco-MiniLM-L-6-v2/a09144355adeed5f58c8ed011d209bf8ee5a1fec/onnx/model_quantized.onnx`. Check with `ls`. This both exercises the pinned remote load end to end and re-provisions the machine cache in the new layout, so Phase G's gate 11 grades the real models instead of reporting `BLOCKED`, which is the second `Top risks:` entry in the story index. Where the workspace's retrieval packages do not resolve or the network is unreachable, record the fetch as not run and why. It is not a blocker, because Phase G still runs gate 11 and reports `BLOCKED` with its reason.
- Grep `cli/src/retrieval/models.ts` for `ea104dac` and `a0914435`: each appears exactly once, in its named constant.
