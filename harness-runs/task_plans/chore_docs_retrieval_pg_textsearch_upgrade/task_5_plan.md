### Task 5 — Re-take the lexical-plan crossover in the store suite on the new engine

**Goal:** `cli/test/docs-retrieval-store.test.mjs` case (b) bisects the row count at which a stats-informed planner starts taking the BM25 index scan. Re-take it on PGlite 0.5.10 with `pg_textsearch` 1.5.1, on Node 22 and on Node 20. Make the file name the versions its figure was measured on. **If the figure moved from 63**, set the new figure in the same edit.

**Depends on:** Task 3, which installed the new packages. (Task 4 also edits a store test, but a different file, `cli/test/docs-retrieval-store-upgrade.test.mjs`, and this task does not touch it.)

**Where this task stops.** It edits this one test file. **`docs/retrieval.md` → `## Still open`, the bullet *Whether the lexical arm filters to matching chunks on every index.*, is Task 12's**, together with the results line. Task 12 reads the figure and its versions from this file's `CROSSOVER_ROWS` doc comment, so that comment must carry them. This task changes no case's logic, no bisect bound and no synthetic corpus: `VOCAB`, the filler and `DIMENSIONS` stay as they are, because changing any of them moves the figure for a reason other than the engine.

### Targets

- `cli/test/docs-retrieval-store.test.mjs`

**Work:**

- [ ] **Run the file on both Node versions first**, each as one plain foreground command from the repository root: `npm test --workspace cli -- test/docs-retrieval-store.test.mjs`, then `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm test --workspace cli -- test/docs-retrieval-store.test.mjs`. From each run, read the printed `lexical-arm index-scan crossover: <n> rows` line, the counts and the exit status. Read cases (a) and (b) separately: case (a) asserts that the matching chunk comes back alone at 40, 166 and 1024 rows, and a failure there is a different finding from a moved crossover.
- [ ] **`CROSSOVER_ROWS`'s doc comment** gains one sentence naming what the figure was measured on: `@electric-sql/pglite` 0.5.10, `@electric-sql/pglite-pg_textsearch` 0.0.12 (`pg_textsearch` 1.5.1), the date, and the Node versions that printed it. It keeps the sentence that the figure is a property of the corpus's row width. If the Node 22 figure is not `63`, the comment also records the previous figure, `63` on PGlite 0.5.8 with `pg_textsearch` 1.3.1.
- [ ] **If the Node 22 figure is not `63`**, set `CROSSOVER_ROWS` to the Node 22 figure. `CROSSOVER_BAND` stays `8` unless the two Node versions' figures differ from each other by more than it. If they do, record both figures and do not widen the band to cover the gap: that is a finding for the maintainer, not a tolerance. If Node 20 alone fails case (b), record that and leave the constant at the Node 22 figure.
- [ ] **Re-run the file on both Node versions** after the edit, the same two commands. Record both runs' counts and the printed figure in your return, so Task 12 has them.

**Verification:**

- After the edit the file passes on Node 22, and its printed figure equals `CROSSOVER_ROWS`. The Node 20 result is recorded as it came.
- `git diff cli/test/docs-retrieval-store.test.mjs` touches only the `CROSSOVER_ROWS` doc comment and, where the figure moved, that constant's value.
- `CROSSOVER_ROWS`'s doc comment names the PGlite and `pg_textsearch` versions and the date of the figure it carries.
