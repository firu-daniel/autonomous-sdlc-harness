#!/usr/bin/env bash
# remote-run.sh — every call from this machine to GitHub for a harness run: the
# one place a `gh workflow run` of the run workflow is composed, so the
# workflow's input contract has exactly one producer on the shell side.
#
# THE VERBS AND THE EXIT MAP, stated once for every consumer (the watcher's
# inbox pass, the job-side `continue` / `poll`, the guard's deny entry and the
# plugin commands that name this file):
#
#   remote-run.sh dispatch <branch> --engine <kind> [--resume none|answer|pause]
#                 [--answers-from <clar_dir> --indexes "<n> <n>..."]
#                 [--park-loop-clear] [--chain <n>] [--repo <root>]
#   remote-run.sh pause <branch> [--repo <root>]
#   remote-run.sh warm [--repo <root>]
#   remote-run.sh stop <branch> [--actor <login>] [--repo <root>]
#   remote-run.sh status <branch> [--repo <root>]
#   remote-run.sh sync <branch> [--repo <root>]
#   remote-run.sh fetch <branch> <out_dir> [--repo <root>]
#   remote-run.sh restore <branch> --resume none|answer|pause [--repo <root>]
#   remote-run.sh save <branch> <out_dir> [--repo <root>]
#   remote-run.sh continue <branch> <bundle_dir> [--repo <root>]
#   remote-run.sh poll [--repo <root>]
#   remote-run.sh pause-requested <branch> <since_epoch> [--repo <root>]
#   remote-run.sh run-created-at <run_id> [--repo <root>]
#   remote-run.sh start <branch> --prompt-file <file> [--repo <root>]
#   remote-run.sh review <branch> --review-file <file> [--allow-no-run]
#                 [--actor <login>] [--source <https-url>] [--repo <root>]
#   remote-run.sh trigger [--repo <root>]   (its own exit map: its paragraph)
#   remote-run.sh list [--repo <root>]
#   remote-run.sh discard <dir> [--repo <root>]
#   remote-run.sh report <event> <branch> [--note <text>] [--repo <root>]
#                 (always 0, 1 only on a usage error: its paragraph)
#   remote-run.sh deliver <branch> <bundle_dir> [--repo <root>]
#                 (always 0, 1 only on a usage error: its paragraph)
#   remote-run.sh control [--repo <root>]   (its own exit map: its paragraph)
#     0  sent (for stop: the action=stop marker was dispatched, and every
#        queued, waiting or in-progress `harness run` run of that branch was
#        asked to cancel, or there was none); for status and fetch: printed
#        (for fetch, `state: none` included); for sync: the record is
#        current (including "no run listed yet", which writes nothing); for
#        restore: restored, or no previous bundle of the branch's current
#        lineage (or an expired one, with a `::warning::` line) under
#        --resume none|pause;
#        for save: ALWAYS, whatever happened; for continue: whatever it
#        decided — every outcome a person must act on is a notification; for
#        poll: the tick finished; for pause-requested: such a run exists; for
#        run-created-at: printed; for review: placed, pushed and dispatched;
#        for list: printed; for discard: <dir> removed, or it did not exist
#     1  usage error, or the library or the configuration could not be
#        resolved; for fetch, <out_dir> is not an existing, empty directory;
#        for discard, <dir>'s parent does not resolve or the removal failed;
#        for sync and restore, a local copy or write failed; for
#        pause-requested, also NO such run — a caller that reads 1 as "no
#        pause" passes arguments it has already validated
#     2  refused, nothing sent or written: execution.target is not
#        github-actions (sending verbs, fetch, review and list); for
#        review, a protected branch, a review file that is not a readable
#        regular file, or a run in flight (its paragraph); for sync, the
#        branch's local record does not carry `execution: github-actions`; for
#        status, a local record that does not carry `execution:
#        github-actions`, or no record and `execution.target` not
#        `github-actions`; the record's mirror working copy is missing, or a
#        downloaded bundle is unrecognised (sync, restore, and status with no
#        local record); the inputs payload is over the limit; a named answer
#        file is missing (a relative --answers-from resolves against the
#        caller's directory). For restore under --resume answer, "nothing more":
#        no previous bundle of the branch's current lineage, the previous
#        bundle expired (the message names
#        its expiry and the resume command), `HARNESS_INPUT_ANSWERS` not an object of
#        positive-integer keys to strings, or an answer whose `question_<n>.md`
#        is not at the top level of the previous bundle — nothing is restored
#        and no answer is written. For discard, <dir> does not resolve
#        strictly inside `<state_dir>/scratch/`, is a symlink, or exists and
#        is not a directory; nothing removed
#     3  gh failed: not found, or a non-zero exit — the first line of gh's
#        stderr is named. For poll: the listing or the disable failed. For
#        pause-requested and run-created-at, also an answer that is not the
#        expected JSON; a caller never pauses on a failed read. For start, the
#        dispatch failed AFTER the branch and its task prompt were pushed; for
#        review, the listing failed, or the dispatch failed AFTER the review
#        was pushed. For
#        list, the listing or `git ls-remote` failed; nothing written
#     4  start: placement failed — the branch cut, the copy, the commit or the
#        push — and nothing was dispatched; the working copy and the local
#        branch the cut created were removed. review: placement failed — the
#        copy (the branch checked out in another working copy included), the
#        fast-forward, the commit or the push — and nothing was dispatched; a
#        copy it cut was removed
#
# `start` IS THE ADAPTERS' ONE ENTRY: every trigger (an issue event, a forge
# dispatch, anything later) reduces to a branch and a task text and ends here.
# In order, stopping at the first failure: refuse a protected branch (2); refuse
# a prompt file that is not a readable regular file (2); cut the branch from
# `origin/<defaultBranch>` with `create-worktree.sh --no-bootstrap`; place the
# file at `<state_dir>/task_prompts/<branch>_task_prompt.md` in that working
# copy (the state directory resolved there, never in the main checkout), commit
# it as `chore: add task prompt for <branch>` and confirm `origin/<branch>`
# equals `HEAD` (each failure 4); then remove the working copy and the local
# branch it created — on every exit after the cut, success included and
# wherever `start` runs, because nothing reads the copy once the push has landed
# and a leftover branch makes the next cut of that name refuse; a copy or branch
# that existed before the cut is never removed — and `dispatch --engine task
# --resume none --chain 0`, composed by `verb_dispatch` itself. The placement is the library's
# (`hr_task_prompt_rel`, `hr_place_artifact`, `hr_commit_placed`,
# `hr_push_landed`), the same calls the watcher's inbox pass makes, so nothing
# downstream can tell where a task came from. It writes no registry record: a
# trigger job has no registry, and such a run needs no local record: the local
# commands act on it through GitHub.
#
# `fetch` IS THE COMMANDS' READ OF ONE BRANCH ON GITHUB, needing no local
# record. Gated like a sending verb. <out_dir> must be an existing, empty
# directory. It reads the newest `harness run <branch>` run through the same
# derivation `sync` makes (`remote_state`), downloads that run's state bundle
# into <out_dir> when one applies, and prints these lines, each always present
# and empty when unknown — the key names are a wire the commands parse:
#   run_id:  run_url:  run_status:   the newest `harness run <branch>` run
#   state:           `none` when no such run is listed, else the derivation's
#   pause_reason:  engine:  detail:   from the derivation
#   open_questions:  space-separated <n> of every top-level
#                    `<out_dir>/clarifications/<branch>/question_<n>.md` with
#                    no `answer_<n>.md` beside it, ascending
#   bundle_dir:      <out_dir> when a bundle was downloaded
#
# `discard` REMOVES THE DIRECTORY A COMMAND FETCHED INTO, so the command needs
# no recursive `rm` of its own. It removes <dir> only when the library's
# `hr_scratch_path_var` accepts it: strictly inside the checkout's
# `<state_dir>/scratch/`, not a symlink, and a directory when it exists
# (2 otherwise). A relative <dir>
# resolves against the caller's directory; the root is `--repo`, or else
# `hr_repo_root` of the working directory, as for `restore`. No `gh` call and
# no `execution.target` gate. A <dir> that does not exist is exit 0. It
# creates nothing and writes nothing else.
#
# `review` PLACES A USER REVIEW ROUND ON THE BRANCH TIP AND DISPATCHES IT, for
# `/autonomous-sdlc-harness:branch-user-review` on a run that executes on
# GitHub. In order, stopping at the first failure: refuse a protected branch
# and a review file that is not a readable regular file (2; a relative
# --review-file resolves against the caller's directory); refuse a branch whose
# newest `harness run <branch>` run, by `remote_state`, is anything but
# `completed` or `failed` — none listed (unless --allow-no-run), `running`,
# `parked`, `park_loop` or `paused`, an expired bundle naming its expiry (2);
# the bundle it reads is
# downloaded to `sync`'s directory, the one write a refusal makes. The copy: the main
# checkout's remote record's mirror when its `worktree` exists and is on the
# branch, never removed; otherwise `create-worktree.sh --existing
# --no-bootstrap` into `hr_worktree_dir`, removed with the local branch it
# DWIM-created on every exit, as `start` removes its cut. Either copy is
# fast-forwarded to `origin/<branch>`. No bootstrap runs: the copy holds one
# placed file. The round comes from `git ls-tree` of the copy's `HEAD` under
# `<state_dir>/user_reviews/` — the engine's own round source: each basename
# matching `^(.+)_review(_[0-9]+)?\.md$` whose captured branch EQUALS <branch>,
# the unsuffixed file being round 1; next is `<branch>_review.md` when none
# matched, else `<branch>_review_<max+1>.md`. It is placed, committed as
# `hr_user_review_subject`'s `chore: add user review for <branch>` and pushed
# (each failure 4); the cut copy is removed; then `dispatch --engine
# user_review --resume none --chain 0`. A remote record, when one exists, is
# set `running` / `user_review` in one write after the dispatch. Then the round
# is reported as `report round` with the note `Round <round>`, plus ` from
# <source>` under --source, and ` by @<actor>` under --actor (a login, as for
# `stop`), else ` from a local session`.
# --allow-no-run EXISTS FOR A LOCALLY EXECUTED BRANCH REVIEWED ON GITHUB: such
# a branch has no `harness run <branch>` run, and its round runs through
# `WORKFLOW_RUN_FILE` because a GitHub-started round always does. Its local
# record carries no `execution: github-actions`, so it is neither read as the
# copy nor written; the round runs remotely, and the branch's local working
# copy falls behind `origin/<branch>` until the maintainer fast-forwards it.
# The flag widens only the none-listed refusal.
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
#   HARNESS_TRIGGER_LABEL   the trigger label; when empty, `DEFAULT_TRIGGER_LABEL`
#                        or `LEGACY_TRIGGER_LABEL`, per the paragraph below
#   HARNESS_TRIGGER_ALLOWED_BOTS   comma-separated bot logins allowed to start
#   HARNESS_TRIGGER_LOOKUP_SECS    seconds between run lookups; `5` when empty.
#                        A test seam
#   RUNNER_TEMP          where the prompt snapshot is written; a `mktemp -d`
#                        directory when empty
# THE LEGACY LABEL. The workflow `init` now writes always passes a non-empty
# `HARNESS_TRIGGER_LABEL`; only the previous release's workflow, which
# `init --upgrade-workflows` never re-renders, passes it empty, and its `if:`
# already ran the job for `LEGACY_TRIGGER_LABEL`. So when it is empty either
# `DEFAULT_TRIGGER_LABEL` or `LEGACY_TRIGGER_LABEL` is accepted, and the comment
# and the label removal name the one applied; a new workflow starts on
# `LEGACY_TRIGGER_LABEL` only when the variable names it.
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
# Refusals 4 to 6 are `authorise_actor`, the one actor check `control` reuses.
# Then it fetches `origin <defaultBranch>` (a failure tolerated), derives the
# branch with `hr_derive_branch <title> issue_<number>`, passing `gh` so a name
# with run-workflow history counts as taken (2 or 3 refused), writes
# the snapshot — `# <title>`, the body's bytes, `---` and a provenance sentence
# naming the issue, the labeller, the label and the time — and runs `start` as a
# child. After a start it looks up the `harness run <branch>` run whose
# `headSha` is the `origin/<branch>` commit `start` pushed, at most
# `TRIGGER_RUN_LOOKUP_TRIES` times, falling back to the branch's filtered run
# list, and comments the branch and that URL; the comment never names an older
# run of the branch. Every comment ends with the marker
# `<!-- sdlc-harness event=started branch=<branch> -->` on a start and
# `event=refused` otherwise (`branch=` empty before one is derived), and is
# followed by removing the label, so re-applying it is deliberate; then a start
# sets the state label `sdlc-harness: running`. That comment, that removal and
# that one label are the trigger's only writes to the issue; a refusal sets no
# label. A removal or a label set that fails is one `::warning::` line.
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
# `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT AND ONE STATE LABEL, through
# the forge surface (its section states the functions). Job-side for its root,
# as `trigger` is, and outside the sending-verb gate: it does nothing, with one
# line, unless `hr_forge` is `github` and `hr_execution_target` is
# `github-actions`. The comment goes to the open same-repository pull request
# whose head is <branch> when origin's <branch> carries
# `<state_dir>/flow_progress/<branch>_progress.md`, else to the issue named by
# the last `Started from <server>/<repo>/issues/<n> by @` line of its committed
# task prompt, else nowhere. The label `STATE_LABEL_PREFIX<state>` replaces any
# other state label on that issue and that pull request, each when known; the
# label is a view, and the run list stays the authority. The state map:
# `parked` and `park_loop` -> parked, `paused` -> paused, `resumed` -> running,
# `failed` -> failed, `stopped` -> stopped, `round` (review's) -> running.
# `failed` posts nothing when
# `remote_branch_stopped` finds the branch stopped, so a cancelled job never
# overwrites `stopped`. `completed` (deliver's) and `launched` (the trigger's
# own comment) are one line each, as is any other event. The comment names the
# next GitHub action — never a slash command — then <note> byte for byte, then
# this run's URL when `GITHUB_RUN_ID` is set, then the marker line
# `<!-- sdlc-harness event=<event> branch=<branch> -->`. The pause reason and
# reset come from the registry record, read only when the registry file exists.
# `parked` instead posts one comment per open question — `open_questions_in`
# over `$root`'s state directory, ascending — carrying `question_<n>.md` whole,
# cut at its last whole line within `QUESTION_COMMENT_MAX_BYTES` and then naming
# the file in the `STATE_ARTIFACT_NAME` artifact; then the answer form, a
# comment whose first line is `COMMAND_HANDLE answer <n>` (`<n>` optional when
# one question is open) and whose following lines are the answer; the marker
# adds `question=<n>`. With no question open it posts the one notice. The label
# is set once per target, not per question. On a public repository a question
# comment and its answer are public, as the artifact already is
# (`docs/remote-execution.md` -> `## 11. Security`, *What a reader of the
# repository's Actions runs can see*).
# It never fails its caller: every problem is one line and exit 0.
#
# `deliver` HANDS A COMPLETED RUN TO REVIEW: the run workflow's step after the
# job's own `push-branch.sh`, which opens no pull request. Job-side for its
# root and self-gated, as `report` is (`forge_on`, one line when off). Anything
# but `status: completed` in <bundle_dir>/status.json, or no status.json, is
# one line and nothing sent. Otherwise, by the forge surface: an open
# same-repository pull request whose head is <branch> is reused and no second
# one is opened; else a draft is created against `defaultBranch`, titled from
# the task prompt's `# ` first line (cut to `PR_TITLE_MAX_CHARS`, else
# <branch>), whose body names the issue as `Started from #<n>.` — a plain
# mention, never a closing keyword — states what a review requesting changes
# and the `COMMAND_HANDLE` commands do, and ends with the `pull-request`
# marker. The create runs with `HARNESS_PR_TOKEN` as `GH_TOKEN` when that is
# set, so the adopter's CI runs without an approval click; every other call
# uses the job's token. A pull request so opened is authored by that token's
# owner, who therefore cannot request changes on it: use a machine account's
# token, another reviewer, or a local `branch-user-review` round. A create
# refused with `PR_CREATE_FORBIDDEN` is not retried, and the comment names the
# Actions setting and `HARNESS_GIT_TOKEN`; any other failure is retried once
# without `--draft`, and a second failure is named in the comment with the
# branch's compare URL. A pull-request lookup that fails opens nothing. Then
# one `completed` comment: on the issue naming the new pull request's URL; on
# the pull request when there is no issue, or when it existed before this run
# (saying the round finished); on the issue alone when none could be opened;
# nowhere when neither is known. It names reviewing and requesting changes as
# the next action, and with `phases.qa` true the local `branch-qa-test` still
# owed. Then `sdlc-harness: done` on the issue and the pull request, each when
# known. It writes at most one pull request, one comment and those labels, and
# never pushes. It never fails its caller: every problem is one line and exit 0.
#
# `control` IS THE COMMENT AND REVIEW ADAPTER, the twin of `trigger` and the one
# step of the `WORKFLOW_CONTROL_FILE` job: one GitHub event -> one action on
# exactly one branch, carried out by this script's own verbs run as children,
# so it composes no dispatch itself. Job-side for its root, as `trigger` is,
# and outside the sending-verb gate: it gates itself after reading the event,
# so a refusal can still be replied to. The workflow's `if:` only saves a
# runner; every rule below holds without it. It handles `GITHUB_EVENT_NAME`
# `issue_comment` and `pull_request_review` (THE REVIEW, below); any other
# name, or an event file it cannot read, exits 1.
# It reads `.action`, `.comment.body`, `.issue.number`,
# `.issue.pull_request.url`, `.sender.login` and `.sender.type`, each by `jq`
# into a variable (data, never shell source), plus `trigger`'s environment.
# Ignored, with one line and no `gh` call: an action other than `created`; a
# body carrying `COMMENT_MARKER` anywhere (the harness's own comment, whoever
# posted it); and a body whose first line — a trailing CR stripped, leading
# spaces and tabs skipped — does not open with a word equal to
# `COMMAND_HANDLE`, compared lowercase. So `pause`, `Let's @sdlc-harness
# pause` and `> @sdlc-harness pause` start nothing. The verb is the next word,
# lowercased, and `CONTROL_ARGS` the rest of that line. Then refused, in this
# order, each a reply and exit 2:
#   1. `HARNESS_REMOTE_STOP` is set
#   2. `forge_on` fails — before any authorisation, so a disabled coupling asks
#      GitHub nothing about the commenter
#   3. `authorise_actor` fails: `AUTH_WHY`, and who may command a run
#   4. the verb is empty, not a `COMMAND_VERBS` word, or one no arm carries out
#      yet: the reply lists every command and names `docs/github-run-control.md`
# THE BRANCH. On a pull request (`.issue.pull_request.url` set), its head, by
# `pr view`: a fork's pull request is refused, because this event carries the
# repository's secrets, and nothing from its head is checked out or run; one
# not `OPEN` is refused. On an issue, the branch of the LAST genuine start
# comment, read by a paginated comment listing: its author is
# `github-actions[bot]`, its first line opens with the trigger's sentence
# `Started a harness run on the branch ` and a backticked <b>, and its last
# non-empty line is byte for byte what `forge_marker started <b>` prints. A
# marker quoted mid-body, in a comment not opening with that sentence, or by
# anyone else, is never trusted; none is a refusal. Both paths then pass
# `control_check_branch`: a branch `hr_branch_is_protected` does not answer 1
# for is refused, then it is fetched, and one whose origin tip carries no
# flow-progress ledger (`forge_recognised`) is not a harness branch.
# THE ARMS. `pause`: the state by a `fetch` child (`control_state_var`); only
# `running` sends `pause <branch>` as a child and replies that the run yields at
# its next clean checkpoint; any other state is a refusal naming it. `stop`:
# state `none` is a refusal; otherwise `stop <branch> --actor <login>` as a
# child, which posts its own `stopped` comment to the run's target; on 0 a reply
# is ALWAYS posted where the command was typed too, so a command on the issue of
# a branch with a pull request is answered there; on 3 the reply says the stop
# was partial and to comment `stop` again. `resume` accepts only `paused`, any
# `pause_reason` (`expired` and `killed` included); `park_loop` is refused
# pointing at `clear`, `parked` pointing at `answer <n>` with the open indexes,
# `running`, `completed`, `failed` and `none` each naming the state. `clear`
# accepts only `park_loop`, the GitHub form of `branch-resume`'s confirmation;
# any other state is a refusal naming it. Each sends the local relay's dispatch,
# `dispatch <branch> --engine <the state's engine> --resume pause --chain 0`,
# `clear` with `park_loop_clear` set, and no other command sets it. An empty
# engine is refused, never guessed (the `engine` input defaults to `task`),
# naming the Run workflow form. On 0 a reply, then `running` on the run's issue
# and pull request; on 2 a refusal and exit 2. `answer`: the first line is
# `answer <n>` and the answer every line below it, a trailing CR stripped from
# each line and its bytes otherwise unchanged; text after <n> on the first line
# is the answer when nothing follows below, and with no positive-integer <n>
# all of that line's text is. <n> may be left out only when exactly one
# question is open — issue comments have no threads. Refused, each a reply and
# exit 2: an empty answer; `park_loop` (pointing at `clear`); `paused` /
# `expired`, quoting its detail and pointing at `resume`, never treated as no
# park; `running`, naming the run, so a second answer never queues behind a job
# that a newer pending run in the per-branch `concurrency` group could cancel;
# any state but `parked`; no open question; several open and no <n>; an <n> not
# open, listing the open set; an empty engine, naming the Run workflow form.
# Otherwise the answer is written by `printf` (data, never shell source) to
# `answer_<n>.md` in a fresh directory under `RUNNER_TEMP`, and sent as
# `dispatch <branch> --engine <engine> --resume answer --answers-from <dir>
# --indexes <n> --chain 0`: one answer, one dispatch with one entry. That is
# safe because an `answer` job whose park is not fully answered stops parked
# before any session (`autonomous-watcher.sh` -> `run_job`), its bundle then
# carrying the `answer_<n>.md` restore wrote, so the next answer's job finds the
# set complete. The payload limit is `dispatch`'s alone: its refusal is quoted,
# with shortening the answer or committing it to a file on the branch as the
# way on. On 0 with no other question open, a reply that the run resumes and
# `running` on its issue and pull request; with others open, a reply naming
# them, and the label stays `parked`. An answer becomes a comment on the item,
# public on a public repository, as the question already is.
# THE REVIEW. A `pull_request_review` event reads `.action`, `.review.state`,
# `.review.body`, `.review.id`, `.review.html_url`, `.review.submitted_at`,
# `.pull_request.number`, `.pull_request.head.ref`,
# `.pull_request.head.repo.full_name`, `.sender.login` and `.sender.type`.
# Ignored, with one line and no `gh` call: an action other than `submitted`; a
# state other than `REVIEW_ROUND_STATE`, compared lowercase (the REST API
# reports it uppercase); a body carrying `COMMENT_MARKER`; and a head
# repository other than `GITHUB_REPOSITORY`, not even replied to, because a
# fork's review job holds a read-only token. So *Comment* and *Approve* start
# nothing, and draft status plays no part. Then gates 1-3 above, in order, each
# a reply on the pull request, and `control_check_branch` on the head; then a
# head whose origin tip carries no `<state>/story_plans/<head>_story_plan.md`
# is refused, because the round reads its story index. One submitted review is
# one round, built in a fresh file under `RUNNER_TEMP`: the body verbatim (or
# `(The review carries no summary.)`), a `---` line, the provenance sentence
# naming @<login>, the pull request, the review URL and `submitted_at`; then,
# when any is kept, `## Inline comments`. Those come from ONE paginated
# `pulls/<n>/comments` listing — never the per-review endpoint, which carries
# no `line` — keeping the reviewer's own comments that belong to this review or
# were created after the committer time of the branch's newest
# `user_reviews/<head>_review[_<n>].md` on origin (all of them when there is
# none), sorted by `created_at`; nobody else's. Each is a `### `<path>`, line
# <n>` heading (`original line <n> (outdated)` when `line` is null), `Made on
# commit `<original_commit_id or commit_id>`.`, its body verbatim, and its
# `diff_hunk` in a `diff` fence one backtick longer than the hunk's longest
# backtick run, at least three — the commit and hunk let the fix plan re-locate
# a line the fixes moved. Then `review <head> --review-file <file>
# --allow-no-run --actor <login> --source <review url>` runs as a child, which
# fast-forwards, commits `chore: add user review for <head>`, pushes,
# dispatches `engine: user_review` and reports the round itself. Its 0 is exit
# 0 with nothing more posted; 2 is a reply quoting its last line — adding that
# a round is in progress when that line names a running run — and exit 2; 3 a
# reply quoting the re-send line, exit 3; 4 a reply that placement failed and
# nothing was dispatched, exit 4. A refusal reads `@<login>: `review` was not
# run: …`.
# A child's failure is a reply
# naming its last stderr line, and exit 3. Every reply goes to the item the comment was
# typed on, opens `@<login>`, and carries the `reply` marker; a refusal reads
# `@<login>: `<verb>` was not run: <reason>. <way on>`.
#     0  handled (replied), or ignored
#     1  neither an `issue_comment` nor a `pull_request_review` event, or the event could not be read
#     2  refused (replied)
#     3  a `gh` step failed: the reply could not be posted (an `::error::`
#        line), or the action failed and was replied to
#     4  a review's round could not be placed; nothing was dispatched (replied)
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
# candidate run is an ordinary first job (exit 0, one line) except under
# --resume answer, whose refusal names the current lineage.
#
# THE CANDIDATES ARE BOUNDED TO THE BRANCH'S CURRENT LINEAGE, so a branch
# recreated under a reused name never restores an earlier, unrelated run's
# bundle. The listing reads each run's `headSha`, and `lineage_commits_var`
# lists `git rev-list refs/remotes/origin/<defaultBranch>..HEAD` in the job's
# checkout; a run whose `headSha` is not among those commits, or that carries
# none, is dropped before the walk, so the expired-bundle stop applies to
# lineage runs only. When any was dropped it prints `skipped <n> finished
# run(s) of <branch> from before its current lineage`. When the lineage cannot
# be listed — the configuration unreadable, `origin/<defaultBranch>` not
# present, or HEAD carrying no commit beyond it — every finished run is a
# candidate, as before the bound, and it prints `the lineage of <branch> is
# not bounded (<reason>); every finished run of it is a candidate`.
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
# `failed`, and each is then reported as `report` reports that event, with a
# note of its own that names no slash command and no shell command. A re-dispatch is `dispatch <branch> --engine <status.json engine>
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
# it started with, so where a record exists they test its `execution` field and
# never `execution.target`; the configuration is still read for `stateDir`.
# Only `status` with no record reads the key.
#
# `status` WITH NO LOCAL RECORD (no registry file, or no record of the branch)
# is gated like a sending verb and answers from GitHub alone: the same runs
# listing, then `remote_state` with the bundle downloaded into a `mktemp -d`
# directory removed on exit, printing the state, pause reason, detail, engine
# and run URL, each open question (the rule `fetch` states) with its `## Q<k>`
# heading lines; an expired bundle's expired line is its `detail`. No `harness run
# <branch>` run listed prints one line and exits 0. There is no sync to compare
# against, so no finished-since line.
#
# `list` IS `branch-status`'s DIGEST: one listing (`list_all_runs`) and one
# `git ls-remote --heads origin`, never a bundle. It prints `on GitHub, no
# local record: <branch> <url>` for each branch `unrecorded_runs` keeps — its
# newest run titled exactly `harness run <branch>`, no registry record,
# unprotected and a live head on origin — or `no run on GitHub without a local
# record`.
#
# `status` WITH A RECORD WRITES NOTHING AT ALL — no registry (it does not even
# create an absent one), no download, no file. It prints the branch's newest runs titled
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
#      `remote_run_url`, `remote_detail` and `remote_synced_at` written, and
#      `engine` when the bundle names `task`, `user_review` or `docs`. A
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
# `stop` DOES FOUR THINGS, IN THIS ORDER. (1) It ALWAYS dispatches action=stop
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
# and exits 3, so running `stop` again is the remedy. (4) A complete stop is then
# reported as `report stopped` with the note `Stopped by @<actor>.` under
# `--actor` (a login, the trigger's shape plus an optional `[bot]`; anything else
# is a usage error), else one naming a local stop; a partial stop reports
# nothing. The cancelled job's own `failed` is then posted nowhere, because
# `report` finds the branch stopped.
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
# inbox, and never watches a run it sent. Only `start` and `review` push, and
# only through `create-worktree.sh` and `push-branch.sh`; `start`'s writes are
# the prompt committed on `origin/<branch>`, through a working copy and a local
# branch it removes before it returns; `review`'s are the round committed on
# `origin/<branch>`, through the record's mirror or a copy and a local branch
# it removes, the record's `status` / `engine`, the bundle download
# directory `sync` uses, and `report`'s writes for the round. A user's chain-0 `dispatch --resume answer|pause`
# writes the record's `status`, `resumed_at` and `resume_kind` in one write
# when the main checkout's registry file exists and holds a record with
# `execution: github-actions`; any other `dispatch` writes nothing. `trigger` writes its snapshot and comment
# files under `RUNNER_TEMP`, one comment on the issue and the label removal, or
# for a dispatch event a block in the step summary. `report` writes its comment
# file under `RUNNER_TEMP` (removed), one comment and the state labels on the
# issue and the pull request, and nothing local. `deliver` writes its body and
# comment files under `RUNNER_TEMP` (removed), at most one pull request, one
# comment and the state labels. `control` writes its reply file and its
# `fetch` directory under `RUNNER_TEMP` (removed) and one reply comment, plus
# what the child verb it runs writes. `stop`, `continue` and `poll` also make
# `report`'s writes for each event they report. Every other verb's only writes are the
# registry record (`stop`, `sync`) and, for `sync`, the download directory
# `<state_dir>/autonomous_logs/remote_download/<branch>/<id>/` and
# `<branch>.remote.log` in the main checkout, plus the mirror restore
# `hr_remote_bundle_restore` performs in the record's `worktree`; for
# `restore`, that download directory, the job restore (the planning drafts
# among it), `answer_<n>.md` and the
# `park_loop_cycles` rewrite of `remote_status.json`, all in the job's
# checkout; for `save`, <out_dir> and the step summary; for `poll`, its
# download directories and `<state_dir>/autonomous_logs/poll_state/previous/`
# and `current/`. For `fetch`, <out_dir> only. For `discard`, the removal of
# <dir> only. `pause-requested`,
# `run-created-at`, `list` and `status` write nothing; a no-record `status`
# downloads into a temporary directory it removes on exit.
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
#   LEGACY_TRIGGER_LABEL         mirrors  LEGACY_TRIGGER_LABEL
#   HARNESS_TRIGGER_ALLOWED_BOTS mirrors  TRIGGER_ALLOWED_BOTS_VARIABLE
#   TRIGGER_DISPATCH_EVENT_TYPE  mirrors  TRIGGER_DISPATCH_EVENT_TYPE ('harness-task')
#   WORKFLOW_CONTROL_FILE        mirrors  WORKFLOW_CONTROL_FILE
#   COMMAND_HANDLE               mirrors  COMMAND_HANDLE
#   COMMAND_VERBS                mirrors  COMMAND_VERBS, space-separated
#   COMMENT_MARKER               mirrors  COMMENT_MARKER
#   REVIEW_ROUND_STATE           mirrors  REVIEW_ROUND_STATE
#   STATE_LABEL_PREFIX           mirrors  STATE_LABEL_PREFIX
#   RUN_STATES                   mirrors  RUN_STATES, space-separated, same order
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
#   review     after that start, a `run list` answer whose newest `harness run
#              feat_x` run is `completed` with a bundle saying `completed`:
#              bash scripts/remote-run.sh review feat_x --review-file /tmp/r.md
#              -> 0; origin/feat_x gains `chore: add user review for feat_x`
#                 placing feat_x_review.md, then one `-f engine=user_review`
#                 dispatch; no copy or local feat_x is left
#   in flight  the newest run `in_progress` -> 2, nothing pushed or sent
#   no run     no `harness run feat_x` run listed -> 2, nothing pushed; with
#              --allow-no-run -> 0, placed and dispatched as `review` above
#   reported   report's setup, then review ... --actor alice --source
#              https://github.com/o/r/pull/12#pullrequestreview-1 -> 0; one
#              comment on 7 naming `Round <n>`, the source and `@alice`, then
#              `sdlc-harness: running` on 7
#   fetch      t=$(mktemp -d); bash scripts/remote-run.sh fetch feat_x "$t"
#              -> 0; prints `state: running` (or, with no run listed,
#                 `state: none`), every other key present
#   discard    mkdir -p sdlc-harness/scratch/branch-pause-feat_x, then
#              bash scripts/remote-run.sh discard sdlc-harness/scratch/branch-pause-feat_x
#              -> 0, the directory gone; discard sdlc-harness/autonomous_logs
#              -> 2, nothing removed; no gh call either way
#
#   no record  with no registry, the "a bundle" stub below with question_1.md:
#              bash scripts/remote-run.sh status feat_x -> 0; prints `state:
#              parked` and `open question question_1.md`; nothing written
#   list       start's setup, a feat_x pushed to origin, no registry, and a
#              `run list` answer carrying `headBranch` feat_x, `displayTitle`
#              `harness run feat_x` and a `url`: bash scripts/remote-run.sh
#              list -> 0; prints `on GitHub, no local record: feat_x <url>`;
#              no registry is created
#   adopt      bash scripts/remote-run.sh adopt -> 1, an unknown verb; no gh
#              call, no registry
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
#   lineage    the checkout on feat_x one commit beyond origin/main, and a `run
#              list` answer holding only an older completed run whose `headSha`
#              is another commit: --resume none -> 0, prints `skipped 1 finished
#              run(s) of feat_x from before its current lineage` and `this is
#              its first job`, no `run download`
#   own lineage  that same branch plus a newer completed run whose `headSha`
#              is that commit -> that run's bundle is restored
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
#   {"action":"labeled","label":{"name":"sdlc-harness"},"sender":{"login":"alice",
#   "type":"User"},"issue":{"number":7,"title":"Add comments","body":"x",
#   "html_url":"https://github.com/o/r/issues/7","state":"open"}}, and a stub
#   answering `api repos/o/r/collaborators/alice/permission` with
#   {"permission":"write"}; export GITHUB_EVENT_NAME=issues GITHUB_EVENT_PATH=e.json
#   GITHUB_REPOSITORY=o/r HARNESS_TRIGGER_LOOKUP_SECS=0:
#   trigger    bash scripts/remote-run.sh trigger -> 0; origin/add_comments gains
#              the prompt commit, "$s.log" gains `workflow run harness-run.yml
#              --ref add_comments ...`, `issue comment 7 ...` naming the branch,
#              then `issue edit 7 ... --remove-label sdlc-harness`
#   read       the permission answer {"permission":"read"} -> 2, no `workflow
#              run`, one comment naming write access, the label removed
#   ignored    e.json's label name `bug` -> 0, one line, "$s.log" unchanged
#   dispatch   GITHUB_EVENT_NAME=repository_dispatch GITHUB_RUN_ID=9
#              GITHUB_STEP_SUMMARY=/tmp/s, e.json {"action":<TRIGGER_DISPATCH_EVENT_TYPE>,
#              "client_payload":{"title":"Add tags","body":"x","source":"jira"}}
#              -> 0; `workflow run ... --ref add_tags ...`, /tmp/s names
#              add_tags, no `issue` call; without "title" -> 2, no `workflow run`
#
#   report needs trigger's setup, a branch feat_x pushed carrying its task
#   prompt (ending in a `Started from https://github.com/o/r/issues/7 by @alice`
#   line) and `flow_progress/feat_x_progress.md`, and a stub answering `pr
#   list` and `api repos/o/r/issues/7/labels` with []; GITHUB_REPOSITORY=o/r:
#   paused     bash scripts/remote-run.sh report paused feat_x -> 0; "$s.log"
#              gains `api --method POST repos/o/r/issues/7/comments -F body=@…`
#              naming `@sdlc-harness resume`, then `api --method POST
#              repos/o/r/issues/7/labels -f labels[]=sdlc-harness: paused`
#   forge off  `"forge": "none"`, then the same -> 0, one line, "$s.log" unchanged
#
#   deliver needs report's setup, a stub answering the create with
#   https://github.com/o/r/pull/12, and <b> a bundle directory whose status.json
#   carries schema "1" and status completed:
#   deliver    bash scripts/remote-run.sh deliver feat_x <b> -> 0; "$s.log" gains
#              a `--draft` create with `--base main --head feat_x`, then one
#              comment on issue 7 naming /pull/12, then `sdlc-harness: done` on
#              7 and 12
#   not done   status parked, or an empty <b> -> 0, one line, "$s.log" unchanged
#
#   control needs report's setup, a stub answering `pr view 12 ...` with
#   {"headRefName":"feat_x","isCrossRepository":false,"state":"OPEN"}, the
#   permission call with {"permission":"write"}, and `run list` with an
#   `in_progress` `harness run feat_x` run; an event file c.json
#   {"action":"created","comment":{"body":"@sdlc-harness pause"},"issue":{"number":12,
#   "pull_request":{"url":"x"}},"sender":{"login":"alice","type":"User"}};
#   export GITHUB_EVENT_NAME=issue_comment GITHUB_EVENT_PATH=c.json GITHUB_REPOSITORY=o/r:
#   pause      bash scripts/remote-run.sh control -> 0; "$s.log" gains `workflow
#              run harness-run.yml --ref feat_x -f action=pause -f branch=feat_x`,
#              then one comment on 12 naming @alice
#   ignored    c.json's body `Let's @sdlc-harness pause` -> 0, one line,
#              "$s.log" unchanged

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
DEFAULT_TRIGGER_LABEL='sdlc-harness'
LEGACY_TRIGGER_LABEL='harness'
TRIGGER_DISPATCH_EVENT_TYPE='harness-task'
WORKFLOW_CONTROL_FILE='harness-control.yml'
COMMAND_HANDLE='@sdlc-harness'
COMMAND_VERBS='answer pause resume stop clear'
COMMENT_MARKER='<!-- sdlc-harness'
REVIEW_ROUND_STATE='changes_requested'
STATE_LABEL_PREFIX='sdlc-harness: '
RUN_STATES='running parked paused done failed stopped'
# The most bytes of a question file one park comment carries. An issue comment
# holds 262,144 bytes of UTF-8, and the refusal text's character count is not
# to be trusted (docs/github-integration-research.md -> S6); the margin is the
# framing lines and the marker.
QUESTION_COMMENT_MAX_BYTES=250000
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
  echo "       remote-run.sh stop <branch> [--actor <login>] [--repo <root>]" >&2
  echo "       remote-run.sh status <branch> [--repo <root>]" >&2
  echo "       remote-run.sh sync <branch> [--repo <root>]" >&2
  echo "       remote-run.sh fetch <branch> <out_dir> [--repo <root>]" >&2
  echo "       remote-run.sh restore <branch> --resume none|answer|pause [--repo <root>]" >&2
  echo "       remote-run.sh save <branch> <out_dir> [--repo <root>]" >&2
  echo "       remote-run.sh continue <branch> <bundle_dir> [--repo <root>]" >&2
  echo "       remote-run.sh poll [--repo <root>]" >&2
  echo "       remote-run.sh pause-requested <branch> <since_epoch> [--repo <root>]" >&2
  echo "       remote-run.sh run-created-at <run_id> [--repo <root>]" >&2
  echo "       remote-run.sh start <branch> --prompt-file <file> [--repo <root>]" >&2
  echo "       remote-run.sh review <branch> --review-file <file> [--allow-no-run] [--actor <login>] [--source <https-url>] [--repo <root>]" >&2
  echo "       remote-run.sh trigger [--repo <root>]" >&2
  echo "       remote-run.sh list [--repo <root>]" >&2
  echo "       remote-run.sh discard <dir> [--repo <root>]" >&2
  echo "       remote-run.sh report <event> <branch> [--note <text>] [--repo <root>]" >&2
  echo "       remote-run.sh deliver <branch> <bundle_dir> [--repo <root>]" >&2
  echo "       remote-run.sh control [--repo <root>]" >&2
  [ "${verb-}" != save ] || exit "$EXIT_OK"
  exit "$EXIT_USAGE"
}

