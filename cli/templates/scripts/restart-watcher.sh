#!/usr/bin/env bash
# restart-watcher.sh — bounce this repository's run daemon so the watcher, and
# the scripts it calls (the stream formatter, the notifier, the cleanup sweep),
# are re-read from the checkout. Run it after editing any of them: the service
# manager starts the watcher once and the watcher parses its file once, so an
# edit is inert in the live daemon until it is restarted.
#
# WHAT IT DOES, AND ALL IT DOES. It decides whether restarting is safe right
# now, and then delegates the lifecycle to the harness CLI:
#
#     <cli> daemon stop     then     <cli> daemon install
#
# both run FROM THE MAIN CHECKOUT. Nothing here composes a service label, a unit
# path or a service-manager command line of its own. The CLI derives the backend
# (launchd or systemd), the per-repository label and the unit path together, in
# one place, from the repository it is run in — a second derivation here is
# exactly how a daemon gets installed under one name and addressed by another,
# and on the day the two disagreed no `stop` would reach the running service.
# Running from the main checkout rather than from a sibling working copy is part
# of that: the identity is derived from the CLI's working directory, so a bounce
# started inside a worktree would otherwise stop nothing and install a SECOND
# daemon for the worktree's path. Both delegated commands print the label and
# the unit path they resolved; that output is the answer to "which daemon did
# this just bounce", and it is the only place that answer comes from.
#
# LAUNCHD IS BOUNCED; SYSTEMD IS INSTRUCTED, and that is the CLI's split rather
# than this script's (docs/cli.md §9). On macOS the two commands above drive
# launchctl, and the bounce is guaranteed by the PAIR exiting 0 — a `daemon
# stop` that failed leaves `daemon install` to surface launchctl's refusal
# (docs/cli.md §9 keeps that non-zero deliberately, and this script still
# attempts the install after a failed stop), so a non-zero `status` here is
# exactly how that case reaches you. On a systemd host the two commands write
# the unit and PRINT the `systemctl --user` lines for you to run, and both
# still exit 0 — so a successful run of this script on systemd means "the
# instructions are correct and printed", not "the daemon has been restarted".
# Until you run them the live watcher is still the process the service manager
# started, holding the copy of these files that bash parsed then.
#
# WHY IT EXISTS AT ALL, given the CLI already has both verbs: the one thing
# `daemon stop` + `daemon install` do not do is refuse while a run is in flight.
#
# SAFETY — A RESTART KILLS IN-FLIGHT RUNS. Stopping the service tears down the
# job's WHOLE process tree: the watcher, each run's subshell, and that run's
# agent child. A killed run does NOT auto-resume — the watcher's reconcile pass
# marks it `failed` on the next tick, and only cleanly PARKED OR PAUSED runs
# are ever re-launched. Committed work is safe on the branch; a killed run is
# continued by re-launching the engine BY HAND in its worktree, where it picks
# up from the last commit and the next unchecked task. So this REFUSES by
# default while a run is in flight, and `--force` is how you say you meant it.
#
# WHAT COUNTS AS IN FLIGHT, and what happens when that cannot be answered:
#
#   * the run registry (`<state_dir>/autonomous_logs/registry.json`, shaped
#     `{"runs": {"<branch>": {"status": …}}}`) is the SOURCE OF TRUTH: a record
#     whose status is `running`, `parked` or `park_loop` is a run in flight;
#   * a record whose `execution` is `github-actions` is the exception: that run
#     executes on GitHub, beyond the local process tree a restart tears down, so
#     it is listed as `remote (not affected by a restart): <branch> <status>`
#     and never blocks;
#   * a process probe for the agent binary — `${HARNESS_AGENT_CLI:-claude}`, the
#     same variable the watcher launches through — is a BACKSTOP, for a run OF
#     THIS PROJECT whose record has not been written yet or was written by a
#     watcher that was killed before it could update it. It is SCOPED to this
#     project, because the probe searches every process on the machine while a
#     daemon's identity is per repository: a match counts only if the process's
#     arguments name this repository's MAIN CHECKOUT or its sibling-worktree
#     prefix `<work_root>/<projectName>-`. The second spelling is what keeps an
#     engine RE-LAUNCHED BY HAND in its worktree — the continuation route the
#     SAFETY block above prescribes, which has no registry record either —
#     visible to this guard; without it the refusal would become a silent
#     `--force`. A process whose argument vector cannot be read COUNTS AS A
#     MATCH, on the same footing as the unanswerable cases below;
#   * a registry that is ABSENT is not an error and not a refusal: a repository
#     the watcher has never run in has no registry and no run either, and the
#     process probe still guards that case;
#   * a registry that is THERE but cannot be read as a registry — unreadable,
#     invalid JSON, or no `.runs` wrapper — and a configuration that is there
#     and cannot be read are refusals, on the same footing as a run in flight.
#     This script cannot prove nothing is running, and reading "cannot tell" as
#     "nothing is running" is a killed run. A repository with no configuration
#     at all is the separate case: it has no daemon to bounce, so it stops
#     without a refusal to override.
#
# NEVER RUN BY A DISPATCHED AGENT. It has no entry in the generated permission
# profile, and the script-allowlist guard withholds the permit rather than
# granting one — its basename is on that guard's deny list, and being on it means
# the guard stays silent — so an agent that tries it gets a prompt it cannot
# answer, never a permit. The reason is indirection
# rather than this script's own blast radius: restarting a watcher whose sweep
# force-deletes merged branches has an agent trigger `git branch -D` at one
# remove, through a service manager, on branches nobody asked it about. This is
# an operator's command; it stays one.
#
# Usage:
#   restart-watcher.sh            restart only if no run is in flight
#   restart-watcher.sh --force    restart even then, killing the run
#   restart-watcher.sh --help     print this header
#
# Exit map a caller can switch on:
#
#   0  both delegated commands succeeded. On launchd that pair IS the bounce and
#      the daemon is up on the current file; on systemd it means the unit is
#      written and the `systemctl --user` lines were printed for you to run —
#      the restart is complete only once you have run them
#   1  nothing was restarted for a reason that is not about runs: a usage
#      error, a missing shared library, no repository here, no configuration at
#      the main checkout, the CLI not on PATH, or a delegated command that
#      exited non-zero
#   2  REFUSED: a run is in flight, or it could not be proven that none is, and
#      `--force` was not given. Nothing was stopped and nothing was installed
#
# REPRO — reproduce every decision by hand, against a throwaway fixture and a
# recorder standing in for the CLI, with no daemon and no service manager:
#
#   w=$(mktemp -d); d="$w/demo"; git init -q -b trunk "$d"
#   printf '%s' '{"version":1,"projectName":"demo","defaultBranch":"trunk","stateDir":"sdlc-harness/","layers":[],"commands":{}}' > "$d/harness.config.json"
#   mkdir -p "$d/scripts/lib" "$d/sdlc-harness/autonomous_logs" "$w/bin"
#   # copy this script into "$d/scripts" and lib/harness-run-lib.sh beside it
#   printf '#!/usr/bin/env bash\necho "$*" >> "%s/calls"\n' "$w" > "$w/bin/hcli"
#   chmod +x "$w/bin/hcli"
#   reg="$d/sdlc-harness/autonomous_logs/registry.json"
#   run() { PATH="$w/bin:$PATH" HARNESS_CLI=hcli bash "$d/scripts/restart-watcher.sh" "$@"; echo "exit $?"; }
#
#   in flight     printf '%s' '{"runs":{"feat_x":{"status":"running"}}}' > "$reg"
#                 run            -> the in-flight report, exit 2, and no
#                                   "$w/calls" at all (same for "parked"
#                                   and "park_loop")
#   forced        run --force    -> the same report plus the restarting line,
#                                   and "$w/calls" holds `daemon stop` then
#                                   `daemon install`, in that order
#   idle          printf '%s' '{"runs":{"feat_x":{"status":"completed"}}}' > "$reg"
#                 rm -f "$w/calls"; run
#                                -> those same two lines and exit 0
#   remote        printf '%s' '{"runs":{"feat_r":{"status":"running","execution":"github-actions"}}}' > "$reg"
#                 rm -f "$w/calls"; run
#                                -> the remote line for feat_r, no refusal,
#                                   the restart proceeds, exit 0
#   never ran     rm -f "$reg"; run     -> the restart proceeds, exit 0
#   unreadable    printf 'x' > "$reg"; run
#                                -> "cannot prove no run is in flight", exit 2
#   no CLI        HARNESS_CLI=definitely-not-installed run
#                                -> one line naming it, exit 1, no registry read
#   stop failed   printf '#!/usr/bin/env bash\necho "$*" >> "%s/calls"\ncase "$*" in *stop*) exit 3;; esac\n' "$w" > "$w/bin/hcli"
#                 rm -f "$w/calls"; run
#                                -> `daemon stop` reported as exit 3, the
#                                   install still attempted once, exit 1

