### Task 11 — Serve `search_docs` over stdio MCP, with the tool-listing and refusal parity case (`mcp_server.py`)

**Goal:** Expose Task 10's answer path as the stdio MCP server an agent runner starts. It is named `harness-docs`, it has one tool, `search_docs`, and it is indistinguishable from the TypeScript server in what it advertises and in how it refuses. That is the half of Acceptance 2 that needs no database. The library-level search time goes to stderr, so the comparison branch can read it without a second timing path.

**Depends on:** Task 10 (`wire.py` → `DOCS_SERVER_NAME`, `SEARCH_TOOL_NAME`, `SEARCH_TOOL`; `service.py` → `ServiceConfig`, `load_service_config(*, repo, docs_root, environ)`, `add_service_options(parser)`, `RetrievalSession`, `open_session(config)`, `answer(session, arguments, *, mode="fused-rerank") -> Answer(text, is_error, refused, result, notes, search_ms)`; `tests/fakes.py` → `FakeSession`), Task 2 (`jscompat.py` → `json_stringify_str`, `js_to_fixed`), Task 4 (`tests/ts_bridge.py` → `ts_fixture(files) -> TsFixture(dir, env, cli_entry)`) and Task 1 (`cli.py` → `SubCommand`, `SUB_COMMANDS`; `tests/test_cli.py`).

**Ported from:** `cli/src/retrieval/server.ts` → `serveDocs`: the list-tools handler, the unknown-tool refusal, the serialised call handling, and refusing before any byte reaches stdout.

**Where this task stops.** The HTTP entry point is Task 12's, and it calls the same `answer()`. The end-to-end comparison of a **successful** search against the TypeScript server needs a database, so it is Task 15's. Task 15 starts this sub-command as a real process (`harness-docs-retrieval serve-mcp --repo <dir>`) and lists its tools over the wire, so the command line declared here is a contract with Task 15.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` (new)
- `docs-retrieval-service/src/harness_docs_retrieval/cli.py` — append the `serve-mcp` row to the literal `SUB_COMMANDS`.
- `docs-retrieval-service/tests/test_mcp_parity.py` (new)
- `docs-retrieval-service/tests/test_cli.py` — update the row-set assertion to `["serve-mcp"]`.

**Work:**

- [ ] `build_server(session: RetrievalSession) -> mcp.server.lowlevel.Server`. The server is named `DOCS_SERVER_NAME`, with version `harness_docs_retrieval.__version__`.
  - **List tools:** returns exactly one `mcp.types.Tool`, built from `wire.SEARCH_TOOL` with no field added, renamed or defaulted into the serialised form.
  - **Call tool:** registered with the SDK's input validation **turned off** (`validate_input=False`, or whatever the installed SDK names it). The SDK's own JSON-Schema refusal text differs from `server.ts`'s, and every refusal must come from `parse_arguments`.
    - A name other than `SEARCH_TOOL_NAME` returns `isError` with `f"unknown tool {json_stringify_str(name)}; this server exposes {SEARCH_TOOL_NAME}"`.
    - Otherwise it awaits `answer(session, arguments)` and returns a `CallToolResult` with one `TextContent(type="text", text=answer.text)` and `isError=answer.is_error`.
  - **Timing line:** after every call where `answer.search_ms is not None`, it writes one stderr line, `harness-docs: search_ms=<js_to_fixed(search_ms, 3)>`, from the module-level `TIMING_LINE_PREFIX = "harness-docs: search_ms="`. That is the stdio half of the timing exposure. **Nothing but the transport writes to stdout.**
- [ ] `async serve_mcp(config: ServiceConfig) -> None`. It opens the session through `open_session(config)` **before** the transport starts, so a missing cache, a bad stub value or an unreachable database is a `ServiceError` that `cli.main` prints as one stderr line, exit `1`, with nothing on stdout. Then it serves over `mcp.server.stdio.stdio_server()` until the client closes stdin or the process gets `SIGTERM`, and closes the session in a `finally`.
- [ ] `cli.py` gets the row `SubCommand(name="serve-mcp", summary="Serve search_docs over stdio MCP (the server an agent runner starts)", configure=add_service_options, run=…)`. The `run` callable calls `load_service_config(repo=args.repo, docs_root=args.docs_root, environ=os.environ)` and `asyncio.run(serve_mcp(config))`, and returns `0`. Update `tests/test_cli.py`'s row-set assertion to `["serve-mcp"]`.
- [ ] `test_mcp_parity.py` opens with its rule (*a client must not be able to tell which backend answered it*) and with the reason the Python side runs in memory here: listing and refusals precede any store access, and the database half is Task 15's.
  - **Setup.** Start the TypeScript server through the MCP Python SDK's stdio client (`StdioServerParameters(command="node", args=[fixture.cli_entry, "docs", "serve"], cwd=fixture.dir, env={**os.environ, **fixture.env})`) inside `ts_fixture(files=…)`, using a three-document corpus and `conventions.md`. Connect to `build_server(FakeSession(...))` through the SDK's in-memory client/server pair (`mcp.shared.memory.create_connected_server_and_client_session`, or the installed equivalent).
  - **Listing.** `list_tools()` on both sides, each dumped with `model_dump(mode="json", by_alias=True, exclude_none=True)`, is equal.
  - **Refusals.** `call_tool` with each of these returns equal `content` text and equal `isError`: `{"query": ""}`, `{"query": "   "}`, `{"k": 3}`, `{"query": "x", "k": 0}`, `{"query": "x", "k": 21}`, `{"query": "x", "k": 2.5}`, `{"query": "x", "k": "3"}`, `{"query": "x", "k": True}`, `{"query": "x", "extra": 1}`, and an unknown tool name.
  - **Clean refusal.** `serve-mcp` run as a subprocess with an empty model cache exits `1`, prints one `harness-docs-retrieval: …` stderr line naming the cache, prints nothing on stdout, and shows no `Traceback`.

**Verification:**

- `tests/test_mcp_parity.py` and `tests/test_cli.py` pass (subject to the story index's test-run note). The TypeScript side runs on the workspace's own PGlite and needs no Docker.
- `grep -n "print(" docs-retrieval-service/src/harness_docs_retrieval/mcp_server.py` shows no write to stdout. The only stderr writes are the timing line and warnings.
- `test_mcp_parity.py` builds its expected listing from what the TypeScript server advertises at run time and has no tool definition typed into it.
