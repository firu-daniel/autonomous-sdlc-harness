#!/usr/bin/env bash
# Written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run
# keeps your copy. It is what `commands.typecheck` invokes: it runs the raw type-check command
# line below from the repository root, forwards whatever arguments it was given to it, and
# prints one verdict line.

# Deliberately no `-e`: this script has to outlive its own command's failure long enough to
# print the verdict line below.
set -uo pipefail

# Exit with a diagnostic and no verdict line: nothing ran, so there is no result to report. A
# function rather than an inline `echo … && exit 1`, because the command line below is handed the
# caller's arguments and `exit` refuses extra ones — `init` writes a call to it as that line when
# no command line resolved.
harness_fail() {
  echo "$1" >&2
  exit 1
}

# Anchor to the repository root, derived from this script's own location and never from the
# caller's directory: `commands.*` are command lines run from the repository root and every path
# in `harness.config.json` is repo-relative. `git -C` on the script's own directory answers with
# the checkout this copy belongs to, so all three forms the permission profile emits — the
# repo-relative one, its absolute twin and a sibling worktree's own copy — run at the root of the
# checkout they were invoked out of, whatever directory the caller stood in.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  harness_fail "typecheck: could not resolve a repository root from '${script_dir}' (is git on PATH?)"
fi

# Forward the caller's arguments to the command; with none the whole line runs, which every
# command takes. `"$@"` is safe under `set -u` even when empty. They attach to the *last* command
# of the line below, so keep that line one command rather than a compound — and whether that
# command accepts a bare path or name filter is a property of the command, not of this wrapper: a
# test runner usually does, a line ending in a sub-command's own flags does not (`ctest` needs
# `-R <regex>`, `cmake --build` needs `--target <name>`, a `cargo clippy … -- <flags>` line
# forwards into the compiler's arguments). Read the line below before passing any.
npm run typecheck "$@"
status=$?

# Exactly one verdict line, so no caller ever appends an exit-code probe to this script. That
# compound form is what stalls an unattended run on a permission prompt.
if [ "$status" -eq 0 ]; then
  echo "PASS: typecheck"
else
  echo "FAIL: typecheck (exit $status)"
fi

exit "$status"