set -u

# The header itself is the `--help` text, so the two cannot drift: printed from
# this file's own leading comment block, stopping at the first line that is not
# one. Read through `${BASH_SOURCE[0]}` rather than `$0` so it still answers when
# the script is invoked through a wrapper.
print_header() {
  local line first=1
  while IFS= read -r line; do
    if [ "$first" -eq 1 ]; then
      first=0
      continue
    fi
    case "$line" in
      '#'*)
        line=${line#\#}
        printf '%s\n' "${line# }"
        ;;
      *) return 0 ;;
    esac
  done < "${BASH_SOURCE[0]}"
}

# --- Arguments. One optional flag, and nothing else accepted: a misspelling is
# refused here rather than silently becoming a plain restart (or, worse, a
# forced one).
force=0
case "${1:-}" in
  --force)
    force=1
    shift
    ;;
  -h | --help)
    print_header
    exit 0
    ;;
  '') ;;
  *)
    echo "restart-watcher.sh: unrecognized argument '$1'" >&2
    echo "  usage: restart-watcher.sh [--force] (or --help)" >&2
    exit 1
    ;;
esac
if [ "$#" -gt 0 ]; then
  echo "restart-watcher.sh: unexpected extra arguments" >&2
  echo "  usage: restart-watcher.sh [--force] (or --help)" >&2
  exit 1
