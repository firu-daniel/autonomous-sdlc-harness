### 2. Tool-result failure text carries the whole multi-line driver message where `server.ts` carries only `error.message`

**Severity:** Should Fix. **Layer:** general (`docs-retrieval-service/` sits under the catch-all `path: "."`).

**Files (site anchors, grep-verified in the current tree):**
- `docs-retrieval-service/src/harness_docs_retrieval/service.py` (`answer`) — "refreshing the docs index failed: {error}; " and "return _failure(f\"{SEARCH_TOOL_NAME}: the search failed: {error}\")"
- `docs-retrieval-service/src/harness_docs_retrieval/store.py` (module level, beside `open_postgres_store`) — "async def open_postgres_store(database_url: str, dimensions: int) -> DocStore:" — the new function goes here.
- `docs-retrieval-service/src/harness_docs_retrieval/errors.py` (`one_line`) — "a driver message can span lines (DETAIL, HINT)" — existing evidence; not changed.
- `docs-retrieval-service/tests/test_service.py` — the unit's own edited test file.

## Problem

`cli/src/retrieval/server.ts` (`answer`, with `messageOf`) builds both failure texts from `error.message`. For a PGlite database error that is the server's primary message alone, on one line — e.g. `relation "chunks" does not exist`.

`service.py` → `answer` interpolates `str(error)`. For a `psycopg.Error` that is libpq's full message, which can span lines: a `LINE 1: …` pointer with a caret line, `DETAIL:` and `HINT:` lines, or the `\n\tThis probably means the server terminated abnormally` tail of a lost connection. The package already knows this — `errors.py` → `one_line` says so, and `store.py` → `open_postgres_store` uses it — but `answer` does not. A store failure therefore reaches the client as a multi-line tool error, with the remedy clause (`; run …`) stranded after the extra lines, where the TypeScript server's equivalent is one line of the shape `<prefix>: <primary message>; <remedy>`.

## Fix

- [x] In `store.py` (the module that owns the driver), add `driver_message(error: BaseException) -> str`. For a `psycopg.Error` whose `error.diag.message_primary` is a non-empty string, return it (matching PGlite's `error.message`). Otherwise return the first non-blank line of `str(error)`, stripped; if there is none, return `type(error).__name__`.
- [x] In `service.py` → `answer`, import `driver_message` from `harness_docs_retrieval.store` and interpolate `driver_message(error)` in both failure texts in place of `{error}`. The prefixes (`{SEARCH_TOOL_NAME}: refreshing the docs index failed: ` and `{SEARCH_TOOL_NAME}: the search failed: `) and the remedy clause stay as they are (finding 4 handles the remedy separately with a comment only).
- [x] Add cases to `tests/test_service.py`: (a) a `FakeSession` whose refresh raises an exception whose `str` spans lines (e.g. `RuntimeError("boom\nDETAIL: x\nHINT: y")`) yields a failure `text` with no newline, carrying `boom`; (b) a `psycopg.Error` subclass instance whose `diag.message_primary` is set (stub `diag` with a simple object if constructing a real diagnostic is impractical) yields exactly that primary message in the text.
