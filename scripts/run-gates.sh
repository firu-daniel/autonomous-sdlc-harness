#!/usr/bin/env bash
# The harness's own verification, as one command.
#
# `docs/development.md` §5 defines twelve gates. This script runs the six a process can run
# unattended — gate 11 among them where the retrieval model cache is provisioned, and reported with
# the hand-run gates where it is not — and reports the six it cannot, so that a reviewer — human or
# agent — reading a green result has read the whole automatable half rather than one suite of it.
# `commands.test` in `harness.config.json` points here for exactly that reason: `npm test` is gate 4
# alone, and a branch review that reads it as "verified" is reading the other five automatable
# gates' worth of silence as a pass.
#
# NOT the generated `scripts/test.sh`. That file is `init`'s, it wraps whatever `commands.test`
# names, and a re-run regenerates it. This file is hand-written, is not in the set `init --force`
# rewrites, and is what that wrapper calls.
#
# Deliberately no `-e`: every gate runs on every invocation, because "which gates fail" is the
# answer worth having and stopping at the first one hides it.
set -uo pipefail

# Anchor to the repository root from this script's own location, never the caller's directory —
# the same derivation, and the same reasoning, as the wrappers `init` writes.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "run-gates: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

log="$(mktemp -t harness-gates)"
trap 'rm -f "$log"' EXIT

failed=()
passed=()
# Gate 11's third outcome, which is neither of the two arrays: see that gate's own block below.
floor_blocked=0

# Run one command and grade it by its EXIT STATUS. Output goes to a file rather than through a
# pipe: §5's opening rule is that piping a gate into a pager or into `head` returns the *pager's*
# status, so a failing gate reads as a passing one. No status-graded gate pipes; gate 6a pipes
# inside `gate_silent`, which reads no exit status.
gate() {
  local name="$1"; shift
  if "$@" >"$log" 2>&1; then
    passed+=("$name")
    echo "  ok    $name"
  else
    local status=$?
    failed+=("$name")
    echo "  FAIL  $name (exit $status)"
    sed 's/^/        /' "$log" | tail -25
  fi
}

# Run one command and grade it by its OUTPUT being empty. Gate 6 is the one gate read this way,
# because `grep` exits 1 precisely when it finds nothing, which is its passing case.
gate_silent() {
  local name="$1"; shift
  "$@" >"$log" 2>&1
  if [ -s "$log" ]; then
    failed+=("$name")
    echo "  FAIL  $name (printed output, which is the finding)"
    sed 's/^/        /' "$log" | tail -25
  else
    passed+=("$name")
    echo "  ok    $name"
  fi
}

echo "== gate 1 — manifests"
if command -v claude >/dev/null 2>&1; then
  gate "1a plugin manifest" claude plugin validate --strict plugin
  gate "1b marketplace manifest" claude plugin validate --strict .
else
  # Not skipped quietly. A gate that cannot run is not a gate that passed, and this script exists
  # because unreported silence is what it is here to prevent.
  failed+=("1 manifests (BLOCKED: claude is not on PATH)")
  echo "  BLOCKED  1 manifests — claude is not on PATH"
fi

echo "== gate 2 — CLI build and run"
gate "2a build" npm run build
gate "2b --version" node cli/dist/cli.js --version
gate "2c --help" node cli/dist/cli.js --help
gate "2d init --help" node cli/dist/cli.js init --help
# The one arm graded by REFUSAL: the CLI must reject a command it does not have. `gate` grades a
# zero exit as a pass, so this arm is inverted by hand rather than passed to it.
if node cli/dist/cli.js not-a-command >"$log" 2>&1; then
  failed+=("2e unknown command is refused")
  echo "  FAIL  2e unknown command is refused (it exited 0)"
else
  passed+=("2e unknown command is refused")
  echo "  ok    2e unknown command is refused"
fi

echo "== gate 3 — configuration and flow-graph schemas"
gate "3a example validates" npm run validate:config
gate "3b negative fixtures are refused" npm run validate:config:negative
gate "3c flow graph validates" npm run validate:flow-graph
gate "3d flow-graph negative fixtures are refused" npm run validate:flow-graph:negative
gate "3e flow graph static checks" bash scripts/check-flow-graph.sh
gate "3f each flow-graph check refuses its fixture" bash scripts/check-flow-graph.sh --negatives

echo "== gate 4 — init against a throwaway fixture"
gate "4 npm test" npm test