fi

# The library is reached by a path computed from this script's own location — no
# session root and no runtime-substituted token is assumed. Without it there is
# no way to find this repository's main checkout or its registry, so there is
# nothing to restart and nothing to check first.
hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "restart-watcher.sh: cannot read '$hr_lib' — nothing was restarted" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

# --- Anchors. Derived, never remembered: this copy may be sitting in the main
# checkout or in a sibling working copy of the same repository.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
top="$(hr_repo_root "$script_dir")" || top=""
if [ -z "$top" ]; then
  echo "restart-watcher.sh: '$script_dir' is not inside a git repository — nothing was restarted" >&2
  exit 1
fi

# The daemon belongs to the MAIN checkout — that is where the watcher runs, and
# where the CLI derived its label from when it installed the unit. Unlike the
# configuration readers this does NOT fall back to the checkout it was started
# from: bouncing from a worktree would address an identity nothing installed.
main_repo="$(hr_main_repo "$top")" || main_repo=""
if [ -z "$main_repo" ]; then
  echo "restart-watcher.sh: could not determine the main checkout of '$top' — nothing was restarted" >&2
  echo "  (the daemon's identity is derived from the checkout the CLI runs in, so guessing here would bounce the wrong one)" >&2
  exit 1
fi

# --- The CLI that owns the lifecycle. Checked before anything is read, so a
# host without it stops here having done nothing — the analogue of asking
# whether the unit is installed before deciding whether it may be torn down.
cli="${HARNESS_CLI:-autonomous-sdlc-harness}"
if ! command -v "$cli" >/dev/null 2>&1; then
  echo "restart-watcher.sh: '$cli' is not on PATH — nothing was restarted" >&2
  echo "  install the harness CLI, or set HARNESS_CLI to the command that runs it" >&2
  exit 1
fi

# --- The safety gate. `unknown` is a non-empty REASON the in-flight question
# could not be answered, and it is treated exactly like an answered yes.
active=""
unknown=""
registry=""
remote=""

# The library's 1/2 split is kept apart here, because the two mean different
# things to an operator: a repository with NO configuration has no harness
# daemon to bounce at all (nothing is in doubt, so this is not a `--force`
# case), while one whose configuration cannot be read is the repository this
# was meant to run in with the registry out of reach.
hr_config_load "$main_repo"
cfg_status=$?
if [ "$cfg_status" -eq 1 ]; then
  echo "restart-watcher.sh: there is no '$main_repo/harness.config.json' — nothing was restarted" >&2
  exit 1
