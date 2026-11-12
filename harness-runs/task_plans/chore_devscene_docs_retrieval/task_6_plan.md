### Task 6 — Move the Python test suite to the renamed package, variables and login

**Goal:** Point every Python test at `devscene_docs_retrieval` and make it assert the new command, server and variable names and the new database login. The suite then passes again against the package Task 5 renamed.

**Depends on:** Task 5. It produces the import package `devscene_docs_retrieval` (all module names unchanged inside it) and the console script `devscene-docs-retrieval`, and it sets these names:

- error form `devscene-docs-retrieval: <message>`, and usage `usage: devscene-docs-retrieval`;
- server warning prefix `devscene-docs: warning: `;
- remedy text `run devscene-docs-retrieval fetch-models where an operator is present`;
- weight cache subdirectory `devscene-docs-retrieval/models`;
- `DATABASE_URL_ENV` = `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`;
- `MODEL_CACHE_ENV` = `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE`;
- `RETRIEVAL_STUB_ENV` = `DEVSCENE_RETRIEVAL_STUB`.

**What this task produces for Task 7:** `conftest.py` → `TEST_DATABASE_URL_ENV` = `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`. This is the variable `scripts/python-service.sh container-test` must export. The login these tests assume is `devscene:devscene` on database `docs_retrieval`, which Task 7's `compose.yaml` `postgres` service must provision.

**Where this task stops.** It edits only files under `docs-retrieval-service/tests/`. The suite still copies the launcher out of `cli/templates/scripts/` (Task 2's template), never the self-adopted `scripts/` copy. `_LIBRARY`'s `harness-run-lib.sh` is a library name outside this rename and stays. This task does not run the Python suite: the run gates' Python leg grades it once Task 7 has provisioned the environment.

### Targets

- `docs-retrieval-service/tests/*.py` — every file carrying a hit. When this plan was written that was `conftest.py`, `fakes.py`, `model_cache.py` and the `test_*.py` modules. `git grep -l` over the directory at the start of the task is the authoritative set.

**Work:**

- [ ] **Imports.** In every test module, rename each `from harness_docs_retrieval…` / `import harness_docs_retrieval…` (and any `"harness_docs_retrieval.…"` string used as a patch target) to `devscene_docs_retrieval`.
- [ ] **Asserted names.** Make these edits:
  - In `conftest.py`, set `TEST_DATABASE_URL_ENV = "DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL"` and update its docstring. Update the same docstrings in `test_backend_parity_e2e.py`, `test_refresh_end_state_postgres.py` and `test_store_postgres.py`.
  - In `test_cli.py`, change the `usage:` and one-line-error expectations.
  - In `test_mcp_parity.py` / `test_backend_parity_e2e.py`, change the console-script path (`Path(sys.executable).parent / "devscene-docs-retrieval"`) and the `startswith` prefix.
  - In `test_models.py`, change both `model_cache_dir()` expectations to `… / "devscene-docs-retrieval" / "models"`.
  - In `test_self_check.py`, change the refusal line's prefix.
  - In `test_service.py`, change the remedy text and the two `devscene-docs: warning:` lines.
  - Change any remaining literal of an old variable name, for example in `fakes.py` and `test_stubs.py`.
- [ ] **`test_launcher_e2e.py`.** Change the database URL helper to `f"postgresql://devscene:devscene@127.0.0.1:{port}/docs_retrieval"`, `connect_prefix` to `"devscene-docs-retrieval: could not connect"`, and the module docstring's command name.

**Verification:**

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness' -- docs-retrieval-service/tests` returns no hits.
- Every `devscene_docs_retrieval.<module>` the tests import names a file that exists under `docs-retrieval-service/src/devscene_docs_retrieval/`. Check with `git grep -ohE 'devscene_docs_retrieval\.[a-z_]+' -- docs-retrieval-service/tests`: each module it prints must have a matching `<module>.py`.
