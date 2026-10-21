### 2. The `index_state` marker's `pending` branch and its no-rebuild branch are untested, though every `search_docs` call refreshes

**File:** `cli/test/docs-retrieval-refresh-end-state.test.mjs`: the two cases `'(a) a refresh after an edit, a removal and an addition ranks as a fresh build does'` and `'(b) an index the shipped code left is brought to the end state by an unchanged refresh'`. The behaviour they leave unpinned is in `cli/src/retrieval/refresh.ts` (`refreshIndex`): "if (wrote || indexState !== INDEX_STATE_REBUILT) {".

`refreshIndex` decides from the marker in three ways. Case (a) covers *wrote*. Case (b) covers *the marker is absent*. Two branches have no case:

- **An unchanged refresh over an index marked `rebuilt` issues nothing.** `docs/retrieval.md` → **Incremental refresh.** states this (*"an unchanged refresh over a rebuilt index issues nothing"*), and it carries the cost. `cli/src/retrieval/server.ts` → the `search_docs` handler calls `session.refresh()` on **every** call, and `cli/src/commands/docs.ts` → `search` does the same per invocation. A regression that rebuilt whenever nothing changed would put a `REINDEX INDEX chunks_bm25`, which takes an `ACCESS EXCLUSIVE` lock, on every search. Neither existing case would fail, because the extra rebuild leaves the scores equal to the reference.
- **A `pending` marker is rebuilt by the next refresh, even an unchanged one.** This is the interrupted-refresh guarantee that the module header, the `refreshIndex` doc comment and `docs/retrieval.md` all state (*"an interrupted refresh leaves an index the next one rebuilds"*). Case (b) deletes the key rather than setting it to `pending`. So a change that compared against `undefined` instead of `INDEX_STATE_REBUILT` would still pass.

**Fix:** add one case to `cli/test/docs-retrieval-refresh-end-state.test.mjs`. It counts `rebuildIndexes()` calls through a wrapper. The wrapper works because `openPgliteStore` returns a plain object whose methods close over `db`, so a spread copy keeps every method working.

1. Extend the store import with the two marker values:

```js
import {
  BM25_INDEX,
  BM25_ORDER_CLAUSE,
  CHUNKS_TABLE,
  INDEX_STATE_META_KEY,
  INDEX_STATE_PENDING,
  INDEX_STATE_REBUILT,
  openPgliteStore,
} from '../dist/retrieval/store.js';
```

2. Add the helper after `refreshInto`:

```js
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
```

3. Append the case at the end of the file:

```js
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
```

4. Add one sentence to the file header, after the paragraph that opens *"The ranking score is `bm25_get_current_score()`"*: *"Case (c) pins the marker's other two branches, which no score comparison can see: an unchanged refresh leaves an index marked `rebuilt` alone, and rebuilds one marked `pending`."*

This fix edits this test file, so it runs only this file: `npm test --workspace cli -- test/docs-retrieval-refresh-end-state.test.mjs`. The full suite runs later, in the Run gates phase.