elif [ "$cfg_status" -ne 0 ]; then
  unknown="'$main_repo/harness.config.json' could not be resolved (unreadable, invalid JSON, more than one document, no defaultBranch, or jq missing/older than 1.5)"
else
  registry="$(hr_state_path "$main_repo" autonomous_logs/registry.json)" || registry=""
  if [ -z "$registry" ]; then
    unknown="the run registry path could not be derived from the configuration"
  elif [ ! -e "$registry" ]; then
    : # No registry: the watcher has never run in this repository.
  elif [ ! -r "$registry" ]; then
    unknown="'$registry' is not readable"
  # Enumerated THROUGH the `.runs` wrapper, deliberately without a `?`: a
  # document that has no such wrapper is a registry this cannot enumerate, so
  # `jq` fails and the refusal below fires. Reading such a file as "no active
  # runs" is the one misreading that costs a run.
  elif ! active="$(jq -r '.runs | to_entries[] | select((.value.status == "running" or .value.status == "parked" or .value.status == "park_loop") and (.value.execution != "github-actions")) | "\(.value.status) \(.key)"' "$registry" 2>/dev/null)"; then
    active=""
    unknown="'$registry' could not be read as a run registry (invalid JSON, or no .runs wrapper)"
  else
    remote="$(jq -r '.runs | to_entries[] | select((.value.status == "running" or .value.status == "parked" or .value.status == "park_loop") and (.value.execution == "github-actions")) | "\(.key) \(.value.status)"' "$registry" 2>/dev/null || true)"
  fi
fi

if [ -n "$remote" ]; then
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    printf 'restart-watcher.sh: remote (not affected by a restart): %s\n' "$line"
  done <<EOF
$remote
EOF
fi

# The backstop probe. The basename is matched so a binary named by an absolute
# path still matches the command line it was spawned with, and the bracket in
# `<name>[ ]-p` keeps the pattern from matching the process running this probe.
#
# SCOPED TO THIS PROJECT, because `pgrep -f` searches the whole machine and a
# daemon's identity is per repository (docs/watcher.md §3): several armed
# repositories on one host is the designed configuration, and under the shipped
# defaults several of them RUNNING CONCURRENTLY is the steady state, because the
# advisory machine-level lock is opt-in and off (USAGE_LANE_LOCK_ENABLED, 0)
# (docs/watcher.md §5). An unscoped match refuses this repository's restart over
# a run it does not own, and an operator refused by pids that are visibly not
# theirs learns to reach for --force — which is the flag that kills this
# repository's runs.
#
# TWO SPELLINGS ARE ACCEPTED, and dropping either one is a fail-OPEN:
#   * $main_repo/ — every run THIS WATCHER launched carries it (spawn_engine
#     passes --settings "$MAIN_REPO/.claude/..." and --add-dir
#     "<MAIN_REPO>/<state_dir>");
#   * <work_root>/<projectName>- — a run an operator RE-LAUNCHED BY HAND in its
#     worktree, which the SAFETY block above tells them to do. That process runs
#     under a sibling checkout, carries no $main_repo path, and has no registry
#     record either, so the main-checkout key alone would make this guard
#     invisible to it and turn a refusal into a --force-equivalent teardown of a
#     live run. The prefix is the same one hr_worktree_dir builds and the CLI's
#     worktreeGlob() puts in the permission profile.
#
# FAIL SAFE ON AN UNREADABLE ARGUMENT VECTOR: a pid whose command line `ps`
# will not print is KEPT, not dropped. Losing a real in-flight run to a probe
# that could not read it is the expensive mistake here; an extra refusal is not.
# Same for an underivable worktree prefix: the prefix test is skipped, never
# treated as a non-match.
#
# `ps -ww -o args= -p <pid>` is accepted by both BSD `ps` (macOS) and procps
# `ps` (Linux), and `-ww` is what stops the argument vector being truncated to
# the terminal width — a truncated vector would drop the trailing --add-dir
# arguments and silently turn a match into a non-match.
headless=""
candidates=""
cand=""
args=""
mine=""
worktree_prefix=""
wt_work="$(hr_work_root "$main_repo" 2>/dev/null || true)"
wt_name="$(hr_project_name "$main_repo" 2>/dev/null || true)"
if [ -n "$wt_work" ] && [ -n "$wt_name" ]; then
  worktree_prefix="${wt_work%/}/${wt_name}-"
