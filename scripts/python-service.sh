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
#   container-test       the `container`-marked tests against a throwaway Postgres: starts only the
#                        compose `postgres` service under a per-checkout project name on a
#                        per-checkout loopback port, runs `pytest -m container -rs`, and removes that
#                        project with `down -v` on every exit path. Builds the image on first use.
#                        Its image build is the one step here that may reach the network.
# lint, typecheck, test, run and container-test's pytest go through `uv run --frozen --no-sync`, so
# they never reach the network and never change the environment.
#
# Exit contract:
#   0  pass
#   1  the tool reported failure (any non-zero status from it, pytest's own 2-5 included), or
#      container-test could not start its Postgres
#   2  usage: missing or unknown sub-command, or a bad option
#   3  not provisioned: `uv` is not on PATH, or no synced environment exists
#   4  container-test only: SKIPPED, because `docker` is not on PATH. A loud skip, not a pass.
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
  echo "usage: bash scripts/python-service.sh <lock|sync [--with-models]|lint|typecheck|test [path...]|run [args...]|container-test>" >&2
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
  container-test)
    if [ "$#" -ne 0 ]; then usage; exit 2; fi
    if ! command -v docker >/dev/null 2>&1; then
      echo "container-test: SKIPPED — docker is not on PATH; the container gate needs Docker" >&2
      exit 4
    fi
    require_env
    compose_file="$repo_root/docs-retrieval-service/compose.yaml"
    project="harness-docs-retrieval-test-$checkout_key"
    # Off the compose default 5432, and per checkout, so two worktrees' runs do not collide.
    export HARNESS_DOCS_RETRIEVAL_PG_PORT="$((40000 + checkout_key % 20000))"
    teardown() {
      if ! docker compose -f "$compose_file" -p "$project" down -v >/dev/null 2>&1; then
        echo "container-test: warning: 'docker compose -p ${project} down -v' failed; remove that project by hand" >&2
      fi
    }
    # Set before `up`, so a failed or interrupted start is torn down too; INT and TERM route
    # through `exit` so the EXIT trap fires on them.
    trap teardown EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    if ! docker compose -f "$compose_file" -p "$project" up -d --wait postgres; then
      echo "container-test: could not start the compose postgres service (project ${project})" >&2
      exit 1
    fi
    # The credentials and database are compose.yaml's `postgres` service environment.
    export HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL="postgresql://harness:harness@127.0.0.1:${HARNESS_DOCS_RETRIEVAL_PG_PORT}/docs_retrieval"
    if uv run --frozen --no-sync pytest -m container -rs; then
      exit 0
    fi
    exit 1
    ;;
  *)
    echo "python-service: unknown sub-command '${command_name}'" >&2
    usage
    exit 2
    ;;
esac
