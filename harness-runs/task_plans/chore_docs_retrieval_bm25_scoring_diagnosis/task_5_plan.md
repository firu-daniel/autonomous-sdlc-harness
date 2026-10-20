### Task 5 — Add the refresh-level module that measures the candidate end-state rule on both backends

**Goal:** Ship `evals/docs-retrieval/bm25-refresh-rule.mjs`, which measures goal 5's candidate end-state rule at refresh level, through each backend's own refresh, while the shipped code is still unfixed. The rule, from the task prompt:

- after a refresh that left a dead row, `REINDEX INDEX chunks_bm25`;
- after any other refresh that changed something, `bm25_spill_index('chunks_bm25')`;
- the first `docs index` build ends in the same state.

The module applies the rule's statement **by hand** after each refresh, since the code does not yet issue it. It reads the `scan` and `operator` columns before and after, and compares both with freshly built indexes of the final corpus. The before readings are goal 5's before-fix figures. This task changes no shipped behaviour and records no figure; Task 6 runs it.

**Depends on:** Task 1. It imports these from `evals/docs-retrieval/bm25-history.mjs` exactly as Task 1 exports them, and copies none of them:

- `openPgliteEngine({ dataDir })`: with `dataDir` given it opens that directory and never removes it. It returns `{ name: 'pglite', run, timed, reopen, close }`.
- `openPostgresEngine(repoRoot, { database, create })`: with `create: true` it drops, creates and, on `close`, drops `database`. With `create: false` it attaches only. It returns `{ name: 'postgres', run, timed, close }`.
- `spillAvailable(engine)`: a boolean, from `pg_proc`.
- `BM25_HISTORY_STATEMENTS`, including `spill` and `reindex`.
- `readIndexState(engine, queries, { limit, keys })`: returns `{ summary, plans: { probe, store }, scores, forced, diagnostics }`. `forced` is present only when the probe's plan was not the `chunks_bm25` index scan.
- `differencesByColumn(reference, scores, keys)` and `SCORE_COLUMNS` (`['scan', 'operator']`).
- `renderIndexState(id, label, state)`.

It also uses, unchanged, these:

- `evals/docs-retrieval/mirror-fixture.mjs` → `buildMirrorFixture`, `removeMirrorFixture`;
- `evals/docs-retrieval/corpora.mjs` → `corpusConfig`, `BUILT_IN_CORPORA`;
- `evals/docs-retrieval/queries.mjs` → `loadQueries`;
- `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable`;
- `evals/docs-retrieval/python-backend.mjs` → `assertPythonBackendAvailable`, `indexPythonCorpus`;
- `cli/dist/retrieval/models.js` → `resolveModels`;
- `cli/dist/retrieval/store.js` → `openPgliteStore`;
- `cli/dist/retrieval/refresh.js` → `refreshIndex`;
- `cli/dist/retrieval/pythonBackend.js` → `PYTHON_DEFAULT_DATABASE_URL`, `PYTHON_DATABASE_URL_VARIABLE`.

**Where this task stops.** It writes the module and its `evals/docs-retrieval/README.md` row. The procedure paragraph in `docs/retrieval-eval.md` and every recorded figure are **Task 6's**. `evals/docs-retrieval/python-backend.mjs`, `bm25-history.mjs` and everything under `cli/src/` and `docs-retrieval-service/src/` are read and not edited.

### Targets

- `evals/docs-retrieval/bm25-refresh-rule.mjs` (new).
- `evals/docs-retrieval/README.md` → `## The modules`: a `bm25-refresh-rule.mjs` row, beside Task 1's `bm25-history.mjs` row.

**The module's surface, which Task 6 consumes.**

