### Task 12 — Record the old-index handling and the crossover on 1.5.1 in `docs/retrieval.md` and the results subsection

**Goal:** Two records. First, goal 2 for both backends: `docs/retrieval.md` states what happens when the new code opens an index the 1.3.1 versions built, and what each store does about it. Second, goal 6: `docs/retrieval.md` → `## Still open`, the lexical-arm bullet, and a new results part state the crossover with the versions it was measured on, and with the new figure if it moved.

**Depends on:**

- **Task 4.** `cli/test/docs-retrieval-store-upgrade.test.mjs`'s header records, verbatim, what PGlite 0.5.10 with `pg_textsearch` 1.5.1 did with a data directory PGlite 0.5.8 with `pg_textsearch` 1.3.1 built, before any handling, with the date and both package sets. `cli/src/retrieval/store.ts` → `openPgliteStore`'s doc comment states the handling and names its exported statements. On the expected branch these are `STALE_EXTENSIONS_QUERY` and `EXTENSION_UPDATE_STATEMENTS`: an `ALTER EXTENSION <name> UPDATE` for each extension whose `extversion` differs from its `default_version`.
- **Task 5.** `cli/test/docs-retrieval-store.test.mjs` → `CROSSOVER_ROWS` and its doc comment carry the crossover figure, the versions and date it was measured on, the Node versions that printed it, and the previous figure (`63`, on PGlite 0.5.8 with `pg_textsearch` 1.3.1) if it moved.
- **Task 7.** `docs-retrieval-service/README.md` → `## The seam, as found`, item 4, carries Task 6's sentence (what the 1.5.1 compose server reported for a database the 1.3.1 server built, before any store opened it) and Task 7's (what `open_postgres_store` then did to it), each dated with its statements.
- **Task 11**, the previous writer of `### The deciding figures on pg_textsearch 1.5.1` in `docs/retrieval-eval-results.md`. This task's part goes after Task 11's `#### The relevance eval's deterministic figures, on 1.5.1`.

**Where this task stops.** It quotes and cites the facts above and takes no measurement of its own. If a source above lacks the fact this task needs, report the gap rather than re-measuring. It does not edit `docs/retrieval.md` → `## Measured, and how`, item (b): that is a dated record on PGlite 0.5.8. It does not touch the recommendation, which is Task 13's.

### Targets

- `docs/retrieval.md`: a new paragraph **An index older extension versions built.** directly after **Store.** in `## How it fits together`, and the `## Still open` lexical-arm bullet.
- `docs/retrieval-eval-results.md`: `#### The lexical-plan crossover, on 1.5.1`.

**Work:**

- [ ] **`docs/retrieval.md`, the new paragraph after **Store.**.**
  - **TypeScript backend.** What the new packages did with a 1.3.1-built data directory before any handling, quoted from the Task 4 test header with its date and package versions. Then what `openPgliteStore` does now (the branch Task 4 took, and the statements it issues), and that `cli/test/docs-retrieval-store-upgrade.test.mjs` pins it.
  - **Python backend.** What the 1.5.1 compose server reported for a 1.3.1-built database, and what `open_postgres_store` did to it, citing README item 4 rather than restating its figures.
  - One sentence noting that `vector` also moved on PGlite (0.8.1 to 0.8.7), so the same handling covers it.
- [ ] **`docs/retrieval.md` → `## Still open`, the lexical-arm bullet.**
  - Name the versions the crossover figure was measured on: `@electric-sql/pglite` 0.5.10 with `pg_textsearch` 1.5.1, from `CROSSOVER_ROWS`'s doc comment.
  - If Task 5 moved it, replace **63 rows** with the new figure, and state the 1.3.1 figure once as the previous measurement.
  - Keep the rest of the bullet's argument. The bullet and `CROSSOVER_ROWS` must read the same figure.
- [ ] **`#### The lexical-plan crossover, on 1.5.1`.**
  - The statement that produced the figure: case (b) of `cli/test/docs-retrieval-store.test.mjs`, the bisect on a table with the store's own BM25 index definition, built after the rows, cited and not restated.
  - The setup: package versions and Node versions.
  - The figure, and the Node 20 reading if it differed.
  - Whether 1.5.1 changed it from 63.
  - One sentence noting that the next branch's fix ends refreshes in exactly that statistics-bearing state, so this figure bounds the corpus size below which the store's lexical plan becomes a Seq Scan. That is a fact about the figure, not a proposal.

**Verification:**

- The figure in the `## Still open` bullet, in `#### The lexical-plan crossover, on 1.5.1` and in `CROSSOVER_ROWS` is the same number. Check it with `git grep -n "CROSSOVER_ROWS = " cli/test/docs-retrieval-store.test.mjs` against the two documents.
- Every behaviour statement in the new paragraph carries its source: the test header quote with its date, or the README item 4 citation. No figure appears without the statement and setup that produced it.
- `git diff docs/retrieval.md` touches only the new paragraph and the one bullet. `git diff docs/retrieval-eval-results.md` adds lines only directly after Task 11's part.
