/**
 * Bringing the docs-retrieval index in line with the corpus, incrementally.
 *
 * **The rule this module exists to enforce: the Markdown is the source of truth and the index is
 * always rebuildable from it, so nothing stored here is authoritative.** A refresh never keeps a chunk
 * the corpus no longer has, and an embedder change discards every stored vector rather than mixing
 * two models' vectors in one index.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { HarnessConfig } from '../config/model.js';
import { chunkMarkdown, type DocChunk } from './chunk.js';
import { corpusFiles } from './corpus.js';
import type { Embedder } from './models.js';
import { EMBEDDER_META_KEY, type DocStore } from './store.js';

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

const EMBED_BATCH_SIZE = 32;

/**
 * Refreshes `store` from the corpus of `config`: (1) an embedder id differing from the stored one,
 * or none stored, clears the index and records the new id; (2) every corpus file is chunked; (3) every
 * stored key not in that set is deleted; (4) chunks whose key is new or whose hash moved are embedded
 * in batches of 32 and upserted; (5) the rest count as unchanged.
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

  let rebuilt = false;
  const storedEmbedder = await store.readMeta(EMBEDDER_META_KEY);
  if (storedEmbedder !== embedder.id) {
    await store.clear();
    await store.writeMeta(EMBEDDER_META_KEY, embedder.id);
    rebuilt = storedEmbedder !== undefined;
  }

  const corpus = corpusFiles(repoRoot, config);
  const chunks: DocChunk[] = corpus.files.flatMap((path) => chunkMarkdown(path, readFileSync(join(repoRoot, path), 'utf8')));

  const stored = await store.listChunkHashes();
  const current = new Set(chunks.map((chunk) => chunk.key));
  const gone = [...stored.keys()].filter((key) => !current.has(key));
  await store.deleteChunks(gone);

  const changed = chunks.filter((chunk) => stored.get(chunk.key) !== chunk.hash);
  for (let start = 0; start < changed.length; start += EMBED_BATCH_SIZE) {
    const batch = changed.slice(start, start + EMBED_BATCH_SIZE);
    const embeddings = await embedder.embedDocuments(batch.map((chunk) => chunk.text));
    await store.upsertChunks(batch, embeddings);
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
