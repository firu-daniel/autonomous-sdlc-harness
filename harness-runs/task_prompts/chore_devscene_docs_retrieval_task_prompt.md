`chore_devscene_docs_retrieval` renames the docs-retrieval surface from `harness-docs` to `devscene-docs`. It covers both the MCP server an adopter's `.mcp.json` declares and the Python service in `docs-retrieval-service/`. It is the last of five rename branches after `chore_rename_to_devscene`. No adopters need migrating, so backward compatibility is out of scope.

## The new names

| Today | Becomes |
|---|---|
| MCP server `harness-docs` (`DOCS_SERVER_NAME`), and so the tool `mcp__harness-docs__search_docs` | `devscene-docs`, and so `mcp__devscene-docs__search_docs` |
| Python package and command `harness-docs-retrieval` (`PYTHON_RETRIEVAL_COMMAND`) | `devscene-docs-retrieval` |
| Python module `harness_docs_retrieval` | `devscene_docs_retrieval` |
| `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`, `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL`, `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE`, `HARNESS_DOCS_RETRIEVAL_PG_PORT`, `HARNESS_DOCS_RETRIEVAL_REPO`, `HARNESS_RETRIEVAL_CACHE` | `HARNESS_` replaced by `DEVSCENE_` (for example `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`) |
| `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG`, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` | `DEVSCENE_RETRIEVAL_LOG`, `DEVSCENE_RETRIEVAL_STUB` |
| database login `harness:harness` in `postgresql://harness:harness@…/docs_retrieval` (`PYTHON_DEFAULT_DATABASE_URL`), and `POSTGRES_USER` / `POSTGRES_PASSWORD` `harness` in `docs-retrieval-service/compose.yaml` | `devscene:devscene`, and `POSTGRES_USER` / `POSTGRES_PASSWORD` `devscene` |

The database name `docs_retrieval` stays. A local Postgres volume created with the old login does not accept the new one: recreate it (`docker compose down -v` in `docs-retrieval-service/`). There is no fallback to the old login.

## The goal

1. Rename the MCP server and its tool everywhere they are declared, granted or cited. That covers:
   - `cli/src/retrieval/`;
   - the `.mcp.json` template `cli/templates/repo/mcp.retrieval.json`;
   - the permission fragment `cli/templates/claude/settings.autonomous.retrieval.json`, both its `enabledMcpjsonServers` entry and its `allow` entry;
   - every agent definition whose `tools:` allowlist carries `mcp__harness-docs__search_docs`;
   - the template `cli/templates/scripts/docs-search-server.sh`, `docs/retrieval.md` and the other documents;
   - this repository's hand-written sandbox probe, `scripts/lib/sandbox-probe/core.sh` and `scripts/lib/sandbox-probe/legs-local.sh`, which name the server and its tool.
2. Rename the Python distribution, module and console script in `docs-retrieval-service/` (`pyproject.toml`, `src/`, `tests/`, `Dockerfile`, `compose.yaml`, `README.md`). Regenerate `uv.lock`. Update `scripts/python-service.sh` and the TypeScript side that launches it.
3. Rename the eight retrieval variables and the database login throughout. `HARNESS_RETRIEVAL_CACHE` lives in the workflow template `cli/templates/github/workflows/devscene-run.yml`; `HARNESS_DOCS_RETRIEVAL_PG_PORT` and `HARNESS_DOCS_RETRIEVAL_REPO` in `docs-retrieval-service/compose.yaml` and its README. The login appears in `cli/src/retrieval/pythonBackend.ts`, `cli/templates/scripts/docs-search-server.sh`, `docs-retrieval-service/compose.yaml`, its README, `scripts/python-service.sh` and `docs-retrieval-service/tests/test_launcher_e2e.py`.
4. Rename them in the research records too: `docs/work-report-research/` and `docs/rag-extraction-research/`. A line that quotes another repository's file or a recorded command output keeps its text.
5. The retrieval evaluation under `evals/` keeps working with the renamed server.

## Left to the refresh after merge

- The self-adopted copies under `scripts/` that mirror a template byte for byte (of those carrying these names, `scripts/docs-search-server.sh` and `scripts/autonomous-watcher.sh`) are not edited in this branch. Only their templates under `cli/templates/scripts/` change. The forced self-adopt re-render in #151 5.1 brings each copy to its template's bytes.
- This repository's permission profile, `.claude/settings.autonomous.json`, is gitignored and generated from the templates. The same re-render regenerates it. This repository has no `.mcp.json`.

## Done when

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|POSTGRES_(USER|PASSWORD): harness'` outside `harness-runs/`, recorded-release fixtures and the self-adopted `scripts/` copies returns nothing, except the quoted lines goal 4 keeps. The report lists them.
- The Python service's tests pass.
- The TypeScript test suite and the gates pass.

