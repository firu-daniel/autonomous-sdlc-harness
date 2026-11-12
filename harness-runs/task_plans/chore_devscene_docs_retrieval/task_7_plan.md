### Task 7 — Rename the Python service's container, compose, README and toolchain route, and provision its environment

**Goal:** Move the files that build, run and document the Python service to the new names and the new database login, and move this repository's one route to the Python toolchain with them. Then provision the environment under the renamed cache root, so the Python leg of the run gates has an environment to run in.

**Depends on:**

- **Task 5.** It provides the console script `devscene-docs-retrieval`, `MODEL_CACHE_ENV` = `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE`, `DATABASE_URL_ENV` = `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`, `RETRIEVAL_STUB_ENV` = `DEVSCENE_RETRIEVAL_STUB`, the default weight cache `~/.cache/devscene-docs-retrieval/models`, and the regenerated `uv.lock`.
- **Task 6.** Its `conftest.py` reads `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL` and expects the login `devscene:devscene` on database `docs_retrieval`.
- **Task 1.** Its `PYTHON_DEFAULT_DATABASE_URL` = `postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval`. `cli/src/retrieval/pythonBackend.ts` → `MIRRORS` declares `compose.yaml` → `postgres` as the mirror of its user, password, database and port.

**Where this task stops.** The container's OS user (`useradd … harness`, `USER harness`) is not the database login and is outside the rename table, so it stays. Write no sentence that names an old value or tells a reader to recreate a volume made with the old login. That step is a `Manual setup required:` entry in the story index, never documentation (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*).

### Targets

- `docs-retrieval-service/Dockerfile`
- `docs-retrieval-service/compose.yaml`
- `docs-retrieval-service/README.md`
- `scripts/python-service.sh`

**Work:**

- [ ] **`Dockerfile`.** Change the header line ("The harness-docs-retrieval service image") to `devscene-docs-retrieval`. Change `ENV … HARNESS_DOCS_RETRIEVAL_MODEL_CACHE=/models` to `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE=/models`, and change `ENTRYPOINT ["devscene-docs-retrieval"]`.
- [ ] **`compose.yaml`.** Make these edits:
  - Set `name: devscene-docs-retrieval`.
  - In the `postgres` service, set `POSTGRES_USER: devscene`, `POSTGRES_PASSWORD: devscene` and the healthcheck's `"-U", "devscene"`. `POSTGRES_DB: docs_retrieval` stays.
  - Change the port default to `${DEVSCENE_DOCS_RETRIEVAL_PG_PORT:-5432}`.
  - In the `service` service, change the env to `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL: postgresql://devscene:devscene@postgres:5432/docs_retrieval` and `DEVSCENE_RETRIEVAL_STUB: ${DEVSCENE_RETRIEVAL_STUB:-}`.
  - Change the volumes to `${DEVSCENE_DOCS_RETRIEVAL_REPO:-..}` and `${DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE:-${HOME}/.cache/devscene-docs-retrieval/models}`.
- [ ] **`docs-retrieval-service/README.md`.** Rename every command, package, module, variable, server and cache path to the new spelling, and change the `export …DATABASE_URL=postgresql://harness:harness@…` example to `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL=postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval`. Every command stays in its fenced block, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*).
- [ ] **`scripts/python-service.sh`.** Make these edits:
  - Change the header's two `harness-docs-retrieval` mentions and its cache-path sentence.
  - Set `cache_root` to `"${XDG_CACHE_HOME:-$HOME/.cache}/devscene-docs-retrieval"`.
  - Change `run`'s `uv run --frozen --no-sync devscene-docs-retrieval "$@"`.
  - Set `container-test`'s `project="devscene-docs-retrieval-test-$checkout_key"`.
  - Change `export DEVSCENE_DOCS_RETRIEVAL_PG_PORT=…`.
  - Change `export DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL="postgresql://devscene:devscene@127.0.0.1:${DEVSCENE_DOCS_RETRIEVAL_PG_PORT}/docs_retrieval"`.

  The exit contract and every other line stay as they are.
- [ ] **Provision the environment.** From the checkout root, run `bash scripts/python-service.sh sync`. The renamed `cache_root` means the previously synced environment is no longer found, and without this step the run gates report the Python leg `BLOCKED` instead of running it. If the run's sandbox refuses the network, return a blocker naming this step. It is a `Manual setup required:` entry in the story index.

**Verification:**

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|POSTGRES_(USER|PASSWORD): harness|"-U", "harness"' -- docs-retrieval-service/Dockerfile docs-retrieval-service/compose.yaml docs-retrieval-service/README.md scripts/python-service.sh` returns no hits.
- `bash -n scripts/python-service.sh` exits zero.
- After the sync, `bash scripts/python-service.sh run --help` exits zero and prints `usage: devscene-docs-retrieval`. That proves the console script resolves out of the newly provisioned environment.
