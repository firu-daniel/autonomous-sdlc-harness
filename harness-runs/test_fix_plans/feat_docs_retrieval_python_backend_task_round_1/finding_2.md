### 2. Six Python files are not in `ruff format` form (gate 13a)

**Site:** the package's formatter setting is `docs-retrieval-service/pyproject.toml`, `[tool.ruff]` — "line-length = 100". These are the sites found by inspection:

1. `docs-retrieval-service/tests/test_store_postgres.py`: the three nested `async def scenario(` helpers inside `test_a_lexical_search_ranks_the_one_holder_first`, `test_a_vector_search_ranks_the_own_vector_first` and `test_get_chunks_keeps_the_given_order_and_skips_unknown_ids` (about lines 92, 107 and 122).
2. `docs-retrieval-service/src/harness_docs_retrieval/store.py`: `class _PostgresStore`, `def __init__(` (about line 199).
3. `docs-retrieval-service/tests/test_http_app.py`: `async def _request(` (about line 51).
4. `docs-retrieval-service/tests/test_backend_parity_e2e.py`: `def _tools(`, the `return [` list comprehension (about line 113).
5. `docs-retrieval-service/tests/fakes.py`: the `scored = [` list comprehension in the lexical-search fake (about line 124).

**Failing test:** none — 13a Python lint

**Failure (from the log):**

```
FAIL  13a Python lint (exit 1)
   --> tests/test_store_postgres.py:92:24
    |
91  | ) -> None:
    -     async def scenario(
    -         store: DocStore, chunks: list[DocChunk], vectors: list[list[float]]
    -     ) -> None:
92  +     async def scenario(store: DocStore, chunks: list[DocChunk], vectors: list[list[float]]) -> None:
93  |         lighthouse = await _id_of(store, vectors[1])
    (the same hunk again at 104/105 and 117/118)

6 files would be reformatted, 33 files already formatted
```

**Diagnosis (new this round):** 13a runs `bash scripts/python-service.sh lint`, which runs `ruff check` and then `ruff format --check`. The log shows only the formatter's tail. It says 6 files would be reformatted, but its diff covers only `tests/test_store_postgres.py`, so the log does not list the other five files.

The code was wrapped as if the line limit were 88 columns, but the package sets `line-length = 100`. When a bracketed construct has no magic trailing comma and its joined form fits in 100 columns, `ruff format` puts it on one line.

Inspection found five files where this applies. At each site below, the joined line fits within 100 columns:

- `test_store_postgres.py`: the joined signature is exactly 100 columns, three times. This matches the log's hunks.
- `store.py` `__init__`: 96 columns.
- `test_http_app.py` `_request`: 98 columns.
- `test_backend_parity_e2e.py` `_tools` return: 100 columns.
- `fakes.py` `scored`: 97 columns.

These five match the files most likely in the "6 files" count. The sixth file was not identified. Inspection found no other collapsible construct, no code line over 100 columns, no blank-line drift, no comment-spacing drift and no trailing whitespace.

**Fix:** collapse each site to a single line at its current indentation. The formatter would produce exactly this:

- [ ] `tests/test_store_postgres.py`, all three helpers:
  `    async def scenario(store: DocStore, chunks: list[DocChunk], vectors: list[list[float]]) -> None:`
- [ ] `src/harness_docs_retrieval/store.py`, in `_PostgresStore`:
  `    def __init__(self, conn: psycopg.AsyncConnection[tuple[Any, ...]], dimensions: int) -> None:`
- [ ] `tests/test_http_app.py`:
  `async def _request(session: FakeSession, method: str, path: str, **kwargs: Any) -> httpx.Response:`
- [ ] `tests/test_backend_parity_e2e.py`, in `_tools`:
  `    return [tool.model_dump(mode="json", by_alias=True, exclude_none=True) for tool in listed.tools]`
- [ ] `tests/fakes.py`, in the lexical-search fake:
  `        scored = [(len(wanted & _tokens(row.chunk.text)), row.id) for row in self._rows.values()]`
- [ ] For the unidentified sixth file: if `ruff format` (the formatter, not the lint gate) can be run from `docs-retrieval-service/` in this session, run it over `src` and `tests` and keep only formatting changes. If it cannot be run, apply the five edits above and record in the return that the sixth file could not be located from the log. The next Run gates phase will name it.
- [ ] Do not change `line-length` in `pyproject.toml` to match the old wrapping. The 100-column limit is the package's setting, and the 33 files already in format comply with it.

These are formatting changes only, so behaviour does not change. `bash scripts/typecheck.sh` still applies to the edited files.