echo "== gate 6 — self-containment"
# `$HOME` expands to the home of whoever runs this, which is what makes it a pre-commit self-check
# rather than an audit — §5 says so, and it is why a clean clone passes it unconditionally.
# In a linked worktree `.git` is a one-line FILE, `gitdir: <main checkout>/.git/worktrees/<name>`,
# which `--exclude-dir=.git` does not skip because it skips directories only. The second stage
# drops output lines whose path is exactly `./.git` and nothing else, so a nested `.git` file and a
# file that quotes a `gitdir:` line are still printed. In a main checkout `.git` is the directory
# the first stage already skips, so the second stage never matches and the command is the same in
# both. Not `--exclude=.git`: GNU and BSD grep both match it against a file's base name, so it
# would also skip every nested file named `.git`. Not `--exclude=./.git`: GNU grep matches a
# recursive subfile's base name only, so it would exclude nothing on Linux.
# The pipe is safe here and only here: `gate_silent` grades OUTPUT, so the second stage's exit
# status (1 when it filters everything) is never read, and grep's own `grep: …` error lines do not
# begin `./.git:` and still reach the log.
machine_path_hits() {
  grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git | grep -v '^\./\.git:[0-9][0-9]*:'
}
gate_silent "6a no machine paths" machine_path_hits
# Two exclusions, not one. `examples/notes-app/.claude` is an adopted repository's own generated
# output; `./.claude` is THIS repository's, once it adopts the harness itself. Neither is a
# template committed into the namespace `init` generates, which is the breach this gate is for —
# and a `.claude/` under `cli/templates/`, or anywhere else, is still printed.
gate_silent "6b no template in the dot-namespace" \
  find . -name '.claude' -type d \
  -not -path './examples/notes-app/.claude' \
  -not -path './.claude' \
  -not -path './node_modules/*'
gate "6c llms.txt links resolve on main" bash scripts/check-llms-txt.sh
gate "6d plugin command spellings carry the prefix" bash scripts/check-command-spelling.sh
# 6a greps for the running user's `$HOME` only, so a transcript ref under /tmp, /private/var or
# another user's home, a `..`-climbing path, or a credential passes it; and 6a is red in a
# self-adopted checkout by design, so a new hit there is invisible to a "no new failure" reading.
gate_silent "6e no machine-local or credential material in eval artifacts" bash scripts/check-eval-artifacts.sh

echo "== gate 11 — docs-retrieval relevance floor"
# Written by hand rather than handed to `gate`, the way gate 2e is, because this gate has THREE
# outcomes and that helper grades two: it pushes every non-zero onto `failed`, and anything on
# `failed` makes this script exit 1. Status 3 is the model-cache status
# `evals/docs-retrieval/check-floor.mjs` reserves, and an empty machine-shared cache is a
# provisioning gap rather than a regression — counting it would turn `commands.test` red on every
# contributor's machine and in every branch worktree without the several-hundred-megabyte download,
# which is why §5 sorts real-model retrieval into gate 10. So it is reported below with the gates
# this script cannot run and pushed onto neither array. A SHORTFALL against the recorded floor is
# any other non-zero and still fails the script. It depends on gate 2a having built `cli/dist`.
node evals/docs-retrieval/check-floor.mjs >"$log" 2>&1
floor_status=$?
if [ "$floor_status" -eq 0 ]; then
  passed+=("11 docs-retrieval relevance floor")
  echo "  ok    11 docs-retrieval relevance floor"
elif [ "$floor_status" -eq 3 ]; then
  floor_blocked=1
  echo "  BLOCKED 11 docs-retrieval relevance floor — the retrieval model cache is empty"
  sed 's/^/        /' "$log" | tail -25
else
  failed+=("11 docs-retrieval relevance floor")
  echo "  FAIL  11 docs-retrieval relevance floor (exit $floor_status)"
  sed 's/^/        /' "$log" | tail -25
fi

echo
echo "== gates this script cannot run"
echo "  5  doctor's exit contract, by hand against gate 4's scratch repository"
echo "  7  the five adoption shapes, against real directories outside this checkout"
echo "  8  /autonomous-sdlc-harness:harness-analyze, which is judgement and runs inside a model session"
echo "  9  examples/notes-app, which installs dependencies inside the checkout"
echo "  10 docs retrieval with the real models, which downloads them and needs a network"
echo "  12 remote execution, against a real GitHub repository with a runner, a credential and minutes"
if [ "$floor_blocked" -eq 1 ]; then
  echo "  11 the docs-retrieval relevance floor, reported BLOCKED above: it runs unattended where the"
  echo "     retrieval model cache is provisioned and is listed here where it is not"
fi
echo "     -> docs/development.md §5"

# The same conditional the block above states, in the line a caller reads off a green run.
hand_run="gates 5, 7, 8, 9, 10 and 12 remain hand-run"
if [ "$floor_blocked" -eq 1 ]; then
  hand_run="$hand_run, and gate 11 with them — it runs unattended only where the model cache is provisioned"
fi

echo
if [ ${#failed[@]} -eq 0 ]; then
  echo "run-gates: ${#passed[@]} automatable checks passed; $hand_run"
  exit 0
fi
echo "run-gates: ${#failed[@]} failed, ${#passed[@]} passed" >&2
for name in "${failed[@]}"; do echo "  - $name" >&2; done
exit 1
