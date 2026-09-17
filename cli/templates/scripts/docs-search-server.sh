#!/usr/bin/env bash
# docs-search-server.sh — start the docs-retrieval MCP server for the checkout
# this script sits in, by `exec`ing the machine-shared retrieval runtime's
# `docs serve`.
#
# WHO RUNS IT. The agent runner, from the `harness-docs` entry `init` writes into
# `.mcp.json` when `docs.retrieval` is on — never a dispatched agent's Bash call,
# so its row in `cli/src/generators/outerLoopScripts.ts` is
# `agentInvocable: false` and the generated permission profile carries no entry
# for it.
#
# STDOUT BELONGS TO THE MCP TRANSPORT. Nothing here may print to stdout before
# the `exec`: a stray byte there is a malformed frame for the client. Every
# diagnostic goes to stderr.
#
# THE RUNTIME IS THE ONLY THING THIS RUNS, with no fallback to any other
# installation: a committed `.mcp.json` cannot know where an adopter's own CLI
# lives. `doctor`'s `retrieval-dependencies` check and `init`'s install both key
# on the same entry file this script tests.
#
# MIRRORS — a change to any owner below is an edit here too:
#   `retrieval/runtime` and `node_modules/autonomous-sdlc-harness/dist/cli.js`
#     mirror `RETRIEVAL_CACHE_DIRNAME`, `RETRIEVAL_RUNTIME_DIRNAME` and
#     `RUNTIME_CLI_RELATIVE` in `cli/src/retrieval/runtime.ts`;
#   `hr_cache_dir` mirrors `machineCacheDir()` in `cli/src/machine/paths.ts`.
#
# Exit contract:
#   1    no runtime entry at the resolved path, no cache directory to resolve
#        it under, or no repository at this script's location; stderr names
#        which
#   N    otherwise `docs serve`'s own status, through `exec`; a failure to
#        source the library exits non-zero before that, on stderr only

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/harness-run-lib.sh
. "$script_dir/lib/harness-run-lib.sh"

if ! root="$(hr_repo_root "$script_dir")"; then
  echo "docs-search-server: $script_dir is not inside a git repository, so there is no checkout to serve" >&2
  exit 1
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
