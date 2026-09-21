/**
 * `DocStore.lexicalSearch` at corpus scale: what the lexical arm returns at the two committed
 * corpora's sizes, and the row count at which a stats-informed planner starts choosing the BM25
 * index scan.
 *
 * **The rule these tests exist to enforce: the lexical arm's "matching rows only" property belongs to
 * the BM25 index scan and not to the `<@>` operator, so it holds above a row count and not below it,
 * and that row count is recorded here rather than assumed.** The prior is `docs/retrieval.md` →
 * `## Measured, and how`, item (b): a `Seq Scan` on three rows returned every row at score `0`, and
 * the planner chose the index unforced at 2,003.
 *
 * **What the measurement changed, and why the two cases are shaped as they are.** Item (b)'s three-row
 * `Seq Scan` was taken with the BM25 index built *after* the rows, which is what gives the planner a
 * real row estimate. `openPgliteStore` builds the index on an empty table and every row arrives after
 * it, so the planner has no statistics for `chunks` and takes its default estimate — and case (a)
 * measures that it therefore picks the index scan at every size this suite reaches. That makes the
 * crossover unreachable through `lexicalSearch`, so case (b) bisects it on a table carrying the same
 * BM25 index options and the same `<@>` ordering with the index built after the rows: the conditions
 * item (b) measured, and the ones a `REINDEX` or a dump restore would recreate under a store whose
 * rows are already there.
 *
 * **No model, and nothing downloaded.** The store is opened directly through
 * `openPgliteStore({ dataDir: undefined, dimensions: 384 })` and fed `upsertChunks` with locally
 * generated vectors, so this suite is stub-independent: it loads no embedder and no reranker, reaches
 * no network, and writes nothing to disk.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { pg_textsearch } from '@electric-sql/pglite-pg_textsearch';
import { vector } from '@electric-sql/pglite-pgvector';

import { openPgliteStore } from '../dist/retrieval/store.js';

/** The embedder's width (`docs/retrieval.md` → **Models**); no model is loaded to get it. */
const DIMENSIONS = 384;

/** The one term the corpus's single matching chunk carries. */
const PROBE_TERM = 'frobnicator';

/** A term no chunk carries, which an index scan answers with no rows at all. */
const ABSENT_TERM = 'quantumchromodynamics';

/** `ARM_CANDIDATES` — the limit the lexical arm actually calls with (`cli/src/retrieval/search.ts`). */
const LIMIT = 50;

/** The filler vocabulary, deliberately free of {@link PROBE_TERM} and of its stems. */
const VOCAB = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'];

/**
 * The measured crossover, in rows, for the synthetic corpus below — see the `(b)` case. It is a
 * property of this corpus's row width as much as of the planner, so a change to {@link VOCAB}, to the
 * filler length or to {@link DIMENSIONS} moves it and is expected to.
 */
const CROSSOVER_ROWS = 63;

/** The band the `(b)` case asserts in, so a PGlite or `pg_textsearch` bump that moves it fails here. */
const CROSSOVER_BAND = 8;

/** The bisect's closed range. Its low end is below the crossover and its high end far above it. */
const BISECT_LOW = 3;
const BISECT_HIGH = 4096;

/** A fixed pseudo-random unit-ish vector derived from the key, so a run is reproducible. */
function vectorFor(key) {
  const digest = createHash('sha256').update(key).digest();
  const values = [];
  let seed = 0;
  for (let i = 0; i < DIMENSIONS; i += 1) {
    seed = (seed * 1103515245 + digest[i % digest.length] + 12345) >>> 0;
    values.push(((seed % 2000) - 1000) / 1000);
  }
  return values;
}

/** Chunk `i` of `total`: filler, except the last, which is the one carrying {@link PROBE_TERM}. */
function chunkAt(index, total) {
  const path = `synthetic/doc-${String(index).padStart(6, '0')}.md`;
  const words = [];
  for (let w = 0; w < 12; w += 1) words.push(VOCAB[(index + w) % VOCAB.length]);
  const body = index === total - 1 ? `A note about the ${PROBE_TERM} and its use.` : words.join(' ');
  const text = `Synthetic ${index}\n\n${body}`;
  return {
    key: `${path}#section`,
    path,
    anchor: 'section',
    heading: 'Section',
    text,
    body,
    hash: createHash('sha256').update(text).digest('hex'),
  };
}

/** `n` synthetic chunks, the last of which is the only match. */
function corpusOf(n) {
  return Array.from({ length: n }, (_, index) => chunkAt(index, n));
}