# gh_call <args...> — run gh once with a fixed argument vector. Its stdout is
# left in GH_OUT; on failure GH_ERR holds the first line of its stderr (or a
# not-found line) and the return is non-zero.
GH_OUT=""
GH_ERR=""
gh_call() {
  gh_run 0 "" "$@"
}

# gh_call_token <token> <args...> — gh_call with GH_TOKEN set to <token> for
# that one gh process only; every other call keeps the environment's token.
gh_call_token() {
  local token="$1"
  shift
  gh_run 1 "$token" "$@"
}

# gh_run <0|1> <token> <args...> — gh_call's body; with 1, GH_TOKEN is a prefix
# assignment on the external command, never on a function, so it cannot leak.
gh_run() {
  local with_token="$1" token="$2" errfile status
  shift 2
  GH_OUT=""
  GH_ERR=""
  if ! command -v "$GH" >/dev/null 2>&1; then
    GH_ERR="gh not found: '$GH'"
    return 127
  fi
  errfile=$(mktemp) || { GH_ERR="mktemp failed"; return 1; }
  if [ "$with_token" = 1 ]; then
    GH_OUT=$(GH_TOKEN="$token" "$GH" "$@" 2>"$errfile")
  else
    GH_OUT=$("$GH" "$@" 2>"$errfile")
  fi
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
  dispatch|pause|warm|stop|status|sync|fetch|restore|save|continue|poll|pause-requested|run-created-at|start|review|trigger|list|discard|report|deliver|control) ;;
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
review_file=""
discard_dir=""
discard_base=""
report_event=""
report_note=""
actor_arg=""
source_arg=""
allow_no_run=0

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
    --review-file)
      [ "$verb" = review ] || usage "$1 is a review option"
      [ "$#" -ge 2 ] && [ -n "$2" ] || usage "$1 needs a value"
      review_file="$2"; shift 2 ;;
    --note)
      [ "$verb" = report ] || usage "$1 is a report option"
      [ "$#" -ge 2 ] || usage "$1 needs a value"
      report_note="$2"; shift 2 ;;
    --actor)
      [ "$verb" = stop ] || [ "$verb" = review ] || usage "$1 is a stop or review option"
      [ "$#" -ge 2 ] && [ -n "$2" ] || usage "$1 needs a value"
      actor_arg="$2"; shift 2 ;;
    --source)
      [ "$verb" = review ] || usage "$1 is a review option"
      [ "$#" -ge 2 ] && [ -n "$2" ] || usage "$1 needs a value"
      source_arg="$2"; shift 2 ;;
    --allow-no-run)
      [ "$verb" = review ] || usage "$1 is a review option"
      allow_no_run=1; shift ;;
    -*)
      usage "unknown option '$1'" ;;
    *)
      [ "$verb" != warm ] && [ "$verb" != poll ] && [ "$verb" != trigger ] \
        && [ "$verb" != list ] && [ "$verb" != control ] || usage "$verb takes no branch"
      if [ "$verb" = run-created-at ]; then
        [ -z "$run_id_arg" ] || usage "unexpected argument '$1'"
        run_id_arg="$1"
      elif [ "$verb" = discard ]; then
        [ -z "$discard_dir" ] || usage "unexpected argument '$1'"
        discard_dir="$1"
      elif [ "$verb" = report ] && [ -z "$report_event" ]; then
        report_event="$1"
      elif [ -z "$branch" ]; then
        branch="$1"
      elif [ "$verb" = pause-requested ] && [ -z "$since_arg" ]; then
        since_arg="$1"
      elif { [ "$verb" = save ] || [ "$verb" = fetch ]; } && [ -z "$out_dir" ]; then
        out_dir="$1"
      elif { [ "$verb" = continue ] || [ "$verb" = deliver ]; } && [ -z "$bundle_dir" ]; then
        bundle_dir="$1"
      else
        usage "unexpected argument '$1'"
      fi
      shift ;;
  esac
