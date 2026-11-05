#!/usr/bin/env bash
# The harness's own verification, as one command.
#
# `docs/development.md` §5 defines sixteen gates. This script runs the nine a process can run
# unattended — gates 1, 2, 3, 4, 6, 11, 13, 14 and 16 — and reports the seven it cannot, so that a
# reviewer — human or agent — reading a green result has read the whole automatable half rather than
# one suite of it. Gate 14 depends on gate 2a's build. Three legs are SKIPPED where their tool cannot
# be resolved: 6f where neither PATH nor `uvx` provides `typos` 1.51.1, 14c where `actionlint` is not
# on PATH, and 14d where neither provides `zizmor` 1.30.1. Two of the nine are conditional. Gate 11 runs where the retrieval model cache is
# provisioned and the workspace's retrieval packages are installed, and is reported BLOCKED with the
# hand-run gates where they are not. Gate 13 (the Python docs-retrieval service) reports a leg
# BLOCKED where `uv` or its synced environment is missing, and its container leg 13d SKIPPED unless
# HARNESS_GATES_CONTAINERS=1 is set on a machine with Docker. Neither outcome is a pass or a failure.
# Gate 16 parses every tracked or untracked-unignored shell script with `bash -n` under `/bin/bash`,
# the bash 3.2 floor on macOS: an unattended run refuses a free-standing `bash -n`, and this script
# is a route to one.
# `commands.test` in `harness.config.json` points here for exactly that reason: `npm test` is gate 4
# alone, and a branch review that reads it as "verified" is reading the other eight automatable
# gates' worth of silence as a pass.
#
# NOT the generated `scripts/test.sh`. That file is `init`'s, it wraps whatever `commands.test`
# names, and a re-run regenerates it. This file is hand-written, is not in the set `init --force`
# rewrites, and is what that wrapper calls.
#
# A ROUND, in two phases, driven by `scripts/lib/gate-round-lib.sh`. Each check is a unit
# (`run_unit`), keyed by its gate id.
#   focused — only where the previous round in the lane left a readable record with a FAIL row: the
#     units that failed there, each with the prerequisite it depends on (2a for every check that runs
#     `cli/dist`), and gate 4 on just the test files that failed there. Any failure here stops the
#     round: nothing else runs, and the round exits 1.
#   full — every unit, in order, skipping only a unit that passed in the focused phase; gate 4
#     always runs the whole suite here. Every unit runs and nothing stops early, because "which gates
#     fail" is the answer worth having — hence no `-e`.
# Exit 0 needs a full phase with no failure: a focused gate-4 pass is counted among neither the
# passes nor the failures, and a stopped round has pushed its failure onto `failed`.
#
# THE RECORDS. Under `RUN_TEST_SUITE_LOG_DIR` only — `run-test-suite.sh` exports it with
# `RUN_TEST_SUITE_LABEL`, and the round library validates both — this round writes `<label>.gates.tsv`, one
# row per unit, and gate 4 writes `<label>.<phase>.tests.tsv`, one row per test file. Run by hand,
# there is no lane: no gate record is written, every round runs in full, and gate 4's per-file
# record lives in this script's temporary directory until it exits.
#
# Every gate line ends with its duration in whole seconds. After the last unit, the ten slowest test
# files of the last gate-4 run are printed, on a pass, a failure and a stopped round
# alike.
#
# Gate 4 names its reporters, so it pins `tap` to stdout beside the per-file one: naming any reporter
# drops Node's default, and the `not ok` diagnostic printer in `gate` reads TAP, which Node 20 and 22
# already print to a non-terminal.
set -uo pipefail

# Anchor to the repository root from this script's own location, never the caller's directory —
# the same reasoning as the wrappers `init` writes, but by git's discovery from this script's own
# directory rather than their `harness.config.json` walk (`docs/sandbox-verification.md` §5 F15).
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "run-gates: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi

# The run library first: the round library validates the lane against its
# HR_TEST_RUN_LABEL_PATTERN and HR_TEST_RUN_LOG_SUBDIR.
# shellcheck source=lib/harness-run-lib.sh
. "$script_dir/lib/harness-run-lib.sh"
# shellcheck source=lib/gate-round-lib.sh
. "$script_dir/lib/gate-round-lib.sh"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/harness-gates.XXXXXX")" || {
  echo "run-gates: could not create a temporary directory under '${TMPDIR:-/tmp}'" >&2
  exit 1
}
log="$tmp_dir/log"
# The known files, then the directory: never a recursive removal.
trap 'rm -f "$log" "$tmp_dir/focused.tests.tsv" "$tmp_dir/full.tests.tsv"; rmdir "$tmp_dir" 2>/dev/null' EXIT

