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
#   remote-run.sh status <branch> [--repo <root>]
#   remote-run.sh sync <branch> [--repo <root>]
#     0  sent (for stop: the action=stop marker was dispatched, and every
#        queued, waiting or in-progress run of that branch was asked to cancel,
#        or there was none); for status: printed; for sync: the record is
#        current (including "no run listed yet", which writes nothing)
#     1  usage error, or the library or the configuration could not be
#        resolved; for sync, a local copy or registry write failed
#     2  refused, nothing sent or written: execution.target is not
#        github-actions (sending verbs); the branch's local record does not
#        carry `execution: github-actions` (status, sync); the record's mirror
#        working copy is missing, or a downloaded bundle is unrecognised
#        (sync); the inputs payload is over the limit; a named answer file is
#        missing
#     3  gh failed: not found, or a non-zero exit — the first line of gh's
#        stderr is named
#
# `status` AND `sync` READ THE RECORD, NOT THE KEY. A run keeps the execution
# it started with, so they test the record's `execution` field and never
# `execution.target`; the configuration is still read for `stateDir`.
#
# `status` WRITES NOTHING AT ALL — no registry (it does not even create an
# absent one), no download, no file. It prints the branch's newest runs titled
# `harness run <branch>` or `harness pause <branch>` (bounded), the record's
# `status`, `pause_reason`, `remote_run_url` and `remote_synced_at`, and whether
# a `harness run` finished after the last sync.
#
# `sync` READS THE NEWEST `harness run <branch>` RUN. Any status but
# `completed` (queued, in_progress, waiting, requested, pending) sets the record
# `running` and downloads nothing. Otherwise that run — the newest finished one
# — decides, in exactly one of four cases, tested in this order:
#   1. its id is the record's `remote_run_id`: already applied. Only
#      `remote_synced_at` is written; nothing is downloaded or restored, so an
#      answer written into the mirror since the last sync survives
#   2. it carries an unexpired `harness-state` artifact: downloaded (skipped
#      when the download directory already holds its status.json), restored in
#      `mirror` mode into the record's `worktree`, `run.log` copied to the main
#      checkout's `autonomous_logs/<branch>.remote.log`, and `status`,
#      `pause_reason`, `usage_resume_at`, `park_loop_cycles`, `remote_run_id`,
#      `remote_run_url`, `remote_detail` and `remote_synced_at` written
#   3. no artifact, while some bundle exists (`remote_run_id` is set, or an
#      older finished run carries one): a job that died before its upload.
#      `paused` / `killed`, `remote_run_id` / `remote_run_url` re-pointed at
#      THIS run, nothing restored — so a later sync with no newer run is case 1
#   4. no bundle in any run and an empty `remote_run_id`: `failed`. Not
#      `paused`: with no bundle anywhere a pause resume has nothing to restore,
#      and re-dropping the artifact is the recovery
#
# THE `killed` MAPPING. A finished run whose bundle still says `running` (a
# kill, a timeout with no chain left) syncs as `status: paused`, `pause_reason:
# killed`. `killed` is registry-only — `status.json` never carries it. It is
# `paused` rather than `failed` because a `failed` record has no resume path,
# while the ledger on the branch is intact and a resume continues from it.
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
# inbox, never pushes, and never watches a run it sent. Its only writes are the
# registry record (`stop`, `sync`) and, for `sync`, the download directory
# `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/` and
# `<branch>.remote.log` in the main checkout, plus the mirror restore
# `hr_remote_bundle_restore` performs in the record's `worktree`.
#
# MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a
# rename there is an edit here, byte for byte:
#   WORKFLOW_RUN_FILE    mirrors  WORKFLOW_RUN_FILE
#   STATE_ARTIFACT_NAME  mirrors  STATE_ARTIFACT_NAME
#   HARNESS_GH_CLI       mirrors  GH_CLI_VARIABLE (the binary run as `gh`)
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
#
#   status and sync need a remote record, and a `run list` answer whose runs
#   carry `displayTitle` `harness run feat_x` and a `url`:
#   r=sdlc-harness/autonomous_logs/registry.json; mkdir -p "${r%/*}"
#   printf '{"runs":{"feat_x":{"execution":"github-actions","worktree":"%s"}}}' "$d" > "$r"
#   status     bash scripts/remote-run.sh status feat_x       -> 0; prints the runs
#              titled `harness run feat_x` / `harness pause feat_x`, the record's
#              fields and the finished-since line; "$r" byte-identical
#   sync       with the newest such run `in_progress`: bash scripts/remote-run.sh
#              sync feat_x -> 0; the record is `running`, no `run download` logged
#   no record  bash scripts/remote-run.sh sync feat_y         -> 2, log unchanged
#   no mirror  the record's worktree set to /nonexistent, then sync  -> 2, names it
#   a bundle   a stub answering `run list` with a completed run, `api
#              repos/{owner}/{repo}/actions/runs/<id>/artifacts` with
#              {"artifacts":[{"name":"harness-state","expired":false}]}, and
#              `run download <id> -n harness-state -D <dir>` by writing a bundle
#              (status.json with schema "1", branch feat_x, status parked) into
#              <dir> -> the record is `parked`, remote_run_id is <id>; sync
#              again -> only remote_synced_at changes, no second download

