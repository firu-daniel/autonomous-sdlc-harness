#!/usr/bin/env bash
# check-machine-paths.sh — print every line under the working directory that names the running
# user's `$HOME`. Hand-written for this repository; run-gates.sh runs it from the repository root as
# gate 6a, and `docs/development.md` §5 gate 6 states the contract in prose.
#
# `$HOME` expands to the home of whoever runs this, which is what makes it a pre-commit self-check
# rather than an audit — §5 says so, and it is why a clean clone passes it unconditionally.
#
# THE `.git` FILE FILTER. In a linked worktree `.git` is a one-line FILE,
# `gitdir: <main checkout>/.git/worktrees/<name>`, which `--exclude-dir=.git` does not skip because
# it skips directories only. The first filter drops output lines whose path is exactly `./.git` and
# nothing else, so a nested `.git` file and a file that quotes a `gitdir:` line are still printed. In
# a main checkout `.git` is the directory the search already skips, so the filter never matches and
# the command is the same in both. Not `--exclude=.git`: GNU and BSD grep both match it against a
# file's base name, so it would also skip every nested file named `.git`. Not `--exclude=./.git`:
# GNU grep matches a recursive subfile's base name only, so it would exclude nothing on Linux.
# The pipe is safe because the gate grades OUTPUT, so no filtering stage's exit status (1 when it
# filters everything) is ever read; grep's own error lines take the stderr route below, not this pipe.
#
# THE EXCLUDED DIRECTORIES. `node_modules`, `dist` and `.git` hold nothing a commit of this tree
# carries as source. `test_run_logs` holds the Run gates phase's logs: they carry machine paths by
# construction, are gitignored, and include the log of the run in progress, so 6a would fail on its
# own output. `scratch` holds throwaway probes and the backend-comparison captures
# `docs/retrieval-eval.md` writes there: gitignored and machine-local by construction (a `du` of the
# model caches, a stream-json session's init line), so 6a would otherwise fail on files that can
# never be committed. `__pycache__` holds Python bytecode, which records each source's absolute
# path: gitignored, never committed, and written by any Python run against the editable install that
# does not carry `PYTHONDONTWRITEBYTECODE`.
#
# THE CLARIFICATIONS FILTER. The second filter drops files one or more directories below
# `harness-runs/clarifications/`: the clarification channel's per-branch questions and answers,
# gitignored and machine-local by construction — an operator's answer quotes terminal output, and a
# Node stack frame carries an absolute path. It anchors on the path rather than using
# `--exclude-dir=clarifications`, which GNU and BSD grep match against the base name and so would
# also skip the shipped `cli/templates/state-dir/clarifications/`. The tracked `README.md` at the
# directory's top level is not below a subdirectory and stays covered.
#
# THE ONE DROPPED ERROR (docs/sandbox-verification.md §5 F11). Inside the gate launcher's Linux
# `bwrap` worker, `grep -r` printed `grep: ./.bash_profile: Permission denied` and the like, and the
# gate failed on those lines alone. Read from the vector, not measured: `launch-sandboxed-gates.sh` →
# `lsg_bwrap_args_var` pins each absent root-level built-in protected path, and each absent exact
# `denyWrite` entry under the target, with `--ro-bind /dev/null <p>`; bwrap mounts every bind but
# `--dev-bind` `nodev`, and opening a character device on a `nodev` mount fails with `EACCES`. So
# exactly one stderr shape is dropped: a line that is exactly `grep: <p>: Permission denied` where
# `[ -c "<p>" ]` holds from the working directory. A character device holds no committed bytes — git
# tracks no device node — so dropping it hides nothing a commit could carry. Every other stderr line
# is printed: `Permission denied` on a regular file or a directory, which could hold a path, and any
# other error. The next Gate 15 container run confirms the reading.
#
# Usage: bash scripts/check-machine-paths.sh   (no arguments; searches the working directory)
# Output: each hit as `grep -rn` prints it, then each kept grep error line. Exit 0 either way — the
# gate grades output, not status. If the temporary file cannot be made it prints one line and exits
# 1, which is output too, so the gate fails closed.
set -uo pipefail

err="$(mktemp "${TMPDIR:-/tmp}/check-machine-paths.XXXXXX")" || {
  echo "check-machine-paths: could not create a temporary file under '${TMPDIR:-/tmp}'" >&2
  exit 1
}
trap 'rm -f "$err"' EXIT

grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=test_run_logs --exclude-dir=scratch --exclude-dir=__pycache__ 2>"$err" | grep -v '^\./\.git:[0-9][0-9]*:' | grep -v '^\./harness-runs/clarifications/[^/][^/]*/'

prefix='grep: '
suffix=': Permission denied'
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    "$prefix"*"$suffix")
      path="${line#"$prefix"}"
      path="${path%"$suffix"}"
      if [ -n "$path" ] && [ -c "$path" ]; then
        continue
      fi
      ;;
  esac
  printf '%s\n' "$line"
done <"$err"

exit 0
