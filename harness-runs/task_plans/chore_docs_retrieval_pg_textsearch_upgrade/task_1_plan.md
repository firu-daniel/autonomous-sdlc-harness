### Task 1 — Build the old-store fixture under the installed `pg_textsearch` 1.3.1 packages

**Goal:** Commit a PGlite data-directory archive of a docs-index store that the **old** packages built: `@electric-sql/pglite` 0.5.8, `@electric-sql/pglite-pg_textsearch` 0.0.10 (`pg_textsearch` 1.3.1) and `@electric-sql/pglite-pgvector` 0.0.9 (`vector` 0.8.1). Commit beside it the module that built it and that names its contents. Task 4's test opens this archive with the new packages. This task must land **before** Task 2's bump, while the old packages are still the installed ones.

**Where this task stops.** It builds and describes the fixture and nothing else. It changes no file under `cli/src/` and adds no test case. The new packages, the old-index handling and the test that opens the fixture belong to Tasks 2, 3 and 4. The story index's `## Context` (the bullet **Why the old store is a committed fixture**) records why the old store is an archive rather than something a test builds.

### Targets

- `cli/test/fixtures/docs-index-pg-textsearch-1.3.1.mjs` (new): the builder and the fixture's named contents.
- `cli/test/fixtures/docs-index-pg-textsearch-1.3.1.tar.gz` (new): the `dumpDataDir('gzip')` archive.

**Work:**

- [ ] **Confirm the old packages are installed before building.** Read `node_modules/@electric-sql/pglite/package.json`, `node_modules/@electric-sql/pglite-pg_textsearch/package.json` and `node_modules/@electric-sql/pglite-pgvector/package.json`. They must read `0.5.8`, `0.0.10` and `0.0.9`. If any one of them already reads a newer version, stop and report: the fixture would not be a 1.3.1 store. Run `npm run build` so that `cli/dist/retrieval/store.js` is the current store code.
- [ ] **The module, `docs-index-pg-textsearch-1.3.1.mjs`.** It opens with a header in the shape of a `cli/test/` file header. The header states what the archive is, which three package versions built it, and why it is committed rather than built at test time (the npm alias refusal the story index quotes). It also states that regenerating the archive needs those old packages installed. The module exports exactly these names, with this contract, for Task 4 to import:
  - `OLD_INDEX_FIXTURE`: the archive's absolute path, resolved from `import.meta.url`.
  - `OLD_INDEX_DIMENSIONS`: `384`.
  - `OLD_INDEX_PROBE_TERM`: a term that exactly one surviving chunk carries.
  - `OLD_INDEX_PROBE_KEY`: that chunk's `key`.
  - `OLD_INDEX_KEYS`: the sorted keys the store holds after the build.
  - `oldIndexVector(key)`: a deterministic 384-wide vector, the same function the build used.
  - `buildOldDocsIndex(outPath)`: the builder.

  The chunks are synthetic `DocChunk`-shaped objects (`key`, `path`, `anchor`, `heading`, `text`, `body`, `hash` = sha256 hex of `text`), in the manner of `cli/test/docs-retrieval-store.test.mjs` → `chunkAt`. The builder alone reaches the PGlite packages and `../../dist/retrieval/store.js`, through dynamic `import()`. Importing the constants therefore loads nothing, and works under the new packages.
- [ ] **The build sequence, in `buildOldDocsIndex`**, on a data directory under `os.tmpdir()` that is removed in process (`rmSync`) on every exit path. The point is that the index carries a segment, memtable rows and a dead row, which are the on-disk shapes an extension upgrade can break:
  1. `openPgliteStore({ dataDir, dimensions: 384 })`, `upsertChunks` of the first batch, then `close`.
  2. Open PGlite on the same directory with `{ extensions: { vector, pg_textsearch } }`, run `SELECT bm25_spill_index('chunks_bm25')`, then close.
  3. `openPgliteStore` again, `upsertChunks` of the second batch, `deleteChunks` of one first-batch key, then `close`.
  4. Open PGlite again, write `dumpDataDir('gzip')` to `outPath`, then close.

  Every write except the spill goes through the store's own methods, so the archive holds exactly the store's schema.
- [ ] **Build the archive** through a scratch launcher, never a bare `node` command. Create `harness-runs/scratch/build-old-docs-index.mjs`, which imports `buildOldDocsIndex` from `../../cli/test/fixtures/docs-index-pg-textsearch-1.3.1.mjs` and calls it with the archive's path. Then run `bash scripts/scratch-run.sh harness-runs/scratch/build-old-docs-index.mjs`.
- [ ] **Read the archive back under the same old packages** with a second scratch probe. It loads the archive into an in-memory `PGlite.create({ loadDataDir, extensions })` and reads:
  - `SELECT version()`;
  - `SHOW pg_textsearch.library_version`;
  - `SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_textsearch')`;
  - `SELECT bm25_summarize_index('chunks_bm25')`, for the segment count, the memtable documents and `total_docs`;
  - `SELECT count(*) FROM chunks`.

  Record those readings, the archive's size in bytes and the date in the module header, under a **What the archive holds** paragraph. Task 4 reads them there.

**Verification:**

- The read-back reads `pg_textsearch` `1.3.1` for both `library_version` and `extversion`, and `vector` `0.8.1`. `bm25_summarize_index` reports at least one segment **and** at least one memtable document. The `chunks` count equals the length of `OLD_INDEX_KEYS`.
- A lexical query on `OLD_INDEX_PROBE_TERM`, run in the read-back probe with the store's own statement shape (`ORDER BY text <@> to_bm25query($1, 'chunks_bm25') LIMIT $2`), returns `OLD_INDEX_PROBE_KEY` first. It returns no row whose key is the deleted one.
- `git status --short cli/test/fixtures` lists both new files as untracked, and neither is ignored.
- The archive is gzip, and gate 6a greps for the running user's home path. Run `grep -c "$HOME" cli/test/fixtures/docs-index-pg-textsearch-1.3.1.mjs`, which must read `0`. No path from the build machine may appear in the header.

- **Deviations from plan:** The module exports one name beyond the plan's list: `OLD_INDEX_DELETED_KEY`, the first-batch key deleted after the spill (`synthetic/doc-011.md#section`). The deleted chunk carries `OLD_INDEX_PROBE_TERM` as well, so a lexical query that returns it is reading a dead row. Task 4 needs the key by name to assert the plan's "returns no row whose key is the deleted one" check. Whole-tree `bash scripts/typecheck.sh` was run and passed. No test file was created or edited, and no `<test_cmd>` was run.
