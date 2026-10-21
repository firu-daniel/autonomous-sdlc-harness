### Task 7 — Make `lexicalSearch` return only matching chunks on every plan, and give the store its end-state method

**Goal:** Give the store the two pieces route 2 needs before any refresh calls them, so that no commit ever leaves an index in the `REINDEX` state without the filter.

- **Close the lexical-arm defect.** `DocStore.lexicalSearch` returns only chunks that carry a query term, on the index-scan plan and on the `Seq Scan` plan a `REINDEX` puts a small corpus on. Below the crossover of 63 rows (`docs/retrieval-eval-results.md` → `#### The lexical-plan crossover, on 1.5.1`), that plan returns non-matching rows at score `0` (`docs/retrieval.md` → `## Still open`, the lexical-arm bullet). A row at score `0` carries no lexical evidence, so dropping it is the defect's fix and not a retune.
- **Add the end-state method and the marker constants** Task 8 consumes.

**Depends on:**

- **Task 5**, by ship order only. Its **The decision.** records that no vector-index statement joins the end state on this branch, so `END_STATE_STATEMENTS` below is `REINDEX INDEX chunks_bm25` alone (`## Context`, the design decisions). Any vector statement Task 5 names is a proposal to the maintainer, and this task does not implement it.
- **Task 6**, the park point. This task runs only once the real-catalog figure is recorded under `#### Route 2 on the real catalog`. If that part is absent, or records the stop rule's blocker, return `blocker:` naming it and change nothing.

**Where this layer stops.** This task changes `cli/src/retrieval/store.ts` and its own suite only. **It does not call `rebuildIndexes()` from anywhere**, and it does not touch `cli/src/retrieval/refresh.ts`: making every refresh end in the end state, the detection through the marker, the history test and the floor are **Task 8's**. After this task the shipped refresh still issues no `REINDEX`, so `fixture-catalog` stays on the index scan and no recorded figure moves. This task's commit therefore re-records no floor.

### Targets

- `cli/src/retrieval/store.ts`: `lexicalSearch`, the `DocStore` interface, `openPgliteStore`'s open path, the new exports and the module header.
- `cli/test/docs-retrieval-store.test.mjs`: new case (c), and the header and case (a) comment the change falsifies.

**Work:**

- [ ] **`lexicalSearch` filters to matching rows on every plan.**
  - Select the ordering expression's value beside `id`, keeping the statement's `ORDER BY ${BM25_ORDER_CLAUSE} LIMIT $2` exactly as it is.
  - Drop every row whose value is exactly `0` before `ranked()` assigns ranks, so ranks stay 1-based and contiguous.
  - Export the statement as `LEXICAL_SEARCH_STATEMENT`, so the probe can compose its `EXPLAIN` from the store's own text. Task 10 switches `evals/docs-retrieval/bm25-history.mjs`'s `STORE_SELECT` to it.
  - Rewrite `DocStore.lexicalSearch`'s doc comment from *"Not necessarily only matching chunks"* to the guarantee, and say why the filter is in the store rather than in the plan.
  - Change the inline comment in the body to match.
- [ ] **`DocStore.rebuildIndexes(): Promise<void>`**, implemented in `openPgliteStore`. It issues each entry of a new exported, frozen `END_STATE_STATEMENTS` in order, outside any transaction.
  - The list is `REINDEX INDEX ${BM25_INDEX}` alone, composed from the existing `BM25_INDEX` constant, never retyped. No vector-index statement joins it on this branch.
  - Its doc comment states that it brings every index to the state a rebuild over the stored rows leaves, and that the refresh decides when to call it.
  - Amend the header's spliced-token clause: the constant index or table name in each `END_STATE_STATEMENTS` entry is a spliced constant, like the one in `to_bm25query`.
- [ ] **The marker constants**, exported beside `EMBEDDER_META_KEY` for Task 8 to read and write through `readMeta` / `writeMeta`, each with a one-line doc comment:
  - `INDEX_STATE_META_KEY = 'index_state'`;
  - `INDEX_STATE_PENDING = 'pending'`;
  - `INDEX_STATE_REBUILT = 'rebuilt'`.

  In the open path, the width-change branch that drops `chunks` and deletes `EMBEDDER_META_KEY` deletes `INDEX_STATE_META_KEY` too, because a recreated table's indexes are not in the end state.
- [ ] **Case (c) in `cli/test/docs-retrieval-store.test.mjs`: the Seq Scan plan below the crossover.**
  1. Open a store over an on-disk `dataDir` under `os.tmpdir()`, removed in `t.after`.
  2. Upsert `corpusOf(40)`. 40 is below `CROSSOVER_ROWS - CROSSOVER_BAND`, so derive the bound from those constants and assert it rather than hard-wiring a second number.
  3. Call `store.rebuildIndexes()`, then close the store.
  4. Open the directory raw with `PGlite` and both extensions. Assert that `EXPLAIN (VERBOSE, COSTS OFF)` of `LEXICAL_SEARCH_STATEMENT`, bound to `PROBE_TERM` and `ARM_CANDIDATES`, reads `Seq Scan on public.chunks`. If it does not, fail with a message saying the case no longer reaches the plan it exists for.
  5. Reopen the store and assert `lexicalSearch(PROBE_TERM, ARM_CANDIDATES)` deep-equals `[{ id: 40, rank: 1 }]`, and `lexicalSearch(ABSENT_TERM, ARM_CANDIDATES)` deep-equals `[]`.

  Then amend the suite header:
  - its rule sentence becomes *"the BM25 index scan filters to matching rows, and `lexicalSearch` filters on every other plan"*;
  - its *"writes nothing to disk"* gives case (c) as the exception;
  - case (a)'s comment no longer says the doc comment *"needs no change"* if the case flips.
