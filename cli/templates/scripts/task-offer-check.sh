#!/usr/bin/env bash
# task-offer-check.sh — answer the change-request fence's opt-out test: print
# the main checkout of the working directory's checkout and exit 0 only when
# one was found and `.claude/harness-no-offer` is absent there.
#
# EXIT MAP.
#   0  the offer may proceed; the canonical main checkout is the one line on
#      stdout.
#   1  every no-offer outcome — not a checkout, no main checkout found, a clone
#      that fails the checks below, the marker present, the library missing.
#      Nothing on stdout or stderr.
#   2  bad usage: any argument. One usage line on stderr.
#
# WHO RUNS IT. An interactive session's fence, `.claude/CLAUDE.md` →
# `## Where a change request runs`, item 4, bare from the checkout root —
# `bash <scriptsDir>/task-offer-check.sh` — matched by the exact `Bash(…)` rule
# the generated `.claude/settings.json` carries. It judges the checkout of the
# WORKING DIRECTORY, never the one holding this file, and reads no
# `HARNESS_MAIN_REPO`. `jq` is reached on the clone arm only.
#
# REUSED FROM `lib/harness-run-lib.sh`: `hr_repo_root`, `hr_main_repo`,
# `hr_copy_sync_main_of`, `hr_clone_target_check_var`. `toc_alternates_candidate`
# is this script's own.
#
# NO `set -e`. A decision aborted half-way must still be silence with a non-zero
# exit, and every step below tests its own status and exits 1; `set -e` would add
# nothing but exits from inside library functions written to return a status.
#
# THE ACCEPTED STRICTER CASE. The clone arm goes through
# `hr_clone_target_check_var`, so it also refuses a clone with a planted
# `commondir`, `config.worktree` or `objects/info/http-alternates`, a
# non-directory `objects`, or a `.git/config` key outside the clone allow-list
# (a hand-run `git push -u`'s `branch.<name>.*`), where the inline fence test
# this script replaced offered. On a Linux host a run copy can carry leftover
# `commondir` / `http-alternates` placeholders after a killed session, and a
# `config.worktree` whose cause is not established (`docs/sandbox-verification.md`,
# row AP2), so the fence is silent there, as the wrappers already refuse that
# copy. A candidate whose `.git` is a symbolic link is refused, and the printed
# path is the canonical main checkout rather than the raw `alternates` prefix.
#
# TWO SETTLED STATES. A checkout whose fence names this script but which
# predates it gets bash's "No such file or directory", a non-zero exit and empty
# stdout — silence. A copy older than the template needs nothing: the exit
# contract is the whole interface, and `init --force` (after a `.bak`) is the
# upgrade route, as for every outer-loop script.
#
# REPRO — reproduce each outcome by hand, against a throwaway fixture:
#
#   w=$(mktemp -d); d="$w/demo"; git init -q "$d"
#   mkdir -p "$d/scripts/lib"   # copy this script + lib/harness-run-lib.sh there
#
#   main checkout  (cd "$d" && bash scripts/task-offer-check.sh; echo $?)
#                  -> the canonical "$d" on stdout, then 0
#   opted out      mkdir -p "$d/.claude" && : > "$d/.claude/harness-no-offer"
#                  (cd "$d" && bash scripts/task-offer-check.sh; echo $?)
#                  -> nothing printed, 1
#   not a checkout (cd "$w" && bash "$d/scripts/task-offer-check.sh"; echo $?)
#                  -> nothing printed, 1
#   bad usage      (cd "$d" && bash scripts/task-offer-check.sh x; echo $?)
#                  -> one usage line on stderr, 2

set -u

{ . "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"; } 2>/dev/null || exit 1

if [ "$#" -gt 0 ]; then
  echo "usage: task-offer-check.sh (takes no arguments)" >&2
  exit 2
fi

# Every refusal from here on is silent, whatever a library call writes.
exec 2>/dev/null

# Print the one path a clone's `alternates` file at <file> names, with
# `/.git/objects` removed. Return 1, printing nothing, unless the file holds
# exactly one line as `sed -n '$='` counts them (a final line without a newline
# counts; an empty file or a second line, empty or not, refuses) matching
# `/*/.git/objects`.
toc_alternates_candidate() {
  local file="${1-}" line="" first="" count=0
  while IFS= read -r line || [ -n "$line" ]; do
    count=$((count + 1))
    [ "$count" -eq 1 ] || return 1
    first=$line
    line=""
  done <"$file" || return 1
  [ "$count" -eq 1 ] || return 1
  case "$first" in
    /*/.git/objects) ;;
    *) return 1 ;;
  esac
  printf '%s\n' "${first%/.git/objects}"
}

top=$(hr_repo_root "$PWD") || exit 1

if [ ! -e "$top/.git/objects/info/alternates" ]; then
  main=$(hr_main_repo "$top") || exit 1
else
  candidate=$(toc_alternates_candidate "$top/.git/objects/info/alternates") || exit 1
  main=$(hr_copy_sync_main_of "$candidate") || exit 1
  top_c=$( CDPATH= cd -P -- "$top" && pwd -P ) || exit 1
  [ "$main" != "$top_c" ] || exit 1
  [ -d "$top_c/.git" ] && [ ! -L "$top_c/.git" ] || exit 1
  hr_clone_target_check_var "$main" "$top_c" "" || exit 1
fi

[ -n "$main" ] || exit 1
[ ! -e "$main/.claude/harness-no-offer" ] || exit 1
printf '%s\n' "$main"
exit 0
