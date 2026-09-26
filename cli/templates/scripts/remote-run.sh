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
#   remote-run.sh restore <branch> --resume none|answer|pause [--repo <root>]
#   remote-run.sh save <branch> <out_dir> [--repo <root>]
#   remote-run.sh continue <branch> <bundle_dir> [--repo <root>]
#   remote-run.sh poll [--repo <root>]
#   remote-run.sh pause-requested <branch> <since_epoch> [--repo <root>]
#   remote-run.sh run-created-at <run_id> [--repo <root>]
#     0  sent (for stop: the action=stop marker was dispatched, and every
#        queued, waiting or in-progress `harness run` run of that branch was
#        asked to cancel, or there was none); for status: printed; for sync: the record is
#        current (including "no run listed yet", which writes nothing); for
#        restore: restored, or no previous bundle under --resume none|pause;
#        for save: ALWAYS, whatever happened; for continue: whatever it
#        decided — every outcome a person must act on is a notification; for
#        poll: the tick finished; for pause-requested: such a run exists; for
#        run-created-at: printed
#     1  usage error, or the library or the configuration could not be
#        resolved; for sync and restore, a local copy or write failed; for
#        pause-requested, also NO such run — a caller that reads 1 as "no
#        pause" passes arguments it has already validated
#     2  refused, nothing sent or written: execution.target is not
#        github-actions (sending verbs); the branch's local record does not
#        carry `execution: github-actions` (status, sync); the record's mirror
#        working copy is missing, or a downloaded bundle is unrecognised
#        (sync, restore); the inputs payload is over the limit; a named answer
#        file is missing. For restore under --resume answer, "nothing more":
#        no previous bundle, `HARNESS_INPUT_ANSWERS` not an object of
#        positive-integer keys to strings, or an answer whose `question_<n>.md`
#        is not at the top level — the bundle may already be restored, and no
#        answer is written
#     3  gh failed: not found, or a non-zero exit — the first line of gh's
#        stderr is named. For poll: the listing or the disable failed. For
#        pause-requested and run-created-at, also an answer that is not the
#        expected JSON; a caller never pauses on a failed read
#
# `restore` AND `save` ARE THE JOB-SIDE VERBS: the run workflow calls them in
# its job, before and (under `always()`) after the harness step. Without
# `--repo` they act on the checkout of the working directory (`hr_repo_root`),
# not the main checkout. They test neither `execution.target` nor a registry
# record: the job exists because a dispatch passed the target gate, and a
# fresh job checkout carries no registry.
#
# WORKFLOW INPUTS REACH THEM THROUGH THE ENVIRONMENT, NEVER A `${{ }}`
# EXPRESSION INTERPOLATED INTO A SHELL LINE — an input is attacker-shaped text,
# and interpolation makes it shell source. The workflow sets them with `env:`:
#   HARNESS_INPUT_ANSWERS          the `answers` input (restore --resume answer)
#   HARNESS_INPUT_PARK_LOOP_CLEAR  the `park_loop_clear` input (restore)
# `GITHUB_RUN_ID` (restore: this run is never its own previous run) and
# `GITHUB_STEP_SUMMARY` (save) are the runner's own.
#
# `restore` SELECTS the newest `completed` run titled `harness run <branch>`,
# other than `GITHUB_RUN_ID`, carrying an unexpired `harness-state` artifact;
# downloads it to `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/`
# (skipped when that directory already holds its status.json); and restores it
# in `job` mode — on every --resume kind, `none` included, because a reused
# branch keeps its clarification history. Then, under --resume answer, it
# writes each `"<n>": "<text>"` entry to `clarifications/<branch>/answer_<n>.md`
# with the exact bytes, after checking every entry first; and with
# `HARNESS_INPUT_PARK_LOOP_CLEAR` exactly `true` it sets `park_loop_cycles` to
# "0" in the restored `autonomous_logs/remote_status.json`. No previous bundle
# is an ordinary first job (exit 0, one line) except under --resume answer.
#
# `save` WRAPS `hr_remote_bundle_write` into <out_dir>, and with
# `GITHUB_STEP_SUMMARY` set appends a Markdown table of the bundle's `status`,
# `decision` and `detail`. With no `autonomous_logs/remote_status.json` and no
# registry file the harness step never started: <out_dir> is created empty,
# with no status.json — what `continue` reads as "never started". It never
# fails the job: every problem, a usage error included, is one line on stderr
# and exit 0.
#
# `continue` AND `poll` CLOSE THE LOOP WITHOUT THIS MACHINE, and like `restore`
# and `save` test neither `execution.target` nor a registry record. `continue`
# is the run workflow's last job step (under `!cancelled()`); `poll` is the
# whole body of the resume poller, `WORKFLOW_RESUME_FILE`. Both read, from the
# environment the workflows set:
#   HARNESS_MAX_CHAIN    the automatic-dispatch limit; `24` when empty. Not a
#                        non-negative integer: nothing is dispatched
#   HARNESS_REMOTE_STOP  non-empty: nothing is dispatched
#   HARNESS_REMOTE_SLUG  exported as `HARNESS_REPO_SLUG` before a notification,
#                        so it names the repository rather than a runner path
#   GITHUB_RUN_ID, GITHUB_SERVER_URL, GITHUB_REPOSITORY   the run URL
# Notifications go through the sibling `autonomous-notify.sh`, as `paused` or
# `failed`. A re-dispatch is `dispatch <branch> --engine <status.json engine>
# --resume pause --chain <chain + 1>`, composed by `dispatch` itself.
#
# `chain` HAS ONE SOURCE: the bundle's `status.json`, whose `chain` is the
# writing job's own input — never `HARNESS_INPUT_CHAIN`, the registry or a
# run's inputs. So `chain + 1` is one more than the job that wrote the bundle,
# and a user's dispatch (chain 0) restarts the count. An absent or non-integer
# `chain` is a chain-limit refusal ("chain unreadable"), never 0.
#
# `continue <branch> <bundle_dir>` reads the bundle `save` just wrote:
#   no status.json   the harness step never started: one `failed` naming the
#                    run URL, no dispatch
#   decision continue   refused, in this order: `HARNESS_REMOTE_STOP` set (one
#                    `paused`); the branch stopped (one log line, no
#                    notification — the user asked for it); chain unreadable
#                    or `chain + 1` over `HARNESS_MAX_CHAIN` (one `failed`);
#                    otherwise re-dispatched. A dispatch that fails is one
#                    `paused` naming its error
#   decision wait-poller   the branch stopped: one log line. Otherwise `gh
#                    workflow enable WORKFLOW_RESUME_FILE`; a failed enable
#                    (the job token's enable permission is unverified) is one
#                    `paused` saying auto-resume is unavailable
#   decision stop    nothing: job mode has already notified
# A job killed by its step timeout re-dispatches, because job mode writes
# `decision: continue` the moment it starts; `HARNESS_MAX_CHAIN` is what bounds
# a job that is killed every time.
#
# WHY RE-DISPATCH IS NOT LEFT TO `!cancelled()` ALONE. A user's `stop` cancels a
# running job, so its `continue` step never runs — but a usage-paused run
# waiting for the poller has no job to cancel. The stop marker reaches it:
# `remote_branch_stopped` finds a branch stopped when its newest run titled
# `harness stop <branch>` was created after its newest `harness run <branch>`,
# from one bounded newest-first listing of every branch. A marker outside the
# window is older than every `harness run` inside it, and a user's later
# dispatch is newer than the marker, so it un-stops the branch with no extra
# step. It runs ahead of every dispatch and every enable. A listing that fails
# fails CLOSED in `continue`: nothing sent, one `paused` naming gh's error.
#
# `poll`: `HARNESS_REMOTE_STOP` set exits 0 with nothing sent. Otherwise one
# listing; each branch's newest `harness run <branch>` run decides. Skipped,
# not waiting: a stopped branch, a run not yet `completed` (its own `continue`
# will decide), a bundle that cannot be downloaded (one line), and anything but
# `status: paused` / `pause_reason: usage` with an integer `usage_resume_at`.
# Due (reset passed): re-dispatched under the same chain limit — a refusal is
# one `failed` and not waiting; a dispatch that fails is one line and still
# waiting. Reset ahead: waiting. No branch waiting after the tick: `gh workflow
# disable WORKFLOW_RESUME_FILE`. Bundles download to
# `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/` in the checkout,
# skipped when that directory already holds its status.json.
#
# `pause-requested` AND `run-created-at` ARE THE JOB'S TWO READ VERBS, called by
# `autonomous-watcher.sh job`; like `restore` they test neither
# `execution.target` nor a registry record, run gh from `hr_repo_root` of the
# working directory unless `--repo` names one, and write nothing.
# `pause-requested` lists the branch's runs and exits 0 when one whose
# `displayTitle` is exactly `harness pause <branch>` has a `createdAt` at or
# after <since_epoch> — AT, because `createdAt` has one-second resolution and
# the caller takes <since_epoch> just before the query it will next start
# from, so a pause created later in that same second is still seen; seeing one
# twice is harmless, since the caller drops PAUSE once. `run-created-at` prints
# `gh run view <run_id> --json createdAt` as an epoch second.
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
# cancel. (2) It lists the branch's runs of the workflow and cancels each run
# titled `harness run <branch>` whose status is `queued`, `in_progress` or
# `waiting` — never a jobless `harness stop` / `harness pause` marker, which has
# no job to stop and may complete before its cancel lands — trying every one even
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
# `hr_remote_bundle_restore` performs in the record's `worktree`; for
# `restore`, that download directory, the job restore, `answer_<n>.md` and the
# `park_loop_cycles` rewrite of `remote_status.json`, all in the job's
# checkout; for `save`, <out_dir> and the step summary; for `poll`, its
# download directories. `pause-requested` and `run-created-at` write nothing.
#
# MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a
# rename there is an edit here, byte for byte:
#   WORKFLOW_RUN_FILE    mirrors  WORKFLOW_RUN_FILE
#   WORKFLOW_RESUME_FILE mirrors  WORKFLOW_RESUME_FILE
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
#     'case "$1 $2" in "run list") echo "[{\"databaseId\":7,\"displayTitle\":\"harness run feat_x\",\"status\":\"in_progress\"}]";;' \
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
#
#   restore and save run in the job's checkout; with that same "a bundle" stub
#   (the bundle also carrying clarifications/feat_x/question_1.md and
#   flow_walker_state) and GITHUB_RUN_ID set to another id:
#   restore    bash scripts/remote-run.sh restore feat_x --resume none   -> 0; the
#              checkout carries clarifications/feat_x/question_1.md,
#              .flow_walker_state and autonomous_logs/remote_status.json
#   answer     HARNESS_INPUT_ANSWERS='{"1":"Use B.\n"}' ... --resume answer -> 0;
#              clarifications/feat_x/answer_1.md holds exactly `Use B.` + newline
#   no question  HARNESS_INPUT_ANSWERS='{"2":"x"}' ... --resume answer
#              -> 2, no answer_2.md written
#   clear      HARNESS_INPUT_PARK_LOOP_CLEAR=true ... --resume none -> 0;
#              remote_status.json's park_loop_cycles is "0"
#   first job  a `run list` answer with no finished run: --resume none -> 0;
#              --resume answer -> 2
#   own run    GITHUB_RUN_ID=<the bundle run's id> -> that run is skipped
#   save       bash scripts/remote-run.sh save feat_x /tmp/b -> 0; /tmp/b holds
#              status.json, clarifications/feat_x/, flow_walker_state (and
#              PAUSE_PROGRESS.md, run.log when present); with
#              GITHUB_STEP_SUMMARY=/tmp/s, /tmp/s gains the status table
#   never started  no remote_status.json and no registry: save -> 0, /tmp/b
#              empty
#
#   continue and poll: point HARNESS_PUSH_CMD at a recorder for notifications;
#   <b> is a bundle directory whose status.json carries schema "1":
#   continue   decision continue, chain "3": bash scripts/remote-run.sh continue
#              feat_x <b> -> 0; `run list ...`, then `workflow run ... -f
#              resume=pause -f chain=4`
#   limit      HARNESS_MAX_CHAIN=3, same bundle -> 0, no `workflow run`, one
#              `failed`; chain "x" -> the same ("chain unreadable")
#   remote stop  HARNESS_REMOTE_STOP=1 -> 0, nothing sent, one `paused`
#   stopped    a `run list` answer whose `harness stop feat_x` run is newer than
#              its `harness run feat_x` run -> 0, no `workflow run`, no
#              `workflow enable`, no notification
#   list fails a stub failing `run list` -> 0, nothing sent, one `paused`
#   wait-poller  decision wait-poller -> `workflow enable harness-resume.yml`;
#              a stub failing it -> one `paused` naming its stderr
#   no status  an empty <b> -> 0, one `failed` naming the run URL
#   poll       a `run list` answer with a completed `harness run feat_x` run
#              whose bundle says paused / usage / usage_resume_at 1: bash
#              scripts/remote-run.sh poll -> 0; `run download`, `workflow run
#              ... -f resume=pause`, then `workflow disable harness-resume.yml`;
#              with usage_resume_at far ahead -> no dispatch, no disable
#
#   the job's reads: a `run list` answer whose run has `displayTitle` `harness
#   pause feat_x` and `createdAt` `2026-01-01T00:00:10Z` (epoch 1767225610):
#   pause-requested  bash scripts/remote-run.sh pause-requested feat_x 1767225600
#              -> 0; with 1767225620 -> 1; a stub failing `run list` -> 3
#   run-created-at   a stub answering `run view 42 --json createdAt` with
#              {"createdAt":"2026-01-01T00:00:10Z"}: bash scripts/remote-run.sh
#              run-created-at 42 -> prints 1767225610, 0; a failing stub -> 3

