#!/usr/bin/env bash
# remote-run.sh — every call from this machine to GitHub for a harness run: the
# one place a `gh workflow run` of the run workflow is composed, so the
# workflow's input contract has exactly one producer on the shell side.
#
# THE VERBS AND THE EXIT MAP, stated once for every consumer (the watcher's
# inbox and relay passes, the job-side `continue` / `poll`, the guard's deny
# entry and the plugin commands that name this file):
#
#   remote-run.sh dispatch <branch> --engine <kind> [--resume none|answer|pause]
#                 [--answers-from <clar_dir> --indexes "<n> <n>..."]
#                 [--park-loop-clear] [--chain <n>] [--repo <root>]
#   remote-run.sh pause <branch> [--repo <root>]
#   remote-run.sh warm [--repo <root>]
#   remote-run.sh stop <branch> [--repo <root>]
#     0  sent (for stop: the action=stop marker was dispatched, and every
#        queued, waiting or in-progress run of that branch was asked to cancel,
#        or there was none)
#     1  usage error, or the library or the configuration could not be resolved
#     2  refused, nothing sent: execution.target is not github-actions; the
#        inputs payload is over the limit; a named answer file is missing
#     3  gh failed: not found, or a non-zero exit — the first line of gh's
#        stderr is named
#
# THE WORKFLOW INPUT CONTRACT (the workflow template declares the same inputs):
#
#   action           run | pause | warm | stop
#   branch           the run's branch; also the dispatch --ref for run, pause
#                    and stop. `warm` sends GitHub's default branch as both
#   engine           task | user_review | docs            (action=run only)
#   resume           none | answer | pause                (action=run only)
#   answers          {"<n>": "<answer_<n>.md bytes>", ...} (resume=answer only)
#   park_loop_clear  true, sent only when --park-loop-clear is given
#   chain            automatic dispatches since the last user action; a
#                    user's dispatch sends 0                (action=run only)
#
# The workflow's `run-name` is `harness <action> <branch>`, and the job-side
# pause poll and `continue` / `poll` match runs by that title, so the spelling
# is a wire: `pause` and `stop` send the branch as their `branch` input for
# exactly that reason.
#
# `stop` DOES THREE THINGS, IN THIS ORDER. (1) It ALWAYS dispatches action=stop
# on the branch — a jobless run titled `harness stop <branch>` that GitHub keeps
# as the stop marker `continue` and `poll` read. It is first because it is the
# only part that reaches a usage-paused run waiting on the resume poller, which
# has no job to cancel; a marker dispatch that fails exits 3 at once, before any
# cancel. (2) It lists the branch's runs of the workflow and cancels each one
# whose status is `queued`, `in_progress` or `waiting`, trying every one even
# after a failure. (3) Only when (1) and (2) all succeeded, and only when a
# local registry record exists, it writes `remote_stopped_at` and sets `status`
# to `failed` through `hr_registry_set`; a partial stop leaves the record alone
# and exits 3, so running `stop` again is the remedy.
#
# `warm` dispatches action=warm on GitHub's OWN default branch (`gh repo view
# --json defaultBranchRef`), which may differ from the configured
# `defaultBranch`: a cache saved there is the one every branch can restore.
#
# WHERE gh RUNS. From the main checkout (`hr_main_repo` of the working
# directory) unless `--repo <root>` names another, so gh resolves the
# repository from that checkout's remote. The configuration read is that
# root's `harness.config.json`.
#
# WHAT IT NEVER DOES. It never launches a local session, never writes the
# inbox, never pushes, and never watches a run it sent. The registry write in
# `stop` is its only write.
#
# MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a
# rename there is an edit here, byte for byte:
#   WORKFLOW_RUN_FILE  mirrors  WORKFLOW_RUN_FILE
#   HARNESS_GH_CLI     mirrors  GH_CLI_VARIABLE (the binary run as `gh`)
#
# `set -u` WITHOUT `-e`: every refusal is reported with its own exit code rather
# than aborting mid-decision.
#
# REPRO — every verb and every refusal, against a throwaway fixture, with gh
# replaced by a recorder stub (nothing reaches the network):
#
#   d=$(mktemp -d); git -C "$d" init -q; (cd "$d" && npx autonomous-sdlc-harness init)
#   jq '.execution = {target: "github-actions"}' "$d/harness.config.json" > "$d/c" && mv "$d/c" "$d/harness.config.json"
#   s=$(mktemp -d)/gh; printf '%s\n' '#!/bin/sh' 'echo "$*" >> "$0.log"' \
#     'case "$1 $2" in "run list") echo "[{\"databaseId\":7,\"status\":\"in_progress\"}]";;' \
#     '"repo view") echo "{\"defaultBranchRef\":{\"name\":\"main\"}}";; esac' > "$s"; chmod +x "$s"
#   export HARNESS_GH_CLI="$s"; cd "$d"
#
#   dispatch   bash scripts/remote-run.sh dispatch feat_x --engine task; echo $?
#              -> 0; "$s.log" gains `workflow run harness-run.yml --ref feat_x
#                 -f action=run -f branch=feat_x -f engine=task -f resume=none -f chain=0`
#   pause      bash scripts/remote-run.sh pause feat_x        -> 0, `-f action=pause`
#   warm       bash scripts/remote-run.sh warm                -> 0, `--ref main -f action=warm`
#   stop       bash scripts/remote-run.sh stop feat_x         -> 0; the `action=stop`
#              dispatch, then `run list ...`, then `run cancel 7`
#   usage      bash scripts/remote-run.sh dispatch feat_x     -> 1 (no --engine)
#   no config  bash scripts/remote-run.sh pause feat_x --repo /tmp   -> 1
#   local      jq '.execution.target = "local"' ... then any verb    -> 2, log unchanged
#   no answer  bash scripts/remote-run.sh dispatch feat_x --engine task --resume answer \
#                --answers-from "$d/sdlc-harness/clarifications/feat_x" --indexes 9   -> 2
#   too big    head -c 70000 /dev/zero | tr '\0' a > <clar_dir>/answer_1.md, then
#              --resume answer --answers-from <clar_dir> --indexes 1  -> 2, log unchanged
#   gh fails   printf '%s\n' '#!/bin/sh' 'echo "boom" >&2' 'exit 4' > "$s"
#              bash scripts/remote-run.sh pause feat_x        -> 3, names `boom`
#   gh absent  HARNESS_GH_CLI=/nonexistent bash scripts/remote-run.sh warm   -> 3

