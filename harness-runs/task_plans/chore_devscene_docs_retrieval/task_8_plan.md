### Task 8 — Rename the retrieval names in this repository's sandbox probe, model-pin check, evals and the notes-app profile

**Goal:** Bring this repository's own hand-written consumers of the retrieval names to the new spellings, so they keep working against the renamed server and package. Those consumers are the sandbox probe's MCP leg, the model-revision check, the retrieval evaluation (task prompt goal 5) and the live notes-app permission profile.

**Depends on:**

- **Task 1.** `DOCS_SERVER_NAME` = `devscene-docs`, tool `mcp__devscene-docs__search_docs`, `PYTHON_RETRIEVAL_COMMAND` = `devscene-docs-retrieval`. The evals import these through `cli/dist/retrieval/*.js`, so their code needs no change, only their prose. Task 1 also rewrites the `_README` sentence of `cli/templates/claude/settings.autonomous.json` to "`search_docs` on the `devscene-docs` server".
- **Task 3.** It moves the sandbox-probe judge's fixtures to `mcp__devscene-docs__search_docs`, the same tool name the probe leg below passes to `sp_judge_mcp`.
- **Task 5.** It moves the package to `docs-retrieval-service/src/devscene_docs_retrieval/` (modules `models.py`, `store.py`, `refresh.py`, `mcp_server.py`, `search.py`, `cli.py` unchanged in name).
- **Task 7.** `scripts/python-service.sh run` now invokes `devscene-docs-retrieval`, which is the route `evals/docs-retrieval/python-backend.mjs` takes.

**Where this task stops.** `scripts/docs-search-server.sh` and `scripts/autonomous-watcher.sh` are self-adopted template copies, and the post-merge re-render handles them (story index `## Context`). They are not targets here. The eval code's imported constants and `TIMING_LINE_PREFIX` / `MESSAGE_PREFIX` expressions stay as they are, because they derive from Task 1's constants.

### Targets

- `scripts/lib/sandbox-probe/core.sh`
- `scripts/lib/sandbox-probe/legs-local.sh`
- `scripts/sandbox-probe-runner.yml`
- `scripts/check-model-revisions.mjs`
- `evals/docs-retrieval/bm25-refresh-rule.mjs`
- `evals/docs-retrieval/mcp-backend-pass.mjs`
- `evals/docs-retrieval/python-backend.mjs`
- `evals/docs-retrieval/results.mjs`
- `evals/docs-retrieval/vector-agreement.mjs`
- `examples/notes-app/.claude/settings.autonomous.json`

**Work:**

- [ ] **The sandbox probe's MCP leg.** Make these edits:
  - In `core.sh`, change the leg's description string to "the devscene-docs MCP server answers a search_docs call…".
  - In `legs-local.sh`, change four things: the `jq -e '.mcpServers["devscene-docs"] | type == "object"'` wiring test, its not-wired reason ("no devscene-docs server in .mcp.json …"), the `sp_prompt_tool` tool name and the `sp_judge_mcp` tool argument. Both tool spellings must be exactly `mcp__devscene-docs__search_docs`.
  - In `sandbox-probe-runner.yml`, rename `HARNESS_RETRIEVAL_CACHE` to `DEVSCENE_RETRIEVAL_CACHE`, and rename every reader of it in that file.
- [ ] **`scripts/check-model-revisions.mjs`.** Set `PYTHON_MODELS = 'docs-retrieval-service/src/devscene_docs_retrieval/models.py'` and update the header comment's path.
- [ ] **The evals' prose and literals.** Make these edits:
  - In `bm25-refresh-rule.mjs`, `mcp-backend-pass.mjs`, `python-backend.mjs` (twice) and `vector-agreement.mjs`, repoint every `docs-retrieval-service/src/harness_docs_retrieval/…` doc-comment path to `src/devscene_docs_retrieval/…`.
  - In `python-backend.mjs`, change the comment "The child's own `harness-docs-retrieval: <message>` line" to `devscene-docs-retrieval`.
  - In `results.mjs`, change both emitted strings: "Backend `python`: `harness-docs-retrieval serve-http` …" → `devscene-docs-retrieval serve-http`, and the `…/src/harness_docs_retrieval/search.py` path. Task 10 renames the same text in `docs/retrieval-eval-results.md`'s generated region, so the next generator run reproduces those bytes.
- [ ] **`examples/notes-app/.claude/settings.autonomous.json`.** In the `_README` sentence, change "`search_docs` on the `harness-docs` server" to "`search_docs` on the `devscene-docs` server". The file is the live render of the template Task 1 edits, with `{{scriptsDir}}` rendered as `scripts`, so the line must equal the template's line under that one substitution.

**Verification:**

- `bash -n scripts/lib/sandbox-probe/core.sh` and `bash -n scripts/lib/sandbox-probe/legs-local.sh` exit zero.
- `node --check` passes on each of the five edited `evals/docs-retrieval/*.mjs` files and on `scripts/check-model-revisions.mjs`.
- `grep -n "PYTHON_MODELS = 'docs-retrieval-service/src/devscene_docs_retrieval/models.py'" scripts/check-model-revisions.mjs` finds the constant, and `ls docs-retrieval-service/src/devscene_docs_retrieval/models.py` succeeds.
- `node -e "JSON.parse(require('fs').readFileSync('examples/notes-app/.claude/settings.autonomous.json','utf8'))"` exits zero.
- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL' -- scripts/lib/sandbox-probe scripts/sandbox-probe-runner.yml scripts/check-model-revisions.mjs evals examples/notes-app/.claude` returns no hits.
