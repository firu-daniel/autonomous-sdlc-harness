### Task 6 — Update the service README: the seam, the rebuild's lock, and the new container test

**Goal:** Make `docs-retrieval-service/README.md` true after the port: the `DocStore` contract and every SQL statement `store.ts` issues now carry over unchanged; the README states which statement takes which lock and that only a hand-run measurement supplies the rebuild's duration (goal 5); and the new container test is listed among the `container`-marked cases.

**Depends on:** Task 4, which adds `tests/test_refresh_end_state_postgres.py` (`container`-marked), and through it Tasks 1 and 3: `store.py` now issues `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` (`REINDEX INDEX chunks_bm25` alone) through `DocStore.rebuild_indexes()`, and the width-change `DELETE FROM meta WHERE key = ANY($1::text[])` over `embedder` and `index_state`; `refresh.py` → `refresh_index` ends every refresh that wrote anything, and every refresh whose `index_state` is not `rebuilt`, with that statement.

**Where this task stops.** `docs/retrieval.md` and `docs/retrieval-eval.md` are **Task 7's**; every figure is **Task 8's**. Scope register rows 1 and 3 are this task's; row 2 stays unchanged.

### Targets

- `docs-retrieval-service/README.md`

**Work:**

- [ ] **`## The seam, as found`, its opening paragraph.** Remove *"except `rebuildIndexes`, which `store.py`'s `DocStore` does not carry yet"* and the sentences listing the three statements `store.py` did not issue *"until `fix_docs_retrieval_bm25_index_state_python`"*. It again reads that the contract carried over method for method (`rebuildIndexes` as `rebuild_indexes`, under departure 7's snake_case) and that every statement `store.ts` issues is issued unchanged, through `AsyncRawCursor` (`src/harness_docs_retrieval/store.py` → `statements`). The numbered departures 1–8 are unchanged: none of this is a departure.
- [ ] **The rebuild and its lock**, a new run-in paragraph after the numbered list and before **Where byte parity is asserted.**, headed **The end state, and the lock it takes.** State, citing PostgreSQL 18's `REINDEX` reference (its *Notes*): `REINDEX INDEX chunks_bm25`, which `refresh_index` issues after every refresh that wrote anything and after any refresh whose `index_state` is not `rebuilt`, holds an `ACCESS EXCLUSIVE` lock on `chunks_bm25` for its duration, blocking reads that would use that index, and blocks writes to `chunks` while reads of the table go on. Then: the refresh's own `DELETE` and `INSERT … ON CONFLICT` take `ROW EXCLUSIVE` on `chunks` and a search's `SELECT` takes `ACCESS SHARE`, so on a database two servers share (point 3) the other server's search or refresh waits for the rebuild; an unchanged refresh over a rebuilt index issues no `REINDEX`. Verify each lock name against the PostgreSQL 18 reference before writing it; where a mode cannot be confirmed from that reference, leave it out rather than state it. **Its duration is not measured**: only an operator's hand run supplies it, through the probe's `--reindex-cost` on the Postgres engine (`docs/retrieval-eval.md` → `### The BM25 index-state probe`), on an otherwise idle machine and outside any session.
- [ ] **`## Testing`.** Add `tests/test_refresh_end_state_postgres.py` to the list of `container`-marked cases, with a clause on what it pins: after a refresh with deletes, after the store's own fresh build, and on a database the shipped code left, every BM25 ranking score equals a fresh build's followed by `REINDEX`. The commands and the *"No test needs model weights"* paragraph are unchanged and stay true; any command added stays in its own fenced block, one per line.

**Verification:**

- `git grep -nF 'does not carry yet' -- docs-retrieval-service/README.md` and `git grep -nF 'fix_docs_retrieval_bm25_index_state_python' -- docs-retrieval-service/README.md` each have no hit.
- Every statement the opening paragraph names as issued unchanged appears verbatim in `store.py`'s `statements()` or `END_STATE_STATEMENTS`.
- The lock paragraph names the PostgreSQL reference it rests on, carries no time figure, and names `--reindex-cost` as the only source of one.
- Scope register: derivation entries A and C, re-run, reach in this file only lines inside rows 1–3, and the lines this task adds fall in rows 1 and 3.
- `git diff --stat` lists only `docs-retrieval-service/README.md`.

- **Deviations from plan:** The `REINDEX` reference's *Notes* (fetched 2026-10-22 from `https://www.postgresql.org/docs/18/sql-reindex.html`) name `ACCESS EXCLUSIVE` on the index and the planner's `ACCESS SHARE` on every index, but not the modes a `DELETE`, `INSERT` or `SELECT` takes; those (`ROW EXCLUSIVE`, `ACCESS SHARE`) were verified against the same version's *Explicit Locking* → *Table-Level Locks* (`https://www.postgresql.org/docs/18/explicit-locking.html`), which the paragraph cites beside the `REINDEX` reference. The table-level mode `REINDEX` takes on `chunks` is not named by the `REINDEX` page, so it is stated only as "locks out writes … while reads go on". Added the *Notes*' planner sentence (*"blocks virtually any query"*), since it is what makes a vector-only search wait too.
