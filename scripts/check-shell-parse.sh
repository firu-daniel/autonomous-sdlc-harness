#!/usr/bin/env bash
# check-shell-parse.sh — fail when a shell script git lists does not parse under the repository's bash
# floor. Hand-written for this repository, like run-gates.sh, which runs it as gate 16, and run by
# typecheck.sh before its type-check line; `docs/development.md` §5 gate 16 states the contract in
# prose.
#
# WHY IT EXISTS. An unattended run refuses a free-standing `bash -n`, and the permission profile does
# not allow one, while `bash scripts/typecheck.sh` and `bash scripts/run-gates.sh` are allowed. A
# library that does not parse still lets a suite that sources it pass — sourcing a file with a syntax
# error only prints to stderr — so a parse failure under macOS's `/bin/bash` 3.2 reached a branch
# with every suite green. This script is the parse check, reached through typecheck.sh in every unit
# and through run-gates.sh, over a file set the caller cannot steer.
#
# THE CONTRACT.
#   1. File set: every path `git ls-files --cached --others --exclude-standard` lists from the
#      repository root — tracked, or untracked and not ignored — that is (a) named `*.sh`, whatever
#      its shebang, or (b) named otherwise and opens on a bash shebang — `#!` then a path ending in
#      `/bash`, or `env` then `bash` (SHEBANG_RE below). A listed path that is not a regular file in
#      the working tree (an unstaged deletion, a submodule) is passed over. An ignored file is never
#      listed, so the set can only gain what git would let into a commit.
#   2. Interpreter: `/bin/bash` where it is executable, because on macOS that is bash 3.2, the floor
#      `.claude/context/conventions.md` → `## The stack, in the words the rules below use` states;
#      `bash` on PATH otherwise.
#   3. Each file is checked with `<interpreter> -n -- <path>` and graded by its exit status alone.
#   4. Every file is checked; every failure is reported.
#   5. No file in the set is a failure too: a listing that found nothing has checked nothing.
#
# Usage: check-shell-parse.sh   (no arguments)
# Exit: 0 every file parses · 1 one or more files do not, each on stderr as
#       `check-shell-parse: <path> does not parse` followed by bash's own lines, indented, all
#       reported; or no file was found, or no bash, git or temp file could be had · 2 bad usage
# Stdout, last line, on 0 and on 1 alike:
#       `check-shell-parse: <n> files checked with <interpreter> (bash <version>), <m> failed`
#
# Bash 3.2 throughout: no `mapfile`, no associative arrays, no array expanded under `set -u`.
set -uo pipefail

if [ $# -gt 0 ]; then
  echo "check-shell-parse: expected no arguments" >&2
  echo "  usage: check-shell-parse.sh" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "check-shell-parse: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

if [ -x /bin/bash ]; then
  interpreter=/bin/bash
else
  interpreter="$(command -v bash 2>/dev/null)"
  if [ -z "$interpreter" ]; then
    echo "check-shell-parse: no /bin/bash and no bash on PATH" >&2
    exit 1
  fi
fi
# shellcheck disable=SC2016 # expanded by the interpreter being reported, not by this shell
version="$("$interpreter" -c 'printf "%s" "$BASH_VERSION"' 2>/dev/null)"
[ -n "$version" ] || version="unknown"

SHEBANG_RE='^#![[:space:]]*([^[:space:]]*/)?(env[[:space:]]+)?bash([[:space:]]|$)'

listing="$(mktemp "${TMPDIR:-/tmp}/check-shell-parse.XXXXXX")" || {
  echo "check-shell-parse: could not create a temp file under '${TMPDIR:-/tmp}'" >&2
  exit 1
}
trap 'rm -f "$listing"' EXIT

if ! git ls-files -z --cached --others --exclude-standard >"$listing"; then
  echo "check-shell-parse: git ls-files failed" >&2
  exit 1
fi

checked=0
failures=0
while IFS= read -r -d '' path; do
  [ -f "$path" ] || continue
  case "$path" in
    *.sh) ;;
    *)
      first=""
      IFS= read -r first <"$path" || true
      [[ $first =~ $SHEBANG_RE ]] || continue
      ;;
  esac
  checked=$((checked + 1))
  if ! output="$("$interpreter" -n -- "$path" 2>&1)"; then
    failures=$((failures + 1))
    echo "check-shell-parse: ${path} does not parse" >&2
    while IFS= read -r line; do
      echo "  ${line}" >&2
    done <<EOF
${output}
EOF
  fi
done <"$listing"

summary="check-shell-parse: ${checked} files checked with ${interpreter} (bash ${version}), ${failures} failed"
if [ "$checked" -eq 0 ]; then
  echo "check-shell-parse: git ls-files listed no shell script, so nothing was checked" >&2
  echo "$summary"
  exit 1
fi
echo "$summary"
[ "$failures" -eq 0 ]
