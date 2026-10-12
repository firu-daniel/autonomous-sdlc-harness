### 1. `writeProtection.ts` spells `harness-run-lib.sh` as a second source for the outer-loop table

**Severity:** Must Fix. **Layer:** cli.

**Site:** `cli/src/generators/writeProtection.ts` → `libraryDir`, at the substring `rowNamed('harness-run-lib.sh')`, plus the `internal(...)` message on the next line (around line 81).

**Problem.** `libraryDir` looks up the run library's row in `OUTER_LOOP_SCRIPTS` using the string literal `'harness-run-lib.sh'`, then takes that row's `subdir`. `protectedPaths` joins that `subdir` into the absolute path it write-protects (`outerLoopScriptPath(repoRoot, config, lib)`) and into the worktree-glob path (`join(glob, scriptsDir, lib)`). So the literal is a `.sh` name that is *resolved and joined as a path*. `.claude/context/cli.md` → `## How a module in this layer is written` → **One string, one producer** says such a literal is a second source for the shipped table: *"A `.sh` name spelled as a string literal elsewhere in this layer is a second source for one of these tables **where it is resolved, joined or read as a path**."* Rename the row in `cli/src/generators/outerLoopScripts.ts` and nothing fails to compile. It only fails at `init` time, as an `internal()` fault.

The table module already shows the sanctioned shape for a row that a second consumer must name. `WATCHER_SCRIPT_NAME`, `NOTIFY_SCRIPT_NAME` and `DOCS_SEARCH_SERVER_SCRIPT_NAME` are each exported once, and the row is built from the constant. The same file uses `DOCS_SEARCH_SERVER_SCRIPT_NAME` exactly this way a few lines further down (`rowNamed(DOCS_SEARCH_SERVER_SCRIPT_NAME)`).

**Fix.**
1. In `cli/src/generators/outerLoopScripts.ts`, add an exported constant beside `DOCS_SEARCH_SERVER_SCRIPT_NAME`, for example `export const RUN_LIBRARY_SCRIPT_NAME = 'harness-run-lib.sh';`. Give it a doc comment in the same style as its siblings, naming `generators/writeProtection.ts` as the second consumer. Build the `OUTER_LOOP_SCRIPTS` row from it: `Object.freeze({ file: RUN_LIBRARY_SCRIPT_NAME, subdir: 'lib', mode: 0o644, agentInvocable: false })`.
2. In `cli/src/generators/writeProtection.ts`, import `RUN_LIBRARY_SCRIPT_NAME` from `./outerLoopScripts.js`. Replace `rowNamed('harness-run-lib.sh')` with `rowNamed(RUN_LIBRARY_SCRIPT_NAME)`, and interpolate the constant into the `internal(...)` message in place of the literal.
3. Check that no other `cli/src` file now resolves or joins `harness-run-lib.sh` as a literal: `grep -rn "'harness-run-lib.sh'" cli/src` should return only the new constant. Doc-comment mentions are permitted and stay.
