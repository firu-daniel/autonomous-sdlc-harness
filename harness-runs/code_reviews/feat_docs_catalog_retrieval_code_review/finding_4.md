### 4. The launcher `exec`s `node` with whatever `PATH` the agent runner happened to have

**File:** `cli/templates/scripts/docs-search-server.sh` — `exec node "$entry" docs serve --cwd "$root"`

`node` is resolved from the inherited `PATH`. The process that inherits it is not a shell the adopter typed in: it is the agent runner, which starts this script from `.mcp.json`, and which itself may have been started from a desktop launcher rather than a login shell. That is the same environment class the watcher's own bootstrap exists for — `cli/templates/scripts/autonomous-watcher.sh` settles `PATH="$(hr_path_with_fallbacks)"` before it runs anything, and the library documents the function as printing *"a `PATH` that keeps everything the caller inherited and adds the usual locations it is missing"*, appending rather than promoting so nothing the caller put first is demoted.

The failure mode is the one this branch names as its own top risk. With `node` off the inherited `PATH`, `exec` fails, the `harness-docs` server never starts, and `mcp__harness-docs__search_docs` is granted in ten `tools:` allowlists and in the generated permission profile but never loads — which stalls a print-mode run rather than failing it. `doctor` does not catch it: `retrieval-dependencies` is three file tests and `retrieval-index` spawns its child with `process.execPath`, so both pass on a machine where the launcher's `exec` would not.

The launcher already sources the library, so the fix is two lines and no new dependency.

**Fix:** settle `PATH` immediately after the library is sourced and before anything external is run.

```bash
# shellcheck source=lib/harness-run-lib.sh
. "$script_dir/lib/harness-run-lib.sh"

# The agent runner starts this script, and a runner launched from a desktop session carries a
# minimal PATH. The library appends the usual locations without promoting any of them, which is the
# same bootstrap autonomous-watcher.sh runs for the same reason.
PATH="$(hr_path_with_fallbacks)"
export PATH
```

Then add one line to the header, in its existing register, under `THE RUNTIME IS THE ONLY THING THIS RUNS`: that `PATH` is settled through the library's fallback list before the `exec`, because the starter is the agent runner rather than a login shell.

`cli/test/outer-loop-scripts.test.mjs` compares the shipped template byte for byte against the written copy, so the template edit alone keeps it green; the launcher's two behavioural cases run under the suite's own `PATH` and are unaffected by an appending settle.
