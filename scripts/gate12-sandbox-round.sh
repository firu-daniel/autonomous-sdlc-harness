#!/usr/bin/env bash
# gate12-sandbox-round.sh — drive the job legs of docs/development.md -> Gate 12 -> The sandbox series
# round: plant each adversarial branch and dispatch its job (round step 7), take the default-branch leg
# (round step 8), and grade the job logs and artifacts, and the hand-driven full run of round step 6,
# into one result line per row of docs/sandbox-verification.md -> ## 10. It takes no measurement of its
# own and records no result in any document.
#
# Hand-written for this repository, like sandbox-probe.sh: not in the set `init --force` regenerates,
# and not a cli/templates/ file. It never runs in this repository (docs/development.md -> This
# repository cannot host its own remote runs.): run it from the root of the Gate 12 repository,
# named with --repo.
#
# It changes, in the Gate 12 repository only: the branches it plants, locally and on origin; the other
# branch the default-branch leg pushes; the GitHub default branch and the repository variables
# STALL_WARN_SECS and STALL_KILL_SECS, each restored by the default-branch leg; and its scratch
# directory under <stateDir>/scratch/gate12-sandbox-round/. It never deletes the repository, never
# deletes a branch its state file does not record, and never shells out a recursive removal.
#
# Usage: gate12-sandbox-round.sh [--help] | --list
#        | plant --repo <owner>/<name> [--row <ID>]...
#        | default-branch --repo <owner>/<name> [--other-branch <name>] [--stall-warn-secs <n>]
#            [--stall-kill-secs <n>] [--wait-secs <n>]
#        | grade --repo <owner>/<name> [--row <ID>]... [--full-run <branch>]
#        | teardown --repo <owner>/<name>
# Exit (several apply: the highest wins):
#   0 nothing failed · 1 usage, or a library function not yet present
#   2 a refusal: by the preflight, with nothing created; or of one plant arm, which alone is not created
#   3 a gh or git call failed
#   4 at least one row printed fail · 5 a restore or a removal left something behind, named on stderr
#
# The parsed values are globals, assigned here and never inherited from the environment:
#   G12_REPO             --repo's <owner>/<name>
#   G12_ROWS_SELECTED    the --row values, space-separated in the order given, each once; empty is every row
#   G12_FULL_RUN_BRANCH  --full-run's branch, or empty
#   G12_OTHER_BRANCH     --other-branch, default gate12_other_<UTC yyyymmddHHMMSS>
#   G12_STALL_WARN_SECS  --stall-warn-secs, default 60
#   G12_STALL_KILL_SECS  --stall-kill-secs, default 120
#   G12_WAIT_SECS        --wait-secs, default 600
#   G12_SCRIPT_ROOT      the top level of the checkout this script sits in, or empty outside one
#
# A standalone script, which .claude/context/conventions.md -> `## Not determined` leaves open: `set -u`
# and no `-e`, because a failing gh or git call is a result to report and the default-branch leg's
# restore must still run. The libraries under lib/gate12-sandbox-round/ are sourced in a fixed order,
# each only if present, so a library not shipped yet is a usage refusal naming its function rather
# than a crash.
set -u

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
G12_LIB="$script_dir/lib/gate12-sandbox-round"

if [ ! -f "$G12_LIB/core.sh" ]; then
  echo "gate12-sandbox-round: '$G12_LIB/core.sh' is missing" >&2
  exit 1
fi
for g12_lib_file in core.sh preflight.sh state.sh plant.sh plants.sh default-branch.sh runs.sh \
  grade-plant.sh grade-state.sh grade-full-run.sh teardown.sh; do
  if [ -f "$G12_LIB/$g12_lib_file" ]; then
    # shellcheck source=/dev/null
    . "$G12_LIB/$g12_lib_file"
  fi
done
unset g12_lib_file

G12_SCRIPT_ROOT="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
G12_REPO=""
G12_ROWS_SELECTED=""
G12_FULL_RUN_BRANCH=""
G12_OTHER_BRANCH=""
G12_STALL_WARN_SECS=""
G12_STALL_KILL_SECS=""
G12_WAIT_SECS=""

usage() {
  cat <<'EOF'
Usage: gate12-sandbox-round.sh [--help] | --list
       | plant --repo <owner>/<name> [--row <ID>]...
       | default-branch --repo <owner>/<name> [--other-branch <name>] [--stall-warn-secs <n>]
           [--stall-kill-secs <n>] [--wait-secs <n>]
       | grade --repo <owner>/<name> [--row <ID>]... [--full-run <branch>]
       | teardown --repo <owner>/<name>

  --help                   print this text
  --list                   print the row table: row, round step, route, arms, note (tab-separated)
  plant                    plant and dispatch each plant-route row's arms (round step 7)
  default-branch           take JS3's default-branch leg (round step 8)
  grade                    print one result line per selected row
  teardown                 remove what the state file records

  --repo <owner>/<name>    the Gate 12 repository, once; required by every subcommand above
  --row <ID>               plant and grade: a row of --list, repeatable; none selects every row
  --full-run <branch>      grade: the hand-driven full run's branch (round step 6), once
  --other-branch <name>    default-branch: the branch made the GitHub default for the leg;
                           default gate12_other_<UTC yyyymmddHHMMSS>
  --stall-warn-secs <n>    default-branch: STALL_WARN_SECS for the dispatch, default 60
  --stall-kill-secs <n>    default-branch: STALL_KILL_SECS for the dispatch, default 120
  --wait-secs <n>          default-branch: how long to wait for the job, default 600
  Each <n> is a positive integer.

Run it from the Gate 12 repository's root, never in this repository.

Exit: 0 nothing failed; 1 usage or a library function not yet present;
2 a refusal: by the preflight, nothing created; or of one plant arm, which alone is not created;
3 a gh or git call failed;
4 at least one row printed fail; 5 a restore or a removal left something behind. The highest wins.
EOF
}

