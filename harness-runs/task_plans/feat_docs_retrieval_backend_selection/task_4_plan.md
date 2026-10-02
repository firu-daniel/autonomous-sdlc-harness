### Task 4 — Route `docs-search-server.sh` on the key, with the new exit `3`

**Goal:** Make the launcher `.mcp.json` already starts read `docs.retrievalBackend` at run time — **only where retrieval applies** (`phases.docs` and `docs.retrieval` both `true`), the task prompt's deliverable 1 (*"this key is read only inside that"*). With the gate closed it takes today's TypeScript `exec` unchanged whatever the key holds: `.mcp.json`'s `harness-docs` entry outlives turning retrieval off, because `init` merges `.mcp.json` and removes nothing (`cli/src/generators/repoRoot.ts`), so the launcher can run in that state. With the gate open and `typescript` or the key absent, it `exec`s the machine-shared runtime's `docs serve`, byte-for-byte the behaviour it has today. With `python`, it starts the Python package's stdio server. Its exit contract gains the new failure mode: exit `3`, reported on stderr, when the Python backend is selected but cannot serve. **The routing lives here and nowhere else.** Server name, tool name and permission string are the same whichever backend answers, so `cli/templates/repo/mcp.retrieval.json`, `cli/templates/claude/settings.autonomous*.json` and every file under `plugin/` stay unchanged.

**Depends on:**

- Task 3, which adds two readers to `cli/templates/scripts/lib/harness-run-lib.sh`:
  - `hr_docs_retrieval_applies <root>` — prints nothing; status 0 when `phases.docs` and `docs.retrieval` are both `true`, 1 when either is `false` or unset, 2 when the configuration is unresolvable or either value is not a boolean;
  - `hr_docs_retrieval_backend <root>` — prints `typescript` or `python` with status 0 (absent → `typescript`) and returns 2, printing nothing, on an unresolvable configuration or an out-of-enum value. Called only after the gate answered 0.
- Task 2, which owns the literals this file mirrors in `cli/src/retrieval/pythonBackend.ts`: `PYTHON_RETRIEVAL_COMMAND = 'harness-docs-retrieval'`, `PYTHON_SERVE_SUB_COMMAND = 'serve-mcp'`, `PYTHON_DATABASE_URL_VARIABLE = 'HARNESS_DOCS_RETRIEVAL_DATABASE_URL'`, `PYTHON_DEFAULT_DATABASE_URL = 'postgresql://harness:harness@127.0.0.1:5432/docs_retrieval'` and `PYTHON_BACKEND_UNAVAILABLE_EXIT = 3`.

**Where this task stops.** The launcher checks no database and runs no `self-check`. Grading the backend's prerequisites is `doctor`'s (Task 5). A pre-flight here would move a cold index build into server start-up. The launcher only reports a failure the server already reported.

### Targets

- `cli/templates/scripts/docs-search-server.sh`
- `cli/test/outer-loop-scripts.test.mjs`

**Work:**

- [ ] Routing, after the existing `PATH` settle and `hr_repo_root`:
  - call `hr_config_load "$root"`:
    - status 1 (no `harness.config.json`) → the TypeScript branch, silently, exactly as today;
    - status 2 (unresolvable, e.g. no `jq`) → the TypeScript branch, after **one** stderr line saying the configuration could not be read and the default backend was taken;
  - otherwise ask the gate, `hr_docs_retrieval_applies "$root"`: status 1 or 2 → the TypeScript branch, silently, **without reading `docs.retrievalBackend`** — so a `python` or out-of-enum value left behind with retrieval off changes nothing, and the TypeScript runtime refuses for itself where retrieval is off, as it does today;
  - only on gate status 0, take the backend from `hr_docs_retrieval_backend "$root"`, where status 2 (a value outside the enum) exits `1` with a stderr line naming the key, the two legal values and `npx autonomous-sdlc-harness doctor`.
  - The TypeScript branch is today's body unchanged: cache dir, entry test, `exec node "$entry" docs serve --cwd "$root"`.