- `measureRefreshRule({ checkout, backend, corpusA, corpusB })` measures one backend over one pair. `backend` is `'typescript'` or `'python'`. `corpusA` and `corpusB` are distinct members of `BUILT_IN_CORPORA`.
- `renderRefreshRule(result, { withScores })` renders its output. `runRefreshRuleLauncher(argv)` accepts `--backend`, `--corpus` (A), `--other` (B) and `--capture <repo-relative path>`.
- Capture `score` lines use Task 1's format, `score <step> <qid> <key> <scan> <operator> <scanRaw> <operatorRaw>`, with step ids `<scenario>.before`, `<scenario>.after` and `reference-<form>.<corpus variant>`. So two captures of one run compare through the existing `--compare` of the `bm25-history.mjs` launcher.

**Work:**

- [ ] **Scenario fixtures.**
  - Build each corpus's mirror with `buildMirrorFixture(checkout, corpusConfig({ repoRoot: checkout, corpus }))`. Refuse by name when a key is in both corpora.
  - Define `F` as the last entry of A's mirror `files`, and name it in the output.
  - Mutate only the module's own mirror: remove `F` with a single-file `rmSync` (never recursive); add it back with `copyFileSync` from the resolved corpus root; edit it by appending one fixed paragraph, then restore it by copying back.
  - The scenarios, each in its own store, are `fresh` (empty → A), `other-corpus` (B → A), `file-added` (A without `F` → A), `file-edited` (A with `F` edited → A), `file-removed` (A → A without `F`) and `unchanged` (A → A).
  - Every mirror is removed on every exit path, failure included (`harness-runs/lessons.md` → `## Remote and branch-scoped operations`, the temporary-copy rule).
- [ ] **Backend drivers.**
  - **TypeScript.** Call `assertRealModelsAreAvailable()`, and resolve the embedder once with `resolveModels({ allowRemote: false })`. Each refresh is `openPgliteStore({ dataDir, dimensions })`, then `refreshIndex({ repoRoot: mirror.dir, config: mirror.config, store, embedder })`, then `store.close()`. That is what `docs index` does through `openRetrieval`, and it never holds the store open across a reading. Each scenario gets its own temporary `dataDir` under the system temp directory, removed on every exit path.
  - **Python.** Call `assertPythonBackendAvailable` first. Each scenario gets its own database `bm25_refresh_rule_<scenario>` (references: `bm25_refresh_rule_reference_<variant>`), through `openPostgresEngine(checkout, { database, create: true })` and dropped on every exit path. Each refresh is `indexPythonCorpus({ checkout, fixtureDir })`, with `process.env[PYTHON_DATABASE_URL_VARIABLE]` set for that call alone. Its value is `PYTHON_DEFAULT_DATABASE_URL` with the database name replaced, and the previous value is restored in a `finally`. Refuse by name when that variable was already set to anything else, because the readings go through the compose server's `psql`. The URL is never printed.
  - **Both backends.** Read `SELECT key, hash FROM chunks` before and after each scenario's last refresh, so the rule's decision rests on stored state.
