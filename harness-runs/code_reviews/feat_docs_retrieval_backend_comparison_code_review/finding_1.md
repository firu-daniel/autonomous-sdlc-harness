### 1. The BM25 probe behind arm B's identified cause has no recorded command

**File:** `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Divergence sources, in the order checked`, item 3, the bullet beginning "**The probe.** It ran that `ORDER BY` with the score selected, top 8 per query"

**Problem.** `### Which case this is` names two identified differences, and the first one rests on this probe: arm B's divergence *"is the Python index's history in its database (divergence source (3))"*. Acceptance 2 requires every identified cause to be backed by a measurement. `.claude/context/conventions.md` → `## Documents of record` requires a measured fact to state *"what was measured, the command and the exact message"*.

The bullet gives the result and the per-query scores. It does not give the command. The probe ran from `harness-runs/scratch/t10-bm25-probe.mjs`, which `.gitignore` excludes (`harness-runs/scratch/*`). So nothing committed lets anyone re-run it: not the SQL with the score selected, not the `EXPLAIN` / `extversion` / `version()` reads behind the configuration bullet, and not how the "database created empty for the probe" state was made. Every other launcher-entered measurement in this section (the comparison, the vector agreement) has its launcher in `docs/retrieval-eval.md` → `### Writing the comparison up`. This is the one identified cause that cannot be reproduced. It is also the one the follow-up branch named in the **Finding — a defect** paragraph must start from.

**Fix.** Edit only `docs/retrieval-eval-results.md`, in the item 3 **The probe.** bullet. Keep its existing sentences. Directly after them, add the statements and the setup below as nested content of that bullet, indented to match. The values are read off `harness-runs/scratch/t10-bm25-probe.mjs`, which exists in this worktree. Open it to confirm them before writing.

- [ ] Add this paragraph: *"Each query of `evals/docs-retrieval/queries/fixture-catalog.jsonl` was run as the statement below, with the query text in place of `<query>`. On the first query the same statement was also run under `EXPLAIN`, beside `SELECT extversion FROM pg_extension WHERE extname='pg_textsearch'` and `SELECT version()`:"*, then a fenced block holding exactly:

  ```
  SELECT id, key, round((text <@> to_bm25query($q$<query>$q$, 'chunks_bm25'))::numeric, 6) AS s FROM chunks ORDER BY text <@> to_bm25query($q$<query>$q$, 'chunks_bm25') LIMIT 8
  ```

- [ ] Add one paragraph per side:
  - *"TypeScript: `evals/docs-retrieval/index-build.mjs` → `buildIndex` over `fixture-catalog` into a temporary data directory, closed, then reopened with `PGlite.create({ dataDir, extensions: { vector, pg_textsearch } })` (each extension loaded through `cli/dist/retrieval/runtime.js` → `loadRetrievalModule`), and the statements run on it."*
  - *"Python: `evals/docs-retrieval/python-backend.mjs` → `indexPythonCorpus` over an `evals/docs-retrieval/mirror-fixture.mjs` mirror of `fixture-catalog`, and the statements run through `docker compose exec -T postgres psql -At -F ' ' -c <statement>` from `docs-retrieval-service/`, with the user and database of `PYTHON_DEFAULT_DATABASE_URL`. For the first state, that was the compose database as the hand run left it. For the second, a database was made with `CREATE DATABASE <name>` on the same server, selected for the index run by setting `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` to the compose URL with that database name, and dropped with `DROP DATABASE IF EXISTS <name>` afterwards."*
- [ ] Add one sentence saying the probe was a scratch launcher run in a session and is deterministic, as the bullet **What was taken in a session.** in `### What was compared, and through what` already says.

Do not change any figure or the conclusions in the bullets around it. This is a documentation-only fix, so no test runs.

**Deviations from plan:**
- The setup lines were added after the bullet's nested two-state list rather than between "in two states:" and that list, so the colon still introduces the states.
- The second-state sentence adds "after a `DROP DATABASE IF EXISTS <name>`": `t10-bm25-probe.mjs` drops the name before `CREATE DATABASE` as well as afterwards.
- **What was taken in a session.** says "not a wall-clock figure", not "deterministic"; the closing sentence cites the bullet for the session fact and scopes the determinism to a given database state, since the first state's scores depend on database history.
