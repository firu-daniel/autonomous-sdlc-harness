/**
 * Building the docs-retrieval index one eval run measures its arms against.
 *
 * **The rule this module exists to enforce: the eval records real-model numbers over a corpus whose
 * size is recorded with them.** So it refuses before loading anything when the stub models are
 * selected, when the model cache is incomplete, or when the retrieval runtime is not installed; and
 * every build returns `snapshot: { files, chunks }`, taken straight off `refreshIndex`'s own
 * `RefreshResult`, which is the stamp every figure quoted from this run carries. Both numbers are
 * derived from that result and never typed as a literal, and two figures carrying different stamps
 * are not a before/after pair (`evals/docs-retrieval/corpora.mjs` → the moving-corpus paragraph).
 *
 * It imports the compiled retrieval modules under `cli/dist/retrieval/` — the real interfaces, never
 * a copy of them — so `npm run build` is its precondition, which `scripts/run-gates.sh` already
 * satisfies at gate 2a. It calls `corpusFiles` → `refreshIndex` → (the caller's) `searchDocs`
 * directly and never `openRetrieval`, for the reason `evals/docs-retrieval/corpora.mjs`'s header
 * gives.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chunkMarkdown } from '../../cli/dist/retrieval/chunk.js';
import { corpusFiles } from '../../cli/dist/retrieval/corpus.js';
import { RETRIEVAL_STUB_ENV, modelFilesPresent, resolveModels } from '../../cli/dist/retrieval/models.js';
import { refreshIndex } from '../../cli/dist/retrieval/refresh.js';
import { retrievalModelCacheDir, retrievalRuntimeState } from '../../cli/dist/retrieval/runtime.js';
import { openPgliteStore } from '../../cli/dist/retrieval/store.js';

/** The three refusals, each before anything is loaded, each naming what to do about it. */
function assertRealModelsAreAvailable() {
  if ((process.env[RETRIEVAL_STUB_ENV] ?? '') !== '') {
    throw new Error(
      `eval: ${RETRIEVAL_STUB_ENV} is set; the eval records real-model numbers only, so unset it and re-run`,
    );
  }

  const cacheDir = retrievalModelCacheDir();
  const models = modelFilesPresent(cacheDir);
  if (!models.present) {
    throw new Error(
      `eval: the model cache under ${cacheDir} is incomplete, so no real-model number can be taken; ` +
        `missing: ${models.missing.join(', ')}. Run the harness's retrieval setup to fetch them`,
    );
  }

  const runtime = retrievalRuntimeState();
  if (!runtime.installed) {
    throw new Error(
      `eval: the retrieval runtime is not installed, so the optional peers cannot be loaded; ` +
        `missing: ${runtime.missing.join(', ')}. Run the harness's retrieval setup to install them`,
    );
  }
}

/**
 * The index for `config` in the repository at `repoRoot`, and everything an arm needs to query it.
 *
 * `dataDir` is `undefined` unless the operator named one with `--data-dir`, so the default run holds
 * the store in memory and writes nothing into any tree.
 *
 * Returns `{ store, embedder, reranker, refresh, chunkKeys, warnings, snapshot, close }`, where
 * `refresh` is the whole `RefreshResult`, `warnings` are `corpusFiles`' own — surfaced rather than
 * swallowed — and `chunkKeys` is the `key` set of the same chunking the refresh used, so the label
 * hygiene check cannot drift from the index it grades.
 */
export async function buildIndex({ repoRoot, config, dataDir }) {
  assertRealModelsAreAvailable();

  const { embedder, reranker } = await resolveModels({ allowRemote: false });
  const store = await openPgliteStore({ dataDir, dimensions: embedder.dimensions });

  try {
    const refresh = await refreshIndex({ repoRoot, config, store, embedder });
    const corpus = corpusFiles(repoRoot, config);
    const chunkKeys = new Set(
      corpus.files.flatMap((path) =>
        chunkMarkdown(path, readFileSync(join(repoRoot, path), 'utf8')).map((chunk) => chunk.key),
      ),
    );
    return {
      store,
      embedder,
      reranker,
      refresh,
      chunkKeys,
      warnings: refresh.warnings,
      snapshot: { files: refresh.files, chunks: refresh.chunks },
      close: () => store.close(),
    };
  } catch (error) {
    await store.close();
    throw error;
  }
}
