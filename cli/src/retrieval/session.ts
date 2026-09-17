/**
 * Opening a docs-retrieval session: the config gate, the model-file gate, the model load and the
 * store open, for every sub-verb that reads the index.
 *
 * **The rule this module exists to enforce: every sub-verb that reads the index opens it here, and
 * nothing is loaded before two refusals have passed** — retrieval is on (`retrievalApplies`), and every
 * `MODEL_FILES` entry is present in the model cache, checked under the stub too so a test's missing
 * cache fails where an adopter's would. Models then load with remote loading disabled
 * (`allowRemote: false`), so a session never reaches the network.
 */

import type { HarnessConfig } from '../config/model.js';
import { retrievalApplies } from '../config/model.js';
import { HarnessError } from '../core/errors.js';
import { modelFilesPresent, resolveModels, type Embedder, type Reranker } from './models.js';
import { refreshIndex, type RefreshResult } from './refresh.js';
import { retrievalModelCacheDir } from './runtime.js';
import { indexDataDir, openPgliteStore, type DocStore } from './store.js';

/** An open index with the models it was opened for. `close()` releases the store. */
export interface RetrievalSession {
  readonly store: DocStore;
  readonly embedder: Embedder;
  readonly reranker: Reranker;
  refresh(): Promise<RefreshResult>;
  close(): Promise<void>;
}

/** `inMemory` opens a store that writes nothing into the repository. */
export async function openRetrieval(options: {
  repoRoot: string;
  config: HarnessConfig;
  inMemory: boolean;
}): Promise<RetrievalSession> {
  const { repoRoot, config, inMemory } = options;

  if (!retrievalApplies(config)) {
    throw new HarnessError(
      'docs retrieval is off in harness.config.json: it needs phases.docs true and docs.retrieval true (`npx autonomous-sdlc-harness config set docs.retrieval true`)',
    );
  }

  const cacheDir = retrievalModelCacheDir();
  const models = modelFilesPresent(cacheDir);
  if (!models.present) {
    throw new HarnessError(
      `the docs-retrieval model cache at ${cacheDir} is missing ${models.missing.join(', ')}: run \`npx autonomous-sdlc-harness init\` in a repository with docs.retrieval on, which downloads the models`,
    );
  }

  const { embedder, reranker } = await resolveModels({ allowRemote: false });
  const store = await openPgliteStore({
    dataDir: inMemory ? undefined : indexDataDir(repoRoot, config.stateDir),
    dimensions: embedder.dimensions,
  });

  return {
    store,
    embedder,
    reranker,
    refresh: () => refreshIndex({ repoRoot, config, store, embedder }),
    close: () => store.close(),
  };
}
