### Task 5 — The PGlite index store and incremental refresh

**Goal:** Keep the chunks in a per-checkout embedded Postgres (PGlite) with an HNSW vector index and a BM25 lexical index, behind a small `DocStore` interface that a real Postgres could later implement. Refresh it incrementally: re-embed only chunks whose hash changed, drop chunks whose file or heading is gone, and rebuild from scratch when the embedder id changes.

**Depends on:**

- **Task 2**, which exports `loadRetrievalModule<T>(specifier: string): Promise<T>` from `cli/src/retrieval/runtime.ts`. `@electric-sql/pglite`, `@electric-sql/pglite-pgvector` (export `vector`) and `@electric-sql/pglite-pg_textsearch` (export `pg_textsearch`) are loaded only through it.
- **Task 3**, which exports `interface Embedder { readonly id: string; readonly dimensions: number; embedDocuments(texts: readonly string[]): Promise<number[][]>; embedQuery(text: string): Promise<number[]> }` from `cli/src/retrieval/models.ts`.
- **Task 4**, which exports `DocChunk` (`key`, `path`, `anchor`, `heading`, `text`, `body`, `hash`), `chunkMarkdown(path, markdown)` and `corpusFiles(repoRoot, config)` from `cli/src/retrieval/chunk.ts` and `cli/src/retrieval/corpus.ts`.

**Where this task stops.** This task produces the store and `refreshIndex`. The CLI verb that calls them, and the tests, are Task 6's. The query functions below are the interface Task 7's fusion and rerank call.

**Measured while planning** (re-confirmed on PGlite 0.5.8, in memory, 924 ms including startup). `CREATE EXTENSION vector` and `CREATE EXTENSION pg_textsearch` load. `USING hnsw (embedding vector_cosine_ops)` builds. `USING bm25 (body) WITH (text_config='english')` builds. `ORDER BY body <@> to_bm25query($1, '<index name>')` returns **only matching rows**, scored lower-is-better (`-1.8455…` for the match), and a query with no term in the corpus returns `[]`.

### Targets

- `cli/src/retrieval/store.ts` (new).
- `cli/src/retrieval/refresh.ts` (new).
- `cli/src/core/writer.ts` — the header paragraph declaring the per-checkout index as the one in-repository write outside the engine.

**Work:**

- [ ] `store.ts`: export `INDEX_DIR_NAME = 'docs_index'` and `indexDataDir(repoRoot: string, stateDir: string): string`, which is `<repoRoot>/<normalizeRepoDir(stateDir)>/docs_index`. Task 10's ignore rule reads the name from here. Export the interface:

  ```ts
  interface StoredChunk { readonly id: number; readonly key: string; readonly path: string; readonly anchor: string; readonly heading: string; readonly body: string }
  interface DocStore {
    readMeta(key: string): Promise<string | undefined>;
    writeMeta(key: string, value: string): Promise<void>;
    listChunkHashes(): Promise<ReadonlyMap<string, string>>;           // key -> hash
    upsertChunks(chunks: readonly DocChunk[], embeddings: readonly number[][]): Promise<void>;
    deleteChunks(keys: readonly string[]): Promise<void>;
    clear(): Promise<void>;
    lexicalSearch(query: string, limit: number): Promise<readonly { id: number; rank: number }[]>;
    vectorSearch(embedding: readonly number[], limit: number): Promise<readonly { id: number; rank: number }[]>;
    getChunks(ids: readonly number[]): Promise<readonly StoredChunk[]>;
    close(): Promise<void>;
  }
  ```

  `rank` is 1-based within that arm, which is what reciprocal rank fusion needs.