done

if [ "$verb" != warm ] && [ "$verb" != poll ] && [ "$verb" != run-created-at ] && [ "$verb" != trigger ] \
  && [ "$verb" != list ] && [ "$verb" != discard ] && [ "$verb" != control ]; then
  valid_branch "$branch" || usage "$verb needs a <branch>"
fi

if [ "$verb" = discard ] && [ -z "$discard_dir" ]; then
  usage "discard needs a <dir>"
fi

# The event lands in the comment marker, so it is a word.
if [ "$verb" = report ] && ! [[ "$report_event" =~ ^[a-z][a-z_]*$ ]]; then
  usage "report needs an <event> of lowercase letters and underscores"
fi

# The actor lands in the stop or round comment, so it is a login: the trigger's shape.
if [ -n "$actor_arg" ] && ! [[ "$actor_arg" =~ ^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$ ]]; then
  usage "--actor needs a GitHub login"
fi

# The source lands in the round comment as a link.
if [ -n "$source_arg" ]; then
  case "$source_arg" in
    https://*) ;;
    *) usage "--source needs an https:// URL" ;;
  esac
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

if { [ "$verb" = continue ] || [ "$verb" = deliver ]; } && [ -z "$bundle_dir" ]; then
  usage "$verb needs a <bundle_dir>"
fi

if [ "$verb" = save ] && [ -z "$out_dir" ]; then
  usage "save needs an <out_dir>"
fi

if [ "$verb" = fetch ] && [ -z "$out_dir" ]; then
  usage "fetch needs an <out_dir>"
fi

if [ "$verb" = review ] && [ -z "$review_file" ]; then
  usage "review needs --review-file"
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

# setup_fail <message> — a configuration problem: exit 1, except for save,
# report and deliver, which never fail the step that calls them.
setup_fail() {
  echo "remote-run.sh: $1" >&2
  [ "$verb" != save ] && [ "$verb" != report ] && [ "$verb" != deliver ] || exit "$EXIT_OK"
  exit "$EXIT_USAGE"
}

if [ -n "$repo_arg" ]; then
  root=$(hr_repo_root "$repo_arg") || setup_fail "'$repo_arg' is not a git repository"
elif [ "$verb" = restore ] || [ "$verb" = save ] || [ "$verb" = continue ] || [ "$verb" = poll ] \
  || [ "$verb" = pause-requested ] || [ "$verb" = run-created-at ] || [ "$verb" = trigger ] \
  || [ "$verb" = discard ] || [ "$verb" = report ] || [ "$verb" = deliver ] || [ "$verb" = control ]; then
  root=$(hr_repo_root "${PWD-.}") || setup_fail "'${PWD-.}' is not inside a git repository"
else
  root=$(hr_main_repo "${PWD-.}") || setup_fail "'${PWD-.}' is not inside a git repository"
fi

hr_config_load "$root" || :
registry=""
status_no_record=0
case "$verb" in
  restore|save|continue|poll|discard)
    hr_state_path "$root" >/dev/null || setup_fail "cannot resolve '$root/harness.config.json'"
    ;;
  pause-requested|run-created-at)
    # Read verbs: no gate, and nothing of the configuration is read.
    ;;
  trigger|control)
    # Gates itself, after reading the event, so a refusal can still be commented.
    ;;
  report|deliver)
    # Gates itself (`forge_on`) and exits 0 on every outcome.
    ;;
  status|sync)
    registry=$(hr_state_path "$root" autonomous_logs/registry.json) || {
      echo "remote-run.sh: cannot resolve '$root/harness.config.json'" >&2
      exit "$EXIT_USAGE"
    }
    # Tested with -f first: hr_registry_get creates an absent registry, and
    # status writes nothing.
    if [ "$verb" = status ] && { [ ! -f "$registry" ] || [ -z "$(hr_registry_get "$registry" "$branch" branch)" ]; }; then
      # No record: GitHub alone answers, behind the sending verbs' gate.
      status_no_record=1
      target=$(hr_execution_target "$root") || {
        echo "remote-run.sh: cannot resolve '$root/harness.config.json' (or execution.target is outside its enum)" >&2
        exit "$EXIT_USAGE"
      }
      if [ "$target" != github-actions ]; then
        echo "remote-run.sh: refused, nothing sent: execution.target is '$target', not github-actions" >&2
        exit "$EXIT_REFUSED"
      fi
    elif [ ! -f "$registry" ] || [ "$(hr_registry_get "$registry" "$branch" execution)" != github-actions ]; then
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
case "$review_file" in
  ''|/*) ;;
  *) review_file="${PWD-.}/$review_file" ;;
esac
case "$answers_from" in
  ''|/*) ;;
  *) answers_from="${PWD-.}/$answers_from" ;;
esac
if [ "$verb" = fetch ]; then
  case "$out_dir" in
    /*) ;;
    *) out_dir="${PWD-.}/$out_dir" ;;
  esac
fi
# Kept apart from <dir>, so the library's character tests see it as typed.
[ "$verb" != discard ] || discard_base="${PWD-.}"

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

  # A user's resume: the main checkout's remote record, when one exists, is
  # running now.
  if [ "$((10#$chain))" -eq 0 ] && { [ "$resume" = answer ] || [ "$resume" = pause ]; }; then
    local reg
    reg=$(hr_state_path "$root" autonomous_logs/registry.json) || reg=""
    if remote_record_exists "$reg"; then
      hr_registry_set "$reg" "$branch" status running resumed_at "$(date '+%Y-%m-%dT%H:%M:%S')" resume_kind "$resume" \
        || echo "remote-run.sh: dispatched, but the local record of $branch could not be updated" >&2
    fi
  fi
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
  if [ -n "$actor_arg" ]; then
    forge_report stopped "$branch" "Stopped by @$actor_arg."
  else
    forge_report stopped "$branch" "Stopped from a local \`remote-run.sh stop\`."
  fi
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

# open_questions_in <bundle_dir> — OPEN_QUESTIONS: the space-separated <n>,
# ascending, of every top-level `clarifications/<branch>/question_<n>.md` in the
# bundle with no `answer_<n>.md` beside it.
OPEN_QUESTIONS=""
open_questions_in() {
  local clar f n
  OPEN_QUESTIONS=""
  hr_remote_names_var
  clar="$1/$HR_REMOTE_CLARIFY_DIR/$branch"
  for f in "$clar"/question_*.md; do
    [ -f "$f" ] || continue
    n="${f##*/question_}"
    n="${n%.md}"
    [[ "$n" =~ ^[0-9]+$ ]] || continue
    [ -e "$clar/answer_$n.md" ] || OPEN_QUESTIONS="$OPEN_QUESTIONS $n"
  done
  if [ -n "$OPEN_QUESTIONS" ]; then
    OPEN_QUESTIONS=$(printf '%s\n' $OPEN_QUESTIONS | sort -n | tr '\n' ' ')
    OPEN_QUESTIONS="${OPEN_QUESTIONS% }"
  fi
}

# status_from_github — `status` with no local record: the newest run's state
# read through `remote_state` into a temporary directory removed on exit.
status_tmp=""
status_from_github() {
  local n
  if [ -z "$(titled_runs "harness run $branch" | jq -c '.[0] // empty')" ]; then
    echo "remote-run.sh: no local record, and no run titled 'harness run $branch' on GitHub"
    return 0
  fi
  echo "remote-run.sh: no local record; state from GitHub (newest run):"
  status_tmp=$(mktemp -d) || { echo "remote-run.sh: cannot create a temporary directory" >&2; exit "$EXIT_USAGE"; }
  trap 'rm -rf "$status_tmp"' EXIT
  remote_state "$status_tmp"
  printf '  state: %s\n' "$RS_STATE"
  printf '  pause_reason: %s\n' "$RS_PAUSE_REASON"
  printf '  detail: %s\n' "$RS_DETAIL"
  printf '  engine: %s\n' "$RS_ENGINE"
  printf '  run_url: %s\n' "$RS_RUN_URL"
  if [ "$RS_BUNDLE" -eq 1 ]; then
    open_questions_in "$status_tmp"
    for n in $OPEN_QUESTIONS; do
      echo "remote-run.sh: open question question_$n.md"
      grep -E '^## Q[0-9]+' "$status_tmp/$HR_REMOTE_CLARIFY_DIR/$branch/question_$n.md" | sed 's/^/  /'
    done
  fi
}

verb_status() {
  local runs finished_id synced_id field
  list_runs
  runs=$(titled_runs "harness run $branch" "harness pause $branch") || runs='[]'
  echo "remote-run.sh: runs of $WORKFLOW_RUN_FILE for $branch, newest first:"
  printf '%s' "$runs" | jq -r --argjson n "$STATUS_RUNS_SHOWN" '
    if length == 0 then "  (none)" else
    .[:$n][] | "  \(.databaseId)  \(.displayTitle)  \(.status)/\(.conclusion // "")  \(.createdAt)  \(.url)" end'
  if [ "$status_no_record" -eq 1 ]; then
    status_from_github
    return 0
  fi
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

# remote_state <download_dir> [<applied_run_id>] — the one derivation of a
# branch's newest remote state, from list_runs' answer in GH_OUT; `sync`,
# `fetch`, `review` and `status` with no local record all call it. RS_STATE is `none` (no `harness run
# <branch>` run listed), `running` (the newest is not `completed`), `applied`
# (its id is <applied_run_id>: `sync`'s case 1, decided there), or the state
# of `sync`'s cases 2-5, which it derives in that order. A bundle is downloaded
# into <download_dir> — `sync`'s per-run directory under the main checkout when
# empty — skipped when that directory already holds its status.json, and
# RS_BUNDLE is then 1. <applied_run_id>, when set, also counts as a bundle
# existing for case 4. Exits 3 when gh fails, 2 for an unrecognised bundle.
RS_RUNS=""
RS_RUN_ID=""
RS_RUN_URL=""
RS_GH_STATUS=""
RS_STATE=""
RS_PAUSE_REASON=""
RS_DETAIL=""
RS_ENGINE=""
RS_USAGE_RESUME_AT=""
RS_PARK_LOOP_CYCLES=""
RS_BUNDLE=0
RS_DOWNLOAD=""
remote_state() {
  local download="${1-}" applied="${2-}" newest status_file older bundle_exists=0
  RS_RUNS=""; RS_RUN_ID=""; RS_RUN_URL=""; RS_GH_STATUS=""; RS_STATE=""
  RS_PAUSE_REASON=""; RS_DETAIL=""; RS_ENGINE=""; RS_USAGE_RESUME_AT=""
  RS_PARK_LOOP_CYCLES=""; RS_BUNDLE=0; RS_DOWNLOAD=""
  RS_RUNS=$(titled_runs "harness run $branch") || RS_RUNS='[]'
  newest=$(printf '%s' "$RS_RUNS" | jq -c '.[0] // empty')
  if [ -z "$newest" ]; then
    RS_STATE=none
    return 0
  fi
  RS_RUN_ID=$(printf '%s' "$newest" | jq -r '.databaseId | tostring')
  RS_GH_STATUS=$(printf '%s' "$newest" | jq -r '.status // ""')
  RS_RUN_URL=$(printf '%s' "$newest" | jq -r '.url // ""')
  if [ "$RS_GH_STATUS" != completed ]; then
    RS_STATE=running
    return 0
  fi
  if [ -n "$applied" ] && [ "$RS_RUN_ID" = "$applied" ]; then
    RS_STATE=applied
    return 0
  fi

  # Case 2 — its bundle has expired.
  bundle_state "$RS_RUN_ID"
  if [ "$BUNDLE_STATE" = expired ]; then
    RS_STATE=paused
    RS_PAUSE_REASON=expired
    RS_DETAIL=$(expired_line "$RS_RUN_ID")
    return 0
  fi

  # Case 3 — a bundle.
  if [ "$BUNDLE_STATE" = present ]; then
    hr_remote_names_var
    if [ -z "$download" ]; then
      download=$(hr_state_path "$root" "autonomous_logs/remote_download/$branch/$RS_RUN_ID") || {
        echo "remote-run.sh: cannot resolve '$root/harness.config.json'" >&2
        exit "$EXIT_USAGE"
      }
    fi
    RS_DOWNLOAD="$download"
    status_file="$download/$HR_REMOTE_STATUS_FILE"
    if [ ! -f "$status_file" ]; then
      mkdir -p "$download" || { echo "remote-run.sh: cannot create '$download'" >&2; exit "$EXIT_USAGE"; }
      gh_call run download "$RS_RUN_ID" -n "$STATE_ARTIFACT_NAME" -D "$download" || gh_fail "downloading the bundle of run $RS_RUN_ID failed"
    fi
    RS_BUNDLE=1
    RS_STATE=$(hr_remote_status_get "$status_file" status) || RS_STATE=""
    case "$RS_STATE" in
      running|parked|park_loop|paused|completed|failed) ;;
      *)
        echo "remote-run.sh: refused, nothing written: the bundle in '$download' is unrecognised" >&2
        exit "$EXIT_REFUSED"
        ;;
    esac
    RS_PAUSE_REASON=$(hr_remote_status_get "$status_file" pause_reason) || RS_PAUSE_REASON=""
    RS_DETAIL=$(hr_remote_status_get "$status_file" detail) || RS_DETAIL=""
    if [ "$RS_STATE" = running ]; then
      RS_STATE=paused
      RS_PAUSE_REASON=killed
      RS_DETAIL="the job ended mid-run (its bundle still says running): $RS_RUN_URL"
    fi
    RS_USAGE_RESUME_AT=$(hr_remote_status_get "$status_file" usage_resume_at) || RS_USAGE_RESUME_AT=""
    RS_PARK_LOOP_CYCLES=$(hr_remote_status_get "$status_file" park_loop_cycles) || RS_PARK_LOOP_CYCLES=""
    RS_ENGINE=$(hr_remote_status_get "$status_file" engine) || RS_ENGINE=""
    return 0
  fi

  # Case 4 — no bundle, while some bundle exists.
  if [ -n "$applied" ]; then
    bundle_exists=1
  else
    for older in $(printf '%s' "$RS_RUNS" | jq -r '.[1:][] | select(.status == "completed") | .databaseId | tostring'); do
      if has_bundle "$older"; then bundle_exists=1; break; fi
    done
  fi
  if [ "$bundle_exists" -eq 1 ]; then
    RS_STATE=paused
    RS_PAUSE_REASON=killed
    RS_DETAIL="run $RS_RUN_ID ended with no state bundle (killed, cancelled or replaced): $RS_RUN_URL"
    return 0
  fi

  # Case 5 — no bundle in any run.
  RS_STATE=failed
  RS_DETAIL="no run of $branch ever uploaded a state bundle; newest: $RS_RUN_URL"
  return 0
}

verb_sync() {
  local worktree id url synced_id now download
  local status reason detail
  worktree=$(hr_registry_get "$registry" "$branch" worktree)
  if [ -z "$worktree" ] || [ ! -d "$worktree" ]; then
    echo "remote-run.sh: refused, nothing written: the mirror working copy '$worktree' of $branch is missing" >&2
    exit "$EXIT_REFUSED"
  fi
  list_runs
  synced_id=$(hr_registry_get "$registry" "$branch" remote_run_id)
  now=$(date +%s)
  remote_state "" "$synced_id"
  id="$RS_RUN_ID"
  url="$RS_RUN_URL"

  case "$RS_STATE" in
    none)
      echo "remote-run.sh: no run titled 'harness run $branch' is listed yet; the record is unchanged"
      return 0
      ;;
    running)
      set_many_or_fail status running remote_synced_at "$now"
      echo "remote-run.sh: run $id of $branch is $RS_GH_STATUS; the record is running, nothing downloaded"
      return 0
      ;;
    applied)
      # Case 1 — already applied. A record still waiting on this run's bundle
      # is re-checked: once it expires, the job can no longer take an answer.
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
      ;;
  esac

  # Case 2 — a newer run whose bundle has expired.
  if [ "$RS_PAUSE_REASON" = expired ] && [ "$RS_BUNDLE" -eq 0 ]; then
    sync_expired "$id" "$url" "$now"
    return 0
  fi

  # Case 3 — a newer run with a bundle.
  if [ "$RS_BUNDLE" -eq 1 ]; then
    download="$RS_DOWNLOAD"
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
    status="$RS_STATE"
    reason="$RS_PAUSE_REASON"
    detail="$RS_DETAIL"
    [ -n "$detail" ] || detail="synced from $url"
    if valid_engine "$RS_ENGINE"; then
      set_many_or_fail status "$status" pause_reason "$reason" usage_resume_at "$RS_USAGE_RESUME_AT" \
        park_loop_cycles "$RS_PARK_LOOP_CYCLES" remote_run_id "$id" remote_run_url "$url" \
        remote_detail "$detail" remote_synced_at "$now" engine "$RS_ENGINE"
    else
      set_many_or_fail status "$status" pause_reason "$reason" usage_resume_at "$RS_USAGE_RESUME_AT" \
        park_loop_cycles "$RS_PARK_LOOP_CYCLES" remote_run_id "$id" remote_run_url "$url" \
        remote_detail "$detail" remote_synced_at "$now"
    fi
    echo "remote-run.sh: synced run $id of $branch: $status${reason:+ ($reason)}"
    return 0
  fi

  # Case 4 — a newer run with no bundle, while some bundle exists.
  if [ "$RS_STATE" = paused ]; then
    set_many_or_fail status paused pause_reason killed remote_run_id "$id" remote_run_url "$url" \
      remote_detail "$RS_DETAIL" remote_synced_at "$now"
    echo "remote-run.sh: run $id of $branch left no bundle; the record is paused (killed), nothing restored"
    return 0
  fi

  # Case 5 — no bundle in any run.
  set_many_or_fail status failed remote_detail "$RS_DETAIL" remote_synced_at "$now"
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