set -u

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
hr_lib="$script_dir/lib/harness-run-lib.sh"
if [ ! -r "$hr_lib" ]; then
  echo "remote-run.sh: cannot read '$hr_lib'" >&2
  exit 1
fi
# shellcheck source=lib/harness-run-lib.sh
. "$hr_lib"

WORKFLOW_RUN_FILE='harness-run.yml'
WORKFLOW_RESUME_FILE='harness-resume.yml'
STATE_ARTIFACT_NAME='harness-state'
GH="${HARNESS_GH_CLI:-gh}"

# How many runs `status` prints, and how many `run list` returns for status
# and sync — enough to reach past interleaved `harness pause` runs.
STATUS_RUNS_SHOWN=10
RUN_LIST_LIMIT=50
# The one listing of every branch's runs that the stop marker and `poll` read.
ALL_RUNS_LIMIT=100
MAX_CHAIN_DEFAULT=24

# GitHub's documented limit on a `workflow_dispatch` inputs payload: "The
# maximum payload for inputs is 65,535 characters."
# https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onworkflow_dispatchinputs
REMOTE_INPUT_PAYLOAD_MAX=65535

EXIT_OK=0
EXIT_USAGE=1
EXIT_REFUSED=2
EXIT_GH=3
# pause-requested only: the read succeeded and found no pause.
EXIT_NO_PAUSE=1