- [ ] Python branch:
  - if `command -v harness-docs-retrieval` fails, exit `3`. The stderr line says the Python backend is selected but `harness-docs-retrieval` does not resolve on `PATH` (interpreter or package missing), and names `docs/retrieval.md` and `npx autonomous-sdlc-harness doctor`.
  - Export `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` set to the default URL **only when** the inherited value is unset or empty.
  - Run `harness-docs-retrieval serve-mcp --repo "$root"` **as a child, not `exec`**, keeping stdin explicitly (`<&0`, because a background job's stdin is otherwise `/dev/null`). Forward `TERM` and `INT` to it with a `trap`, and `wait` again after a trapped signal so the real status is collected. Write it for bash 3.2.
  - Child status 0 → exit 0. Any other status → one stderr line: the Python backend exited with status `N` before or while serving, the line above names why (the server prints `harness-docs-retrieval: …`), run `npx autonomous-sdlc-harness doctor`. Then exit `3`.
  - Nothing reaches stdout in either branch.
- [ ] Rewrite the header:
  - the opening line and **THE RUNTIME IS THE ONLY THING THIS RUNS** become a **WHICH SERVER** paragraph: two backends, chosen by `docs.retrievalBackend` read at run time, with no fallback between them. The paragraph states the gate: the key is read **only when** `phases.docs` and `docs.retrieval` are both `true` (`hr_docs_retrieval_applies`, the shell mirror of `retrievalApplies`); with the gate closed the TypeScript runtime is `exec`ed whatever the key holds;
  - a paragraph on **why the Python branch is not `exec`ed**: the new exit could not otherwise be reported, and signals are forwarded so the runner's shutdown still reaches the server;
  - the **MIRRORS** block gains the five Task 2 constants, owned by `cli/src/retrieval/pythonBackend.ts`;
  - the **Exit contract** gains `1` for an out-of-enum value and `3` for the Python backend selected but unable to serve, and `N` stays the TypeScript `exec`'s status.
- [ ] `outer-loop-scripts.test.mjs`: keep the existing two launcher cases unchanged, and add the following. The fake `harness-docs-retrieval` is an executable written by the test into a temp directory placed first on `PATH`, with `HOME` pointed at a temp directory so `~/.local/bin` cannot supply a real one. It writes its argv and `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` as JSON to **stderr** and exits with a status the case chooses.
  - Every case below that selects a backend writes `phases.docs: true` and `docs.retrieval: true`, so the gate is open; the gate-closed case says otherwise.
  - With `"python"` and `docs.retrieval: false` (`phases.docs: true`), the launcher execs the planted runtime with `['docs', 'serve', '--cwd', dir]`, and the fake `harness-docs-retrieval` — present first on `PATH` — is never invoked: its stderr JSON line is absent.
  - With `"typescript"` written explicitly, the launcher execs the planted runtime with `['docs', 'serve', '--cwd', dir]`, as the existing key-absent case does.
  - With `"python"`, the fake receives `['serve-mcp', '--repo', dir]` and the default URL, and the launcher exits 0 with empty stdout.
  - With `"python"` and `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` set in the launcher's environment, the fake receives that value unchanged.
  - With `"python"` and no fake on `PATH`, the launcher exits 3 with empty stdout, and stderr names `harness-docs-retrieval` and `doctor`.
  - With `"python"` and a fake that prints `harness-docs-retrieval: could not connect …` and exits 1, the launcher exits 3, and stderr carries both lines.
  - With `"java"`, the launcher exits 1, and stderr names `docs.retrievalBackend`.
- [ ] `outer-loop-scripts.test.mjs`: a mirror case. Read the launcher template's text and assert it contains each Task 2 literal, imported from `cli/dist/retrieval/pythonBackend.js` and never retyped: the command, the sub-command, the variable, the default URL and `exit ${PYTHON_BACKEND_UNAVAILABLE_EXIT}`.

**Verification:**

- `npm test -- test/outer-loop-scripts.test.mjs` from `cli/` passes. Every launcher case asserts an empty stdout.
- `bash -n cli/templates/scripts/docs-search-server.sh` exits 0, and the file still opens `#!/usr/bin/env bash` with `set -euo pipefail`.
- `git diff --stat dev...HEAD -- cli/templates/repo/mcp.retrieval.json cli/templates/claude plugin` prints nothing (Acceptance 6).
- The end-to-end path through this launcher, an MCP client calling `search_docs` on the Python backend, is exercised by Task 10's container case.

**Deviations from plan:**

- `bash -n cli/templates/scripts/docs-search-server.sh` was refused by the permission layer and not run. The syntax claim rests on execution instead: every launcher case in `npm test -- test/outer-loop-scripts.test.mjs` runs the written copy under `bash` (68 pass, 0 fail), which a parse error would fail. The shebang and `set -euo pipefail` lines were checked by reading the file.
- The `git diff --stat dev...HEAD -- …` bullet was not run before commit; `git status --short` shows only `cli/templates/scripts/docs-search-server.sh` and `cli/test/outer-loop-scripts.test.mjs` changed by this task.
