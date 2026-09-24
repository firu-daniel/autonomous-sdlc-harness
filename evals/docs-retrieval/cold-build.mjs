/**
 * The cold build of a persisted docs-retrieval index: its wall time, in three phases, and the size on
 * disk of the directory it leaves behind.
 *
 * **The rule this module exists to enforce: a build is only cold if the index directory was removed
 * before it started, and only a build that embedded every chunk it chunked measured a cold one.** An
 * incremental refresh over a surviving index embeds a fraction of the corpus and returns in a fraction
 * of the time, which is the failure mode that would make this measurement silently meaningless. So the
 * removal is asserted (`dataDir` must not exist when the store opens) and `RefreshResult.embedded` is
 * asserted equal to its `chunks`; either assertion failing throws rather than returning a figure.
 *
 * **Which sense of cold, stated rather than implied.** The *index* is cold — the directory was just
 * removed. The *model cache* is warm: the weights are installed once per machine and nothing here
 * downloads anything, which is why the returned result carries `cold: { index: true, modelCache:
 * false }` and why the recorded figures say so. A cold model download is `docs/development.md` §5 gate
 * 10's leg (i) and is not measured here.
 *
 * **Why the three phases are timed separately rather than as one total.** They answer different
 * questions and scale differently: the model load is per process and flat in the corpus size, the store
 * open is per index directory, and only the refresh is per chunk — so only the refresh figure may be
 * extrapolated to a larger catalog, and a total that hid it inside itself could not be.
 *
 * **Both size figures, because the two answers differ.** The apparent size is the sum of `size`, which
 * is what a copy of the directory transfers; the allocated size is the sum of `blocks * 512`, which is
 * what the filesystem spends. Both are walked in process: shelling out to `du` has no entry in
 * `.claude/settings.autonomous.json` and stalls an unattended run, and the recursive removal is in
 * process because `.claude/context/conventions.md` → `## Shell assets` requires it of every teardown.
 *
 * It is driven by a launcher under the run's scratch directory (`bash scripts/scratch-run.sh`), one
 * measurement per process, because a second `resolveModels` in the same process would time a model load
 * that had already happened.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { platform, release } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { resolveModels } from '../../cli/dist/retrieval/models.js';
import { refreshIndex } from '../../cli/dist/retrieval/refresh.js';
import { openPgliteStore } from '../../cli/dist/retrieval/store.js';
import { corpusConfig } from './corpora.mjs';
import { assertRealModelsAreAvailable } from './index-build.mjs';

/**
 * Every regular file under `dir`, summed two ways, with the count.
 *
 * `blocks * 512` is the POSIX unit of `stat`'s `blocks` field whatever the filesystem's own block size,
 * so the allocated figure is comparable across hosts in a way a block count alone is not.
 */
function directorySize(dir) {
  let apparentBytes = 0;
  let allocatedBytes = 0;
  let files = 0;
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      // A symlink is counted as the link rather than followed: following one could leave the tree and
      // count a byte the index does not own.
      const stats = statSync(path, { throwIfNoEntry: false });
      if (stats === undefined) continue;
      apparentBytes += stats.size;
      allocatedBytes += stats.blocks * 512;
      files += 1;
    }
  };
  walk(dir);
  return { apparentBytes, allocatedBytes, files };
}

/**
 * One cold build of `corpus` into `dataDir`, timed in three phases and measured on disk.
 *
 * `dataDir` is required and is removed before anything is timed — this measurement has no in-memory
 * form, because an in-memory store writes nothing to size.
 *
 * **The corpus is named either way `corpusConfig` accepts one**, and the choice is forwarded rather
 * than narrowed here: a built-in id through `corpus`, or an ad-hoc corpus through `docsRoot` and the
 * repeatable `conventions`, which is the route that reads a documentation directory in place — no
 * `harness.config.json` in the target, no `init`, nothing written into it but the `dataDir` this
 * measurement owns. `corpusConfig` refuses an invocation naming neither, and the returned `corpus`
 * field is the id it resolved, so an ad-hoc figure is stamped `ad-hoc` rather than passing for a
 * built-in one.
 *
 * Returns `{ corpus, dataDir, host, node, ranAt, snapshot, cold, timings, size }`, where `snapshot` is
 * the `{ files, chunks }` stamp off this run's own `RefreshResult` — never typed as a literal, and the
 * stamp every figure quoted from this run carries (`evals/docs-retrieval/corpora.mjs` → the
 * moving-corpus paragraph).
 */
export async function measureColdBuild({ repoRoot, corpus, dataDir, docsRoot, conventions = [] }) {
  if (typeof dataDir !== 'string' || dataDir === '') {
    throw new Error('eval: measureColdBuild needs a dataDir; there is nothing to size about an in-memory store');
  }
  assertRealModelsAreAvailable();

  const resolved = corpusConfig({ repoRoot, corpus, docsRoot, conventions });

  rmSync(dataDir, { recursive: true, force: true });
  if (existsSync(dataDir)) {
    throw new Error(`eval: ${dataDir} still exists after its removal, so the next build would not be cold`);
  }

  const startedAt = new Date();

  const modelLoadStart = performance.now();
  const { embedder } = await resolveModels({ allowRemote: false });
  const modelLoadMs = performance.now() - modelLoadStart;

  const storeOpenStart = performance.now();
  const store = await openPgliteStore({ dataDir, dimensions: embedder.dimensions });
  const storeOpenMs = performance.now() - storeOpenStart;

  let refresh;
  try {
    const refreshStart = performance.now();
    refresh = await refreshIndex({ repoRoot: resolved.repoRoot, config: resolved.config, store, embedder });
    refresh = { ...refresh, ms: performance.now() - refreshStart };
  } finally {
    await store.close();
  }

  if (refresh.embedded !== refresh.chunks) {
    throw new Error(
      `eval: the refresh embedded ${refresh.embedded} of ${refresh.chunks} chunks, so it ran incrementally ` +
        'over a surviving index rather than cold; the figures are discarded',
    );
  }

  return {
    corpus: resolved.id,
    dataDir,
    host: `${platform()} ${release()}`,
    node: process.version,
    ranAt: startedAt.toISOString(),
    snapshot: { files: refresh.files, chunks: refresh.chunks },
    cold: { index: true, modelCache: false },
    timings: {
      modelLoadMs,
      storeOpenMs,
      refreshMs: refresh.ms,
      totalMs: modelLoadMs + storeOpenMs + refresh.ms,
    },
    size: directorySize(dataDir),
  };
}