# lineage_commits_var <checkout> — the branch's current lineage, read from refs
# alone: never a fetch, never gh, nothing on stdout. A run is of the current
# lineage when its `headSha` is a commit reachable from HEAD and not from
# `origin/<defaultBranch>`. The list is complete because `harness-run.yml`
# checks out with `fetch-depth: 0`. It survives the branch's own history
# edits because `refresh-branch.sh` merges and never rebases and
# `push-branch.sh` never forces, so every own run's `headSha` stays an ancestor
# of HEAD; a deleted, unmerged branch's commits are not ancestors of a branch
# recreated under its name. An empty list leaves the lineage unbounded.
# 0: LINEAGE_COMMITS holds the newline-separated full SHAs. 1: it is empty and
# LINEAGE_WHY names the reason.
LINEAGE_COMMITS=""
LINEAGE_WHY=""
lineage_commits_var() {
  local checkout="${1-}" default
  LINEAGE_COMMITS=""
  LINEAGE_WHY=""
  default=$(hr_default_branch "$checkout") && [ -n "$default" ] || {
    LINEAGE_WHY="the configuration could not be read"
    return 1
  }
  git -C "$checkout" rev-parse --verify --quiet "refs/remotes/origin/$default^{commit}" >/dev/null 2>&1 || {
    LINEAGE_WHY="origin/$default is not present"
    return 1
  }
  LINEAGE_COMMITS=$(git -C "$checkout" rev-list "refs/remotes/origin/$default..HEAD" 2>/dev/null) || LINEAGE_COMMITS=""
  [ -n "$LINEAGE_COMMITS" ] || {
    LINEAGE_WHY="HEAD carries no commit beyond origin/$default"
    return 1
  }
  return 0
}

# previous_bundle_run — PREV_RUN_ID is the newest finished `harness run
# <branch>` run, other than this job's own, carrying a state artifact, and
# PREV_RUN_STATE is `present`, `expired` or empty when no run carries one. When
# `lineage_commits_var` bounds the lineage, a run whose `headSha` is not in it
# (or that has none) is dropped before the walk and counted in LINEAGE_SKIPPED.
# A run with no artifact is walked past; an expired one stops the walk, because
# an older copy is staler state. Exits 3 when gh fails.
PREV_RUN_ID=""
PREV_RUN_STATE=""
LINEAGE_SKIPPED=0
previous_bundle_run() {
  local ids id out bounded=0
  PREV_RUN_ID=""
  PREV_RUN_STATE=""
  LINEAGE_SKIPPED=0
  lineage_commits_var "$root" && bounded=1
  gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" \
    --json databaseId,displayTitle,status,createdAt,headSha --limit "$RUN_LIST_LIMIT" \
    || gh_fail "listing the runs of '$branch' failed"
  # jq 1.5: membership by `any(gen; cond)`, not `index` / `IN`.
  out=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness run $branch" --arg self "${GITHUB_RUN_ID-}" \
    --arg bounded "$bounded" --arg lineage "$LINEAGE_COMMITS" '
    ($lineage | split("\n")) as $l
    | [.[] | select(.displayTitle == $t and .status == "completed" and (.databaseId | tostring) != $self)] as $done
    | [$done[] | select($bounded != "1" or ((.headSha // "") as $h | any($l[]; . == $h)))] as $kept
    | ((($done | length) - ($kept | length)) | tostring),
      ($kept | sort_by([.createdAt, .databaseId]) | reverse | .[].databaseId | tostring)' 2>/dev/null) || {
    GH_ERR="its run list is not the expected JSON"
    gh_fail "listing the runs of '$branch' failed"
  }
  LINEAGE_SKIPPED=$(printf '%s\n' "$out" | head -n 1)
  ids=$(printf '%s\n' "$out" | tail -n +2)
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
  if [ -n "$LINEAGE_WHY" ]; then
    echo "remote-run.sh: the lineage of $branch is not bounded ($LINEAGE_WHY); every finished run of it is a candidate"
  elif [ "${LINEAGE_SKIPPED:-0}" -gt 0 ]; then
    echo "remote-run.sh: skipped $LINEAGE_SKIPPED finished run(s) of $branch from before its current lineage"
  fi
  if [ "$PREV_RUN_STATE" = expired ]; then
    [ "$resume" != answer ] \
      || restore_refuse "the state bundle of run $id expired on $BUNDLE_EXPIRES_AT, so its questions can no longer be answered here: resume from the committed ledger with $RESUME_HINT $branch, or re-drop the task; nothing written"
    echo "::warning::remote-run.sh: the state bundle of run $id expired on $BUNDLE_EXPIRES_AT: the park-loop, auto-resume and stall counts, the clarification history and any planning drafts not yet committed that it carried are lost; this job continues from the committed ledger"
  elif [ -z "$id" ]; then
    [ "$resume" != answer ] \
      || restore_refuse "--resume answer, but no finished run of $branch's current lineage carries a state bundle; nothing written"
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

# notify <event> <branch> <detail> <forge_note> — one lifecycle notification,
# then `forge_report` of the same event; never fails. Every call site supplies
# both texts: <detail> is the push notification's, slash commands included;
# <forge_note> is the comment's, naming no slash command and no shell command,
# and states only what happened, since `forge_report` adds the next action.
notify() {
  if [ -n "${HARNESS_REMOTE_SLUG-}" ]; then
    HARNESS_REPO_SLUG="$HARNESS_REMOTE_SLUG"
    export HARNESS_REPO_SLUG
  fi
  bash "$script_dir/autonomous-notify.sh" "$1" "$2" "" "$3" \
    || echo "remote-run.sh: the $1 notification for $2 could not be sent" >&2
  echo "remote-run.sh: notified $1 for $2: $3"
  # stdin closed: `poll` calls this inside a loop reading its run list.
  forge_report "$1" "$2" "$4" </dev/null
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
# A `paused` report on a usage pause says the run resumes by itself; a note
# saying the automatic resume failed carries the action instead.
USAGE_RESUME_NOTE="Comment \`$COMMAND_HANDLE resume\` after the limit resets to continue."

continue_redispatch() {
  local status_file="$1" engine_value
  if [ -n "${HARNESS_REMOTE_STOP-}" ]; then
    notify paused "$branch" "Not re-dispatched: remote stop is set. Run $RESUME_HINT $branch to continue; $(hr_github_resume_route "$branch" "")." "Not continued: the repository variable \`HARNESS_REMOTE_STOP\` is set; clear it, then resume."
    return 0
  fi
  remote_branch_stopped "$branch"
  case $? in
    0) echo "remote-run.sh: $branch is stopped ($STOPPED_LINE); not re-dispatched"; return 0 ;;
    2) notify paused "$branch" "Not re-dispatched: the stop-marker check failed ($GH_ERR). Run $RESUME_HINT $branch to continue; $(hr_github_resume_route "$branch" "")." "Not continued: whether the run was stopped could not be checked ($GH_ERR)."; return 0 ;;
  esac
  if ! max_chain_var; then
    notify failed "$branch" "Not re-dispatched: HARNESS_MAX_CHAIN '$MAX_CHAIN' is not a non-negative integer." "Not continued: the repository variable \`HARNESS_MAX_CHAIN\` ('$MAX_CHAIN') is not a non-negative integer."
    return 0
  fi
  next_chain_var "$status_file"
  case $? in
    1) notify failed "$branch" "Not re-dispatched: chain unreadable in status.json." "Not continued: the chain count in the run's status could not be read."; return 0 ;;
    2) notify failed "$branch" "Not re-dispatched: chain limit reached ($NEXT_CHAIN over HARNESS_MAX_CHAIN $MAX_CHAIN)." "Not continued: the chain limit was reached ($NEXT_CHAIN over \`HARNESS_MAX_CHAIN\` $MAX_CHAIN)."; return 0 ;;
  esac
  engine_value=$(hr_remote_status_get "$status_file" engine) || engine_value=""
  if ! valid_engine "$engine_value"; then
    notify failed "$branch" "Not re-dispatched: engine '$engine_value' in status.json is not task, user_review or docs." "Not continued: the engine '$engine_value' in the run's status is not task, user_review or docs."
    return 0
  fi
  redispatch "$engine_value" "$NEXT_CHAIN" \
    || notify paused "$branch" "Re-dispatch failed ($REDISPATCH_ERR). Run $RESUME_HINT $branch to continue; $(hr_github_resume_route "$branch" "$engine_value")." "Not continued: dispatching the next job failed ($REDISPATCH_ERR)."
}

continue_wait_poller() {
  remote_branch_stopped "$branch"
  case $? in
    0) echo "remote-run.sh: $branch is stopped ($STOPPED_LINE); the resume poller is not enabled"; return 0 ;;
    2) notify paused "$branch" "Auto-resume not enabled: the stop-marker check failed ($GH_ERR). Run $RESUME_HINT $branch to continue; $(hr_github_resume_route "$branch" "")." "The automatic resume after the usage limit was not scheduled: whether the run was stopped could not be checked ($GH_ERR). $USAGE_RESUME_NOTE"; return 0 ;;
  esac
  if gh_call workflow enable "$WORKFLOW_RESUME_FILE"; then
    echo "remote-run.sh: enabled $WORKFLOW_RESUME_FILE for $branch"
  else
    notify paused "$branch" "Auto-resume is unavailable: enabling $WORKFLOW_RESUME_FILE failed ($GH_ERR). Run $RESUME_HINT $branch after the usage reset; $(hr_github_resume_route "$branch" "")." "The automatic resume after the usage limit could not be scheduled ($GH_ERR). $USAGE_RESUME_NOTE"
  fi
}

verb_continue() {
  local status_file decision
  hr_remote_names_var
  status_file="$bundle_dir/$HR_REMOTE_STATUS_FILE"
  if [ ! -f "$status_file" ]; then
    notify failed "$branch" "The job stopped before the harness run started: $(this_run_url)" "The job stopped before the run started: $(this_run_url)."
    return 0
  fi
  decision=$(hr_remote_status_get "$status_file" decision) || decision=""
  case "$decision" in
    continue) continue_redispatch "$status_file" ;;
    wait-poller) continue_wait_poller ;;
    stop) echo "remote-run.sh: decision stop for $branch; nothing to do" ;;
    *) notify failed "$branch" "Not re-dispatched: status.json carries no recognised decision: $(this_run_url)" "Not continued: the run's status carries no recognised decision." ;;
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
    1) [ "$may_dispatch" -eq 0 ] || notify failed "$branch" "Not resumed by the poller: chain unreadable in status.json." "Not resumed after the usage limit: the chain count in the run's status could not be read."; return 1 ;;
    2) [ "$may_dispatch" -eq 0 ] || notify failed "$branch" "Not resumed by the poller: chain limit reached ($NEXT_CHAIN over HARNESS_MAX_CHAIN $MAX_CHAIN)." "Not resumed after the usage limit: the chain limit was reached ($NEXT_CHAIN over \`HARNESS_MAX_CHAIN\` $MAX_CHAIN)."; return 1 ;;
  esac
  engine_value=$(hr_remote_status_get "$POLL_STATUS_FILE" engine) || engine_value=""
  if ! valid_engine "$engine_value"; then
    [ "$may_dispatch" -eq 0 ] || notify failed "$branch" "Not resumed by the poller: engine '$engine_value' in status.json is not task, user_review or docs." "Not resumed after the usage limit: the engine '$engine_value' in the run's status is not task, user_review or docs."
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
    notify paused "$branch" "The resume poller could not re-dispatch $branch ($REDISPATCH_ERR) after $failures attempts; automatic resume has stopped. Run $RESUME_HINT $branch; $(hr_github_resume_route "$branch" "$engine_value")." "Not resumed after the usage limit: dispatching the next job failed $failures times ($REDISPATCH_ERR), and the automatic resume has stopped."
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
  local b enable_err
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
  # Captured once: each notify's report overwrites GH_ERR.
  enable_err="$GH_ERR"
  for b in $POLL_WAITING; do
    notify paused "$b" "Auto-resume is unavailable: re-enabling $WORKFLOW_RESUME_FILE failed ($enable_err). Run $RESUME_HINT $b after the usage reset; $(hr_github_resume_route "$b" "")." "The automatic resume after the usage limit could not be scheduled ($enable_err). $USAGE_RESUME_NOTE"
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

# start_remove_copy — remove the working copy and the local branch `start`
# cut, and only those: `had_copy` / `had_branch` record what existed before the
# cut. Idempotent; a failed step is one stderr line and never changes the exit
# status already decided. `--force` because a failure exit may leave the placed,
# uncommitted prompt, which is only a copy of --prompt-file.
start_remove_copy() {
  if [ "$had_copy" -eq 0 ] && [ -e "$worktree" ]; then
    git -C "$root" worktree remove --force "$worktree" >/dev/null 2>&1 \
      || echo "remote-run.sh: could not remove the working copy '$worktree'" >&2
  fi
  git -C "$root" worktree prune >/dev/null 2>&1 \
    || echo "remote-run.sh: git worktree prune failed in '$root'" >&2
  if [ "$had_branch" -eq 0 ] && git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$root" branch -D "$branch" >/dev/null 2>&1 \
      || echo "remote-run.sh: could not delete the local branch '$branch'" >&2
  fi
  return 0
}

verb_start() {
  local protected=0 status=0 state_rel rel subject
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

  # Global, not local: the EXIT trap runs after this function's frame is gone.
  worktree=$(hr_worktree_dir "$root" "$branch") || placement_fail "resolving the working copy"
  had_copy=0
  [ ! -e "$worktree" ] || had_copy=1
  had_branch=0
  ! git -C "$root" show-ref --verify --quiet "refs/heads/$branch" || had_branch=1

  # The cut itself can leave a half-created copy, and every failure below exits.
  trap start_remove_copy EXIT
  bash "$script_dir/create-worktree.sh" --no-bootstrap "$branch" >&2 || status=$?
  [ "$status" -eq 0 ] || placement_fail "the branch cut (create-worktree.sh exited $status)"

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
  start_remove_copy
  trap - EXIT

  engine=task
  resume=none
  chain=0
  dispatch_fail_note="; $branch and its task prompt are already pushed to origin, so re-send with: remote-run.sh dispatch $branch --engine task"
  verb_dispatch
  echo "remote-run.sh: started $branch"
}

# ---------------------------------------------------------------------------
# `fetch` — the newest remote state of one branch, for the plugin commands.
# ---------------------------------------------------------------------------

verb_fetch() {
  local open_questions="" bundle_dir=""
  if [ ! -d "$out_dir" ]; then
    echo "remote-run.sh: fetch needs an existing directory, not '$out_dir'" >&2
    exit "$EXIT_USAGE"
  fi
  if [ -n "$(ls -A "$out_dir" 2>/dev/null)" ]; then
    echo "remote-run.sh: fetch needs an empty directory, and '$out_dir' is not" >&2
    exit "$EXIT_USAGE"
  fi
  list_runs
  remote_state "$out_dir"
  if [ "$RS_BUNDLE" -eq 1 ]; then
    bundle_dir="$out_dir"
    open_questions_in "$out_dir"
    open_questions="$OPEN_QUESTIONS"
  fi
  printf 'run_id: %s\n' "$RS_RUN_ID"
  printf 'run_url: %s\n' "$RS_RUN_URL"
  printf 'run_status: %s\n' "$RS_GH_STATUS"
  printf 'state: %s\n' "$RS_STATE"
  printf 'pause_reason: %s\n' "$RS_PAUSE_REASON"
  printf 'engine: %s\n' "$RS_ENGINE"
  printf 'detail: %s\n' "$RS_DETAIL"
  printf 'open_questions: %s\n' "$open_questions"
  printf 'bundle_dir: %s\n' "$bundle_dir"
}

# ---------------------------------------------------------------------------
# `review` — a user review round placed on the branch tip, then dispatched.
# ---------------------------------------------------------------------------

# review_fail <step> — exit 4, naming the step; nothing was dispatched.
review_fail() {
  echo "remote-run.sh: review of '$branch' failed at $1; nothing was dispatched" >&2
  exit "$EXIT_PLACEMENT"
}

# remote_record_exists <registry> — 0 when <registry> is a file holding a
# record of the branch with `execution: github-actions`. Tested with -f first:
# hr_registry_get creates an absent registry.
remote_record_exists() {
  [ -n "${1-}" ] && [ -f "$1" ] && [ "$(hr_registry_get "$1" "$branch" execution)" = github-actions ]
}

