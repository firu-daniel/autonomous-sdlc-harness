### Task 10 — Add the wire constants, the service config, the session and the one shared answer path (`wire.py`, `service.py`)

**Goal:** Build the one search path both entry points share. The MCP stdio server (Task 11) and the HTTP app (Task 12) are two entry points over this module, not two implementations. Concretely: the wire's names and the tool definition; the service's own config; opening a session behind the same refusals `cli/src/retrieval/session.ts` puts first; and `answer()`, which validates arguments, refreshes, times the library-level `search_docs` call and renders, all byte-compatible with `cli/src/retrieval/server.ts`.

**Depends on:** Task 2 (`jscompat.py` → `js_trim`, `json_stringify_str`, `js_object_keys`; `corpus.py`), Task 4 (`tests/ts_bridge.py` → `run_bridge("constants")["server"]` with `DOCS_SERVER_NAME, SEARCH_TOOL_NAME, SEARCH_TOOL_PERMISSION`), Task 5 (`models.py` → `model_cache_dir()`, `model_files_present(cache_dir) -> ModelFiles(present, missing)`; `tests/model_cache.py` → `plant_model_files(cache_dir)`), Task 6 (`stubs.py` → `resolve_models(allow_remote: bool)`), Task 7 (`store.py` → `open_postgres_store(database_url: str, dimensions: int) -> DocStore`, `DocStore.read_meta(key)`, `DIMENSIONS_META_KEY`, `DATABASE_URL_ENV`), Task 8 (`search.py` → `search_docs(...)`, `render_results(result)`, `SearchMode`, `SearchResult`, `DEFAULT_RESULTS`, `MAX_RESULTS`, `ABSTAIN_MESSAGE`; `tests/fakes.py` → `InMemoryDocStore`) and Task 9 (`refresh.py` → `refresh_index(...)`, `RefreshResult`).

