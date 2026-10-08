### Task 3 — Explain the near-tie ordering on an empty database, or record it as still unexplained

**Goal:** Meet goal 5. On a database created empty, the Python index orders two near-tie pairs against the score the `<@>` operator itself returns, while TypeScript orders both by score: `q-fc-token-lifetime` (`docs/api-auth.md#rotating-a-key` −8.307983, `#token-exchange` −8.281486) and `q-fc-unreadable-label` (`docs/depot-operations.md#inbound-scanning` −5.534851, `docs/labels.md#when-a-label-is-rejected` −5.514854), as recorded in `docs/retrieval-eval-results.md` → item 3 → **What stays unexplained.** Find out why, or record it as still unexplained with those two queries and their scores, re-taken.

**Depends on:** Task 1, whose `evals/docs-retrieval/bm25-history.mjs` already creates and drops a throwaway database on the compose server, loads `fixture-catalog`'s chunks and runs the scored statement. This task reuses those helpers.

**The lead, to be verified rather than assumed.** In `pg_textsearch` 1.3.1, an on-disk segment stores each document's length as a one-byte fieldnorm, which is exact up to 39 tokens and approximate above that (`src/segment/fieldnorm.h`). The index scan ranks with block-max WAND over the segment's data (`src/scoring/bmw.c`). The projected `<@>` value may be computed from a different representation than the one the scan ranks by. The server runs autovacuum, whose insert-threshold path spills the memtable to a segment (README v1.3.1 → the paragraph beginning "VACUUM (including autovacuum's insert-threshold path) also spills"). PGlite runs no autovacuum, so the TypeScript index stays in the memtable. If the two pairs' ordering flips between a memtable-only index and a spilled one, on the same engine, the lead is confirmed. Both pairs' chunks being longer than 39 tokens would be consistent with it.

### Targets

- `evals/docs-retrieval/bm25-history.mjs`: a third exported function, the near-tie check.
- `docs/retrieval-eval-results.md` → `### The index's history, measured`: a `#### The near-tie ordering` part.

**Work:**

- [ ] The near-tie check: for each of the two queries, on each engine, build a fresh index of `fixture-catalog` and run the scored statement **twice per state**. One run is `ORDER BY` the operator, as the store does. The other orders by the projected score computed in a subquery that forces a sequential scan (`SET enable_indexscan = off` for that statement), so the score and the order are compared without the index scan's ranking. Do this in two states: as inserted (memtable), and after `VACUUM chunks` (spilled, which `bm25_summarize_index` confirms). Also report each pair's token lengths, read from `to_tsvector('english', text)`.
- [ ] Read `src/scoring/bmw.c` and `src/segment/fieldnorm.c` at tag `v1.3.1` for how the scan's ranking score and the operator's projected score are each computed. Cite the functions found, by path and name.
- [ ] Record the outcome. Either: the order inverts only in the spilled state and the cause is the stated computation, cited. Or: it is still unexplained, with both queries, all four scores, the states tried and what was ruled out.

**Verification:**

- The recorded part names both queries and gives the scores in every state tried, re-taken here rather than copied from item 3.
- An explanation is accepted only if the inversion appears and disappears with the stated cause on one engine. Otherwise the part says "still unexplained" in those words.
- `bash scripts/run-gates.sh` passes.
