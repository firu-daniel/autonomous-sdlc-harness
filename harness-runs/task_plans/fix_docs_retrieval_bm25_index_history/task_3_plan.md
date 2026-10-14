### Task 3 — Explain the near-tie ordering on an empty database, or record it as still unexplained

**Goal:** Meet goal 5. On a database created empty, the Python index orders two near-tie pairs against the score the `<@>` operator itself returns, while TypeScript orders both by score: `q-fc-token-lifetime` (`docs/api-auth.md#rotating-a-key` −8.307983, `#token-exchange` −8.281486) and `q-fc-unreadable-label` (`docs/depot-operations.md#inbound-scanning` −5.534851, `docs/labels.md#when-a-label-is-rejected` −5.514854), as recorded in `docs/retrieval-eval-results.md` → item 3 → **What stays unexplained.** Find out why, or record it as still unexplained with those two queries and their scores, re-taken.

**Depends on:** Task 1, whose `evals/docs-retrieval/bm25-history.mjs` creates and drops a throwaway database on the compose server, loads `fixture-catalog`'s chunks, and reads two score columns through the index scan: `scan`, the bare `BM25_ORDER_CLAUSE` column that the planner replaces with the index scan's own score, and `operator`, `round((BM25_ORDER_CLAUSE)::numeric, 6)`, the standalone operator's value. Also Task 2, whose `#### The stray score` part states whether the stray and the near-tie inversion are one mechanism, and which exit of its gate was taken. If Task 2 stopped the branch, this task does not run. This task reuses both tasks' helpers rather than a copy of them.

**The lead, to be verified rather than assumed.** The recorded scores of the two pairs are `operator`-column values, and the order is the scan's. These are two computations in `pg_textsearch` 1.3.1 (`src/planner/hooks.c` → `replace_scores_in_targetlist`; `src/access/scan.c` → `tp_gettuple`; `src/types/query.c` → `bm25_text_bm25query_score`). The scan scores a segment's documents from a one-byte fieldnorm length, which is exact up to 39 tokens and approximate above that (`src/segment/fieldnorm.h`), and ranks with block-max WAND (`src/scoring/bmw.c`). The standalone operator reads the length from the row's own text. The server runs autovacuum, whose insert-threshold path spills the memtable to a segment (README v1.3.1 → the paragraph beginning "VACUUM (including autovacuum's insert-threshold path) also spills"). PGlite runs no autovacuum, so the TypeScript index stays in the memtable. The lead is confirmed if, on one engine, the `scan` column orders each pair consistently with its own values in both states, while the `operator` column inverts against that order only in the spilled state. Both pairs' chunks being longer than 39 tokens would be consistent with it.

### Targets

- `evals/docs-retrieval/bm25-history.mjs`: a third exported function, the near-tie check.
- `docs/retrieval-eval-results.md` → `### The index's history, measured`: a `#### The near-tie ordering` part.

**Work:**

- [ ] The near-tie check: for each of the two queries, on each engine, build a fresh index of `fixture-catalog` and run Task 1's two-column score statement through the index scan, in two states: as inserted (memtable), and after `VACUUM chunks` (spilled, which `bm25_summarize_index` confirms). Report, per state, the returned order of each pair, both columns' values for both keys, and each key's token length read from `to_tsvector('english', text)`. The index scan is never disabled: the comparison is between the two columns of one index-scan statement, not between an index scan and a sequential one.
- [ ] Read `src/scoring/bmw.c`, `src/segment/fieldnorm.c` and `src/types/query.c` → `bm25_text_bm25query_score` at tag `v1.3.1` for how the scan's ranking score and the standalone operator's score each take a document's length. Cite the functions found, by path and name.
- [ ] Record the outcome. Either: the `operator` column inverts against the scan's order only in the spilled state, the `scan` column never does, and the cause is the stated computation, cited. Or: it is still unexplained, with both queries, every score in every state and column, and what was ruled out. Either way, state whether it is Task 2's stray mechanism, citing `#### The stray score`.

**Verification:**

- The recorded part names both queries and gives both columns' scores in every state tried, re-taken here rather than copied from item 3.
- An explanation is accepted only if the inversion appears and disappears with the stated cause on one engine. Otherwise the part says "still unexplained" in those words.
- `grep -n 'enable_indexscan' evals/docs-retrieval/bm25-history.mjs` finds nothing.
- `bash scripts/run-gates.sh` passes.