gr_init "$repo_root" "$tmp_dir"
GR_PREREQUISITES='2a:2b,2c,2d,2e,11,13c,14a,14b,14c,14d'
GR_NARROWED_IDS='4'
GR_TEST_FILE_PATTERN='^test/[A-Za-z0-9._/-]+\.test\.mjs$'
GR_TEST_ROOT='cli'

failed=()
passed=()
# Gate 11's third outcome, which is neither of the two arrays: see that gate's own arm below.
floor_blocked=0
# Gate 13's BLOCKED and SKIPPED outcomes, also in neither array: see that gate's own arm below.
python_blocked=()
python_skip_reason=""
typos_skip_reason=""
actionlint_skip_reason=""
zizmor_skip_reason=""
# The last gate-4 run's per-file record and phase, for the slowest-files section.
gate4_destination=""
gate4_phase=""

# Each check sets these; `run_unit` records them.
unit_status=""
unit_secs=0

# Run one command and grade it by its EXIT STATUS. Output goes to a file rather than through a
# pipe: §5's opening rule is that piping a gate into a pager or into `head` returns the *pager's*
# status, so a failing gate reads as a passing one. No status-graded gate pipes; gate 6a's script
# pipes, run under `gate_silent`, which reads no exit status.
gate() {
  local name="$1"; shift
  local start=$SECONDS
  if "$@" >"$log" 2>&1; then
    unit_secs=$((SECONDS - start))
    unit_status=ok
    passed+=("$name")
    gr_gate_line ok "$name" "$unit_secs"
  else
    local status=$?
    unit_secs=$((SECONDS - start))
    unit_status=FAIL
    failed+=("$name")
    gr_gate_line FAIL "$name" "$unit_secs" "exit $status"
    # A TAP runner reports each failure inline as it happens and only counts in its closing
    # summary, so the tail below alone never names a failing test. Each `not ok` line is printed
    # with the YAML diagnostic block `node --test` writes right after it — `error:`, `expected:`,
    # `actual:`, `location:` — because without it the log cannot say which assertion failed. The
    # block closes on `...` at the `---` line's own indentation, so an assertion diff's deeper
    # `...` does not end it early; each block is capped at `cap` lines. No match is normal and
    # prints nothing.
    awk -v cap=40 '
      block {
        if (substr($0, 1, length(ind) + 3) == ind "..." && length($0) == length(ind) + 3) {
          if (n > cap) print "        " ind "  [diagnostic truncated after " cap " lines]"
          print "        " $0; block = 0; next
        }
        if (++n <= cap) print "        " $0
        next
      }
      pending && /^[[:space:]]*---[[:space:]]*$/ {
        match($0, /^[[:space:]]*/); ind = substr($0, 1, RLENGTH)
        print "        " $0; block = 1; n = 0; pending = 0; next
      }
      { pending = 0 }
      /^[[:space:]]*not ok / { print "        " $0; pending = 1 }
    ' "$log" || true
    sed 's/^/        /' "$log" | tail -25
  fi
}

# Run one command and grade it by its OUTPUT being empty. Gate 6 is the one gate read this way,
# because `grep` exits 1 precisely when it finds nothing, which is its passing case.
gate_silent() {
  local name="$1"; shift
  local start=$SECONDS
  "$@" >"$log" 2>&1
  unit_secs=$((SECONDS - start))
  if [ -s "$log" ]; then
    unit_status=FAIL
    failed+=("$name")
    gr_gate_line FAIL "$name" "$unit_secs" "printed output, which is the finding"
    sed 's/^/        /' "$log" | tail -25
  else
    unit_status=ok
    passed+=("$name")
    gr_gate_line ok "$name" "$unit_secs"
  fi
}

