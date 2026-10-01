#!/usr/bin/env bash
# The one route to the Python toolchain of `docs-retrieval-service/` (the `harness-docs-retrieval`
# package). Every Python command goes through this file so that it is spellable as a literal an
# unattended run can issue, e.g. `bash scripts/python-service.sh test tests/test_cli.py`.
#
# Hand-written, like `scripts/run-gates.sh`: not in the set `init --force` rewrites.
#
# Sub-commands (paths and arguments are relative to `docs-retrieval-service/`):
#   lock                 uv lock — rewrite uv.lock. Provisioning; reaches the network.
#   sync [--with-models] uv sync --frozen with the dev group. Provisioning; reaches the network.
#                        Without the flag the `models` extra is NOT installed, and a plain `sync`
#                        after a `--with-models` one removes it again.
#   lint                 ruff check, then ruff format --check.
#   typecheck            mypy (strict, over src and tests).
#   test [path...]       pytest, paths forwarded verbatim; default the whole suite.
#   run [args...]        the `harness-docs-retrieval` console script, arguments forwarded verbatim.
#   container-test       RESERVED for Task 15, with exit status 4; not implemented yet.
# lint, typecheck, test and run go through `uv run --frozen --no-sync`, so they never reach the
# network and never change the environment.
#
# Exit contract:
#   0  pass
#   1  the tool reported failure (any non-zero status from it)
#   2  usage: missing or unknown sub-command, or a bad option
#   3  not provisioned: `uv` is not on PATH, or no synced environment exists
#   4  RESERVED for container-test (Task 15)
#
# Nothing lands inside the checkout: the environment and every tool cache live under
# ${XDG_CACHE_HOME:-$HOME/.cache}/harness-docs-retrieval/, keyed per checkout, so gate 6a's `$HOME`
# grep over the tree gains no hit.
#
# Deliberately no `-e`: each failure is mapped onto the exit contract above.
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root/docs-retrieval-service"; then
  echo "python-service: could not resolve docs-retrieval-service/ from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

usage() {
  echo "usage: bash scripts/python-service.sh <lock|sync [--with-models]|lint|typecheck|test [path...]|run [args...]>" >&2
}

cache_root="${XDG_CACHE_HOME:-$HOME/.cache}/harness-docs-retrieval"
checkout_key="$(printf '%s' "$repo_root" | cksum | awk '{print $1}')"
export UV_PROJECT_ENVIRONMENT="$cache_root/venvs/$checkout_key"
export PYTHONDONTWRITEBYTECODE=1
export RUFF_CACHE_DIR="$cache_root/ruff/$checkout_key"
export MYPY_CACHE_DIR="$cache_root/mypy/$checkout_key"

require_uv() {
  if ! command -v uv >/dev/null 2>&1; then
    echo "python-service: not provisioned: uv is not on PATH; install uv, then run bash scripts/python-service.sh sync" >&2
    exit 3
  fi
}

require_env() {
  require_uv
  if [ ! -f "$UV_PROJECT_ENVIRONMENT/pyvenv.cfg" ]; then
    echo "python-service: not provisioned: no synced environment at ${UV_PROJECT_ENVIRONMENT}; run bash scripts/python-service.sh sync" >&2
    exit 3
  fi
}

# Map any non-zero tool status onto the contract's `1`.
graded() {
  if "$@"; then
    exit 0
  fi
  exit 1
}

if [ "$#" -eq 0 ]; then
  echo "python-service: missing sub-command" >&2
  usage
  exit 2
fi

command_name="$1"
shift

case "$command_name" in
  lock)
    if [ "$#" -ne 0 ]; then usage; exit 2; fi
    require_uv
    graded uv lock
    ;;
  sync)
    extra=()
    if [ "$#" -eq 1 ] && [ "$1" = "--with-models" ]; then
      extra=(--extra models)
    elif [ "$#" -ne 0 ]; then
      usage
      exit 2
    fi
    require_uv
    graded uv sync --frozen --group dev ${extra[@]+"${extra[@]}"}
    ;;
  lint)
    if [ "$#" -ne 0 ]; then usage; exit 2; fi
    require_env
    status=0
    uv run --frozen --no-sync ruff check || status=1
    uv run --frozen --no-sync ruff format --check || status=1
    exit "$status"
    ;;
  typecheck)
    if [ "$#" -ne 0 ]; then usage; exit 2; fi
    require_env
    graded uv run --frozen --no-sync mypy
    ;;
  test)
    require_env
    graded uv run --frozen --no-sync pytest "$@"
    ;;
  run)
    require_env
    graded uv run --frozen --no-sync harness-docs-retrieval "$@"
    ;;
  *)
    echo "python-service: unknown sub-command '${command_name}'" >&2
    usage
    exit 2
    ;;
esac
