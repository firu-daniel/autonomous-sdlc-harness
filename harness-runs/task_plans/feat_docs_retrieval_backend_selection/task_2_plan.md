### Task 2 — Add `cli/src/retrieval/pythonBackend.ts`, the one owner of the Python backend's names, default URL and `self-check` parser

**Goal:** One module owns every fact about the Python backend that both the launcher (Task 4) and `doctor` (Task 5) need, so the two cannot disagree: the console script's name, its two sub-commands, the database variable, the default connection string, the launcher's new exit code, the `self-check` line contract and the launcher's `PATH` fallback list. Each fact that a shell template or the Python package also holds is declared as a mirror in this module's header, the way `cli/src/retrieval/runtime.ts`'s header declares the launcher's mirrors and `cli/src/machine/registry.ts` declares `MACHINE_REGISTRY_FILENAME`.

**Where this task stops.** This module spawns nothing, reads no file and imports no retrieval peer. It is pure data and pure functions, so `cli/test/retrieval-loading.test.mjs`'s guarantees are untouched. The launcher body is **Task 4's**, and Task 4 asserts its literals equal these constants. The checks that call `parseSelfCheck` and `pythonDatabaseUrl` are **Task 5's**.

### Targets

- `cli/src/retrieval/pythonBackend.ts` (new)
- `cli/test/retrieval-python-backend.test.mjs` (new)

**Work:**

- [ ] Module header: what it owns, *"The rule this module exists to enforce: every name the Python backend is reached by is spelled here once, and each copy outside the compiler is a declared mirror."*, and a **MIRRORS** block naming each copy:
  - `cli/templates/scripts/docs-search-server.sh` holds the command, `serve-mcp`, the variable, the default URL and exit `3`;
  - `docs-retrieval-service/compose.yaml` → `postgres` holds the user, password, database and port inside the default URL;
  - `docs-retrieval-service/src/harness_docs_retrieval/self_check.py` holds `SELF_CHECK_QUESTIONS` and `CheckLine.render`;
  - `docs-retrieval-service/src/harness_docs_retrieval/store.py` holds `DATABASE_URL_ENV`;
  - `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_path_with_fallbacks` holds the fallback list.
- [ ] Exports, exactly:
  - `PYTHON_RETRIEVAL_COMMAND = 'harness-docs-retrieval'`
  - `PYTHON_SERVE_SUB_COMMAND = 'serve-mcp'`
  - `PYTHON_SELF_CHECK_SUB_COMMAND = 'self-check'`
  - `PYTHON_FETCH_MODELS_SUB_COMMAND = 'fetch-models'`, the sub-command `doctor`'s weights remedy names (Task 5)
  - `PYTHON_DATABASE_URL_VARIABLE = 'HARNESS_DOCS_RETRIEVAL_DATABASE_URL'`
  - `PYTHON_DEFAULT_DATABASE_URL = 'postgresql://harness:harness@127.0.0.1:5432/docs_retrieval'`, whose comment says the credentials are the compose file's throwaway loopback values and never a real secret
  - `PYTHON_BACKEND_UNAVAILABLE_EXIT = 3`
  - `SELF_CHECK_QUESTIONS = ['packages', 'weights', 'index'] as const` with `type SelfCheckQuestion`
- [ ] `export interface SelfCheckLine { readonly question: SelfCheckQuestion; readonly ok: boolean; readonly detail: string }` and `export function parseSelfCheck(stdout: string): ReadonlyMap<SelfCheckQuestion, SelfCheckLine> | undefined`. It answers `undefined` unless the non-empty stdout lines are **exactly three**, in `SELF_CHECK_QUESTIONS` order, each matching `ok   <q>: <detail>` (three spaces) or `FAIL <q>: <detail>`. A shape the parser cannot read is reported by the caller, never guessed at.
- [ ] Two resolution helpers:
  - `export function pythonDatabaseUrl(serverEnv: unknown): string` returns `serverEnv[PYTHON_DATABASE_URL_VARIABLE]` when `serverEnv` is an object holding a non-empty string there, else `PYTHON_DEFAULT_DATABASE_URL`. Its doc comment states that a shell export is deliberately not consulted, because the agent runner never passes one to the server (`docs/retrieval.md` → **How the variable reaches the server, since an export does not.**).
  - `export const LAUNCHER_PATH_FALLBACKS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'] as const` and `export function launcherSearchPath(inherited: string, home: string | undefined): string`. The function reproduces `hr_path_with_fallbacks`: the inherited entries kept, each fallback not already present appended, then `<home>/.local/bin` when `home` is non-empty and not present.
- [ ] `retrieval-python-backend.test.mjs`, importing from `cli/dist/retrieval/pythonBackend.js` and opening with the rule it enforces:
  - `parseSelfCheck` accepts the all-`ok` shape, a `FAIL` on each question, and the `index: not attempted, because packages failed` line;
  - it answers `undefined` for two lines, four lines, reordered questions, an unknown question and a missing prefix;
  - `pythonDatabaseUrl` answers the default for `undefined`, `{}`, `{ VAR: '' }` and a non-string, and the value for a non-empty string;
  - `launcherSearchPath('', home)` equals the stdout of `hr_path_with_fallbacks` sourced from `cli/templates/scripts/lib/harness-run-lib.sh` with `PATH=` and `HOME=home`. Spawn it as `execFile('/bin/bash', ['-c', '. "$1"; hr_path_with_fallbacks', '_', <absolute path of cli/templates/scripts/lib/harness-run-lib.sh>], { env: { PATH: '', HOME: home } })`, **`/bin/bash` by absolute path**, the form `cli/test/outer-loop-scripts.test.mjs` → `sourceAndCallWithEnv` uses. Do **not** use `runBash` from `cli/test/helpers/fixture.mjs`: it spawns a bare `bash`, which does not resolve under an empty `PATH`, so the call would fail at spawn before the library is reached (`sourceAndCallWithEnv`'s doc comment records this trap). A second case with a non-empty inherited `PATH` uses the same `/bin/bash` form and compares the same way.

**Verification:**

- `npm test -- test/retrieval-python-backend.test.mjs` from `cli/` passes.
- `git grep -n "harness-docs-retrieval\|HARNESS_DOCS_RETRIEVAL_DATABASE_URL" -- cli/src` matches only `pythonBackend.ts` and doc comments. With no trailing quote it also catches a mid-string copy, so every other `cli/src` use, including a message that names the value to a reader, imports the constant.
- The module has no `import` of a retrieval peer and no `node:child_process` / `node:fs` import.
