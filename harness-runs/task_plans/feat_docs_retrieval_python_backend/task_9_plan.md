### Task 9 — Port the incremental index refresh (`refresh.py`)

**Goal:** Port `cli/src/retrieval/refresh.ts`, so the Python index is brought in line with the corpus the same way: incrementally, by key and hash, rebuilding on an embedder change, with the Markdown as the source of truth.

**Depends on:** Task 2 (`corpus.py` → `corpus_files(repo_root: str, config: Mapping[str, Any]) -> CorpusFiles`, `read_corpus_file(repo_root: str, path: str) -> str`), Task 3 (`chunk.py` → `chunk_markdown(path, markdown) -> list[DocChunk]`), Task 5 (`models.py` → `Embedder`), Task 6 (`stubs.py` → the `hash-v1` stub embedder, for the test), Task 7 (`store.py` → `DocStore`, `EMBEDDER_META_KEY`) and Task 8 (`tests/fakes.py` → `InMemoryDocStore`).

**Ported from:** `cli/src/retrieval/refresh.ts` (`RefreshResult`, `EMBED_BATCH_SIZE`, `refreshIndex`). Its rule carries over: **the Markdown is the source of truth and the index is always rebuildable from it, so nothing stored is authoritative.** A refresh never keeps a chunk the corpus no longer has, and an embedder change discards every stored vector rather than mixing two models' vectors in one index.

**Where this task stops.** `refresh_index` is consumed by Task 10's `RetrievalSession.refresh()`, which every `search_docs` call runs first, as the TypeScript server does, and by Task 13's `index` sub-command through that same session. The warnings it returns become the tool's `note: ` lines in Task 10. This task only passes them through, verbatim from `corpus_files`.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/refresh.py` (new)
- `docs-retrieval-service/tests/test_refresh.py` (new)

**Work:**

- [ ] `refresh.py` declares `@dataclass(frozen=True) class RefreshResult(files: int, chunks: int, embedded: int, unchanged: int, deleted: int, rebuilt: bool, warnings: tuple[str, ...])`, `EMBED_BATCH_SIZE = 32`, and `async refresh_index(*, repo_root: str, config: Mapping[str, Any], store: DocStore, embedder: Embedder) -> RefreshResult`. The steps follow `refreshIndex` in order:
  1. When the stored `EMBEDDER_META_KEY` differs from `embedder.id`, `clear()` then `write_meta(EMBEDDER_META_KEY, embedder.id)`, and `rebuilt` is true only when an id was stored before.
  2. Chunk every corpus file through `read_corpus_file`.
  3. Delete every stored key that is no longer present.
  4. Embed the chunks whose key is new or whose hash moved with `embed_documents`, in batches of 32, upserting each batch.
  5. Count the rest as unchanged.
- [ ] `test_refresh.py` opens with the rule. It builds a throwaway corpus under `tmp_path` with a `config` mapping in `harness.config.json`'s own keys, and uses `InMemoryDocStore` with the `hash-v1` stub wrapped to record each `embed_documents` batch size. It asserts:
  - a first build embeds everything, with `rebuilt=False`;
  - a second run embeds nothing;
  - editing one section re-embeds exactly that chunk;
  - changing a document's `# ` title re-embeds every chunk of that document, the expected cost the TypeScript header records;
  - deleting a file counts its chunks as `deleted`;
  - a store holding another embedder id is cleared, rebuilds everything and reports `rebuilt=True`;
  - 70 changed chunks are embedded in batches of `32, 32, 6`;
  - a missing conventions document's warning is passed through verbatim.

**Verification:**

- `tests/test_refresh.py` passes (subject to the story index's test-run note).
- `refresh.py` reads files only through `read_corpus_file`. `grep -n "open(" docs-retrieval-service/src/harness_docs_retrieval/refresh.py` finds nothing.

**Deviations from plan:**

- `tests/test_refresh.py passes` is deferred to the Run gates phase: no conventions document states a single-file Python test command (the story index's test-run note), so the file was not executed. Python lint (`ruff`) and type-check (`mypy`) were not run either, for the same reason; the 100-column limit was checked by `grep -nE '^.{101,}$'` over both targets, which finds nothing. The claim rests on reading, not execution.
- The 70-chunk batch case adds a 70-section document to an already-built corpus, so the 70 chunks are "changed" (new keys) on the second refresh rather than on a first build.