**Ported from:** `cli/src/retrieval/server.ts` (`DOCS_SERVER_NAME`, `SEARCH_TOOL_NAME`, `SEARCH_TOOL_PERMISSION`, `COVERAGE_NOTE_PREFIX`, `SEARCH_TOOL`, `parseArguments`, `answer`, `messageOf`) and `cli/src/retrieval/session.ts` (`openRetrieval`'s refusal order). The wire rule is `server.ts`'s: **the server's name, its tool's name and the permission string built from them are a wire.** This package defines them once, in `wire.py`, and edits **no** file that quotes them: not `plugin/agents/`, not `cli/templates/`.

**Where this task stops.** MCP framing, the `CallToolResult` envelope, the stdio transport and the stdio timing line are Task 11's. HTTP framing and the `search_ms` response field are Task 12's. This task returns an `Answer` both of them read. The query log (`cli/src/retrieval/queryLog.ts`) is **not** ported, and Task 17's README says so. `answer()` writes no log record and reads no query-log variable.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/wire.py` (new)
- `docs-retrieval-service/src/harness_docs_retrieval/service.py` (new)
- `docs-retrieval-service/tests/fakes.py` — add `FakeSession` beside Task 8's `InMemoryDocStore`, changing nothing of Task 8's.
- `docs-retrieval-service/tests/test_service.py` (new)

**Work:**

- [ ] `wire.py` declares `DOCS_SERVER_NAME = "harness-docs"`, `SEARCH_TOOL_NAME = "search_docs"`, `SEARCH_TOOL_PERMISSION = f"mcp__{DOCS_SERVER_NAME}__{SEARCH_TOOL_NAME}"` and `COVERAGE_NOTE_PREFIX = "note: "`. It also declares `SEARCH_TOOL: Mapping[str, Any]`, the tool definition `server.ts`'s `SEARCH_TOOL` builds, key for key:
  - the `description`, composed from the same template with `DEFAULT_RESULTS`, `MAX_RESULTS`, `ABSTAIN_MESSAGE` and `COVERAGE_NOTE_PREFIX` interpolated, never typed whole;
  - `inputSchema` `{"type": "object", "properties": {"query": {"type": "string", "minLength": 1}, "k": {"type": "integer", "minimum": 1, "maximum": MAX_RESULTS}}, "required": ["query"], "additionalProperties": False}`;
  - `annotations` `{"readOnlyHint": True, "openWorldHint": False}`.
- [ ] **Config, owned by the service.** `CONFIG_FILENAME = "harness.config.json"`, `@dataclass(frozen=True) class ServiceConfig(repo_root: str, corpus_config: Mapping[str, Any], database_url: str)`, and `load_service_config(*, repo: str | None, docs_root: str | None, environ: Mapping[str, str]) -> ServiceConfig`.
  - It reads `<repo or cwd>/harness.config.json` **read-only** and copies `docs.root` and `layers[]` verbatim into `corpus_config`, under the same keys. `--docs-root` overrides `docs.root` alone, the way `evals/docs-retrieval/corpora.mjs`'s `self-docs` does.
  - It reads no `phases` and applies no retrieval gate, because selectability is the next branch's.
  - A missing or unparseable config file raises `ServiceError` naming the path. An empty or unset `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` raises `ServiceError` naming the variable and never echoes a connection string.
  - `add_service_options(parser: argparse.ArgumentParser) -> None` adds `--repo` and `--docs-root`. Tasks 11–13 call it on each sub-command's parser.
- [ ] **The session.** `class RetrievalSession` holds `store`, `embedder`, `reranker` and an `asyncio.Lock` named `lock`, with `async refresh() -> RefreshResult` (calling `refresh_index` with the config's `repo_root` and `corpus_config`), `async probe() -> None` and `async close()`. `probe()` is the health check Task 12's `GET /health` calls: it acquires `lock` itself (one psycopg async connection must not be used concurrently, and `asyncio.Lock` is not re-entrant, so no caller wraps it in `lock`), then `await self.store.read_meta(DIMENSIONS_META_KEY)` with the constant **imported from `store.py`**, never typed as `"dimensions"`, and lets any exception propagate. It returns nothing and never echoes the connection string. The store's meta layout stays known to `store.py` and `service.py` only. `async open_session(config: ServiceConfig) -> RetrievalSession` refuses before loading anything, in `session.ts`'s order:
  1. `model_files_present(model_cache_dir())`, checked **even under the stub**, raising `ServiceError(f"the docs-retrieval model cache at {cache_dir} is missing {', '.join(missing)}: run harness-docs-retrieval fetch-models where an operator is present, which downloads the models")`;
  2. `resolve_models(allow_remote=False)`;
  3. `open_postgres_store(config.database_url, embedder.dimensions)`.

  Nothing in this module ever passes `allow_remote=True`.
- [ ] **One answer path.** `parse_arguments(args: object) -> tuple[str, int] | str` ports `parseArguments` byte for byte:
  - a non-`dict` (including `None` and a list) gets the object refusal;
  - extra keys, taken in `js_object_keys` order, get `f"{SEARCH_TOOL_NAME}: unexpected argument {json_stringify_str(extra[0])}; expected query and k"`;
  - a non-string or `js_trim`-empty query is refused;
  - an absent `k` defaults to `DEFAULT_RESULTS`;
  - a `k` that is a `bool`, `None`, non-numeric, non-integral or outside `1..MAX_RESULTS` is refused. An integral float such as `5.0` is accepted as `5`, as JS's `Number.isInteger` accepts it.

  `@dataclass(frozen=True) class Answer(text: str, is_error: bool, refused: bool, result: SearchResult | None, notes: tuple[str, ...], search_ms: float | None)`. `refused` is true only for an argument refusal, never for a refresh or search failure. Task 12 maps the two to different HTTP statuses. `async answer(session: RetrievalSession, arguments: object, *, mode: SearchMode = "fused-rerank") -> Answer` runs **under `session.lock`**, so calls are answered one at a time, as `server.ts` queues them:
  1. Parse. A refusal returns `is_error=True, refused=True` with the refusal text. Every later failure has `refused=False`.
  2. `await session.refresh()`. On a throw, return `f"{SEARCH_TOOL_NAME}: refreshing the docs index failed: {exc}; run harness-docs-retrieval self-check in this repository"`. The remedy names this package's own check instead of the CLI's `doctor`, which knows nothing of this backend. Task 17 records that as a deliberate wire difference.
  3. Write each refresh warning to stderr as `harness-docs: warning: <warning>`.
  4. Time **only** `search_docs(...)` with `time.perf_counter()`, into `search_ms` in milliseconds. On a throw, return `f"{SEARCH_TOOL_NAME}: the search failed: {exc}"`.
  5. The body is `render_results(result)` and the notes are `COVERAGE_NOTE_PREFIX + warning` for each warning. The text is the body alone, or `"\n".join(notes) + "\n\n" + body`.
- [ ] `tests/fakes.py` gains `FakeSession`, a `RetrievalSession` stand-in built from an `InMemoryDocStore`, the `hash-v1` stubs and an injectable `refresh` (a result, or an exception to raise). Tasks 11 and 12 reuse it. `test_service.py` opens with the rule *one answer path, byte-compatible with `server.ts`* and asserts:
  - `wire.py`'s three names equal `run_bridge("constants")["server"]`;
  - `load_service_config` copies `docs.root` and `layers` verbatim, honours `--docs-root`, refuses a missing config and an unset database URL by name, and leaves the repository byte-identical;
  - `open_session` with an empty cache refuses naming the missing files and never calls `resolve_models` or `open_postgres_store` (monkeypatched to fail if called);
  - with a cache from `plant_model_files` and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1` it opens through a monkeypatched `open_postgres_store`;
  - a `parse_arguments` table covers every refusal text exactly, plus `k=5.0`, `k=True`, `k=None`, `{"query": "x", "b": 1, "1": 2}` reporting `"1"`, and a whitespace-only query;
  - `answer` composes notes exactly, returns both failure texts, and sets `search_ms` to a non-negative float only when the search ran. No duration is asserted;
  - two concurrent `answer` calls do not interleave;
  - `probe()` reads `DIMENSIONS_META_KEY` from the session's store (observed through `InMemoryDocStore`), returns `None` on success, propagates an exception `read_meta` raises (monkeypatched to raise), and holds `lock` while it reads.

**Verification:**

- `tests/test_service.py` passes (subject to the story index's test-run note).
- `grep -rn "harness-docs\"\|\"search_docs\"" docs-retrieval-service/src` finds the definitions in `wire.py` only. Every other module imports them.
- `git diff --name-only` shows nothing under `plugin/`, `cli/templates/` or `cli/src/`. The strings `wire.py` defines are quoted by those trees and are not edited there.