- [ ] `store.ts`: export `openPgliteStore(options: { dataDir: string | undefined; dimensions: number }): Promise<DocStore>`. `undefined` means in memory (Task 13's `doctor` probe). A path creates the directory first, with `mkdirSync(dataDir, { recursive: true })`. The comment on that call does not argue the exception itself: it points at `cli/src/core/writer.ts`'s header paragraph on the per-checkout docs index (the next bullet) and at the story index's `## Corpus staleness` entry that raises the conflict with the writer monopoly for a supervised amendment. Create `meta(key text primary key, value text)` and `chunks(id serial primary key, key text unique, path text, anchor text, heading text, body text, text text, hash text, embedding vector(<dimensions>))`, plus `chunks_hnsw … USING hnsw (embedding vector_cosine_ops)` and `chunks_bm25 … USING bm25 (text) WITH (text_config='english')`. **Every value reaches SQL as a bound parameter** (`$1`, `$2::vector`): a query string comes from an agent and is untrusted. The one exception is the constant index name inside `to_bm25query($1, 'chunks_bm25')`. The header states the rule that SQL here stays plain Postgres plus the two extensions, so a real Postgres could implement `DocStore` by connection string. This branch does not build that.
- [ ] `refresh.ts`: export `refreshIndex(options: { repoRoot: string; config: HarnessConfig; store: DocStore; embedder: Embedder }): Promise<RefreshResult>`, where `interface RefreshResult { readonly files: number; readonly chunks: number; readonly embedded: number; readonly unchanged: number; readonly deleted: number; readonly rebuilt: boolean; readonly warnings: readonly string[] }`. The order is:
  - (1) If `readMeta('embedder')` differs from `embedder.id`, then `clear()`, write the new id, and set `rebuilt: true`. A missing value counts as a difference. Rows removed by that `clear()` are **not** counted in `deleted`, which counts only chunks whose file or heading is gone; Task 6's case (e) asserts this.
  - (2) Chunk every `corpusFiles` path.
  - (3) Delete every stored key not in the new set.
  - (4) Embed, in batches of 32, only chunks whose key is new or whose hash differs, and upsert them.
  - (5) Count everything else as `unchanged`.

  A document whose title changed re-embeds all its chunks, because the title is inside `text`. State that in the doc comment as the expected cost.
- [ ] `writer.ts`: declare the exception **in the same task that introduces the write**. Extend the header's *"One artifact is deliberately outside this engine"* paragraph (today naming only the machine registry, which lives outside the repository) with a second, in-repository out-of-engine write, stated as an exception to the monopoly rather than as a class of artifact: the per-checkout docs-retrieval index under `<stateDir>/docs_index/` (`INDEX_DIR_NAME`), a derived, gitignored, always-rebuildable cache that `cli/src/retrieval/store.ts` → `openPgliteStore` creates and PGlite persists into at query time, never an `init` artifact. Name `store.ts` as the **one** module that makes that write and `<stateDir>/docs_index/` as the **one** path, and say that `.claude/context/conventions.md` → `### Where a new responsibility goes` does not yet record the exception, which is raised for a supervised amendment. Adjust the paragraph's opening count ("One artifact") so it stays true. Task 12 later adds the machine-state runtime and model cache to the same paragraph; it does not touch this clause.
- [ ] Both modules carry the required header comment. For `refresh.ts` the rule is that the Markdown is the source of truth and the index is always rebuildable from it, so nothing here is authoritative.

**Verification:**

- `bash scripts/typecheck.sh` exits zero, and Task 2's source guard stays green (no static value import of any PGlite package).
- `grep -n "\${" cli/src/retrieval/store.ts` finds no template-literal interpolation inside a SQL string except the `vector(<dimensions>)` column type, which comes from a number, never from input.
- `grep -n "docs_index" cli/src/core/writer.ts` finds the header clause naming `cli/src/retrieval/store.ts`, and `grep -rn "INDEX_DIR_NAME\|docs_index" cli/src` reports no module other than `store.ts` and that header creating the directory.
- Behaviour is asserted in Task 6's suite, through `docs index`: the counts after a first build, after a one-section edit, after a deletion and after an embedder switch.