# Two exclusions, not one. `examples/notes-app/.claude` is an adopted repository's own generated
# output; `./.claude` is THIS repository's, once it adopts the harness itself. Neither is a
# template committed into the namespace `init` generates, which is the breach this gate is for —
# and a `.claude/` under `cli/templates/`, or anywhere else, is still printed.
# A `.claude/` holding no file or symlink at any depth is not printed: git tracks files only, so
# such a directory can put nothing into a commit. That is why the empty `.claude/.cc-writes/` the
# agent runner's sandbox leaves under the run-artifact tree no longer fails this gate, while a
# `.claude/` holding any file is still printed wherever it sits, `harness-runs/` included.
dot_namespace_hits() {
  find . -name '.claude' -type d \
    -not -path './examples/notes-app/.claude' \
    -not -path './.claude' \
    -not -path './node_modules/*' |
    while IFS= read -r dir; do
      if [ -n "$(find "$dir" \( -type f -o -type l \) -print -quit)" ]; then
        printf '%s\n' "$dir"
      fi
    done
}

# Gate 13's legs.
# Hand-written beside gate 11 and for the same reason: `gate` grades two outcomes, and
# `scripts/python-service.sh`'s exit contract has two more that are neither a pass nor a failure.
# Status 3 is an unprovisioned toolchain (`uv` missing, or no synced environment), BLOCKED on gate
# 11's terms: provisioning a checkout is not a property of the code. Status 4 is `container-test`'s
# no-Docker skip, honoured only when the caller says the leg may produce it ($2 = skip4); on any
# other leg the wrapper never produces it, so it falls through to a failure. 13c's bridge cases run
# `cli/dist`, so 13c depends on gate 2a.
python_gate() {
  local name="$1" skip4="$2"; shift 2
  local start=$SECONDS
  "$@" >"$log" 2>&1
  local status=$?
  unit_secs=$((SECONDS - start))
  if [ "$status" -eq 0 ]; then
    unit_status=ok
    passed+=("$name")
    gr_gate_line ok "$name" "$unit_secs"
  elif [ "$status" -eq 3 ]; then
    unit_status=BLOCKED
    # A leg BLOCKED in the focused phase runs again in the full one; list it once.
    case " ${python_blocked[*]-} " in
      *" $name "*) ;;
      *) python_blocked+=("$name") ;;
    esac
    gr_gate_line BLOCKED "$name" "$unit_secs" "uv or the synced Python environment is missing; run bash scripts/python-service.sh sync"
    sed 's/^/        /' "$log" | tail -25
  elif [ "$status" -eq 4 ] && [ "$skip4" = "skip4" ]; then
    unit_status=SKIPPED
    python_skip_reason="docker is not on PATH"
    gr_gate_line SKIPPED "$name" "$unit_secs" "docker is not on PATH; the container leg needs Docker"
    sed 's/^/        /' "$log" | tail -25
  else
    unit_status=FAIL
    failed+=("$name")
    gr_gate_line FAIL "$name" "$unit_secs" "exit $status"
    sed 's/^/        /' "$log" | tail -25
  fi
}

# The heading of the gate a unit belongs to, printed once per phase before the first of its units
# that runs: a phase may start a gate at any of its legs.
header_gate=""
header_phase=""
gate_header() {
  if [ "$1" != "$header_gate" ] || [ "$GR_PHASE" != "$header_phase" ]; then
    echo "== gate $1 — $2"
    header_gate="$1"
    header_phase="$GR_PHASE"
  fi
}

