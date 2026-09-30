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
#   remote-run.sh start <branch> --prompt-file <file> [--repo <root>]
#   remote-run.sh trigger [--repo <root>]   (its own exit map: its paragraph)
#   remote-run.sh adopt [--list] [--repo <root>]
#     0  sent (for stop: the action=stop marker was dispatched, and every
#        queued, waiting or in-progress `harness run` run of that branch was
#        asked to cancel, or there was none); for status: printed; for sync: the record is
#        current (including "no run listed yet", which writes nothing); for
#        restore: restored, or no previous bundle (or an expired one, with a
#        `::warning::` line) under --resume none|pause;
#        for save: ALWAYS, whatever happened; for continue: whatever it
#        decided — every outcome a person must act on is a notification; for
#        poll: the tick finished; for pause-requested: such a run exists; for
#        run-created-at: printed; for adopt: every candidate adopted, or none;
#        for adopt --list: printed
#     1  usage error, or the library or the configuration could not be
#        resolved; for sync and restore, a local copy or write failed; for
#        pause-requested, also NO such run — a caller that reads 1 as "no
#        pause" passes arguments it has already validated
#     2  refused, nothing sent or written: execution.target is not
#        github-actions (sending verbs and adopt); the branch's local record does not
#        carry `execution: github-actions` (status, sync); the record's mirror
#        working copy is missing, or a downloaded bundle is unrecognised
#        (sync, restore); the inputs payload is over the limit; a named answer
#        file is missing. For restore under --resume answer, "nothing more":
#        no previous bundle, the previous bundle expired (the message names
#        its expiry and the resume command), `HARNESS_INPUT_ANSWERS` not an object of
#        positive-integer keys to strings, or an answer whose `question_<n>.md`
#        is not at the top level of the previous bundle — nothing is restored
#        and no answer is written
#     3  gh failed: not found, or a non-zero exit — the first line of gh's
#        stderr is named. For poll: the listing or the disable failed. For
#        pause-requested and run-created-at, also an answer that is not the
#        expected JSON; a caller never pauses on a failed read. For start, the
#        dispatch failed AFTER the branch and its task prompt were pushed. For
#        adopt (and --list), the listing or `git ls-remote` failed; nothing
#        written
#     4  start: placement failed — the branch cut, the copy, the commit or the
#        push — and nothing was dispatched. adopt: at least one candidate was
#        not adopted (each named by a `could not adopt` line); the others were
#
# `start` IS THE ADAPTERS' ONE ENTRY: every trigger (an issue event, a forge
# dispatch, anything later) reduces to a branch and a task text and ends here.
# In order, stopping at the first failure: refuse a protected branch (2); refuse
# a prompt file that is not a readable regular file (2); cut the branch from
# `origin/<defaultBranch>` with `create-worktree.sh --no-bootstrap`; place the
# file at `<state_dir>/task_prompts/<branch>_task_prompt.md` in that working
# copy (the state directory resolved there, never in the main checkout), commit
# it as `chore: add task prompt for <branch>` and confirm `origin/<branch>`
# equals `HEAD` (each failure 4); then `dispatch --engine task --resume none
# --chain 0`, composed by `verb_dispatch` itself. The placement is the library's
# (`hr_task_prompt_rel`, `hr_place_artifact`, `hr_commit_placed`,
# `hr_push_landed`), the same calls the watcher's inbox pass makes, so nothing
# downstream can tell where a task came from. It writes no registry record: a
# trigger job has no registry, and a local record for such a run is `adopt`'s.
#
# `adopt` MAKES A RUN STARTED ON GITHUB LOCAL. The local commands work on a
# registry record and a mirror working copy, and a run no local watcher
# dispatched — a trigger's, or another machine's — has neither. `adopt` reads
# one bounded listing of the run workflow (`ALL_RUNS_LIMIT`, the listing the
# stop marker reads) and takes each branch's newest run titled exactly `harness
# run <branch>`, newest first — never a `pause`, `stop` or `warm` title. It
# drops a branch that already has a registry record (that run is already
# local), one `hr_branch_is_protected` does not answer 1 for (a run never
# works on one, and an unjudgeable one is not adopted), and one that is not a
# live head in one `git ls-remote --heads origin` (a merged-and-deleted branch
# is not worth a working copy). For each candidate, in order, one failure never
# stopping the next: `create-worktree.sh --existing` (it never pushes), then
# `hr_remote_record_init` with engine `task`, `status: running` and
# `remote_adopted_at` in one write, then this script's own `sync`, then the
# record's `engine` from the synced bundle's `status.json` when it names a valid
# one. It runs only on request — never from the watcher's tick, because nothing
# flows from GitHub to this machine unless the user asks, and a tick-time adopt
# would spend a listing on every poll. The registry is tested with `-f` before
# any read, because `hr_registry_get` creates an absent one; `--list` prints
# `not adopted: <branch> <url>` per candidate and writes nothing.
#
# `trigger` IS THE GITHUB EVENT ADAPTER, the one step of the trigger
# workflow's job: event -> (branch, task text) -> `start`. It handles
# `GITHUB_EVENT_NAME` `issues` and `repository_dispatch`; any other name, or an
# event file it cannot read, exits 1. Like `restore` it acts on `hr_repo_root` of the working
# directory, and it takes no part in the sending-verb gate: it gates itself, so
# a refusal can still be commented. It reads, only from the environment:
#   GITHUB_EVENT_NAME, GITHUB_EVENT_PATH   the event; each field is read by `jq`
#                        into a variable and is only ever an argument or file
#                        bytes, never shell source
#   GITHUB_REPOSITORY, GITHUB_SERVER_URL, GITHUB_RUN_ID   the `gh` target and
#                        the URLs its comments name
#   HARNESS_REMOTE_STOP  non-empty: every start is refused
#   HARNESS_TRIGGER_LABEL   the trigger label; `DEFAULT_TRIGGER_LABEL` when empty
#   HARNESS_TRIGGER_ALLOWED_BOTS   comma-separated bot logins allowed to start
#   HARNESS_TRIGGER_LOOKUP_SECS    seconds between run lookups; `5` when empty.
#                        A test seam
#   RUNNER_TEMP          where the prompt snapshot is written; a `mktemp -d`
#                        directory when empty
# An `action` other than `labeled`, or another label, is one line and exit 0
# with no `gh` call. Otherwise refused, in this order, each refusal one issue
# comment naming the reason and the way on:
#   1. `HARNESS_REMOTE_STOP` is set
#   2. `hr_forge` is not `github` or `hr_execution_target` is not
#      `github-actions` — before any authorisation, so a disabled trigger asks
#      GitHub nothing about the labeller
#   3. the issue is not `open`
#   4. `sender.login` is `ghost` (GitHub's placeholder for a deleted account),
#      empty, or not a login shape (`^[A-Za-z0-9][A-Za-z0-9-]*$`, plus `[bot]`
#      for a `Bot`)
#   5. `sender.type` is not `User` and the login is not an exact entry of
#      `HARNESS_TRIGGER_ALLOWED_BOTS` — checked by the listing alone, with no
#      permission call, because the permission API answers `none` or 404 for a bot
#   6. a `User` whose `collaborators/<login>/permission` is not `admin` or
#      `write` — `maintain` reads as `write` and `triage` as `read` there; a
#      failed call is "could not confirm write access", never a pass
# Then it fetches `origin <defaultBranch>` (a failure tolerated), derives the
# branch with `hr_derive_branch <title> issue_<number>` (2 or 3 refused), writes
# the snapshot — `# <title>`, the body's bytes, `---` and a provenance sentence
# naming the issue, the labeller, the label and the time — and runs `start` as a
# child. After a start it looks up the `harness run <branch>` run, at most
# `TRIGGER_RUN_LOOKUP_TRIES` times, falling back to the branch's filtered run
# list, and comments the branch and that URL. Every comment is followed by
# removing the label, so re-applying it is deliberate; a removal that fails is
# one `::warning::` line.
# A `repository_dispatch` reads `.action` (where GitHub puts the `event_type`)
# and `client_payload`'s `title`, `body` and `source`, the contract being
#   {"event_type": TRIGGER_DISPATCH_EVENT_TYPE, "client_payload": {"title": …,
#    "body": …, "source": …}}
# within GitHub's `client_payload` limits: at most 10 top-level properties and
# under 64 KB, so a longer task text does not fit. Another `.action` is one line
# and exit 0 with no `gh` call; an empty or missing `title` is refused. It has
# no labeller: GitHub sends one only for a fine-grained token with Contents
# write or a classic token with `repo`, so the token holder is the authority,
# and refusals 3 to 6 do not apply. The fallback name is `task_<GITHUB_RUN_ID>`
# and the snapshot's provenance sentence names the event type, `source` when
# set, and the time. There is no issue, so no comment and no label: every
# outcome is printed to stdout and appended as a Markdown block to
# `GITHUB_STEP_SUMMARY` when that is set, an append failure one `::warning::`.
#     0  started (commented), or ignored
#     1  not an `issues` or `repository_dispatch` event, or the event could not
#        be read
#     2  refused (commented)
#     3  a `gh` step after the decision failed: the comment could not be posted
#        (an `::error::` line; issues only), or `start` pushed the branch but
#        its dispatch failed (commented with the manual Run-workflow way on)
#     4  `start` refused or failed its placement (commented)
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
# other than `GITHUB_RUN_ID`, carrying a `harness-state` artifact — walking
# past a run with none, and stopping at one whose artifact has expired, since
# an older copy would be staler state. An expired one restores nothing: under
# --resume answer it exits 2; otherwise it prints a `::warning::` line naming
# the run, the expiry and the lost counts, clarification history and
# uncommitted planning drafts, and the job continues from the committed ledger. An unexpired one it downloads to `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/`
# (skipped when that directory already holds its status.json); and restores it
# in `job` mode — on every --resume kind, `none` included, because a reused
# branch keeps its clarification history. A job-mode restore also places the
# bundle's `planning/` drafts at their paths under the state directory, never
# over a file the checkout already has, and when it placed or kept any prints
# `placed <n> planning file(s) for <branch>; kept <n> the checkout already
# carries`. Then, under --resume answer, it
# writes each `"<n>": "<text>"` entry to `clarifications/<branch>/answer_<n>.md`
# with the exact bytes, after checking every entry first; and with
# `HARNESS_INPUT_PARK_LOOP_CLEAR` exactly `true` it sets `park_loop_cycles` to
# "0" in the restored `autonomous_logs/remote_status.json`. No bundle in any
# run is an ordinary first job (exit 0, one line) except under --resume answer.
#
# `save` WRAPS `hr_remote_bundle_write` into <out_dir>, and with
# `GITHUB_STEP_SUMMARY` set appends a Markdown table of the bundle's `status`,
# `decision` and `detail`. With no `autonomous_logs/remote_status.json` and no
# registry file the harness step never started: <out_dir> is created empty,
# with no status.json — what `continue` reads as "never started". A
# `remote_status.json` whose `run_id` is not `GITHUB_RUN_ID` is the previous
# job's copy that `restore` placed. This job's harness step never wrote its
# own, so `save` moves it aside to `remote_status.json.previous` and decides as
# if it were absent. It never
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
#   HARNESS_POLL_MAX_DISPATCH_FAILURES   `poll` only: failed re-dispatches of
#                        one paused run before it gives up; `3` when empty
#   HARNESS_POLL_GIVE_UP_AFTER_MINUTES   `poll` only: minutes after a run's
#                        `usage_resume_at` past which a failed re-dispatch gives
#                        up; `360` when empty. Either one not a non-negative
#                        integer: nothing is dispatched
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
# `poll` FIRST CARRIES ITS STATE: the newest run of `WORKFLOW_RESUME_FILE` other
# than `GITHUB_RUN_ID` (bounded) carrying an unexpired `harness-poll-state`
# artifact is downloaded to `<state_dir>/autonomous_logs/poll_state/previous/`;
# any failure to find or read it is one line and an empty state. Its
# `poll_state.json` is {"<branch>": {"run_id", "failures", "notified"}}; an
# entry whose `run_id` is not the branch's newest `harness run` run is dropped,
# so a new run restarts the count. `poll` writes the state to `poll_state/
# current/` on every exit, `HARNESS_REMOTE_STOP` included, and the poller
# uploads that directory.
#
# `poll`: `HARNESS_REMOTE_STOP` set exits 0 with nothing sent. Otherwise one
# listing; each branch's newest `harness run <branch>` run decides. A run not
# yet `completed` is never dispatched (its own `continue` will decide): with no
# `harness-state` artifact it is skipped, not waiting; with one whose bundle
# says `status: paused` / `pause_reason: usage` it is waiting, because the job
# uploads before its `continue` step enables the poller; an artifact lookup or
# download that fails for it is one line and waiting. For a `completed` run,
# skipped, not waiting: a stopped branch, a bundle that cannot be downloaded
# (one line), and anything but `status: paused` / `pause_reason: usage` with an
# integer `usage_resume_at`, and a run whose state entry says `notified`. Due
# (reset passed): re-dispatched under the same chain limit — a refusal is one
# `failed` and not waiting; a success drops the branch's state entry. A
# dispatch that fails counts one more failure for that run and is still
# waiting, until the count reaches `HARNESS_POLL_MAX_DISPATCH_FAILURES` or the
# reset is over `HARNESS_POLL_GIVE_UP_AFTER_MINUTES` in the past: then exactly
# one `paused` naming the dispatch error and the resume command, the entry
# marked `notified`, and not waiting. Reset ahead: waiting. No branch waiting
# after the tick: `gh workflow disable WORKFLOW_RESUME_FILE`, then one fresh
# listing evaluated by the same rules with nothing sent or notified, skipping
# the branches this tick dispatched — a due run that would be dispatched counts
# as waiting there. A branch waiting now re-enables the poller, closing the
# window in which a finishing job enabled it before the disable; a re-listing
# that fails is one line and the poller stays disabled; a re-enable that fails
# is one `paused` per waiting branch. Bundles download to
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
# `status`, `pause_reason`, `remote_run_url` and `remote_synced_at`, whether
# a `harness run` finished after the last sync, and — reading the newest
# finished run's artifact list — a line naming its bundle's expiry and the
# way on when that bundle has expired.
#
# `sync` READS THE NEWEST `harness run <branch>` RUN. Any status but
# `completed` (queued, in_progress, waiting, requested, pending) sets the record
# `running` and downloads nothing. Otherwise that run — the newest finished one
# — decides, in exactly one of five cases, tested in this order:
#   1. its id is the record's `remote_run_id`: already applied. Only
#      `remote_synced_at` is written; nothing is downloaded or restored, so an
#      answer written into the mirror since the last sync survives — unless
#      the record is `parked`, `park_loop` or `paused` (not already `expired`)
#      and that run's bundle has expired since: then as case 2
#   2. its `harness-state` artifact is listed only as expired: `paused` /
#      `expired`, `remote_run_id` / `remote_run_url` at this run, and
#      `remote_detail` naming the expiry and the way on (resume from the
#      committed ledger, or re-drop the task); nothing restored. The mirror's
#      question files stay, but no job can take an answer to them
#   3. it carries an unexpired `harness-state` artifact: downloaded (skipped
#      when the download directory already holds its status.json), restored in
#      `mirror` mode into the record's `worktree`, `run.log` copied to the main
#      checkout's `autonomous_logs/<branch>.remote.log`, and `status`,
#      `pause_reason`, `usage_resume_at`, `park_loop_cycles`, `remote_run_id`,
#      `remote_run_url`, `remote_detail` and `remote_synced_at` written. A
#      `mirror` restore places no planning draft
#   4. no artifact, while some bundle exists (`remote_run_id` is set, or an
#      older finished run carries one): a job that died before its upload.
#      `paused` / `killed`, `remote_run_id` / `remote_run_url` re-pointed at
#      THIS run, nothing restored — so a later sync with no newer run is case 1
#   5. no bundle in any run and an empty `remote_run_id`: `failed`. Not
#      `paused`: with no bundle anywhere a pause resume has nothing to restore,
#      and re-dropping the artifact is the recovery
#
# THE `killed` AND `expired` MAPPINGS. A finished run whose bundle still says
# `running` (a kill, a timeout with no chain left) syncs as `status: paused`,
# `pause_reason: killed`; one whose bundle has expired syncs as `status:
# paused`, `pause_reason: expired`. Both are registry-only — `status.json`
# never carries either, because `sync` derives them from the run and its
# artifact list, never from a bundle. Both are `paused` rather than `failed`
# because a `failed` record has no resume path, while the ledger on the branch
# is intact and a resume continues from it.
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
# to `failed` in one `hr_registry_set` call; a partial stop leaves the record alone
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
# inbox, and never watches a run it sent. Only `start` pushes, and only through
# `create-worktree.sh` and `push-branch.sh`; its writes are the new working
# copy and the prompt committed in it. `trigger` writes its snapshot and comment
# files under `RUNNER_TEMP`, one comment on the issue and the label removal, or
# for a dispatch event a block in the step summary. Every other verb's only writes are the
# registry record (`stop`, `sync`) and, for `sync`, the download directory
# `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/` and
# `<branch>.remote.log` in the main checkout, plus the mirror restore
# `hr_remote_bundle_restore` performs in the record's `worktree`; for
# `restore`, that download directory, the job restore (the planning drafts
# among it), `answer_<n>.md` and the
# `park_loop_cycles` rewrite of `remote_status.json`, all in the job's
# checkout; for `save`, <out_dir> and the step summary; for `poll`, its
# download directories and `<state_dir>/autonomous_logs/poll_state/previous/`
# and `current/`; for `adopt`, per candidate the mirror `create-worktree.sh
# --existing` makes, the registry record, and whatever its `sync` writes.
# `pause-requested`, `run-created-at` and `adopt --list` write nothing.
#
# MIRRORS OF `cli/src/remote/githubActions.ts`, which owns these names; a
# rename there is an edit here, byte for byte:
#   WORKFLOW_RUN_FILE    mirrors  WORKFLOW_RUN_FILE
#   WORKFLOW_RESUME_FILE mirrors  WORKFLOW_RESUME_FILE
#   STATE_ARTIFACT_NAME  mirrors  STATE_ARTIFACT_NAME
#   POLL_STATE_ARTIFACT_NAME mirrors POLL_STATE_ARTIFACT_NAME
#   HARNESS_GH_CLI       mirrors  GH_CLI_VARIABLE (the binary run as `gh`)
#   HARNESS_TRIGGER_LABEL        mirrors  TRIGGER_LABEL_VARIABLE
#   DEFAULT_TRIGGER_LABEL        mirrors  DEFAULT_TRIGGER_LABEL
#   HARNESS_TRIGGER_ALLOWED_BOTS mirrors  TRIGGER_ALLOWED_BOTS_VARIABLE
#   TRIGGER_DISPATCH_EVENT_TYPE  mirrors  TRIGGER_DISPATCH_EVENT_TYPE ('harness-task')
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
#   start needs the adopted tree on origin's default branch (commit and push
#   it first) and a prompt file outside the checkout, say /tmp/p.md:
#   start      bash scripts/remote-run.sh start feat_x --prompt-file /tmp/p.md
#              -> 0; origin/feat_x gains `chore: add task prompt for feat_x`,
#                 then "$s.log" gains the same `workflow run` line as dispatch
#   protected  bash scripts/remote-run.sh start main --prompt-file /tmp/p.md
#              -> 2, log unchanged, nothing pushed
#   no prompt  bash scripts/remote-run.sh start feat_y --prompt-file /nonexistent
#              -> 2, log unchanged, nothing pushed
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
#              .flow_walker_state and autonomous_logs/remote_status.json, and
#              places the bundle's planning/ drafts where the checkout has none
#   answer     HARNESS_INPUT_ANSWERS='{"1":"Use B.\n"}' ... --resume answer -> 0;
#              clarifications/feat_x/answer_1.md holds exactly `Use B.` + newline
#   no question  HARNESS_INPUT_ANSWERS='{"2":"x"}' ... --resume answer
#              -> 2, no answer_2.md written
#   clear      HARNESS_INPUT_PARK_LOOP_CLEAR=true ... --resume none -> 0;
#              remote_status.json's park_loop_cycles is "0"
#   first job  a `run list` answer with no finished run: --resume none -> 0;
#              --resume answer -> 2
#   own run    GITHUB_RUN_ID=<the bundle run's id> -> that run is skipped
#   expired    the artifact list answering {"artifacts":[{"name":"harness-state",
#              "expired":true,"expires_at":"2026-01-02T00:00:00Z"}]}: --resume
#              pause -> 0, a `::warning::` line, no `run download`, no older
#              bundle restored; --resume answer -> 2, names the expiry and
#              branch-resume; sync -> the record is paused / expired; status
#              -> prints the expired line, "$r" byte-identical
#   save       bash scripts/remote-run.sh save feat_x /tmp/b -> 0; /tmp/b holds
#              status.json, clarifications/feat_x/, flow_walker_state (and
#              PAUSE_PROGRESS.md, run.log, planning/ when present); with
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
#   no dispatch  that due bundle with usage_resume_at a minute ago and a stub
#              failing `workflow run`: three ticks, each serving the previous
#              tick's poll_state/current/ as run <id>'s `harness-poll-state`
#              under `run list --workflow harness-resume.yml` -> ticks 1-2 no
#              notification, no disable; tick 3 one `paused` naming the error
#              and branch-resume, then `workflow disable harness-resume.yml`
#   interleave that due run plus an `in_progress` `harness run feat_y` run
#              with no artifact, and a stub that, once its log holds `workflow
#              disable`, lists `harness-state` for feat_y's run with a
#              paused / usage bundle -> the feat_x dispatch, `workflow disable`,
#              then `workflow enable harness-resume.yml`; no feat_y dispatch
#
#   the job's reads: a `run list` answer whose run has `displayTitle` `harness
#   pause feat_x` and `createdAt` `2026-01-01T00:00:10Z` (epoch 1767225610):
#   pause-requested  bash scripts/remote-run.sh pause-requested feat_x 1767225600
#              -> 0; with 1767225620 -> 1; a stub failing `run list` -> 3
#   run-created-at   a stub answering `run view 42 --json createdAt` with
#              {"createdAt":"2026-01-01T00:00:10Z"}: bash scripts/remote-run.sh
#              run-created-at 42 -> prints 1767225610, 0; a failing stub -> 3
#
#   trigger needs start's setup plus `"forge": "github"`, an event file e.json
#   {"action":"labeled","label":{"name":"harness"},"sender":{"login":"alice",
#   "type":"User"},"issue":{"number":7,"title":"Add comments","body":"x",
#   "html_url":"https://github.com/o/r/issues/7","state":"open"}}, and a stub
#   answering `api repos/o/r/collaborators/alice/permission` with
#   {"permission":"write"}; export GITHUB_EVENT_NAME=issues GITHUB_EVENT_PATH=e.json
#   GITHUB_REPOSITORY=o/r HARNESS_TRIGGER_LOOKUP_SECS=0:
#   trigger    bash scripts/remote-run.sh trigger -> 0; origin/add_comments gains
#              the prompt commit, "$s.log" gains `workflow run harness-run.yml
#              --ref add_comments ...`, `issue comment 7 ...` naming the branch,
#              then `issue edit 7 ... --remove-label harness`
#   read       the permission answer {"permission":"read"} -> 2, no `workflow
#              run`, one comment naming write access, the label removed
#   ignored    e.json's label name `bug` -> 0, one line, "$s.log" unchanged
#   dispatch   GITHUB_EVENT_NAME=repository_dispatch GITHUB_RUN_ID=9
#              GITHUB_STEP_SUMMARY=/tmp/s, e.json {"action":<TRIGGER_DISPATCH_EVENT_TYPE>,
#              "client_payload":{"title":"Add tags","body":"x","source":"jira"}}
#              -> 0; `workflow run ... --ref add_tags ...`, /tmp/s names
#              add_tags, no `issue` call; without "title" -> 2, no `workflow run`
#
#   adopt needs start's setup, a feat_x pushed to origin, no registry record
#   for it, and a `run list` answer carrying `headBranch` feat_x, `displayTitle`
#   `harness run feat_x`, `status` `in_progress` and a `url`:
#   list       bash scripts/remote-run.sh adopt --list -> 0; prints `not adopted:
#              feat_x <url>`; no registry file is created
#   adopt      bash scripts/remote-run.sh adopt -> 0; the mirror at
#              hr_worktree_dir, "$r"'s feat_x record `github-actions` /
#              `running`, prints `adopted feat_x (<url>)`
#   again      bash scripts/remote-run.sh adopt -> 0, `nothing to adopt`, "$r"
#              byte-identical

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
POLL_STATE_ARTIFACT_NAME='harness-poll-state'
DEFAULT_TRIGGER_LABEL='harness'
TRIGGER_DISPATCH_EVENT_TYPE='harness-task'
GH="${HARNESS_GH_CLI:-gh}"

