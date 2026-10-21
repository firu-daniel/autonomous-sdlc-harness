### Task 11 — Update `docs/retrieval.md` and the Python README's seam sentence: the incremental refresh, the lexical-arm bullet, the rebuild's cost, gate 10's legs and the backends' SQL

**Goal:** Make `docs/retrieval.md` describe the shipped code (task prompt, goal 5, its first two bullets), and keep the two documents that say both backends issue the same SQL true once Task 7 has landed. Six sites change, and each cites the measured record rather than restating it:

- **Incremental refresh.** states the end state;
- the `## Still open` lexical-arm bullet closes;
- `## What it costs` gains the rebuild;
- `## Measured, and how` item (d)'s leg count stays true now that gate 10 has a seventh leg;
- **Store.** and `docs-retrieval-service/README.md` → `## The seam, as found` stop claiming the Python store issues every statement `store.ts` issues.

Why the last one: after Task 7, `store.ts` issues `LEXICAL_SEARCH_STATEMENT` (which selects the ordering value beside `id`) in place of the shipped lexical statement, and the `END_STATE_STATEMENTS` through `rebuildIndexes()`. `store.py` keeps the shipped `lexical_search` statement and issues no end-state statement until `fix_docs_retrieval_bm25_index_state_python` (story index → `## Scope register`, rows 20, 37 and 38).

**Depends on:**

- **Task 8**, which made `cli/src/retrieval/refresh.ts` → `refreshIndex` end in the end state:
  - it writes `INDEX_STATE_META_KEY` = `INDEX_STATE_PENDING` before a refresh's first write;
  - it calls `DocStore.rebuildIndexes()` after every refresh that wrote anything, or whose key did not read `INDEX_STATE_REBUILT`;
  - then it writes `INDEX_STATE_REBUILT`.

  So a first `docs index` build, every changing refresh, an index the shipped code built (no key) and an interrupted refresh (`pending`) all end rebuilt. An unchanged refresh over a rebuilt index issues nothing. It is pinned by `cli/test/docs-retrieval-refresh-end-state.test.mjs`, cases (a) and (b).
- **Task 7**, which made `DocStore.lexicalSearch` drop every score-`0` row on every plan, pinned by `cli/test/docs-retrieval-store.test.mjs` case (c), and defined `END_STATE_STATEMENTS`. Read the list from `cli/src/retrieval/store.ts`, never from memory: `REINDEX INDEX chunks_bm25` alone. A vector statement Task 5's **The decision.** may name is a proposal to the maintainer and is not written here as pending work.
- **Task 3**, which gave gate 10 a seventh leg and qualified its record as the six legs the gate had on 2026-09-22.
- **Tasks 9 and 10**, whose parts of `### Route 2 on the fix branch` are the measured record this document cites.

**Where this task stops.** These two files only, and in `docs-retrieval-service/README.md` the one sentence below; no code under `docs-retrieval-service/` changes. It records no figure that is not already in `docs/retrieval-eval-results.md`, which is their one home. On the Python backend it states only the divergence in SQL that Task 7 created and the branch that closes it. Every other Python paragraph stays as it is.

### Targets

- `docs/retrieval.md`:
  - `## How it fits together` → **Incremental refresh.**;
  - `## Measured, and how` → item (d)'s opening sentence;
  - `## Still open` → the bullet **Whether the lexical arm filters to matching chunks on every index.**;
  - `## What it costs` → the TypeScript list;
  - `## How it fits together` → **Store.**, its *"issues that same SQL"* sentence.
- `docs-retrieval-service/README.md` → `## The seam, as found`, its opening sentence *"Every SQL statement `store.ts` issues is issued unchanged"*.

**Work:**

- [ ] **Incremental refresh.** Keep what it says now, and add the end state:
  - every refresh that wrote anything, and the first build, ends with `DocStore.rebuildIndexes()` issuing `END_STATE_STATEMENTS`, named by their statements;
  - an index not marked rebuilt in `meta`, which is every index an earlier version built, is rebuilt on its next refresh even when nothing changed;
  - why: the BM25 scores no longer depend on the index's history. Cite `docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` and the history test.
- [ ] **The lexical-arm bullet**, closed as *"Settled."* in the style of the bullet below it:
  - `lexicalSearch` now drops score-`0` rows on every plan, so the lexical arm returns only matching chunks on the index scan and on the `Seq Scan` a rebuilt index below the crossover takes. Cite case (c).
  - Keep the crossover's measured fact (63 rows on PGlite 0.5.10 with `pg_textsearch` 1.5.1, `#### The lexical-plan crossover, on 1.5.1`) and the reason case (b) asserts it in a band, because the crossover still decides which plan a corpus is on.
  - `fixture-catalog`, at 41 chunks, is now on that plan, citing Task 9's part.
- [ ] **`## What it costs`, the TypeScript list**: one bullet for the rebuild.
  - `REINDEX INDEX` takes an `ACCESS EXCLUSIVE` lock on the index for its duration (the task prompt's lead).
  - It runs after every refresh that wrote anything.
  - Its wall-clock cost is **not measured**. The seam that measures it is the probe's `--reindex-cost`, an operator's hand run (`docs/retrieval-eval.md` → `### The BM25 index-state probe`). No figure is given or predicted.
- [ ] **Item (d)**: *"run by hand, in full, all six legs"* becomes the six legs gate 10 had on 2026-09-22. Leg (vii)'s real-catalog figure is recorded in `docs/retrieval-eval-results.md` → `#### Route 2 on the real catalog`. Change nothing else in item (d).
- [ ] **The backends' SQL, and what is left as it is.**
  - **Store.**: qualify *"issues that same SQL"*. On this branch the TypeScript store's lexical statement, `LEXICAL_SEARCH_STATEMENT`, and its end-state statements, `END_STATE_STATEMENTS`, are not the Python store's: `store.py` → `open_postgres_store` still issues the shipped lexical statement and no end-state statement, until `fix_docs_retrieval_bm25_index_state_python`. Name the two by the identifiers `store.ts` carries, read from the file, and restate no figure.
  - `docs-retrieval-service/README.md` → `## The seam, as found`: qualify *"Every SQL statement `store.ts` issues is issued unchanged"* the same way, naming the same two identifiers and the same branch. Leave its numbered departures list unchanged.
  - Left as they are, with the reason stated here: `## Measured, and how` item (b), a dated measurement of the raw statement, which stays true; **An index older extension versions built.**, a dated record; every other Python paragraph, which states nothing this branch changes.

**Verification:**

- Every statement name and constant the new text uses matches `cli/src/retrieval/store.ts` and `refresh.ts` as Tasks 7 and 8 left them. Grep each one.
- Every figure in the new text is a pointer into `docs/retrieval-eval-results.md`, and none is restated.
- `git grep -nE "Narrowed, not closed" -- docs/retrieval.md` no longer reaches the lexical-arm bullet.
- `git grep -n "fix_docs_retrieval_bm25_index_state_python" -- docs/retrieval.md docs-retrieval-service/README.md` reaches the **Store.** paragraph and the `## The seam, as found` opening sentence, and each of those lines also names `LEXICAL_SEARCH_STATEMENT` and `END_STATE_STATEMENTS`.
- Re-running derivation entry G (`git grep -nE "same SQL|issued unchanged|character for character" -- '*.md' ':!harness-runs' ':!examples'`) reaches no line that says, without the qualification, that the Python store issues every statement `store.ts` issues; every hit falls inside register rows 20 and 38.
- `git diff --stat` lists `docs/retrieval.md` and `docs-retrieval-service/README.md` only.
