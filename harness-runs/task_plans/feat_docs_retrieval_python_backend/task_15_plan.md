### Task 15 — Add the container-gated end-to-end parity case and the wrapper's `container-test` sub-command

**Goal:** Prove the full claim of Acceptance 2. With the stub models, the same query over the same corpus renders **byte-identical** `search_docs` output from both backends, abstention included, and both servers advertise the same tool listing over the wire. The TypeScript backend runs on PGlite and the Python backend on the compose Postgres. Give that case, and every other `container` test, one opt-in way to run that tears down what it started on every exit path.

**Depends on:** Task 1 (`scripts/python-service.sh`, whose header reserves `container-test` and exit status `4`; `tests/conftest.py` → `TEST_DATABASE_URL_ENV = "HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL"`, the `container` marker and `fresh_database_url`), Task 4 (`tests/ts_bridge.py` → `ts_fixture(files) -> TsFixture(dir, env, cli_entry)`, which writes the files, seeds git, writes a retrieval-on `harness.config.json` with `docs.root: "docs"` and conventions `conventions.md`, plants the TypeScript model cache, and returns the stub env `hash-v1`), Task 5 (`tests/model_cache.py` → `plant_model_files(cache_dir)`; `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`), Task 11 (`harness-docs-retrieval serve-mcp --repo <dir>`, reading `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`) and Task 14 (`compose.yaml` → service `postgres` with a health check, port `127.0.0.1:${HARNESS_DOCS_RETRIEVAL_PG_PORT:-5432}:5432`, and its declared local credentials).

**The rule for a mismatch.** This case is where an **engine** divergence the port did not cause would surface, such as the tie order among equal scores, or a planner on a real Postgres choosing the BM25 index scan where PGlite seq-scans (`DocStore.lexical_search`'s own comment). A mismatch is first assumed to be a port defect and is fixed in the module that owns the rule. If it traces to engine behaviour, **return a blocker** naming the query, both outputs and the trace. **Never** change the query set, drop a query, normalise the outputs or loosen the comparison to make it pass. Tuning either backend toward the other is out of bounds by the task prompt. The user decides, and the seam section records the result.

### Targets

- `scripts/python-service.sh` — add the `container-test` sub-command and exit status `4`.
- `docs-retrieval-service/tests/test_backend_parity_e2e.py` (new) — marked `container`.

**Work:**

- [ ] **`container-test` in `scripts/python-service.sh`.**
  1. With `docker` not on `PATH`, print `container-test: SKIPPED — docker is not on PATH; the container gate needs Docker` on stderr and exit `4`. That is a loud skip and not a failure. Task 16 grades `4` as `SKIPPED`.
  2. Without a synced environment, exit `3`, as the other sub-commands do.
  3. Otherwise, start **only** the `postgres` service under a per-checkout compose project name, with `docker compose -f docs-retrieval-service/compose.yaml -p <project> up -d --wait postgres` and a non-default `HARNESS_DOCS_RETRIEVAL_PG_PORT`, and register a `trap` that runs `docker compose … -p <project> down -v` on **every** exit path. It removes only the project it created (the lessons ledger's every-exit-path rule).
  4. Export `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` for that port and the compose file's credentials, run `pytest -m container -rs` through `uv run --frozen --no-sync`, and exit with pytest's status.

  Update the header's sub-command list and exit contract.
- [ ] **The corpus and the two servers** in `test_backend_parity_e2e.py`, which opens with Acceptance 2 as its rule and the mismatch rule above.
  - **Corpus:** every file under `evals/docs-retrieval/corpora/fixture-catalog/docs/`, placed at `docs/<name>.md`; a `conventions.md`; and one crafted `docs/snippet-edges.md` whose sections exercise `snippet_of`'s edges: a body over 240 UTF-16 units, ` ` / `﻿` whitespace, an astral character straddling the cut, and no space in the first 240 units. This corpus exists only inside the temp fixture. **No committed corpus file changes.**
  - **Servers:** inside `ts_fixture(files)`, start the TypeScript server (`node <cli_entry> docs serve`, `cwd=dir`, the fixture's env) and the Python server (`harness-docs-retrieval serve-mcp --repo <dir>`, the console script beside `sys.executable`, with `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB=hash-v1`, `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` set to `fresh_database_url`, and `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` set to a temp dir planted with `plant_model_files`). Each is reached through the MCP Python SDK's stdio client. Both read the **same** directory and the same `harness.config.json`, so both see the same corpus and emit the same `note: ` lines.
- [ ] **The comparisons.**
  - `list_tools()` on both, dumped with `model_dump(mode="json", by_alias=True, exclude_none=True)`, is equal.
  - Then, for every `query` in `evals/docs-retrieval/queries/fixture-catalog.jsonl` in file order, a query whose tokens overlap nothing in the corpus (so `fused-rerank` abstains, and both must print `no confident match`), and a query that lands on `docs/snippet-edges.md`: call `search_docs` on both with `k` absent, and additionally with `k=1` and `k=20` for the first three queries. Assert that `content[0].text` is **byte-equal** and `isError` is equal.
  - On the first mismatch, fail with the query, the `k`, and both texts in full.
  - Calls go one at a time, in the same order on both servers, because each call refreshes its own index first.

**Verification:**

- `bash -n scripts/python-service.sh` is clean. Reading it shows that the `trap` is set before `up` returns and that `down -v` names only the project the script created.
- `tests/test_backend_parity_e2e.py` collects and **skips loudly** wherever `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` is unset, which is the case on this machine. That reading needs no run. The case itself is run by `container-test` on a machine with Docker, listed in the story index's `Manual setup required:`, and by Task 16's opt-in gate.
- `git diff --name-only` shows nothing under `evals/`. The eval corpus and query set are read and never written.
