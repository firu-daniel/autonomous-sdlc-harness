/**
 * `refreshIndex`'s end state, read through the BM25 index scan's own ranking score.
 *
 * **The rule these tests exist to enforce: after a refresh, every ranking score equals the score a
 * fresh build of the final corpus ranks by, whatever the index's history.** The refresh's handling is
 * `cli/src/retrieval/refresh.ts` → `refreshIndex` step (6), which ends a refresh in the state
 * `END_STATE_STATEMENTS` leaves (`cli/src/retrieval/store.ts`).
 *
 * The ranking score is `bm25_get_current_score()` under `SET enable_seqscan = off`, never the `<@>`
 * operator's own value, and each comparison is exact. The reference is a fresh refresh of the final
 * corpus into its own directory followed by a raw `REINDEX INDEX chunks_bm25`.
 *
 * Case (c) pins the marker's other two branches, which no score comparison can see: an unchanged
 * refresh leaves an index marked `rebuilt` alone, and rebuilds one marked `pending`.
 *
 * **No model, and nothing downloaded.** Vectors come from {@link EMBEDDER}, a deterministic test-local
 * embedder; every store is an on-disk data directory under the system temp directory, removed in process.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { pg_textsearch } from '@electric-sql/pglite-pg_textsearch';
import { vector } from '@electric-sql/pglite-pgvector';

import { refreshIndex } from '../dist/retrieval/refresh.js';
import {
  BM25_INDEX,
  BM25_ORDER_CLAUSE,
  CHUNKS_TABLE,
  INDEX_STATE_META_KEY,
  INDEX_STATE_PENDING,
  INDEX_STATE_REBUILT,
  openPgliteStore,
} from '../dist/retrieval/store.js';
import { createFixture } from './helpers/fixture.mjs';

const DIMENSIONS = 384;

/** A unit vector per text, from its sha256, so the same text always embeds the same way. */
function deterministicVector(text) {
  const values = [];
  for (let block = 0; values.length < DIMENSIONS; block += 1) {
    const digest = createHash('sha256').update(`${block}\n${text}`).digest();
    for (const byte of digest) values.push(byte / 255 - 0.5);
  }
  const vectorValues = values.slice(0, DIMENSIONS);
  const norm = Math.hypot(...vectorValues);
  return vectorValues.map((value) => value / norm);
}

const EMBEDDER = Object.freeze({
  id: 'test-deterministic-384',
  dimensions: DIMENSIONS,
  embedDocuments: async (texts) => texts.map(deterministicVector),
  embedQuery: async (text) => deterministicVector(text),
});

const CONFIG = Object.freeze({ version: 1, layers: [], docs: { root: 'docs', retrieval: true }, phases: { docs: true } });

const DOCS = Object.freeze({
  'docs/depots.md':
    '# Depots\n\n## Routing parcels\n\nThe planner routes each parcel through the nearest depot and records the depot sequence.\n\n' +
    '## Depot capacity\n\nA depot holds parcels until the next truck leaves; capacity is measured in pallets.\n',
  'docs/trucks.md':
    '# Trucks\n\n## Loading\n\nA truck is loaded at the depot in reverse delivery order so the first parcel is nearest the door.\n\n' +
    '## Maintenance\n\nEvery truck is inspected weekly, and a failed inspection keeps it in the yard.\n',
  'docs/billing.md':
    '# Billing\n\n## Invoices\n\nAn invoice is issued per shipment, listing every parcel and its weight surcharge.\n\n' +
    '## Refunds\n\nA refund is credited to the next invoice when a parcel arrives late.\n',
  'docs/drivers.md':
    '# Drivers\n\n## Shifts\n\nA driver works one shift per day and starts at the depot nearest home.\n\n' +
    '## Training\n\nNew drivers ride along for a week before they take a truck alone.\n',
});

const EDITED_DEPOTS =
  '# Depots\n\n## Routing parcels\n\nThe planner routes each parcel through two depots at most, preferring the depot with spare capacity.\n\n' +
  '## Depot capacity\n\nA depot holds parcels until the next truck leaves; capacity is measured in pallets.\n';