# run_unit <id> — run one check, print its line(s), and record it once. The round library calls it
# with GR_PHASE set, and GR_FOCUS_FILES for gate 4 in the focused phase.
run_unit() {
  local id="$1" start=$SECONDS status status_1a n f
  unit_status=FAIL
  unit_secs=0
  case "$id" in
    1)
      gate_header 1 "manifests"
      if command -v claude >/dev/null 2>&1; then
        gate "1a plugin manifest" claude plugin validate --strict plugin
        status_1a="$unit_status"
        gate "1b marketplace manifest" claude plugin validate --strict .
        [ "$status_1a" = FAIL ] && unit_status=FAIL
      else
        # Not skipped quietly. A gate that cannot run is not a gate that passed, and this script
        # exists because unreported silence is what it is here to prevent. It is on `failed`, so
        # it is recorded as a FAIL row.
        failed+=("1 manifests (BLOCKED: claude is not on PATH)")
        unit_status=FAIL
        gr_gate_line BLOCKED "1 manifests" "$((SECONDS - start))" "claude is not on PATH"
      fi
      unit_secs=$((SECONDS - start))
      ;;
    2a)
      gate_header 2 "CLI build and run"
      gate "2a build" npm run build
      ;;
    2b) gate_header 2 "CLI build and run"; gate "2b --version" node cli/dist/cli.js --version ;;
    2c) gate_header 2 "CLI build and run"; gate "2c --help" node cli/dist/cli.js --help ;;
    2d) gate_header 2 "CLI build and run"; gate "2d init --help" node cli/dist/cli.js init --help ;;
    2e)
      gate_header 2 "CLI build and run"
      # The one arm graded by REFUSAL: the CLI must reject a command it does not have. `gate`
      # grades a zero exit as a pass, so this arm is inverted by hand rather than passed to it.
      if node cli/dist/cli.js not-a-command >"$log" 2>&1; then
        unit_secs=$((SECONDS - start))
        unit_status=FAIL
        failed+=("2e unknown command is refused")
        gr_gate_line FAIL "2e unknown command is refused" "$unit_secs" "it exited 0"
      else
        unit_secs=$((SECONDS - start))
        unit_status=ok
        passed+=("2e unknown command is refused")
        gr_gate_line ok "2e unknown command is refused" "$unit_secs"
      fi
      ;;
    3a)
      gate_header 3 "configuration and flow-graph schemas"
      gate "3a example validates" npm run validate:config
      ;;
    3b) gate_header 3 "configuration and flow-graph schemas"; gate "3b negative fixtures are refused" npm run validate:config:negative ;;
    3c) gate_header 3 "configuration and flow-graph schemas"; gate "3c flow graph validates" npm run validate:flow-graph ;;
    3d) gate_header 3 "configuration and flow-graph schemas"; gate "3d flow-graph negative fixtures are refused" npm run validate:flow-graph:negative ;;
    3e) gate_header 3 "configuration and flow-graph schemas"; gate "3e flow graph static checks" bash scripts/check-flow-graph.sh ;;
    3f) gate_header 3 "configuration and flow-graph schemas"; gate "3f each flow-graph check refuses its fixture" bash scripts/check-flow-graph.sh --negatives ;;
    4)
      gate_header 4 "init against a throwaway fixture"
      gate4_destination="$(gr_tests_destination)"
      gate4_phase="$GR_PHASE"
      # `tap` is pinned to stdout because naming any reporter drops Node's default, and `gate`'s
      # `not ok` diagnostic printer reads TAP.
      local gate4_args=(--test-reporter=tap --test-reporter-destination=stdout
        "--test-reporter=$repo_root/scripts/lib/test-timing-reporter.mjs"
        "--test-reporter-destination=$gate4_destination")
      if [ "$GR_PHASE" = focused ]; then
        n=0
        for f in $GR_FOCUS_FILES; do
          gate4_args+=("$f")
          n=$((n + 1))
        done
        gate "4 npm test, focused on $n file(s)" npm run test --workspace cli -- "${gate4_args[@]}"
        # Only the full run counts among the passes.
        if [ "$unit_status" = ok ]; then
          unset "passed[$((${#passed[@]} - 1))]"
        fi
      else
        gate "4 npm test" npm run test --workspace cli -- "${gate4_args[@]}"
      fi
      ;;
    6a)
      gate_header 6 "self-containment"
      # Gate 6a's exclusions, filters and the one grep error it drops are argued in
      # `scripts/check-machine-paths.sh`'s header; it searches the working directory, the root here.
      gate_silent "6a no machine paths" bash scripts/check-machine-paths.sh
      ;;
    6b) gate_header 6 "self-containment"; gate_silent "6b no template in the dot-namespace" dot_namespace_hits ;;
    6c) gate_header 6 "self-containment"; gate "6c llms.txt links resolve on main" bash scripts/check-llms-txt.sh ;;
    6d) gate_header 6 "self-containment"; gate "6d plugin command spellings carry the prefix" bash scripts/check-command-spelling.sh ;;
    6e)
      gate_header 6 "self-containment"
      # 6a greps for the running user's `$HOME` only, so a transcript ref under /tmp, /private/var
      # or another user's home, a `..`-climbing path, or a credential passes it; and 6a is red in a
      # self-adopted checkout by design, so a new hit there is invisible to a "no new failure"
      # reading.
      gate_silent "6e no machine-local or credential material in eval artifacts" bash scripts/check-eval-artifacts.sh
      ;;
    6f)
      gate_header 6 "self-containment"
      # Hand-written as 14c is: status 4 is `check-typos.sh`'s no-typos skip, pushed onto neither
      # array.
      bash scripts/check-typos.sh >"$log" 2>&1
      status=$?
      unit_secs=$((SECONDS - start))
      if [ "$status" -eq 0 ]; then
        unit_status=ok
        passed+=("6f shipped files pass typos")
        gr_gate_line ok "6f shipped files pass typos" "$unit_secs"
      elif [ "$status" -eq 4 ]; then
        unit_status=SKIPPED
        typos_skip_reason="typos 1.51.1 is available neither on PATH nor through uvx"
        gr_gate_line SKIPPED "6f shipped files pass typos" "$unit_secs" "${typos_skip_reason}"
        sed 's/^/        /' "$log" | tail -25
      else
        unit_status=FAIL
        failed+=("6f shipped files pass typos")
        gr_gate_line FAIL "6f shipped files pass typos" "$unit_secs" "exit $status"
        sed 's/^/        /' "$log" | tail -25
      fi
      ;;
    11)
      gate_header 11 "docs-retrieval relevance floor"
      # Written by hand rather than handed to `gate`, the way gate 2e is, because this gate has
      # THREE outcomes and that helper grades two: it pushes every non-zero onto `failed`, and
      # anything on `failed` makes this script exit 1. Status 3 is the model-cache status
      # `evals/docs-retrieval/check-floor.mjs` reserves, and an empty machine-shared cache is a
      # provisioning gap rather than a regression — counting it would turn `commands.test` red on
      # every contributor's machine and in every branch worktree without the several-hundred-
      # megabyte download, which is why §5 sorts real-model retrieval into gate 10. So it is
      # reported with the gates this script cannot run and pushed onto neither array. Status 4 is
      # the local-peers status: this checkout's build cannot resolve the retrieval packages, which
      # `npm ci` provisions the way the download provisions the cache, and gates 2a and 4 need that
      # same install and go red on their own where it has not run — so it is BLOCKED on the same
      # terms. The gate grades this checkout's build and the workspace's peers, never the
      # machine-wide retrieval runtime. A SHORTFALL against the recorded floor is any other non-zero
      # and still fails the script. It depends on gate 2a having built `cli/dist`.
      node evals/docs-retrieval/check-floor.mjs >"$log" 2>&1
      status=$?
      unit_secs=$((SECONDS - start))
      if [ "$status" -eq 0 ]; then
        unit_status=ok
        passed+=("11 docs-retrieval relevance floor")
        gr_gate_line ok "11 docs-retrieval relevance floor" "$unit_secs"
      elif [ "$status" -eq 3 ]; then
        unit_status=BLOCKED
        floor_blocked=1
        gr_gate_line BLOCKED "11 docs-retrieval relevance floor" "$unit_secs" "the retrieval model cache is empty"
        sed 's/^/        /' "$log" | tail -25
      elif [ "$status" -eq 4 ]; then
        unit_status=BLOCKED
        floor_blocked=1
        gr_gate_line BLOCKED "11 docs-retrieval relevance floor" "$unit_secs" "the workspace's retrieval packages are not installed"
        sed 's/^/        /' "$log" | tail -25
      else
        unit_status=FAIL
        failed+=("11 docs-retrieval relevance floor")
        gr_gate_line FAIL "11 docs-retrieval relevance floor" "$unit_secs" "exit $status"
        sed 's/^/        /' "$log" | tail -25
      fi
      ;;
    13a)
      gate_header 13 "Python docs-retrieval service"
      python_gate "13a Python lint" noskip bash scripts/python-service.sh lint
      ;;
    13b) gate_header 13 "Python docs-retrieval service"; python_gate "13b Python typecheck" noskip bash scripts/python-service.sh typecheck ;;
    13c) gate_header 13 "Python docs-retrieval service"; python_gate "13c Python tests" noskip bash scripts/python-service.sh test ;;
    13d)
      gate_header 13 "Python docs-retrieval service"
      if [ "${HARNESS_GATES_CONTAINERS:-}" = "1" ]; then
        python_gate "13d Python container tests" skip4 bash scripts/python-service.sh container-test
      else
        unit_secs=$((SECONDS - start))
        unit_status=SKIPPED
        python_skip_reason="not opted in; set HARNESS_GATES_CONTAINERS=1 on a machine with Docker"
        gr_gate_line SKIPPED "13d Python container tests" "$unit_secs" "opt in with HARNESS_GATES_CONTAINERS=1 on a machine with Docker"
      fi
      ;;
    14a)
      gate_header 14 "rendered workflows parse"
      # 14a, 14c and 14d render through `cli/dist`, so they depend on gate 2a. 14c and 14d are
      # hand-written as `python_gate` is: status 4 is `check-rendered-workflows.mjs`'s no-tool skip
      # under --actionlint and --zizmor, pushed onto neither array.
      gate "14a rendered workflows parse as YAML" node scripts/check-rendered-workflows.mjs
      ;;
    14b) gate_header 14 "rendered workflows parse"; gate "14b 0.6.1's harness-control.yml is refused" node scripts/check-rendered-workflows.mjs --negatives ;;
    14c)
      gate_header 14 "rendered workflows parse"
      node scripts/check-rendered-workflows.mjs --actionlint >"$log" 2>&1
      status=$?
      unit_secs=$((SECONDS - start))
      if [ "$status" -eq 0 ]; then
        unit_status=ok
        passed+=("14c actionlint over the rendered workflows")
        gr_gate_line ok "14c actionlint over the rendered workflows" "$unit_secs"
      elif [ "$status" -eq 4 ]; then
        unit_status=SKIPPED
        actionlint_skip_reason="actionlint is not on PATH"
        gr_gate_line SKIPPED "14c actionlint over the rendered workflows" "$unit_secs" "actionlint is not on PATH"
      else
        unit_status=FAIL
        failed+=("14c actionlint over the rendered workflows")
        gr_gate_line FAIL "14c actionlint over the rendered workflows" "$unit_secs" "exit $status"
        sed 's/^/        /' "$log" | tail -25
      fi
      ;;
    14d)
      gate_header 14 "rendered workflows parse"
      node scripts/check-rendered-workflows.mjs --zizmor >"$log" 2>&1
      status=$?
      unit_secs=$((SECONDS - start))
      if [ "$status" -eq 0 ]; then
        unit_status=ok
        passed+=("14d zizmor over the rendered workflows")
        gr_gate_line ok "14d zizmor over the rendered workflows" "$unit_secs"
      elif [ "$status" -eq 4 ]; then
        unit_status=SKIPPED
        zizmor_skip_reason="zizmor 1.30.1 is available neither on PATH nor through uvx"
        gr_gate_line SKIPPED "14d zizmor over the rendered workflows" "$unit_secs" "${zizmor_skip_reason}"
        sed 's/^/        /' "$log" | tail -25
      else
        unit_status=FAIL
        failed+=("14d zizmor over the rendered workflows")
        gr_gate_line FAIL "14d zizmor over the rendered workflows" "$unit_secs" "exit $status"
        sed 's/^/        /' "$log" | tail -25
      fi
      ;;
    16)
      gate_header 16 "shell scripts parse"
      # `bash -n` over every `*.sh` and every extensionless file on a bash shebang that git lists as
      # tracked or as untracked and not ignored, under `/bin/bash` where it exists — bash 3.2 on
      # macOS, the floor — and `bash` on PATH otherwise. A library with a syntax error still lets
      # the suites that source it pass, because sourcing it only prints to stderr, and an unattended
      # run refuses a free-standing `bash -n`; this gate is a route to one. `gate` prints the log on
      # a failure only, so on a pass the check's closing line, which names the interpreter and its
      # version, is printed here.
      gate "16 shell scripts parse" bash scripts/check-shell-parse.sh
      if [ "$unit_status" = ok ]; then
        sed -n 's/^check-shell-parse: [0-9]/        &/p' "$log"
      fi
      ;;
    *)
      failed+=("$id (no such unit in run-gates.sh)")
      gr_gate_line FAIL "$id" 0 "no such unit in run-gates.sh"
      ;;
  esac
  gr_record "$id" "$unit_status" "$unit_secs"
}