usage() {
  echo "remote-run.sh: $1" >&2
  echo "usage: remote-run.sh dispatch <branch> --engine <task|user_review|docs> [--resume none|answer|pause] [--answers-from <clar_dir> --indexes \"<n> ...\"] [--park-loop-clear] [--chain <n>] [--repo <root>]" >&2
  echo "       remote-run.sh pause <branch> [--repo <root>]" >&2
  echo "       remote-run.sh warm [--repo <root>]" >&2
  echo "       remote-run.sh stop <branch> [--repo <root>]" >&2
  echo "       remote-run.sh status <branch> [--repo <root>]" >&2
  echo "       remote-run.sh sync <branch> [--repo <root>]" >&2
  echo "       remote-run.sh restore <branch> --resume none|answer|pause [--repo <root>]" >&2
  echo "       remote-run.sh save <branch> <out_dir> [--repo <root>]" >&2
  echo "       remote-run.sh continue <branch> <bundle_dir> [--repo <root>]" >&2
  echo "       remote-run.sh poll [--repo <root>]" >&2
  echo "       remote-run.sh pause-requested <branch> <since_epoch> [--repo <root>]" >&2
  echo "       remote-run.sh run-created-at <run_id> [--repo <root>]" >&2
  [ "${verb-}" != save ] || exit "$EXIT_OK"
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

verb=""
[ "$#" -ge 1 ] || usage "no verb given"
verb="$1"
shift
case "$verb" in
  dispatch|pause|warm|stop|status|sync|restore|save|continue|poll|pause-requested|run-created-at) ;;
  *) usage "unknown verb '$verb'" ;;
