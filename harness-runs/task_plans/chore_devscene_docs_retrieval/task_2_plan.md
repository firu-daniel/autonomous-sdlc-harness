### Task 2 — Rename the retrieval names in the launcher, watcher and workflow templates under `cli/templates/`

**Goal:** Bring the shell and workflow templates an adopter receives to the new names. The launcher `docs-search-server.sh` is a declared mirror of `cli/src/retrieval/pythonBackend.ts`. The watcher's session-environment allow-list names the database variable. The run workflow carries the retrieval cache variable.

**Depends on:** Task 1, which sets the constants this task mirrors byte for byte (`pythonBackend.ts` → `MIRRORS`):

- `PYTHON_RETRIEVAL_COMMAND` = `devscene-docs-retrieval`;
- `PYTHON_DATABASE_URL_VARIABLE` = `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`;
- `PYTHON_DEFAULT_DATABASE_URL` = `postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval`;
- `DOCS_SERVER_NAME` = `devscene-docs`.

`PYTHON_SERVE_SUB_COMMAND` (`serve-mcp`) and the exit code `3` do not change.

**Where this task stops.** It does not touch `scripts/docs-search-server.sh` or `scripts/autonomous-watcher.sh`. They are this repository's self-adopted copies, and the post-merge re-render brings them into line (story index `## Context`). The edit to `cli/test/outer-loop-scripts.test.mjs` is a doc-comment rename only. That suite already reads every literal through the `pythonBackend` constants, so it picks up Task 1's values with no code change. Task 5 creates the Python console script `devscene-docs-retrieval` that the launcher resolves.

### Targets

- `cli/templates/scripts/docs-search-server.sh`
- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/templates/github/workflows/devscene-run.yml`
- `cli/templates/scripts/README.md`
- `cli/test/outer-loop-scripts.test.mjs`

**Work:**

- [ ] **`docs-search-server.sh`.** Make these edits:
  - In the header's "WHO RUNS IT" sentence, rename the `harness-docs` entry to `devscene-docs`.
  - Rename the mirrored-literal list (`` `harness-docs-retrieval`, `serve-mcp`, `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` ``).
  - Change the `command -v` probe, its refusal message, the `${…-}` default test, the default assignment (`'postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval'`), the `export`, the `serve-mcp` child invocation and the exited-with-status message. Each must spell exactly the Task 1 literals above.

  Keep the file's structure, exit contract and sourcing of `lib/harness-run-lib.sh` (a library name outside this rename) unchanged.
- [ ] **`autonomous-watcher.sh` → `SESSION_ENV_BASE`.** Change the last allow-listed name to `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`. In the comment above it, change "none of the strip set: HARNESS_DOCS_RETRIEVAL_DATABASE_URL" to the new name. Leave the derivation `grep` in that comment as it is, because its pattern already matches `DEVSCENE_` names.
- [ ] **`devscene-run.yml`.** Rename all four `HARNESS_RETRIEVAL_CACHE` occurrences to `DEVSCENE_RETRIEVAL_CACHE`: the two `echo "…=…" >> "$GITHUB_ENV"` lines and the two `path: ${{ env.… }}` lines. The `harness-retrieval-` cache `key:` is outside the rename table and stays.
- [ ] **`cli/templates/scripts/README.md`.** Change "runs the Python package's `harness-docs-retrieval serve-mcp`" to `devscene-docs-retrieval serve-mcp`.
- [ ] **`outer-loop-scripts.test.mjs`.** Rename the fake-command doc comment ("a fake `harness-docs-retrieval` first on `PATH`") to `devscene-docs-retrieval`. No assertion changes.

**Verification:**

- `bash -n cli/templates/scripts/docs-search-server.sh` and `bash -n cli/templates/scripts/autonomous-watcher.sh` exit zero.
- `npm test --workspace cli -- test/outer-loop-scripts.test.mjs` passes. It is the one test file this task edits. Its launcher cases put a fake `devscene-docs-retrieval` (named through `PYTHON_RETRIEVAL_COMMAND`) on `PATH` and assert the child's argv and its `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL` default. That proves the template and Task 1's constants agree end to end.
- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness' -- cli/templates cli/test/outer-loop-scripts.test.mjs` returns no hits.