verb_review() {
  local protected=0 status=0 reg="" record_wt="" use_mirror=0 state_rel names name round max=0 next rel note
  hr_branch_is_protected "$root" "$branch" || protected=$?
  case "$protected" in
    0)
      echo "remote-run.sh: refused, nothing written: $branch is protected" >&2
      exit "$EXIT_REFUSED" ;;
    2)
      echo "remote-run.sh: refused, nothing written: cannot judge whether $branch is protected" >&2
      exit "$EXIT_REFUSED" ;;
  esac
  if [ ! -f "$review_file" ] || [ ! -r "$review_file" ]; then
    echo "remote-run.sh: refused, nothing written: the review file '$review_file' is not a readable regular file" >&2
    exit "$EXIT_REFUSED"
  fi

  # A run in flight takes no review: the local rule, `completed` or `failed` only.
  list_runs
  remote_state ""
  case "$RS_STATE" in
    completed|failed) ;;
    none)
      if [ "$allow_no_run" -eq 0 ]; then
        echo "remote-run.sh: refused, nothing written: no \`harness run $branch\` run on GitHub" >&2
        exit "$EXIT_REFUSED"
      fi ;;
    paused)
      if [ "$RS_PAUSE_REASON" = expired ]; then
        echo "remote-run.sh: refused, nothing written: $RS_DETAIL" >&2
      else
        echo "remote-run.sh: refused, nothing written: $branch is paused${RS_PAUSE_REASON:+ ($RS_PAUSE_REASON)} on GitHub; a review waits until its run is completed or failed" >&2
      fi
      exit "$EXIT_REFUSED" ;;
    *)
      echo "remote-run.sh: refused, nothing written: $branch is $RS_STATE on GitHub; a review waits until its run is completed or failed" >&2
      exit "$EXIT_REFUSED" ;;
  esac

  # The copy: the remote record's mirror when it is on the branch, never
  # removed; else a copy this verb cuts and removes on every exit.
  reg=$(hr_state_path "$root" autonomous_logs/registry.json) || reg=""
  if remote_record_exists "$reg"; then
    record_wt=$(hr_registry_get "$reg" "$branch" worktree)
    if [ -n "$record_wt" ] && [ -d "$record_wt" ] \
      && [ "$(git -C "$record_wt" symbolic-ref --short HEAD 2>/dev/null)" = "$branch" ]; then
      use_mirror=1
    fi
  fi
  if [ "$use_mirror" -eq 1 ]; then
    worktree="$record_wt"
  else
    # Global, not local: the EXIT trap runs after this function's frame is gone.
    worktree=$(hr_worktree_dir "$root" "$branch") || review_fail "resolving the working copy"
    had_copy=0
    [ ! -e "$worktree" ] || had_copy=1
    had_branch=0
    ! git -C "$root" show-ref --verify --quiet "refs/heads/$branch" || had_branch=1
    trap start_remove_copy EXIT
    bash "$script_dir/create-worktree.sh" --existing --no-bootstrap "$branch" >&2 || status=$?
    [ "$status" -eq 0 ] || review_fail "the working copy (create-worktree.sh exited $status)"
  fi
  # Also for a cut copy: a local branch that existed before may be behind origin.
  git -C "$worktree" fetch origin "$branch" >&2 || review_fail "git fetch origin $branch in '$worktree'"
  git -C "$worktree" merge --ff-only "origin/$branch" >&2 || review_fail "git merge --ff-only origin/$branch in '$worktree'"

  # The round, from the branch tip: the engine's own round source.
  state_rel=$(hr_state_dir "$worktree") || review_fail "resolving the state directory in '$worktree'"
  [ -n "$state_rel" ] || review_fail "resolving the state directory in '$worktree'"
  state_rel="${state_rel%/}"
  names=$(git -C "$worktree" ls-tree --name-only HEAD -- "$state_rel/user_reviews/") \
    || review_fail "listing $state_rel/user_reviews/ on $branch"
  while IFS= read -r name; do
    name="${name##*/}"
    [[ "$name" =~ ^(.+)_review(_([0-9]+))?\.md$ ]] || continue
    [ "${BASH_REMATCH[1]}" = "$branch" ] || continue
    round="${BASH_REMATCH[3]:-1}"
    round=$((10#$round))
    [ "$round" -le "$max" ] || max="$round"
  done <<NAMES
$names
NAMES
  if [ "$max" -eq 0 ]; then
    round=1
    next="${branch}_review.md"
  else
    round=$((max + 1))
    next="${branch}_review_$round.md"
  fi
  rel="$state_rel/user_reviews/$next"

  hr_place_artifact "$worktree" "$review_file" "$rel" || review_fail "copying the review to '$worktree/$rel'"
  # 3 (nothing staged) cannot happen for a new round's file, so it reads as a failure.
  status=0
  hr_commit_placed "$script_dir/commit-on-branch.sh" "$worktree" "$rel" "$(hr_user_review_subject "$branch")" >&2 || status=$?
  [ "$status" -eq 0 ] || review_fail "committing '$rel'"
  hr_push_landed "$script_dir/push-branch.sh" "$worktree" "$branch" >&2 \
    || review_fail "pushing $branch (origin/$branch is not HEAD)"
  if [ "$use_mirror" -eq 0 ]; then
    start_remove_copy
    trap - EXIT
  fi

  echo "remote-run.sh: placed $rel (round $round) on $branch"
  engine=user_review
  resume=none
  chain=0
  dispatch_fail_note="; the review is already pushed to origin/$branch, so re-send with: remote-run.sh dispatch $branch --engine user_review"
  verb_dispatch

  if remote_record_exists "$reg"; then
    hr_registry_set "$reg" "$branch" status running engine user_review \
      || echo "remote-run.sh: dispatched, but the local record of $branch could not be updated" >&2
  fi

  note="Round $round"
  [ -z "$source_arg" ] || note="$note from $source_arg"
  if [ -n "$actor_arg" ]; then
    note="$note by @$actor_arg"
  else
    note="$note from a local session"
  fi
  forge_report round "$branch" "$note"
}

# unrecorded_runs — UNRECORDED: one `<branch>\t<url>` line per branch whose
# newest `harness run <branch>` run is on GitHub, newest first, dropping a
# branch with a registry record, one `hr_branch_is_protected` does not answer 1
# for, and one that is not a live head on origin. One listing and one
# `ls-remote`; writes nothing. Exits 3 when either fails.
UNRECORDED=""
unrecorded_runs() {
  local titled reg recorded="" heads="" live=$'\n' ref b url protected
  UNRECORDED=""
  reg=$(hr_state_path "$root" autonomous_logs/registry.json) || {
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

  # Tested with -f first: hr_registry_get creates an absent registry.
  if [ -f "$reg" ]; then
    recorded=$(jq -r '.runs | keys[]' "$reg" 2>/dev/null) || {
      echo "remote-run.sh: cannot read the registry '$reg'" >&2
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
    UNRECORDED="$UNRECORDED$b"$'\t'"$url"$'\n'
  done <<EOF
$titled
EOF
}

# ---------------------------------------------------------------------------
# `list` — the runs on GitHub with no local record, for `branch-status`.
# ---------------------------------------------------------------------------

verb_list() {
  local b url
  unrecorded_runs
  if [ -z "$UNRECORDED" ]; then
    echo "remote-run.sh: no run on GitHub without a local record"
    return 0
  fi
  while IFS=$'\t' read -r b url; do
    [ -n "$b" ] || continue
    echo "remote-run.sh: on GitHub, no local record: $b $url"
  done <<EOF
$UNRECORDED
EOF
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

# trigger_finish <exit> <comment> <event> — post <comment> on the issue with the
# marker for <event> (`started` or `refused`; `branch=` is empty before a branch
# is derived), remove the trigger label, on `started` set the state label
# `running`, and exit <exit>. A comment that cannot be posted makes the exit 3;
# a label that cannot be removed or set is a warning only. For a dispatch event,
# print <comment> with no marker and append it to GITHUB_STEP_SUMMARY when set;
# a summary that cannot be appended is a warning only, since stdout already
# carries it.
trigger_finish() {
  local code="$1" body="$2" event="$3" file
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
  { printf '%s\n\n' "$body"; forge_marker "$event" "$branch"; } >"$file"
  if ! gh_call issue comment "$issue_number" --repo "${GITHUB_REPOSITORY-}" --body-file "$file"; then
    echo "::error::remote-run.sh: trigger: the comment on issue #$issue_number could not be posted: $GH_ERR"
    code="$EXIT_GH"
  fi
  rm -f "$file"
  if ! gh_call issue edit "$issue_number" --repo "${GITHUB_REPOSITORY-}" --remove-label "$trigger_label"; then
    echo "::warning::remote-run.sh: trigger: removing the label '$trigger_label' from issue #$issue_number failed: $GH_ERR"
  fi
  if [ "$event" = started ]; then
    if ! { forge_repo_var && forge_set_state "$issue_number" running; }; then
      echo "::warning::remote-run.sh: trigger: setting the label '${STATE_LABEL_PREFIX}running' on issue #$issue_number failed: $GH_ERR"
    fi
  fi
  exit "$code"
}

# trigger_refuse <reason> <way on> — print the reason, comment both, exit 2.
trigger_refuse() {
  echo "remote-run.sh: trigger: refused, nothing sent: $1" >&2
  trigger_finish "$EXIT_REFUSED" "No run started: $1

$2" refused
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

# authorise_actor <login> <type> — the one actor check, shared by `trigger` and
# `control`: 0 when authorised. Otherwise AUTH_WHY holds one sentence and the
# status names the arm: 1 `ghost`, empty or not a login shape; 2 a non-`User`
# not listed in HARNESS_TRIGGER_ALLOWED_BOTS, decided with no permission call,
# because the permission API answers `none` or 404 for a bot; 3 a `User` whose
# permission is not `admin` or `write` (AUTH_PERMISSION holds it); 4 that
# permission call failed (GH_ERR holds why). Prints nothing and never posts.
AUTH_WHY=""
AUTH_PERMISSION=""
authorise_actor() {
  local login="$1" type="$2"
  AUTH_WHY=""
  AUTH_PERMISSION=""
  if [ "$login" = ghost ] || [ -z "$login" ] \
    || ! { [[ "$login" =~ ^[A-Za-z0-9][A-Za-z0-9-]*$ ]] \
      || { [ "$type" = Bot ] && [[ "$login" =~ ^[A-Za-z0-9][A-Za-z0-9-]*\[bot\]$ ]]; }; }; then
    AUTH_WHY="the actor is an account GitHub does not name, or not a login."
    return 1
  fi
  if [ "$type" != User ]; then
    trigger_bot_listed "$login" && return 0
    AUTH_WHY="@$login is not a person, and is not listed in HARNESS_TRIGGER_ALLOWED_BOTS."
    return 2
  fi
  if ! gh_call api "repos/${GITHUB_REPOSITORY-}/collaborators/$login/permission"; then
    AUTH_WHY="the permission check for @$login failed ($GH_ERR)."
    return 4
  fi
  AUTH_PERMISSION=$(printf '%s' "$GH_OUT" | jq -r '.permission // empty' 2>/dev/null) || AUTH_PERMISSION=""
  case "$AUTH_PERMISSION" in
    admin|write) return 0 ;;
  esac
  AUTH_WHY="GitHub reports the permission of @$login as ${AUTH_PERMISSION:-nothing}, not write or admin."
  return 3
}

# trigger_run_url <sha> — the URL of the `harness run <branch>` run whose
# `headSha` is <sha>, the commit `start` just pushed, looked up at most
# TRIGGER_RUN_LOOKUP_TRIES times; the branch's filtered run list when none
# appears, and at once when <sha> is empty. Never fails. Matched on `headSha`
# rather than a `createdAt` bound: the SHA identifies this dispatch exactly and
# reads no runner clock, where a time bound still admits an unrelated run
# created in the same second.
trigger_run_url() {
  local sha="${1-}" try=1 secs url=""
  secs="${HARNESS_TRIGGER_LOOKUP_SECS-}"
  case "$secs" in
    ''|*[!0-9]*) secs="$TRIGGER_LOOKUP_SECS_DEFAULT" ;;
  esac
  while [ -n "$sha" ]; do
    if gh_call run list --workflow "$WORKFLOW_RUN_FILE" --branch "$branch" --json url,displayTitle,headSha --limit 5; then
      url=$(printf '%s' "$GH_OUT" | jq -r --arg t "harness run $branch" --arg s "$sha" \
        '[.[]? | select(.displayTitle == $t and .headSha == $s) | .url | strings] | first // empty' 2>/dev/null) || url=""
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
  local forge="" target="" default name_file status prompt errfile last url sha
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
    if [ -z "${HARNESS_TRIGGER_LABEL-}" ] && [ "$label" = "$LEGACY_TRIGGER_LABEL" ]; then
      trigger_label="$LEGACY_TRIGGER_LABEL"
    fi
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

    status=0
    authorise_actor "$login" "$sender_type" || status=$?
    case "$status" in
      0) ;;
      1) trigger_refuse "the label was applied by an account GitHub does not name (a deleted account shows as \`ghost\`)." \
           "A collaborator with write access can re-apply the label \`$trigger_label\`." ;;
      2) trigger_refuse "@$login is not a person, and is not listed in the repository variable \`HARNESS_TRIGGER_ALLOWED_BOTS\`." \
           "Add \`$login\` to that comma-separated list to let it start runs, or have a collaborator with write access apply the label \`$trigger_label\`." ;;
      3) trigger_refuse "could not confirm write access for @$login: GitHub reports their permission as \`${AUTH_PERMISSION:-nothing}\`." \
           "Only a collaborator with write, maintain or admin access starts a run by labelling an issue; one of them can re-apply the label \`$trigger_label\`." ;;
      *) trigger_refuse "could not confirm write access for @$login: the permission check failed ($GH_ERR)." \
           "Re-apply the label \`$trigger_label\` to try again." ;;
    esac
  fi

  # The name check reads origin/<defaultBranch>; a failed fetch leaves it to say so.
  default=$(hr_default_branch "$root") || default=""
  if [ -n "$default" ]; then
    git -C "$root" fetch --quiet origin "$default" >&2 || echo "remote-run.sh: trigger: fetching origin $default failed" >&2
  fi
  name_file=$(mktemp "$trigger_tmp/harness-trigger-branch.XXXXXX") || trigger_refuse \
    "the branch name could not be derived (mktemp failed)." "$retry_again"
  status=0
  hr_derive_branch "$root" "$title" "$fallback" "" "$GH" >"$name_file" || status=$?
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
    "No run started: the task prompt for \`$branch\` could not be written. $retry_again" refused
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

