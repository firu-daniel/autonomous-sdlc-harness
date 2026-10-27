#!/usr/bin/env bash
# sandbox-probe.sh — measure the unattended sandbox on macOS: cut a throwaway probe clone, launch
# sandboxed headless sessions on the watcher's launch line, and print one result line per leg for the
# rows of docs/sandbox-verification.md. Hand-written for this repository, like probe-plugin-cli.sh:
# not in the set `init --force` regenerates, and not a cli/templates/ file.
#
# It changes nothing outside its own temp area, the probe clone and the probe branch, but one evidence directory:
# a sandbox-probe-evidence.* directory under TMPDIR, kept only when a leg does not pass.
# The directory that keeps the evidence of non-passing legs is printed last on stderr.
# macOS only; the Linux legs are owed under roadmap item 21 (docs/development.md §6).
#
# A person starts it from a terminal, because auto mode refuses a `claude -p` launch carrying
# `--allowedTools`. From a session, `! bash <main>/scripts/sandbox-probe.sh run` works.
#
# Usage: sandbox-probe.sh [--help] | --list | preflight | run [--leg <name>]... | judge <kind> <args> | print-parity-script
# Exit (several apply: the highest wins):
#   0 every leg printed pass or not run · 1 usage, or a library function not yet present
#   2 a preflight refusal, nothing created · 3 a protected main-checkout file changed
#   4 at least one leg printed fail · 5 teardown could not remove something, named on stderr
#
# A standalone script, which .claude/context/conventions.md → `## Not determined` leaves open: `set -u`
# and no `-e`, because a leg's failing command is a result to print and teardown must still run.
# The libraries under lib/sandbox-probe/ are sourced in a fixed order, each only if present, so a
# library not shipped yet is a usage refusal naming its function rather than a crash.
set -u

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SP_ROOT="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$SP_ROOT" ]; then
  echo "sandbox-probe: could not resolve a repository root from '${script_dir}' (is git on PATH?)" >&2
  exit 1
fi
SP_LIB="$script_dir/lib/sandbox-probe"

if [ ! -f "$SP_LIB/core.sh" ]; then
  echo "sandbox-probe: '$SP_LIB/core.sh' is missing" >&2
  exit 1
fi
for sp_lib_file in core.sh preflight.sh judge.sh session.sh controls.sh legs-local.sh \
  legs-wrappers.sh legs-refresh.sh legs-planted.sh legs-planted-files.sh legs-protection.sh \
  legs-network.sh legs-settings.sh; do
  if [ -f "$SP_LIB/$sp_lib_file" ]; then
    # shellcheck source=/dev/null
    . "$SP_LIB/$sp_lib_file"
  fi
done
unset sp_lib_file

usage() {
  cat <<'EOF'
Usage: sandbox-probe.sh [--help] | --list | preflight | run [--leg <name>]... | judge <kind> <args> | print-parity-script

  --help                 print this text
  --list                 print the leg table: leg, rows, expected, recorded in (tab-separated)
  preflight              run the refusals and the shasum guard; create nothing
  run [--leg <name>]...  run the named legs, or every leg but headless-parity, in table order
  judge <kind> <args>    judge a recorded stream (the test suite's entry)
  print-parity-script    print the headless-parity script with placeholders; run --leg headless-parity prints it live

Start it from a terminal: auto mode refuses a `claude -p` launch carrying `--allowedTools`.
From a session, `! bash <main>/scripts/sandbox-probe.sh run` works.
The directory that keeps the evidence of non-passing legs is printed last on stderr.

Exit: 0 every leg pass or not run; 1 usage or a library function not yet present;
2 a preflight refusal, nothing created; 3 a protected main-checkout file changed;
4 at least one leg fail; 5 teardown could not remove something. The highest wins.
EOF
}

usage_error() {
  sp_refuse "$*"
  usage >&2
  exit 1
}

# sp_need <function>... — exit 1 naming every function not defined yet.
sp_need() {
  local fn missing=0
  for fn in "$@"; do
    if ! declare -F "$fn" >/dev/null; then
      sp_refuse "$fn is not present: its library file under scripts/lib/sandbox-probe/ has not shipped"
      missing=1
    fi
  done
  [ "$missing" -eq 0 ] || exit 1
}

sp_finish() {
  sp_exit_final
  exit "$SP_EXIT"
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
    sp_legs_print
    exit 0
    ;;
  preflight)
    [ $# -eq 0 ] || usage_error "preflight takes no argument"
    sp_need sp_preflight
    if ! sp_preflight; then
      sp_exit_raise 2
      sp_finish
    fi
    if declare -F sp_snapshot_check >/dev/null; then
      sp_snapshot_check
    fi
    # preflight alone runs no teardown, so the snapshot's temp area is released here.
    if declare -F sp_snapshot_release >/dev/null; then
      sp_snapshot_release
    fi
    sp_finish
    ;;
  run)
    sp_selected=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --leg)
          [ $# -ge 2 ] || usage_error "--leg needs a leg name (see --list)"
          sp_leg_rows "$2" >/dev/null || usage_error "unknown leg '$2' (see --list)"
          sp_selected="$sp_selected $2 "
          shift 2
          ;;
        *) usage_error "unknown run argument '$1'" ;;
      esac
    done
    sp_need sp_preflight sp_setup sp_teardown
    if ! sp_preflight; then
      sp_exit_raise 2
      sp_finish
    fi
    if sp_setup; then
      for sp_leg in $(sp_leg_names); do
        if [ -z "$sp_selected" ]; then
          [ "$sp_leg" = headless-parity ] && continue
        else
          case "$sp_selected" in *" $sp_leg "*) ;; *) continue ;; esac
        fi
        sp_leg_fn="sp_leg_${sp_leg//-/_}"
        SP_CURRENT_LEG="$sp_leg"
        if declare -F "$sp_leg_fn" >/dev/null; then
          "$sp_leg_fn"
        else
          sp_leg_missing "$sp_leg"
        fi
        SP_CURRENT_LEG=""
      done
    else
      sp_exit_raise 2
    fi
    sp_teardown
    sp_finish
    ;;
  judge)
    sp_need sp_judge_cli
    sp_judge_cli "$@"
    sp_rc=$?
    sp_exit_raise "$sp_rc"
    sp_finish
    ;;
  print-parity-script)
    [ $# -eq 0 ] || usage_error "print-parity-script takes no argument"
    sp_need sp_print_parity_script
    sp_print_parity_script
    sp_exit_raise $?
    sp_finish
    ;;
  *)
    usage_error "unknown command '$cmd'"
    ;;
esac
