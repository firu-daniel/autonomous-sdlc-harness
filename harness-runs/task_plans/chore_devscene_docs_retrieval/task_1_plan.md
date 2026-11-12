### Task 1 — Rename the server, Python command, variables and login in `cli/src/retrieval/` and the retrieval wiring templates

**Goal:** Make the CLI's single sources of the retrieval names spell the new names, together with the templates that declare and grant the server. Those sources are the constants in `cli/src/retrieval/`, and the templates are `mcp.retrieval.json` and the permission fragment. `init` then writes `devscene-docs` and grants `mcp__devscene-docs__search_docs`, and every derived string follows from the constants.

**Where this task stops.** It changes no test file and no shell template. Task 2 owns the launcher `cli/templates/scripts/docs-search-server.sh`, the watcher template and the workflow template, and mirrors the literals this task sets. Task 3 owns every `cli/test/` file that asserts these literals. Task 4 owns the agent allowlists that quote `SEARCH_TOOL_PERMISSION`. Task 5 owns the Python `wire.py` → `DOCS_SERVER_NAME`, which must equal this task's value. The tree does not pass `cli/test/init.test.mjs` / `profile.test.mjs` / `doctor.test.mjs` until Task 3 lands. That is expected, and Phase G grades the finished branch.

**The literals this task produces** (the exact contract every later task restates):

| Constant | File | New value |
|---|---|---|
| `DOCS_SERVER_NAME` | `cli/src/retrieval/server.ts` | `'devscene-docs'` |
| `SEARCH_TOOL_PERMISSION` (derived, unchanged expression) | `cli/src/retrieval/server.ts` | evaluates to `mcp__devscene-docs__search_docs` |
| `PYTHON_RETRIEVAL_COMMAND` | `cli/src/retrieval/pythonBackend.ts` | `'devscene-docs-retrieval'` |
| `PYTHON_DATABASE_URL_VARIABLE` | `cli/src/retrieval/pythonBackend.ts` | `'DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL'` |
| `PYTHON_DEFAULT_DATABASE_URL` | `cli/src/retrieval/pythonBackend.ts` | `'postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval'` |
| `RETRIEVAL_STUB_ENV` | `cli/src/retrieval/models.ts` | `'DEVSCENE_RETRIEVAL_STUB'` |
| `RETRIEVAL_LOG_ENV` | `cli/src/retrieval/queryLog.ts` | `'DEVSCENE_RETRIEVAL_LOG'` |

### Targets

- `cli/src/retrieval/server.ts`
- `cli/src/retrieval/pythonBackend.ts`
- `cli/src/retrieval/models.ts`
- `cli/src/retrieval/queryLog.ts`
- `cli/templates/repo/mcp.retrieval.json`
- `cli/templates/claude/settings.autonomous.retrieval.json`
- `cli/templates/claude/settings.autonomous.json`
- `cli/templates/claude/README.md`
- `cli/templates/repo/README.md`

**Work:**

- [ ] **The server-name wire, all three of its files in this one edit.** `server.ts`'s header says renaming one is an edit to every one:
  - In `server.ts`, set `DOCS_SERVER_NAME = 'devscene-docs'` and leave the `SEARCH_TOOL_PERMISSION` expression as it is.
  - In `cli/templates/repo/mcp.retrieval.json`, rename the `mcpServers` key `harness-docs` → `devscene-docs`. Leave the server's body unchanged, because `cli/src/generators/repoRoot.ts` requires exactly one server named `DOCS_SERVER_NAME` there.
  - In `cli/templates/claude/settings.autonomous.retrieval.json`, set `enabledMcpjsonServers` to `["devscene-docs"]` and `allow` to `["mcp__devscene-docs__search_docs"]`. Its `_README` string names both entries as `` `devscene-docs` `` and `` `mcp__devscene-docs__` ``.
- [ ] **`pythonBackend.ts`.** Set `PYTHON_RETRIEVAL_COMMAND`, `PYTHON_DATABASE_URL_VARIABLE` and `PYTHON_DEFAULT_DATABASE_URL` to the table's values. In the module header's `MIRRORS` list, repoint the two Python paths to `docs-retrieval-service/src/devscene_docs_retrieval/self_check.py` and `…/store.py`. Rename the server named in the `serverEnv` doc comment ("the `harness-docs` server's `env` object") to `devscene-docs`. Leave every other constant alone.
- [ ] **The two environment-variable constants.** In `models.ts`, set `RETRIEVAL_STUB_ENV = 'DEVSCENE_RETRIEVAL_STUB'`. In `queryLog.ts`, set `RETRIEVAL_LOG_ENV = 'DEVSCENE_RETRIEVAL_LOG'`, and rename the server named in its header comment ("to the `harness-docs` server in their own `.mcp.json`"). Keep the "an environment variable rather than a configuration key" design: only the name changes.
- [ ] **Template prose that names the server.** Rename the server in three places:
  - the `_README` sentence of `cli/templates/claude/settings.autonomous.json`: "`search_docs` on the `harness-docs` server" → "`search_docs` on the `devscene-docs` server";
  - `cli/templates/claude/README.md`: "starts the `harness-docs` server";
  - `cli/templates/repo/README.md`: "declares the `harness-docs` server".

  Change only the server name. Write no sentence that names the old value or says a name changed (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*). Leave the `{{scriptsDir}}` token as it is. Task 8 mirrors the new sentence into `examples/notes-app/.claude/settings.autonomous.json`.

**Verification:**

- The configured typecheck (`commands.typecheck`) exits zero.
- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness' -- cli/src cli/templates/repo cli/templates/claude` returns no hits.
- `node -e "JSON.parse(require('fs').readFileSync('cli/templates/repo/mcp.retrieval.json','utf8'));JSON.parse(require('fs').readFileSync('cli/templates/claude/settings.autonomous.retrieval.json','utf8'));JSON.parse(require('fs').readFileSync('cli/templates/claude/settings.autonomous.json','utf8'))"` exits zero, so the three JSON templates still parse.
