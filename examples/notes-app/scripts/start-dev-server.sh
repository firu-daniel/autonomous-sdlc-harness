#!/usr/bin/env bash
# Written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run
# keeps your copy. It is what `commands.devServer` invokes: it starts the development server in
# the background, from the repository root, and prints the pid and the log path a caller needs.
#
# Usage: start-dev-server.sh [port] [argument...]
# The port is optional and must be numeric when it is given; anything else is a usage error, so a
# mistyped port can never be passed through as a flag. It reaches the command on one channel only,
# exported as HARNESS_DEV_SERVER_PORT: it is shifted off before the remaining arguments are
# forwarded, so the raw command line below is never handed the port positionally. A server that
# takes its port only as an argument has to be given that variable on the raw line below.
#
# This wrapper may run a build to completion before it launches, on the pre-start line below; that
# line is yours to edit like every other, and `:` there means there is nothing to run.
#
# Nothing here inspects the port. A stack whose server silently falls through to port+1 when the
# port is taken has to be told not to, and this wrapper is where you tell it: add its strict-port
# flag to the raw command line below, or make the command that line runs fail on a taken port. A
# QA run that quietly moved to another port drives a different run's server.

# Deliberately no `-e`, for the same reason as the other wrappers. No captured status either:
# a development server does not exit while it is doing its job.
set -uo pipefail

# Exit with a diagnostic and no pid line: nothing is running, so there is nothing to report. A
# function rather than an inline `echo … && exit 1`, because the command line below is handed the
# caller's arguments and `exit` refuses extra ones — `init` writes a call to it as that line when
# no command line resolved.
harness_fail() {
  echo "$1" >&2
  exit 1
}

port="${1:-}"
if [ -n "$port" ]; then
  case "$port" in
    *[!0-9]*)
      harness_fail "devServer: usage: start-dev-server.sh [port] (port must be numeric, got '${port}')"
      ;;
  esac
  shift
  export HARNESS_DEV_SERVER_PORT="$port"
fi

# Anchor to the repository root, derived from this script's own location and never from the
# caller's directory: `commands.*` are command lines run from the repository root and every path
# in `harness.config.json` is repo-relative. `git -C` on the script's own directory answers with
# the checkout this copy belongs to, so all three forms the permission profile emits — the
# repo-relative one, its absolute twin and a sibling worktree's own copy — run at the root of the
# checkout they were invoked out of, whatever directory the caller stood in.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  harness_fail "devServer: could not resolve a repository root from '${script_dir}' (is git on PATH?)"
fi

# A step that has to finish before the server is launched — for a server that serves what was last
# compiled, the project's own build. Synchronous and above the launch deliberately: the line below
# is backgrounded and its `$!` is what a caller kills, and a build chained into it with `&&` would
# make that pid a subshell the kill does not reach past. `:` when there is nothing to run.
: || harness_fail "devServer: the pre-start step failed, so the server was not launched"

# $TMPDIR ends in a trailing slash on macOS; strip it so the path carries no doubled separator.
# With no port the log is the `-default` one, which is also the only case two runs can share.
tmp_dir="${TMPDIR:-/tmp}"
tmp_dir="${tmp_dir%/}"
log_file="${tmp_dir}/harness-dev-server-${port:-default}.log"

# Backgrounded rather than `exec`ed, which is the one behaviour a QA phase cannot do without: it
# needs this shell back to poll the port and it needs a pid of its own to stop the server with,
# and it needs somewhere to read a startup failure from — which is why both streams go to the log.
npm run dev "$@" >"$log_file" 2>&1 &
pid=$!

# The only failure this script reports: the launch itself did not happen. A server that started
# but is not answering yet is success — see the readiness note below.
#
# Liveness is the test, not `[ -z "$pid" ]`: `$!` is assigned the moment the job is backgrounded,
# before the command has been resolved, so it is set even for a command that does not exist and an
# emptiness test can never fire. The brief settle is what makes the liveness test mean anything —
# immediately after the `&` the child has not been reaped yet and `kill -0` succeeds for a command
# that was never found. It is NOT a readiness wait: readiness belongs to the poll named at the foot
# of this script, and this only has to outlast a command that dies on the spot. Lengthen it if your
# command forks through a launcher slow enough to be missed here.
sleep 0.3
if ! kill -0 "$pid" 2>/dev/null; then
  harness_fail "devServer: the development server exited immediately — see $log_file"
fi

# The one wrapper with no PASS/FAIL verdict, because a long-running process has no verdict to
# give. It reports what a caller has to hold instead: the pid to check liveness and to stop, and
# the log to read a failed start out of.
echo "STARTING: devServer (pid $pid)"
echo "LOG: $log_file"

# Readiness is deliberately not probed here. The poll already ships as a plugin asset —
# `scripts/poll-dev-server.sh`, which the QA phase runs against the port once this returns — and a
# second implementation of it inside a wrapper an adopter edits is how the two come to disagree.
exit 0