Start it by hand: **Actions → \`$WORKFLOW_RUN_FILE\` → Run workflow**, with *Use workflow from* set to \`$branch\`, \`action\` \`run\` and \`branch\` \`$branch\`." refused ;;
    *)
      echo "remote-run.sh: trigger: the start of $branch failed (exit $status)" >&2
      trigger_finish "$EXIT_PLACEMENT" "No run started: placing $task_what on the branch \`$branch\` failed:

\`\`\`
$last
\`\`\`

$retry_again" refused ;;
  esac

  # The ref `start`'s `hr_push_landed` confirmed equal to the pushed `HEAD`;
  # `start_remove_copy` deletes only the local branch.
  sha=$(git -C "$root" rev-parse --verify --quiet "refs/remotes/origin/$branch^{commit}") || sha=""
  url=$(trigger_run_url "$sha")
  if [ "$trigger_source" = issue ]; then
    echo "remote-run.sh: trigger: started $branch from issue #$issue_number: $url"
    trigger_finish "$EXIT_OK" "Started a harness run on the branch \`$branch\`: $url

The task is this issue's title and body as they were when the label \`$trigger_label\` was applied; later edits to the issue do not reach this run. Re-applying the label starts another run, on the next indexed branch." started
  fi
  echo "remote-run.sh: trigger: started $branch from a repository_dispatch: $url"
  trigger_finish "$EXIT_OK" "Started a harness run on the branch \`$branch\`: $url

The task is the dispatch's \`client_payload\` title and body. Sending the same dispatch again starts another run, on the next indexed branch." started
}

# ---------------------------------------------------------------------------
# THE FORGE SURFACE — the one place this script reads or writes an issue or a
# pull request for a run. Every function sets globals rather than printing,
# never exits, and reports a failure as one `remote-run.sh: …` line on stderr.
#
# THE TARGET RULE. A comment goes to the open same-repository pull request
# whose head is the branch when `forge_recognised` holds for that branch, else
# to the issue the run was started from (`FORGE_ISSUE`), else nowhere. The
# state label goes on that issue and on that pull request, each when known.
#
# THE LABEL IS A VIEW, NEVER AN AUTHORITY. The run list is the authority
# (`remote_state`); the harness overwrites any state label set by hand, and
# nothing reads one back to decide anything.
# ---------------------------------------------------------------------------

# forge_on — 0 when `forge` is `github` and `execution.target` is
# `github-actions`; the shell mirror of `forgeTriggerApplies`.
forge_on() {
  [ "$(hr_forge "$root" 2>/dev/null)" = github ] \
    && [ "$(hr_execution_target "$root" 2>/dev/null)" = github-actions ]
}

# forge_repo_var — FORGE_REPO (owner/name) and FORGE_SERVER, from the runner's
# environment when it names the repository, else one `gh repo view`; a success
# is kept for the invocation.
FORGE_REPO=""
FORGE_SERVER=""
FORGE_REPO_KNOWN=0
forge_repo_var() {
  local repo
  [ "$FORGE_REPO_KNOWN" -eq 0 ] || return 0
  if [ -n "${GITHUB_REPOSITORY-}" ]; then
    repo="$GITHUB_REPOSITORY"
  else
    if ! gh_call repo view --json nameWithOwner; then
      echo "remote-run.sh: reading the repository's name failed: $GH_ERR" >&2
      return 1
    fi
    repo=$(printf '%s' "$GH_OUT" | jq -r '.nameWithOwner // empty' 2>/dev/null) || repo=""
  fi
  # Interpolated into every API path below, so its shape is checked once here.
  if ! [[ "$repo" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]]; then
    GH_ERR="the repository name '$repo' is not owner/name"
    echo "remote-run.sh: reading the repository's name failed: $GH_ERR" >&2
    return 1
  fi
  FORGE_REPO="$repo"
  FORGE_SERVER="${GITHUB_SERVER_URL:-https://github.com}"
  FORGE_SERVER="${FORGE_SERVER%/}"
  FORGE_REPO_KNOWN=1
}

# forge_fetch_branch <branch> — update refs/remotes/origin/<branch>, at most
# once per branch per invocation. The refspec is explicit because a single-branch
# checkout's bare `fetch origin <branch>` updates only FETCH_HEAD. A failure is
# one line and tolerated.
FORGE_FETCHED=" "
forge_fetch_branch() {
  local err
  case "$FORGE_FETCHED" in *" $1 "*) return 0 ;; esac
  FORGE_FETCHED="$FORGE_FETCHED$1 "
  if ! err=$(git -C "$root" fetch --quiet origin "+refs/heads/$1:refs/remotes/origin/$1" 2>&1 >/dev/null); then
    echo "remote-run.sh: fetching origin $1 failed: ${err%%$'\n'*}" >&2
  fi
  return 0
}

# forge_marker <event> <branch> [<question>] — the one producer of a comment's
# marker line, built from COMMENT_MARKER.
forge_marker() {
  if [ -n "${3-}" ]; then
    printf '%s event=%s branch=%s question=%s -->\n' "$COMMENT_MARKER" "$1" "$2" "$3"
  else
    printf '%s event=%s branch=%s -->\n' "$COMMENT_MARKER" "$1" "$2"
  fi
}

# forge_issue_var <branch> — FORGE_ISSUE from the last provenance line
# `verb_trigger` writes into the branch's committed task prompt, matched against
# this repository's own issue URL only; empty when there is none.
FORGE_ISSUE=""
forge_issue_var() {
  local state_rel rel prompt line rest num prefix
  FORGE_ISSUE=""
  state_rel=$(hr_state_dir "$root" 2>/dev/null) || state_rel=""
  if [ -z "$state_rel" ]; then
    echo "remote-run.sh: cannot resolve the state directory under '$root'" >&2
    return 1
  fi
  rel=$(hr_task_prompt_rel "$state_rel" "$1")
  prompt=$(git -C "$root" show "refs/remotes/origin/$1:$rel" 2>/dev/null) || return 0
  prefix="Started from $FORGE_SERVER/$FORGE_REPO/issues/"
  while IFS= read -r line; do
    case "$line" in
      "$prefix"*) ;;
      *) continue ;;
    esac
    rest=${line#"$prefix"}
    num=${rest%%[!0-9]*}
    [ -n "$num" ] || continue
    case "${rest#"$num"}" in
      ' by @'*) FORGE_ISSUE="$num" ;;
    esac
  done <<<"$prompt"
  return 0
}

# forge_recognised <branch> — the harness-branch test, read from committed
# state: 0 when origin's copy of the branch carries its flow-progress ledger.
forge_recognised() {
  local state_rel
  state_rel=$(hr_state_dir "$root" 2>/dev/null) || return 1
  [ -n "$state_rel" ] || return 1
  git -C "$root" cat-file -e "refs/remotes/origin/$1:${state_rel%/}/flow_progress/$1_progress.md" 2>/dev/null
}

# forge_pr_var <branch> — FORGE_PR, the open pull request whose head is
# <branch> in this repository (a fork's same-named head is skipped), or empty.
FORGE_PR=""
forge_pr_var() {
  FORGE_PR=""
  if ! gh_call pr list --repo "$FORGE_REPO" --head "$1" --state open --json number,isCrossRepository --limit 10; then
    echo "remote-run.sh: listing the open pull requests of $1 failed: $GH_ERR" >&2
    return 1
  fi
  if ! FORGE_PR=$(printf '%s' "$GH_OUT" | jq -r \
    'if type == "array" then [.[] | select(.isCrossRepository == false) | .number | numbers] | first // empty else error end' 2>/dev/null); then
    FORGE_PR=""
    GH_ERR="its pr list is not the expected JSON"
    echo "remote-run.sh: listing the open pull requests of $1 failed: $GH_ERR" >&2
    return 1
  fi
  return 0
}

# forge_comment <number> <event> <branch> <body_file> [<question>] — append the
# marker to <body_file> and post it on issue or pull request <number>.
forge_comment() {
  local number="$1" event="$2" branch="$3" file="$4" question="${5-}" status
  if ! { printf '\n'; forge_marker "$event" "$branch" "$question"; } >>"$file"; then
    echo "remote-run.sh: cannot append the marker to '$file'" >&2
    return 1
  fi
  gh_call api --method POST "repos/$FORGE_REPO/issues/$number/comments" -F "body=@$file"
  status=$?
  [ "$status" -eq 0 ] || echo "remote-run.sh: the $event comment on #$number could not be posted: $GH_ERR" >&2
  return "$status"
}

# forge_set_state <number> <state> — leave `STATE_LABEL_PREFIX<state>` as the
# one state label on <number>. A failed add creates the label and retries once,
# never more.
forge_set_state() {
  local number="$1" state="$2" label names name encoded color try
  case " $RUN_STATES " in
    *" $state "*) ;;
    *) echo "remote-run.sh: '$state' is not one of: $RUN_STATES" >&2; return 1 ;;
  esac
  label="$STATE_LABEL_PREFIX$state"
  if ! gh_call api "repos/$FORGE_REPO/issues/$number/labels"; then
    echo "remote-run.sh: reading the labels of #$number failed: $GH_ERR" >&2
    return 1
  fi
  if ! names=$(printf '%s' "$GH_OUT" | jq -r --arg p "$STATE_LABEL_PREFIX" --arg t "$label" \
    'if type == "array" then .[] | .name | strings | select(startswith($p) and . != $t) else error end' 2>/dev/null); then
    GH_ERR="its label list is not the expected JSON"
    echo "remote-run.sh: reading the labels of #$number failed: $GH_ERR" >&2
    return 1
  fi
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    encoded=$(jq -rn --arg s "$name" '$s|@uri')
    gh_call api --method DELETE "repos/$FORGE_REPO/issues/$number/labels/$encoded" \
      || echo "remote-run.sh: removing the label '$name' from #$number failed: $GH_ERR" >&2
  done <<<"$names"
  for try in 1 2; do
    gh_call api --method POST "repos/$FORGE_REPO/issues/$number/labels" -f "labels[]=$label" && return 0
    if [ "$try" -eq 2 ]; then
      echo "remote-run.sh: adding the label '$label' to #$number failed: $GH_ERR" >&2
      return 1
    fi
    case "$state" in
      running) color=1d76db ;;
      parked) color=fbca04 ;;
      paused) color=c5def5 ;;
      done) color=0e8a16 ;;
      failed) color=b60205 ;;
      *) color=6a737d ;;
    esac
    gh_call api --method POST "repos/$FORGE_REPO/labels" -f "name=$label" -f "color=$color" \
      -f "description=Set by the harness from its run list; a hand-applied state label is overwritten." \
      || echo "remote-run.sh: creating the label '$label' failed: $GH_ERR" >&2
  done
}

# forge_utc <epoch> — print <epoch> as a UTC time, or nothing. `date -r` takes an
# epoch on BSD and a reference file on GNU, hence the `-d @` fallback.
forge_utc() {
  local out
  case "${1-}" in ''|*[!0-9]*) return 0 ;; esac
  out=$(date -u -r "$1" '+%Y-%m-%d %H:%M UTC' 2>/dev/null) || out=""
  [ -n "$out" ] || out=$(date -u -d "@$1" '+%Y-%m-%d %H:%M UTC' 2>/dev/null) || out=""
  printf '%s' "$out"
}

# forge_question_body <out_file> <branch> <n> <open_count> <clar_dir> [<note>] —
# write question <n>'s park comment, without its marker, into <out_file>: the
# file's bytes, cut at the last whole line within QUESTION_COMMENT_MAX_BYTES
# when it is over it (measured in bytes; `${#…}` counts characters).
forge_question_body() {
  local out="$1" br="$2" n="$3" count="$4" qfile="$5/question_$3.md" note="${6-}" size cut=0 last
  size=$(wc -c <"$qfile") || return 1
  size=$((size))
  {
    printf 'The run on `%s` is waiting for an answer to question %s.\n\n' "$br" "$n"
    if [ "$size" -le "$QUESTION_COMMENT_MAX_BYTES" ]; then
      cat "$qfile"
    else
      cut=1
      head -c "$QUESTION_COMMENT_MAX_BYTES" "$qfile" >"$out.cut"
      last=$(tail -c 1 "$out.cut")
      # A non-empty last byte is a partial line; LC_ALL=C keeps sed from
      # refusing a multi-byte character the byte cut split.
      if [ -n "$last" ]; then LC_ALL=C sed '$d' "$out.cut"; else cat "$out.cut"; fi
    fi
  } >"$out" || return 1
  {
    [ -z "$(tail -c 1 "$out")" ] || printf '\n'
    [ "$cut" -eq 0 ] || printf '\nThis question was cut to fit a comment. The whole file is `%s/%s/question_%s.md` in the run'"'"'s `%s` artifact.\n' \
      "$HR_REMOTE_CLARIFY_DIR" "$br" "$n" "$STATE_ARTIFACT_NAME"
    printf '\nAnswer with a comment whose first line is `%s answer %s` and whose following lines are your answer.' "$COMMAND_HANDLE" "$n"
    [ "$count" -ne 1 ] || printf ' This is the only open question, so `%s` may be left out: `%s answer`.' "$n" "$COMMAND_HANDLE"
    printf '\n'
    [ -z "$note" ] || printf '\n%s\n' "$note"
    [ -z "${GITHUB_RUN_ID-}" ] || printf '\nRun: %s\n' "$(this_run_url)"
  } >>"$out"
}

# forge_report <event> <branch> [<note>] — one lifecycle comment (on `parked`,
# one per open question) and the state label, by the target rule above.
# Always 0.
forge_report() {
  local event="$1" br="$2" note="${3-}" state reason="" resume_at="" when registry_file
  local target kind text tmp made_tmp="" file trigger_label stopped state_rel="" count n
  case "$event" in
    parked|park_loop) state=parked ;;
    paused) state=paused ;;
    resumed) state=running ;;
    failed) state=failed ;;
    stopped) state=stopped ;;
    round) state=running ;;
    completed)
      echo "remote-run.sh: report: completed is posted by deliver; nothing posted"
      return 0 ;;
    launched)
      echo "remote-run.sh: report: launched is the trigger's own comment; nothing posted"
      return 0 ;;
    *)
      echo "remote-run.sh: report: '$event' is not a reported event; nothing posted"
      return 0 ;;
  esac
  if ! forge_on; then
    echo "remote-run.sh: report: the forge coupling is off (forge github and execution.target github-actions); nothing posted"
    return 0
  fi
  forge_repo_var || return 0

  if [ "$event" = failed ]; then
    remote_branch_stopped "$br"
    stopped=$?
    if [ "$stopped" -eq 0 ]; then
      echo "remote-run.sh: report: $br was stopped, and the stop already reported the run; nothing posted"
      return 0
    fi
    [ "$stopped" -eq 1 ] \
      || echo "remote-run.sh: report: whether $br was stopped is unknown ($GH_ERR); reporting the failure" >&2
  fi

  forge_fetch_branch "$br"
  forge_issue_var "$br" || FORGE_ISSUE=""
  forge_pr_var "$br" || FORGE_PR=""
  if [ -n "$FORGE_PR" ] && ! forge_recognised "$br"; then
    echo "remote-run.sh: report: pull request #$FORGE_PR's head carries no flow-progress ledger; it is not a target"
    FORGE_PR=""
  fi
  if [ -n "$FORGE_PR" ]; then
    target="$FORGE_PR"; kind=pr
  elif [ -n "$FORGE_ISSUE" ]; then
    target="$FORGE_ISSUE"; kind=issue
  else
    echo "remote-run.sh: report: $br has no open pull request and no issue it was started from; nothing posted"
    return 0
  fi

  # Tested with -f first: hr_registry_get creates an absent registry.
  registry_file=$(hr_state_path "$root" autonomous_logs/registry.json 2>/dev/null) || registry_file=""
  if [ -n "$registry_file" ] && [ -f "$registry_file" ]; then
    reason=$(hr_registry_get "$registry_file" "$br" pause_reason)
    resume_at=$(hr_registry_get "$registry_file" "$br" usage_resume_at)
  fi

  case "$event" in
    paused)
      if [ "$reason" = usage ]; then
        when=$(forge_utc "$resume_at")
        text="The harness run on \`$br\` paused: it reached its usage limit. It resumes by itself after the limit resets${when:+, at $when}."
      else
        text="The harness run on \`$br\` paused${reason:+ (reason: \`$reason\`)}. Comment \`${COMMAND_HANDLE} resume\` to continue."
      fi ;;
    park_loop)
      text="The harness run on \`$br\` is on hold: it parked on its questions again and again without progress. Comment \`${COMMAND_HANDLE} clear\` to clear the hold and let it continue." ;;
    parked)
      text="The harness run on \`$br\` is waiting for an answer. Its questions are in the run's \`$STATE_ARTIFACT_NAME\` artifact." ;;
    resumed)
      text="The harness run on \`$br\` resumed." ;;
    failed)
      if [ "$kind" = pr ]; then
        text="The harness run on \`$br\` failed. Its log is \`run.log\` in the run's \`$STATE_ARTIFACT_NAME\` artifact. To start again, submit a review on this pull request requesting changes."
      else
        trigger_label="${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}"
        text="The harness run on \`$br\` failed. Its log is \`run.log\` in the run's \`$STATE_ARTIFACT_NAME\` artifact. To start again, re-apply the label \`$trigger_label\` to this issue; that starts a new run, on the next indexed branch."
      fi ;;
    stopped)
      text="The harness run on \`$br\` was stopped. Nothing runs on it until a new review or label starts another round or run." ;;
    round)
      text="A user-review round started on \`$br\`; a \`completed\` comment follows when the branch is ready for review again." ;;
  esac

  OPEN_QUESTIONS=""
  if [ "$event" = parked ]; then
    state_rel=$(hr_state_dir "$root" 2>/dev/null) || state_rel=""
    [ -z "$state_rel" ] || open_questions_in "$root/${state_rel%/}"
  fi

  tmp="${RUNNER_TEMP-}"
  if [ -z "$tmp" ] || [ ! -d "$tmp" ]; then
    tmp=$(mktemp -d) || tmp=""
    made_tmp="$tmp"
  fi
  if [ -n "$OPEN_QUESTIONS" ]; then
    count=$(printf '%s\n' $OPEN_QUESTIONS | wc -l)
    count=$((count))
    for n in $OPEN_QUESTIONS; do
      if [ -n "$tmp" ] && file=$(mktemp "$tmp/harness-report-comment.XXXXXX"); then
        if forge_question_body "$file" "$br" "$n" "$count" "$root/${state_rel%/}/$HR_REMOTE_CLARIFY_DIR/$br" "$note"; then
          forge_comment "$target" "$event" "$br" "$file" "$n" || :
        else
          echo "remote-run.sh: report: cannot write question $n's comment for #$target; not posted" >&2
        fi
        rm -f "$file" "$file.cut"
      else
        echo "remote-run.sh: report: cannot create question $n's comment file for #$target; not posted" >&2
      fi
    done
  elif [ -n "$tmp" ] && file=$(mktemp "$tmp/harness-report-comment.XXXXXX"); then
    {
      printf '%s\n' "$text"
      [ -z "$note" ] || printf '\n%s\n' "$note"
      [ -z "${GITHUB_RUN_ID-}" ] || printf '\nRun: %s\n' "$(this_run_url)"
    } >"$file"
    forge_comment "$target" "$event" "$br" "$file" || :
    rm -f "$file"
  else
    echo "remote-run.sh: report: cannot create the comment file for #$target; no comment posted" >&2
  fi
  [ -z "$made_tmp" ] || rmdir "$made_tmp" 2>/dev/null || :

  [ -z "$FORGE_ISSUE" ] || forge_set_state "$FORGE_ISSUE" "$state" || :
  [ -z "$FORGE_PR" ] || forge_set_state "$FORGE_PR" "$state" || :
  echo "remote-run.sh: report: $event on $br reported on #$target"
  return 0
}

verb_report() {
  forge_report "$report_event" "$branch" "$report_note"
  exit "$EXIT_OK"
}

# GitHub's refusal of a pull request created with the job's own token while the
# repository's Actions setting is off (docs/github-integration-research.md -> C3).
PR_CREATE_FORBIDDEN='GitHub Actions is not permitted to create or approve pull requests'
# GitHub's limit on a pull request title.
PR_TITLE_MAX_CHARS=256

# deliver_title_var <branch> — DELIVER_TITLE: the committed task prompt's first
# line without its `# ` when it is a heading, cut to PR_TITLE_MAX_CHARS, else <branch>.
DELIVER_TITLE=""
deliver_title_var() {
  local state_rel first=""
  DELIVER_TITLE="$1"
  state_rel=$(hr_state_dir "$root" 2>/dev/null) || return 0
  [ -n "$state_rel" ] || return 0
  IFS= read -r first < <(git -C "$root" show "refs/remotes/origin/$1:$(hr_task_prompt_rel "$state_rel" "$1")" 2>/dev/null) || :
  case "$first" in
    '# '?*) DELIVER_TITLE="${first#'# '}"; DELIVER_TITLE="${DELIVER_TITLE:0:$PR_TITLE_MAX_CHARS}" ;;
  esac
  return 0
}

# deliver_pr_body <file> <branch> — the pull request's body: what it is, the
# issue as a plain mention (never a closing keyword: the flow does not own the
# issue's lifecycle), what a reviewer can do here, and the marker.
deliver_pr_body() {
  {
    printf 'This pull request carries the harness run on `%s`, ready for your review. The harness never merges it.\n' "$2"
    [ -z "$FORGE_ISSUE" ] || printf '\nStarted from #%s.\n' "$FORGE_ISSUE"
    printf '\nA review that requests changes starts a user-review round on this branch.\n'
    printf 'While a round is running, comment `%s pause`, `%s resume`, `%s stop` or `%s answer <n>` to act on it.\n' \
      "$COMMAND_HANDLE" "$COMMAND_HANDLE" "$COMMAND_HANDLE" "$COMMAND_HANDLE"
    printf '\n'
    forge_marker pull-request "$2"
  } >"$1"
}

# deliver_create <base> <branch> <body_file> [--draft] — one `gh pr create`,
# with HARNESS_PR_TOKEN when it is set, else the job's own token.
deliver_create() {
  local base="$1" br="$2" body="$3"
  shift 3
  set -- pr create --repo "$FORGE_REPO" --base "$base" --head "$br" "$@" --title "$DELIVER_TITLE" --body-file "$body"
  if [ -n "${HARNESS_PR_TOKEN-}" ]; then
    gh_call_token "$HARNESS_PR_TOKEN" "$@"
  else
    gh_call "$@"
  fi
}

# verb_deliver — after a `completed` bundle: find or open the branch's pull
# request, post the one `completed` comment, and set `done`. Always exit 0.
verb_deliver() {
  local status base="" pr_url="" opened=0 lookup_failed=0 create_err="" forbidden=0
  local tmp made_tmp="" body="" file target text compare
  if ! forge_on; then
    echo "remote-run.sh: deliver: the forge coupling is off (forge github and execution.target github-actions); nothing posted"
    exit "$EXIT_OK"
  fi
  hr_remote_names_var
  status=$(hr_remote_status_get "$bundle_dir/$HR_REMOTE_STATUS_FILE" status 2>/dev/null) || status=""
  if [ "$status" != completed ]; then
    echo "remote-run.sh: deliver: the bundle's status is '${status:-unreadable}', not completed; nothing posted"
    exit "$EXIT_OK"
  fi
  forge_repo_var || exit "$EXIT_OK"

  forge_fetch_branch "$branch"
  forge_issue_var "$branch" || FORGE_ISSUE=""
  forge_pr_var "$branch" || { FORGE_PR=""; lookup_failed=1; create_err="whether a pull request is already open could not be read ($GH_ERR)"; }

  tmp="${RUNNER_TEMP-}"
  if [ -z "$tmp" ] || [ ! -d "$tmp" ]; then
    tmp=$(mktemp -d) || tmp=""
    made_tmp="$tmp"
  fi

  if [ -n "$FORGE_PR" ]; then
    pr_url="$FORGE_SERVER/$FORGE_REPO/pull/$FORGE_PR"
    echo "remote-run.sh: deliver: $branch already has pull request #$FORGE_PR; none opened"
  elif [ "$lookup_failed" -eq 0 ]; then
    base=$(hr_default_branch "$root" 2>/dev/null) || base=""
    deliver_title_var "$branch"
    if [ -z "$base" ]; then
      create_err="the configured defaultBranch could not be read"
    elif [ -z "$tmp" ] || ! body=$(mktemp "$tmp/harness-deliver-body.XXXXXX") || ! deliver_pr_body "$body" "$branch"; then
      create_err="its body file could not be written"
    elif deliver_create "$base" "$branch" "$body" --draft; then
      opened=1
    else
      create_err="$GH_ERR"
      case "$GH_ERR" in
        *"$PR_CREATE_FORBIDDEN"*) forbidden=1 ;;
        *)
          # Drafts depend on the account's plan (C3, not measured): one retry as ready.
          echo "remote-run.sh: deliver: opening a draft pull request failed ($GH_ERR); retrying once without --draft" >&2
          if deliver_create "$base" "$branch" "$body"; then
            opened=1
          else
            create_err="$GH_ERR"
          fi ;;
      esac
    fi
    [ -z "$body" ] || rm -f "$body"
    if [ "$opened" -eq 1 ]; then
      FORGE_PR=$(printf '%s\n' "$GH_OUT" | sed -n 's|.*/pull/\([0-9][0-9]*\).*|\1|p' | tail -n 1)
      if [ -n "$FORGE_PR" ]; then
        pr_url="$FORGE_SERVER/$FORGE_REPO/pull/$FORGE_PR"
        echo "remote-run.sh: deliver: opened pull request #$FORGE_PR for $branch"
      else
        opened=0
        create_err="gh printed no pull request URL"
      fi
    fi
  fi

  compare="$FORGE_SERVER/$FORGE_REPO/compare/${base:-<default branch>}...$branch?expand=1"
  if [ -z "$pr_url" ]; then
    target="$FORGE_ISSUE"
    if [ "$forbidden" -eq 1 ]; then
      text="The harness run on \`$branch\` completed, but its pull request could not be opened: GitHub Actions is not permitted to create pull requests in this repository. Turn on Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to create and approve pull requests*, or set the \`HARNESS_GIT_TOKEN\` secret, for the next run. For this one, open the pull request from the branch: $compare"
    else
      text="The harness run on \`$branch\` completed, but its pull request could not be opened: $create_err. Open it by hand from the branch: $compare"
    fi
  elif [ "$opened" -eq 0 ]; then
    target="$FORGE_PR"
    text="The harness round on \`$branch\` finished. Review this pull request; a review that requests changes starts another round."
  elif [ -n "$FORGE_ISSUE" ]; then
    target="$FORGE_ISSUE"
    text="The harness run on \`$branch\` completed. Its pull request is ready for your review: $pr_url
Review it there; a review that requests changes starts another round."
  else
    target="$FORGE_PR"
    text="The harness run on \`$branch\` completed and opened this pull request. Review it; a review that requests changes starts another round."
  fi
  if hr_phase_enabled "$root" qa; then
    text="$text

