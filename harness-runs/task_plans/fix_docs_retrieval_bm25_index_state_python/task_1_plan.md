### Task 1 — Port the end-state statements, `rebuild_indexes`, the matching-only lexical filter and the width-change delete to `store.py`, with statement parity through the bridge

**Goal:** Give the Python store everything `cli/src/retrieval/store.ts` gained at `3063e12c`: the constants `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS`, `INDEX_STATE_META_KEY`, `INDEX_STATE_PENDING` and `INDEX_STATE_REBUILT`; `DocStore.rebuild_indexes()`; a `lexical_search` that returns only matching chunks on every plan; and the width-change delete over both meta keys. Every new statement is `store.ts`'s, character for character, and the bridge asserts it.

**Where this task stops.** The store gains the method; nothing calls it yet. **Task 3** makes `refresh.py` → `refresh_index` call `rebuild_indexes()` and write the marker. **Task 2** pins the width-change marker removal and the Seq Scan filter against a real Postgres. This task touches no refresh logic and no container test.

**Source:** `cli/src/retrieval/store.ts` at `3063e12c` (`git diff 3e0ed0ce 3063e12c -- cli/src/retrieval/store.ts`).

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/store.py`
- `docs-retrieval-service/tests/fakes.py`
- `docs-retrieval-service/tests/ts_bridge.mjs`
- `docs-retrieval-service/tests/test_store_statements.py`

**Work:**

- [ ] **`store.py` — constants, statements and header.** Add, beside `EMBEDDER_META_KEY` and with one-line comments carrying `store.ts`'s doc-comment wording:
  - `LEXICAL_SEARCH_STATEMENT = f"SELECT id, {BM25_ORDER_CLAUSE} AS score FROM {CHUNKS_TABLE} ORDER BY {BM25_ORDER_CLAUSE} LIMIT $2"`;
  - `END_STATE_STATEMENTS: tuple[str, ...] = (f"REINDEX INDEX {BM25_INDEX}",)` — no vector-index statement;
  - `INDEX_STATE_META_KEY = "index_state"`, `INDEX_STATE_PENDING = "pending"`, `INDEX_STATE_REBUILT = "rebuilt"`.

  In `statements()`: `"lexical_search"` becomes `LEXICAL_SEARCH_STATEMENT`; `"delete_meta"` becomes `"DELETE FROM meta WHERE key = ANY($1::text[])"`; and each `END_STATE_STATEMENTS` entry is carried under its own key `end_state_<n>` (0-based, in order), built from the tuple as the `update_extension_<extname>` keys are built from `EXTENSION_UPDATE_STATEMENTS`. In the module header, change *"the three spliced tokens"* to four, adding *"and the constant index or table name in each `END_STATE_STATEMENTS` entry"*, as `store.ts`'s header reads. Add no entry to `Departures from store.ts:` — none of this is a departure.
- [ ] **`store.py` — protocol and methods.**
  - `DocStore.lexical_search`'s docstring takes `store.ts`'s new wording: only chunks carrying a query term, on every plan; the filter runs over the returned rows rather than as a `WHERE`, so the plan is the one the crossover was measured on; the result can be shorter than `limit`.
  - Add `async def rebuild_indexes(self) -> None` to the protocol, docstring: brings every index to the state a rebuild over the stored rows leaves, by issuing `END_STATE_STATEMENTS` in order, outside any transaction; the refresh decides when to call it.
  - `_PostgresStore.lexical_search` issues `self._sql["lexical_search"]` and ranks only the rows whose second column is not exactly `0` (`row[1] != 0`), dropping them **before** `_ranked` so ranks stay contiguous; replace the old comment with `store.ts`'s.
  - `_PostgresStore.rebuild_indexes` executes `self._sql[f"end_state_{n}"]` for each `n` in order on the autocommit connection, with no `transaction()` block.
  - `open_postgres_store`'s width-change branch executes `sql["delete_meta"]` with `[[EMBEDDER_META_KEY, INDEX_STATE_META_KEY]]`; its docstring says the embedder **and index-state** records are removed, so the recreated table's indexes are not taken to be in the end state.
- [ ] **`fakes.py`.** `InMemoryDocStore` gains `self.rebuilds = 0` in `__init__` and `async def rebuild_indexes(self) -> None` that increments it and changes nothing else; extend the module header's protocol sentence to say a rebuild is counted, not simulated. Its `lexical_search` already returns matching rows only; leave it. `_check_protocol` keeps mypy proving the fake satisfies the whole protocol.
- [ ] **`ts_bridge.mjs`.** Import `LEXICAL_SEARCH_STATEMENT`, `INDEX_STATE_META_KEY`, `INDEX_STATE_PENDING` and `INDEX_STATE_REBUILT` from `../../cli/dist/retrieval/store.js` and add them to `constants()` → `store`. Type none of them: the module's rule is that every value is read off the export.
- [ ] **`test_store_statements.py`.**
  - `test_constants_match_typescript` asserts `LEXICAL_SEARCH_STATEMENT`, `INDEX_STATE_META_KEY`, `INDEX_STATE_PENDING` and `INDEX_STATE_REBUILT` equal the bridge's values, and `list(END_STATE_STATEMENTS) == ts_store["END_STATE_STATEMENTS"]` — the statement-parity assertion of goal 1, in the form the file's existing assertions use.
  - A new case asserts `statements(384)["lexical_search"] == LEXICAL_SEARCH_STATEMENT` and that every `END_STATE_STATEMENTS` entry is among `statements(384).values()`, in order under `end_state_0…`, with no `%s` or `%(`.
  - The width-change delete is not exported by `store.ts`, so, exactly as `test_the_vector_arm_orders_as_store_ts_does` does for `VECTOR_ORDER` and for the same stated reason, a new case asserts `"DELETE FROM meta WHERE key = ANY($1::text[])"` is both `statements(384)["delete_meta"]` and a substring of `cli/src/retrieval/store.ts`'s source. Extend the file header's last-resort sentence to name this second string.

**Verification:**

- `npm run build` exits 0 (the bridge reads `cli/dist`), then `bash scripts/python-service.sh test tests/test_store_statements.py` passes, as one plain foreground command from the repository root. `fakes.py` has no test file of its own; it is exercised by Task 3's file and by gate 13c.
- `git diff --stat -- cli` is empty: no TypeScript file changes.
- `git grep -nF "SELECT id FROM {CHUNKS_TABLE} ORDER BY" -- docs-retrieval-service/src` and `git grep -nF "DELETE FROM meta WHERE key = \$1" -- docs-retrieval-service/src` each have no hit.
- `git grep -n "rebuild_indexes" -- docs-retrieval-service/src/harness_docs_retrieval/refresh.py` has no hit: nothing calls the method until Task 3.
- Python lint and typecheck are not run by this task: they are gates 13a and 13b at the Run gates phase.