- [ ] **Run the suite, then show case (c) failing without the filter.**
  - Run `npm test --workspace cli -- test/docs-retrieval-store.test.mjs`: every case passes, including (b)'s crossover.
  - Then, as a mutation check, restore the unfiltered `lexicalSearch` body by hand, rebuild, run the same file, record the failing assertion's message, and restore the fix.
  - Also record the `EXPLAIN` of `LEXICAL_SEARCH_STATEMENT` and of the old statement on an index-scan store (case (a)'s 1024 rows) and on case (c)'s store. Each pair names the same plan node, which is the evidence that the filter left the plan unchanged.
  - Put all three in the detail file's **Deviations from plan:** note as executed evidence.

**Verification:**

- `npm test --workspace cli -- test/docs-retrieval-store.test.mjs` passes with the fix, and case (c) fails with the filter removed. The failing message is recorded.
- `bash scripts/typecheck.sh` passes. `rebuildIndexes` is on the `DocStore` interface and implemented, and `noUnusedLocals` stays clean.
- `grep -n "rebuildIndexes" cli/src/retrieval/*.ts` shows the declaration and the implementation in `store.ts` only: no caller in this task.
- Reading `END_STATE_STATEMENTS` in `cli/src/retrieval/store.ts`: its only entry is `REINDEX INDEX ${BM25_INDEX}`, composed from the constant, and no entry names `chunks_hnsw` or `VACUUM`.
- `git diff --stat` lists the two target files only.

- **Deviations from plan:** (recorded by the implementer, 2026-10-21; executed evidence for the last Work bullet)
  - **Park point checked.** `docs/retrieval-eval-results.md` → `#### Route 2 on the real catalog` is present and records the maintainer's ruling that the fix (Tasks 7–12) goes ahead, so no blocker was raised.
  - **Suite with the fix.** `npm test --workspace cli -- test/docs-retrieval-store.test.mjs`: `ok 1 - (a)`, `ok 2 - (b)` (printed `lexical-arm index-scan crossover: 63 rows`), `ok 3 - (c)`; `# tests 3`, `# pass 3`, `# fail 0`.
  - **Mutation check.** `lexicalSearch`'s return was edited by hand to `return ranked(result.rows);` (filter removed), then the same command was run. That command's `pretest` rebuilds. Case (c) failed: `not ok 3 - (c) lexicalSearch returns the matching chunk alone on the Seq Scan plan below the crossover`, message `on the Seq Scan plan at 40 rows the lexical arm returned more than the matching chunk`, and the diff showed `{ id: 40, rank: 1 }` followed by `{ id: 2, rank: 2 }`, `{ id: 3, rank: 3 }`, … These are the non-matching rows. Only case (c)'s result was read from that run. The fix was then restored from a copy and rebuilt (`grep` confirms `row.score !== 0` is back), and the passing run above was taken afterwards.
  - **`EXPLAIN (VERBOSE, COSTS OFF)`, old statement against `LEXICAL_SEARCH_STATEMENT`.** Run as a probe under `harness-runs/scratch/` through `bash scripts/scratch-run.sh`, bound to `frobnicator` and `ARM_CANDIDATES` (50), on stores built by `openPgliteStore` with the suite's synthetic corpus:
    - **1024 rows, no rebuild (case (a)'s index-scan store).** Both statements give `Limit` → `Index Scan using chunks_bm25 on public.chunks`, `Order By: (chunks.text <@> 'chunks_bm25:frobnicator'::bm25query)`. Only the projected column differs. The old statement's `Output: id, bm25_get_current_score()` becomes `Output: id, (text <@> 'chunks_bm25:frobnicator'::bm25query)`, because selecting the operator expression is projected as the operator rather than substituted by the scan's score. The raw statement returned 1 row, with 0 rows at score `0`.
    - **40 rows after `rebuildIndexes()` (case (c)'s store).** Both statements give `Limit` → `Sort` (`Sort Key: ((chunks.text <@> 'chunks_bm25:frobnicator'::bm25query))`) → `Seq Scan on public.chunks`, with the same `Output` lines. The raw statement returned 40 rows, 39 of them at score `0`, and `score` arrives as a JS `number`. `lexicalSearch` returned `[{"id":40,"rank":1}]`.
    - **Why the filter is not a `WHERE`.** The same probe ran `… WHERE <order clause> < 0 …`. It kept the same plan node on both stores and added a `Filter: ((chunks.text <@> …) < '0'::double precision)` line to the scan. The doc comment's reason is worded from that: the store filters the returned rows so that `LEXICAL_SEARCH_STATEMENT`'s plan stays the one the crossover was measured on. It does not claim that a `WHERE` would change the plan node.
  - **Wording.** `INDEX_STATE_PENDING`'s and `INDEX_STATE_REBUILT`'s one-line doc comments take the story index's `## Context` marker semantics. Pending runs from before a refresh's first write until `rebuildIndexes()` returns, and rebuilt applies once it has returned. The open path deletes both meta keys in one `DELETE … WHERE key = ANY($1::text[])` rather than as two statements. `LEXICAL_SEARCH_STATEMENT` was also added to the header's list of exported shapes.
