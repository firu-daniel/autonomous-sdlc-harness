#!/usr/bin/env bash
# measure-suite.sh — time `npm test` and `scripts/run-gates.sh` at one commit, on this host. Hand-written
# for this repository, like run-gates.sh; it is the step a run-time figure in `docs/` is produced by.
#
# THE CONTRACT.
#   1. <ref> is resolved once, here, to a full commit SHA; everything measured is that commit.
#   2. It is checked out as a detached worktree under a fresh `mktemp -d` directory in the system temp
#      directory, never inside this checkout, and `npm ci` runs there untimed.
#   3. `npm test` runs <k> times, then `bash scripts/run-gates.sh` <k> times, each timed in wall-clock
#      milliseconds and reported on its own line with its exit status; each run-gates run is followed
#      by its own closing summary, so failure sets can be compared between runs.
#   4. The worktree and the temp directory are removed on every exit path, EXIT, INT and TERM alike,
#      by `git worktree remove --force` and a non-recursive `rmdir` — never a recursive `rm`.
#
# Usage: measure-suite.sh [--ref <commit>] [--runs <k>] [--cpus <n>]
#   --ref <commit>  default HEAD
#   --runs <k>      a positive integer; default 1
#   --cpus <n>      refused until the container mode lands
# Exit: 0 every timed run completed and was reported, whatever each run exited with · 1 setup failed
#       and no figure exists · 2 bad usage
#
# No `-e`, for run-gates.sh's reason: every timed run is reported even when one fails.
set -uo pipefail

bad_usage() {
  echo "measure-suite: $1" >&2
  exit 2
}
bad_argument() {
  echo "measure-suite: $1" >&2
  echo "  usage: measure-suite.sh [--ref <commit>] [--runs <k>] [--cpus <n>]" >&2
  exit 2
}

ref="HEAD"
runs="1"
cpus=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ref|--runs|--cpus)
      [ $# -ge 2 ] || bad_argument "$1 needs a value"
      case "$1" in
        --ref) ref="$2" ;;
        --runs) runs="$2" ;;
        --cpus) cpus="$2" ;;
      esac
      shift 2
      ;;
    *) bad_argument "unknown argument '$1'" ;;
  esac
done

if [ -n "$cpus" ]; then
  echo "measure-suite: --cpus needs the container mode, which Task 6 of chore_test_suite_run_time adds" >&2
  exit 2
fi
case "$runs" in
  ''|*[!0-9]*) bad_usage "--runs takes a positive integer, not '$runs'" ;;
esac
# Base 10 forced, so a leading zero is not read as octal.
runs=$((10#$runs))
[ "$runs" -ge 1 ] || bad_usage "--runs takes a positive integer, not '$runs'"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "measure-suite: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

sha="$(git rev-parse --verify --quiet "${ref}^{commit}")"
if [ -z "$sha" ]; then
  echo "measure-suite: --ref '$ref' does not resolve to a commit" >&2
  exit 2
fi

for tool in node npm; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "measure-suite: $tool is not on PATH" >&2
    exit 1
  fi
done

now_ms() {
  node -e 'process.stdout.write(String(Date.now()))'
}

work=""
tree=""
log=""
child=""
cleaned=0
cleanup() {
  [ "$cleaned" -eq 1 ] && return
  cleaned=1
  [ -n "$work" ] || return
  if [ -d "$tree" ]; then
    if ! git -C "$repo_root" worktree remove --force "$tree" >/dev/null 2>&1; then
      echo "measure-suite: could not remove the worktree at '$tree'; remove it with 'git worktree remove --force'" >&2
    fi
  fi
  [ -n "$log" ] && rm -f "$log"
  rmdir "$work" 2>/dev/null || echo "measure-suite: could not remove '$work'" >&2
}
# A signal lands while `wait` blocks on the backgrounded child, so it is handled at once rather than
# after the child exits; the child is stopped before its worktree is removed.
on_signal() {
  if [ -n "$child" ]; then
    kill -TERM "$child" 2>/dev/null
    wait "$child" 2>/dev/null
  fi
  echo "measure-suite: interrupted; removing the worktree" >&2
  cleanup
  exit "$1"
}
trap cleanup EXIT
trap 'on_signal 130' INT
trap 'on_signal 143' TERM

tmp_base="${TMPDIR:-/tmp}"
work="$(mktemp -d "${tmp_base%/}/measure-suite.XXXXXX")"
if [ -z "$work" ] || [ ! -d "$work" ]; then
  work=""
  echo "measure-suite: mktemp -d failed under '$tmp_base'" >&2
  exit 1
fi
tree="$work/tree"
log="$work/run.log"

# Runs "$@" inside the worktree with its output in $log rather than a pipe, and sets $status.
run_in_tree() {
  ( cd "$tree" && exec "$@" ) >"$log" 2>&1 &
  child=$!
  wait "$child"
  status=$?
  child=""
}

setup_failed() {
  echo "measure-suite: $1 failed (exit $status); last lines of its log:" >&2
  tail -n 25 "$log" | sed 's/^/  /' >&2
  exit 1
}

git worktree add --detach "$tree" "$sha" >"$log" 2>&1
status=$?
[ "$status" -eq 0 ] || setup_failed "git worktree add"

echo "measure-suite: uname -sm: $(uname -sm)"
echo "measure-suite: node --version: $(node --version)"
echo "measure-suite: git --version: $(git --version)"
host_cpus="$(node -e 'process.stdout.write(String(require("os").availableParallelism()))')"
echo "measure-suite: os.availableParallelism(): $host_cpus"
echo "measure-suite: ref $ref = $sha"

run_in_tree npm ci
[ "$status" -eq 0 ] || setup_failed "npm ci"

timed() {
  local label="$1" i="$2"; shift 2
  local start end ms
  start="$(now_ms)"
  run_in_tree "$@"
  end="$(now_ms)"
  ms=$((end - start))
  printf 'measure-suite: host cpus=%s ref=%s %s run %d/%d: %d.%02d s, exit %d\n' \
    "$host_cpus" "${sha:0:12}" "$label" "$i" "$runs" $((ms / 1000)) $(((ms % 1000) / 10)) "$status"
}

i=1
while [ "$i" -le "$runs" ]; do
  timed npm-test "$i" npm test
  i=$((i + 1))
done

i=1
while [ "$i" -le "$runs" ]; do
  timed run-gates "$i" bash scripts/run-gates.sh
  if grep -q '^run-gates:' "$log"; then
    sed -n '/^run-gates:/,$s/^/  /p' "$log"
  else
    echo "  (its log has no 'run-gates:' summary line)"
  fi
  i=$((i + 1))
done

exit 0
