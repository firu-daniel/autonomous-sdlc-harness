### Task 5 — Add the three `retrieval-python-*` doctor checks and make the TypeScript three not applicable under the Python backend

**Goal:** Give `doctor` the Python backend's three answers in the posture of the existing three (`cli/src/doctor/checks.ts` → `RETRIEVAL_DEPENDENCIES_CHECK`, `RETRIEVAL_MODEL_CACHE_CHECK`, `RETRIEVAL_INDEX_CHECK`):

- `retrieval-python-dependencies`: the interpreter and packages resolve;
- `retrieval-python-model-cache`: the weights are present;
- `retrieval-python-index`: an index builds.

All three are graded from **one** run of the package's own `harness-docs-retrieval self-check`, never re-derived. They pass with a "not applicable" sentence whenever the Python backend is not selected, so `doctor` stays fast and quiet for everyone else. And the three TypeScript checks become not applicable when it **is** selected.

**Depends on:**

- Task 1, which exports from `cli/src/config/model.ts` `retrievalApplies` (unchanged), `retrievalBackend(config): HarnessRetrievalBackend` and `pythonRetrievalApplies(config): boolean` (`retrievalApplies && backend === 'python'`).
- Task 2, which exports from `cli/src/retrieval/pythonBackend.ts`:
  - `PYTHON_RETRIEVAL_COMMAND`, `PYTHON_SELF_CHECK_SUB_COMMAND`, `PYTHON_FETCH_MODELS_SUB_COMMAND` (`'fetch-models'`) and `PYTHON_DATABASE_URL_VARIABLE`;
  - `parseSelfCheck(stdout): ReadonlyMap<'packages' | 'weights' | 'index', { question; ok; detail }> | undefined`;
  - `pythonDatabaseUrl(serverEnv: unknown): string`, the `.mcp.json` `env` value when non-empty, else the compose default;
  - `launcherSearchPath(inherited: string, home: string | undefined): string`.

**Where this task stops.** This task writes the checks and their header and docs comments. Their behavioural tests, every state of all six retrieval checks, are **Task 6's**. `docs/cli.md` §7 is **Task 14's**. Nothing here installs, downloads or repairs.

### Targets

- `cli/src/doctor/checks.ts`

**Work:**

- [ ] The two not-applicable sentences, beside `RETRIEVAL_OFF`, which stays byte-identical:
  - `PYTHON_NOT_SELECTED`: retrieval is on with `docs.retrievalBackend` not `python`, so the launcher starts the TypeScript runtime and nothing of the Python backend is expected or checked.
  - `TYPESCRIPT_NOT_SELECTED`: `docs.retrievalBackend` is `python`, so the launcher starts the Python backend rather than this runtime and it is not graded. `init` still installs it, so switching back costs nothing.

  In each of the three TypeScript checks, insert `if (pythonRetrievalApplies(ctx.config)) return pass(TYPESCRIPT_NOT_SELECTED);` immediately after the existing `retrievalApplies` line. Every other line of those checks stays as it is.
- [ ] One memoised probe, `pythonSelfCheck(ctx)`, cached per `CheckContext` in a module-level `WeakMap`, so the three checks share one child process. It returns one of three outcomes:
  - `{ kind: 'unresolved', searched }` when `PYTHON_RETRIEVAL_COMMAND` is not found on `launcherSearchPath(process.env.PATH ?? '', process.env.HOME)`. Resolve it with the module's own `locateOnPath`.
  - `{ kind: 'answered', lines }`, with `lines` from `parseSelfCheck`.
  - `{ kind: 'unreadable', text }` when the exit or output is unparseable.

  It runs `spawnSync(<resolved path>, [PYTHON_SELF_CHECK_SUB_COMMAND, '--repo', ctx.repoRoot])` with a fixed argument vector, `stdio: ['ignore','pipe','pipe']` and `RETRIEVAL_INDEX_TIMEOUT_MS`. Its env is `process.env` overlaid by the string entries of the `harness-docs` server's `env` object in the repository's `.mcp.json`, read with the module's existing `readJsonFile` / `SERVERS_KEY`, with the key imported as `DOCS_SERVER_NAME` from `cli/src/retrieval/server.ts` as `generators/repoRoot.ts` does. On top of that it sets `PYTHON_DATABASE_URL_VARIABLE` to `pythonDatabaseUrl(thatEnv)`, so a shell export is overridden. A doc comment argues `spawnSync` over `execFileSync` (`self-check` exits 1 with its answer on stdout) and the env rule.
