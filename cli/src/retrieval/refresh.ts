/**
 * Bringing the docs-retrieval index in line with the corpus, incrementally.
 *
 * **The rule this module exists to enforce: the Markdown is the source of truth and the index is
 * always rebuildable from it, so nothing stored here is authoritative.** A refresh never keeps a chunk
 * the corpus no longer has, and an embedder change discards every stored vector rather than mixing
 * two models' vectors in one index. The index's ranking state is derived from the stored rows alone,
 * not from the history of writes that produced them: every refresh that wrote, and every index not
 * marked {@link INDEX_STATE_REBUILT}, ends with {@link DocStore.rebuildIndexes}.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { HarnessConfig } from '../config/model.js';
import { chunkMarkdown, type DocChunk } from './chunk.js';
import { corpusFiles } from './corpus.js';
import type { Embedder } from './models.js';
import {
  EMBEDDER_META_KEY,
  INDEX_STATE_META_KEY,
  INDEX_STATE_PENDING,
  INDEX_STATE_REBUILT,
  type DocStore,
} from './store.js';

/** What one refresh did. */
export interface RefreshResult {
  readonly files: number;
  readonly chunks: number;
  readonly embedded: number;
  readonly unchanged: number;
  /** Chunks whose file or heading is gone; rows a rebuild cleared are not counted. */
  readonly deleted: number;
  /** A stored embedder id differed from this one; a first build, with none stored, is not a rebuild. */
  readonly rebuilt: boolean;
  readonly warnings: readonly string[];
}

/**
 * Exported for `evals/docs-retrieval/vector-agreement.mjs`, which must embed in the same batches a
 * cold refresh uses.
 */
export const EMBED_BATCH_SIZE = 32;

/**
 * Refreshes `store` from the corpus of `config`: (1) an embedder id differing from the stored one,
 * or none stored, clears the index and records the new id; (2) every corpus file is chunked; (3) every
 * stored key not in that set is deleted; (4) chunks whose key is new or whose hash moved are embedded
 * in batches of {@link EMBED_BATCH_SIZE} and upserted; (5) the rest count as unchanged; (6) a refresh
 * that wrote, or whose index was not marked {@link INDEX_STATE_REBUILT} when it started, calls
 * {@link DocStore.rebuildIndexes} and marks it rebuilt. {@link INDEX_STATE_PENDING} is recorded before
 * the first write, so a refresh interrupted after one leaves an index the next refresh rebuilds.
 *
 * Expected cost: a document whose title changed re-embeds every one of its chunks, because the title
 * is part of each chunk's embedded `text`.
 */
export async function refreshIndex(options: {
  repoRoot: string;
  config: HarnessConfig;
  store: DocStore;
  embedder: Embedder;
}): Promise<RefreshResult> {
  const { repoRoot, config, store, embedder } = options;

  const indexState = await store.readMeta(INDEX_STATE_META_KEY);
  let wrote = false;
  const beforeWrite = async (): Promise<void> => {
    if (wrote) return;
    wrote = true;
    await store.writeMeta(INDEX_STATE_META_KEY, INDEX_STATE_PENDING);
  };

  let rebuilt = false;
  const storedEmbedder = await store.readMeta(EMBEDDER_META_KEY);
  if (storedEmbedder !== embedder.id) {
    await beforeWrite();
    await store.clear();
    await store.writeMeta(EMBEDDER_META_KEY, embedder.id);
    rebuilt = storedEmbedder !== undefined;
  }

  const corpus = corpusFiles(repoRoot, config);
  const chunks: DocChunk[] = corpus.files.flatMap((path) => chunkMarkdown(path, readFileSync(join(repoRoot, path), 'utf8')));

  const stored = await store.listChunkHashes();
  const current = new Set(chunks.map((chunk) => chunk.key));
  const gone = [...stored.keys()].filter((key) => !current.has(key));
  if (gone.length > 0) {
    await beforeWrite();
    await store.deleteChunks(gone);
  }

  const changed = chunks.filter((chunk) => stored.get(chunk.key) !== chunk.hash);
  for (let start = 0; start < changed.length; start += EMBED_BATCH_SIZE) {
    const batch = changed.slice(start, start + EMBED_BATCH_SIZE);
    const embeddings = await embedder.embedDocuments(batch.map((chunk) => chunk.text));
    await beforeWrite();
    await store.upsertChunks(batch, embeddings);
  }

  if (wrote || indexState !== INDEX_STATE_REBUILT) {
    await store.rebuildIndexes();
    await store.writeMeta(INDEX_STATE_META_KEY, INDEX_STATE_REBUILT);
  }

  return {
    files: corpus.files.length,
    chunks: chunks.length,
    embedded: changed.length,
    unchanged: chunks.length - changed.length,
    deleted: gone.length,
    rebuilt,
    warnings: corpus.warnings,
  };
}
