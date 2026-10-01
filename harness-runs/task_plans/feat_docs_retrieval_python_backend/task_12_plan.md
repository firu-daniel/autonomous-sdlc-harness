### Task 12 — Serve the async FastAPI app: `POST /search` and `GET /health` (`http_app.py`)

**Goal:** Make the service inspectable over HTTP: one `POST /search` endpoint over the **same** answer path the MCP tool uses, plus a health endpoint. The response carries the library-level search time, so the comparison branch can report it separately from the round trip. The stdio server is what an agent runner starts. This app is for a human or a later caller to look through.

**Depends on:** Task 11, which adds the `serve-mcp` row to `cli.py` and sets `tests/test_cli.py`'s row-set assertion to `["serve-mcp"]`, both of which this task extends. Also Task 10 (`service.py` → `ServiceConfig`, `load_service_config(*, repo, docs_root, environ)`, `add_service_options(parser)`, `RetrievalSession` with `embedder`, `reranker`, `lock` and `async probe() -> None` (which takes `lock` itself and raises when the store is unreachable), `open_session(config)`, `answer(session, arguments, *, mode) -> Answer(text, is_error, refused, result, notes, search_ms)`; `tests/fakes.py` → `FakeSession`), Task 8 (`search.py` → `SEARCH_MODES`, `SearchMode`, `SearchResult`, `SearchHit`) and Task 1 (`cli.py` → `SubCommand`, `SUB_COMMANDS`; `tests/test_cli.py`; `httpx` in the dev group).

**Where this task stops.** The app holds no search logic and no argument validation of its own beyond `mode`. Every query goes through `answer()`, so the HTTP path and the MCP path cannot drift. The health check goes through `session.probe()`: this app never touches `session.store`, never calls a `DocStore` method and never names a store meta key, because the store's meta layout is `store.py`'s (Task 7) and is read only through `service.py` (Task 10). The container that runs this app is Task 14's: its compose file starts `harness-docs-retrieval serve-http --host 0.0.0.0 --port 8080`, so the flags declared here are a contract with Task 14.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/http_app.py` (new)
- `docs-retrieval-service/src/harness_docs_retrieval/cli.py` — append the `serve-http` row.
- `docs-retrieval-service/tests/test_http_app.py` (new)
- `docs-retrieval-service/tests/test_cli.py` — update the row-set assertion to `["serve-mcp", "serve-http"]`.

**Work:**

- [ ] `create_app(session: RetrievalSession) -> fastapi.FastAPI`. It is async throughout, and its lifespan closes the session at shutdown. **`POST /search`:**
  - The body is read raw with `await request.json()`. A body that is not valid JSON returns 400 `{"error": …}`.
  - When the body is an object carrying `mode`, `mode` is removed from a copy. It must be one of `SEARCH_MODES`, or the endpoint returns 400 `{"error": "search: \"mode\" must be one of lexical, vector, fused, fused-rerank"}`, composed from `SEARCH_MODES`. The default is `"fused-rerank"`. The rest, or the body itself when it is not an object, goes to `answer(session, rest, mode=mode)` unchanged, so every other refusal text is `parse_arguments`'s.
  - `answer.refused` returns 400 `{"error": answer.text}`. Any other `is_error` returns 500 `{"error": answer.text}`.
  - Success returns 200 `{"text": answer.text, "mode": mode, "abstained": result.abstained, "best_rerank_score": result.best_rerank_score, "hits": [{"ref", "path", "anchor", "heading", "snippet", "score"}…], "notes": [...], "search_ms": answer.search_ms}`. `text` is byte-identical to what the MCP tool returns for the same query.
- [ ] **`GET /health`:** it calls `await session.probe()`, which serialises on `session.lock` itself, so the endpoint does **not** take `session.lock` (the lock is not re-entrant). Success returns 200 `{"status": "ok", "embedder": session.embedder.id, "reranker": session.reranker.id}`, and any exception returns 503 `{"status": "unavailable", "error": str(exc)}`. It never echoes the connection string.
- [ ] `cli.py` gets the row `SubCommand(name="serve-http", summary="Serve POST /search and GET /health over HTTP", configure=…, run=…)`. `configure` calls `add_service_options` and adds `--host` (default `127.0.0.1`, local-only by default) and `--port` (default `8080`). `run` loads the config, opens the session through `open_session`, so a refusal is a clean one-line `ServiceError` before any socket opens, then serves `create_app(session)` through `uvicorn.Server(uvicorn.Config(...)).serve()` inside one `asyncio.run`, and returns `0`. Update `tests/test_cli.py`'s row-set assertion to `["serve-mcp", "serve-http"]`.
- [ ] `test_http_app.py` opens with its rule (*one search module, two entry points*) and drives `create_app(FakeSession(...))` through `httpx.AsyncClient(transport=httpx.ASGITransport(app=…))`. It asserts:
  - a successful search returns every field above, and its `text` equals `(await answer(same_session, {"query": q})).text`;
  - `mode: "lexical"` reaches `search_docs` as `lexical`, observed through `InMemoryDocStore`'s scripted arms;
  - an unknown `mode` gets 400 with the composed text;
  - `{"query": ""}`, `{"query": "x", "k": 0}` and `{"query": "x", "other": 1}` get 400 carrying `parse_arguments`' exact texts;
  - a non-object JSON body gets 400 with the object refusal;
  - a refresh failure gets 500;
  - `GET /health` gets 200 with both ids, and 503 when `session.probe()` raises (the store's `read_meta` monkeypatched to raise);
  - `search_ms` is a non-negative `float` on success. No duration value is asserted.

**Verification:**

- `tests/test_http_app.py` and `tests/test_cli.py` pass (subject to the story index's test-run note).
- `grep -n "search_docs(\|render_results(" docs-retrieval-service/src/harness_docs_retrieval/http_app.py` finds nothing. The app reaches search only through `answer()`.
- `grep -n "read_meta\|session\.store\|META_KEY\|\"dimensions\"" docs-retrieval-service/src/harness_docs_retrieval/http_app.py` finds nothing. The health check reaches the store only through `session.probe()`.

**Deviations from plan:**

- `run`'s open-then-serve body lives in `http_app.serve_http(config, *, host, port)`, mirroring `mcp_server.serve_mcp`; `cli.py`'s `run` loads the config and calls it inside one `asyncio.run`, so the behaviour is the plan's.
- The invalid-JSON 400 text, unspecified by the plan, is `search: the request body is not valid JSON` (`http_app.BODY_REFUSAL`). A `mode` that is not a string is refused with the same composed text as an unknown one.
- `tests/test_cli.py` gains one case beyond the row-set assertion: `serve-http`'s `--host` / `--port` defaults (`127.0.0.1` / `8080`) and overrides, the flags Task 14's compose file passes.
- Evidence downgrade, per the story index's test-run note: `tests/test_http_app.py` and `tests/test_cli.py` were not run, and Python lint and type-check were not run — no conventions document states a single-file Python test command. Both verification greps were executed and found nothing. Deferred to the Run gates phase.
