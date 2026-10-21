/**
 * A docs-index store built by the **old** retrieval packages, committed as the PGlite
 * `dumpDataDir('gzip')` archive `docs-index-pg-textsearch-1.3.1.tar.gz` beside this module, and the
 * names of what that archive holds.
 *
 * **What built it:** `@electric-sql/pglite` 0.5.8, `@electric-sql/pglite-pg_textsearch` 0.0.10
 * (`pg_textsearch` 1.3.1) and `@electric-sql/pglite-pgvector` 0.0.9 (`vector` 0.8.1), through
 * `cli/src/retrieval/store.ts` → `openPgliteStore` as compiled at the time.
 *
 * **Why it is committed rather than built at test time.** Installing the old packages beside the new
 * ones under npm aliases is refused — `Could not resolve dependency: peer @electric-sql/pglite@"0.5.8"
 * from pglite-pg_textsearch-0.0.10@0.0.10` — so no lockfile can carry both, and a test running under
 * the new packages has no way to build a 1.3.1 store itself.
 *
 * **Regenerating the archive needs those three old versions installed**, and the compiled store
 * (`npm run build`). Under any newer package {@link buildOldDocsIndex} builds a store of that newer
 * version, which is no longer the fixture this file describes. Changing {@link oldIndexChunk},
 * the batch split or {@link oldIndexVector} without regenerating leaves these exports describing a
 * store the archive does not hold.
 *
 * **Importing this module loads nothing.** Only {@link buildOldDocsIndex} reaches PGlite and the
 * compiled store, through dynamic `import()`, so the constants import under the new packages — and
 * `node --test` runs every `.mjs` under `test/`, this one included, so its top level stays free of
 * side effects.
 *
 * **What the index carries:** a segment (the first batch, spilled with `bm25_spill_index`), memtable
 * rows (the second batch, written after the spill) and a dead row ({@link OLD_INDEX_DELETED_KEY},
 * deleted after the spill from the segment's batch) — the on-disk shapes an extension upgrade can
 * break. The deleted chunk carries {@link OLD_INDEX_PROBE_TERM} too, so a query that returns it is
 * reading a dead row.
 *
 * **What the archive holds** — read back on 2026-10-21 under the same old packages, by loading the
 * archive into an in-memory `PGlite.create({ loadDataDir, extensions })`:
 *
 * - archive size: 4940752 bytes, gzip;
 * - `SELECT version()`: `PostgreSQL 18.3 (PGlite 0.5.8) on wasm32-unknown-emscripten`;
 * - `SHOW pg_textsearch.library_version`: `1.3.1`;
 * - `pg_extension`: `pg_textsearch` `1.3.1`, `vector` `0.8.1`;
 * - `bm25_summarize_index('chunks_bm25')`: `total_docs: 32` (the dead row still counted),
 *   `docs_persisted: 24`; memtable `documents: 8`, `terms: 0`; `Total: 1 segments`, its one L0 segment
 *   `terms=35, docs=24`;
 * - `SELECT count(*) FROM chunks`: `31`, the length of {@link OLD_INDEX_KEYS};
 * - the store's lexical statement (`ORDER BY text <@> to_bm25query($1, 'chunks_bm25') LIMIT $2`) on
 *   {@link OLD_INDEX_PROBE_TERM}, limit 50: an `Index Scan using chunks_bm25` returning one row,
 *   {@link OLD_INDEX_PROBE_KEY}, and not {@link OLD_INDEX_DELETED_KEY}.
 */

import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The archive's absolute path. */
export const OLD_INDEX_FIXTURE = fileURLToPath(new URL('./docs-index-pg-textsearch-1.3.1.tar.gz', import.meta.url));

/** The store's embedding width. */
export const OLD_INDEX_DIMENSIONS = 384;

/** A term exactly one surviving chunk carries; the deleted chunk carried it as well. */
export const OLD_INDEX_PROBE_TERM = 'quillwort';

/** The filler vocabulary, free of {@link OLD_INDEX_PROBE_TERM} and of its stems. */
const VOCAB = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'];

/** Chunks `0 … FIRST_BATCH - 1` are written before the spill and land in the segment. */
const FIRST_BATCH = 24;

/** Chunks `FIRST_BATCH … TOTAL - 1` are written after the spill and stay in the memtable. */
const TOTAL = 32;

