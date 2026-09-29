#!/usr/bin/env bash
# probe-plugin-cli.sh — print what the installed `claude` CLI accepts for adding a marketplace and
# installing a plugin: its version and the help text of each plugin-install subcommand. Hand-written
# for this repository, like measure-suite.sh: not in the set `init --force` regenerates, and
# publish-main.sh removes it from `main` with the rest of `scripts/`.
#
# Its output is what docs/remote-execution.md → `## 6. What is not verified here` records, with the
# command and the date, for the row about pinning the plugin at install. A run cannot call
# `claude … --help` directly; the script-allowlist guard permits this wrapper.
#
# Read-only: it adds, installs and changes nothing.
#
# Usage: probe-plugin-cli.sh
# Exit: 0 every command's output and status was printed · 1 `claude` does not resolve on PATH
#
# No `-e`: a command's non-zero status is printed and the next command still runs.
set -u

if ! command -v claude >/dev/null 2>&1; then
  echo "probe-plugin-cli: \`claude\` does not resolve on PATH" >&2
  exit 1
fi

probe() {
  echo "\$ claude $*"
  claude "$@" </dev/null 2>&1
  echo "exit status: $?"
  echo
}

probe --version
probe plugin --help
probe plugin marketplace --help
probe plugin marketplace add --help
probe plugin install --help

exit 0
