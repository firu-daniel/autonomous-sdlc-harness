#!/usr/bin/env bash
# measure-suite.sh — time `npm test` and `scripts/run-gates.sh` at one commit, on this host or in a
# Linux container pinned to <n> CPUs. Hand-written for this repository, like run-gates.sh; it is the
# step a run-time figure in `docs/` is produced by.
#
# THE CONTRACT.
#   1. <ref> is resolved once, on the host, to a full commit SHA; everything measured is that commit.
#   2. Host mode checks it out as a detached worktree under a fresh `mktemp -d` directory in the
#      system temp directory, never inside this checkout, and `npm ci` runs there untimed.
#   3. `npm test` runs <k> times, then `bash scripts/run-gates.sh` <k> times, each timed in wall-clock
#      milliseconds and reported on its own line with its exit status; each run-gates run is followed
#      by its own closing summary, so failure sets can be compared between runs.
#   4. The worktree and the temp directory are removed on every exit path, EXIT, INT and TERM alike,
#      by `git worktree remove --force` and a non-recursive `rmdir` — never a recursive `rm`.
#   5. Container mode (`--cpus <n>`) ships `git archive <sha>` — the commit, not the working tree — in
#      a file under a `mktemp -d` directory, removed on every exit path by `rm -f` and `rmdir`, and
#      runs this script with `--in-container` in `node:20-bookworm` under `--cpuset-cpus 0-<n-1>`.
#      `--cpuset-cpus`, not a `--cpus` quota: Node reads affinity, so `os.availableParallelism()`
#      answers <n> there, and a quota would leave it planning for the host's count.
#   6. Inside the container, untimed: root installs `jq`; then, as the image's `node` user — never
#      root, or the suite's unreadable-file cases do not hold — the archive is extracted into
#      /home/node/work, committed once as a fresh repository, and `npm ci` runs. Item 3's timed loops
#      follow, <k> runs each, as `node`, with `container` in the <mode> slot and cpus= as the
#      container reports it.
#   7. In the container gate 1 reports BLOCKED (no `claude` on PATH) and gate 11 its model-cache
#      BLOCKED by design, so a container `run-gates` figure is a time, never a verdict; gate verdicts
#      are read from host mode.
#
# Usage: measure-suite.sh [--ref <commit>] [--runs <k>] [--cpus <n>]
#   --ref <commit>  default HEAD
#   --runs <k>      a positive integer; default 1
#   --cpus <n>      a positive integer no larger than the container runtime's CPU count; measures in a
#                   container pinned to CPUs 0..<n-1> instead of on this host
#   --in-container  internal: the container side of --cpus; refused unless /.dockerenv exists
# Exit: 0 every timed run completed and was reported, whatever each run exited with · 1 setup failed
#       and no figure exists · 2 bad usage · 3 --cpus given and no container runtime is running
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
in_container=0
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
    --in-container) in_container=1; shift ;;
    *) bad_argument "unknown argument '$1'" ;;
  esac
done

case "$runs" in
  ''|*[!0-9]*) bad_usage "--runs takes a positive integer, not '$runs'" ;;
