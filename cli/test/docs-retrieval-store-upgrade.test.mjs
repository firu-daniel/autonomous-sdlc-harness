/**
 * `openPgliteStore` over a docs-index data directory the **old** retrieval packages built — the archive
 * `cli/test/fixtures/docs-index-pg-textsearch-1.3.1.mjs` describes, holding a spilled segment, memtable
 * rows and one deleted key.
 *
 * **The rule these tests exist to enforce: a data directory the old packages built opens to a working
 * store, or is refused with its remedy, and is never left half-working.** The store's handling is
 * `cli/src/retrieval/store.ts` → `STALE_EXTENSIONS_QUERY` and `EXTENSION_UPDATE_STATEMENTS`: on open it
 * issues `ALTER EXTENSION <name> UPDATE` for each extension whose installed `extversion` differs from
 * the loaded library's `default_version`. No case asserts a version literal; each compares the two
 * catalogs, so a package bump moves nothing here.
 *
 * **What the new packages did with that directory before the handling, and with it,** is recorded in
 * `docs/retrieval.md` → `## How it fits together`, **An index older extension versions built.**
 *
 * **No model, and nothing downloaded.** Vectors come from `oldIndexVector`; each case loads the archive
 * into its own data directory under the system temp directory, removed in process.
 */

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { pg_textsearch } from '@electric-sql/pglite-pg_textsearch';
import { vector } from '@electric-sql/pglite-pgvector';

import { ARM_CANDIDATES } from '../dist/retrieval/search.js';
import { openPgliteStore } from '../dist/retrieval/store.js';
import {
  OLD_INDEX_DELETED_KEY,
  OLD_INDEX_DIMENSIONS,
  OLD_INDEX_FIXTURE,
  OLD_INDEX_KEYS,
  OLD_INDEX_PROBE_KEY,
  OLD_INDEX_PROBE_TERM,
  oldIndexVector,
} from './fixtures/docs-index-pg-textsearch-1.3.1.mjs';

const EXTENSIONS = { vector, pg_textsearch };

/** A data directory holding the old archive, removed when `t` ends. */
async function loadOldIndex(t) {
  const dataDir = mkdtempSync(join(tmpdir(), 'docs-retrieval-store-upgrade-'));
  t.after(() => rmSync(dataDir, { recursive: true, force: true }));
  const loader = await PGlite.create({ dataDir, loadDataDir: new Blob([readFileSync(OLD_INDEX_FIXTURE)]), extensions: EXTENSIONS });
  await loader.close();
  return dataDir;
}

/** Opens the store and closes it when `t` ends, unless the case already did. */
async function openStore(t, dataDir) {
  const store = await openPgliteStore({ dataDir, dimensions: OLD_INDEX_DIMENSIONS });
  let open = true;
  const close = async () => {
    if (!open) return;
    open = false;
    await store.close();
  };
  t.after(close);
  return { store, close };
}

/** Each extension's installed and default version, and the loaded `pg_textsearch` library's, read raw. */
async function readVersions(dataDir) {
  const db = await PGlite.create({ dataDir, extensions: EXTENSIONS });
  try {
    const extensions = (
      await db.query(
        'SELECT e.extname, e.extversion, a.default_version FROM pg_extension e ' +
          "JOIN pg_available_extensions a ON a.name = e.extname WHERE e.extname IN ('vector', 'pg_textsearch') ORDER BY e.extname",
      )
    ).rows;
    const library = (await db.query('SHOW pg_textsearch.library_version')).rows[0]['pg_textsearch.library_version'];
    return { extensions, library };
  } finally {
    await db.close();
  }
}

async function sortedKeys(store) {
  return [...(await store.listChunkHashes()).keys()].sort();
}

async function keysOf(store, ranked) {
  return (await store.getChunks(ranked.map((hit) => hit.id))).map((chunk) => chunk.key);
}

test('an old index opens and reads as it was written', async (t) => {
  const dataDir = await loadOldIndex(t);
  const { store } = await openStore(t, dataDir);

  assert.deepEqual(await sortedKeys(store), [...OLD_INDEX_KEYS]);

  const lexical = await keysOf(store, await store.lexicalSearch(OLD_INDEX_PROBE_TERM, ARM_CANDIDATES));
  assert.equal(lexical[0], OLD_INDEX_PROBE_KEY);
  assert.ok(!lexical.includes(OLD_INDEX_DELETED_KEY), `the deleted key came back from the lexical arm: ${lexical.join(', ')}`);

  const nearest = await keysOf(store, await store.vectorSearch(oldIndexVector(OLD_INDEX_PROBE_KEY), 1));
  assert.deepEqual(nearest, [OLD_INDEX_PROBE_KEY]);
});

test('an old index takes writes, and is left at the loaded libraries\' extension versions', async (t) => {
  const dataDir = await loadOldIndex(t);
  const { store, close } = await openStore(t, dataDir);

  const chunk = {
    key: 'upgrade/new.md#section',
    path: 'upgrade/new.md',
    anchor: 'section',
    heading: 'Section',
    body: 'written after the upgrade',
    text: 'Section\n\nwritten after the upgrade',
    hash: 'upgrade-hash',
  };
  await store.upsertChunks([chunk], [oldIndexVector(chunk.key)]);
  assert.ok((await sortedKeys(store)).includes(chunk.key));
  await store.deleteChunks([chunk.key]);
  assert.deepEqual(await sortedKeys(store), [...OLD_INDEX_KEYS]);
  await close();

  const { extensions, library } = await readVersions(dataDir);
  assert.deepEqual(
    extensions.map((row) => row.extname),
    ['pg_textsearch', 'vector'],
  );
  for (const row of extensions) assert.equal(row.extversion, row.default_version, `${row.extname} was left at ${row.extversion}`);
  const textsearch = extensions.find((row) => row.extname === 'pg_textsearch');
  assert.equal(library, textsearch.extversion);
});

test('a second open of an upgraded index changes nothing', async (t) => {
  const dataDir = await loadOldIndex(t);
  const first = await openStore(t, dataDir);
  await first.close();
  const before = await readVersions(dataDir);

  const second = await openStore(t, dataDir);
  assert.deepEqual(await sortedKeys(second.store), [...OLD_INDEX_KEYS]);
  await second.close();

  assert.deepEqual(await readVersions(dataDir), before);
});
