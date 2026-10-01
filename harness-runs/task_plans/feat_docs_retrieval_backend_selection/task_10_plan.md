### Task 10 — Add the container-gated case that calls `search_docs` through the launcher on the Python backend

**Goal:** Acceptance 2, end to end. With `docs.retrievalBackend: "python"` and its prerequisites present, the shipped launcher starts the Python stdio server, and an MCP client calling `search_docs` through it gets a response with the same shape as the TypeScript one. The case runs under the stub models against a real Postgres. It is `container`-marked, so it runs in gate 13d (`bash scripts/python-service.sh container-test`), is opt-in, and skips loudly where no test database is named. That is how the first branch's container cases behave (`docs-retrieval-service/tests/conftest.py` → `pytest_collection_modifyitems`, `CONTAINER_SKIP_REASON`).

**Depends on:** Task 4, which makes `cli/templates/scripts/docs-search-server.sh` route on the key:

- with `python` it runs `harness-docs-retrieval serve-mcp --repo <checkout root>` as a child, where `harness-docs-retrieval` is resolved on its `PATH` after `hr_path_with_fallbacks`;
- it keeps a non-empty inherited `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`, else exports `postgresql://harness:harness@127.0.0.1:5432/docs_retrieval`;
- it writes nothing to stdout itself;
- it sources `lib/harness-run-lib.sh` beside it, and needs `git` and `jq` on `PATH`.

Task 3 adds that library's `hr_docs_retrieval_backend`. Task 9 restores the shared remedy text. That is not exercised here, but this case's server is the post-Task-9 one.

**Where this task stops.** No file under `cli/` is edited. The launcher and its library are read from `cli/templates/scripts/` and copied into the fixture, never changed. `scripts/python-service.sh` and `scripts/run-gates.sh` are unchanged: `container-test` already runs every `container`-marked case with `pytest -m container -rs`.

### Targets

- `docs-retrieval-service/tests/test_launcher_e2e.py` (new)

**Work:**

- [ ] File header stating the rule it enforces: *"with `docs.retrievalBackend` set to `python`, the launcher an adopter's `.mcp.json` names starts this package's server, and `search_docs` answers through it in the TypeScript server's shape."* Mark **only the MCP-client case** with a function-level `@pytest.mark.container` decorator. **No module-level `pytestmark`:** it would mark every test in the module, including the unmarked exit-3 case below, which `conftest.py` → `pytest_collection_modifyitems` would then skip wherever `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` is unset, which is every 13c run. Say in the header that the two cases need `bash`, `git`, `jq` and `npm run build`'s `cli/dist`.
- [ ] Fixture: use `ts_bridge.ts_fixture(files=…)`, a retrieval-on repository under the system temp directory, removed on every exit path, holding a corpus that yields at least one non-abstaining answer. Reuse the corpus and query helpers of `tests/test_backend_parity_e2e.py` by import rather than copying them, or a small corpus of its own. Inside the fixture:
  - write `docs.retrievalBackend: "python"` into its `harness.config.json`, keeping every other key;
  - copy `cli/templates/scripts/docs-search-server.sh` to `<fixture>/scripts/docs-search-server.sh` and `cli/templates/scripts/lib/harness-run-lib.sh` to `<fixture>/scripts/lib/harness-run-lib.sh`, both from `ts_bridge.CHECKOUT_ROOT`;
  - plant a fake weight cache with `model_cache.plant_model_files`.
- [ ] Launch the launcher as the agent runner does: `StdioServerParameters(command="bash", args=[<fixture>/scripts/docs-search-server.sh], cwd=<fixture>)`. Its env holds only the runner's fixed inherited set plus `.mcp.json`-style additions:
  - `HOME` is a temp directory;
  - `PATH` is the venv's `bin` (`Path(sys.executable).parent`, where the console script lives) followed by the directories holding `git` and `jq`, found with `shutil.which`;
  - `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, the planted `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`, and `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` set to the `fresh_database_url` fixture's value, which exercises the override route.
- [ ] Assertions. Through `mcp.Client`:
  - `list_tools` names exactly `search_docs`;
  - one non-abstaining query's `call_tool` result has `isError` false and one `text` content item;
  - its text equals the TypeScript server's text for the same query and fixture. Start the TypeScript server as `test_backend_parity_e2e._servers` does, with `node <cli_entry> docs serve` and `fixture.env`, so "same shape" is graded on the strongest form the stub allows.

  A mismatch that traces to engine behaviour rather than the launcher is reported as a blocker naming the query and both outputs, never loosened (that file's own rule).
- [ ] A second, **non-container** case in the same file, carrying no `container` marker (no decorator, and no module-level `pytestmark` exists to inherit one) so it runs in 13c everywhere, which needs no Docker. This is Acceptance 3's launcher half on the real package.
  - **Fixture:** its own `ts_bridge.ts_fixture(files=…)` repository, prepared exactly as the fixture bullet above: `docs.retrievalBackend: "python"` written into its `harness.config.json`, the launcher and its library copied into `<fixture>/scripts/`, and a fake weight cache planted with `model_cache.plant_model_files`. It uses no `fresh_database_url`, so it needs no test database.
  - **Environment, stated in full** (`conftest.py` has no autouse fixture supplying any of it):
    - `PATH` is the venv's `bin` (`Path(sys.executable).parent`) followed by the directories holding `git` and `jq`, found with `shutil.which`, the same as the MCP-client case;
    - `HOME` is a `tempfile.TemporaryDirectory`;
    - `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`;
    - `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` naming the planted cache;
    - `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` pointing at a closed loopback port.
  - **Why each is there:** `service.py` → `open_session` refuses in the order *"the weight cache, then the models, then the store"*. The planted cache gets the server past the cache step, the stub gets it past the model step without the `models` extra the gate environment never installs, and the venv `bin` lets the launcher resolve `harness-docs-retrieval` rather than take its own no-server exit-3 path. So the server reaches the store, and the asserted line is the database's.
  - Run `bash <fixture>/scripts/docs-search-server.sh` with `cwd=<fixture>`, through `subprocess.run` with that env, a timeout and stdin closed. Assert that the launcher exits 3, that stdout is empty, and that stderr carries both the server's `harness-docs-retrieval: could not connect` line and the launcher's line naming `doctor`.

**Verification:**

- `git grep -n "pytest.mark.container" -- docs-retrieval-service/tests/test_launcher_e2e.py` shows hits only on the `@pytest.mark.container` decorator directly above the MCP-client case's function, and no hit on or above the exit-3 case; and `git grep -n "pytestmark" -- docs-retrieval-service/tests/test_launcher_e2e.py` shows none.
- No conventions document states a single-file Python test command, so the unit **records the skip** for `tests/test_launcher_e2e.py` in its return. Phase G runs its unmarked case in 13c. Its container case runs in 13d, which on this machine (no Docker) reports `SKIPPED`, and it is the story index's **Manual setup required** step.
- Every temp directory and the test database are removed on every exit path: `ts_fixture`, `fresh_database_url` and a `tempfile.TemporaryDirectory` context for `HOME`.