esac
# Base 10 forced, so a leading zero is not read as octal.
runs=$((10#$runs))
[ "$runs" -ge 1 ] || bad_usage "--runs takes a positive integer, not '$runs'"

if [ "$in_container" -eq 1 ]; then
  [ -f /.dockerenv ] || bad_usage "--in-container is internal to --cpus and runs only inside its container"
  [ -z "$cpus" ] || bad_usage "--in-container does not take --cpus"
  mode="container"
else
  mode="host"
fi

if [ -n "$cpus" ]; then
  case "$cpus" in
    ''|*[!0-9]*) bad_usage "--cpus takes a positive integer, not '$cpus'" ;;
  esac
  cpus=$((10#$cpus))
  [ "$cpus" -ge 1 ] || bad_usage "--cpus takes a positive integer, not '$cpus'"
  mode="launcher"
fi

log=""
child=""
work=""
tree=""
archive=""
cleaned=0
cleanup() {
  [ "$cleaned" -eq 1 ] && return
  cleaned=1
  [ -n "$work" ] || return
  if [ "$mode" = "host" ] && [ -d "$tree" ]; then
    if ! git -C "$repo_root" worktree remove --force "$tree" >/dev/null 2>&1; then
      echo "measure-suite: could not remove the worktree at '$tree'; remove it with 'git worktree remove --force'" >&2
    fi
  fi
  [ -n "$log" ] && rm -f "$log"
  [ -n "$archive" ] && rm -f "$archive"
  rmdir "$work" 2>/dev/null || echo "measure-suite: could not remove '$work'" >&2
}
# A signal lands while `wait` blocks on the backgrounded child, so it is handled at once rather than
# after the child exits; the child is stopped before its files are removed.
on_signal() {
  if [ -n "$child" ]; then
    kill -TERM "$child" 2>/dev/null
    wait "$child" 2>/dev/null
  fi
  echo "measure-suite: interrupted; removing its temporary files" >&2
  cleanup
  exit "$1"
}

make_work_dir() {
  local tmp_base="${TMPDIR:-/tmp}"
  work="$(mktemp -d "${tmp_base%/}/measure-suite.XXXXXX")"
  if [ -z "$work" ] || [ ! -d "$work" ]; then
    work=""
    echo "measure-suite: mktemp -d failed under '$tmp_base'" >&2
    exit 1
  fi
}

if [ "$mode" = "container" ]; then
  sha="$ref"
else
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
fi

if [ "$mode" = "launcher" ]; then
  runtime_missing="measure-suite: --cpus needs a running container runtime (docker CLI; Docker Desktop, colima or OrbStack) — see docs/development.md §5 gate 4"
  if ! command -v docker >/dev/null 2>&1; then
    echo "$runtime_missing" >&2
    exit 3
  fi
  runtime_cpus="$(docker info --format '{{.NCPU}}' 2>/dev/null)"
  case "$runtime_cpus" in
    ''|*[!0-9]*)
      echo "$runtime_missing" >&2
      exit 3
      ;;
  esac
  if [ "$cpus" -gt "$runtime_cpus" ]; then
    bad_usage "--cpus $cpus is more than the $runtime_cpus CPUs the container runtime has; give its VM more CPUs or ask for fewer"
  fi

  trap cleanup EXIT
  trap 'on_signal 130' INT
  trap 'on_signal 143' TERM
  make_work_dir
  archive="$work/src.tar"
  if ! git archive --format=tar -o "$archive" "$sha"; then
    echo "measure-suite: git archive of $sha failed" >&2
    exit 1
  fi

  docker run --rm --cpuset-cpus "0-$((cpus - 1))" \
    -v "$work:/in:ro" \
    -v "$script_dir/$(basename "${BASH_SOURCE[0]}"):/in-script/measure-suite.sh:ro" \
    node:20-bookworm \
    bash /in-script/measure-suite.sh --in-container --runs "$runs" --ref "$sha" &
  child=$!
  wait "$child"
  status=$?
  child=""
  case "$status" in
    0|1|2) exit "$status" ;;
  esac
  echo "measure-suite: the container exited $status before reporting (docker run failed or it was killed)" >&2
  exit 1
fi

if [ "$mode" = "container" ]; then
  tree="/home/node/work"
  if [ "$(id -u)" -ne 0 ]; then
    echo "measure-suite: --in-container must start as root to install jq" >&2
    exit 1
  fi
  if [ ! -f /in/src.tar ]; then
    echo "measure-suite: /in/src.tar is missing; the container runtime may not share the host's temp directory" >&2
    exit 1
  fi
else
  for tool in node npm; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      echo "measure-suite: $tool is not on PATH" >&2
      exit 1
    fi
  done
fi

now_ms() {
  node -e 'process.stdout.write(String(Date.now()))'
}

trap cleanup EXIT
trap 'on_signal 130' INT
trap 'on_signal 143' TERM
make_work_dir
[ "$mode" = "host" ] && tree="$work/tree"
log="$work/run.log"

# Runs "$@" inside the tree with its output in $log rather than a pipe, and sets $status. In the
# container it runs as `node`; `runuser` keeps the working directory.
run_in_tree() {
  if [ "$mode" = "container" ]; then
    ( cd "$tree" && exec runuser -u node -- "$@" ) >"$log" 2>&1 &
  else
    ( cd "$tree" && exec "$@" ) >"$log" 2>&1 &
  fi
  child=$!
  wait "$child"
  status=$?
  child=""
}

# Runs "$@" from / with its output in $log, and sets $status.
run_logged() {
  "$@" >"$log" 2>&1 &
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

if [ "$mode" = "container" ]; then
  echo "measure-suite: uname -sm: $(uname -sm)"
  echo "measure-suite: nproc: $(nproc)"
  echo "measure-suite: node --version: $(node --version)"
  echo "measure-suite: git --version: $(git --version)"
  run_logged env DEBIAN_FRONTEND=noninteractive apt-get update
  [ "$status" -eq 0 ] || setup_failed "apt-get update"
  run_logged env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends jq
  [ "$status" -eq 0 ] || setup_failed "apt-get install jq"
  run_logged runuser -u node -- mkdir -p "$tree"
  [ "$status" -eq 0 ] || setup_failed "mkdir $tree"
  run_logged runuser -u node -- tar -xf /in/src.tar -C "$tree"
  [ "$status" -eq 0 ] || setup_failed "extracting the archive"
  run_in_tree git init -q
  [ "$status" -eq 0 ] || setup_failed "git init"
  run_in_tree git add -- :/
  [ "$status" -eq 0 ] || setup_failed "git add"
  run_in_tree git -c user.name=measure-suite -c user.email=measure-suite@localhost \
    -c commit.gpgsign=false commit -q -m "measure-suite: $sha"
  [ "$status" -eq 0 ] || setup_failed "git commit"
else
  git worktree add --detach "$tree" "$sha" >"$log" 2>&1
  status=$?
  [ "$status" -eq 0 ] || setup_failed "git worktree add"
  echo "measure-suite: uname -sm: $(uname -sm)"
  echo "measure-suite: node --version: $(node --version)"
  echo "measure-suite: git --version: $(git --version)"
fi
report_cpus="$(node -e 'process.stdout.write(String(require("os").availableParallelism()))')"
echo "measure-suite: os.availableParallelism(): $report_cpus"
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
  printf 'measure-suite: %s cpus=%s ref=%s %s run %d/%d: %d.%02d s, exit %d\n' \
    "$mode" "$report_cpus" "${sha:0:12}" "$label" "$i" "$runs" $((ms / 1000)) $(((ms % 1000) / 10)) "$status"
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
