### Task 4 — Make `openPgliteStore` handle an index the old versions built, pinned by a test that opens the fixture

**Goal:** A `docs index` data directory that PGlite 0.5.8 with `pg_textsearch` 1.3.1 and `vector` 0.8.1 built opens under the new packages to a working store. If it cannot be made to work, it is refused with a message that names the remedy. Never leave it half-working. A new test opens Task 1's fixture through `openPgliteStore` and pins the outcome. It runs on Node 22 and on Node 20.

**Depends on:**

- **Task 1** produced `cli/test/fixtures/docs-index-pg-textsearch-1.3.1.mjs`, which exports `OLD_INDEX_FIXTURE` (the archive's absolute path), `OLD_INDEX_DIMENSIONS` (`384`), `OLD_INDEX_PROBE_TERM`, `OLD_INDEX_PROBE_KEY`, `OLD_INDEX_KEYS` (the sorted stored keys) and `oldIndexVector(key)`. Importing them loads no PGlite package. The archive holds a spilled segment, memtable rows and one deleted key. The module header's **What the archive holds** paragraph records the old engine's readings.
- **Task 3** installed `@electric-sql/pglite` 0.5.10, `pglite-pg_textsearch` 0.0.12 (`pg_textsearch` 1.5.1) and `pglite-pgvector` 0.0.11 (`vector` 0.8.7).

**Where this task stops.** It handles the old index on open and nothing else. **No `REINDEX`, no spill and no other end-state change** goes into `cli/src/retrieval/`, because the route 2 fix is the next branch. The handling's statements are exported, and **Task 7** ports them character for character into `docs-retrieval-service/src/harness_docs_retrieval/store.py`. This task does not touch the Python side. The documents (`docs/retrieval.md`) are **Task 12's**, and Task 12 reads this task's test header for the measured behaviour, so the header must carry it.

### Targets

- `cli/src/retrieval/store.ts`: the handling in `openPgliteStore`, its exported statements, and the header and doc comment.
- `cli/test/docs-retrieval-store-upgrade.test.mjs` (new): opens the fixture.

**Work:**

- [ ] **Measure first, with no handling.** Write a scratch probe, `harness-runs/scratch/old-index-open.mjs`. It loads `OLD_INDEX_FIXTURE` into a fresh on-disk data directory under `os.tmpdir()` with `PGlite.create({ dataDir, loadDataDir, extensions })` and closes. Then it opens that directory with the **current, unmodified** `openPgliteStore` from `cli/dist`, and runs:
  - `lexicalSearch(OLD_INDEX_PROBE_TERM, 50)`, `vectorSearch(oldIndexVector(OLD_INDEX_PROBE_KEY), 5)`, `listChunkHashes()`;
  - one `upsertChunks` of a new chunk, and one `deleteChunks`.

  After the store closes, it re-opens the directory raw and reads `SHOW pg_textsearch.library_version`, each extension's `extversion` against `pg_available_extensions.default_version`, and `bm25_summarize_index('chunks_bm25')`. Run it on Node 22 through `bash scripts/scratch-run.sh`. Record exactly what happens: each call's result, or the exact error message. If `loadDataDir` itself refuses the 0.5.8 archive, record the message and stop and report. The fixture route would then not stand, and the maintainer decides.
- [ ] **Choose the handling by this rule, in this order**, and record which branch applied and why:
  1. **`ALTER EXTENSION … UPDATE`.** Issue it once per extension whose installed `extversion` differs from its `default_version`. Take it when, after it, every call in the probe above succeeds, `lexicalSearch` returns `OLD_INDEX_PROBE_KEY` first and never the deleted key, and both `extversion`s equal their `default_version`.
  2. **A rebuild.** Take it if the update succeeds but the old BM25 index then errors or returns rows that disagree with the matching-rows result in (1). The rebuild drops `chunks` and the embedder meta record, the same mechanism the width-mismatch branch of `openPgliteStore` already uses, so the next refresh re-embeds. It is never a `REINDEX`.
  3. **A refusal.** Take it if the directory cannot be opened at all under the new PGlite. It is a `HarnessError` (adopter-fixable, so not `internal()`), naming the index directory and stating that deleting it rebuilds the index on the next `docs index`. Nothing is written first: assert on the bytes on disk, per `.claude/context/cli.md` → `## What "done" means here`.

  The handling is version-agnostic and carries no version literal: it compares `extversion` with `default_version`, so the next bump needs no edit here.
- [ ] **`store.ts`, for the expected branch (1).**
  - Export `STALE_EXTENSIONS_QUERY`, the one `SELECT` that lists the store's extensions whose `pg_extension.extversion` differs from `pg_available_extensions.default_version`.
  - Export `EXTENSION_UPDATE_STATEMENTS`, a frozen record from each of `vector` and `pg_textsearch` to its `ALTER EXTENSION <name> UPDATE` text.
  - In `openPgliteStore`, right after the `CREATE EXTENSION IF NOT EXISTS …` statement and before any `meta` or `chunks` statement, issue the update statement of each extension the query lists, and nothing when it lists none. Issuing nothing for an index that is already current keeps a no-op open from emitting an "already installed" notice on a process whose stdout belongs to the MCP transport.
  - Amend the module header's spliced-token clause: the extension name in each update statement is a third spliced token, taken from that constant record.
  - Extend `openPgliteStore`'s doc comment with one sentence on the old-index handling.

  If branch (2) or (3) applied instead, export that branch's statement or message under a name of your own, and list every new exported name in the doc comment. Task 7 ports exactly the names listed there.
- [ ] **`cli/test/docs-retrieval-store-upgrade.test.mjs`.**
  - **Header.** It opens with the rule it enforces: a data directory the old packages built opens to a working store, or is refused with its remedy, and is never left half-working. It also records, as a measured fact, what the new packages did with that directory **before** the handling. Quote the first bullet's result or exact message verbatim, with the date and the package versions on both sides. Task 12 quotes this paragraph.
  - **Each case** loads the archive into its own data directory under `os.tmpdir()`, removed in process with `t.after`. For branch (1) the cases assert:
    - `openPgliteStore({ dataDir, dimensions: OLD_INDEX_DIMENSIONS })` resolves;
    - `listChunkHashes()` keys equal `OLD_INDEX_KEYS`;
    - `lexicalSearch(OLD_INDEX_PROBE_TERM, ARM_CANDIDATES)`'s first id is the chunk keyed `OLD_INDEX_PROBE_KEY`;
    - `vectorSearch(oldIndexVector(OLD_INDEX_PROBE_KEY), 1)` returns that same chunk;
    - an `upsertChunks` and a `deleteChunks` succeed;
    - after `close`, a raw re-open reads, for both extensions, `extversion` equal to `default_version`, and reads `pg_textsearch.library_version` equal to `pg_textsearch`'s `extversion`. No version literal is asserted.
    - a second `openPgliteStore` over the same directory changes nothing: the same keys, the same `extversion`s.

    Import `ARM_CANDIDATES` and the store from `cli/dist`, as `cli/test/docs-retrieval-store.test.mjs` does. Branch (2) asserts the rebuild's outcome instead: an empty `chunks`, the embedder record gone, and current `extversion`s. Branch (3) asserts the refusal's message and the unchanged bytes.
- [ ] **Run the new file on both Node versions**, each as one plain foreground command from the repository root: `npm test --workspace cli -- test/docs-retrieval-store-upgrade.test.mjs`, then `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm test --workspace cli -- test/docs-retrieval-store-upgrade.test.mjs`. Record each run's `# tests` / `# pass` / `# fail` counts and exit status in your return. A failure that happens only on Node 20 is recorded and does not block.

**Verification:**

- The new test file passes on Node 22, with the counts read from its own summary. The Node 20 result is recorded as it came.
- `git grep -n "REINDEX\|bm25_spill_index" -- cli/src/retrieval` gains no hit from this change.
- `git grep -nE "'1\.5\.1'|'1\.3\.1'|'0\.8\.[0-9]'" -- cli/src cli/test/docs-retrieval-store-upgrade.test.mjs` has no hit: the handling and its assertions carry no version literal.
- `bash scripts/typecheck.sh` passes.
- The test header carries the before-handling behaviour verbatim, with its date and both package sets.

**Branch taken (implementer record, 2026-10-21):** branch (1), `ALTER EXTENSION … UPDATE`. Probe `harness-runs/scratch/old-index-open.mjs` on Node 22.23.2, unmodified `openPgliteStore`: `loadDataDir` accepted the 0.5.8 archive; open resolved; `lexicalSearch` returned 1 row, `OLD_INDEX_PROBE_KEY`, deleted key absent; `vectorSearch` first hit `OLD_INDEX_PROBE_KEY`; `listChunkHashes` 31 keys equal to `OLD_INDEX_KEYS`; `upsertChunks` and `deleteChunks` ok; raw re-open after close: `library_version` `1.5.1`, `pg_textsearch` `extversion` `1.3.1` / `default_version` `1.5.1`, `vector` `0.8.1` / `0.8.7`; summary `total_docs: 33`, `docs_persisted: 24`, memtable `documents: 9`, 1 segment. With the handling, the same probe gave the same call results and both `extversion`s equal to `default_version`. Branch (1)'s conditions all held, so (2) and (3) were not reached.