set -u

hr_lib="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "remote-run.sh: cannot read '$hr_lib'" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

WORKFLOW_RUN_FILE='harness-run.yml'
STATE_ARTIFACT_NAME='harness-state'
GH="${HARNESS_GH_CLI:-gh}"

# How many runs `status` prints, and how many `run list` returns for status
# and sync — enough to reach past interleaved `harness pause` runs.
STATUS_RUNS_SHOWN=10
RUN_LIST_LIMIT=50

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
  echo "       remote-run.sh status <branch> [--repo <root>]" >&2
  echo "       remote-run.sh sync <branch> [--repo <root>]" >&2
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
  dispatch|pause|warm|stop|status|sync) ;;
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
registry=""
case "$verb" in
  status|sync)
    registry=$(hr_state_path "$root" autonomous_logs/registry.json) || {
      echo "remote-run.sh: cannot resolve '$root/harness.config.json'" >&2
      exit "$EXIT_USAGE"
    }
    # Tested with -f first: hr_registry_get creates an absent registry, and
    # status writes nothing.
    if [ ! -f "$registry" ] || [ "$(hr_registry_get "$registry" "$branch" execution)" != github-actions ]; then
      echo "remote-run.sh: refused, nothing written: the local record of '$branch' does not carry execution: github-actions" >&2
      exit "$EXIT_REFUSED"
    fi
    ;;
  *)
    target=$(hr_execution_target "$root") || {
      echo "remote-run.sh: cannot resolve '$root/harness.config.json' (or execution.target is outside its enum)" >&2
      exit "$EXIT_USAGE"
    }
    if [ "$target" != github-actions ]; then
      echo "remote-run.sh: refused, nothing sent: execution.target is '$target', not github-actions" >&2
      exit "$EXIT_REFUSED"
    fi
    ;;
esac

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

# list_runs — the branch's runs of the workflow into GH_OUT; exits 3 on failure.
list_runs() {
  gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" \
    --json databaseId,displayTitle,status,conclusion,createdAt,url --limit "$RUN_LIST_LIMIT" \
    || gh_fail "listing the runs of '$branch' failed"
  printf '%s' "$GH_OUT" | jq -e 'type == "array"' >/dev/null 2>&1 || {
    GH_ERR="its run list is not the expected JSON"
    gh_fail "listing the runs of '$branch' failed"
  }
}

# titled_runs <title> [<title>] — GH_OUT's runs carrying either title, newest
# first. Two named --arg values rather than --args, which needs jq 1.6.
titled_runs() {
  printf '%s' "$GH_OUT" | jq -c --arg a "$1" --arg b "${2-$1}" '
    [.[] | select(.displayTitle == $a or .displayTitle == $b)]
    | sort_by([.createdAt, .databaseId]) | reverse'
}

