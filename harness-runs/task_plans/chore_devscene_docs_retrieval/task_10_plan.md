### Task 10 — Rename the retrieval names throughout `docs/retrieval-eval-results.md`

**Goal:** Bring the eval results record to the new names, both inside its generated region and in the hand-recorded sections below it. The task prompt's Done-when exempts only the two research folders' quoted lines, and this file is outside them.

**Depends on:**

- **Task 1.** `RETRIEVAL_STUB_ENV` = `DEVSCENE_RETRIEVAL_STUB`, `RETRIEVAL_LOG_ENV` = `DEVSCENE_RETRIEVAL_LOG`, server `devscene-docs`, tool `mcp__devscene-docs__search_docs`.
- **Task 5.** Package `devscene-docs-retrieval` 0.1.0, module path `docs-retrieval-service/src/devscene_docs_retrieval/`, weight cache `<cache>/devscene-docs-retrieval/models`.
- **Task 7.** Compose project `devscene-docs-retrieval`, so container `devscene-docs-retrieval-postgres-1` and image `devscene-docs-retrieval-postgres`. Login `devscene:devscene`, so `-U devscene`. The variables `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL` / `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`, and the environment cache root `<cache>/devscene-docs-retrieval/venvs/<key>`.
- **Task 8.** It changes `evals/docs-retrieval/results.mjs` to emit "Backend `python`: `devscene-docs-retrieval serve-http` …" and the `…/src/devscene_docs_retrieval/search.py` path. This task renames the generated region's copies of those lines to exactly those bytes, so `evals/docs-retrieval/run.mjs`, the region's only writer, reproduces them.

**Where this task stops.** It renames names only. Every figure, timing, count, date and table stays as it is. A recorded command keeps its shape and changes only the renamed names inside it, so the docker/`du` lines name the container, image and cache path that the same command now produces. No sentence is added about the rename.

### Targets

- `docs/retrieval-eval-results.md`

**Work:**

- [ ] **Inside `<!-- eval:generated:start -->` … the generated end marker.** Change each "`AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` was unset for this run" line to `DEVSCENE_RETRIEVAL_STUB`. Change each "Backend `python`: `harness-docs-retrieval serve-http`" line to `devscene-docs-retrieval`. Change any `harness_docs_retrieval` path the region carries, so that it matches `results.mjs` as Task 8 leaves it.
- [ ] **The recorded sections below the region.** Rename every remaining hit:
  - the `DEVSCENE_RETRIEVAL_LOG` table rows;
  - the `harness-docs` server in the stdio-timeout note, the version table and the `system/init` rows;
  - `mcp__devscene-docs__search_docs`;
  - package and module paths;
  - `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL` / `…_TEST_DATABASE_URL`, including the two recorded `bash scripts/python-service.sh test …` command lines, whose URLs become `postgresql://devscene:devscene@127.0.0.1:5432/docs_retrieval`;
  - the container, image and cache paths in the `docker exec` / `docker image ls` / `du -sh` records;
  - the two `psql -U harness` commands, which become `-U devscene`.

**Verification:**

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|-U harness' -- docs/retrieval-eval-results.md` returns no hits.
- `git diff --numstat -- docs/retrieval-eval-results.md` shows equal insertions and deletions, so only lines were rewritten and none were added or dropped. `git diff -U0 -- docs/retrieval-eval-results.md` shows no changed digit in any figure.
- Each generated-region line this task changed is, byte for byte, a line `evals/docs-retrieval/results.mjs` now emits. The stub line is emitted as `` `- \`${RETRIEVAL_STUB_ENV}\` was unset for this run, …` `` with `RETRIEVAL_STUB_ENV` = `DEVSCENE_RETRIEVAL_STUB` (Task 1). The `serve-http` and `search.py` lines are literals in that file after Task 8: check each with `git grep -nF` for its distinctive substring.
