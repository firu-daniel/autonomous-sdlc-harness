/**
 * `SearchResult.bestRerankScore`: the uncensored top reranker score `fused-rerank` compares against
 * `ABSTAIN_SCORE_THRESHOLD`.
 *
 * **The rule these tests exist to enforce: the uncensored score is the one abstention compares, it is
 * present on an abstention, it is absent outside `fused-rerank`, and it changes no rendering.**
 *
 * **No model, and nothing downloaded.** The store is opened in memory through `openPgliteStore` and
 * fed locally generated vectors; the embedder and the reranker are plain objects whose reranker
 * returns fixed scores derived from the threshold, so the cases hold whatever value it is set to.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { ABSTAIN_SCORE_THRESHOLD, renderResults, searchDocs } from '../dist/retrieval/search.js';
import { openPgliteStore } from '../dist/retrieval/store.js';

const DIMENSIONS = 384;

/** The one term every chunk carries, so the lexical arm has candidates to hand the reranker. */
const TERM = 'frobnicator';

/** A fixed pseudo-random vector derived from the key, so a run is reproducible. */
function vectorFor(key) {
  const digest = createHash('sha256').update(key).digest();
  return Array.from({ length: DIMENSIONS }, (_, i) => (digest[i % digest.length] - 128) / 128);
}

function chunkAt(index) {
  const path = `synthetic/doc-${index}.md`;
  const body = `A note about the ${TERM}, number ${index}.`;
  const text = `Section ${index}\n\n${body}`;
  return {
    key: `${path}#section`,
    path,
    anchor: 'section',
    heading: `Section ${index}`,
    text,
    body,
    hash: createHash('sha256').update(text).digest('hex'),
  };
}

/** An in-memory store holding `n` chunks; closed with `t`. */
async function storeOf(t, n) {
  const store = await openPgliteStore({ dataDir: undefined, dimensions: DIMENSIONS });
  t.after(() => store.close());
  if (n > 0) {
    const chunks = Array.from({ length: n }, (_, index) => chunkAt(index));
    await store.upsertChunks(chunks, chunks.map((chunk) => vectorFor(chunk.key)));
  }
  return store;
}

const embedder = {
  id: 'fixed',
  dimensions: DIMENSIONS,
  embedDocuments: async (texts) => texts.map((text) => vectorFor(text)),
  embedQuery: async (text) => vectorFor(text),
};

/** A reranker whose passage `i` scores `top * (1 - i / 10)`, so `top` is the highest. */
function rerankerTopping(top) {
  return {
    id: 'fixed',
    score: async (_query, passages) => passages.map((_, i) => top * (1 - i / 10)),
  };
}

/** `renderResults` of `result` equals that of the same object with `bestRerankScore` removed. */
function assertRenderingUnchanged(result) {
  const { bestRerankScore: _omitted, ...without } = result;
  assert.equal(renderResults(result), renderResults(without));
}

const search = (store, reranker, mode) => searchDocs({ store, embedder, reranker, query: TERM, k: 5, mode });

test('(a) an abstention reports the highest reranker score it compared', async (t) => {
  const store = await storeOf(t, 3);
  const top = ABSTAIN_SCORE_THRESHOLD / 2;
  const result = await search(store, rerankerTopping(top), 'fused-rerank');
  assert.equal(result.abstained, true);
  assert.deepEqual(result.hits, []);
  assert.equal(result.bestRerankScore, top);
});

test('(b) an answer reports the top hit score as the best reranker score', async (t) => {
  const store = await storeOf(t, 3);
  const top = (ABSTAIN_SCORE_THRESHOLD + 1) / 2;
  const result = await search(store, rerankerTopping(top), 'fused-rerank');
  assert.equal(result.abstained, false);
  assert.ok(result.hits.length > 0);
  assert.equal(result.bestRerankScore, top);
  assert.equal(result.bestRerankScore, result.hits[0].score);
});

test('(c) lexical, vector and fused report no reranker score', async (t) => {
  const store = await storeOf(t, 3);
  for (const mode of ['lexical', 'vector', 'fused']) {
    const result = await search(store, rerankerTopping(1), mode);
    assert.ok(result.hits.length > 0, `${mode} returned no hits`);
    assert.equal(result.bestRerankScore, null, `${mode} reported a reranker score`);
  }
});

test('(d) fused-rerank over an empty store abstains with no score', async (t) => {
  const store = await storeOf(t, 0);
  const result = await search(store, rerankerTopping(1), 'fused-rerank');
  assert.equal(result.abstained, true);
  assert.equal(result.bestRerankScore, null);
});

test('(e) the field changes no rendering of any result above', async (t) => {
  const populated = await storeOf(t, 3);
  const empty = await storeOf(t, 0);
  const results = [
    await search(populated, rerankerTopping(ABSTAIN_SCORE_THRESHOLD / 2), 'fused-rerank'),
    await search(populated, rerankerTopping((ABSTAIN_SCORE_THRESHOLD + 1) / 2), 'fused-rerank'),
    ...(await Promise.all(['lexical', 'vector', 'fused'].map((mode) => search(populated, rerankerTopping(1), mode)))),
    await search(empty, rerankerTopping(1), 'fused-rerank'),
  ];
  for (const result of results) assertRenderingUnchanged(result);
});