- [ ] **The rule, and the references.**
  - Export `endStateRule({ deleted, rebuilt, embedded, updatedExisting })`, where `updatedExisting` is the number of keys present before and after with a different hash. It returns `'reindex'` when `deleted > 0 || rebuilt || updatedExisting > 0`, `'spill'` when `embedded > 0`, and `'none'` otherwise. The output states each decision with its inputs.
  - Apply the decision through an engine opened on the scenario's store: `openPgliteEngine({ dataDir })` or `openPostgresEngine(checkout, { database, create: false })`. Issue `BM25_HISTORY_STATEMENTS.reindex` or `.spill`. When `spillAvailable(engine)` is false, issue nothing and state `bm25_spill_index not available on <engine>; the state is the one the reading's open leaves`.
  - **References.** For each final-corpus variant (A, and A without `F`), take a fresh build into an empty store and read it three ways:
    - `reference-insert.<variant>`, as left;
    - `reference-spill.<variant>`, after the spill statement;
    - `reference-reindex.<variant>`, after `REINDEX`.

    The `fresh` scenario is the A variant's build, and its `after` is the rule's first-build state.
- [ ] **Readings and comparisons.**
  - Each scenario is read with `readIndexState` twice: `before`, right after the refresh, and `after`, after the rule's statement or with "no statement" for `'none'`. Use A's query set, `limit` = the final corpus's chunk count, and `keys` = the final corpus's keys.
  - On PGlite every reading opens the data directory again, after the store closed. The output labels each PGlite `before` as **read after a reopen**, because no route reads the store's own instance.
  - Print `differencesByColumn` against each of the three references, per column, with the first three differing hits and both values. Use the `forced` scores, labelled, wherever the probe plan was not the index scan.
  - Print each reading's `plans.store` line, so a plan the rule's statement flips shows. That is the store's own `LIMIT 50` statement.
  - Print through `renderIndexState`.
  - Measure no time anywhere in the module.
- [ ] **Launcher, header and README.**
  - `runRefreshRuleLauncher` refuses an unknown flag, a missing `--backend`, `--corpus` or `--other`, and `--corpus` equal to `--other`, each by name.
  - The module header states the rule this module exists to enforce: the rule's statements are issued by hand because the code is unfixed. Every reading is compared against fresh builds of the final corpus taken in the same run and never against a remembered figure, and every mirror, data directory and database it creates is removed on every exit path.
  - The README row says what the module owns and that `docs/retrieval-eval.md` gives its launcher.

**Verification:**

- One smoke run per backend over `fixture-catalog` against `self-docs` completes. The launcher is a file `harness-runs/scratch/bm25-refresh-rule.mjs` importing `runRefreshRuleLauncher` and calling it with `process.argv.slice(2)`. Each run prints every scenario's refresh line, the rule's decision with its inputs, both readings' plans and diagnostics, and the counts against all three references. Its output is recorded nowhere. If the Python leg's preconditions refuse as not provisioned, run `bash scripts/python-service.sh sync --with-models` once. If the weight cache is missing, stop and report it, and never fetch weights.
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend typescript --corpus fixture-catalog --other self-docs
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-refresh-rule.mjs --backend python --corpus fixture-catalog --other self-docs
  ```
- After each smoke run, the compose server lists no database whose name begins with `bm25_refresh_rule`. The probe's own `psql` route, or `\l` through `docker compose exec -T postgres psql` from `docs-retrieval-service/`, shows the list. No `harness-eval-mirror-` directory the run created remains under the system temp directory.
- `grep -nE 'enable_indexscan|performance\.now' evals/docs-retrieval/bm25-refresh-rule.mjs` finds nothing. `grep -n 'from .\./bm25-history.mjs' evals/docs-retrieval/bm25-refresh-rule.mjs` finds the import, and the module defines no `scoreAll`, `parseSummary` or engine opener of its own.
- A refresh result of `{ deleted: 0, rebuilt: false, embedded: 0, updatedExisting: 0 }` gives `endStateRule` `'none'`. `{ deleted: 0, embedded: 3, updatedExisting: 0 }` gives `'spill'`, and `{ deleted: 0, embedded: 3, updatedExisting: 1 }` gives `'reindex'`. Check these with a one-off call from a scratch launcher.

**Deviations from plan:**

- `indexPythonCorpus` (`evals/docs-retrieval/python-backend.mjs`, read-only for this task) returns no `rebuilt`: its `INDEX_LINE` matches the `; rebuilt for a new embedder` clause without capturing it. On the Python backend the rule's `rebuilt` input is taken as `false`, and every Python refresh line says `rebuilt not reported by indexPythonCorpus, taken as false`. No scenario changes the embedder, so no scenario's decision rests on it. The TypeScript backend reads `RefreshResult.rebuilt`.
- Each `after` reading is taken through the engine that issued the rule's statement, in the same instance, after the store closed; on PGlite that engine is itself a reopen of the data directory. `reference-insert.full` is the `fresh.before` reading, as the plan's "The `fresh` scenario is the A variant's build" states, and `reference-spill.full` / `reference-reindex.full` are read on the same store after `fresh.after`.
- The smoke runs did not pass `--capture`; the capture's `score` lines are emitted in the probe's seven-field format, which the smoke runs did not exercise through `--compare`.
