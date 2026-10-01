### 1. A failure while preparing the database after connecting escapes as a traceback, not a one-line `ServiceError`

**Files:**
- `docs-retrieval-service/src/harness_docs_retrieval/store.py` (`open_postgres_store`): `except BaseException:`
- `docs-retrieval-service/src/harness_docs_retrieval/errors.py` (module docstring and `ServiceError`)
- `docs-retrieval-service/src/harness_docs_retrieval/self_check.py` (`_one_line`)

**The rule this breaks.** `errors.py` states it in its module docstring: *"an anticipated failure — a refusal, a missing cache, an unreachable database — is raised as `ServiceError` and nothing else, and only `cli.main` turns it into an exit status. Anything that is not a `ServiceError` is a bug and propagates with its traceback."* `cli.py` → `main` catches `ServiceError` alone. The README → `## Standing it up` promises *"An anticipated failure prints one line, `harness-docs-retrieval: <message>`, on stderr and exits `1`."*

**What the code does.** `open_postgres_store` turns a failure to **connect** into a `ServiceError` (`except psycopg.Error as error:` around `psycopg.AsyncConnection.connect`). A failure **after** connecting gets different handling. That covers `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_textsearch;`, `create_meta`, `create_chunks`, `create_hnsw` and `create_bm25`. Each of these runs inside

```python
    except BaseException:
        await conn.close()
        raise
```

which re-raises the raw `psycopg.errors.*` exception. Nothing above it converts that exception. `service.open_session` and the callers in `cli.py` (`_run_serve_mcp`, `_run_serve_http`, `_refresh_once`) do not, and `main` catches `ServiceError` only. So `harness-docs-retrieval index`, `serve-mcp` and `serve-http` each print a full Python traceback and exit `1`.

**Why it is reachable, and why it is anticipated.** The package takes any Postgres by connection string (`HARNESS_DOCS_RETRIEVAL_DATABASE_URL`). The server-side requirements this branch introduces are a design fact the branch records itself, in README → `## The seam, as found` items 1 and 2: both extensions must be installed on the server, and `pg_textsearch` must be in `shared_preload_libraries`. Two cases reach the traceback:
- A connection string naming a stock Postgres fails at `CREATE EXTENSION` (`extension "pg_textsearch" is not available`).
- A server without the preload fails at `CREATE EXTENSION` or at the BM25 `CREATE INDEX`, as `postgres/Dockerfile`'s header record 3 notes ("pg_textsearch refuses to load without the preload", quoted in `compose.yaml`).

Either is the operator's configuration, not a bug in this package. The failure therefore belongs to the class `errors.py` says must be a `ServiceError`. `self-check` hides the problem: `_guarded` catches every `Exception`, so its `index` line reads cleanly. The commands the next branch's launcher will actually start (`serve-mcp`) do not.

**Fix.** Convert a `psycopg.Error` raised while preparing the database into a one-line `ServiceError`. Move the one-line helper to the module that owns the error type, so both callers share one owner.

- [ ] In `errors.py`, add below `ServiceError`:

  ```python
  def one_line(error: BaseException) -> str:
      """`error`'s message on one line: a driver message can span lines (DETAIL, HINT)."""
      parts = [line.strip() for line in str(error).splitlines() if line.strip()]
      return "; ".join(parts) if parts else type(error).__name__
  ```

- [ ] In `self_check.py`, delete `_one_line` and its comment. Add `from harness_docs_retrieval.errors import one_line` and call `one_line(error)` in `_guarded`. Behaviour is unchanged.

- [ ] In `store.py`, import `one_line` beside `ServiceError` (`from harness_docs_retrieval.errors import ServiceError, one_line`). In `open_postgres_store`, replace the trailing handler

  ```python
      except BaseException:
          await conn.close()
          raise
  ```

  with

  ```python
      except psycopg.Error as error:
          await conn.close()
          raise ServiceError(
              f"the Postgres {DATABASE_URL_ENV} names could not hold the docs index: "
              f"{one_line(error)}; it needs the vector and pg_textsearch extensions installed "
              "and pg_textsearch in shared_preload_libraries"
          ) from None
      except BaseException:
          await conn.close()
          raise
  ```

  Keep every line at 100 characters or fewer (`[tool.ruff] line-length`). A server error message carries no connection string, so it needs no scrubbing.

- [ ] In `docs-retrieval-service/tests/test_store_statements.py`, add a no-container case. It replaces `psycopg.AsyncConnection.connect` (via `monkeypatch.setattr`, as the suite's other cases do) with an `async` function returning a fake connection. On its first `execute`, the fake raises `psycopg.errors.FeatureNotSupported('extension "pg_textsearch" is not available\nDETAIL:  Could not open extension control file.')` and records `close()`. Assert three things:
  - `open_postgres_store("postgresql://u@h/d", 384)` raises `ServiceError`;
  - `"\n" not in str(raised.value)`, and the message contains `'extension "pg_textsearch" is not available; DETAIL:  Could not open extension control file.'`;
  - the fake's `close()` was awaited.

  Run it as `unit_loop_core.md` → `## The test-run rule` allows.
