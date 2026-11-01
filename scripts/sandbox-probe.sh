#!/usr/bin/env bash
# sandbox-probe.sh — measure the unattended sandbox on macOS and Linux: cut a throwaway probe clone, launch
# sandboxed headless sessions on the watcher's launch line, and print one result line per leg for the
# rows of docs/sandbox-verification.md. Hand-written for this repository, like probe-plugin-cli.sh:
# not in the set `init --force` regenerates, and not a cli/templates/ file.
#
# It changes nothing outside its own temp area, the probe clone and the probe branch, but one evidence directory:
# a sandbox-probe-evidence.* directory under TMPDIR, kept only when a leg does not pass.
# Job mode cuts no clone; it changes the probe branch in the checkout and on its origin, the checkout's
# HEAD and the job-mode placeholder manifest under RUNNER_TEMP, each restored or removed at teardown.
# On Linux the registry leg is the exception: it writes beside <main>/<stateDir>/autonomous_logs/registry.json
# and RG3 may move that directory aside; it removes what it wrote and restores the directory
# (lib/sandbox-probe/legs-registry.sh → THE RESTORE RULE), so take a Linux run only in the throwaway container.
# The directory that keeps the evidence of non-passing legs is printed last on stderr.
# macOS, and Linux in a local container (docs/development.md → Gate 15). Job mode (--job <checkout>)
# measures a checkout under its base profile, locally or on a GitHub-hosted runner through
# scripts/sandbox-probe-runner.yml (Gate 15).
#
# A person starts it from a terminal, because auto mode refuses a `claude -p` launch carrying
# `--allowedTools`. From a session, `! bash <main>/scripts/sandbox-probe.sh run` works.
#
# Usage: sandbox-probe.sh [--help] | --list [--job] | preflight [<job>] | run [<job>] [--leg <name>]...
#        | judge <kind> <args> | print-parity-script | refusal
#   where <job> is --job <checkout> [--runner-controls <file>]
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
for sp_lib_file in core.sh platform.sh preflight.sh judge.sh session.sh job.sh controls.sh legs-local.sh \
  legs-wrappers.sh legs-refresh.sh legs-planted.sh legs-planted-files.sh legs-protection.sh \
  legs-network.sh legs-settings.sh legs-glob.sh legs-registry.sh legs-detached.sh legs-loopback.sh \
  legs-job.sh legs-runner.sh legs-runner-isolation.sh legs-refusal.sh; do
  if [ -f "$SP_LIB/$sp_lib_file" ]; then
    # shellcheck source=/dev/null
    . "$SP_LIB/$sp_lib_file"
  fi
done
unset sp_lib_file

usage() {
  cat <<'EOF'
Usage: sandbox-probe.sh [--help] | --list [--job] | preflight [<job>] | run [<job>] [--leg <name>]...
       | judge <kind> <args> | print-parity-script | refusal
  where <job> is --job <checkout> [--runner-controls <file>]

  --help                 print this text
  --list                 print the leg table: leg, rows, expected, recorded in (tab-separated)
  --list --job           print the job-mode legs and the rows each takes (tab-separated)
  preflight              run the refusals and the shasum guard; create nothing
  run [--leg <name>]...  run the named legs, or every leg but headless-parity, in table order;
                         without --job, every job-mode-only leg is left out
  --job <checkout>       job mode: measure <checkout> itself under its base profile, cutting no clone;
                         without --leg, only the legs --list --job names run
  --runner-controls <file>
                         job mode only: the runner workflow's unsandboxed controls file
  judge <kind> <args>    judge a recorded stream (the test suite's entry)
  print-parity-script    print the headless-parity script with placeholders; run --leg headless-parity prints it live
  refusal                on a Linux host lacking bwrap or socat: the refusal leg, behind its own preflight

--job is refused on judge, print-parity-script and refusal, and with --leg headless-parity.

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

sp_opt_job=""
sp_opt_controls=""

# sp_job_opt <flag> <args left> [<value>] — take --job or --runner-controls once, with a non-empty value.
sp_job_opt() {
  [ "$2" -ge 2 ] && [ -n "${3:-}" ] || usage_error "$1 needs a non-empty value"
  case "$1" in
    --job)
      [ -z "$sp_opt_job" ] || usage_error "--job given twice"
      sp_opt_job="$3"
      ;;
    --runner-controls)
      [ -z "$sp_opt_controls" ] || usage_error "--runner-controls given twice"
      sp_opt_controls="$3"
      ;;
  esac
}

# sp_job_apply — set the job-mode globals from the parsed options. Assigned here, never inherited.
sp_job_apply() {
  if [ -n "$sp_opt_controls" ] && [ -z "$sp_opt_job" ]; then
    usage_error "--runner-controls needs --job <checkout>"
  fi
  if [ -n "$sp_opt_job" ]; then
    SP_JOB_MODE=1
  else
    SP_JOB_MODE=0
  fi
  SP_JOB_CHECKOUT="$sp_opt_job"
  SP_RUNNER_CONTROLS_FILE="$sp_opt_controls"
}

# sp_job_refused <command> <args>... — a usage error when --job or --runner-controls is among the args.
sp_job_refused() {
  local sub="$1" arg
  shift
  for arg in "$@"; do
    case "$arg" in
      --job | --runner-controls) usage_error "$arg does not apply to '$sub'" ;;
    esac
  done
}

# sp_job_controls — after a passing preflight in job mode, read the controls file; status 1 refused it.
sp_job_controls() {
  [ "$SP_JOB_MODE" = 1 ] && [ -n "$SP_RUNNER_CONTROLS_FILE" ] || return 0
  declare -F sp_runner_controls_read >/dev/null || return 0
  sp_runner_controls_read "$SP_RUNNER_CONTROLS_FILE" && return 0
  sp_preflight_refuse "the runner controls file '$SP_RUNNER_CONTROLS_FILE' could not be read as runner controls"
  return 1
}

