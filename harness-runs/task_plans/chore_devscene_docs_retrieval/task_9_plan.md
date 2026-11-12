### Task 9 — Rename the retrieval names in `ARCHITECTURE.md` and the `docs/` prose documents

**Goal:** Make the project's own documentation describe the surface by its new names: the server, the tool, the Python command and module, the eight variables and the database login. A reader who copies a name or a command out of a document then gets the one that works.

**Depends on:** Tasks 1, 2, 5 and 7, whose names this prose describes:

- server `devscene-docs` and tool `mcp__devscene-docs__search_docs`;
- console script `devscene-docs-retrieval`, module path `docs-retrieval-service/src/devscene_docs_retrieval/`;
- `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`, `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`, `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE`, `DEVSCENE_DOCS_RETRIEVAL_PG_PORT`, `DEVSCENE_DOCS_RETRIEVAL_REPO`;
- `DEVSCENE_RETRIEVAL_CACHE`, `DEVSCENE_RETRIEVAL_LOG`, `DEVSCENE_RETRIEVAL_STUB`;
- login `devscene:devscene`, so `postgresql://devscene:devscene@…`, `postgresql://devscene@…` and `psql -U devscene` / `createdb -U devscene`;
- compose project `devscene-docs-retrieval`, so containers `devscene-docs-retrieval-postgres-1`;
- weight cache `~/.cache/devscene-docs-retrieval/models`.

**Where this task stops.** It edits no measurement record and no research record. `docs/retrieval-eval-results.md` is Task 10's, and `docs/work-report-research/` and `docs/rag-extraction-research/` are Task 11's. It renames names only. It adds no sentence that names an old value, says a name changed, or tells a reader to recreate a volume (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*). Every command stays in its fenced block, one per line.

### Targets

- `ARCHITECTURE.md`
- `docs/cli.md`
- `docs/config.md`
- `docs/development.md`
- `docs/remote-execution.md`
- `docs/retrieval.md`
- `docs/retrieval-eval.md`
- `docs/sandbox-verification.md`
- `docs/watcher.md`

**Work:**

- [ ] **`docs/retrieval.md`.** Rename every hit. That includes the launcher-and-registration paragraph's `devscene-docs` entry and the "Where the URL comes from" paragraph's variable and server. The fenced `"env"` example becomes `"DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL": "postgresql://devscene@127.0.0.1:5432/docs_retrieval"`, and the fenced `docker compose exec postgres createdb -U devscene <name>` changes its `-U` argument.
- [ ] **`docs/retrieval-eval.md`.** Rename every hit. That includes the backend-comparison protocol's `docker compose exec -T postgres psql -U devscene -d docs_retrieval …` command, and every console-script, module-path and variable name.
- [ ] **`ARCHITECTURE.md`, `docs/cli.md`, `docs/config.md`.** Rename every hit. In `ARCHITECTURE.md`'s MCP section, change the server name in the "authors one MCP server" and "the first emits the whole of what this tree declares" paragraphs. In `docs/config.md` → the `docs.retrievalBackend` row, change "the `devscene-docs` launcher".
- [ ] **`docs/development.md`, `docs/remote-execution.md`, `docs/sandbox-verification.md`, `docs/watcher.md`.** Rename every hit, including gate-procedure variables such as `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`, the workflow's `DEVSCENE_RETRIEVAL_CACHE`, and the watcher's session-environment name `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`.

**Verification:**

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|-U "?harness|postgresql://harness@' -- ARCHITECTURE.md docs/cli.md docs/config.md docs/development.md docs/remote-execution.md docs/retrieval.md docs/retrieval-eval.md docs/sandbox-verification.md docs/watcher.md` returns no hits.
- Every server, command, variable and path these documents now name appears, with the same spelling, in the source that defines it. The sources are `cli/src/retrieval/server.ts`, `cli/src/retrieval/pythonBackend.ts`, `cli/src/retrieval/models.ts`, `cli/src/retrieval/queryLog.ts`, `docs-retrieval-service/compose.yaml` and `docs-retrieval-service/src/devscene_docs_retrieval/`. Check each distinct `DEVSCENE_` name with `git grep -n` against those paths.
- `git diff --stat -- ARCHITECTURE.md docs` lists only the targets above.
