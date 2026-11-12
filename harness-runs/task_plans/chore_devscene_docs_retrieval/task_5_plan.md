### Task 5 — Rename the Python package to `devscene_docs_retrieval` / `devscene-docs-retrieval` and regenerate `uv.lock`

**Goal:** Rename the Python distribution, its import package and its console script. Its wire constants must spell the names the TypeScript side (Task 1) already uses, so that both backends still answer under one server name, one tool and one set of variables.

**Depends on:** Task 1, whose values this package mirrors exactly:

- `DOCS_SERVER_NAME` = `devscene-docs`. This is also the prefix of the stderr timing line `devscene-docs: search_ms=…` that `evals/docs-retrieval/mcp-backend-pass.mjs` matches through `` `${DOCS_SERVER_NAME}: search_ms=` ``.
- `PYTHON_RETRIEVAL_COMMAND` = `devscene-docs-retrieval`. `cli.py`'s one-line error form `devscene-docs-retrieval: <message>` is what the launcher, `doctor` and the evals' `MESSAGE_PREFIX` read.
- `PYTHON_DATABASE_URL_VARIABLE` = `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`.
- `RETRIEVAL_STUB_ENV` = `DEVSCENE_RETRIEVAL_STUB`.

**What this task produces for later tasks:**

- the package directory `docs-retrieval-service/src/devscene_docs_retrieval/`, which Task 6's imports and Task 8's `scripts/check-model-revisions.mjs` → `PYTHON_MODELS` path name;
- `models.py` → `MODEL_CACHE_ENV` = `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE`, which Task 7's `Dockerfile` and `compose.yaml` set;
- the default weight cache `<XDG_CACHE_HOME or ~/.cache>/devscene-docs-retrieval/models`, which Task 7's compose volume default names;
- `models.py` → `MANIFEST_NAME` = `devscene-docs-retrieval-models.json`, read from the root of that cache directory. The story index's `Manual setup required:` model-weights step renames an existing manifest to it, because a cache still carrying the old name reports every model missing;
- the console script `devscene-docs-retrieval`, which Task 7's `Dockerfile` `ENTRYPOINT` and `scripts/python-service.sh run` invoke.

**Where this task stops.** It edits no test file: Task 6 owns `docs-retrieval-service/tests/`, and the suite imports the old module until Task 6 lands. It also leaves `Dockerfile`, `compose.yaml`, `README.md` and `scripts/python-service.sh` alone, because Task 7 owns them. The `test_lock.py` rule (a `sentence-transformers` ≥ 4 in `uv.lock`) is unaffected by a project rename and must stay true.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/` → `docs-retrieval-service/src/devscene_docs_retrieval/` (moved with `git mv`, every module inside)
- `docs-retrieval-service/pyproject.toml`
- `docs-retrieval-service/uv.lock`

**Work:**

- [ ] **Move the package.** Run `git mv docs-retrieval-service/src/harness_docs_retrieval docs-retrieval-service/src/devscene_docs_retrieval`, so history follows each module. Then rename every `harness_docs_retrieval` import and reference inside the moved modules to `devscene_docs_retrieval`.
- [ ] **The wire and name constants.** Make these edits:
  - In `wire.py`, set `DOCS_SERVER_NAME = "devscene-docs"`.
  - In `cli.py`, set `PROG = "devscene-docs-retrieval"` and update its module docstring.
  - In `store.py`, set `DATABASE_URL_ENV = "DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL"`.
  - In `stubs.py`, set `RETRIEVAL_STUB_ENV = "DEVSCENE_RETRIEVAL_STUB"`.
  - In `models.py`, set `MODEL_CACHE_ENV = "DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE"` and `MANIFEST_NAME = "devscene-docs-retrieval-models.json"`. Change the cache subdirectory in `model_cache_dir` (and its docstring) to `"devscene-docs-retrieval"`, and change both "run harness-docs-retrieval fetch-models" remedies.
  - In `service.py`, change the same remedy.
  - In `__init__.py`, change the package docstring.

  Leave no fallback that reads an old variable or an old cache path (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*).
- [ ] **`pyproject.toml`.** Make these edits:
  - Set `[project] name = "devscene-docs-retrieval"`.
  - Change the `[project.scripts]` entry to `devscene-docs-retrieval = "devscene_docs_retrieval.cli:main"`.
  - Set `[tool.hatch.build.targets.wheel] packages = ["src/devscene_docs_retrieval"]`.
  - Change the `container` pytest marker's text to name `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`, the variable Task 6's `conftest.py` reads.
- [ ] **Regenerate `uv.lock`.** From the checkout root, run `bash scripts/python-service.sh lock`, which runs `uv lock` in `docs-retrieval-service/`. The editable root package must now appear as `name = "devscene-docs-retrieval"`. If the run's sandbox refuses the network, return a blocker naming this step. Do not hand-edit the lock. This is a `Manual setup required:` step in the story index.

**Verification:**

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL' -- docs-retrieval-service/src docs-retrieval-service/pyproject.toml docs-retrieval-service/uv.lock` returns no hits.
- `docs-retrieval-service/src/harness_docs_retrieval` no longer exists, and `docs-retrieval-service/src/devscene_docs_retrieval/py.typed` does.
- `grep -n 'name = "devscene-docs-retrieval"' docs-retrieval-service/uv.lock` finds the root package entry, and `grep -n 'name = "sentence-transformers"' docs-retrieval-service/uv.lock` still finds its entry.