/** The segment chunk carrying the probe term that survives. */
const PROBE_INDEX = 7;

/** The segment chunk carrying the probe term that is deleted after the spill. */
const DELETED_INDEX = 11;

function keyOf(index) {
  return `synthetic/doc-${String(index).padStart(3, '0')}.md#section`;
}

/** That chunk's `key`. */
export const OLD_INDEX_PROBE_KEY = keyOf(PROBE_INDEX);

/** The key deleted after the spill: the store does not hold it, and a lexical query must not return it. */
export const OLD_INDEX_DELETED_KEY = keyOf(DELETED_INDEX);

/** The sorted keys the store holds after the build. */
export const OLD_INDEX_KEYS = Object.freeze(
  Array.from({ length: TOTAL }, (_, index) => index)
    .filter((index) => index !== DELETED_INDEX)
    .map(keyOf)
    .sort(),
);

/** Chunk `index`, `DocChunk`-shaped. */
function oldIndexChunk(index) {
  const path = `synthetic/doc-${String(index).padStart(3, '0')}.md`;
  const words = [];
  for (let w = 0; w < 12; w += 1) words.push(VOCAB[(index + w) % VOCAB.length]);
  const carriesProbe = index === PROBE_INDEX || index === DELETED_INDEX;
  const body = carriesProbe ? `A note about the ${OLD_INDEX_PROBE_TERM} and ${words.slice(0, 4).join(' ')}.` : words.join(' ');
  const text = `Synthetic ${index}\n\n${body}`;
  return {
    key: keyOf(index),
    path,
    anchor: 'section',
    heading: 'Section',
    text,
    body,
    hash: createHash('sha256').update(text).digest('hex'),
  };
}

/** A deterministic {@link OLD_INDEX_DIMENSIONS}-wide vector derived from `key`; the one the build used. */
export function oldIndexVector(key) {
  const digest = createHash('sha256').update(key).digest();
  const values = [];
  let seed = 0;
  for (let i = 0; i < OLD_INDEX_DIMENSIONS; i += 1) {
    seed = (seed * 1103515245 + digest[i % digest.length] + 12345) >>> 0;
    values.push(((seed % 2000) - 1000) / 1000);
  }
  return values;
}

/** Writes the store's `dumpDataDir('gzip')` archive to `outPath`, from a data directory removed on every exit path. */
export async function buildOldDocsIndex(outPath) {
  const { PGlite } = await import('@electric-sql/pglite');
  const { pg_textsearch } = await import('@electric-sql/pglite-pg_textsearch');
  const { vector } = await import('@electric-sql/pglite-pgvector');
  const { BM25_INDEX, openPgliteStore } = await import('../../dist/retrieval/store.js');

  const extensions = { vector, pg_textsearch };
  const first = Array.from({ length: FIRST_BATCH }, (_, index) => oldIndexChunk(index));
  const second = Array.from({ length: TOTAL - FIRST_BATCH }, (_, offset) => oldIndexChunk(FIRST_BATCH + offset));
  const vectorsOf = (chunks) => chunks.map((chunk) => oldIndexVector(chunk.key));

  const dataDir = mkdtempSync(join(tmpdir(), 'docs-index-pg-textsearch-1.3.1-'));
  const open = [];
  const closeLast = async () => {
    await open.pop().close();
  };
  try {
    open.push(await openPgliteStore({ dataDir, dimensions: OLD_INDEX_DIMENSIONS }));
    await open[0].upsertChunks(first, vectorsOf(first));
    await closeLast();

    open.push(await PGlite.create({ dataDir, extensions }));
    await open[0].query(`SELECT bm25_spill_index('${BM25_INDEX}')`);
    await closeLast();

    open.push(await openPgliteStore({ dataDir, dimensions: OLD_INDEX_DIMENSIONS }));
    await open[0].upsertChunks(second, vectorsOf(second));
    await open[0].deleteChunks([OLD_INDEX_DELETED_KEY]);
    await closeLast();

    open.push(await PGlite.create({ dataDir, extensions }));
    const archive = await open[0].dumpDataDir('gzip');
    writeFileSync(outPath, Buffer.from(await archive.arrayBuffer()));
    await closeLast();
  } finally {
    for (const handle of open) await handle.close().catch(() => {});
    rmSync(dataDir, { recursive: true, force: true });
  }
}