The interactive-test phase was skipped on GitHub Actions. Before merging, run \`/autonomous-sdlc-harness:branch-qa-test $branch\` locally."
  fi

  if [ -z "$target" ]; then
    echo "remote-run.sh: deliver: $branch has no pull request and no issue it was started from; nothing posted"
  elif [ -n "$tmp" ] && file=$(mktemp "$tmp/harness-deliver-comment.XXXXXX"); then
    {
      printf '%s\n' "$text"
      [ -z "${GITHUB_RUN_ID-}" ] || printf '\nRun: %s\n' "$(this_run_url)"
    } >"$file"
    forge_comment "$target" completed "$branch" "$file" || :
    rm -f "$file"
  else
    echo "remote-run.sh: deliver: cannot create the comment file for #$target; no comment posted" >&2
  fi
  [ -z "$made_tmp" ] || rmdir "$made_tmp" 2>/dev/null || :

  [ -z "$FORGE_ISSUE" ] || forge_set_state "$FORGE_ISSUE" done || :
  [ -z "$FORGE_PR" ] || forge_set_state "$FORGE_PR" done || :
  echo "remote-run.sh: deliver: completed on $branch reported${target:+ on #$target}"
  exit "$EXIT_OK"
}

# ---------------------------------------------------------------------------
# `control` — the comment adapter: one GitHub event, one harness action on one
# branch, through the child verbs. Event text is data, as in `trigger`.
# ---------------------------------------------------------------------------

CONTROL_BRANCH=""
CONTROL_NUMBER=""
CONTROL_ACTOR=""
CONTROL_VERB=""
CONTROL_ARGS=""
CONTROL_BODY=""
control_tmp=""
# Directories control_state_var created, removed on exit.
control_dirs=""

control_cleanup() {
  local d
  for d in $control_dirs; do
    rm -rf -- "$d"
  done
  return 0
}

# control_post <text> — post <text> on CONTROL_NUMBER as a `reply` comment;
# 1, after an `::error::` line, when it cannot be posted.
control_post() {
  local text="$1" file status=0
  if ! forge_repo_var; then
    echo "::error::remote-run.sh: control: the reply on #$CONTROL_NUMBER could not be posted: $GH_ERR"
    return 1
  fi
  if ! file=$(mktemp "$control_tmp/harness-control-reply.XXXXXX"); then
    echo "::error::remote-run.sh: control: cannot create the reply file for #$CONTROL_NUMBER under '$control_tmp'"
    return 1
  fi
  {
    printf '%s\n' "$text"
    [ -z "${GITHUB_RUN_ID-}" ] || printf '\nRun: %s\n' "$(this_run_url)"
  } >"$file"
  if ! forge_comment "$CONTROL_NUMBER" reply "$CONTROL_BRANCH" "$file"; then
    echo "::error::remote-run.sh: control: the reply on #$CONTROL_NUMBER could not be posted: $GH_ERR"
    status=1
  fi
  rm -f "$file"
  return "$status"
}

# control_reply <exit> <text> — control_post <text>, then exit <exit>; a reply
# that cannot be posted makes the exit 3.
control_reply() {
  control_post "$2" || exit "$EXIT_GH"
  exit "$1"
}

# control_refuse <exit> <reason> <way on> — the refusal reply, then exit.
control_refuse() {
  echo "remote-run.sh: control: \`${CONTROL_VERB:-$COMMAND_HANDLE}\` refused: $2" >&2
  control_reply "$1" "@$CONTROL_ACTOR: \`${CONTROL_VERB:-$COMMAND_HANDLE}\` was not run: $2. $3"
}

# control_child <out_file> <args...> — run this script as a child with stderr
# captured; CHILD_STATUS is its exit, CHILD_LAST its last non-empty stderr line,
# which is also echoed to this process's stderr.
CHILD_STATUS=0
CHILD_LAST=""
control_child() {
  local out="$1" errfile
  shift
  CHILD_STATUS=0
  CHILD_LAST=""
  errfile=$(mktemp "$control_tmp/harness-control-err.XXXXXX") || errfile=/dev/null
  bash "$script_dir/remote-run.sh" "$@" >"$out" 2>"$errfile" || CHILD_STATUS=$?
  if [ "$errfile" != /dev/null ]; then
    cat "$errfile" >&2
    CHILD_LAST=$(grep -v '^[[:space:]]*$' "$errfile" | tail -n 1)
    rm -f "$errfile"
  fi
  [ -n "$CHILD_LAST" ] || CHILD_LAST="exit $CHILD_STATUS, no message"
}

# control_state_var <branch> — the branch's newest remote state, read by a
# `fetch` child into a fresh directory: CS_STATE, CS_REASON, CS_ENGINE,
# CS_OPEN, CS_DETAIL, CS_URL, CS_RUN_STATUS and CS_DIR. 1 with CS_ERR on a
# failed child.
CS_STATE=""; CS_REASON=""; CS_ENGINE=""; CS_OPEN=""; CS_DETAIL=""; CS_URL=""
CS_RUN_STATUS=""; CS_DIR=""; CS_ERR=""
control_state_var() {
  local out line key value
  CS_STATE=""; CS_REASON=""; CS_ENGINE=""; CS_OPEN=""; CS_DETAIL=""; CS_URL=""
  CS_RUN_STATUS=""; CS_DIR=""; CS_ERR=""
  if ! CS_DIR=$(mktemp -d "$control_tmp/harness-control-fetch.XXXXXX"); then
    CS_DIR=""
    CS_ERR="a fetch directory could not be created under '$control_tmp'"
    return 1
  fi
  control_dirs="$control_dirs $CS_DIR"
  out="$CS_DIR.out"
  control_dirs="$control_dirs $out"
  control_child "$out" fetch "$1" "$CS_DIR" --repo "$root"
  if [ "$CHILD_STATUS" -ne 0 ]; then
    CS_ERR="$CHILD_LAST"
    return 1
  fi
  while IFS= read -r line; do
    key=${line%%:*}
    value=${line#*: }
    [ "$value" != "$line" ] || value=""
    case "$key" in
      state) CS_STATE="$value" ;;
      pause_reason) CS_REASON="$value" ;;
      engine) CS_ENGINE="$value" ;;
      open_questions) CS_OPEN="$value" ;;
      detail) CS_DETAIL="$value" ;;
      run_url) CS_URL="$value" ;;
      run_status) CS_RUN_STATUS="$value" ;;
    esac
  done <"$out"
  return 0
}

# control_check_branch <branch> — the refusals both paths share, in order: a
# branch not answered 1 by hr_branch_is_protected, then (after a fetch) one
# whose origin tip carries no flow-progress ledger. Each is a reply and exit 2.
control_check_branch() {
  local b="$1" protected=0
  if ! valid_branch "$b" || ! git check-ref-format --branch "$b" >/dev/null 2>&1; then
    control_refuse "$EXIT_REFUSED" "\`$b\` is not a valid branch name" "Comment on the pull request of the run's branch instead."
  fi
  hr_branch_is_protected "$root" "$b" || protected=$?
  case "$protected" in
    1) ;;
    0) control_refuse "$EXIT_REFUSED" "\`$b\` is a protected branch, which the harness never acts on" \
         "Comment on the pull request of the run's own branch instead." ;;
    *) control_refuse "$EXIT_REFUSED" "whether \`$b\` is protected could not be judged from \`harness.config.json\`" \
         "Fix the configuration on the default branch, then comment again." ;;
  esac
  forge_fetch_branch "$b"
  if ! forge_recognised "$b"; then
    control_refuse "$EXIT_REFUSED" "\`$b\` is not a harness branch: its tip carries no flow-progress ledger" \
      "Only a branch a harness run works on can be commanded."
  fi
  CONTROL_BRANCH="$b"
}

# control_branch_from_pr <number> — the pull request's head, refused for a
# fork, a pull request that is not open, and control_check_branch's refusals.
control_branch_from_pr() {
  local head cross state
  if ! gh_call pr view "$1" --repo "$FORGE_REPO" --json headRefName,isCrossRepository,state; then
    control_refuse "$EXIT_GH" "pull request #$1 could not be read ($GH_ERR)" "Comment again to retry."
  fi
  head=$(printf '%s' "$GH_OUT" | jq -r '.headRefName // empty' 2>/dev/null) || head=""
  cross=$(printf '%s' "$GH_OUT" | jq -r '.isCrossRepository | tostring' 2>/dev/null) || cross=""
  state=$(printf '%s' "$GH_OUT" | jq -r '.state // empty' 2>/dev/null) || state=""
  # A fork's head is never checked out or run: this event carries this
  # repository's secrets (docs/github-integration-research.md -> C2).
  if [ "$cross" != false ]; then
    control_refuse "$EXIT_REFUSED" "pull request #$1 comes from a fork, and the harness never acts on a fork's pull request" \
      "Push the branch to this repository and open the pull request from there."
  fi
  if [ "$state" != OPEN ]; then
    control_refuse "$EXIT_REFUSED" "pull request #$1 is ${state:-in an unknown state}, not open" "Reopen it, then comment again."
  fi
  control_check_branch "$head"
}

# control_branch_from_issue <number> — the branch of the issue's last genuine
# start comment: by `github-actions[bot]`, its first line opening with the
# trigger's start sentence and a backticked <b>, and its last non-empty line
# exactly `forge_marker started <b>`. A marker anywhere else is never trusted.
control_branch_from_issue() {
  local count i login body first last b found="" lead='Started a harness run on the branch `'
  if ! gh_call api --paginate "repos/$FORGE_REPO/issues/$1/comments" --jq '.[] | {login: .user.login, body: .body}'; then
    control_refuse "$EXIT_GH" "the comments of issue #$1 could not be read ($GH_ERR)" "Comment again to retry."
  fi
  count=$(printf '%s' "$GH_OUT" | jq -s 'length' 2>/dev/null) || count=""
  case "$count" in
    ''|*[!0-9]*)
      GH_ERR="its comment list is not the expected JSON"
      control_refuse "$EXIT_GH" "the comments of issue #$1 could not be read ($GH_ERR)" "Comment again to retry." ;;
  esac
  for ((i = 0; i < count; i++)); do
    login=$(printf '%s' "$GH_OUT" | jq -s -r --argjson i "$i" '.[$i].login // ""' 2>/dev/null) || continue
    [ "$login" = 'github-actions[bot]' ] || continue
    body=$(printf '%s' "$GH_OUT" | jq -s -j --argjson i "$i" '.[$i].body // ""' 2>/dev/null) || continue
    body=${body//$'\r'$'\n'/$'\n'}
    body=${body%$'\r'}
    case "$body" in
      "$lead"*) ;;
      *) continue ;;
    esac
    b=${body#"$lead"}
    b=${b%%$'\n'*}
    case "$b" in
      *'`'*) b=${b%%'`'*} ;;
      *) continue ;;
    esac
    [ -n "$b" ] || continue
    last=$(printf '%s\n' "$body" | grep -v '^[[:space:]]*$' | tail -n 1)
    [ "$last" = "$(forge_marker started "$b")" ] || continue
    found="$b"
  done
  if [ -z "$found" ]; then
    control_refuse "$EXIT_REFUSED" "no harness run was started from this issue" \
      "Comment on the pull request of the run's branch instead."
  fi
  control_check_branch "$found"
}

# control_verb_handled <verb> — 0 when an arm below carries out <verb>.
control_verb_handled() {
  case "$1" in
    answer|pause|stop|resume|clear) return 0 ;;
  esac
  return 1
}

# control_resume_dispatch <reply> [<dispatch flag>] — the resume dispatch the
# local relay sends for CS_ENGINE; on 0, <reply>, then `running` on the run's
# issue and pull request. An empty engine is refused, never guessed: the run
# workflow's `engine` input defaults to `task`.
control_resume_dispatch() {
  local done_text="$1" out status route clear=""
  shift
  if [ -z "$CS_ENGINE" ]; then
    # The run's own engine is unrecorded, so the route names the choice.
    route=$(hr_github_resume_route "$CONTROL_BRANCH" "<task, user_review or docs: the one the run was started with>")
    route=${route#or from GitHub: }
    [ "$#" -eq 0 ] || clear=", with park_loop_clear true as well"
    control_refuse "$EXIT_REFUSED" "the run on \`$CONTROL_BRANCH\` (\`$CS_STATE\`${CS_REASON:+, \`$CS_REASON\`}) records no engine, and the harness does not guess one" \
      "Resume it with the **Run workflow** form instead: $route$clear."
  fi
  out=$(mktemp "$control_tmp/harness-control-out.XXXXXX") || out=/dev/null
  control_child "$out" dispatch "$CONTROL_BRANCH" --engine "$CS_ENGINE" --resume pause "$@" --chain 0 --repo "$root"
  [ "$out" = /dev/null ] || { cat "$out"; rm -f "$out"; }
  case "$CHILD_STATUS" in
    0) ;;
    2) control_refuse "$EXIT_REFUSED" "the dispatch was refused ($CHILD_LAST)" "Comment \`$COMMAND_HANDLE $CONTROL_VERB\` again once that is fixed." ;;
    *) control_refuse "$EXIT_GH" "the dispatch could not be sent ($CHILD_LAST)" "Comment \`$COMMAND_HANDLE $CONTROL_VERB\` again to retry." ;;
  esac
  status="$EXIT_OK"
  control_post "$done_text" || status="$EXIT_GH"
  # The job posts its own `resumed` comment; the labels say `running` now.
  forge_issue_var "$CONTROL_BRANCH" || FORGE_ISSUE=""
  forge_pr_var "$CONTROL_BRANCH" || FORGE_PR=""
  [ -z "$FORGE_ISSUE" ] || forge_set_state "$FORGE_ISSUE" running || :
  [ -z "$FORGE_PR" ] || forge_set_state "$FORGE_PR" running || :
  exit "$status"
}

control_resume() {
  local open
  control_state_var "$CONTROL_BRANCH" \
    || control_refuse "$EXIT_GH" "the state of the run on \`$CONTROL_BRANCH\` could not be read ($CS_ERR)" "Comment again to retry."
  case "$CS_STATE" in
    paused)
      # Every pause reason, `expired` and `killed` included, resumes from the
      # committed ledger, as the local route does.
      control_resume_dispatch "Resume requested by @$CONTROL_ACTOR: \`$CONTROL_BRANCH\` continues from its committed ledger." ;;
    park_loop)
      control_refuse "$EXIT_REFUSED" "the run on \`$CONTROL_BRANCH\` is held by the park-loop guard" \
        "Comment \`$COMMAND_HANDLE clear\` to release the hold and resume it." ;;
    parked)
      open=""
      [ -z "$CS_OPEN" ] || open=" (open: $CS_OPEN)"
      control_refuse "$EXIT_REFUSED" "the run on \`$CONTROL_BRANCH\` is \`parked\`, waiting for an answer$open" \
        "Comment \`$COMMAND_HANDLE answer <n>\` with the answer to question <n> on the lines below it." ;;
    running)
      control_refuse "$EXIT_REFUSED" "the run on \`$CONTROL_BRANCH\` is already \`running\`" "Nothing needs resuming." ;;
    *)
      control_refuse "$EXIT_REFUSED" "only a paused run can be resumed, and the run on \`$CONTROL_BRANCH\` is \`${CS_STATE:-unknown}\`" \
        "A finished run continues by a review requesting changes on its pull request, or by applying the trigger label to its issue again." ;;
  esac
}

control_clear() {
  control_state_var "$CONTROL_BRANCH" \
    || control_refuse "$EXIT_GH" "the state of the run on \`$CONTROL_BRANCH\` could not be read ($CS_ERR)" "Comment again to retry."
  if [ "$CS_STATE" != park_loop ]; then
    control_refuse "$EXIT_REFUSED" "there is no park-loop hold to clear: the run on \`$CONTROL_BRANCH\` is \`${CS_STATE:-unknown}\`" \
      "Only a run held by the park-loop guard is cleared."
  fi
  # On GitHub, typing `clear` is the confirmation `branch-resume` asks for.
  control_resume_dispatch "Park-loop hold on \`$CONTROL_BRANCH\` cleared by @$CONTROL_ACTOR; the run resumes from its committed ledger." \
    --park-loop-clear
}

control_pause() {
  local out
  control_state_var "$CONTROL_BRANCH" \
    || control_refuse "$EXIT_GH" "the state of the run on \`$CONTROL_BRANCH\` could not be read ($CS_ERR)" "Comment again to retry."
  if [ "$CS_STATE" != running ]; then
    control_refuse "$EXIT_REFUSED" "only a running run can be paused, and the run on \`$CONTROL_BRANCH\` is \`$CS_STATE\`" \
      "Nothing needs pausing."
  fi
  out=$(mktemp "$control_tmp/harness-control-out.XXXXXX") || out=/dev/null
  control_child "$out" pause "$CONTROL_BRANCH" --repo "$root"
  [ "$out" = /dev/null ] || { cat "$out"; rm -f "$out"; }
  if [ "$CHILD_STATUS" -ne 0 ]; then
    control_refuse "$EXIT_GH" "the pause could not be sent ($CHILD_LAST)" "Comment \`$COMMAND_HANDLE pause\` again to retry."
  fi
  control_reply "$EXIT_OK" "Pause requested by @$CONTROL_ACTOR; the run on \`$CONTROL_BRANCH\` yields at its next clean checkpoint, and a paused comment follows."
}

control_stop() {
  local out
  control_state_var "$CONTROL_BRANCH" \
    || control_refuse "$EXIT_GH" "the state of the run on \`$CONTROL_BRANCH\` could not be read ($CS_ERR)" "Comment again to retry."
  if [ "$CS_STATE" = none ]; then
    control_refuse "$EXIT_REFUSED" "there is no harness run on \`$CONTROL_BRANCH\` to stop" "Nothing needs stopping."
  fi
  out=$(mktemp "$control_tmp/harness-control-out.XXXXXX") || out=/dev/null
  control_child "$out" stop "$CONTROL_BRANCH" --actor "$CONTROL_ACTOR" --repo "$root"
  [ "$out" = /dev/null ] || { cat "$out"; rm -f "$out"; }
  case "$CHILD_STATUS" in
    0)
      # Always replied here: `stop`'s own `stopped` comment goes to the run's
      # target, which need not be the item the command was typed on.
      control_reply "$EXIT_OK" "Stop requested by @$CONTROL_ACTOR; the run on \`$CONTROL_BRANCH\` is stopped." ;;
    3)
      control_refuse "$EXIT_GH" "the stop of \`$CONTROL_BRANCH\` is partial ($CHILD_LAST)" \
        "Comment \`$COMMAND_HANDLE stop\` again to finish it." ;;
    *)
      control_refuse "$EXIT_GH" "the stop could not be sent ($CHILD_LAST)" "Comment \`$COMMAND_HANDLE stop\` again to retry." ;;
  esac
}

# control_answer — one answer, one `resume: answer` dispatch with one entry. A
# park left partly answered is safe: run_job stops an `answer` job whose park
# is not fully answered before any session, and its bundle then carries the
# `answer_<n>.md` restore wrote, so the next answer's job finds the set complete.
control_answer() {
  local first short="" below="" text n="" v open_list="" rest="" cmds="" route form dir out status="$EXIT_OK"
  first=${CONTROL_ARGS%%[$' \t']*}
  if [[ "$first" =~ ^[1-9][0-9]*$ ]]; then
    n="$first"
    short=${CONTROL_ARGS#"$first"}
    short=${short#"${short%%[!$' \t']*}"}
  else
    short="$CONTROL_ARGS"
  fi
  case "$CONTROL_BODY" in
    *$'\n'*) below=${CONTROL_BODY#*$'\n'} ;;
  esac
  below=${below//$'\r'$'\n'/$'\n'}
  below=${below%$'\r'}
  if [[ "$below" =~ ^[[:space:]]*$ ]]; then
    text="$short"
  else
    text="$below"
  fi
  if [[ "$text" =~ ^[[:space:]]*$ ]]; then
    control_refuse "$EXIT_REFUSED" "the answer is empty" \
      "Comment \`$COMMAND_HANDLE answer <n>\` with the answer on the lines below it."
  fi

  control_state_var "$CONTROL_BRANCH" \
    || control_refuse "$EXIT_GH" "the state of the run on \`$CONTROL_BRANCH\` could not be read ($CS_ERR)" "Comment again to retry."
  case "$CS_STATE:$CS_REASON" in
    park_loop:*)
      control_refuse "$EXIT_REFUSED" "the run on \`$CONTROL_BRANCH\` is held by the park-loop guard, not waiting for an answer" \
        "Comment \`$COMMAND_HANDLE clear\` to release the hold and resume it." ;;
    paused:expired)
      # An expired bundle is reported as expired, never as no park.
      control_refuse "$EXIT_REFUSED" "${CS_DETAIL:-the state bundle of the run has expired}; the park's questions can no longer be answered here" \
        "Comment \`$COMMAND_HANDLE resume\` to resume from the committed ledger." ;;
    running:*)
      # Refused rather than queued: a newer pending run in the per-branch
      # concurrency group could cancel a queued one.
      control_refuse "$EXIT_REFUSED" "a job of the run on \`$CONTROL_BRANCH\` is in progress${CS_URL:+ ($CS_URL)}" \
        "Send the answer again once it finishes."
      ;;
    parked:*) ;;
    *)
      control_refuse "$EXIT_REFUSED" "only a parked run can be answered, and the run on \`$CONTROL_BRANCH\` is \`${CS_STATE:-unknown}\`" \
        "Nothing is waiting for an answer." ;;
  esac
  if [ -z "$CS_OPEN" ]; then
    control_refuse "$EXIT_REFUSED" "only a parked run with an open question can be answered, and the run on \`$CONTROL_BRANCH\` is \`parked\` with none open" \
      "Nothing is waiting for an answer."
  fi
  for v in $CS_OPEN; do
    open_list="$open_list${open_list:+, }$v"
    cmds="$cmds${cmds:+, }\`$COMMAND_HANDLE answer $v\`"
  done
  if [ -z "$n" ]; then
    case "$CS_OPEN" in
      *' '*)
        control_refuse "$EXIT_REFUSED" "questions $open_list are open, so the command must name one" \
          "Answer each with its own comment: $cmds." ;;
    esac
    n="$CS_OPEN"
  fi
  case " $CS_OPEN " in
    *" $n "*) ;;
    *)
      control_refuse "$EXIT_REFUSED" "question $n is not open; the open questions are $open_list" \
        "Answer one of them: $cmds." ;;
  esac
  if [ -z "$CS_ENGINE" ]; then
    route=$(hr_github_resume_route "$CONTROL_BRANCH" "<task, user_review or docs: the one the run was started with>")
    route=${route#or from GitHub: }
    form="resume answer and answers \`{\"$n\": \"<the answer>\"}\`"
    route=${route/and resume pause/$form}
    control_refuse "$EXIT_REFUSED" "the run on \`$CONTROL_BRANCH\` (\`parked\`) records no engine, and the harness does not guess one" \
      "Answer it with the **Run workflow** form instead: $route."
  fi

  if ! dir=$(mktemp -d "$control_tmp/harness-control-answer.XXXXXX"); then
    control_refuse "$EXIT_GH" "an answer directory could not be created under '$control_tmp'" "Comment again to retry."
  fi
  control_dirs="$control_dirs $dir"
  # The answer is untrusted data: written by printf, never sourced.
  if ! mkdir "$dir/answers" || ! printf '%s' "$text" >"$dir/answers/answer_$n.md"; then
    control_refuse "$EXIT_GH" "the answer could not be written under '$dir'" "Comment again to retry."
  fi
  out="$dir/dispatch.out"
  control_child "$out" dispatch "$CONTROL_BRANCH" --engine "$CS_ENGINE" --resume answer \
    --answers-from "$dir/answers" --indexes "$n" --chain 0 --repo "$root"
  cat "$out" 2>/dev/null || :
  case "$CHILD_STATUS" in
    0) ;;
    2)
      case "$CHILD_LAST" in
        *"workflow_dispatch limit"*)
          control_refuse "$EXIT_REFUSED" "the dispatch was refused ($CHILD_LAST)" \
            "Shorten the answer, or commit it to a file on \`$CONTROL_BRANCH\` and name that file in a shorter answer." ;;
      esac
      control_refuse "$EXIT_REFUSED" "the dispatch was refused ($CHILD_LAST)" \
        "Comment \`$COMMAND_HANDLE answer $n\` again once that is fixed." ;;
    *)
      control_refuse "$EXIT_GH" "the dispatch could not be sent ($CHILD_LAST)" \
        "Comment \`$COMMAND_HANDLE answer $n\` again to retry." ;;
  esac

  cmds=""
  for v in $CS_OPEN; do
    [ "$v" != "$n" ] || continue
    rest="$rest${rest:+, }$v"
    cmds="$cmds${cmds:+, }\`$COMMAND_HANDLE answer $v\`"
  done
  if [ -n "$rest" ]; then
    # The label stays `parked` until the last answer: only that job resumes.
    control_reply "$EXIT_OK" "Answer to question $n received from @$CONTROL_ACTOR and sent; question(s) $rest still need an answer: $cmds."
  fi
  control_post "Answer to question $n received from @$CONTROL_ACTOR; every open question is answered, so \`$CONTROL_BRANCH\` resumes." \
    || status="$EXIT_GH"
  forge_issue_var "$CONTROL_BRANCH" || FORGE_ISSUE=""
  forge_pr_var "$CONTROL_BRANCH" || FORGE_PR=""
  [ -z "$FORGE_ISSUE" ] || forge_set_state "$FORGE_ISSUE" running || :
  [ -z "$FORGE_PR" ] || forge_set_state "$FORGE_PR" running || :
  exit "$status"
}