# How many runs `status` prints, and how many `run list` returns for status
# and sync — enough to reach past interleaved `harness pause` runs.
STATUS_RUNS_SHOWN=10
RUN_LIST_LIMIT=50
# The one listing of every branch's runs that the stop marker and `poll` read.
ALL_RUNS_LIMIT=100
MAX_CHAIN_DEFAULT=24
# `poll`'s count bound on one paused run's failed re-dispatches: three ticks (90
# minutes at the shipped `*/30`) ride out a transient GitHub error, and a
# persistent one costs at most three billed ticks for that branch.
POLL_MAX_DISPATCH_FAILURES_DEFAULT=3
# `poll`'s deadline bound, in minutes after `usage_resume_at`. Stateless, so it
# ends the retries when the carried count is lost; six hours is past what the
# count bound reaches at any interval up to two hours.
POLL_GIVE_UP_AFTER_MINUTES_DEFAULT=360
# How many of the poller's own runs `poll` searches for the previous tick's
# state artifact; each one without it costs an artifact lookup.
POLL_STATE_RUNS_LIMIT=10
# `trigger`'s bound on looking up the run its `start` dispatched; the wait
# between tries is `HARNESS_TRIGGER_LOOKUP_SECS`, a test seam.
TRIGGER_RUN_LOOKUP_TRIES=6
TRIGGER_LOOKUP_SECS_DEFAULT=5