set -u

hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "remote-run.sh: cannot read '$hr_lib'" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

WORKFLOW_RUN_FILE='harness-run.yml'
GH="${HARNESS_GH_CLI:-gh}"

# GitHub's documented limit on a `workflow_dispatch` inputs payload: "The
# maximum payload for inputs is 65,535 characters."
# https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onworkflow_dispatchinputs
REMOTE_INPUT_PAYLOAD_MAX=65535

EXIT_OK=0
EXIT_USAGE=1
EXIT_REFUSED=2
EXIT_GH=3

usage() {
  echo "remote-run.sh: $1" >&2
  echo "usage: remote-run.sh dispatch <branch> --engine <task|user_review|docs> [--resume none|answer|pause] [--answers-from <clar_dir> --indexes \"<n> ...\"] [--park-loop-clear] [--chain <n>] [--repo <root>]" >&2
  echo "       remote-run.sh pause <branch> [--repo <root>]" >&2
  echo "       remote-run.sh warm [--repo <root>]" >&2
  echo "       remote-run.sh stop <branch> [--repo <root>]" >&2
  exit "$EXIT_USAGE"
}

# gh_call <args...> — run gh once with a fixed argument vector. Its stdout is
# left in GH_OUT; on failure GH_ERR holds the first line of its stderr (or a
# not-found line) and the return is non-zero.
GH_OUT=""
GH_ERR=""
gh_call() {
  local errfile status
  GH_OUT=""
  GH_ERR=""
  if ! command -v "$GH" >/dev/null 2>&1; then
    GH_ERR="gh not found: '$GH'"
    return 127
  fi
  errfile=$(mktemp) || { GH_ERR="mktemp failed"; return 1; }
  GH_OUT=$("$GH" "$@" 2>"$errfile")
  status=$?
  if [ "$status" -ne 0 ]; then
    IFS= read -r GH_ERR <"$errfile" || :
    [ -n "$GH_ERR" ] || GH_ERR="(no stderr)"
    GH_ERR="gh exited $status: $GH_ERR"
  fi
  rm -f "$errfile"
  return "$status"
}

gh_fail() {
  echo "remote-run.sh: $1: $GH_ERR" >&2
  exit "$EXIT_GH"
}

valid_branch() {
  case "${1-}" in
    ''|-*) return 1 ;;
  esac
  return 0
}

