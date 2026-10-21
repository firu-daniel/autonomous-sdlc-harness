### Task 3 — Refresh `package-lock.json` and read the new PGlite engine on Node 22 and Node 20

**Goal:** Bring the workspace-root `package-lock.json` and the installed `node_modules` in line with Task 2's manifest. Then show, on Node 22 and on Node 20, that the new PGlite engine loads both extensions and reports `pg_textsearch` 1.5.1 for both its library and its installed extension. This task is the branch's stop point: **if PGlite's 1.5.1 package cannot be used on Node 22, stop and report** rather than letting one engine move alone.

**Depends on:** Task 2, which set `cli/package.json` to `@electric-sql/pglite` `0.5.10`, `@electric-sql/pglite-pg_textsearch` `^0.0.12` and `@electric-sql/pglite-pgvector` `^0.0.11` in both `peerDependencies` and `devDependencies`.

**Where this task stops.** It changes `package-lock.json` alone. It does not touch the store, a test file or any document. The readings it takes are evidence for its own return, and the later tasks take their own. Task 4 owns the old-index handling, and Task 6 owns the compose engine.

### Targets

- `package-lock.json` (workspace root).

**Work:**

- [ ] **Refresh the lock.** Run `npm install --workspace cli` from the repository root, as one plain foreground command. Then run `npm ci` (`commands.depInstall`) to prove that the lock and both manifests agree from a clean install.
- [ ] **Read what was installed.**
  - `npm ls @electric-sql/pglite @electric-sql/pglite-pg_textsearch @electric-sql/pglite-pgvector` must show exactly one copy of each, at `0.5.10`, `0.0.12` and `0.0.11` (or the trio Task 2 recorded), with no `invalid` and no `UNMET PEER`.
  - `git diff --stat package-lock.json` must touch only those three packages' entries and the workspace's own `cli` entry.
- [ ] **Read the engine on Node 22.** Create `harness-runs/scratch/pglite-engine.mjs`. It opens an in-memory `PGlite.create({ extensions: { vector, pg_textsearch } })`, runs `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_textsearch;`, and prints:
  - `process.version`;
  - `SELECT version()`;
  - `SHOW pg_textsearch.library_version`;
  - `SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_textsearch')`;
  - `SELECT name, default_version FROM pg_available_extensions WHERE name IN ('vector', 'pg_textsearch')`;
  - whether `bm25_spill_index` exists in `pg_proc`.

  It also builds a three-row BM25 index and runs one `<@>` query, to prove that the index works and not only that it loads. Run it with `bash scripts/scratch-run.sh harness-runs/scratch/pglite-engine.mjs`.
- [ ] **Read the engine on Node 20**, with the same probe: `PATH=/opt/homebrew/opt/node@20/bin:$PATH bash scripts/scratch-run.sh harness-runs/scratch/pglite-engine.mjs`. A failure here is recorded, with its exact message, and does not stop the branch.
- [ ] **Decide the stop.** If Node 22's probe fails to create the instance, load either extension, or report `pg_textsearch` `1.5.1` for both `library_version` and `extversion`, stop and report with the exact output, and do not continue the branch. Otherwise record both runs' output in your return. That includes the `vector` reading, which the story index expects to be `0.8.7`.

**Verification:**

- `npm ci` exits zero.
- Node 22's probe prints `pg_textsearch.library_version` `1.5.1`, `extversion` `1.5.1` for `pg_textsearch`, an `extversion` for `vector` equal to its `default_version`, a PostgreSQL 18 `version()` string naming PGlite 0.5.10, and a non-empty `<@>` result.
- Node 20's probe result is recorded as it came, whether a pass or a failure with its message.
- `bash scripts/typecheck.sh` passes against the new packages' types.

- **Deviations from plan:** `npm install --workspace cli` moved the three PGlite entries from `node_modules/@electric-sql/*` to `cli/node_modules/@electric-sql/*` in `package-lock.json`. The diff touches only those three entries and the `cli` workspace entry, as the plan requires, but the packages are no longer hoisted to the root. A root `npm install` and an `npm install --package-lock-only`, each run from the committed lock, both produced the same nested keys, so the lock was kept as npm wrote it. Consequences: `cli/dist`, `cli/test` and `evals/` (through `loadRetrievalModule`) still resolve the packages. A bare `import '@electric-sql/pglite'` from `harness-runs/scratch/` does not, and that includes Task 1's `read-old-docs-index.mjs`. `pglite-engine.mjs` resolves through `createRequire` anchored at `cli/package.json`, and a later task's scratch probe must do the same. The probe also prints a forced-index plan (`SET enable_seqscan = off`): with only three rows the default plan is a Seq Scan, so the forced plan shows `Index Scan using docs_bm25` on both Nodes.
