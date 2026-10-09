### Task 6 — Pin the TypeScript fix with a refresh-against-fresh-index score test

**Goal:** Meet goal 4 for the TypeScript backend. Add a test that builds a persistent index, removes and changes documents, refreshes, and compares the BM25 scores with those of a fresh index of the final corpus, exactly. It must fail with Task 5's rebuild call removed and pass with it, and it runs where the CLI's existing tests run, which is `node --test` under `scripts/run-gates.sh`, needing no Docker and no weights.

**Depends on:** Task 5, which adds `DocStore.rebuildLexicalIndex()` and calls it from `refreshIndex` when the refresh cleared the table, deleted a key, or re-embedded a stored key. It also exports `BM25_REINDEX` from `cli/src/retrieval/store.ts`. This test drives the refresh as shipped. It does not call `rebuildLexicalIndex` itself, so it would catch a refresh that stopped calling it.

### Targets

- `cli/test/docs-retrieval-bm25-history.test.mjs` (new).

**Work:**

- [ ] Header: the rule the file enforces, *"a refresh of a persistent docs index scores every query exactly as a fresh index of the same corpus does"*, with a citation of `docs/retrieval-eval-results.md` → `### The index's history, measured` (`.claude/context/conventions.md` → `## The testing bar`, second bullet).
- [ ] Fixture: a throwaway repository under `os.tmpdir()`, built with `cli/test/helpers/fixture.mjs` and torn down in process, with retrieval on and a small corpus whose chunks share query terms. Use the `hash-v1` stub through `retrievalEnv`, exactly as `cli/test/docs-retrieval.test.mjs` does, so no model is downloaded. Build the index by running the compiled CLI's `docs index` into the fixture's own `<stateDir>/docs_index`.
- [ ] Scoring helper: reopen the data directory with PGlite through `cli/dist/retrieval/runtime.js` → `loadRetrievalModule`, as `cli/test/docs-retrieval-store.test.mjs` opens its own. Run Task 1's score statement shape, through the index scan and never with it disabled: `SELECT key, <BM25_ORDER_CLAUSE> AS scan, round((<BM25_ORDER_CLAUSE>)::numeric, 6) AS operator FROM <CHUNKS_TABLE> ORDER BY <BM25_ORDER_CLAUSE> LIMIT $2`, composed from the exported `CHUNKS_TABLE`, `BM25_INDEX` and `BM25_ORDER_CLAUSE`, never retyped, for each of a fixed set of queries. Return key → (`scan`, `operator`), the `scan` value rounded to six decimals on the client. If Task 2 recorded a different column shape as the fix for the stray score, use that shape instead, as Task 2's record states it.
- [ ] Three cases, each refreshing fixture X with `docs index`, then building fixture Y, which holds X's final corpus, fresh, and asserting the two score maps are `deepEqual` in both columns: **(a) delete**, which removes a corpus file; **(b) update**, which changes a section body so a stored key is re-embedded; **(c) embedder change**, which refreshes once under `hash-v1` and again under `hash-v2` so `clear()` runs. In each case also assert the refresh's summary line reports the deletion or re-embedding, so a case cannot pass by not exercising its condition.
- [ ] Show it failing: with Task 5's `rebuildLexicalIndex()` call in `refresh.ts` temporarily removed and the CLI rebuilt, run this file and confirm that cases (a), (b) and (c) each fail on the score comparison. Restore the call, rebuild, and confirm all pass. The final tree has the call in place, and nothing of the removal is committed.

**Verification:**

- `npm test --workspace cli -- test/docs-retrieval-bm25-history.test.mjs` exits zero with the call in place. The failing run with the call removed is reported in the task's completion note, with its `# fail` count.
- The test passes under `bash scripts/run-gates.sh`, on this machine and under the gate's no-Docker condition, because it touches neither.
- The file names no absolute path, and no fixture is created inside this checkout (`.claude/context/conventions.md` → `## The testing bar`, first bullet).