esac

branch=""
out_dir=""
bundle_dir=""
engine=""
resume="none"
resume_given=0
answers_from=""
indexes=""
indexes_given=0
park_loop_clear=0
chain="0"
repo_arg=""
since_arg=""
run_id_arg=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] || usage "--repo needs a value"
      repo_arg="$2"; shift 2 ;;
    --resume)
      [ "$verb" = dispatch ] || [ "$verb" = restore ] || usage "$1 is a dispatch or restore option"
      [ "$#" -ge 2 ] || usage "$1 needs a value"
      resume="$2"; resume_given=1; shift 2 ;;
    --engine|--answers-from|--indexes|--chain)
      [ "$verb" = dispatch ] || usage "$1 is a dispatch option"
      [ "$#" -ge 2 ] || usage "$1 needs a value"
      case "$1" in
        --engine) engine="$2" ;;
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
      [ "$verb" != warm ] && [ "$verb" != poll ] || usage "$verb takes no branch"
      if [ "$verb" = run-created-at ]; then
        [ -z "$run_id_arg" ] || usage "unexpected argument '$1'"
        run_id_arg="$1"
      elif [ -z "$branch" ]; then
        branch="$1"
      elif [ "$verb" = pause-requested ] && [ -z "$since_arg" ]; then
        since_arg="$1"
      elif [ "$verb" = save ] && [ -z "$out_dir" ]; then
        out_dir="$1"
      elif [ "$verb" = continue ] && [ -z "$bundle_dir" ]; then
        bundle_dir="$1"
      else
        usage "unexpected argument '$1'"
      fi
      shift ;;
  esac
done

if [ "$verb" != warm ] && [ "$verb" != poll ] && [ "$verb" != run-created-at ]; then
  valid_branch "$branch" || usage "$verb needs a <branch>"
fi

if [ "$verb" = pause-requested ]; then
  case "$since_arg" in
    ''|*[!0-9]*) usage "pause-requested needs a <since_epoch> that is a non-negative integer" ;;
  esac
  # Base 10, so a leading zero is neither octal nor invalid JSON for --argjson.
  since_arg=$((10#$since_arg))
fi

if [ "$verb" = run-created-at ]; then
  case "$run_id_arg" in
    ''|*[!0-9]*|0*) usage "run-created-at needs a <run_id> that is a positive integer" ;;
  esac
fi

if [ "$verb" = continue ] && [ -z "$bundle_dir" ]; then
  usage "continue needs a <bundle_dir>"
fi

if [ "$verb" = save ] && [ -z "$out_dir" ]; then
  usage "save needs an <out_dir>"
fi

if [ "$verb" = restore ]; then
  [ "$resume_given" -eq 1 ] || usage "restore needs --resume"
  case "$resume" in
    none|answer|pause) ;;
    *) usage "unknown --resume '$resume'" ;;
  esac
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

# setup_fail <message> — a configuration problem: exit 1, except for save.
setup_fail() {
  echo "remote-run.sh: $1" >&2
  [ "$verb" != save ] || exit "$EXIT_OK"
  exit "$EXIT_USAGE"
}

if [ -n "$repo_arg" ]; then
  root=$(hr_repo_root "$repo_arg") || setup_fail "'$repo_arg' is not a git repository"
elif [ "$verb" = restore ] || [ "$verb" = save ] || [ "$verb" = continue ] || [ "$verb" = poll ] \
  || [ "$verb" = pause-requested ] || [ "$verb" = run-created-at ]; then
  root=$(hr_repo_root "${PWD-.}") || setup_fail "'${PWD-.}' is not inside a git repository"
else
  root=$(hr_main_repo "${PWD-.}") || setup_fail "'${PWD-.}' is not inside a git repository"
fi

hr_config_load "$root" || :
registry=""
case "$verb" in
  restore|save|continue|poll)
    hr_state_path "$root" >/dev/null || setup_fail "cannot resolve '$root/harness.config.json'"
    ;;
  pause-requested|run-created-at)
    # Read verbs: no gate, and nothing of the configuration is read.
    ;;
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