# GitHub's documented limit on a `workflow_dispatch` inputs payload: "The
# maximum payload for inputs is 65,535 characters."
# https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onworkflow_dispatchinputs
REMOTE_INPUT_PAYLOAD_MAX=65535

EXIT_OK=0
EXIT_USAGE=1
EXIT_REFUSED=2
EXIT_GH=3
EXIT_PLACEMENT=4
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
  echo "       remote-run.sh start <branch> --prompt-file <file> [--repo <root>]" >&2
  echo "       remote-run.sh trigger [--repo <root>]" >&2
  echo "       remote-run.sh adopt [--list] [--repo <root>]" >&2
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
  dispatch|pause|warm|stop|status|sync|restore|save|continue|poll|pause-requested|run-created-at|start|trigger|adopt) ;;
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
prompt_file=""
adopt_list=0

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
    --prompt-file)
      [ "$verb" = start ] || usage "$1 is a start option"
      [ "$#" -ge 2 ] && [ -n "$2" ] || usage "$1 needs a value"
      prompt_file="$2"; shift 2 ;;
    --list)
      [ "$verb" = adopt ] || usage "$1 is an adopt option"
      adopt_list=1; shift ;;
    -*)
      usage "unknown option '$1'" ;;
    *)
      [ "$verb" != warm ] && [ "$verb" != poll ] && [ "$verb" != trigger ] && [ "$verb" != adopt ] || usage "$verb takes no branch"
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

if [ "$verb" != warm ] && [ "$verb" != poll ] && [ "$verb" != run-created-at ] && [ "$verb" != trigger ] \
  && [ "$verb" != adopt ]; then
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

