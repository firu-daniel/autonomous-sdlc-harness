#!/usr/bin/env bash
# Written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run
# keeps your copy. It is what `deploy.command` invokes: it runs the raw deploy command line below
# from the repository root, forwards whatever arguments it was given to it — a target or
# environment selector — and prints one verdict line.

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
# in `harness.config.json` is repo-relative. The placement below answers with
# the checkout this copy belongs to, so every form the permission profiles list — the
# repo-relative one and its absolute twin in the base profile, and a run copy's own exact path in
# the run watcher's per-run copy — runs at the root of the checkout it was invoked out of,
# whatever directory the caller stood in. Every one of those forms is in `ask` as well as
# `allow`, and `ask` is evaluated first, so under the profiles' `dontAsk` mode an unattended run
# is refused a deploy outright.
# The root is the nearest of the script's own directory and its ancestors that holds
# `harness.config.json` and that git confirms as its own top level, so git's discovery never
# starts at a `<scriptsDir>/.git` placeholder a bubblewrap host mounts (F15); it is the run
# library's `hr_script_root`, inlined because this wrapper sources no library.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root=""
candidate="$(CDPATH= cd -P -- "$script_dir" 2>/dev/null && pwd -P)"
while [ -n "$candidate" ]; do
  if [ -f "$candidate/harness.config.json" ] && [ "$(git -C "$candidate" rev-parse --show-toplevel 2>/dev/null)" = "$candidate" ]; then
    repo_root="$candidate"
    break
  fi
  [ "$candidate" != / ] || break
  candidate="${candidate%/*}"
  [ -n "$candidate" ] || candidate=/
done
if [ -z "$repo_root" ]; then
  repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
fi
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  harness_fail "{{name}}: could not resolve a repository root from '${script_dir}' (is git on PATH?)"
fi

# Forward the caller's arguments to the command; with none, the command runs as configured.
# `"$@"` is safe under `set -u` even when empty. They attach to the *last* command of the line
# below, so keep that line one command rather than a compound — and whether that command accepts a
# bare path or name filter is a property of the command, not of this wrapper.
{{command}} "$@"
status=$?

# Exactly one verdict line, so no caller ever appends an exit-code probe to this script. That
# compound form is what an unattended run's permission mode refuses.
if [ "$status" -eq 0 ]; then
  echo "PASS: {{name}}"
else
  echo "FAIL: {{name}} (exit $status)"
fi

exit "$status"