# has_bundle <run_id> — 0 when the run carries an unexpired state artifact.
has_bundle() {
  local count
  gh_call api "repos/{owner}/{repo}/actions/runs/$1/artifacts" || gh_fail "reading the artifacts of run $1 failed"
  count=$(printf '%s' "$GH_OUT" | jq --arg n "$STATE_ARTIFACT_NAME" \
    '[.artifacts[]? | select(.name == $n and (.expired != true))] | length' 2>/dev/null) || {
    GH_ERR="its artifact list is not the expected JSON"
    gh_fail "reading the artifacts of run $1 failed"
  }
  [ "$count" -gt 0 ]
}

set_or_fail() {
  hr_registry_set "$registry" "$branch" "$1" "$2" || {
    echo "remote-run.sh: writing $1 of $branch to '$registry' failed" >&2
    exit "$EXIT_USAGE"
  }
}

verb_status() {
  local runs finished_id synced_id field
  list_runs
  runs=$(titled_runs "harness run $branch" "harness pause $branch") || runs='[]'
  echo "remote-run.sh: runs of $WORKFLOW_RUN_FILE for $branch, newest first:"
  printf '%s' "$runs" | jq -r --argjson n "$STATUS_RUNS_SHOWN" '
    if length == 0 then "  (none)" else
    .[:$n][] | "  \(.databaseId)  \(.displayTitle)  \(.status)/\(.conclusion // "")  \(.createdAt)  \(.url)" end'
  echo "remote-run.sh: local record (last synced):"
  for field in status pause_reason remote_run_url remote_synced_at; do
    printf '  %s: %s\n' "$field" "$(hr_registry_get "$registry" "$branch" "$field")"
  done
  finished_id=$(printf '%s' "$runs" | jq -r --arg t "harness run $branch" \
    '[.[] | select(.displayTitle == $t and .status == "completed")][0].databaseId // empty | tostring')
  synced_id=$(hr_registry_get "$registry" "$branch" remote_run_id)
  if [ -n "$finished_id" ] && [ "$finished_id" != "$synced_id" ]; then
    echo "remote-run.sh: run $finished_id finished after the last sync; sync would change the record"
  else
    echo "remote-run.sh: no run finished after the last sync"
  fi
}

