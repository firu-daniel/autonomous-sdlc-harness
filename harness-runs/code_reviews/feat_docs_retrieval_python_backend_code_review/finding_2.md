### 2. `## The seam, as found` omits that the index is now one per database, not one per checkout

**Files:**
- `docs-retrieval-service/README.md` (`## The seam, as found`, item 3) — "**Connection by string, not by directory.**"
- `docs-retrieval-service/src/harness_docs_retrieval/store.py` (module docstring, `Departures from store.ts:`) — "`openPgliteStore` takes a `dataDir` and creates it"

The TypeScript backend's index is scoped to one checkout by construction. `cli/src/retrieval/session.ts` (`openRetrieval`) opens the store at `indexDataDir(repoRoot, config.stateDir)`, which is `<repoRoot>/<stateDir>/docs_index` (`cli/src/retrieval/store.ts` → `indexDataDir`). Every checkout and every worktree therefore has its own index.

The Python store has no such key. `open_postgres_store(database_url, dimensions)` opens the one `chunks` and `meta` table pair in whatever database `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` names. `refresh_index` then deletes every stored key that is missing from *this* repository's corpus (`gone = [key for key in stored if key not in current]`). So if two checkouts point at the same connection string, each refresh deletes the other's chunks and re-embeds its own. An embedder change in one clears both. In this harness that is the normal shape, because an unattended run works in a sibling worktree of the main checkout.

This is a place where the store's contract did not carry over unchanged, which is what deliverable 10 says this section records. The next branch, which wires the backend in for adopters, reads this section to learn what it must solve. Item 3 records only the directory-creation half ("this package creates no directory") and not the scoping consequence.

**Fix:** state the consequence in both places, and change nothing else.

- [ ] In `docs-retrieval-service/README.md`, under `## The seam, as found`, append these sentences to the end of item 3 (the item that opens "**Connection by string, not by directory.**"):

  > The index is therefore scoped to a database, not to a checkout. The TypeScript index lives at `<repoRoot>/<stateDir>/docs_index`, so every checkout and worktree has its own. Here, two checkouts that share one connection string share one `chunks` table, and each refresh deletes the other's chunks as gone from its corpus. Give each checkout its own database. Selecting this backend has to settle how that database is named per checkout.

- [ ] In `docs-retrieval-service/src/harness_docs_retrieval/store.py`, in the module docstring's `Departures from store.ts:` list, replace the bullet

  ```
  - `openPgliteStore` takes a `dataDir` and creates it; here the database is the server's, reached
    by connection string, and this module creates no directory.
  ```

  with

  ```
  - `openPgliteStore` takes a `dataDir` and creates it; here the database is the server's, reached
    by connection string, and this module creates no directory. The index is therefore one per
    database rather than one per checkout: two checkouts sharing a connection string share one
    `chunks` table, and each refresh deletes the other's rows.
  ```

  Keep every line at 100 characters or fewer (`[tool.ruff] line-length`).
