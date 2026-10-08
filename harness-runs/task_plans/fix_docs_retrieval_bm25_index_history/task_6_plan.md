### Task 6 — Port the rebuild to the Python store and refresh, with its statement-parity assertion

**Goal:** Meet goal 2: make a Python refresh, or a re-index of the same corpus, give the same BM25 scores as a fresh index of that corpus, whatever the database held before. Do it with the rule and the statement Task 4 shipped in TypeScript, carried over character for character, because `store.py` is a port of `cli/src/retrieval/store.ts` whose every statement is `store.ts`'s (`docs-retrieval-service/src/harness_docs_retrieval/store.py` → the module header).

**Depends on:** Task 4, which exports `BM25_REINDEX` (`` `REINDEX INDEX ${BM25_INDEX}` ``) from `cli/src/retrieval/store.ts`, and adds `DocStore.rebuildLexicalIndex()`. `refreshIndex` calls that exactly once, after the last upsert batch, when the refresh cleared the table, deleted any key (`gone` non-empty), or re-embedded a key already in `stored`. It is not called on an insert-only or no-op refresh. This task ports exactly that and adds nothing to it. `RefreshResult` keeps its shape on this side too.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/store.py`: the constant, the statement and the `DocStore` member.
- `docs-retrieval-service/src/harness_docs_retrieval/refresh.py`: the call, under the rule.
- `docs-retrieval-service/tests/fakes.py`: the in-memory store gains the member and records that it was called.
- `docs-retrieval-service/tests/ts_bridge.mjs` and `docs-retrieval-service/tests/test_store_statements.py`: the parity assertion on the new constant.
- `docs-retrieval-service/tests/test_refresh.py`: cases on the fake store for when the rebuild is and is not called.

**Work:**

- [ ] `store.py`: `BM25_REINDEX = f"REINDEX INDEX {BM25_INDEX}"`, also as `statements()["reindex_bm25"]`. Add `rebuild_lexical_index()` to the `DocStore` protocol with the same doc comment Task 4 wrote, and add `_PostgresStore.rebuild_lexical_index`, which executes it. The connection is already `autocommit=True`, so `REINDEX` runs outside a transaction block.
- [ ] `refresh.py`: the same three-condition rule and the single call after the last batch. Mirror `refresh.ts`'s doc-comment step (6) in `refresh_index`'s docstring.
- [ ] `fakes.py`: `InMemoryDocStore.rebuild_lexical_index` counts its calls. `test_refresh.py` gets five cases: a first build, which inserts only, calls it 0 times; a no-op second refresh calls it 0 times; a refresh after a file removal calls it once; a refresh after a body change calls it once; and an embedder change calls it once.
- [ ] `ts_bridge.mjs` → `constants` → `store`: add `BM25_REINDEX` from `cli/dist/retrieval/store.js`. `test_store_statements.py` → `test_constants_match_typescript`: assert `BM25_REINDEX == ts_store["BM25_REINDEX"]`.

**Verification:**

- From the repository root, the package's own non-container tests pass, through the wrapper `scripts/run-gates.sh` gate 13 runs. Read `scripts/python-service.sh`'s usage for the exact sub-command rather than assuming one.
- `test_constants_match_typescript` fails if either side's `REINDEX` statement is edited alone.
- The fake-store cases pin the rule's three conditions and its two exclusions.
- `ruff` and `mypy`, as gate 13 runs them, pass.
