### 2. The Python wrapper route, compose directory and service, and CLI entry are declared in more than one eval module

**Severity:** Should Fix. **Layer:** general.

**Site.**

- `evals/docs-retrieval/python-backend.mjs` → `const WRAPPER_PATH = ['scripts', 'python-service.sh'];` and `wrapperArgs` (which builds `[wrapper, 'run', subCommand, ...rest]`). Neither is exported.
- `evals/docs-retrieval/mcp-backend-pass.mjs` → a second `const WRAPPER_PATH = ['scripts', 'python-service.sh'];`. `serverCommand` rebuilds the wrapper argv by hand (`[join(checkout, ...WRAPPER_PATH), 'run', PYTHON_SERVE_SUB_COMMAND, '--repo', fixtureDir]`). The module also declares `const COMPOSE_DIR = 'docs-retrieval-service';`, `const POSTGRES_SERVICE = 'postgres';` and `const CLI_ENTRY = ['cli', 'dist', 'cli.js'];`.
- `evals/docs-retrieval/vector-agreement.mjs` → a second `const COMPOSE_DIR = 'docs-retrieval-service';` and a second `const POSTGRES_SERVICE = 'postgres';`.
- `evals/docs-retrieval/query-log-pass.mjs` → `const CLI_ENTRY = 'cli/dist/cli.js';`. This one predates the branch and is copied by `mcp-backend-pass.mjs`.

**Problem.** `python-backend.mjs`'s header says it owns the route the eval takes into the Python package: *"the eval reaches the Python backend only through the package's own entry points, `bash scripts/python-service.sh run <sub-command>`"*. It also says that the names the CLI does not own *"are spelled once, below, each with its owner"*. `mcp-backend-pass.mjs` declares the wrapper path a second time and assembles the `run <sub-command>` argv itself. The compose directory and service name are declared in two modules and owned by neither, and the CLI entry point is spelled in two modules.

This goes against `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it"*. If the wrapper's location or the compose service name changes, one module moves and the other is left behind.

Graded Should Fix rather than Must Fix: every copy is in the same directory and every copy is currently identical.

**Fix.**

1. In `evals/docs-retrieval/python-backend.mjs`:
   - Export `WRAPPER_PATH`.
   - Export a `wrapperArgs(checkout, subCommand, rest)` (the existing function, exported). Also export `SERVE_SUB_COMMAND` if `mcp-backend-pass.mjs` cannot use `PYTHON_SERVE_SUB_COMMAND` from `cli/dist/retrieval/pythonBackend.js` directly.
   - Declare and export `COMPOSE_DIR = 'docs-retrieval-service'` and `POSTGRES_SERVICE = 'postgres'`, each with an owner comment ``/** `docs-retrieval-service/compose.yaml` → `services.postgres`. */``.
2. In `evals/docs-retrieval/mcp-backend-pass.mjs`:
   - Delete `WRAPPER_PATH`, `COMPOSE_DIR` and `POSTGRES_SERVICE`, and import them from `./python-backend.mjs`.
   - Build `serverCommand`'s Python argv with the imported `wrapperArgs(checkout, PYTHON_SERVE_SUB_COMMAND, ['--repo', fixtureDir])`.
3. In `evals/docs-retrieval/vector-agreement.mjs`: delete `COMPOSE_DIR` and `POSTGRES_SERVICE`, and import them from `./python-backend.mjs`.
4. Export `CLI_ENTRY` from `evals/docs-retrieval/query-log-pass.mjs`, the earlier declaration. Have `mcp-backend-pass.mjs` import it rather than declare its own. The two spellings differ (a string against a segment array), so adapt the single `join` call site to whichever form is kept.
5. Change no value. A scratch-launcher run of `mcp-backend-pass.mjs` and `vector-agreement.mjs` should resolve the same paths as before.