fi
agent_probe="$(basename "${HARNESS_AGENT_CLI:-claude}")"
if [ -n "$agent_probe" ]; then
  candidates="$(pgrep -f "${agent_probe}[ ]-p" 2>/dev/null || true)"
  while IFS= read -r cand; do
    [ -n "$cand" ] || continue
    args="$(ps -ww -o args= -p "$cand" 2>/dev/null || true)"
    if [ -n "$args" ]; then
      mine=""
      case "$args" in *"$main_repo"/*) mine="yes" ;; esac
      if [ -z "$mine" ] && [ -n "$worktree_prefix" ]; then
        case "$args" in *"$worktree_prefix"*) mine="yes" ;; esac
      fi
      [ -n "$mine" ] || continue
    fi
    if [ -n "$headless" ]; then headless="$headless
$cand"; else headless="$cand"; fi
  done <<EOF
$candidates
EOF
fi

if [ -n "$active" ] || [ -n "$headless" ] || [ -n "$unknown" ]; then
  if [ -n "$unknown" ]; then
    echo "restart-watcher.sh: cannot prove no run is in flight — $unknown"
  else
    echo "restart-watcher.sh: a run appears to be IN FLIGHT —"
  fi
  if [ -n "$active" ]; then
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      printf '    registry: %s\n' "$line"
    done <<EOF
$active
EOF
  fi
  if [ -n "$headless" ]; then
    printf '    agent process id(s): %s\n' "$(printf '%s' "$headless" | tr '\n' ' ')"
  fi
  echo "  A restart KILLS it: the whole process tree goes, killed runs reconcile to 'failed' and do NOT auto-resume."
  echo "  Committed work stays on the branch — re-launch the engine in that worktree to continue it."
  if [ "$force" -eq 0 ]; then
    echo "  Aborting. Re-run with --force to restart anyway." >&2
    exit 2
  fi
  echo "  --force given: restarting despite the in-flight run."
fi

# --- The bounce. Two delegated commands, each run exactly once, each status
# surfaced as its own line. Run in a subshell so this script's own working
# directory is not what decides which repository the CLI acts on.
echo "restart-watcher.sh: $cli daemon stop, then $cli daemon install, in '$main_repo' ..."

status=0

(cd "$main_repo" && "$cli" daemon stop)
stop_status=$?
if [ "$stop_status" -ne 0 ]; then
  echo "restart-watcher.sh: '$cli daemon stop' exited $stop_status" >&2
  echo "  (commonly: nothing was loaded under this repository's label, or no unit is installed yet)" >&2
  # The install is still attempted, once: a stop that failed because there was
  # nothing loaded leaves an install to do, and that is the case an operator
  # runs this script in most often. It is not a retry of the stop, and the exit
  # status below stays non-zero either way, so a failure is never reported as a
  # clean bounce.
  echo "  attempting the install anyway; this run will still report a failure." >&2
  status=1
fi

(cd "$main_repo" && "$cli" daemon install)
install_status=$?
if [ "$install_status" -ne 0 ]; then
  echo "restart-watcher.sh: '$cli daemon install' exited $install_status" >&2
  status=1
fi

if [ "$status" -eq 0 ]; then
  # Deliberately not "restarted": this script does not drive the service manager
  # and cannot observe whether one was driven. `daemon stop` and `daemon install`
  # DRIVE launchd and only PRINT the `systemctl --user` lines on systemd (that
  # asymmetry is the CLI's, and docs/cli.md §9 gives the reason) — so on a systemd
  # host both exit 0 having changed nothing, and a "restarted" line here would be
  # the exact failure docs/cli.md §9 designed against: a daemon still running the
  # OLD parsed file while the command that replaced it reported success.
  echo "restart-watcher.sh: '$cli daemon stop' and '$cli daemon install' both succeeded."
  echo "  On macOS/launchd that PAIR succeeding is the bounce: the daemon is running the current file."
  echo "  On systemd those two commands PRINT the systemctl lines above rather than running them:"
  echo "  the watcher is running the current file only once you have run them yourself."
fi
exit "$status"