# Resolved against the caller's directory before the `cd` below.
case "$bundle_dir" in
  ''|/*) ;;
  *) bundle_dir="${PWD-.}/$bundle_dir" ;;
esac

cd "$root" || setup_fail "cannot enter '$root'"

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

  gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" --json databaseId,displayTitle,status --limit 100 || gh_fail "listing the runs of '$branch' failed"
  ids=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness run $branch" '.[] | select(.displayTitle == $t and (.status == "queued" or .status == "in_progress" or .status == "waiting")) | .databaseId' 2>/dev/null) || {
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

restore_fail() {
  echo "remote-run.sh: $1" >&2
  exit "$EXIT_USAGE"
}

restore_refuse() {
  echo "remote-run.sh: refused: $1" >&2
  exit "$EXIT_REFUSED"
}

# previous_bundle_run — the id of the newest finished `harness run <branch>`
# run, other than this job's own, carrying a state artifact; empty when none.
previous_bundle_run() {
  local ids id
  gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" \
    --json databaseId,displayTitle,status,createdAt --limit "$RUN_LIST_LIMIT" \
    || gh_fail "listing the runs of '$branch' failed"
  ids=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness run $branch" --arg self "${GITHUB_RUN_ID-}" '
    [.[] | select(.displayTitle == $t and .status == "completed" and (.databaseId | tostring) != $self)]
    | sort_by([.createdAt, .databaseId]) | reverse | .[].databaseId | tostring' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    gh_fail "listing the runs of '$branch' failed"
  }
  for id in $ids; do
    if has_bundle "$id"; then
      printf '%s\n' "$id"
      return 0
    fi
  done
  return 0
}

# The answers input: an object of positive-integer keys to strings, read from
# the environment by jq itself (`env`, jq 1.5) so no shell word ever holds it.
ANSWERS_SHAPE='env.HARNESS_INPUT_ANSWERS | fromjson
  | type == "object" and length > 0
    and all(to_entries[]; (.value | type) == "string"
      and (.key | explode | length > 0 and .[0] != 48 and all(.[]; . >= 48 and . <= 57)))'

verb_restore() {
  local id download status_file clar n tmp status_source
  if [ "$resume" = answer ]; then
    HARNESS_INPUT_ANSWERS="${HARNESS_INPUT_ANSWERS-}"
    export HARNESS_INPUT_ANSWERS
    jq -n -e "$ANSWERS_SHAPE" >/dev/null 2>&1 \
      || restore_refuse "HARNESS_INPUT_ANSWERS is not an object of positive-integer keys to strings; nothing written"
  fi

  id=$(previous_bundle_run)
  [ "$?" -eq 0 ] || exit "$EXIT_GH"
  hr_remote_names_var
  if [ -z "$id" ]; then
    [ "$resume" != answer ] \
      || restore_refuse "--resume answer, but no finished run of $branch carries a state bundle; nothing written"
    echo "remote-run.sh: no previous bundle for $branch; this is its first job"
  else
    download=$(hr_state_path "$root" "autonomous_logs/remote_download/$branch/$id") \
      || restore_fail "cannot resolve '$root/harness.config.json'"
    status_file="$download/$HR_REMOTE_STATUS_FILE"
    if [ ! -f "$status_file" ]; then
      mkdir -p "$download" || restore_fail "cannot create '$download'"
      gh_call run download "$id" -n "$STATE_ARTIFACT_NAME" -D "$download" || gh_fail "downloading the bundle of run $id failed"
    fi
    hr_remote_bundle_restore "$download" "$root" "$branch" job
    case $? in
      0) echo "remote-run.sh: restored the bundle of run $id into $root" ;;
      2) restore_refuse "the bundle in '$download' is unrecognised for $branch; nothing restored" ;;
      *) restore_fail "restoring '$download' into '$root' failed" ;;
    esac
  fi

  if [ "$resume" = answer ]; then
    clar=$(hr_state_path "$root" "$HR_REMOTE_CLARIFY_DIR/$branch") \
      || restore_fail "cannot resolve '$root/harness.config.json'"
    # Every entry is checked before any is written.
    for n in $(jq -n -r 'env.HARNESS_INPUT_ANSWERS | fromjson | keys_unsorted[]'); do
      [ -f "$clar/question_$n.md" ] \
        || restore_refuse "answer $n has no '$clar/question_$n.md'; no answer written"
    done
    for n in $(jq -n -r 'env.HARNESS_INPUT_ANSWERS | fromjson | keys_unsorted[]'); do
      tmp=$(mktemp "$clar/answer_$n.md.tmp.XXXXXX") || restore_fail "cannot write in '$clar'"
      if jq -n -j --arg k "$n" 'env.HARNESS_INPUT_ANSWERS | fromjson | .[$k]' >"$tmp" \
        && mv "$tmp" "$clar/answer_$n.md"; then
        echo "remote-run.sh: wrote answer_$n.md for $branch"
      else
        rm -f "$tmp"
        restore_fail "writing '$clar/answer_$n.md' failed"
      fi
    done
  fi

  if [ "${HARNESS_INPUT_PARK_LOOP_CLEAR-}" = true ]; then
    status_source=$(hr_state_path "$root" "$HR_REMOTE_STATUS_SOURCE") \
      || restore_fail "cannot resolve '$root/harness.config.json'"
    if [ -f "$status_source" ]; then
      tmp=$(mktemp "$status_source.tmp.XXXXXX") || restore_fail "cannot write beside '$status_source'"
      if jq '.park_loop_cycles = "0"' "$status_source" >"$tmp" && mv "$tmp" "$status_source"; then
        echo "remote-run.sh: cleared park_loop_cycles for $branch"
      else
        rm -f "$tmp"
        restore_fail "clearing park_loop_cycles in '$status_source' failed"
      fi
    else
      echo "remote-run.sh: park_loop_clear given, but no restored status to clear for $branch"
    fi
  fi
}

# md_cell <text> — one Markdown table cell: pipes escaped, line breaks flattened.
md_cell() {
  local s="${1-}"
  s=${s//$'\r'/ }
  s=${s//$'\n'/ }
  printf '%s' "${s//|/\\|}"
}

verb_save() {
  local registry_file status_source status decision detail
  hr_remote_names_var
  registry_file=$(hr_state_path "$root" autonomous_logs/registry.json) || {
    echo "remote-run.sh: save: cannot resolve '$root/harness.config.json'; no bundle written" >&2
    return 0
  }
  status_source=$(hr_state_path "$root" "$HR_REMOTE_STATUS_SOURCE") || status_source=""
  # Without either file the harness step never started; the library's registry
  # fallback would create a registry in the checkout to find nothing in it.
  if [ ! -f "$status_source" ] && [ ! -f "$registry_file" ]; then
    mkdir -p "$out_dir" 2>/dev/null \
      || echo "remote-run.sh: save: cannot create '$out_dir'" >&2
    echo "remote-run.sh: save: the harness step never started for $branch; the bundle carries no status.json" >&2
  else
    hr_remote_bundle_write "$root" "$branch" "$registry_file" "$out_dir"
    case $? in
      0) echo "remote-run.sh: saved the bundle of $branch into $out_dir" ;;
      2) echo "remote-run.sh: save: cannot resolve '$root/harness.config.json'; no bundle written" >&2 ;;
      *)
        if [ -f "$status_source" ]; then
          echo "remote-run.sh: save: assembling the bundle in '$out_dir' failed (not empty, or a copy failed)" >&2
        else
          echo "remote-run.sh: save: no status for $branch in '$registry_file'; the bundle carries no status.json" >&2
        fi
        ;;
    esac
  fi

  [ -n "${GITHUB_STEP_SUMMARY-}" ] || return 0
  if [ -f "$out_dir/$HR_REMOTE_STATUS_FILE" ]; then
    status=$(hr_remote_status_get "$out_dir/$HR_REMOTE_STATUS_FILE" status) || status=""
    decision=$(hr_remote_status_get "$out_dir/$HR_REMOTE_STATUS_FILE" decision) || decision=""
    detail=$(hr_remote_status_get "$out_dir/$HR_REMOTE_STATUS_FILE" detail) || detail=""
    printf '%s\n' "### harness run $(md_cell "$branch")" "" "| status | decision | detail |" "|---|---|---|" \
      "| $(md_cell "$status") | $(md_cell "$decision") | $(md_cell "$detail") |" "" >>"$GITHUB_STEP_SUMMARY" \
      || echo "remote-run.sh: save: cannot append to GITHUB_STEP_SUMMARY" >&2
  else
    printf '%s\n' "### harness run $(md_cell "$branch")" "" "No status.json: the harness step never started." "" >>"$GITHUB_STEP_SUMMARY" \
      || echo "remote-run.sh: save: cannot append to GITHUB_STEP_SUMMARY" >&2
  fi
  return 0
}

# notify <event> <branch> <detail> — one lifecycle notification; never fails.
notify() {
  if [ -n "${HARNESS_REMOTE_SLUG-}" ]; then
    HARNESS_REPO_SLUG="$HARNESS_REMOTE_SLUG"
    export HARNESS_REPO_SLUG
  fi
  bash "$script_dir/autonomous-notify.sh" "$1" "$2" "" "$3" \
    || echo "remote-run.sh: the $1 notification for $2 could not be sent" >&2
  echo "remote-run.sh: notified $1 for $2: $3"
}

this_run_url() {
  if [ -n "${GITHUB_RUN_ID-}" ] && [ -n "${GITHUB_SERVER_URL-}" ] && [ -n "${GITHUB_REPOSITORY-}" ]; then
    printf '%s' "${GITHUB_SERVER_URL%/}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
  else
    printf 'run %s' "${GITHUB_RUN_ID:-(unknown)}"
  fi
}

# max_chain_var — MAX_CHAIN from HARNESS_MAX_CHAIN; 1 when it is not a
# non-negative integer.
MAX_CHAIN=""
max_chain_var() {
  MAX_CHAIN="${HARNESS_MAX_CHAIN:-$MAX_CHAIN_DEFAULT}"
  case "$MAX_CHAIN" in
    ''|*[!0-9]*) return 1 ;;
  esac
  return 0
}

# ALL_RUNS — every branch's runs of the workflow, newest first and bounded,
# listed once per invocation. 1 with GH_ERR set when the listing failed.
ALL_RUNS=""
ALL_RUNS_LISTED=0
list_all_runs() {
  [ "$ALL_RUNS_LISTED" -eq 0 ] || return 0
  gh_call run list --workflow "$WORKFLOW_RUN_FILE" \
    --json databaseId,headBranch,displayTitle,status,createdAt --limit "$ALL_RUNS_LIMIT" || return 1
  printf '%s' "$GH_OUT" | jq -e 'type == "array"' >/dev/null 2>&1 || {
    GH_ERR="its run list is not the expected JSON"
    return 1
  }
  ALL_RUNS="$GH_OUT"
  ALL_RUNS_LISTED=1
}

# remote_branch_stopped <branch> — 0 stopped (its newest `harness stop` run is
# newer than its newest `harness run` run), 1 not stopped, 2 the listing failed.
remote_branch_stopped() {
  local verdict
  list_all_runs || return 2
  verdict=$(printf '%s' "$ALL_RUNS" | jq -r --arg s "harness stop $1" --arg r "harness run $1" '
    ([.[] | select(.displayTitle == $s) | .createdAt // ""] | max // "") as $stop
    | ([.[] | select(.displayTitle == $r) | .createdAt // ""] | max // "") as $run
    | if $stop != "" and $stop > $run then "stopped" else "not" end' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    return 2
  }
  [ "$verdict" = stopped ]
}

# redispatch <engine> <chain> — `dispatch <branch> --engine <engine> --resume
# pause --chain <chain>` for the global branch, in a subshell so dispatch's own
# exits stay its own. On failure REDISPATCH_ERR holds its first stderr line.
REDISPATCH_ERR=""
redispatch() {
  local errfile status
  REDISPATCH_ERR=""
  errfile=$(mktemp) || { REDISPATCH_ERR="mktemp failed"; return 1; }
  (
    engine="$1"; resume=pause; chain="$2"
    answers_from=""; indexes=""; indexes_given=0; park_loop_clear=0
    verb_dispatch
  ) 2>"$errfile"
  status=$?
  if [ "$status" -ne 0 ]; then
    IFS= read -r REDISPATCH_ERR <"$errfile" || :
    [ -n "$REDISPATCH_ERR" ] || REDISPATCH_ERR="dispatch exited $status"
  fi
  cat "$errfile" >&2
  rm -f "$errfile"
  return "$status"
}

# next_chain_var <status_json> — NEXT_CHAIN is the bundle's `chain` + 1.
# 1: the chain is unreadable; 2: NEXT_CHAIN is over MAX_CHAIN.
NEXT_CHAIN=""
next_chain_var() {
  local current
  NEXT_CHAIN=""
  current=$(hr_remote_status_get "$1" chain) || return 1
  case "$current" in
    ''|*[!0-9]*) return 1 ;;
  esac
  NEXT_CHAIN=$((10#$current + 1))
  [ "$NEXT_CHAIN" -le "$((10#$MAX_CHAIN))" ] || return 2
}

valid_engine() {
  case "${1-}" in
    task|user_review|docs) return 0 ;;
  esac
  return 1
}

STOPPED_LINE="a 'harness stop' run is newer than its newest 'harness run' run"
RESUME_HINT="/autonomous-sdlc-harness:branch-resume"

continue_redispatch() {
  local status_file="$1" engine_value
  if [ -n "${HARNESS_REMOTE_STOP-}" ]; then
    notify paused "$branch" "Not re-dispatched: remote stop is set. Run $RESUME_HINT $branch to continue."
    return 0
  fi
  remote_branch_stopped "$branch"
  case $? in
    0) echo "remote-run.sh: $branch is stopped ($STOPPED_LINE); not re-dispatched"; return 0 ;;
    2) notify paused "$branch" "Not re-dispatched: the stop-marker check failed ($GH_ERR). Run $RESUME_HINT $branch to continue."; return 0 ;;
  esac
  if ! max_chain_var; then
    notify failed "$branch" "Not re-dispatched: HARNESS_MAX_CHAIN '$MAX_CHAIN' is not a non-negative integer."
    return 0
  fi
  next_chain_var "$status_file"
  case $? in
    1) notify failed "$branch" "Not re-dispatched: chain unreadable in status.json."; return 0 ;;
    2) notify failed "$branch" "Not re-dispatched: chain limit reached ($NEXT_CHAIN over HARNESS_MAX_CHAIN $MAX_CHAIN)."; return 0 ;;
  esac
  engine_value=$(hr_remote_status_get "$status_file" engine) || engine_value=""
  if ! valid_engine "$engine_value"; then
    notify failed "$branch" "Not re-dispatched: engine '$engine_value' in status.json is not task, user_review or docs."
    return 0
  fi
  redispatch "$engine_value" "$NEXT_CHAIN" \
    || notify paused "$branch" "Re-dispatch failed ($REDISPATCH_ERR). Run $RESUME_HINT $branch to continue."
}

continue_wait_poller() {
  remote_branch_stopped "$branch"
  case $? in
    0) echo "remote-run.sh: $branch is stopped ($STOPPED_LINE); the resume poller is not enabled"; return 0 ;;
    2) notify paused "$branch" "Auto-resume not enabled: the stop-marker check failed ($GH_ERR). Run $RESUME_HINT $branch to continue."; return 0 ;;
  esac
  if gh_call workflow enable "$WORKFLOW_RESUME_FILE"; then
    echo "remote-run.sh: enabled $WORKFLOW_RESUME_FILE for $branch"
  else
    notify paused "$branch" "Auto-resume is unavailable: enabling $WORKFLOW_RESUME_FILE failed ($GH_ERR). Run $RESUME_HINT $branch after the usage reset."
  fi
}

verb_continue() {
  local status_file decision
  hr_remote_names_var
  status_file="$bundle_dir/$HR_REMOTE_STATUS_FILE"
  if [ ! -f "$status_file" ]; then
    notify failed "$branch" "The job stopped before the harness run started: $(this_run_url)"
    return 0
  fi
  decision=$(hr_remote_status_get "$status_file" decision) || decision=""
  case "$decision" in
    continue) continue_redispatch "$status_file" ;;
    wait-poller) continue_wait_poller ;;
    stop) echo "remote-run.sh: decision stop for $branch; nothing to do" ;;
    *) notify failed "$branch" "Not re-dispatched: status.json carries no recognised decision: $(this_run_url)" ;;
  esac
  return 0
}

# poll_branch <run_id> <state> — one branch's newest `harness run` run; the
# global branch names it. Returns 0 when the branch is still waiting.
poll_branch() {
  local id="$1" state="$2" download status_file status reason at engine_value now
  remote_branch_stopped "$branch"
  case $? in
    0) echo "remote-run.sh: poll: $branch is stopped ($STOPPED_LINE); skipped"; return 1 ;;
    2) echo "remote-run.sh: poll: the stop-marker check for $branch failed ($GH_ERR); skipped"; return 1 ;;
  esac
  [ "$state" = completed ] || return 1
  download=$(hr_state_path "$root" "autonomous_logs/remote_download/$branch/$id") || {
    echo "remote-run.sh: poll: cannot resolve '$root/harness.config.json'; $branch skipped" >&2
    return 1
  }
  status_file="$download/$HR_REMOTE_STATUS_FILE"
  if [ ! -f "$status_file" ]; then
    if ! mkdir -p "$download"; then
      echo "remote-run.sh: poll: cannot create '$download'; $branch skipped" >&2
      return 1
    fi
    if ! gh_call run download "$id" -n "$STATE_ARTIFACT_NAME" -D "$download"; then
      echo "remote-run.sh: poll: the bundle of run $id ($branch) cannot be downloaded; skipped: $GH_ERR"
      return 1
    fi
  fi
  status=$(hr_remote_status_get "$status_file" status) || status=""
  reason=$(hr_remote_status_get "$status_file" pause_reason) || reason=""
  at=$(hr_remote_status_get "$status_file" usage_resume_at) || at=""
  [ "$status" = paused ] && [ "$reason" = usage ] || return 1
  case "$at" in
    ''|*[!0-9]*) echo "remote-run.sh: poll: $branch is usage-paused with no readable usage_resume_at; skipped"; return 1 ;;
  esac
  now=$(date +%s)
  if [ "$((10#$at))" -gt "$now" ]; then
    echo "remote-run.sh: poll: $branch waits for its usage reset at $at"
    return 0
  fi
  next_chain_var "$status_file"
  case $? in
    1) notify failed "$branch" "Not resumed by the poller: chain unreadable in status.json."; return 1 ;;
    2) notify failed "$branch" "Not resumed by the poller: chain limit reached ($NEXT_CHAIN over HARNESS_MAX_CHAIN $MAX_CHAIN)."; return 1 ;;
  esac
  engine_value=$(hr_remote_status_get "$status_file" engine) || engine_value=""
  if ! valid_engine "$engine_value"; then
    notify failed "$branch" "Not resumed by the poller: engine '$engine_value' in status.json is not task, user_review or docs."
    return 1
  fi
  if redispatch "$engine_value" "$NEXT_CHAIN"; then
    echo "remote-run.sh: poll: dispatched $branch --resume pause --chain $NEXT_CHAIN"
    return 1
  fi
  echo "remote-run.sh: poll: dispatching $branch failed ($REDISPATCH_ERR); still waiting"
  return 0
}

verb_poll() {
  local entries b id state waiting=0
  if [ -n "${HARNESS_REMOTE_STOP-}" ]; then
    echo "remote-run.sh: poll: remote stop is set; nothing dispatched"
    return 0
  fi
  if ! max_chain_var; then
    echo "remote-run.sh: poll: HARNESS_MAX_CHAIN '$MAX_CHAIN' is not a non-negative integer; nothing dispatched" >&2
    exit "$EXIT_USAGE"
  fi
  hr_remote_names_var
  list_all_runs || gh_fail "listing the runs of $WORKFLOW_RUN_FILE failed"
  entries=$(printf '%s' "$ALL_RUNS" | jq -r '
    [.[] | select((.displayTitle // "") | startswith("harness run "))]
    | group_by(.displayTitle)
    | map(sort_by([.createdAt, .databaseId]) | last)
    | .[] | [(.displayTitle | ltrimstr("harness run ")), (.databaseId | tostring), (.status // "")] | @tsv' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    gh_fail "listing the runs of $WORKFLOW_RUN_FILE failed"
  }
  while IFS=$'\t' read -r b id state; do
    valid_branch "$b" || continue
    branch="$b"
    if poll_branch "$id" "$state"; then
      waiting=$((waiting + 1))
    fi
  done <<EOF
$entries
EOF
  if [ "$waiting" -gt 0 ]; then
    echo "remote-run.sh: poll: $waiting branch(es) still waiting; $WORKFLOW_RESUME_FILE stays enabled"
    return 0
  fi
  gh_call workflow disable "$WORKFLOW_RESUME_FILE" || gh_fail "disabling $WORKFLOW_RESUME_FILE failed"
  echo "remote-run.sh: poll: no branch is waiting; disabled $WORKFLOW_RESUME_FILE"
}

verb_pause_requested() {
  local found
  list_runs
  # An unparseable createdAt is no match rather than a failed read.
  found=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness pause $branch" --argjson since "$since_arg" '
    [.[] | select(.displayTitle == $t)
      | ((.createdAt // "") | try fromdateiso8601 catch null)
      | select(. != null and . >= $since)] | length' 2>/dev/null)
  case "$found" in
    ''|*[!0-9]*)
      GH_ERR="its run list is not the expected JSON"
      gh_fail "listing the runs of '$branch' failed"
      ;;
  esac
  if [ "$found" -gt 0 ]; then
    echo "remote-run.sh: a 'harness pause $branch' run was created at or after $since_arg"
    return 0
  fi
  echo "remote-run.sh: no 'harness pause $branch' run was created at or after $since_arg"
  exit "$EXIT_NO_PAUSE"
}

verb_run_created_at() {
  local epoch
  gh_call run view "$run_id_arg" --json createdAt || gh_fail "reading run $run_id_arg failed"
  epoch=$(printf '%s' "$GH_OUT" | jq -r '.createdAt | fromdateiso8601 | floor' 2>/dev/null)
  case "$epoch" in
    ''|*[!0-9]*)
      GH_ERR="its createdAt is not an ISO 8601 UTC time"
      gh_fail "reading run $run_id_arg failed"
      ;;
  esac
  printf '%s\n' "$epoch"
}

case "$verb" in
  dispatch) verb_dispatch ;;
  pause) verb_pause ;;
  warm) verb_warm ;;
  stop) verb_stop ;;
  status) verb_status ;;
  sync) verb_sync ;;
  restore) verb_restore ;;
  save) verb_save ;;
  continue) verb_continue ;;
  poll) verb_poll ;;
  pause-requested) verb_pause_requested ;;
  run-created-at) verb_run_created_at ;;
esac
exit "$EXIT_OK"
