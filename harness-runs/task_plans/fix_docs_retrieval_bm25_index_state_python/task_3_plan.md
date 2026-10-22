### Task 3 — End every Python refresh that wrote, and every index not marked rebuilt, with `rebuild_indexes()` in `refresh.py`

**Goal:** State the TypeScript end-state rule once in the Python refresh module: `refresh_index` gains `refresh.ts` → `refreshIndex` step (6) line for line, so both backends issue the same end-state statements for the same refresh outcome, a database the shipped code left is rebuilt by its next refresh, and an unchanged refresh over a rebuilt index issues nothing. `RefreshResult` keeps its shape.

**Depends on:** Task 1, which adds to `harness_docs_retrieval.store`: `INDEX_STATE_META_KEY = "index_state"`, `INDEX_STATE_PENDING = "pending"`, `INDEX_STATE_REBUILT = "rebuilt"`, `async DocStore.rebuild_indexes() -> None`, and on the test fake `InMemoryDocStore.rebuilds: int`, incremented by each `rebuild_indexes()` call. Task 1 also ships the matching-only lexical filter, so the end state this task turns on never puts a small corpus on a Seq Scan that returns score-`0` rows.

**Where this task stops.** The store's statements are Task 1's. The real-Postgres proof that the end state equals a fresh build's is **Task 4's** container test, which reads this module and does not restate the rule.

**Source:** `cli/src/retrieval/refresh.ts` at `3063e12c` (`git diff 3e0ed0ce 3063e12c -- cli/src/retrieval/refresh.ts`).

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/refresh.py`
- `docs-retrieval-service/tests/test_refresh.py`

**Work:**

- [ ] **`refresh.py` — the rule**, in `refresh_index`, in `refresh.ts`'s order:
  - first, `index_state = await store.read_meta(INDEX_STATE_META_KEY)`, and a local `before_write()` coroutine that, the first time only, sets `wrote = True` and writes `INDEX_STATE_PENDING`;
  - `await before_write()` before the embedder-change `clear()`; `if gone:` guarding both `before_write()` and `delete_chunks(gone)`; `await before_write()` after each batch's `embed_documents` returns and before its `upsert_chunks`;
  - after the batches, `if wrote or index_state != INDEX_STATE_REBUILT:` → `await store.rebuild_indexes()` then `await store.write_meta(INDEX_STATE_META_KEY, INDEX_STATE_REBUILT)`.

  `RefreshResult`'s fields, order and the meaning of `rebuilt` (a stored embedder id differed) do not change, and no field is added.
- [ ] **`refresh.py` — header and docstring.** Add to the header's rule sentence `refresh.ts`'s: the index's ranking state is derived from the stored rows alone, not from the history of writes that produced them; every refresh that wrote, and every index not marked rebuilt, ends with `rebuild_indexes()`. Add step (6) to `refresh_index`'s docstring in `refresh.ts`'s words, including that `pending` is recorded before the first write so a refresh interrupted after one leaves an index the next refresh rebuilds.
- [ ] **`test_refresh.py` — the rule's branches**, on `InMemoryDocStore` with the existing `_RecordingEmbedder`, reading `store.rebuilds` and `store.meta`:
  - a first build rebuilds once and leaves `index_state` = `rebuilt`;
  - a second, unchanged refresh over that store rebuilds **zero** times;
  - an unchanged refresh over a store whose `index_state` is `pending`, and one over a store with no `index_state` key (the database the shipped code left), each rebuild once and leave `rebuilt`;
  - an edit, a deletion and an embedder change each rebuild once;
  - a refresh whose `upsert_chunks` raises (a small subclass of the fake) leaves `index_state` = `pending` and has not rebuilt — the interrupted refresh.

  Import every constant from `harness_docs_retrieval.store`. Leave the existing cases' `RefreshResult` equality assertions exactly as they are: they are the evidence goal 2 holds. Add one sentence to the file header saying the end-state rule is asserted here on the fake, by call count, and on a real Postgres in `tests/test_refresh_end_state_postgres.py`.

**Verification:**

- `bash scripts/python-service.sh test tests/test_refresh.py` passes, as one plain foreground command from the repository root.
- Read `refresh.py` against `refresh.ts` lines `const indexState = …` through `await store.writeMeta(INDEX_STATE_META_KEY, INDEX_STATE_REBUILT)`: every branch and every write point is in the same place, and nothing else differs but snake_case.
- `git diff -- docs-retrieval-service/src/harness_docs_retrieval/refresh.py` shows no change to the `RefreshResult` dataclass.
- Python lint and typecheck are not run by this task: they are gates 13a and 13b at the Run gates phase.
