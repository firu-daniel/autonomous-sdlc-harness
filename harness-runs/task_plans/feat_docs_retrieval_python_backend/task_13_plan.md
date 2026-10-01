### Task 13 — Add the `index`, `self-check` and `fetch-models` sub-commands (`self_check.py`)

**Goal:** Complete the console entry point's surface that the selection branch builds on. `index` builds the index through the entry point. `fetch-models` is the one operator-run download. `self-check` answers the three questions a `doctor` check will ask, one line each with an exit status: do the interpreter and packages resolve, are the weights present, does an index build. Keeping those answers in the package means the next branch only has to call them, never re-implement them in TypeScript.

**Depends on:** Task 12, which leaves `cli.py` with the `serve-mcp` and `serve-http` rows and `tests/test_cli.py` asserting them, both of which this task extends. Also Task 10 (`service.py` → `load_service_config(*, repo, docs_root, environ)`, `add_service_options(parser)`, `open_session(config) -> RetrievalSession` with `refresh() -> RefreshResult` and `close()`), Task 9 (`refresh.py` → `RefreshResult(files, chunks, embedded, unchanged, deleted, rebuilt, warnings)`), Task 5 (`models.py` → `model_cache_dir()`, `model_files_present(cache_dir)`, `fetch_models()`, `EMBEDDING_MODEL`, `RERANK_MODEL`; `tests/model_cache.py` → `plant_model_files(cache_dir)`), Task 6 (`stubs.py` → `stub_models_selected()`), Task 7 (`store.py` → `open_postgres_store`, monkeypatched in tests), Task 8 (`tests/fakes.py` → `InMemoryDocStore`) and Task 1 (`cli.py`, `errors.py`, `tests/test_cli.py`).

**Ported from:** `cli/src/commands/docs.ts`: the `docs index` result line, and `docs fetch-models`, which is the only verb that downloads. And from `cli/src/retrieval/runtime.ts` → `unresolvedRetrievalPeers`: package presence is **resolved, never loaded**.

**Where this task stops.** No `doctor` check, no config key and no launcher edit. Calling `self-check` from the CLI is the selection branch's. **No task in this branch runs `fetch-models` for real**, and an unattended run never downloads. If anything you write seems to need real weights to verify, stop and say so rather than improvising an install. The README's account of where the weights live and how to provision them is Task 17's.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/self_check.py` (new)
- `docs-retrieval-service/src/harness_docs_retrieval/cli.py` — append the `index`, `self-check` and `fetch-models` rows.
- `docs-retrieval-service/tests/test_self_check.py` (new)
- `docs-retrieval-service/tests/test_cli.py` — update the row-set assertion to `["serve-mcp", "serve-http", "index", "self-check", "fetch-models"]`.

**Work:**

- [ ] `self_check.py` declares `SELF_CHECK_QUESTIONS = ("packages", "weights", "index")`, the order and the names being a contract with the selection branch's `doctor` check, and `@dataclass(frozen=True) class CheckLine(question: str, ok: bool, detail: str)`, rendered as `f"ok   {question}: {detail}"` or `f"FAIL {question}: {detail}"`.
  - **packages:** the interpreter is ≥ 3.11, and `importlib.util.find_spec` resolves `fastapi`, `uvicorn`, `mcp`, `psycopg` and `huggingface_hub`, plus `sentence_transformers` and `torch` unless a stub is selected. The detail names that exception. Nothing is imported.
  - **weights:** `model_files_present(model_cache_dir())`, checked even under the stub as `open_session` checks it. The detail names the cache directory, and on failure every missing entry.
  - **index:** `load_service_config`, then `open_session`, then `refresh()`, then `close()`. The detail is `<files> files, <chunks> chunks`. When `packages` or `weights` failed, it is `FAIL index: not attempted, because <question> failed`.

  `run_self_check(config_args) -> int` prints exactly three lines on stdout and returns `0` only when all three are `ok`. **Every exception inside a check becomes that check's `FAIL` line**, `ServiceError` and driver errors alike, so a missing cache or an unreachable database never surfaces as a traceback (Acceptance 4).
- [ ] The three rows in `cli.py`, each `configure` calling `add_service_options` where it reads config:
  - `index` opens a session, refreshes, writes each warning to stderr as `harness-docs-retrieval: warning: <warning>`, and prints one stdout line, `f"index: {files} files, {chunks} chunks; embedded {embedded}, unchanged {unchanged}, deleted {deleted}"` plus `"; rebuilt for a new embedder"` when rebuilt, mirroring `docs index`'s result line. It closes the session in a `finally`.
  - `self-check` returns `run_self_check(...)`'s status.
  - `fetch-models` takes no service options. With a stub selected it prints `f"fetch-models: stub models ({RETRIEVAL_STUB_ENV} set) need no download"`, with the name taken from `stubs.py`'s constant and never retyped, and returns `0`. Otherwise it calls `fetch_models()` and prints `f"fetch-models: {EMBEDDING_MODEL} and {RERANK_MODEL} cached in {model_cache_dir()}"`. A missing `models` extra is the `ServiceError` from `load_models`.

  Update `tests/test_cli.py`'s row-set assertion.
- [ ] `test_self_check.py` opens with its rule (*three answers, one line each, an exit status, and never a traceback*). It asserts:
  - run as a `sys.executable` subprocess with an empty cache (`HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` pointed at an empty temp dir) and no database URL: exit `1`, exactly three stdout lines in `SELF_CHECK_QUESTIONS` order, `FAIL weights`, `FAIL index: not attempted, because weights failed`, and no `Traceback` on either stream;
  - run as a subprocess with a planted cache, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1` and a database URL nothing listens on (`postgresql://127.0.0.1:1/none`): exit `1`, `ok packages`, `ok weights`, a `FAIL index:` line, and no `Traceback`;
  - in-process with a planted cache, the stub and `open_postgres_store` monkeypatched to return an `InMemoryDocStore`: exit `0` and three `ok` lines;
  - `index` in-process under the same patch prints the exact summary line, and a second run reports `embedded 0`;
  - `fetch-models` under the stub prints its note and exits `0`, with `fetch_models` monkeypatched to fail if called.

**Verification:**

- `tests/test_self_check.py` and `tests/test_cli.py` pass (subject to the story index's test-run note).
- Every hit of `grep -n "fetch_models()" docs-retrieval-service/src/harness_docs_retrieval/cli.py docs-retrieval-service/src/harness_docs_retrieval/self_check.py docs-retrieval-service/src/harness_docs_retrieval/service.py` lies inside the `fetch-models` row's `run` callable.
- No test or verification step downloads a model or touches `~/.cache/harness-docs-retrieval`. Every test points `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` at a temp dir.