if [ "$verb" = start ] && [ -z "$prompt_file" ]; then
  usage "start needs --prompt-file"
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
  || [ "$verb" = pause-requested ] || [ "$verb" = run-created-at ] || [ "$verb" = trigger ]; then
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
  trigger)
    # Gates itself, after reading the event, so a refusal can still be commented.
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
case "$prompt_file" in
  ''|/*) ;;
  *) prompt_file="${PWD-.}/$prompt_file" ;;
esac

cd "$root" || setup_fail "cannot enter '$root'"

# ---------------------------------------------------------------------------
# The verbs.
# ---------------------------------------------------------------------------

# Appended to a failed dispatch's message; `start` sets it once its branch is pushed.
dispatch_fail_note=""

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

  gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$branch" "${inputs[@]}" || gh_fail "dispatch of '$branch' failed$dispatch_fail_note"
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
    hr_registry_set "$registry" "$branch" remote_stopped_at "$stopped_at" status failed \
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

# bundle_listed <run_id> [<artifact_name>] — 0 when the run carries an unexpired
# artifact of that name (the state artifact when omitted), 1 when it does not, 2
# with GH_ERR set when the lookup failed. Never exits.
bundle_listed() {
  local count
  gh_call api "repos/{owner}/{repo}/actions/runs/$1/artifacts" || return 2
  count=$(printf '%s' "$GH_OUT" | jq --arg n "${2:-$STATE_ARTIFACT_NAME}" \
    '[.artifacts[]? | select(.name == $n and (.expired != true))] | length' 2>/dev/null)
  case "$count" in
    ''|*[!0-9]*) GH_ERR="its artifact list is not the expected JSON"; return 2 ;;
  esac
  [ "$count" -gt 0 ]
}

# has_bundle <run_id> — bundle_listed, exiting 3 when the lookup failed.
has_bundle() {
  bundle_listed "$1"
  case $? in
    0) return 0 ;;
    1) return 1 ;;
  esac
  gh_fail "reading the artifacts of run $1 failed"
}

# bundle_state <run_id> — BUNDLE_STATE is `present` (an unexpired state
# artifact is listed), `expired` (only expired copies are) or `none`; when
# expired, BUNDLE_EXPIRES_AT is the latest listed `expires_at`. Exits 3 when
# the lookup failed, as has_bundle does. has_bundle alone cannot tell expired
# from absent: it reads both as "no bundle".
BUNDLE_STATE=""
BUNDLE_EXPIRES_AT=""
bundle_state() {
  local answer
  BUNDLE_STATE=""
  BUNDLE_EXPIRES_AT=""
  gh_call api "repos/{owner}/{repo}/actions/runs/$1/artifacts" || gh_fail "reading the artifacts of run $1 failed"
  answer=$(printf '%s' "$GH_OUT" | jq -r --arg n "$STATE_ARTIFACT_NAME" '
    [.artifacts[]? | select(.name == $n)] as $a
    | if ($a | map(select(.expired != true)) | length) > 0 then "present"
      elif ($a | length) > 0 then "expired\t" + ([$a[] | .expires_at // empty | tostring] | sort | last // "")
      else "none" end' 2>/dev/null)
  case "$answer" in
    present|none) BUNDLE_STATE="$answer" ;;
    expired$'\t'*)
      BUNDLE_STATE=expired
      BUNDLE_EXPIRES_AT="${answer#*$'\t'}"
      [ -n "$BUNDLE_EXPIRES_AT" ] || BUNDLE_EXPIRES_AT="an unlisted date"
      ;;
    *)
      GH_ERR="its artifact list is not the expected JSON"
      gh_fail "reading the artifacts of run $1 failed"
      ;;
  esac
}

# expired_line <run_id> — the way on for a bundle bundle_state found expired.
expired_line() {
  printf '%s' "the state bundle of run $1 expired on $BUNDLE_EXPIRES_AT: resume from the committed ledger with $RESUME_HINT $branch, or re-drop the task"
}

set_or_fail() {
  hr_registry_set "$registry" "$branch" "$1" "$2" || {
    echo "remote-run.sh: writing $1 of $branch to '$registry' failed" >&2
    exit "$EXIT_USAGE"
  }
}

# set_many_or_fail <key> <value> [<key> <value> …] — every pair in one write, so
# a concurrent reader never sees an outcome half-applied.
set_many_or_fail() {
  local keys="" i
  hr_registry_set "$registry" "$branch" "$@" || {
    for ((i = 1; i <= $#; i += 2)); do keys="$keys${keys:+, }${!i}"; done
    echo "remote-run.sh: writing $keys of $branch to '$registry' failed" >&2
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
  if [ -n "$finished_id" ]; then
    bundle_state "$finished_id"
    [ "$BUNDLE_STATE" != expired ] || echo "remote-run.sh: $(expired_line "$finished_id")"
  fi
}

# sync_expired <run_id> <url> <now> — the record `paused` / `expired` at that
# run, from BUNDLE_EXPIRES_AT; nothing restored.
sync_expired() {
  local line
  line=$(expired_line "$1")
  set_many_or_fail status paused pause_reason expired remote_run_id "$1" \
    remote_run_url "$2" remote_detail "$line" remote_synced_at "$3"
  echo "remote-run.sh: $line"
}

verb_sync() {
  local worktree runs newest id state url synced_id now older download status_file
  local status reason detail resume_at cycles
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
    set_many_or_fail status running remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch is $state; the record is running, nothing downloaded"
    return 0
  fi

  synced_id=$(hr_registry_get "$registry" "$branch" remote_run_id)
  # Case 1 — already applied. A record still waiting on this run's bundle is
  # re-checked: once it expires, the job can no longer take an answer.
  if [ "$id" = "$synced_id" ]; then
    case "$(hr_registry_get "$registry" "$branch" status)/$(hr_registry_get "$registry" "$branch" pause_reason)" in
      paused/expired) ;;
      parked/*|park_loop/*|paused/*)
        bundle_state "$id"
        if [ "$BUNDLE_STATE" = expired ]; then
          sync_expired "$id" "$url" "$now"
          return 0
        fi
        ;;
    esac
    set_or_fail remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch is the one last synced; the mirror is current"
    return 0
  fi

  # Case 2 — a newer run whose bundle has expired.
  bundle_state "$id"
  if [ "$BUNDLE_STATE" = expired ]; then
    sync_expired "$id" "$url" "$now"
    return 0
  fi

  # Case 3 — a newer run with a bundle.
  if [ "$BUNDLE_STATE" = present ]; then
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
    resume_at=$(hr_remote_status_get "$status_file" usage_resume_at) || resume_at=""
    cycles=$(hr_remote_status_get "$status_file" park_loop_cycles) || cycles=""
    set_many_or_fail status "$status" pause_reason "$reason" usage_resume_at "$resume_at" \
      park_loop_cycles "$cycles" remote_run_id "$id" remote_run_url "$url" \
      remote_detail "$detail" remote_synced_at "$now"
    echo "remote-run.sh: synced run $id of $branch: $status${reason:+ ($reason)}"
    return 0
  fi

  # Case 4 — a newer run with no bundle, while some bundle exists.
  local bundle_exists=0
  if [ -n "$synced_id" ]; then
    bundle_exists=1
  else
    for older in $(printf '%s' "$runs" | jq -r '.[1:][] | select(.status == "completed") | .databaseId | tostring'); do
      if has_bundle "$older"; then bundle_exists=1; break; fi
    done
  fi
  if [ "$bundle_exists" -eq 1 ]; then
    set_many_or_fail status paused pause_reason killed remote_run_id "$id" remote_run_url "$url" \
      remote_detail "run $id ended with no state bundle (killed, cancelled or replaced): $url" \
      remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch left no bundle; the record is paused (killed), nothing restored"
    return 0
  fi

  # Case 5 — no bundle in any run.
  set_many_or_fail status failed \
    remote_detail "no run of $branch ever uploaded a state bundle; newest: $url" \
    remote_synced_at "$now"
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

# previous_bundle_run — PREV_RUN_ID is the newest finished `harness run
# <branch>` run, other than this job's own, carrying a state artifact, and
# PREV_RUN_STATE is `present`, `expired` or empty when no run carries one. A
# run with no artifact is walked past; an expired one stops the walk, because
# an older copy is staler state. Exits 3 when gh fails.
PREV_RUN_ID=""
PREV_RUN_STATE=""
previous_bundle_run() {
  local ids id
  PREV_RUN_ID=""
  PREV_RUN_STATE=""
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
    bundle_state "$id"
    if [ "$BUNDLE_STATE" != none ]; then
      PREV_RUN_ID="$id"
      PREV_RUN_STATE="$BUNDLE_STATE"
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

  previous_bundle_run
  id="$PREV_RUN_ID"
  hr_remote_names_var
  if [ "$PREV_RUN_STATE" = expired ]; then
    [ "$resume" != answer ] \
      || restore_refuse "the state bundle of run $id expired on $BUNDLE_EXPIRES_AT, so its questions can no longer be answered here: resume from the committed ledger with $RESUME_HINT $branch, or re-drop the task; nothing written"
    echo "::warning::remote-run.sh: the state bundle of run $id expired on $BUNDLE_EXPIRES_AT: the park-loop, auto-resume and stall counts, the clarification history and any planning drafts not yet committed that it carried are lost; this job continues from the committed ledger"
  elif [ -z "$id" ]; then
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
    if [ "$resume" = answer ]; then
      # Checked against the downloaded bundle, before anything is restored: a refusal
      # must leave no restored status for `save` to re-upload as this job's own.
      for n in $(jq -n -r 'env.HARNESS_INPUT_ANSWERS | fromjson | keys_unsorted[]'); do
        [ -f "$download/$HR_REMOTE_CLARIFY_DIR/$branch/question_$n.md" ] \
          || restore_refuse "answer $n has no question_$n.md in the bundle of run $id; nothing restored, no answer written"
      done
    fi
    hr_remote_bundle_restore "$download" "$root" "$branch" job
    case $? in
      0)
        echo "remote-run.sh: restored the bundle of run $id into $root"
        [ $((HR_REMOTE_PLANNING_PLACED + HR_REMOTE_PLANNING_KEPT)) -eq 0 ] \
          || echo "remote-run.sh: placed $HR_REMOTE_PLANNING_PLACED planning file(s) for $branch; kept $HR_REMOTE_PLANNING_KEPT the checkout already carries"
        ;;
      2) restore_refuse "the bundle in '$download' is unrecognised for $branch; nothing restored" ;;
      *) restore_fail "restoring '$download' into '$root' failed" ;;
    esac
  fi

  if [ "$resume" = answer ]; then
    clar=$(hr_state_path "$root" "$HR_REMOTE_CLARIFY_DIR/$branch") \
      || restore_fail "cannot resolve '$root/harness.config.json'"
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
  # `restore` places the previous job's status.json at this same path; one whose
  # run_id is not this job's means this job's harness step never wrote its own,
  # and re-uploading it would replay the previous job's decision and chain.
  if [ -n "$status_source" ] && [ -f "$status_source" ] && [ -n "${GITHUB_RUN_ID-}" ] \
    && [ "$(hr_remote_status_get "$status_source" run_id 2>/dev/null || :)" != "$GITHUB_RUN_ID" ]; then
    if mv "$status_source" "$status_source.previous" 2>/dev/null; then
      echo "remote-run.sh: save: $status_source is the previous job's (run_id is not $GITHUB_RUN_ID); moved aside, not uploaded" >&2
    else
      echo "remote-run.sh: save: cannot move the previous job's '$status_source' aside; no bundle written" >&2
      mkdir -p "$out_dir" 2>/dev/null || :
      status_source=""
      registry_file=""
    fi
  fi
  # Without either file the harness step never started; the library's registry
  # fallback would create a registry in the checkout to find nothing in it.
  if { [ -z "$status_source" ] || [ ! -f "$status_source" ]; } && { [ -z "$registry_file" ] || [ ! -f "$registry_file" ]; }; then
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
    --json databaseId,headBranch,displayTitle,status,createdAt,url --limit "$ALL_RUNS_LIMIT" || return 1
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

# POLL_STATE — the poller state carried between ticks, one object keyed by
# branch: {"<branch>": {"run_id", "failures", "notified"}}, every value a string.
POLL_STATE='{}'
POLL_STATE_FILE_NAME='poll_state.json'

poll_state_get() {
  printf '%s' "$POLL_STATE" | jq -r --arg b "$1" --arg f "$2" '.[$b][$f] // "" | tostring'
}

poll_state_put() {
  POLL_STATE=$(printf '%s' "$POLL_STATE" | jq -c --arg b "$1" --arg r "$2" --arg f "$3" --arg n "$4" \
    '.[$b] = {run_id: $r, failures: $f, notified: $n}')
}

poll_state_drop() {
  POLL_STATE=$(printf '%s' "$POLL_STATE" | jq -c --arg b "$1" 'del(.[$b])')
}

# poll_state_load — POLL_STATE from the newest other run of the poller carrying
# the poll-state artifact. Any failure is one line and an empty state.
poll_state_load() {
  local previous ids id found="" file parsed
  POLL_STATE='{}'
  previous=$(hr_state_path "$root" autonomous_logs/poll_state/previous) || {
    echo "remote-run.sh: poll: cannot resolve the poller state directory; starting from an empty state"
    return 0
  }
  if ! gh_call run list --workflow "$WORKFLOW_RESUME_FILE" --json databaseId,createdAt --limit "$POLL_STATE_RUNS_LIMIT"; then
    echo "remote-run.sh: poll: listing the runs of $WORKFLOW_RESUME_FILE failed ($GH_ERR); starting from an empty state"
    return 0
  fi
  ids=$(printf '%s' "$GH_OUT" | jq -r --arg self "${GITHUB_RUN_ID-}" '
    [.[] | select((.databaseId | tostring) != $self)]
    | sort_by([.createdAt, .databaseId]) | reverse | .[].databaseId | tostring' 2>/dev/null) || {
    echo "remote-run.sh: poll: the run list of $WORKFLOW_RESUME_FILE is not the expected JSON; starting from an empty state"
    return 0
  }
  for id in $ids; do
    bundle_listed "$id" "$POLL_STATE_ARTIFACT_NAME"
    case $? in
      0) found="$id"; break ;;
      2) echo "remote-run.sh: poll: reading the artifacts of poller run $id failed ($GH_ERR); starting from an empty state"; return 0 ;;
    esac
  done
  if [ -z "$found" ]; then
    echo "remote-run.sh: poll: no earlier poller run carries $POLL_STATE_ARTIFACT_NAME; starting from an empty state"
    return 0
  fi
  if ! mkdir -p "$previous" || ! rm -f "$previous/$POLL_STATE_FILE_NAME"; then
    echo "remote-run.sh: poll: cannot create '$previous'; starting from an empty state"
    return 0
  fi
  if ! gh_call run download "$found" -n "$POLL_STATE_ARTIFACT_NAME" -D "$previous"; then
    echo "remote-run.sh: poll: downloading the poller state of run $found failed ($GH_ERR); starting from an empty state"
    return 0
  fi
  file="$previous/$POLL_STATE_FILE_NAME"
  parsed=$(jq -c 'if type == "object" then with_entries(select(.value | type == "object")) else error("not an object") end' \
    "$file" 2>/dev/null)
  if [ -z "$parsed" ]; then
    echo "remote-run.sh: poll: '$file' is not a poller state object; starting from an empty state"
    return 0
  fi
  POLL_STATE="$parsed"
  echo "remote-run.sh: poll: carried the poller state of run $found"
}

# poll_state_write — POLL_STATE into `current/`, which the poller uploads.
poll_state_write() {
  local current
  current=$(hr_state_path "$root" autonomous_logs/poll_state/current) \
    && mkdir -p "$current" \
    && printf '%s\n' "$POLL_STATE" >"$current/$POLL_STATE_FILE_NAME" \
    || echo "remote-run.sh: poll: writing the poller state failed; the next tick starts from an empty state" >&2
}

# poll_bounds_var — POLL_MAX_FAILURES and POLL_GIVE_UP_MINUTES from the
# environment. 1 with POLL_BOUND_BAD naming the value that is not a
# non-negative integer.
POLL_MAX_FAILURES=""
POLL_GIVE_UP_MINUTES=""
POLL_BOUND_BAD=""
poll_bounds_var() {
  POLL_MAX_FAILURES="${HARNESS_POLL_MAX_DISPATCH_FAILURES:-$POLL_MAX_DISPATCH_FAILURES_DEFAULT}"
  POLL_GIVE_UP_MINUTES="${HARNESS_POLL_GIVE_UP_AFTER_MINUTES:-$POLL_GIVE_UP_AFTER_MINUTES_DEFAULT}"
  case "$POLL_MAX_FAILURES" in
    *[!0-9]*) POLL_BOUND_BAD="HARNESS_POLL_MAX_DISPATCH_FAILURES '$POLL_MAX_FAILURES'"; return 1 ;;
  esac
  case "$POLL_GIVE_UP_MINUTES" in
    *[!0-9]*) POLL_BOUND_BAD="HARNESS_POLL_GIVE_UP_AFTER_MINUTES '$POLL_GIVE_UP_MINUTES'"; return 1 ;;
  esac
  return 0
}

# poll_fetch <run_id> — POLL_STATUS_FILE is the status.json of the run's
# bundle, downloaded unless its directory already holds it. 1 on failure, with
# one line said.
POLL_STATUS_FILE=""
poll_fetch() {
  local id="$1" download
  POLL_STATUS_FILE=""
  download=$(hr_state_path "$root" "autonomous_logs/remote_download/$branch/$id") || {
    echo "remote-run.sh: poll: cannot resolve '$root/harness.config.json' for $branch" >&2
    return 1
  }
  POLL_STATUS_FILE="$download/$HR_REMOTE_STATUS_FILE"
  [ ! -f "$POLL_STATUS_FILE" ] || return 0
  if ! mkdir -p "$download"; then
    echo "remote-run.sh: poll: cannot create '$download' for $branch" >&2
    return 1
  fi
  if ! gh_call run download "$id" -n "$STATE_ARTIFACT_NAME" -D "$download"; then
    echo "remote-run.sh: poll: the bundle of run $id ($branch) cannot be downloaded: $GH_ERR"
    return 1
  fi
}

# poll_usage_paused — 0 when POLL_STATUS_FILE says paused / usage.
poll_usage_paused() {
  local status reason
  status=$(hr_remote_status_get "$POLL_STATUS_FILE" status) || status=""
  reason=$(hr_remote_status_get "$POLL_STATUS_FILE" pause_reason) || reason=""
  [ "$status" = paused ] && [ "$reason" = usage ]
}

# poll_branch <run_id> <state> <may_dispatch> — one branch's newest `harness
# run` run; the global branch names it. Returns 0 when the branch is waiting.
# With may_dispatch 0 nothing is sent and nothing notified: a due run that
# would be dispatched counts as waiting, one that would be refused does not.
poll_branch() {
  local id="$1" state="$2" may_dispatch="$3" at engine_value now failures
  if [ "$may_dispatch" -eq 1 ] && [ -n "$(poll_state_get "$branch" run_id)" ] \
    && [ "$(poll_state_get "$branch" run_id)" != "$id" ]; then
    poll_state_drop "$branch"
  fi
  remote_branch_stopped "$branch"
  case $? in
    0) echo "remote-run.sh: poll: $branch is stopped ($STOPPED_LINE); skipped"; return 1 ;;
    2) echo "remote-run.sh: poll: the stop-marker check for $branch failed ($GH_ERR); skipped"; return 1 ;;
  esac
  if [ "$state" != completed ]; then
    # Never dispatched from here: the job's own `continue` step enables the
    # poller after its upload, and a later tick sees the run completed.
    bundle_listed "$id"
    case $? in
      1) return 1 ;;
      2) echo "remote-run.sh: poll: reading the artifacts of unfinished run $id ($branch) failed ($GH_ERR); counted as waiting"; return 0 ;;
    esac
    if ! poll_fetch "$id"; then
      echo "remote-run.sh: poll: unfinished run $id ($branch) counted as waiting"
      return 0
    fi
    poll_usage_paused || return 1
    echo "remote-run.sh: poll: $branch's unfinished run $id carries a usage-paused bundle; waiting"
    return 0
  fi
  if [ "$(poll_state_get "$branch" run_id)" = "$id" ] && [ "$(poll_state_get "$branch" notified)" = 1 ]; then
    echo "remote-run.sh: poll: $branch's run $id was already reported as not re-dispatchable; skipped"
    return 1
  fi
  if ! poll_fetch "$id"; then
    echo "remote-run.sh: poll: $branch skipped"
    return 1
  fi
  poll_usage_paused || return 1
  at=$(hr_remote_status_get "$POLL_STATUS_FILE" usage_resume_at) || at=""
  case "$at" in
    ''|*[!0-9]*) echo "remote-run.sh: poll: $branch is usage-paused with no readable usage_resume_at; skipped"; return 1 ;;
  esac
  now=$(date +%s)
  if [ "$((10#$at))" -gt "$now" ]; then
    echo "remote-run.sh: poll: $branch waits for its usage reset at $at"
    return 0
  fi
  next_chain_var "$POLL_STATUS_FILE"
  case $? in
    1) [ "$may_dispatch" -eq 0 ] || notify failed "$branch" "Not resumed by the poller: chain unreadable in status.json."; return 1 ;;
    2) [ "$may_dispatch" -eq 0 ] || notify failed "$branch" "Not resumed by the poller: chain limit reached ($NEXT_CHAIN over HARNESS_MAX_CHAIN $MAX_CHAIN)."; return 1 ;;
  esac
  engine_value=$(hr_remote_status_get "$POLL_STATUS_FILE" engine) || engine_value=""
  if ! valid_engine "$engine_value"; then
    [ "$may_dispatch" -eq 0 ] || notify failed "$branch" "Not resumed by the poller: engine '$engine_value' in status.json is not task, user_review or docs."
    return 1
  fi
  if [ "$may_dispatch" -eq 0 ]; then
    echo "remote-run.sh: poll: $branch is due; the next tick dispatches it"
    return 0
  fi
  if redispatch "$engine_value" "$NEXT_CHAIN"; then
    echo "remote-run.sh: poll: dispatched $branch --resume pause --chain $NEXT_CHAIN"
    POLL_DISPATCHED="$POLL_DISPATCHED$branch "
    poll_state_drop "$branch"
    return 1
  fi
  failures=$(poll_state_get "$branch" failures)
  case "$failures" in
    ''|*[!0-9]*) failures=0 ;;
  esac
  failures=$((10#$failures + 1))
  if [ "$failures" -ge "$((10#$POLL_MAX_FAILURES))" ] \
    || [ "$now" -gt "$((10#$at + 10#$POLL_GIVE_UP_MINUTES * 60))" ]; then
    poll_state_put "$branch" "$id" "$failures" 1
    notify paused "$branch" "The resume poller could not re-dispatch $branch ($REDISPATCH_ERR) after $failures attempts; automatic resume has stopped. Run $RESUME_HINT $branch."
    return 1
  fi
  poll_state_put "$branch" "$id" "$failures" ""
  echo "remote-run.sh: poll: dispatching $branch failed ($REDISPATCH_ERR), attempt $failures of $POLL_MAX_FAILURES; still waiting"
  return 0
}

# poll_pass <may_dispatch> — poll_branch over each branch's newest `harness run`
# run in ALL_RUNS, skipping a branch this tick already dispatched. POLL_WAITING
# lists the waiting branches, space-separated, and POLL_WAITING_COUNT counts
# them. 1 when ALL_RUNS is unreadable.
POLL_WAITING=""
POLL_WAITING_COUNT=0
POLL_DISPATCHED=" "
poll_pass() {
  local entries b id state
  POLL_WAITING=""
  POLL_WAITING_COUNT=0
  entries=$(printf '%s' "$ALL_RUNS" | jq -r '
    [.[] | select((.displayTitle // "") | startswith("harness run "))]
    | group_by(.displayTitle)
    | map(sort_by([.createdAt, .databaseId]) | last)
    | .[] | [(.displayTitle | ltrimstr("harness run ")), (.databaseId | tostring), (.status // "")] | @tsv' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    return 1
  }
  while IFS=$'\t' read -r b id state; do
    valid_branch "$b" || continue
    case "$POLL_DISPATCHED" in *" $b "*) continue ;; esac
    branch="$b"
    if poll_branch "$id" "$state" "$1"; then
      POLL_WAITING="$POLL_WAITING$b "
      POLL_WAITING_COUNT=$((POLL_WAITING_COUNT + 1))
    fi
  done <<EOF
$entries
EOF
}

# poll_recheck — after the disable: one fresh listing, evaluated without
# dispatching; re-enables the poller when a branch became waiting meanwhile.
poll_recheck() {
  local b
  ALL_RUNS_LISTED=0
  if ! list_all_runs || ! poll_pass 0; then
    echo "remote-run.sh: poll: the re-check after disabling $WORKFLOW_RESUME_FILE could not list the runs ($GH_ERR); it stays disabled"
    return 0
  fi
  [ "$POLL_WAITING_COUNT" -gt 0 ] || return 0
  if gh_call workflow enable "$WORKFLOW_RESUME_FILE"; then
    for b in $POLL_WAITING; do
      echo "remote-run.sh: poll: $b became waiting during this tick; re-enabled $WORKFLOW_RESUME_FILE"
    done
    return 0
  fi
  for b in $POLL_WAITING; do
    notify paused "$b" "Auto-resume is unavailable: re-enabling $WORKFLOW_RESUME_FILE failed ($GH_ERR). Run $RESUME_HINT $b after the usage reset."
  done
}

# verb_poll writes the poller state on every exit, so the next tick inherits
# the count whatever this one met.
verb_poll() {
  poll_state_load
  if [ -n "${HARNESS_REMOTE_STOP-}" ]; then
    poll_state_write
    echo "remote-run.sh: poll: remote stop is set; nothing dispatched"
    return 0
  fi
  if ! max_chain_var; then
    poll_state_write
    echo "remote-run.sh: poll: HARNESS_MAX_CHAIN '$MAX_CHAIN' is not a non-negative integer; nothing dispatched" >&2
    exit "$EXIT_USAGE"
  fi
  if ! poll_bounds_var; then
    poll_state_write
    echo "remote-run.sh: poll: $POLL_BOUND_BAD is not a non-negative integer; nothing dispatched" >&2
    exit "$EXIT_USAGE"
  fi
  hr_remote_names_var
  if ! list_all_runs || ! poll_pass 1; then
    poll_state_write
    gh_fail "listing the runs of $WORKFLOW_RUN_FILE failed"
  fi
  poll_state_write
  if [ "$POLL_WAITING_COUNT" -gt 0 ]; then
    echo "remote-run.sh: poll: $POLL_WAITING_COUNT branch(es) still waiting; $WORKFLOW_RESUME_FILE stays enabled"
    return 0
  fi
  gh_call workflow disable "$WORKFLOW_RESUME_FILE" || gh_fail "disabling $WORKFLOW_RESUME_FILE failed"
  echo "remote-run.sh: poll: no branch is waiting; disabled $WORKFLOW_RESUME_FILE"
  poll_recheck
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

# placement_fail <step> — exit 4, naming the step; nothing was dispatched.
placement_fail() {
  echo "remote-run.sh: start of '$branch' failed at $1; nothing was dispatched" >&2
  exit "$EXIT_PLACEMENT"
}

verb_start() {
  local protected=0 status=0 worktree state_rel rel subject
  hr_branch_is_protected "$root" "$branch" || protected=$?
  case "$protected" in
    0)
      echo "remote-run.sh: refused, nothing written: $branch is protected" >&2
      exit "$EXIT_REFUSED" ;;
    2)
      echo "remote-run.sh: refused, nothing written: cannot judge whether $branch is protected" >&2
      exit "$EXIT_REFUSED" ;;
  esac
  if [ ! -f "$prompt_file" ] || [ ! -r "$prompt_file" ]; then
    echo "remote-run.sh: refused, nothing written: the prompt file '$prompt_file' is not a readable regular file" >&2
    exit "$EXIT_REFUSED"
  fi

  bash "$script_dir/create-worktree.sh" --no-bootstrap "$branch" >&2 || status=$?
  [ "$status" -eq 0 ] || placement_fail "the branch cut (create-worktree.sh exited $status)"

  worktree=$(hr_worktree_dir "$root" "$branch") || placement_fail "resolving the working copy"
  state_rel=$(hr_state_dir "$worktree") || placement_fail "resolving the state directory in '$worktree'"
  [ -n "$state_rel" ] || placement_fail "resolving the state directory in '$worktree'"
  rel=$(hr_task_prompt_rel "$state_rel" "$branch")
  subject=$(hr_task_prompt_subject "$branch")

  hr_place_artifact "$worktree" "$prompt_file" "$rel" || placement_fail "copying the prompt to '$worktree/$rel'"
  # 3 (nothing staged) cannot happen on a freshly cut branch, so it reads as 0.
  status=0
  hr_commit_placed "$script_dir/commit-on-branch.sh" "$worktree" "$rel" "$subject" >&2 || status=$?
  [ "$status" -ne 1 ] || placement_fail "committing '$rel'"
  hr_push_landed "$script_dir/push-branch.sh" "$worktree" "$branch" >&2 \
    || placement_fail "pushing $branch (origin/$branch is not HEAD)"

  engine=task
  resume=none
  chain=0
  dispatch_fail_note="; $branch and its task prompt are already pushed to origin, so re-send with: remote-run.sh dispatch $branch --engine task"
  verb_dispatch
  echo "remote-run.sh: started $branch (worktree $worktree)"
}

# ---------------------------------------------------------------------------
# `adopt` — a local record and mirror for a run started on GitHub.
# ---------------------------------------------------------------------------

# adopt_fail <branch> <reason> — one candidate not adopted; the next is tried.
adopt_failed=0
adopt_fail() {
  echo "remote-run.sh: could not adopt $1: $2" >&2
  adopt_failed=1
}

# adopt_one <branch> <url> — the mirror, the record, a sync, then the engine
# the synced bundle names. 1 when any step failed.
adopt_one() {
  local b="$1" url="$2" status=0 worktree log_path run_id download engine_value
  bash "$script_dir/create-worktree.sh" --existing "$b" >&2 || status=$?
  [ "$status" -eq 0 ] || { adopt_fail "$b" "create-worktree.sh exited $status"; return 1; }
  worktree=$(hr_worktree_dir "$root" "$b") || { adopt_fail "$b" "resolving its working copy failed"; return 1; }
  log_path=$(hr_state_path "$root" "autonomous_logs/$b.log") || { adopt_fail "$b" "resolving its log path failed"; return 1; }
  hr_remote_record_init "$registry" "$b" "$worktree" "$log_path" task \
    || { adopt_fail "$b" "writing its record to '$registry' failed"; return 1; }
  hr_registry_set "$registry" "$b" status running remote_adopted_at "$(date +%s)" \
    || { adopt_fail "$b" "writing its status to '$registry' failed"; return 1; }
  status=0
  bash "$script_dir/remote-run.sh" sync "$b" --repo "$root" || status=$?
  [ "$status" -eq 0 ] \
    || { adopt_fail "$b" "sync exited $status (its record and mirror are written; run sync again)"; return 1; }
  # Every trigger-started run is `task`; a run another machine dropped may not be.
  run_id=$(hr_registry_get "$registry" "$b" remote_run_id)
  if [ -n "$run_id" ]; then
    hr_remote_names_var
    download=$(hr_state_path "$root" "autonomous_logs/remote_download/$b/$run_id") || download=""
    if [ -n "$download" ] && [ -f "$download/$HR_REMOTE_STATUS_FILE" ]; then
      engine_value=$(hr_remote_status_get "$download/$HR_REMOTE_STATUS_FILE" engine) || engine_value=""
      if valid_engine "$engine_value" && ! hr_registry_set "$registry" "$b" engine "$engine_value"; then
        adopt_fail "$b" "writing its engine to '$registry' failed"
        return 1
      fi
    fi
  fi
  echo "remote-run.sh: adopted $b ($url)"
}

verb_adopt() {
  local titled recorded="" heads="" live=$'\n' ref b url protected candidates=""
  registry=$(hr_state_path "$root" autonomous_logs/registry.json) || {
    echo "remote-run.sh: cannot resolve '$root/harness.config.json'" >&2
    exit "$EXIT_USAGE"
  }
  list_all_runs || gh_fail "listing the runs of $WORKFLOW_RUN_FILE failed"
  # Newest first, one line per branch: its newest `harness run <branch>` run.
  titled=$(printf '%s' "$ALL_RUNS" | jq -r '
    [.[] | select((.displayTitle // "") | startswith("harness run "))
         | . + {b: (.displayTitle | ltrimstr("harness run "))}]
    | sort_by([.createdAt, .databaseId]) | reverse
    | reduce .[] as $r ({seen: {}, out: []};
        if .seen[$r.b] then . else (.seen[$r.b] = true | .out += [$r]) end)
    | .out[] | "\(.b)\t\(.url // "")"' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    gh_fail "listing the runs of $WORKFLOW_RUN_FILE failed"
  }

  # Tested with -f first: hr_registry_get creates an absent registry, and
  # --list writes nothing.
  if [ -f "$registry" ]; then
    recorded=$(jq -r '.runs | keys[]' "$registry" 2>/dev/null) || {
      echo "remote-run.sh: cannot read the registry '$registry'" >&2
      exit "$EXIT_USAGE"
    }
  fi
  recorded=$'\n'"$recorded"$'\n'

  if [ -n "$titled" ]; then
    heads=$(git -C "$root" ls-remote --heads origin 2>&1) || {
      echo "remote-run.sh: reading origin's branches failed: ${heads%%$'\n'*}" >&2
      exit "$EXIT_GH"
    }
    while IFS=$'\t' read -r _ ref; do
      case "$ref" in refs/heads/*) live="$live${ref#refs/heads/}"$'\n' ;; esac
    done <<EOF
$heads
EOF
  fi

  while IFS=$'\t' read -r b url; do
    valid_branch "$b" || continue
    case "$recorded" in *$'\n'"$b"$'\n'*) continue ;; esac
    protected=0
    hr_branch_is_protected "$root" "$b" || protected=$?
    [ "$protected" -eq 1 ] || continue
    case "$live" in *$'\n'"$b"$'\n'*) ;; *) continue ;; esac
    candidates="$candidates$b"$'\t'"$url"$'\n'
  done <<EOF
$titled
EOF

  if [ -z "$candidates" ]; then
    echo "remote-run.sh: nothing to adopt"
    return 0
  fi
  while IFS=$'\t' read -r b url; do
    [ -n "$b" ] || continue
    if [ "$adopt_list" -eq 1 ]; then
      echo "remote-run.sh: not adopted: $b $url"
    else
      adopt_one "$b" "$url" </dev/null || :
    fi
  done <<EOF
$candidates
EOF
  [ "$adopt_failed" -eq 0 ] || exit "$EXIT_PLACEMENT"
}

# ---------------------------------------------------------------------------
# `trigger` — the event adapter. Event text is data: every field is read by
# `jq` into a variable and reaches a command only as one argument or as file
# bytes, never as shell source.
# ---------------------------------------------------------------------------

trigger_tmp=""
trigger_label=""
issue_number=""
# `issue` or `dispatch`: where trigger_finish reports.
trigger_source=""

# event_field <jq filter> — one field of the event into EVENT_VALUE, its bytes
# kept (a command substitution alone would drop trailing newlines). 1 when jq
# cannot read it.
EVENT_VALUE=""
event_field() {
  local out
  out=$(jq -j "$1" "$GITHUB_EVENT_PATH" 2>/dev/null && printf x) || return 1
  EVENT_VALUE=${out%x}
}

# trigger_finish <exit> <comment> — post <comment> on the issue, remove the
# trigger label, and exit <exit>. A comment that cannot be posted makes the exit
# 3; a label that cannot be removed is a warning only. For a dispatch event,
# print <comment> and append it to GITHUB_STEP_SUMMARY when set; a summary that
# cannot be appended is a warning only, since stdout already carries it.
trigger_finish() {
  local code="$1" body="$2" file
  if [ "$trigger_source" = dispatch ]; then
    printf '%s\n' "$body"
    if [ -n "${GITHUB_STEP_SUMMARY-}" ]; then
      printf '%s\n' "### harness trigger" "" "$body" "" >>"$GITHUB_STEP_SUMMARY" \
        || echo "::warning::remote-run.sh: trigger: cannot append to GITHUB_STEP_SUMMARY"
    fi
    exit "$code"
  fi
  if [ -n "${GITHUB_RUN_ID-}" ]; then
    body="$body

_Posted by the trigger job ${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY-}/actions/runs/$GITHUB_RUN_ID._"
  fi
  if ! file=$(mktemp "$trigger_tmp/harness-trigger-comment.XXXXXX"); then
    echo "::error::remote-run.sh: trigger: cannot create the comment file for issue #$issue_number under '$trigger_tmp'"
    exit "$EXIT_GH"
  fi
  printf '%s\n' "$body" >"$file"
  if ! gh_call issue comment "$issue_number" --repo "${GITHUB_REPOSITORY-}" --body-file "$file"; then
    echo "::error::remote-run.sh: trigger: the comment on issue #$issue_number could not be posted: $GH_ERR"
    code="$EXIT_GH"
  fi
  rm -f "$file"
  if ! gh_call issue edit "$issue_number" --repo "${GITHUB_REPOSITORY-}" --remove-label "$trigger_label"; then
    echo "::warning::remote-run.sh: trigger: removing the label '$trigger_label' from issue #$issue_number failed: $GH_ERR"
  fi
  exit "$code"
}

# trigger_refuse <reason> <way on> — print the reason, comment both, exit 2.
trigger_refuse() {
  echo "remote-run.sh: trigger: refused, nothing sent: $1" >&2
  trigger_finish "$EXIT_REFUSED" "No run started: $1

$2"
}

# trigger_bot_listed <login> — 0 when <login> is an exact entry of
# HARNESS_TRIGGER_ALLOWED_BOTS, split on `,` with each entry trimmed.
trigger_bot_listed() {
  local rest="${HARNESS_TRIGGER_ALLOWED_BOTS-}," entry
  while [ -n "$rest" ]; do
    entry=${rest%%,*}
    rest=${rest#*,}
    entry=${entry#"${entry%%[![:space:]]*}"}
    entry=${entry%"${entry##*[![:space:]]}"}
    [ -n "$entry" ] && [ "$entry" = "$1" ] && return 0
  done
  return 1
}

# trigger_run_url — the URL of the `harness run <branch>` run `start` just
# dispatched, looked up at most TRIGGER_RUN_LOOKUP_TRIES times; the branch's
# filtered run list when none appears. Never fails.
trigger_run_url() {
  local try=1 secs url=""
  secs="${HARNESS_TRIGGER_LOOKUP_SECS-}"
  case "$secs" in
    ''|*[!0-9]*) secs="$TRIGGER_LOOKUP_SECS_DEFAULT" ;;
  esac
  while :; do
    if gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" --json url,displayTitle --limit 5; then
      url=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness run $branch" \
        '[.[]? | select(.displayTitle == $t) | .url | strings] | first // empty' 2>/dev/null) || url=""
      [ -z "$url" ] || break
    else
      echo "remote-run.sh: trigger: looking up the run of $branch failed: $GH_ERR" >&2
    fi
    [ "$try" -lt "$TRIGGER_RUN_LOOKUP_TRIES" ] || break
    try=$((try + 1))
    sleep "$secs"
  done
  # A derived name is `[a-z0-9_]` only, so it needs no encoding in the query.
  [ -n "$url" ] || url="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY-}/actions/workflows/${WORKFLOW_RUN_FILE}?query=branch%3A$branch"
  printf '%s\n' "$url"
}

verb_trigger() {
  local LC_ALL=C
  local action label title body html_url state login sender_type source=""
  local forge="" target="" default name_file status permission prompt errfile last url
  local fallback retry_then retry_again task_what
  case "${GITHUB_EVENT_NAME-}" in
    issues) trigger_source=issue ;;
    repository_dispatch) trigger_source=dispatch ;;
    *)
      echo "remote-run.sh: trigger handles GITHUB_EVENT_NAME issues or repository_dispatch, not '${GITHUB_EVENT_NAME-}'" >&2
      exit "$EXIT_USAGE" ;;
  esac
  if [ -z "${GITHUB_EVENT_PATH-}" ] || [ ! -f "$GITHUB_EVENT_PATH" ] || [ ! -r "$GITHUB_EVENT_PATH" ]; then
    echo "remote-run.sh: trigger: cannot read the event file '${GITHUB_EVENT_PATH-}'" >&2
    exit "$EXIT_USAGE"
  fi
  hr_have_jq || { echo "remote-run.sh: trigger needs jq" >&2; exit "$EXIT_USAGE"; }

  if [ "$trigger_source" = issue ]; then
    { event_field '.action // ""' && action="$EVENT_VALUE" \
      && event_field '.label.name // ""' && label="$EVENT_VALUE" \
      && event_field '.issue.number // ""' && issue_number="$EVENT_VALUE" \
      && event_field '.issue.title // ""' && title="$EVENT_VALUE" \
      && event_field '.issue.body // ""' && body="$EVENT_VALUE" \
      && event_field '.issue.html_url // ""' && html_url="$EVENT_VALUE" \
      && event_field '.issue.state // ""' && state="$EVENT_VALUE" \
      && event_field '.sender.login // ""' && login="$EVENT_VALUE" \
      && event_field '.sender.type // ""' && sender_type="$EVENT_VALUE"; } || {
      echo "remote-run.sh: trigger: '$GITHUB_EVENT_PATH' is not a readable event" >&2
      exit "$EXIT_USAGE"
    }
    trigger_label="${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}"
    if [ "$action" != labeled ] || [ "$label" != "$trigger_label" ]; then
      echo "remote-run.sh: trigger: ignored, not the label '$trigger_label' being applied"
      return 0
    fi
    case "$issue_number" in
      ''|*[!0-9]*|0*)
        echo "remote-run.sh: trigger: the event carries no issue number" >&2
        exit "$EXIT_USAGE" ;;
    esac
    fallback="issue_$issue_number"
    retry_then="re-apply the label \`$trigger_label\`"
    retry_again="Re-apply the label \`$trigger_label\` to try again."
    task_what="this issue's task"
  else
    # GitHub puts a repository_dispatch's `event_type` in `.action`.
    { event_field '.action // ""' && action="$EVENT_VALUE" \
      && event_field '.client_payload.title // ""' && title="$EVENT_VALUE" \
      && event_field '.client_payload.body // ""' && body="$EVENT_VALUE" \
      && event_field '.client_payload.source // ""' && source="$EVENT_VALUE"; } || {
      echo "remote-run.sh: trigger: '$GITHUB_EVENT_PATH' is not a readable event" >&2
      exit "$EXIT_USAGE"
    }
    if [ "$action" != "$TRIGGER_DISPATCH_EVENT_TYPE" ]; then
      echo "remote-run.sh: trigger: ignored, a repository_dispatch of type '$action', not '$TRIGGER_DISPATCH_EVENT_TYPE'"
      return 0
    fi
    fallback="task_${GITHUB_RUN_ID-}"
    retry_then="send the \`$TRIGGER_DISPATCH_EVENT_TYPE\` dispatch again"
    retry_again="Send the \`$TRIGGER_DISPATCH_EVENT_TYPE\` dispatch again to try again."
    task_what="the dispatched task"
  fi

  trigger_tmp="${RUNNER_TEMP-}"
  if [ -z "$trigger_tmp" ] || [ ! -d "$trigger_tmp" ]; then
    trigger_tmp=$(mktemp -d) || { echo "remote-run.sh: trigger: mktemp failed" >&2; exit "$EXIT_USAGE"; }
  fi

  if [ "$trigger_source" = dispatch ] && [ -z "$title" ]; then
    trigger_refuse "the dispatch's \`client_payload\` carries no \`title\`." \
      "Send it as \`{\"event_type\": \"$TRIGGER_DISPATCH_EVENT_TYPE\", \"client_payload\": {\"title\": …, \"body\": …, \"source\": …}}\`, with a non-empty \`title\`."
  fi

  if [ -n "${HARNESS_REMOTE_STOP-}" ]; then
    trigger_refuse "the repository variable \`HARNESS_REMOTE_STOP\` is set, which stops every start." \
      "Clear it under **Settings → Secrets and variables → Actions → Variables**, then $retry_then."
  fi

  forge=$(hr_forge "$root") || forge=""
  target=$(hr_execution_target "$root") || target=""
  if [ "$forge" != github ] || [ "$target" != github-actions ]; then
    trigger_refuse "the default branch's \`harness.config.json\` does not turn the $trigger_source trigger on: it needs \`forge\` set to \`github\` (it is ${forge:-not set or unreadable}) and \`execution.target\` set to \`github-actions\` (it is ${target:-unreadable})." \
      "Set both keys on the default branch, then $retry_then."
  fi

  if [ "$trigger_source" = issue ]; then
    if [ "$state" != open ]; then
      trigger_refuse "this issue is not open." "Reopen it, then re-apply the label \`$trigger_label\`."
    fi

    if [ "$login" = ghost ] || [ -z "$login" ] \
      || ! { [[ "$login" =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]] \
        || { [ "$sender_type" = Bot ] && [[ "$login" =~ ^[A-Za-z0-9][A-Za-z0-9-]*\[bot\]$ ]]; }; }; then
      trigger_refuse "the label was applied by an account GitHub does not name (a deleted account shows as \`ghost\`)." \
        "A collaborator with write access can re-apply the label \`$trigger_label\`."
    fi

    if [ "$sender_type" != User ]; then
      trigger_bot_listed "$login" || trigger_refuse \
        "@$login is not a person, and is not listed in the repository variable \`HARNESS_TRIGGER_ALLOWED_BOTS\`." \
        "Add \`$login\` to that comma-separated list to let it start runs, or have a collaborator with write access apply the label \`$trigger_label\`."
    else
      permission=""
      if gh_call api "repos/${GITHUB_REPOSITORY-}/collaborators/$login/permission"; then
        permission=$(printf '%s' "$GH_OUT" | jq -r '.permission // empty' 2>/dev/null) || permission=""
        case "$permission" in
          admin|write) ;;
          *) trigger_refuse "could not confirm write access for @$login: GitHub reports their permission as \`${permission:-nothing}\`." \
               "Only a collaborator with write, maintain or admin access starts a run by labelling an issue; one of them can re-apply the label \`$trigger_label\`." ;;
        esac
      else
        trigger_refuse "could not confirm write access for @$login: the permission check failed ($GH_ERR)." \
          "Re-apply the label \`$trigger_label\` to try again."
      fi
    fi
  fi

  # The name check reads origin/<defaultBranch>; a failed fetch leaves it to say so.
  default=$(hr_default_branch "$root") || default=""
  if [ -n "$default" ]; then
    git -C "$root" fetch --quiet origin "$default" >&2 || echo "remote-run.sh: trigger: fetching origin $default failed" >&2
  fi
  name_file=$(mktemp "$trigger_tmp/harness-trigger-branch.XXXXXX") || trigger_refuse \
    "the branch name could not be derived (mktemp failed)." "$retry_again"
  status=0
  hr_derive_branch "$root" "$title" "$fallback" >"$name_file" || status=$?
  branch=""
  IFS= read -r branch <"$name_file" || :
  rm -f "$name_file"
  case "$status" in
    0) ;;
    3) if [ "$trigger_source" = issue ]; then
         trigger_refuse "every branch name derived from this issue's title, through the suffix \`_99\`, is already taken." \
           "Retitle the issue, then re-apply the label \`$trigger_label\`."
       fi
       trigger_refuse "every branch name derived from the dispatch's \`title\`, through the suffix \`_99\`, is already taken." \
         "Send the dispatch again with another \`title\`." ;;
    *) trigger_refuse "the branch name for $task_what could not be checked (${HR_TAKEN_WHY:-no usable name})." \
         "$retry_again" ;;
  esac

  prompt=$(mktemp "$trigger_tmp/harness-trigger-prompt.XXXXXX") || trigger_finish "$EXIT_PLACEMENT" \
    "No run started: the task prompt for \`$branch\` could not be written. $retry_again"
  if [ "$trigger_source" = issue ]; then
    printf '# %s\n\n%s\n\n---\n\nStarted from %s by @%s, who applied the label `%s` at %s. This is the issue'"'"'s text at that moment; later edits to the issue do not reach this run.\n' \
      "$title" "$body" "$html_url" "$login" "$trigger_label" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$prompt"
  else
    [ -z "$source" ] || source=", from $source"
    printf '# %s\n\n%s\n\n---\n\nStarted by a repository_dispatch event of type `%s`%s at %s.\n' \
      "$title" "$body" "$TRIGGER_DISPATCH_EVENT_TYPE" "$source" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$prompt"
  fi

  errfile=$(mktemp "$trigger_tmp/harness-trigger-start.XXXXXX") || errfile=/dev/null
  status=0
  bash "$script_dir/remote-run.sh" start "$branch" --prompt-file "$prompt" --repo "$root" 2>"$errfile" || status=$?
  last=""
  if [ "$errfile" != /dev/null ]; then
    cat "$errfile" >&2
    last=$(grep -v '^[[:space:]]*$' "$errfile" | tail -n 1)
    rm -f "$errfile"
  fi
  case "$status" in
    0) ;;
    3)
      echo "remote-run.sh: trigger: $branch is pushed, but its dispatch failed" >&2
      trigger_finish "$EXIT_GH" "The branch \`$branch\` was pushed with $task_what, but dispatching its run failed:

\`\`\`
$last
\`\`\`

Start it by hand: **Actions → \`$WORKFLOW_RUN_FILE\` → Run workflow**, with \`action\` \`run\` and \`branch\` \`$branch\`." ;;
    *)
      echo "remote-run.sh: trigger: the start of $branch failed (exit $status)" >&2
      trigger_finish "$EXIT_PLACEMENT" "No run started: placing $task_what on the branch \`$branch\` failed:

\`\`\`
$last
\`\`\`

$retry_again" ;;
  esac

  url=$(trigger_run_url)
  if [ "$trigger_source" = issue ]; then
    echo "remote-run.sh: trigger: started $branch from issue #$issue_number: $url"
    trigger_finish "$EXIT_OK" "Started a harness run on the branch \`$branch\`: $url

The task is this issue's title and body as they were when the label \`$trigger_label\` was applied; later edits to the issue do not reach this run. Re-applying the label starts another run, on the next indexed branch."
  fi
  echo "remote-run.sh: trigger: started $branch from a repository_dispatch: $url"
  trigger_finish "$EXIT_OK" "Started a harness run on the branch \`$branch\`: $url

The task is the dispatch's \`client_payload\` title and body. Sending the same dispatch again starts another run, on the next indexed branch."
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
  start) verb_start ;;
  trigger) verb_trigger ;;
  adopt) verb_adopt ;;
esac
exit "$EXIT_OK"
