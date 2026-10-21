### Task 10 — Read the shipped end state at refresh level and bring the probe modules up to date with it

**Goal:** Read the shipped fix through the same instrument that measured the defect. After Task 8, the TypeScript backend's own refresh ends in route 2's end state, so the refresh-level module's `before` readings on TypeScript are now the shipped code's end state. Every one of them should match `reference-reindex`. Record that reading, then make the two probe modules state what is now true:

- the refresh-rule module's header still says the shipped refresh issues none of the rule's statements;
- the history probe's store statement is a retyped copy of a statement the store has since changed.

**Depends on:**

- **Task 8**, which made `refreshIndex` call `DocStore.rebuildIndexes()` after every refresh that wrote anything, and after any refresh whose `INDEX_STATE_META_KEY` did not read `INDEX_STATE_REBUILT`.
- **Task 7**, which exports `LEXICAL_SEARCH_STATEMENT`, the store's lexical statement. It selects the ordering expression beside `id`, under the unchanged `ORDER BY … LIMIT $2`, and the store drops score-`0` rows in TypeScript. Task 7 also exports `END_STATE_STATEMENTS`.
- **Task 9**, the previous writer of `### Route 2 on the fix branch`. This task's part, the subsection's last, goes after Task 9's `#### The relevance eval's deterministic figures, after the fix`.
- **Task 1**, the previous editor of `evals/docs-retrieval/bm25-refresh-rule.mjs`. Its `--end-state` and ad-hoc flags stay as Task 1 left them.

**Where this task stops.** It changes no statement the refresh-rule module issues and no reading it takes. The header edit and the `STORE_SELECT` import are the only code edits. The Python backend's refresh is unchanged on this branch and is not re-run here: its 1.5.1 figures stand as recorded.

### Targets

- `docs/retrieval-eval-results.md`: `#### The shipped end state at refresh level`.
- `evals/docs-retrieval/bm25-refresh-rule.mjs`: the module header.
- `evals/docs-retrieval/bm25-history.mjs`: `STORE_SELECT`.

**Work:**

- [ ] **`bm25-history.mjs`.** Replace `STORE_SELECT`'s retyped text with the store's exported `LEXICAL_SEARCH_STATEMENT`, imported from `../../cli/dist/retrieval/store.js` the way the module already imports the store's other constants. `explainStore` then explains the statement `lexicalSearch` actually issues. Amend the constant's doc comment. Nothing else in the module changes.
- [ ] **The refresh-rule header.** The rule sentence's *"because the shipped refresh does not issue them yet"* is now false on TypeScript. Restate it:
  - On the TypeScript backend, the shipped refresh ends every refresh that wrote anything, and every index not marked rebuilt, by issuing `END_STATE_STATEMENTS`, so the `before` readings there are the shipped end state.
  - On the Python backend they are still the state its own refresh leaves.
  - The rule's statements are still issued by hand after it.

  Keep the rest of the rule sentence (fresh references in the same run, cleanup on every exit path).
- [ ] **The runs.** Run `npm run build`. Then run the two TypeScript refresh-level commands of `docs/retrieval-eval.md` → `### The BM25 index-state probe`, unchanged, with the default `--end-state candidate`, capturing to `harness-runs/scratch/fix-bm25/shipped-typescript-<corpus>-1.txt`.
  - Before running, read `pg_textsearch.library_version`, which must be `1.5.1`.
  - Note the `self-docs` stamp. It differs from Task 2's, because this branch edited `docs/`, so compare it structurally.
- [ ] **The part**: one table per corpus, in Task 2's columns. Then:
  - **The verdict**: whether every scenario's `before` reading, the shipped end state, differs from `reference-reindex` on 0 hits in both columns, including `unchanged`;
  - the store plan per scenario: `fixture-catalog` is expected on `Seq Scan` and `self-docs` on the index scan;
  - against Task 2's route-2 table and `#### The candidate end-state rule, at refresh level, on 1.5.1`'s `before` columns, which scenarios the fix moved from differing to matching.

  **If any `before` reading differs from the reference, record it with its hits and return `blocker:` naming it**: the shipped code does not reach its stated end state, and that is a defect in Task 8's commit.

**Verification:**

- Both runs completed, each summary reads `pg_textsearch: 1.5.1`, and each table has all six scenarios.
- `grep -n "STORE_SELECT\|LEXICAL_SEARCH_STATEMENT" evals/docs-retrieval/bm25-history.mjs` shows the import and no retyped `SELECT id FROM` text.
- The refresh-rule header no longer says the shipped refresh issues none of the statements, and still says the statements are issued by hand.
- `git diff --stat` lists the three target files only. The results doc's new lines sit directly after Task 9's part.

- **Deviations from plan:**
  - **The plan's blocker condition fired, and the maintainer ruled on it.** TypeScript `self-docs` `file-edited.before` differs from `reference-reindex.full` on 1 hit in `scan`, 0 in `operator`: `q-sd-stack-detection` → `docs/guard-verification.md#23-fail-closed-matrix-with-positive-controls`, scan `-2.548860` (raw `-2.5488603115081787`) against `-2.548861` (raw `-2.548860549926758`), operator `-2.5488604307174683` in both; `file-edited.after`, after the hand-issued `REINDEX`, reads the same raw value. Recorded in `docs/retrieval-eval-results.md` → `#### The shipped end state at refresh level`; the first dispatch returned it as `blocker:`. The maintainer's ruling, the same as for Task 6's real-catalog residual: the 1-hit `scan` difference (one float32 ULP, `2.384185791015625e-7`; `operator` and index summary identical; a second `REINDEX` leaves it) is recorded, not attributed, and is not a defect in Task 8's commit, so the plan's 0-hit bar does not hold the task. The part states the ruling; the probes were not re-run. Source: `harness-runs/scratch/fix-bm25/shipped-typescript-self-docs-1.txt`, the `score file-edited.before` and `score reference-reindex.full` lines for that key.
  - **Evidence route for the `self-docs` run.** The command was run in the foreground; the tool layer moved it to the background at the 600 s limit. It was not polled, slept on or monitored; its completion notification arrived (exit `0`) while the part was being written, and its capture and stdout were then read. The maintainer accepted this collection. The `fixture-catalog` run completed in the foreground. Both runs' stdout was redirected to a sibling `.stdout` file beside the `--capture` file (`harness-runs/scratch/fix-bm25/shipped-typescript-<corpus>-1.stdout`).
  - **Verification bullet "both runs completed, each summary reads `pg_textsearch: 1.5.1`, each table has all six scenarios":** met, on the two captures above.
  - **`STORE_SELECT` doc comment** records that the index-scan plan's `Output` projects the `<@>` operator expression for `LEXICAL_SEARCH_STATEMENT`'s `score` column (Task 7 implementer's measurement, carried by the dispatch; re-observed in both runs' `plan store` lines: `Output: id, (text <@> …)`).