const ADDED_DOC = Object.freeze({
  'docs/weather.md':
    '# Weather\n\n## Delays\n\nSnow delays every truck leaving a depot, and each delayed parcel is flagged on its invoice.\n',
});

const EXTRA_DOC = Object.freeze({
  'docs/customs.md':
    '# Customs\n\n## Declarations\n\nA parcel crossing a border carries a declaration; the depot holds it until customs clears the parcel and the truck.\n',
});

const QUERIES = Object.freeze(['parcel depot', 'truck', 'invoice parcel', 'driver shift depot']);

const LIMIT = 50;

const SCORE_SELECT = `SELECT key, bm25_get_current_score() AS scan FROM ${CHUNKS_TABLE} ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2`;

const INDEX_SCAN = new RegExp(`Index Scan using ${BM25_INDEX}\\b`);

/** A fresh data directory, removed when `t` ends. */
function dataDirFor(t, label) {
  const dir = mkdtempSync(join(tmpdir(), `docs-retrieval-refresh-end-state-${label}-`));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A fixture repository holding `files`, removed when `t` ends. */
async function fixtureWith(t, files) {
  const fixture = await createFixture({ files: { ...files } });
  t.after(fixture.cleanup);
  return fixture.dir;
}

async function openStore(dataDir) {
  return openPgliteStore({ dataDir, dimensions: DIMENSIONS });
}

/** One `refreshIndex` over `repoRoot` into `dataDir`, closing the store after. */
async function refreshInto(repoRoot, dataDir) {
  const store = await openStore(dataDir);
  try {
    return await refreshIndex({ repoRoot, config: CONFIG, store, embedder: EMBEDDER });
  } finally {
    await store.close();
  }
}

/** `store` with its `rebuildIndexes()` calls counted; every other method is the store's own. */
function countingRebuilds(store) {
  const counter = { rebuilds: 0 };
  const wrapped = {
    ...store,
    rebuildIndexes: async () => {
      counter.rebuilds += 1;
      await store.rebuildIndexes();
    },
  };
  return { counter, store: wrapped };
}

/** Opens `dataDir` raw with both extensions, runs `body`, and closes it. */
async function withRaw(dataDir, body) {
  const db = await PGlite.create({ dataDir, extensions: { vector, pg_textsearch } });
  try {
    return await body(db);
  } finally {
    await db.close();
  }
}

/**
 * Rows the scan ranks by an equal score come back in the heap's physical order, which a history of
 * writes moves and a ranking state does not, so equal scores are ordered by key. No score is rounded.
 */
function byScoreThenKey([keyA, scanA], [keyB, scanB]) {
  if (scanA !== scanB) return scanA - scanB;
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}

/** Every query's `(key, scan)` list through the forced index scan, after asserting the plan is that scan. */
async function readScores(dataDir) {
  return withRaw(dataDir, async (db) => {
    await db.exec('SET enable_seqscan = off');
    const scores = {};
    for (const query of QUERIES) {
      const plan = (await db.query(`EXPLAIN (COSTS OFF) ${SCORE_SELECT}`, [query, LIMIT])).rows.map((row) => row['QUERY PLAN']).join('\n');
      assert.match(plan, INDEX_SCAN, `the score statement for "${query}" did not take the ${BM25_INDEX} index scan:\n${plan}`);
      scores[query] = (await db.query(SCORE_SELECT, [query, LIMIT])).rows.map((row) => [row.key, row.scan]).sort(byScoreThenKey);
    }
    return scores;
  });
}

/** The reference: a fresh refresh of `files` into a new directory, then `REINDEX INDEX chunks_bm25` issued raw. */
async function referenceScores(t, files) {
  const repoRoot = await fixtureWith(t, files);
  const dataDir = dataDirFor(t, 'reference');
  await refreshInto(repoRoot, dataDir);
  await withRaw(dataDir, (db) => db.exec(`REINDEX INDEX ${BM25_INDEX}`));
  return readScores(dataDir);
}

function assertScoresEqual(actual, expected) {
  for (const query of QUERIES) {
    assert.ok(expected[query].length > 0, `the reference matched nothing for "${query}"`);
    assert.deepEqual(actual[query], expected[query], `"${query}" ranks differently from a fresh build of the final corpus`);
  }
}

test('(a) a refresh after an edit, a removal and an addition ranks as a fresh build does', async (t) => {
  const repoRoot = await fixtureWith(t, DOCS);
  const dataDir = dataDirFor(t, 'history');
  await refreshInto(repoRoot, dataDir);

  await writeFile(join(repoRoot, 'docs/depots.md'), EDITED_DEPOTS, 'utf8');
  await rm(join(repoRoot, 'docs/billing.md'));
  for (const [path, text] of Object.entries(ADDED_DOC)) await writeFile(join(repoRoot, path), text, 'utf8');
  const result = await refreshInto(repoRoot, dataDir);
  assert.ok(result.embedded > 0 && result.deleted > 0, `the second refresh wrote nothing: ${JSON.stringify(result)}`);

  const finalCorpus = { ...DOCS, 'docs/depots.md': EDITED_DEPOTS, ...ADDED_DOC };
  delete finalCorpus['docs/billing.md'];
  assertScoresEqual(await readScores(dataDir), await referenceScores(t, finalCorpus));
});

test('(b) an index the shipped code left is brought to the end state by an unchanged refresh', async (t) => {
  const repoRoot = await fixtureWith(t, { ...DOCS, ...EXTRA_DOC });
  const dataDir = dataDirFor(t, 'shipped');
  await refreshInto(repoRoot, dataDir);

  const store = await openStore(dataDir);
  const extraKeys = [...(await store.listChunkHashes()).keys()].filter((key) => key.startsWith('docs/customs.md'));
  assert.ok(extraKeys.length > 0, 'the extra document produced no chunk');
  await store.deleteChunks(extraKeys);
  await store.close();
  await withRaw(dataDir, (db) => db.query('DELETE FROM meta WHERE key = $1', [INDEX_STATE_META_KEY]));
  for (const path of Object.keys(EXTRA_DOC)) await rm(join(repoRoot, path));

  const result = await refreshInto(repoRoot, dataDir);
  assert.equal(result.embedded, 0, `the refresh re-embedded: ${JSON.stringify(result)}`);
  assert.equal(result.deleted, 0, `the refresh deleted: ${JSON.stringify(result)}`);

  assertScoresEqual(await readScores(dataDir), await referenceScores(t, DOCS));
});

test('(c) an unchanged refresh rebuilds an index marked pending and leaves one marked rebuilt alone', async (t) => {
  const repoRoot = await fixtureWith(t, DOCS);
  const dataDir = dataDirFor(t, 'marker');
  await refreshInto(repoRoot, dataDir);

  const store = await openStore(dataDir);
  try {
    assert.equal(await store.readMeta(INDEX_STATE_META_KEY), INDEX_STATE_REBUILT, 'a first build did not mark the index rebuilt');

    const quiet = countingRebuilds(store);
    const unchanged = await refreshIndex({ repoRoot, config: CONFIG, store: quiet.store, embedder: EMBEDDER });
    assert.equal(unchanged.embedded + unchanged.deleted, 0, `the refresh wrote: ${JSON.stringify(unchanged)}`);
    assert.equal(quiet.counter.rebuilds, 0, 'an unchanged refresh over an index marked rebuilt rebuilt it');

    // The state a refresh interrupted after its first write leaves.
    await store.writeMeta(INDEX_STATE_META_KEY, INDEX_STATE_PENDING);
    const resumed = countingRebuilds(store);
    await refreshIndex({ repoRoot, config: CONFIG, store: resumed.store, embedder: EMBEDDER });
    assert.equal(resumed.counter.rebuilds, 1, 'an unchanged refresh over an index marked pending did not rebuild it');
    assert.equal(await store.readMeta(INDEX_STATE_META_KEY), INDEX_STATE_REBUILT, 'the rebuild did not mark the index rebuilt');
  } finally {
    await store.close();
  }
});