# ---------------------------------------------------------------------------
# Arguments.
# ---------------------------------------------------------------------------

[ "$#" -ge 1 ] || usage "no verb given"
verb="$1"
shift
case "$verb" in
  dispatch|pause|warm|stop) ;;
  *) usage "unknown verb '$verb'" ;;
esac

branch=""
engine=""
resume="none"
answers_from=""
indexes=""
indexes_given=0
park_loop_clear=0
chain="0"
repo_arg=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] || usage "--repo needs a value"
      repo_arg="$2"; shift 2 ;;
    --engine|--resume|--answers-from|--indexes|--chain)
      [ "$verb" = dispatch ] || usage "$1 is a dispatch option"
      [ "$#" -ge 2 ] || usage "$1 needs a value"
      case "$1" in
        --engine) engine="$2" ;;
        --resume) resume="$2" ;;
        --answers-from) answers_from="$2" ;;
        --indexes) indexes="$2"; indexes_given=1 ;;
        --chain) chain="$2" ;;
      esac
      shift 2 ;;
    --park-loop-clear)
      [ "$verb" = dispatch ] || usage "$1 is a dispatch option"
      park_loop_clear=1; shift ;;
    -*)
      usage "unknown option '$1'" ;;
    *)
      [ -z "$branch" ] || usage "unexpected argument '$1'"
      [ "$verb" != warm ] || usage "warm takes no branch"
      branch="$1"; shift ;;
  esac
done

if [ "$verb" != warm ]; then
  valid_branch "$branch" || usage "$verb needs a <branch>"
fi

if [ "$verb" = dispatch ]; then
  case "$engine" in
    task|user_review|docs) ;;
    '') usage "dispatch needs --engine" ;;
    *) usage "unknown --engine '$engine'" ;;
  esac
  case "$resume" in
    none|answer|pause) ;;
    *) usage "unknown --resume '$resume'" ;;
  esac
  case "$chain" in
    ''|*[!0-9]*) usage "--chain must be a non-negative integer" ;;
  esac
  if [ "$resume" = answer ]; then
    [ -n "$answers_from" ] && [ "$indexes_given" -eq 1 ] \
      || usage "--resume answer needs --answers-from and --indexes"
    [ -n "${indexes// /}" ] || usage "--indexes names no index"
    for n in $indexes; do
      case "$n" in
        ''|*[!0-9]*|0*) usage "--indexes must be positive integers, got '$n'" ;;
      esac
    done
  elif [ -n "$answers_from" ] || [ "$indexes_given" -eq 1 ]; then
    usage "--answers-from and --indexes belong to --resume answer"
  fi
fi

# ---------------------------------------------------------------------------
# The repository and its configuration.
# ---------------------------------------------------------------------------

if [ -n "$repo_arg" ]; then
  root=$(hr_repo_root "$repo_arg") || { echo "remote-run.sh: '$repo_arg' is not a git repository" >&2; exit "$EXIT_USAGE"; }
else
  root=$(hr_main_repo "${PWD-.}") || { echo "remote-run.sh: '${PWD-.}' is not inside a git repository" >&2; exit "$EXIT_USAGE"; }
fi

hr_config_load "$root" || :
target=$(hr_execution_target "$root") || {
  echo "remote-run.sh: cannot resolve '$root/harness.config.json' (or execution.target is outside its enum)" >&2
  exit "$EXIT_USAGE"
}
if [ "$target" != github-actions ]; then
  echo "remote-run.sh: refused, nothing sent: execution.target is '$target', not github-actions" >&2
  exit "$EXIT_REFUSED"
fi

cd "$root" || { echo "remote-run.sh: cannot enter '$root'" >&2; exit "$EXIT_USAGE"; }

# ---------------------------------------------------------------------------
# The verbs.
# ---------------------------------------------------------------------------