usage_error() {
  g12_refuse "$*"
  usage >&2
  exit 1
}

g12_finish() {
  g12_exit_final
  exit "$G12_EXIT"
}

# g12_opt_value <flag> <args left> [<value>] — the flag's value, refused when absent or empty.
g12_opt_value() {
  [ "$2" -ge 2 ] && [ -n "${3:-}" ] || usage_error "$1 needs a non-empty value"
}

g12_opt_once() {
  [ -z "$2" ] || usage_error "$1 given twice"
}

g12_opt_secs() {
  case "$2" in
    "" | 0* | *[!0-9]*) usage_error "$1 needs a positive integer, not '$2'" ;;
  esac
}

cmd="${1:-}"
[ $# -gt 0 ] && shift

case "$cmd" in
  "" | -h | --help)
    [ $# -eq 0 ] || usage_error "--help takes no argument"
    usage
    exit 0
    ;;
  --list)
    [ $# -eq 0 ] || usage_error "--list takes no argument"
    g12_rows_print
    exit 0
    ;;
  plant | default-branch | grade | teardown) ;;
  *)
    usage_error "unknown command '$cmd'"
    ;;
esac

g12_repo_seen=0
while [ $# -gt 0 ]; do
  case "$cmd:$1" in
    *:--repo)
      g12_opt_value "$1" $# "${2:-}"
      [ "$g12_repo_seen" -eq 0 ] || usage_error "--repo given twice"
      case "$2" in
        */*/* | /* | */) usage_error "--repo needs <owner>/<name>, not '$2'" ;;
        */*) ;;
        *) usage_error "--repo needs <owner>/<name>, not '$2'" ;;
      esac
      g12_repo_seen=1
      G12_REPO="$2"
      ;;
    plant:--row | grade:--row)
      g12_opt_value "$1" $# "${2:-}"
      g12_row_field "$2" 1 >/dev/null || usage_error "unknown row '$2' (see --list)"
      case " $G12_ROWS_SELECTED " in
        *" $2 "*) ;;
        *) G12_ROWS_SELECTED="${G12_ROWS_SELECTED:+$G12_ROWS_SELECTED }$2" ;;
      esac
      ;;
    grade:--full-run)
      g12_opt_value "$1" $# "${2:-}"
      g12_opt_once "$1" "$G12_FULL_RUN_BRANCH"
      G12_FULL_RUN_BRANCH="$2"
      ;;
    default-branch:--other-branch)
      g12_opt_value "$1" $# "${2:-}"
      g12_opt_once "$1" "$G12_OTHER_BRANCH"
      G12_OTHER_BRANCH="$2"
      ;;
    default-branch:--stall-warn-secs)
      g12_opt_value "$1" $# "${2:-}"
      g12_opt_once "$1" "$G12_STALL_WARN_SECS"
      g12_opt_secs "$1" "$2"
      G12_STALL_WARN_SECS="$2"
      ;;
    default-branch:--stall-kill-secs)
      g12_opt_value "$1" $# "${2:-}"
      g12_opt_once "$1" "$G12_STALL_KILL_SECS"
      g12_opt_secs "$1" "$2"
      G12_STALL_KILL_SECS="$2"
      ;;
    default-branch:--wait-secs)
      g12_opt_value "$1" $# "${2:-}"
      g12_opt_once "$1" "$G12_WAIT_SECS"
      g12_opt_secs "$1" "$2"
      G12_WAIT_SECS="$2"
      ;;
    *)
      usage_error "unknown $cmd argument '$1'"
      ;;
  esac
  shift 2
done
unset g12_repo_seen

[ -n "$G12_REPO" ] || usage_error "$cmd needs --repo <owner>/<name>"

# The defaults are applied here, so every library reads a set value.
[ -n "$G12_OTHER_BRANCH" ] || G12_OTHER_BRANCH="gate12_other_$(date -u +%Y%m%d%H%M%S)"
[ -n "$G12_STALL_WARN_SECS" ] || G12_STALL_WARN_SECS=60
[ -n "$G12_STALL_KILL_SECS" ] || G12_STALL_KILL_SECS=120
[ -n "$G12_WAIT_SECS" ] || G12_WAIT_SECS=600

case "$cmd" in
  plant) g12_cmd_fn=g12_plant_cmd ;;
  default-branch) g12_cmd_fn=g12_default_branch_cmd ;;
  grade) g12_cmd_fn=g12_grade_cmd ;;
  teardown) g12_cmd_fn=g12_teardown_cmd ;;
esac

# One function at a time, so a preflight refusal is exit 2 even while the subcommand's library is absent.
g12_need g12_preflight
if ! g12_preflight; then
  # A preflight that refused without raising a code must still not exit 0.
  [ "$G12_EXIT" -gt 0 ] || g12_exit_raise 2
  g12_finish
fi
g12_need "$g12_cmd_fn"
"$g12_cmd_fn"
g12_finish