verb_sync() {
  local worktree runs newest id state url synced_id now older download status_file
  local status reason detail
  worktree=$(hr_registry_get "$registry" "$branch" worktree)
  if [ -z "$worktree" ] || [ ! -d "$worktree" ]; then
    echo "remote-run.sh: refused, nothing written: the mirror working copy '$worktree' of $branch is missing" >&2
    exit "$EXIT_REFUSED"
  fi
  list_runs
  runs=$(titled_runs "harness run $branch") || runs='[]'
  newest=$(printf '%s' "$runs" | jq -c '.[0] // empty')
  if [ -z "$newest" ]; then
    echo "remote-run.sh: no run titled 'harness run $branch' is listed yet; the record is unchanged"
    return 0
  fi
  id=$(printf '%s' "$newest" | jq -r '.databaseId | tostring')
  state=$(printf '%s' "$newest" | jq -r '.status // ""')
  url=$(printf '%s' "$newest" | jq -r '.url // ""')
  now=$(date +%s)

  if [ "$state" != completed ]; then
    set_or_fail status running
    set_or_fail remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch is $state; the record is running, nothing downloaded"
    return 0
  fi

  synced_id=$(hr_registry_get "$registry" "$branch" remote_run_id)
  # Case 1 — already applied.
  if [ "$id" = "$synced_id" ]; then
    set_or_fail remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch is the one last synced; the mirror is current"
    return 0
  fi

  # Case 2 — a newer run with a bundle.
  if has_bundle "$id"; then
    hr_remote_names_var
    download=$(hr_state_path "$root" "autonomous_logs/remote_download/$branch/$id") || {
      echo "remote-run.sh: cannot resolve '$root/harness.config.json'" >&2
      exit "$EXIT_USAGE"
    }
    status_file="$download/$HR_REMOTE_STATUS_FILE"
    if [ ! -f "$status_file" ]; then
      mkdir -p "$download" || { echo "remote-run.sh: cannot create '$download'" >&2; exit "$EXIT_USAGE"; }
      gh_call run download "$id" -n "$STATE_ARTIFACT_NAME" -D "$download" || gh_fail "downloading the bundle of run $id failed"
    fi
    status=$(hr_remote_status_get "$status_file" status) || status=""
    case "$status" in
      running|parked|park_loop|paused|completed|failed) ;;
      *)
        echo "remote-run.sh: refused, nothing written: the bundle in '$download' is unrecognised" >&2
        exit "$EXIT_REFUSED"
        ;;
    esac
    hr_remote_bundle_restore "$download" "$worktree" "$branch" mirror
    case $? in
      0) ;;
      2) echo "remote-run.sh: refused, nothing written: the bundle in '$download' is unrecognised for $branch" >&2; exit "$EXIT_REFUSED" ;;
      *) echo "remote-run.sh: restoring '$download' into '$worktree' failed" >&2; exit "$EXIT_USAGE" ;;
    esac
    if [ -f "$download/$HR_REMOTE_LOG_FILE" ]; then
      local remote_log
      remote_log=$(hr_state_path "$root" "autonomous_logs/$branch.remote.log") || remote_log=""
      if [ -n "$remote_log" ]; then
        mkdir -p "${remote_log%/*}" && cp "$download/$HR_REMOTE_LOG_FILE" "$remote_log" \
          || { echo "remote-run.sh: copying the run log to '$remote_log' failed" >&2; exit "$EXIT_USAGE"; }
      fi
    fi
    reason=$(hr_remote_status_get "$status_file" pause_reason) || reason=""
    detail=$(hr_remote_status_get "$status_file" detail) || detail=""
    if [ "$status" = running ]; then
      status=paused
      reason=killed
      detail="the job ended mid-run (its bundle still says running): $url"
    fi
    [ -n "$detail" ] || detail="synced from $url"
    set_or_fail status "$status"
    set_or_fail pause_reason "$reason"
    set_or_fail usage_resume_at "$(hr_remote_status_get "$status_file" usage_resume_at || :)"
    set_or_fail park_loop_cycles "$(hr_remote_status_get "$status_file" park_loop_cycles || :)"
    set_or_fail remote_run_id "$id"
    set_or_fail remote_run_url "$url"
    set_or_fail remote_detail "$detail"
    set_or_fail remote_synced_at "$now"
    echo "remote-run.sh: synced run $id of $branch: $status${reason:+ ($reason)}"
    return 0
  fi

  # Case 3 — a newer run with no bundle, while some bundle exists.
  local bundle_exists=0
  if [ -n "$synced_id" ]; then
    bundle_exists=1
  else
    for older in $(printf '%s' "$runs" | jq -r '.[1:][] | select(.status == "completed") | .databaseId | tostring'); do
      if has_bundle "$older"; then bundle_exists=1; break; fi
    done
  fi
  if [ "$bundle_exists" -eq 1 ]; then
    set_or_fail status paused
    set_or_fail pause_reason killed
    set_or_fail remote_run_id "$id"
    set_or_fail remote_run_url "$url"
    set_or_fail remote_detail "run $id ended with no state bundle (killed, cancelled or replaced): $url"
    set_or_fail remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch left no bundle; the record is paused (killed), nothing restored"
    return 0
  fi

  # Case 4 — no bundle in any run.
  set_or_fail status failed
  set_or_fail remote_detail "no run of $branch ever uploaded a state bundle; newest: $url"
  set_or_fail remote_synced_at "$now"
  echo "remote-run.sh: no run of $branch carries a state bundle; the record is failed"
}

case "$verb" in
  dispatch) verb_dispatch ;;
  pause) verb_pause ;;
  warm) verb_warm ;;
  stop) verb_stop ;;
  status) verb_status ;;
  sync) verb_sync ;;
esac
exit "$EXIT_OK"