- [ ] `RETRIEVAL_PYTHON_DEPENDENCIES_CHECK`, id `retrieval-python-dependencies`, title `RAG's Python backend resolves`. Its gates are the same `unevaluated` lines, then `!retrievalApplies` → `pass(RETRIEVAL_OFF)`, then `!pythonRetrievalApplies` → `pass(PYTHON_NOT_SELECTED)`. Then:
  - `unresolved` → fail: `${PYTHON_RETRIEVAL_COMMAND}` does not resolve on the launcher's `PATH` (the name interpolated from the import, never a literal), so the search server never starts; install the package with its `models` extra (`docs/retrieval.md` → `## Turning on the Python backend`).
  - `unreadable` → fail naming the text and that the package's `self-check` answered in a shape this CLI cannot grade.
  - `packages` ok → pass with its detail.
  - `packages` FAIL → fail with its detail and the same install remedy.
- [ ] `RETRIEVAL_PYTHON_MODEL_CACHE_CHECK` (`retrieval-python-model-cache`, `RAG's Python backend weights are cached`) and `RETRIEVAL_PYTHON_INDEX_CHECK` (`retrieval-python-index`, `the RAG Python backend's index builds`) have the same gates.
  - `unresolved` or `unreadable` → fail `cannot be checked without the Python backend (see retrieval-python-dependencies)`.
  - `weights` FAIL → fail with its detail plus `run ${PYTHON_RETRIEVAL_COMMAND} ${PYTHON_FETCH_MODELS_SUB_COMMAND} where an operator is present`, built from the two imports rather than literals.
  - `index` FAIL → fail with its detail plus a remedy naming the database URL in use (credentials elided by `pythonDatabaseUrl`'s caller: print host, port and database, never the password), `docker compose up -d --wait postgres` and the `.mcp.json` `env` override.
  - `index` `not attempted, because …` → fail `cannot build without … (see retrieval-python-<that check>)`.
  - Register all three in `CHECKS` immediately after the three TypeScript checks.
- [ ] Module header and `CHECKS` doc comment:
  - choice 3's docs-retrieval paragraph gains the Python three: one shared child running the package's own `self-check`, no launch.
  - **What this module deliberately does not do** → **It writes nothing** gains the stated exception: `retrieval-python-index` refreshes the Python backend's index **in its database**, because `self-check`'s `index` question builds it there, which is the same write the server's first query makes. It writes nothing in the repository or the machine cache.
  - The `CHECKS` comment's last paragraph says the Python three follow the TypeScript three, in the same runtime → models → index order.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- The three TypeScript checks' existing messages are unchanged: `git diff dev...HEAD -- cli/src/doctor/checks.ts` shows no edit to `RETRIEVAL_OFF` or to any existing `fail(`/`pass(` string.
- `git grep -n "harness-docs-retrieval\|fetch-models" -- cli/src/doctor/checks.ts` matches doc comments only: every message names the command and sub-command through Task 2's constants.
- No password reaches a check's text: the `index` remedy is built from the URL's host, port and database alone.
- Run the compiled `doctor` once by hand against a throwaway retrieval-on fixture under the system temp directory, never this checkout, with `docs.retrievalBackend: "python"` and no `harness-docs-retrieval` on `PATH`. Confirm the three `retrieval-python-*` lines fail as stated and the three TypeScript lines pass not applicable. Every state is asserted behaviourally by Task 6, which drives the same compiled `doctor` end to end.