verb_dispatch() {
  local answers="" value n file payload
  local -a inputs
  inputs=(-f "action=run" -f "branch=$branch" -f "engine=$engine" -f "resume=$resume")

  if [ "$resume" = answer ]; then
    answers='{}'
    for n in $indexes; do
      file="${answers_from%/}/answer_$n.md"
      if [ ! -f "$file" ] || [ ! -r "$file" ]; then
        echo "remote-run.sh: refused, nothing sent: answer file '$file' is missing" >&2
        exit "$EXIT_REFUSED"
      fi
      value=$(jq -R -s . <"$file") || { echo "remote-run.sh: cannot read '$file' as text" >&2; exit "$EXIT_USAGE"; }
      answers=$(jq -n -c --argjson acc "$answers" --arg k "$n" --argjson v "$value" '$acc + {($k): $v}') \
        || { echo "remote-run.sh: cannot build the answers payload" >&2; exit "$EXIT_USAGE"; }
    done
    inputs+=(-f "answers=$answers")
  fi
  if [ "$park_loop_clear" -eq 1 ]; then
    inputs+=(-f "park_loop_clear=true")
  fi
  inputs+=(-f "chain=$chain")

  # The limit is on the whole inputs object, so that is what is measured.
  payload=$(jq -n -c --arg action run --arg branch "$branch" --arg engine "$engine" \
    --arg resume "$resume" --arg answers "$answers" --arg plc "$park_loop_clear" --arg chain "$chain" \
    '{action: $action, branch: $branch, engine: $engine, resume: $resume}
     + (if $answers == "" then {} else {answers: $answers} end)
     + (if $plc == "1" then {park_loop_clear: "true"} else {} end)
     + {chain: $chain}') || { echo "remote-run.sh: cannot measure the inputs payload" >&2; exit "$EXIT_USAGE"; }
  if [ "${#payload}" -gt "$REMOTE_INPUT_PAYLOAD_MAX" ]; then
    echo "remote-run.sh: refused, nothing sent: the inputs payload is ${#payload} characters, over GitHub's workflow_dispatch limit of $REMOTE_INPUT_PAYLOAD_MAX" >&2
    exit "$EXIT_REFUSED"
  fi

  gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$branch" "${inputs[@]}" || gh_fail "dispatch of '$branch' failed"
  echo "remote-run.sh: dispatched action=run engine=$engine resume=$resume for $branch"
}

verb_pause() {
  gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$branch" -f "action=pause" -f "branch=$branch" || gh_fail "pause of '$branch' failed"
  echo "remote-run.sh: dispatched action=pause for $branch"
}

verb_warm() {
  local default_branch
  gh_call repo view --json defaultBranchRef || gh_fail "reading GitHub's default branch failed"
  default_branch=$(printf '%s' "$GH_OUT" | jq -r '.defaultBranchRef.name // empty' 2>/dev/null)
  if ! valid_branch "$default_branch"; then
    GH_ERR="no defaultBranchRef.name in its output"
    gh_fail "reading GitHub's default branch failed"
  fi
  gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$default_branch" -f "action=warm" -f "branch=$default_branch" || gh_fail "warm-up on '$default_branch' failed"
  echo "remote-run.sh: dispatched action=warm on $default_branch"
}

verb_stop() {
  local ids id failed=0 first_err="" registry stopped_at
  stopped_at=$(date +%s)
  gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$branch" -f "action=stop" -f "branch=$branch" || gh_fail "stop marker for '$branch' failed, nothing cancelled"
  echo "remote-run.sh: dispatched the action=stop marker for $branch"

  gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" --json databaseId,status --limit 100 || gh_fail "listing the runs of '$branch' failed"
  ids=$(printf '%s' "$GH_OUT" | jq -r '.[] | select(.status == "queued" or .status == "in_progress" or .status == "waiting") | .databaseId' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    gh_fail "listing the runs of '$branch' failed"
  }
  for id in $ids; do
    if gh_call run cancel "$id"; then
      echo "remote-run.sh: asked GitHub to cancel run $id of $branch"
    else
      failed=1
      [ -n "$first_err" ] || first_err="$GH_ERR"
      echo "remote-run.sh: cancelling run $id of $branch failed: $GH_ERR" >&2
    fi
  done
  if [ "$failed" -eq 1 ]; then
    GH_ERR="$first_err"
    gh_fail "stop of '$branch' is partial; the local record is unchanged, run stop again"
  fi

  registry=$(hr_state_path "$root" autonomous_logs/registry.json) || registry=""
  if [ -n "$registry" ] && [ -f "$registry" ] && [ -n "$(hr_registry_get "$registry" "$branch" branch)" ]; then
    hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" \
      && hr_registry_set "$registry" "$branch" status failed \
      || echo "remote-run.sh: stopped on GitHub, but the local record of $branch could not be updated" >&2
  fi
  echo "remote-run.sh: stopped $branch"
}

case "$verb" in
  dispatch) verb_dispatch ;;
  pause) verb_pause ;;
  warm) verb_warm ;;
  stop) verb_stop ;;
esac
exit "$EXIT_OK"
