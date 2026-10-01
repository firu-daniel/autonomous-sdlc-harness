#!/usr/bin/env bash
# docs-search-server.sh — start the docs-retrieval MCP server for the checkout
# this script sits in, on the backend `docs.retrievalBackend` selects.
#
# WHO RUNS IT. The agent runner, from the `harness-docs` entry `init` writes into
# `.mcp.json` when `docs.retrieval` is on — never a dispatched agent's Bash call,
# so its row in `cli/src/generators/outerLoopScripts.ts` is
# `agentInvocable: false` and the generated permission profile carries no entry
# for it.
#
# STDOUT BELONGS TO THE MCP TRANSPORT. Nothing here may print to stdout: a stray
# byte there is a malformed frame for the client. Every diagnostic goes to
# stderr.
#
# WHICH SERVER. Two backends, chosen by `docs.retrievalBackend` read at run
# time, with no fallback between them and no fallback to any other
# installation. The key is read ONLY WHEN `phases.docs` and `docs.retrieval` are
# both `true` (`hr_docs_retrieval_applies`, the shell mirror of
# `retrievalApplies`): `init` merges `.mcp.json` and removes nothing, so this
# entry outlives turning retrieval off, and with the gate closed the TypeScript
# runtime is `exec`ed whatever the key holds. `typescript`, or the key absent,
# `exec`s the machine-shared runtime's `docs serve`; `doctor`'s
# `retrieval-dependencies` check and `init`'s install both key on the same entry
# file this script tests. `python` starts the Python package's stdio server.
# This script checks no database and runs no `self-check`: grading the backend's
# prerequisites is `doctor`'s. `PATH` is settled through the library's fallback
# list first, because the starter is the agent runner rather than a login shell.
#
# WHY THE PYTHON BRANCH IS NOT `exec`ED. Its failure must surface as exit 3,
# which an `exec` could not report. It runs as a child with stdin passed
# explicitly, and `TERM` / `INT` are forwarded to it so the runner's shutdown
# still reaches the server.
#
# MIRRORS — a change to any owner below is an edit here too:
#   `retrieval/runtime` and `node_modules/autonomous-sdlc-harness/dist/cli.js`
#     mirror `RETRIEVAL_CACHE_DIRNAME`, `RETRIEVAL_RUNTIME_DIRNAME` and
#     `RUNTIME_CLI_RELATIVE` in `cli/src/retrieval/runtime.ts`;
#   `hr_cache_dir` mirrors `machineCacheDir()` in `cli/src/machine/paths.ts`;
#   `harness-docs-retrieval`, `serve-mcp`, `HARNESS_DOCS_RETRIEVAL_DATABASE_URL`,
#     the default connection string and exit 3 mirror `PYTHON_RETRIEVAL_COMMAND`,
#     `PYTHON_SERVE_SUB_COMMAND`, `PYTHON_DATABASE_URL_VARIABLE`,
#     `PYTHON_DEFAULT_DATABASE_URL` and `PYTHON_BACKEND_UNAVAILABLE_EXIT` in
#     `cli/src/retrieval/pythonBackend.ts`.
#
# Exit contract:
#   0    the Python backend exited 0
#   1    no repository at this script's location; `docs.retrievalBackend`
#        outside the enum; or, on the TypeScript backend, no runtime entry at
#        the resolved path or no cache directory to resolve it under; stderr
#        names which
#   3    the Python backend is selected but cannot serve: its command does not
#        resolve on `PATH`, or it exited non-zero; stderr names which
#   N    on the TypeScript backend, `docs serve`'s own status, through `exec`; a
#        failure to source the library exits non-zero before that, on stderr only

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/harness-run-lib.sh
. "$script_dir/lib/harness-run-lib.sh"

# The agent runner starts this script, and a runner launched from a desktop session carries a
# minimal PATH. The library appends the usual locations without promoting any of them, which is the
# same bootstrap autonomous-watcher.sh runs for the same reason.
PATH="$(hr_path_with_fallbacks)"
export PATH

if ! root="$(hr_repo_root "$script_dir")"; then
  echo "docs-search-server: $script_dir is not inside a git repository, so there is no checkout to serve" >&2
  exit 1
fi

backend=typescript
config_status=0
hr_config_load "$root" || config_status=$?
if [ "$config_status" -eq 2 ]; then
  echo "docs-search-server: $root/harness.config.json could not be read, so the default backend (typescript) was taken" >&2
elif [ "$config_status" -eq 0 ] && hr_docs_retrieval_applies "$root"; then
  backend_status=0
  backend="$(hr_docs_retrieval_backend "$root")" || backend_status=$?
  if [ "$backend_status" -ne 0 ]; then
    echo "docs-search-server: docs.retrievalBackend in $root/harness.config.json is neither \`typescript\` nor \`python\`; set one of them, then run \`npx autonomous-sdlc-harness doctor\`" >&2
    exit 1
  fi
fi

if [ "$backend" = python ]; then
  if ! command -v harness-docs-retrieval >/dev/null 2>&1; then
    echo "docs-search-server: the Python backend is selected but \`harness-docs-retrieval\` does not resolve on PATH (interpreter or package missing); see docs/retrieval.md and run \`npx autonomous-sdlc-harness doctor\`" >&2
    exit 3
  fi
  if [ -z "${HARNESS_DOCS_RETRIEVAL_DATABASE_URL-}" ]; then
    HARNESS_DOCS_RETRIEVAL_DATABASE_URL='postgresql://harness:harness@127.0.0.1:5432/docs_retrieval'
  fi
  export HARNESS_DOCS_RETRIEVAL_DATABASE_URL

  # A background job's stdin is /dev/null unless it is passed explicitly.
  harness-docs-retrieval serve-mcp --repo "$root" <&0 &
  child=$!
  trapped=0
  trap 'trapped=1; kill -TERM "$child" 2>/dev/null || true' TERM
  trap 'trapped=1; kill -INT "$child" 2>/dev/null || true' INT

  # A trapped signal interrupts `wait` before the child's status is collected, so wait again. 127
  # means the first `wait` had already collected it.
  child_status=0
  wait "$child" || child_status=$?
  while [ "$trapped" -eq 1 ]; do
    trapped=0
    again=0
    wait "$child" 2>/dev/null || again=$?
    [ "$again" -eq 127 ] || child_status=$again
  done

  if [ "$child_status" -eq 0 ]; then
    exit 0
  fi
  echo "docs-search-server: the Python backend exited with status $child_status before or while serving; the line above (\`harness-docs-retrieval: …\`) names why; run \`npx autonomous-sdlc-harness doctor\`" >&2
  exit 3
fi

if ! cache_dir="$(hr_cache_dir)"; then
  echo "docs-search-server: neither XDG_CACHE_HOME nor HOME is set, so the retrieval runtime cannot be located" >&2
  exit 1
fi
entry="$cache_dir/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js"

if [ ! -f "$entry" ]; then
  echo "docs-search-server: no retrieval runtime at $entry; run \`npx autonomous-sdlc-harness init\` in a repository with docs.retrieval on" >&2
  exit 1
fi

exec node "$entry" docs serve --cwd "$root"