# The fields of a `pull_request_review` event control reads beyond the shared ones.
REVIEW_ID=""
REVIEW_URL=""
REVIEW_AT=""
REVIEW_HEAD=""

# control_review_story — refused unless origin's tip of CONTROL_BRANCH carries
# its story index, which the round's statistics step reads.
control_review_story() {
  local state_rel
  state_rel=$(hr_state_dir "$root" 2>/dev/null) || state_rel=""
  state_rel="${state_rel%/}"
  if [ -z "$state_rel" ] \
    || ! git -C "$root" cat-file -e "refs/remotes/origin/$CONTROL_BRANCH:$state_rel/story_plans/${CONTROL_BRANCH}_story_plan.md" 2>/dev/null; then
    control_refuse "$EXIT_REFUSED" "\`$CONTROL_BRANCH\` carries no story index (\`$state_rel/story_plans/${CONTROL_BRANCH}_story_plan.md\`), which a user-review round reads, so the round cannot start on this branch" \
      "Review a branch whose run has planned its stories."
  fi
}

# control_review_round <file> — write the round to <file>: the review body
# verbatim, the provenance, then the reviewer's inline comments from the pull
# request's comments endpoint (the per-review one carries no line numbers). A
# comment is kept when it belongs to this review, or was created after the
# commit of the branch's newest round; with no round yet, every one is kept.
control_review_round() {
  local file="$1" state_rel boundary inline
  if ! gh_call api --paginate "repos/$FORGE_REPO/pulls/$CONTROL_NUMBER/comments"; then
    control_refuse "$EXIT_GH" "the inline comments of pull request #$CONTROL_NUMBER could not be read ($GH_ERR)" \
      "Submit the review again to retry."
  fi
  state_rel=$(hr_state_dir "$root" 2>/dev/null) || state_rel=""
  state_rel="${state_rel%/}"
  # Epoch seconds, so the comparison with `created_at` reads no time zone.
  if ! boundary=$(git -C "$root" log -1 --format=%ct "refs/remotes/origin/$CONTROL_BRANCH" -- \
    "$state_rel/user_reviews/${CONTROL_BRANCH}_review.md" \
    "$state_rel/user_reviews/${CONTROL_BRANCH}_review_[0-9]*.md" 2>/dev/null); then
    control_refuse "$EXIT_PLACEMENT" "the previous round of \`$CONTROL_BRANCH\` could not be read, so nothing was dispatched" \
      "Submit the review again to retry."
  fi
  # A paginated listing is one JSON array per page; jq builds the text, so a
  # comment is data and never shell source. A hunk's fence is one backtick
  # longer than its longest backtick run, at least three.
  if ! inline=$(printf '%s' "$GH_OUT" | jq -s -j --arg who "$CONTROL_ACTOR" --argjson rid "$REVIEW_ID" --arg since "$boundary" '
    [ .[] | if type == "array" then .[] else error("not a page") end
      | select(.user.login == $who)
      | select(.pull_request_review_id == $rid or $since == ""
          or (((.created_at // "") | try fromdateiso8601 catch 0) > ($since | tonumber))) ]
    | sort_by([.created_at, .id])
    | if length == 0 then "" else
        "\n## Inline comments\n" + (map(
          (.diff_hunk // "") as $h
          | (([$h | match("`+"; "g") | .length] | max) // 0) as $m
          | ("`" * ([$m + 1, 3] | max)) as $f
          | "\n### `" + (.path // "") + "`"
            + (if .line != null then ", line \(.line)"
               elif .original_line != null then ", original line \(.original_line) (outdated)"
               else "" end)
            + "\n\nMade on commit `" + (.original_commit_id // .commit_id // "") + "`.\n\n"
            + (.body // "") + (if ((.body // "") | endswith("\n")) then "" else "\n" end)
            + "\n" + $f + "diff\n" + $h + (if ($h | endswith("\n")) then "" else "\n" end) + $f + "\n"
        ) | join(""))
      end + "x"' 2>/dev/null); then
    GH_ERR="its comment list is not the expected JSON"
    control_refuse "$EXIT_GH" "the inline comments of pull request #$CONTROL_NUMBER could not be read ($GH_ERR)" \
      "Submit the review again to retry."
  fi
  # The trailing `x` keeps the text's final newline through the substitution.
  inline=${inline%x}
  {
    if [ -n "$CONTROL_BODY" ]; then
      printf '%s' "$CONTROL_BODY"
      case "$CONTROL_BODY" in *$'\n') ;; *) printf '\n' ;; esac
    else
      printf '%s\n' '(The review carries no summary.)'
    fi
    printf '\n---\n\nSubmitted as a review requesting changes by @%s on pull request #%s (%s) at %s.\n' \
      "$CONTROL_ACTOR" "$CONTROL_NUMBER" "$REVIEW_URL" "$REVIEW_AT"
    printf '%s' "$inline"
  } >"$file" || control_refuse "$EXIT_PLACEMENT" "the round could not be written to '$file', so nothing was dispatched" \
    "Submit the review again to retry."
}

# control_review — the round of one review requesting changes, placed and
# dispatched by a `review` child, the local relay's own verb.
control_review() {
  local dir file out way
  control_review_story
  if ! dir=$(mktemp -d "$control_tmp/harness-control-review.XXXXXX"); then
    control_refuse "$EXIT_PLACEMENT" "a round directory could not be created under '$control_tmp', so nothing was dispatched" \
      "Submit the review again to retry."
  fi
  control_dirs="$control_dirs $dir"
  file="$dir/review.md"
  control_review_round "$file"
  out="$dir/review.out"
  set -- review "$CONTROL_BRANCH" --review-file "$file" --allow-no-run --actor "$CONTROL_ACTOR"
  case "$REVIEW_URL" in
    https://*) set -- "$@" --source "$REVIEW_URL" ;;
  esac
  control_child "$out" "$@" --repo "$root"
  cat "$out" 2>/dev/null || :
  case "$CHILD_STATUS" in
    0) exit "$EXIT_OK" ;;
    2)
      way="Submit the review again once that is fixed."
      case "$CHILD_LAST" in
        *" is running on GitHub"*) way="A round is in progress; submit your review again once it completes." ;;
      esac
      control_refuse "$EXIT_REFUSED" "the round was refused ($CHILD_LAST)" "$way" ;;
    3)
      control_refuse "$EXIT_GH" "the round is pushed but its dispatch failed ($CHILD_LAST)" \
        "Re-send the dispatch as that line says." ;;
    4)
      control_refuse "$EXIT_PLACEMENT" "placing the round failed and nothing was dispatched ($CHILD_LAST)" \
        "Submit the review again to retry." ;;
    *)
      control_refuse "$EXIT_GH" "the round could not be started ($CHILD_LAST)" "Submit the review again to retry." ;;
  esac
}

# control_review_intake — read a `pull_request_review` event; returns 1 when it
# is ignored, after one line.
control_review_intake() {
  local action state head_repo
  { event_field '.action // ""' && action="$EVENT_VALUE" \
    && event_field '.review.state // ""' && state="$EVENT_VALUE" \
    && event_field '.review.body // ""' && CONTROL_BODY="$EVENT_VALUE" \
    && event_field '.review.id // ""' && REVIEW_ID="$EVENT_VALUE" \
    && event_field '.review.html_url // ""' && REVIEW_URL="$EVENT_VALUE" \
    && event_field '.review.submitted_at // ""' && REVIEW_AT="$EVENT_VALUE" \
    && event_field '.pull_request.number // ""' && CONTROL_NUMBER="$EVENT_VALUE" \
    && event_field '.pull_request.head.ref // ""' && REVIEW_HEAD="$EVENT_VALUE" \
    && event_field '.pull_request.head.repo.full_name // ""' && head_repo="$EVENT_VALUE" \
    && event_field '.sender.login // ""' && CONTROL_ACTOR="$EVENT_VALUE" \
    && event_field '.sender.type // ""' && CONTROL_SENDER_TYPE="$EVENT_VALUE"; } || {
    echo "remote-run.sh: control: '$GITHUB_EVENT_PATH' is not a readable event" >&2
    exit "$EXIT_USAGE"
  }
  if [ "$action" != submitted ]; then
    echo "remote-run.sh: control: ignored, a review $action, not submitted"
    return 1
  fi
  # The REST API reports states in uppercase, the webhook in lowercase.
  if [ "$(printf '%s' "$state" | tr '[:upper:]' '[:lower:]')" != "$REVIEW_ROUND_STATE" ]; then
    echo "remote-run.sh: control: ignored, a review whose state is ${state:-empty}, not $REVIEW_ROUND_STATE"
    return 1
  fi
  case "$CONTROL_BODY" in
    *"$COMMENT_MARKER"*)
      echo "remote-run.sh: control: ignored, a review carrying the harness's marker"
      return 1 ;;
  esac
  # A fork's review job holds a read-only token, so it is not even replied to.
  if [ -z "$head_repo" ] || [ "$head_repo" != "${GITHUB_REPOSITORY-}" ]; then
    echo "remote-run.sh: control: ignored, a review of a head in ${head_repo:-an unnamed repository}, not ${GITHUB_REPOSITORY:-this repository}"
    return 1
  fi
  case "$REVIEW_ID" in
    ''|*[!0-9]*|0*)
      echo "remote-run.sh: control: the event carries no review id" >&2
      exit "$EXIT_USAGE" ;;
  esac
  CONTROL_VERB=review
  return 0
}

# control_comment_intake — read an `issue_comment` event; returns 1 when it is
# ignored, after one line.
CONTROL_SENDER_TYPE=""
CONTROL_IS_PR=""
control_comment_intake() {
  local action first word rest handle
  { event_field '.action // ""' && action="$EVENT_VALUE" \
    && event_field '.comment.body // ""' && CONTROL_BODY="$EVENT_VALUE" \
    && event_field '.issue.number // ""' && CONTROL_NUMBER="$EVENT_VALUE" \
    && event_field '.issue.pull_request.url // ""' && CONTROL_IS_PR="$EVENT_VALUE" \
    && event_field '.sender.login // ""' && CONTROL_ACTOR="$EVENT_VALUE" \
    && event_field '.sender.type // ""' && CONTROL_SENDER_TYPE="$EVENT_VALUE"; } || {
    echo "remote-run.sh: control: '$GITHUB_EVENT_PATH' is not a readable event" >&2
    exit "$EXIT_USAGE"
  }

  if [ "$action" != created ]; then
    echo "remote-run.sh: control: ignored, a comment $action, not created"
    return 1
  fi
  case "$CONTROL_BODY" in
    *"$COMMENT_MARKER"*)
      echo "remote-run.sh: control: ignored, a comment the harness posted"
      return 1 ;;
  esac
  first=${CONTROL_BODY%%$'\n'*}
  first=${first%$'\r'}
  first=${first#"${first%%[!$' \t']*}"}
  word=${first%%[$' \t']*}
  rest=${first#"$word"}
  rest=${rest#"${rest%%[!$' \t']*}"}
  handle=$(printf '%s' "$COMMAND_HANDLE" | tr '[:upper:]' '[:lower:]')
  if [ "$(printf '%s' "$word" | tr '[:upper:]' '[:lower:]')" != "$handle" ]; then
    echo "remote-run.sh: control: ignored, the first line does not open with $COMMAND_HANDLE"
    return 1
  fi
  word=${rest%%[$' \t']*}
  CONTROL_VERB=$(printf '%s' "$word" | tr '[:upper:]' '[:lower:]')
  CONTROL_ARGS=${rest#"$word"}
  CONTROL_ARGS=${CONTROL_ARGS#"${CONTROL_ARGS%%[!$' \t']*}"}
  return 0
}

verb_control() {
  local LC_ALL=C
  local review=0 forge="" target="" status verbs="" v
  case "${GITHUB_EVENT_NAME-}" in
    issue_comment) ;;
    pull_request_review) review=1 ;;
    *)
      echo "remote-run.sh: control handles GITHUB_EVENT_NAME issue_comment or pull_request_review, not '${GITHUB_EVENT_NAME-}'" >&2
      exit "$EXIT_USAGE" ;;
  esac
  if [ -z "${GITHUB_EVENT_PATH-}" ] || [ ! -f "$GITHUB_EVENT_PATH" ] || [ ! -r "$GITHUB_EVENT_PATH" ]; then
    echo "remote-run.sh: control: cannot read the event file '${GITHUB_EVENT_PATH-}'" >&2
    exit "$EXIT_USAGE"
  fi
  hr_have_jq || { echo "remote-run.sh: control needs jq" >&2; exit "$EXIT_USAGE"; }

  if [ "$review" -eq 1 ]; then
    control_review_intake || return 0
  else
    control_comment_intake || return 0
  fi

  case "$CONTROL_NUMBER" in
    ''|*[!0-9]*|0*)
      echo "remote-run.sh: control: the event carries no issue number" >&2
      exit "$EXIT_USAGE" ;;
  esac

  control_tmp="${RUNNER_TEMP-}"
  if [ -z "$control_tmp" ] || [ ! -d "$control_tmp" ]; then
    control_tmp=$(mktemp -d) || { echo "remote-run.sh: control: mktemp failed" >&2; exit "$EXIT_USAGE"; }
    control_dirs="$control_tmp"
  fi
  trap control_cleanup EXIT

  if [ -n "${HARNESS_REMOTE_STOP-}" ]; then
    control_refuse "$EXIT_REFUSED" "the repository variable \`HARNESS_REMOTE_STOP\` is set, which stops every command" \
      "Clear it under **Settings → Secrets and variables → Actions → Variables**, then comment again."
  fi

  forge=$(hr_forge "$root") || forge=""
  target=$(hr_execution_target "$root") || target=""
  if [ "$forge" != github ] || [ "$target" != github-actions ]; then
    control_refuse "$EXIT_REFUSED" "the default branch's \`harness.config.json\` does not turn run control on: it needs \`forge\` set to \`github\` (it is ${forge:-not set or unreadable}) and \`execution.target\` set to \`github-actions\` (it is ${target:-unreadable})" \
      "Set both keys on the default branch, then comment again."
  fi

  status=0
  authorise_actor "$CONTROL_ACTOR" "$CONTROL_SENDER_TYPE" || status=$?
  if [ "$status" -ne 0 ]; then
    control_refuse "$EXIT_REFUSED" "${AUTH_WHY%.}" \
      "Only a collaborator with write, maintain or admin access, or a bot listed in the repository variable \`HARNESS_TRIGGER_ALLOWED_BOTS\`, commands a run."
  fi

  if [ "$review" -eq 0 ] && { [ -z "$CONTROL_VERB" ] || ! control_verb_handled "$CONTROL_VERB"; }; then
    for v in $COMMAND_VERBS; do
      [ "$v" != answer ] || v="answer [<n>]"
      verbs="$verbs${verbs:+, }\`$COMMAND_HANDLE $v\`"
    done
    control_refuse "$EXIT_REFUSED" "it is not a command this harness carries out" \
      "The commands are $verbs; \`docs/github-run-control.md\` in the harness documentation states each."
  fi

  forge_repo_var || control_reply "$EXIT_GH" "@$CONTROL_ACTOR: \`$CONTROL_VERB\` was not run: the repository's name could not be read."
  if [ "$review" -eq 1 ]; then
    control_check_branch "$REVIEW_HEAD"
  elif [ -n "$CONTROL_IS_PR" ]; then
    control_branch_from_pr "$CONTROL_NUMBER"
  else
    control_branch_from_issue "$CONTROL_NUMBER"
  fi

  echo "remote-run.sh: control: $CONTROL_VERB on $CONTROL_BRANCH from @$CONTROL_ACTOR on #$CONTROL_NUMBER"
  case "$CONTROL_VERB" in
    answer) control_answer ;;
    pause) control_pause ;;
    stop) control_stop ;;
    resume) control_resume ;;
    clear) control_clear ;;
    review) control_review ;;
  esac
}

# ---------------------------------------------------------------------------
# `discard` — remove a directory a command fetched into, inside scratch only.
# ---------------------------------------------------------------------------

# The removal lives here rather than in the command because a supervised or
# auto-mode session may refuse a recursive `rm` the agent types, and a
# user-level `rm -rf` deny cannot be overridden (`.claude/context/
# conventions.md` -> `## Shell assets`). The scope is the scratch directory
# only, per the lessons ledger's rule that a script "never removes one it did
# not create": scratch holds only throwaway files a session itself wrote. Containment is `hr_scratch_path_var`'s alone; this verb
# maps its status and acts on `HR_SCRATCH_TARGET`. It never creates anything.
verb_discard() {
  local status
  hr_scratch_path_var "$root" "$discard_dir" "$discard_base"
  status=$?
  case "$status:$HR_SCRATCH_WHY" in
    0:*) ;;
    1:dotdot)
      echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' carries '..'" >&2
      exit "$EXIT_REFUSED" ;;
    1:charset)
      echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' carries a character a scratch path may not" >&2
      exit "$EXIT_REFUSED" ;;
    1:itself)
      echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' is the scratch directory itself" >&2
      exit "$EXIT_REFUSED" ;;
    1:symlink)
      echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' is a symlink" >&2
      exit "$EXIT_REFUSED" ;;
    1:*)
      echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' is not inside '$HR_SCRATCH_DIR/'" >&2
      exit "$EXIT_REFUSED" ;;
    2:*)
      echo "remote-run.sh: discard: the parent directory of '$discard_dir' cannot be resolved; nothing removed" >&2
      exit "$EXIT_USAGE" ;;
    3:no-scratch)
      echo "remote-run.sh: discard: the state directory's scratch/ under '$root' does not exist; nothing removed" >&2
      exit "$EXIT_USAGE" ;;
    3:*)
      echo "remote-run.sh: cannot resolve '$root/harness.config.json'" >&2
      exit "$EXIT_USAGE" ;;
    *)
      usage "discard needs a <dir>" ;;
  esac
  if [ ! -e "$HR_SCRATCH_TARGET" ]; then
    echo "remote-run.sh: $discard_dir does not exist; nothing removed"
    return 0
  fi
  if [ ! -d "$HR_SCRATCH_TARGET" ]; then
    echo "remote-run.sh: discard refused, nothing removed: '$discard_dir' is not a directory" >&2
    exit "$EXIT_REFUSED"
  fi
  if ! rm -rf -- "$HR_SCRATCH_TARGET" || [ -e "$HR_SCRATCH_TARGET" ]; then
    echo "remote-run.sh: discard: removing '$discard_dir' failed" >&2
    exit "$EXIT_USAGE"
  fi
  echo "remote-run.sh: removed $discard_dir"
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
  fetch) verb_fetch ;;
  review) verb_review ;;
  trigger) verb_trigger ;;
  list) verb_list ;;
  discard) verb_discard ;;
  report) verb_report ;;
  deliver) verb_deliver ;;
  control) verb_control ;;
esac
exit "$EXIT_OK"