/** An in-memory store holding `n` synthetic chunks; closed with `t`. */
async function storeOf(t, n) {
  const store = await openPgliteStore({ dataDir: undefined, dimensions: DIMENSIONS });
  t.after(() => store.close());
  const chunks = corpusOf(n);
  for (let from = 0; from < chunks.length; from += 200) {
    const batch = chunks.slice(from, from + 200);
    await store.upsertChunks(
      batch,
      batch.map((chunk) => vectorFor(chunk.key)),
    );
  }
  return store;
}

test('(a) lexicalSearch returns the matching chunk alone at both committed corpora sizes', async (t) => {
  // 40 is the `fixture-catalog` corpus's order of magnitude and 166 the `self-docs` corpus's measured
  // chunk count; 1024 is far above the `(b)` crossover and is here to show the property is not a
  // small-corpus artefact. The chunk carrying the term is inserted last, so its id is `n`.
  //
  // THE OTHER BRANCH, which item (b)'s prior expects and which this measurement did NOT find: the
  // non-matching rows coming back after the match at score `0`, which is what a `Seq Scan` returns.
  // It does not happen here because `openPgliteStore` creates the BM25 index before any row exists,
  // so the planner has no row estimate for `chunks` and takes the index scan at every size — see the
  // header. If this case ever flips to that branch, `DocStore.lexicalSearch`'s own doc comment in
  // `cli/src/retrieval/store.ts` already describes the behaviour and needs no change; what changes is
  // that the fused arm is then carrying non-matching rows on a corpus this size.
  for (const n of [40, 166, 1024]) {
    const store = await storeOf(t, n);
    const hits = await store.lexicalSearch(PROBE_TERM, LIMIT);
    assert.deepEqual(
      hits,
      [{ id: n, rank: 1 }],
      `at ${n} rows the lexical arm returned ${hits.length} rows, not the matching chunk alone`,
    );
    assert.deepEqual(await store.lexicalSearch(ABSENT_TERM, LIMIT), [], `at ${n} rows a term no chunk carries matched`);
  }
});

test('(b) the index-scan crossover, bisected on a stats-informed plan', async (t) => {
  const db = await PGlite.create({ extensions: { vector, pg_textsearch } });
  t.after(() => db.close());
  await db.exec('CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_textsearch;');

  // The table carries the two columns the ordering's cost depends on — the indexed text and the
  // embedding whose width sets the rows per page — and the index is built AFTER the rows, which is
  // the one thing `openPgliteStore` cannot be made to do and the whole reason this case does not run
  // through it. A fresh table per probe rather than deletes: dead tuples inflate the page count a
  // sequential scan is costed on, and would make the answer depend on the probe order.
  const filtersAt = async (n) => {
    await db.exec('DROP TABLE IF EXISTS chunks');
    await db.exec(`CREATE TABLE chunks (id serial PRIMARY KEY, text text NOT NULL, embedding vector(${DIMENSIONS}) NOT NULL)`);
    await db.transaction(async (tx) => {
      for (const chunk of corpusOf(n)) {
        await tx.query('INSERT INTO chunks (text, embedding) VALUES ($1, $2::vector)', [
          chunk.text,
          `[${vectorFor(chunk.key).join(',')}]`,
        ]);
      }
    });
    await db.exec("CREATE INDEX chunks_bm25 ON chunks USING bm25 (text) WITH (text_config='english')");
    const result = await db.query("SELECT id FROM chunks ORDER BY text <@> to_bm25query($1, 'chunks_bm25') LIMIT $2", [
      PROBE_TERM,
      LIMIT,
    ]);
    return result.rows.length === 1;
  };

  // MONOTONICITY IS ASSUMED, not measured: the bisect takes it that once the index scan wins it keeps
  // winning as rows are added, so the probes are logarithmic in the range rather than exhaustive over
  // it. The two bounds below are asserted, which is what would catch the assumption failing at an end.
  assert.equal(await filtersAt(BISECT_LOW), false, `the bisect's low bound already filtered, so the crossover is below ${BISECT_LOW}`);
  assert.equal(await filtersAt(BISECT_HIGH), true, `the bisect's high bound did not filter, so the crossover is above ${BISECT_HIGH}`);

  let low = BISECT_LOW;
  let high = BISECT_HIGH;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (await filtersAt(mid)) high = mid;
    else low = mid + 1;
  }

  // Printed whatever the verdict below, and in exactly this form: `docs/retrieval.md`'s `## Still
  // open` entry is reworded from this line.
  console.log(`lexical-arm index-scan crossover: ${low} rows`);

  assert.ok(
    Math.abs(low - CROSSOVER_ROWS) <= CROSSOVER_BAND,
    `the crossover measured at ${low} rows, outside ${CROSSOVER_ROWS} +/- ${CROSSOVER_BAND}: a PGlite or pg_textsearch version bump has moved it, and the recorded number needs re-taking`,
  );
});
