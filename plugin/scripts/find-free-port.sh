#!/usr/bin/env bash
# find-free-port.sh — pick a free per-run port for the development server an
# automated QA phase starts, so parallel runs never collide on one.
#
# Each QA run starts its own instance of the development server the configured
# `commands.devServer` starts; two runs on one machine must not fight over a
# port, so the caller assigns one per run by calling this script.
#
# WHY THIS IS A SCRIPT AND NOT AN INLINE LOOP. It encapsulates the port-probe
# loop (an `lsof` LISTEN probe plus an increment) INSIDE a single script so the
# permission layer sees ONE allow-listed command instead of a compound. A raw
# probe loop (`while lsof -ti:$port; do …; done`) is a compound command that
# matches no static allow pattern and is DENIED in an unattended session — the
# same rationale `kill-dev-server.sh` documents for its `lsof | xargs kill` pipe
# and `poll-dev-server.sh` for its `curl` poll. Running the probe from here
# fixes that.
#
# WHY THE PROBE IS LISTEN-ONLY. `-sTCP:LISTEN` matches only a socket that is
# actually accepting connections. Lingering ESTABLISHED client endpoints on a
# port — a browser from an earlier run still holding a connection, say — must
# never make a free port look occupied.
#
# Prerequisite: `lsof` on PATH. This script reads no configuration and needs no
# repository: its base port arrives as the argument.
#
# Used by `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`
# (`## Phase E — QA testing` → `### E.0 Start the dev server`, step 1) and by
# `${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md`
# (`### 2. Start the dev server (background)`, step 1).
#
# Usage: find-free-port.sh [base]   (default 3001)
# The base is the caller's `qa.portSeed` — whose own schema default is 3001,
# deliberately ONE ABOVE the port a development server typically takes by
# default. That default port is left free for a human developer's own run, so an
# automated run never fights the human for it; a lone QA run gets the seed
# itself. Callers pass the seed explicitly, and it is never baked in here beyond
# this argument default.
#
# Prints the first free port >= base to stdout — the ONLY stdout output, since
# callers capture it — and exits 0. If no free port exists in [base, base+100],
# prints a one-line error to stderr and exits 1 (callers treat a non-zero exit as
# the "QA dev server failed to start" stop condition).
#
# REPRO — reproduce any decision by hand:
#
#   bash plugin/scripts/find-free-port.sh 3001
#
#   nothing listening at the base   -> prints the base, exit 0
#   base held by a listener         -> prints the next free port, exit 0
#   whole [base, base+100] occupied -> nothing on stdout, one stderr line, exit 1

set -u

base="${1:-3001}"
limit=$((base + 100))
port="$base"

while [ "$port" -le "$limit" ]; do
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    echo "$port"
    exit 0
  fi
  port=$((port + 1))
done

echo "find-free-port: no free port in range $base-$limit" >&2
exit 1