# sp_mode_stamp — the stamp line naming the run's mode, so every run's record carries it.
sp_mode_stamp() {
  if [ "$SP_JOB_MODE" = 1 ]; then
    echo "sandbox-probe: stamp: mode: job (${SP_JOB_CHECKOUT})" >&2
  else
    echo "sandbox-probe: stamp: mode: clone layout" >&2
  fi
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
    if [ $# -eq 0 ]; then
      sp_legs_print
    elif [ $# -eq 1 ] && [ "$1" = --job ]; then
      sp_job_print
    else
      usage_error "--list takes no argument but an optional --job"
    fi
    exit 0
    ;;
  preflight)
    while [ $# -gt 0 ]; do
      case "$1" in
        --job | --runner-controls)
          sp_job_opt "$1" $# "${2:-}"
          shift 2
          ;;
        *) usage_error "unknown preflight argument '$1'" ;;
      esac
    done
    sp_job_apply
    sp_need sp_preflight
    SP_PREFLIGHT_PREREQ=present
    if ! sp_preflight; then
      sp_exit_raise 2
      sp_finish
    fi
    if ! sp_job_controls; then
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
          [ "$2" != refusal ] || usage_error "the refusal leg runs only through 'sandbox-probe.sh refusal'"
          sp_selected="$sp_selected $2 "
          shift 2
          ;;
        --job | --runner-controls)
          sp_job_opt "$1" $# "${2:-}"
          shift 2
          ;;
        *) usage_error "unknown run argument '$1'" ;;
      esac
    done
    sp_job_apply
    if [ "$SP_JOB_MODE" = 1 ]; then
      case "$sp_selected" in
        *" headless-parity "*)
          usage_error "--job does not take --leg headless-parity: the parity script prints a clone's paths"
          ;;
      esac
    fi
    sp_need sp_preflight sp_setup sp_teardown
    SP_PREFLIGHT_PREREQ=present
    if ! sp_preflight; then
      sp_exit_raise 2
      sp_finish
    fi
    if ! sp_job_controls; then
      sp_exit_raise 2
      sp_finish
    fi
    if declare -F sp_stamp >/dev/null; then
      sp_stamp
    fi
    if [ "$SP_JOB_MODE" = 1 ] && declare -F sp_runner_stamp >/dev/null; then
      sp_runner_stamp
    fi
    sp_mode_stamp
    if sp_setup; then
      for sp_leg in $(sp_leg_names); do
        [ "$sp_leg" = refusal ] && continue
        if [ -z "$sp_selected" ]; then
          [ "$sp_leg" = headless-parity ] && continue
          if [ "$SP_JOB_MODE" = 1 ]; then
            sp_leg_job_rows "$sp_leg" >/dev/null || continue
          elif sp_leg_job_only "$sp_leg"; then
            continue
          fi
          if sp_leg_linux_only "$sp_leg" && [ "${SP_PLATFORM:-}" != linux ]; then
            continue
          fi
        else
          case "$sp_selected" in *" $sp_leg "*) ;; *) continue ;; esac
        fi
        sp_leg_fn="sp_leg_${sp_leg//-/_}"
        SP_CURRENT_LEG="$sp_leg"
        if sp_leg_linux_only "$sp_leg" && [ "${SP_PLATFORM:-}" != linux ]; then
          sp_leg_platform_skip "$sp_leg"
        elif [ "$SP_JOB_MODE" = 1 ] && ! sp_leg_job_rows "$sp_leg" >/dev/null; then
          sp_leg_mode_skip "$sp_leg" "not a job-mode leg: job mode cuts no clone"
        elif [ "$SP_JOB_MODE" != 1 ] && sp_leg_job_only "$sp_leg"; then
          sp_leg_mode_skip "$sp_leg" "job mode only: run it with --job <checkout>"
        elif declare -F "$sp_leg_fn" >/dev/null; then
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
    sp_job_refused judge "$@"
    sp_need sp_judge_cli
    # No preflight runs here, so without the seam the judge grades as on macOS on any host.
    SP_PLATFORM="$(sp_platform_of "${SANDBOX_PROBE_UNAME:-Darwin}")"
    sp_judge_cli "$@"
    sp_rc=$?
    sp_exit_raise "$sp_rc"
    sp_finish
    ;;
  print-parity-script)
    sp_job_refused print-parity-script "$@"
    [ $# -eq 0 ] || usage_error "print-parity-script takes no argument"
    sp_need sp_print_parity_script
    SP_PLATFORM="$(sp_platform_of "${SANDBOX_PROBE_UNAME:-Darwin}")"
    sp_print_parity_script
    sp_exit_raise $?
    sp_finish
    ;;
  refusal)
    sp_job_refused refusal "$@"
    [ $# -eq 0 ] || usage_error "refusal takes no argument"
    # Assigned here, never inherited: an exported value must not reach run's refusal 6.
    SP_PREFLIGHT_PREREQ=absent
    sp_need sp_preflight sp_setup sp_teardown sp_leg_refusal
    if ! sp_preflight; then
      sp_exit_raise 2
      sp_finish
    fi
    if declare -F sp_stamp >/dev/null; then
      sp_stamp
    fi
    sp_mode_stamp
    if sp_setup; then
      SP_CURRENT_LEG=refusal
      sp_leg_refusal
      SP_CURRENT_LEG=""
    else
      sp_exit_raise 2
    fi
    sp_teardown
    sp_finish
    ;;
  *)
    usage_error "unknown command '$cmd'"
    ;;
esac