# A stopped round returns 1 having pushed its failure onto `failed`, so the closing block exits 1.
gr_run_round run_unit 1 2a 2b 2c 2d 2e 3a 3b 3c 3d 3e 3f 4 6a 6b 6c 6d 6e 6f 11 13a 13b 13c 13d 14a 14b 14c 14d 16

python_blocked_list=""
if [ ${#python_blocked[@]} -gt 0 ]; then
  for name in "${python_blocked[@]}"; do
    python_blocked_list="${python_blocked_list:+$python_blocked_list, }$name"
  done
fi

echo
gr_slowest "$gate4_destination" "$gate4_phase"

echo
echo "== gates this script cannot run"
echo "  4  its jq 1.6 leg, the suite under Debian 12's jq 1.6 in gate 15's container, which needs a network and a person"
echo "  5  doctor's exit contract, by hand against gate 4's scratch repository"
echo "  7  the five adoption shapes, against real directories outside this checkout"
echo "  8  /autonomous-sdlc-harness:harness-analyze, which is judgement and runs inside a model session"
echo "  9  examples/notes-app, which installs dependencies inside the checkout"
echo "  10 docs retrieval with the real models, which downloads them and needs a network"
echo "  12 remote execution, against a real GitHub repository with a runner, a credential and minutes"
echo "  15 the unattended sandbox probe, which launches claude -p with --allowedTools and a person starts"
if [ "$floor_blocked" -eq 1 ]; then
  echo "  11 the docs-retrieval relevance floor, reported BLOCKED above: it runs unattended where the"
  echo "     retrieval model cache is provisioned and the workspace's retrieval packages are installed,"
  echo "     and is listed here where they are not"
fi
if [ -n "$python_blocked_list" ]; then
  echo "  13 the Python docs-retrieval service, reported BLOCKED above (${python_blocked_list}): it runs"
  echo "     unattended once bash scripts/python-service.sh sync has provisioned its environment, and is"
  echo "     listed here until then"
fi
if [ -n "$typos_skip_reason" ]; then
  echo "  6f typos over the shipped files, reported SKIPPED above: ${typos_skip_reason}"
fi
if [ -n "$python_skip_reason" ]; then
  echo "  13d the Python service's container tests, reported SKIPPED above: ${python_skip_reason}"
fi
if [ -n "$actionlint_skip_reason" ]; then
  echo "  14c actionlint over the rendered workflows, reported SKIPPED above: ${actionlint_skip_reason}"
fi
if [ -n "$zizmor_skip_reason" ]; then
  echo "  14d zizmor over the rendered workflows, reported SKIPPED above: ${zizmor_skip_reason}"
fi
echo "     -> docs/development.md §5"

# The same conditionals the block above states, in the line a caller reads off a green run.
hand_run="gates 5, 7, 8, 9, 10, 12 and 15 remain hand-run, with gate 4's jq 1.6 leg"
if [ "$floor_blocked" -eq 1 ]; then
  hand_run="$hand_run, and gate 11 with them — it runs unattended only where the model cache is provisioned and the workspace's retrieval packages are installed"
fi
if [ -n "$python_blocked_list" ]; then
  hand_run="$hand_run; gate 13 was BLOCKED (${python_blocked_list}) — those legs ran no Python; provision it with bash scripts/python-service.sh sync"
fi
if [ -n "$typos_skip_reason" ]; then
  hand_run="$hand_run; 6f was SKIPPED — ${typos_skip_reason}"
fi
if [ -n "$python_skip_reason" ]; then
  hand_run="$hand_run; 13d was SKIPPED — ${python_skip_reason}"
fi
if [ -n "$actionlint_skip_reason" ]; then
  hand_run="$hand_run; 14c was SKIPPED — ${actionlint_skip_reason}"
fi
if [ -n "$zizmor_skip_reason" ]; then
  hand_run="$hand_run; 14d was SKIPPED — ${zizmor_skip_reason}"
fi

echo
if [ ${#failed[@]} -eq 0 ]; then
  echo "run-gates: ${#passed[@]} automatable checks passed; $hand_run"
  exit 0
fi
echo "run-gates: ${#failed[@]} failed, ${#passed[@]} passed" >&2
for name in "${failed[@]}"; do echo "  - $name" >&2; done
exit 1
