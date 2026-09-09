#!/usr/bin/env bash
# kill-dev-server.sh — tear down the development server the configured
# `commands.devServer` started for an automated QA phase.
#
# WHY THIS IS A SCRIPT AND NOT AN INLINE PIPE. It encapsulates the
# `lsof -ti tcp:<port> -sTCP:LISTEN | xargs kill` pipe INSIDE a single script so
# the permission layer sees ONE allow-listed command instead of a piped
# compound. A piped command is approved by neither a static allow list (each
# piece matches its own pattern, but the piped whole matches none) nor by
# `allow-safe-compounds.sh` (that guard handles `&&` / `||` / `;` / a newline,
# not pipes) — so the inline pipe prompts interactively and is DENIED in an
# unattended session. Running it from here fixes both. Same rationale as
# `find-free-port.sh`'s probe loop and `poll-dev-server.sh`'s poll.
#
# WHY THE PROBE IS LISTEN-ONLY. It kills only the pid(s) LISTENING on the port —
# the server itself — and never ESTABLISHED clients such as the run's own QA
# browser still holding connections to it.
#
# Prerequisite: `lsof` on PATH. This script reads no configuration and needs no
# repository: its port arrives as the argument.
#
# Used by `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`
# (`## Phase E — QA testing` → `### E.0 Start the dev server`, the teardown rule)
# and by `${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md`
# (`### 5. Tear down the dev server`).
#
# Usage: kill-dev-server.sh [port]   (default 3000)
# ALWAYS PASS THE PORT from an automated flow. Those flows assign a per-run port
# at or above `qa.portSeed` (via `find-free-port.sh`) and pass it here. The
# portless form falls back to the port a development server takes by default —
# the port automated runs deliberately leave free for a human developer — so it
# is for ad-hoc human use only; a portless call from a QA flow would kill the
# HUMAN's dev server, never its own.
#
# No-op with exit 0 when nothing is listening, so "tear down on any halt" never
# errors.
#
# REPRO — reproduce any decision by hand:
#
#   bash plugin/scripts/kill-dev-server.sh 3001
#
#   nothing listening on the port -> prints the no-op line, exit 0
#   a listener on the port        -> prints the pid(s), kills them, exit 0

set -u

port="${1:-3000}"
pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"

if [ -z "$pids" ]; then
  echo "kill-dev-server: nothing listening on :$port (no-op)"
  exit 0
fi

echo "kill-dev-server: killing pid(s) on :$port -> $pids"
# shellcheck disable=SC2086
kill $pids 2>/dev/null || true
exit 0
