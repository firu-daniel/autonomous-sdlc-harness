# Working a run from GitHub

**Who reads this:** a maintainer or team member who works runs from GitHub, and anyone changing `harness-control.yml`, `harness-run.yml`'s `collect` job or `remote-run.sh`'s `control`, `collect`, `report` and `deliver`. It owns the design of record for comment commands, review rounds, parks over comments, the draft pull request, lifecycle comments and state labels.

It cites rather than restates. Every GitHub fact below is cited from [`github-integration-research.md`](github-integration-research.md) by its ID (S3–S6, T1–T4, C1–C4), retrieved there on 2026-09-30 and not re-verified here. The run's own lifecycle is [`remote-execution.md`](remote-execution.md)'s, and starting a run is [`github-issue-trigger.md`](github-issue-trigger.md)'s. The code of record is `cli/templates/scripts/remote-run.sh` → the header's `control`, `collect`, `report` and `deliver` paragraphs, the header of `cli/templates/github/workflows/harness-control.yml`, and the `collect` job with its `THE COLLECT JOB` header paragraph in `cli/templates/github/workflows/harness-run.yml`.

---

## The GitHub entry point

GitHub is a second entry point **beside** the local one, never instead of it. One maintainer does the setup below once, on a machine of their own. After that, the people the allow-list `HARNESS_RUN_ACTORS` admits — until it is set, the owner alone of a repository a personal account owns, and nobody in an organisation-owned one — can start and work runs from GitHub with nothing installed ([§6](#6-who-can-act-and-pull-requests-from-forks)). Anyone with a local setup keeps every local command too, and can mix the two on the same run ([§7](#7-working-a-run-from-both-sides)).

**1. The one-time setup, by one maintainer, locally**, in order. Each step links to where its command is written:

1. Install the plugin ([`README.md`](../README.md) → `### Adopting it in your own repository`, step A).
2. Run `init` (the same section, step B).
3. Run `/autonomous-sdlc-harness:harness-analyze`. This is recommended, not required (the same section, step C).
4. Set `forge` to `github` and `execution.target` to `github-actions`, then run `init` again. That run writes the four workflows: `harness-run.yml`, `harness-resume.yml`, `harness-trigger.yml` and `harness-control.yml` ([`github-issue-trigger.md`](github-issue-trigger.md) → `## Turning it on, in short`, steps 1–2; [`remote-execution.md`](remote-execution.md) → `## 7. Turning it on`, steps 1–2).
5. Commit them ([`remote-execution.md`](remote-execution.md) → `## 7.`, step 3).
6. Give `gh` the `workflow` scope (the same step).
7. Push to the default branch (the same step).
8. Set a credential secret, and name who may spend it in `HARNESS_RUN_ACTORS` ([`remote-execution.md`](remote-execution.md) → `## 7.`, step 4).
9. Set `HARNESS_GIT_TOKEN` if tasks will edit `.github/workflows/*` ([`remote-execution.md`](remote-execution.md) → `### Every secret and variable`). This token also opens the draft pull request, so CI runs on it. Its owner becomes the pull request's author, and an author cannot request changes on their own pull request. So use a token from a machine account, especially if you maintain the repository alone, or plan to start review rounds locally with `/autonomous-sdlc-harness:branch-user-review` ([§4](#4-the-draft-pull-request)).
10. Create the trigger label `sdlc-harness` ([`github-issue-trigger.md`](github-issue-trigger.md) → `## Turning it on, in short`, step 4).
11. Switch on *Allow GitHub Actions to create and approve pull requests* unless `HARNESS_GIT_TOKEN` is set ([§4](#4-the-draft-pull-request)).

**2. What a team member the allow-list admits then does from GitHub alone:**

- labels an issue `sdlc-harness` to start a run ([`github-issue-trigger.md`](github-issue-trigger.md));
- answers, pauses, resumes or stops the run with `@sdlc-harness` comments ([§1](#1-commands-in-a-comment));
- requests changes on a pull request from the run's branch, draft or not, to start the next round ([§2](#2-a-review-that-requests-changes-starts-a-round));
- follows the run through its lifecycle comments and state labels ([§5](#5-lifecycle-comments-and-state-labels)).

The triage role is refused ([§6](#6-who-can-act-and-pull-requests-from-forks)).

**3. What still needs a local machine:**

- Running or re-running `/autonomous-sdlc-harness:harness-analyze`. It is supervised and has no remote route ([`github-integration-research.md`](github-integration-research.md) → A12).
- Upgrading, with `init --upgrade-workflows` or `init --force`, because the workflows pin the harness version ([`remote-execution.md`](remote-execution.md) → `### Upgrading`).

  **Coming from 0.6.1.** `harness-control.yml` as 0.6.1 wrote it is not valid YAML, so GitHub runs it for no event: no comment, review, close or deletion reaches the run ([`development.md`](development.md) → Gate 12 → Round 7, finding 1). Run `init` at a later version, where `<version>` is that version:

  ```
  npx autonomous-sdlc-harness@<version> init
  ```

  An unedited copy is replaced, the old one kept as a `.bak`, and `init` prints the commands that commit it, give `gh` the `workflow` scope and push it. An edited copy is kept, with a warning: write its job `if:` as a folded block scalar, `if: >-` with the expression on the next line, or replace the file by regenerating every generated file, each after a `.bak`:

  ```
  npx autonomous-sdlc-harness@<version> init --force
  ```

  Either way, commit the file and push it to the default branch. `doctor --check-github` fails on a copy GitHub could not parse, and names the same route:

  ```
  npx autonomous-sdlc-harness@<version> doctor --check-github
  ```
- Running `doctor`.
- A configuration change that needs files re-rendered. A plain switch in `harness.config.json` can be edited in a pull request on GitHub, because the job reads that file from the branch.
- The interactive-test phase. A remote run skips it, so while `phases.qa` is on the branch still owes a local `/autonomous-sdlc-harness:branch-qa-test`, until `ROADMAP.md`'s *Cloud QA* row lands ([`remote-execution.md`](remote-execution.md) → `### The interactive-test phase`).

**4. The caveats:**

- Every run uses the repository's one credential secret and is billed to its owner ([`remote-execution.md`](remote-execution.md) → `## 9. Credentials and billing`). In a team, a teammate's run therefore spends that owner's account; why, and the alternatives, are in [`team-accounts-research.md`](team-accounts-research.md).
- On a public repository, the comments are public ([§6](#6-who-can-act-and-pull-requests-from-forks)).
- If `HARNESS_GIT_TOKEN` is a person's own token, that person cannot start a round with *Request changes* on the pull request it opened ([§4](#4-the-draft-pull-request), [§8](#8-what-is-not-verified-here)).

---

## 1. Commands in a comment

**A command is a new comment whose first line opens with `@sdlc-harness`, followed by a verb.** The handle must be the first word of the first line; leading spaces and tabs are skipped, and the handle and the verb are matched case-insensitively. Text after `pause`, `resume`, `stop`, `clear` or `status` on the same line is ignored. A comment is read once, when it is created: an edited comment is never re-read, so a correction is a new comment.

```
@sdlc-harness pause
```

```
@sdlc-harness resume
```

```
@sdlc-harness stop
```

```
@sdlc-harness clear
```

```
@sdlc-harness status
```

`answer` takes the question's index on the first line and the answer on the lines below it:

```
@sdlc-harness answer 2
Use the existing date helper rather than adding a new one.
```

The index may be left out only when exactly one question is open, because issue comments have no threads to say which one a reply belongs to. When nothing follows the first line, the text after the index is the answer.

| Command | What it does | Accepted when | The same as |
|---|---|---|---|
| `answer [<n>]` | Writes the answer to question `<n>` and sends it as its own `resume: answer` dispatch | The run is parked and `<n>` is an open question; a run whose job GitHub never started is answered with the engine its dispatch's comment recorded ([§5](#5-lifecycle-comments-and-state-labels)) | `/autonomous-sdlc-harness:branch-answer` |
| `pause` | Sends `remote-run.sh pause`; the run yields at its next clean checkpoint | The run is running | `/autonomous-sdlc-harness:branch-pause` |
| `resume` | Sends the `resume: pause` dispatch for the run's engine | The run is paused, whatever its pause reason, `expired` and `killed` included; a run whose job GitHub never started resumes with the engine its dispatch's comment recorded, a branch's first run included ([§5](#5-lifecycle-comments-and-state-labels)) | `/autonomous-sdlc-harness:branch-resume` |
| `stop` | Sends `remote-run.sh stop`: the stop marker, then cancelling every queued or running job of the branch | Any run of the branch is known | `remote-run.sh stop <branch>` |
| `clear` | Sends the `resume: pause` dispatch with `park_loop_clear` set, releasing the park-loop hold | The run is held in a park loop | `/autonomous-sdlc-harness:branch-resume` on a park loop |
| `status` | Replies with the run's state, the next ledger entry, the open questions and the latest run; changes nothing. A ledger that reads fully ticked is qualified, as below the table | Any state | `/autonomous-sdlc-harness:branch-status` |

A command whose state does not match is refused with a reply naming the state and the command that does apply: `resume` on a park loop points at `clear`, and on a parked run at `answer` with the open indexes. `answer`, `resume` and `clear` on a run that is still running are refused rather than queued, so nothing waits behind a job and is lost when a newer pending run cancels it. `status` is never refused for the run's state, a run in flight included, because it sets no label and dispatches nothing.

When the flow-progress ledger on the branch tip reads fully ticked, `status` says one of three things instead of naming a next entry:

- when the tip carries a `chore: add user review for <branch>` commit newer than the ledger's last change: ``A user-review round has started on `<branch>`, and its flow-progress ledger is not written yet.``
- otherwise, when the run is `running`: `The run is still running, and its flow-progress ledger has no open entry: it is finishing its last step, or a new stage has not written its ledger yet.`
- otherwise: `Every entry of the flow-progress ledger is ticked.`

**Why `status` exists.** A run worked from GitHub alone had no way to ask its state: the only answer was a local `/autonomous-sdlc-harness:branch-status`, which needs the setup this entry point exists to spare. The command reads only what is already there — the branch's run list, the run's state bundle and the flow-progress ledger on the branch tip — so it adds no state of its own to keep true. A round's job writes its fresh ledger only after it starts, so a reply in that gap read the previous engine's completed ledger and called it all ticked while the run was `running`; the three replies above exist for that gap ([`development.md`](development.md) → Gate 12 → Round 7, finding 2).

**Never a command:**

- `pause` — no handle;
- `pause this` — no handle;
- `Let's @sdlc-harness pause` — the handle is not the first word;
- `> @sdlc-harness pause` — a quote is not the first word either;
- an edited comment, whatever it now says;
- any comment carrying the harness's hidden line, which opens `<!-- sdlc-harness`. Every comment the harness posts carries it, so a harness reply that quotes a command never acts on it, and the harness's own comments are ignored without a reply.

**Who and where.** A command is obeyed only from a collaborator whose permission on the repository is `admin` or `write` and whom the allow-list `HARNESS_RUN_ACTORS` admits, or from a bot listed in `HARNESS_TRIGGER_ALLOWED_BOTS`. The permission API reports the maintain role as `write`, so it passes, and triage as `read`, so it is refused (T3). The list is read after the permission, so a writer it does not admit is refused with a reply naming it. This is the trigger's own check ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 3. Who can start a run`). A command on a pull request acts on its head branch. A command on an issue acts on the branch the trigger started from that issue, read from the trigger's own `started` comment, posted by `github-actions[bot]`. Either branch must be unprotected, and is acted on when any one of three holds:

- its tip on origin carries the run's flow-progress ledger;
- the command is on an issue, the branch is the one that issue's `started` comment names, and the branch still exists on origin;
- a `harness run <branch>` run is queued or in progress, which covers a pull request whose head has no ledger yet.

An issue keeps its `started` comment after its branch is deleted, so a branch it names that is gone from origin is refused as deleted, `` `<branch>` no longer exists on origin, so its run cannot be resumed or commanded ``, and never as not a harness branch. Any other branch is refused with `` `<branch>` is not a harness branch: its tip carries no flow-progress ledger, and no `harness run <branch>` run is queued or in progress ``. A run list or an existence check that cannot be read is a refusal naming that read. So a run can be stopped or paused from its first minute, before its ledger is committed ([`development.md`](development.md) → Gate 12 → Round 8, finding 5), and a first run GitHub never started, whose branch carries only its task prompt, can be resumed from its issue (finding 3).

**Replies.** Every accepted command gets a reply naming the actor, the command and what was done, for example:

```
Pause requested by @<login>; the run on `<branch>` yields at its next clean checkpoint, and a paused comment follows.
```

Every refused command gets a reply in one form, `` @<login>: `<verb>` was not run: <reason>. <way on> ``. The checks run in this order, and the first that fails is the one replied:

1. the repository variable `HARNESS_REMOTE_STOP` is set;
2. the default branch's `harness.config.json` does not set `forge` to `github` and `execution.target` to `github-actions`. This is checked before the actor, so a disabled coupling asks GitHub nothing about the commenter;
3. the commenter is not authorised;
4. the verb is not one of the six.

An unknown verb's reply lists all six:

```
The commands are `@sdlc-harness answer [<n>]`, `@sdlc-harness pause`, `@sdlc-harness resume`, `@sdlc-harness stop`, `@sdlc-harness clear`, `@sdlc-harness status`; `docs/github-run-control.md` in the harness documentation states each.
```

**A refusal is a success.** The `harness control` run that replied with a refusal concludes `success`, because the refusal was answered: nobody gets a failure e-mail for a command that was correctly turned down. Only a failure to act or to reply fails the run.

**The handle.** Type `@sdlc-harness` in full: GitHub does not autocomplete it. It renders as a link to [github.com/sdlc-harness](https://github.com/sdlc-harness), a placeholder organisation created only so that nobody else can take the name. It is not a user, not an app and not a member of any repository, so nothing is notified. The command is matched as **text** in the comment by `control`, never delivered through the mention. A comment that contains `@claude` as a word also triggers `anthropics/claude-code-action` where that action is installed (C4), and a harness command needs no such word. The shorter `@harness` was not used because it belongs to another organisation (`gh api users/harness`, observed by the maintainer on 2026-10-01).

---

## 2. A review that requests changes starts a round

**Only a submitted review whose state is `changes_requested` starts a round.** *Approve* and *Comment* start nothing, whatever their text. Their summary is not lost, though: it rides along in the next round that a review requesting changes starts. The event payload carries the state in lowercase and the REST API in uppercase (`CHANGES_REQUESTED`), so it is compared case-insensitively (C1). Only the review event starts a round. `pull_request_review_comment` is not listened to, because one review raises one such event per inline comment, and the round would start once per comment (C1).

**What the round carries.** A round is cumulative. Its file, `<stateDir>/user_reviews/<branch>_review[_<n>].md`, carries every review and every inline comment on the pull request, from every authorised reviewer, made since the previous round and not recorded by any earlier round, not only the reviews requesting changes. A draft review GitHub still lists as `PENDING` is never taken. In order:

- one `## Review by @<login>` section per review, oldest first. A review requesting changes always gets a section, holding its body verbatim or `(The review carries no summary.)` when it has none. A *Comment* or *Approve* review gets one only when its body is not empty or blank; otherwise it is skipped and its id is not recorded. Each section ends with a provenance line naming the review's state: `Requested changes on pull request #<n> (<url>) at <submitted_at>.`, `Commented on pull request #<n> (<url>) at <submitted_at>.`, `Approved pull request #<n> (<url>) at <submitted_at>.`, `Reviewed pull request #<n> (<url>) at <submitted_at>; the review has since been dismissed.`, or, for any other state, `Reviewed pull request #<n> (<url>) at <submitted_at> (state <state>).`;
- under `## Inline comments`, oldest first, every pending inline comment, by any author and whatever the state of the review it belongs to;
- a closing marker line, `<!-- sdlc-harness round collected_at=<utc> reviews=<id,…> comments=<id,…> -->`, listing exactly the review and comment ids written to the file.

**Since the previous round, and never twice.** What earlier rounds consumed is the union of the ids every marker line on the branch tip records. Items are listed from the newest marked round's `collected_at` less `ROUND_OVERLAP_SECS` (300 seconds), so a runner whose clock runs behind loses nothing; the overlap re-lists some items, and the id check drops them again. Where no round carries a marker, because it was placed before markers existed or by the local command, which consumes no pull-request item, the boundary is the committer time of the branch's newest round file, and there is none when there is no round. An inline comment that belongs to a pending review is collected whatever its time, because a draft comment is created before its review is submitted.

**Each author vouches for their own text.** An item is collected only when its own author passes the §6 check, each author checked once. A refused author's items are left out, and the job log names the login and how many items were dropped. A permission call that fails fails the whole collection: a missing answer never counts as a pass.

**Why each comment carries its commit and hunk.** Each inline comment is written as a `` ### `<file>`, line <n> `` heading, then `` Made on commit `<sha>`. ``, then `By @<login>: <url>`, naming its author and linking it on GitHub, its body verbatim, and its `diff_hunk` in a `diff` fence. Once a later push moves the code, GitHub reports the comment's `line` as `null` (C1), so an outdated comment's heading gives its original line instead and says `(outdated)`. The reviews and comments come from the pull request's paginated review and comment listings, filtered as above, and not from the per-review endpoint, which carries no `line` at all (C1). The line is never the fix plan's coordinate. `user-review-fix-plan-writer` reads the file as the reviewer saw it at the recorded commit and re-locates the comment in the current tree by the hunk's context and added lines, because this round's fixes or an earlier round's may have moved it.

**How the round is numbered.** From the branch tip on `origin`, by the anchored rule of `/autonomous-sdlc-harness:branch-user-review` step 3: each file under `<stateDir>/user_reviews/` matching `^(.+)_review(_[0-9]+)?\.md$` whose captured branch **equals** the branch, the unsuffixed file being round 1. The next round is `<branch>_review.md` when none matched, otherwise `<branch>_review_<max+1>.md`.

**How it is sent.** `control` runs `remote-run.sh review`, which commits the round as `chore: add user review for <branch>`, pushes it and dispatches `engine: user_review`, exactly as the local command's GitHub route does (`plugin/commands/branch-user-review.md`, step 7). It then waits until GitHub lists the dispatched run. The `collect` job of `harness-run.yml` sends a round the same way, through `remote-run.sh review`; a round it could not place leaves one comment on the pull request, offering a re-run of that `collect` job, with no new review needed, or a new review requesting changes. No working copy is bootstrapped and no code from the pull request is run.

**Which pull requests count.** A review counts on **a pull request from the run's branch**: a head branch in this repository, unprotected, whose tip carries `<stateDir>/flow_progress/<branch>_progress.md`. Who opened the pull request does not matter, and neither does whether it is a draft. Marking it ready for review does not close it to rounds. The reviewer passes the same checks as a commenter (§1, *Who and where*). A refusal is a reply on the pull request.

**The story index.** A round also needs `<stateDir>/story_plans/<branch>_story_plan.md` at the branch tip, because the round's statistics step reads it. A review on a branch without one is refused with a reply.

**A run in flight.** A review arriving while the branch's newest run is queued, running, parked, held in a park loop, paused or stopped is **accepted**, and nothing is pushed or dispatched:

- The reply says the review was collected, names the state, and says the next round starts by itself when that run finishes. Where the state has a way on, the reply names it: `@sdlc-harness answer <n>` for a park, `@sdlc-harness clear` for a park loop, `@sdlc-harness resume` for a pause, and, for a usage pause, that the run resumes by itself after the reset.
- A stopped run is named `stopped`, whatever state its bundle was left in, once the branch's newest `harness stop` run is newer than its newest `harness run` run. Its way on is `@sdlc-harness resume`, with three exceptions that follow the state the stop left: stopped while parked, the answer resumes it (`@sdlc-harness answer <n>`); stopped while held in a park loop, `@sdlc-harness clear` resumes it; stopped while its cancelled job is still finishing, `@sdlc-harness resume` once that job has ended.
- When that run ends `completed` or `failed`, the `collect` job of `harness-run.yml` starts the next round from every review collected meanwhile. Nobody resubmits. A round `collect` could not place leaves one comment naming why, and offering a re-run of that run's `collect` job, with no new review needed, or a new review requesting changes.
- A review already taken into a round is answered with that round's number.
- The local `/autonomous-sdlc-harness:branch-user-review` still refuses while a run is in flight, because its review text exists only on the user's machine and no later job can collect it.

**Comments left while a round runs are not lost.** Every review requesting changes, every *Comment* or *Approve* review carrying a summary, and every inline comment left during a round stays on the pull request, and the next round collects it because collection is cumulative: at the end of the run in flight when a review requesting changes is pending, and otherwise with the next review that requests changes. The summaries of *Comment* and *Approve* reviews start no round, as inline comments start none; they wait, unrecorded, for the next round a review requesting changes starts. A round that fails to place loses nothing either: the reviews stay on the pull request for the next collection.

**One writer at a time.** Two concurrency groups keep the branch to one writer:

- The run's `run` job holds `harness-run-<branch>`.
- A round is placed only by a review job of `harness-control.yml` or by the `collect` job of `harness-run.yml`. Both hold `harness-review-<branch>`, and both place a round only when no `run` job of the branch is running or queued. Comment jobs get a group of their own, so a command is never dropped.
- `review` holds the group until GitHub lists the run it dispatched, so the next job in the group never reads the branch as settled before that run appears.

So two reviews submitted together become one round: the second job finds the first one's reviews recorded, or finds the round's run in flight and answers "collected". A pending review job that GitHub replaces with a newer one loses nothing, because the newer one collects cumulatively and the round's comment names every reviewer it took. The replaced job posts no reply, though, so when three or more reviews land while a review job is running, a reviewer whose job was replaced may get no "collected" reply. Their review is still collected.

**A push that loses a race fails loudly, and is never fetched, rebased or retried.** Under the invariant above, a lost push means something outside it pushed: a person's own push, or a local `/autonomous-sdlc-harness:branch-user-review` racing a GitHub round. Retrying would hide that, and would break things:

- For the run's job, an automatic rebase replays the run's commits on top of someone else's. The pushed history then differs from the tree its gates and reviews ran against, and an unattended job has no one to resolve a conflict.
- For a round placement, a retry would re-number and re-collect a round another writer has just placed. That is the double round the serialization exists to prevent.

So `review` exits 4 and nothing is dispatched. The reviews stay on the pull request, and the next collection takes them, so nothing is lost.

**A push the remote refused is retried.** A refusal that is not a lost race, such as a server-side failure, is retried by `push-branch.sh`, at most three attempts in all, because such a retry replays nothing and rebases nothing. A push git reports as `! [rejected]` is the lost race above and is never retried ([`development.md`](development.md) → Gate 12 → Round 8, finding 2; [`remote-execution.md`](remote-execution.md) → `### When GitHub fails or lags`). A placement that still fails names which of the two happened: `the remote refused the push`, or `origin/<branch> moved to <sha>`.

**A check at the end of the run, not `concurrency: queue: max`.** Collected reviews are picked up by the `collect` job when a run ends, rather than by queueing each review job behind the run. Nothing in this design rests on `queue: max`. It is deliberately not used, because 100 pending jobs is still a hard limit and the `collect` job needs no queue ([§8](#8-what-is-not-verified-here)).

---

## 3. Answering a park in a comment

**Each open question is posted whole, as one comment.** When a run parks, `report` posts one comment per open `question_<n>.md`, in ascending order, on the run's target (§5, *The target rule*). The comment opens with which run is waiting and on which question, then carries the file less any line naming its own `answer_<n>.md` — the local channel's instruction, which does not apply on GitHub — and ends with the answer form and a ready-to-copy block of `@sdlc-harness answer <n>`, so the comment carries one answer instruction. The canonical format already says a question file names no answer channel (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`); the removal covers a file written against it. One question per comment keeps the answer to it unambiguous, since issue comments have no threads.

**The size bound.** GitHub refuses a comment body over 262,144 bytes of UTF-8, with a refusal text that says `65536 characters` and so misstates the unit (S6). A question file larger than 250,000 bytes is cut at its last whole line within that bound, which leaves room for the comment's own lines. The comment then names the file, `question_<n>.md`, in the run's `harness-state` artifact, where the whole question is. S6 measured the bound on an issue comment; on a pull request's conversation it is unverified.

**The answer** is a new comment whose first line is `@sdlc-harness answer <n>` and whose following lines are the answer. This one answers question 2:

```
@sdlc-harness answer 2
Keep the existing retry count of three.
The new timeout applies only to the upload call.
```

- `<n>` may be left out when exactly one question is open; the question's comment says when that is so.
- A short answer may follow the index on the first line, when nothing follows below it.
- The answer is written byte for byte, a trailing carriage return stripped from each line, as untrusted task data: it is never run as a command.

**One answer, one dispatch.** Each comment is one event, so each answer is sent as its own `resume: answer` dispatch carrying that one answer, and nothing holds state between comments. That is safe because a job whose park is not fully answered stops parked before it starts a session, and its bundle then carries the answer it was sent, so the job for the last answer finds the set complete. While questions remain open, the reply names them and the label stays `sdlc-harness: parked`. Once none remain, the reply says the run resumes and the label moves to `sdlc-harness: running`.

**The refusals**, each a reply on the item that was commented on:

| The run, or the comment | The reply's way on |
|---|---|
| held in a park loop | comment `@sdlc-harness clear` |
| paused, its bundle expired included | comment `@sdlc-harness resume`, which restarts from the committed ledger |
| a job in flight | send the answer again once that job finishes; nothing is queued behind it |
| `<n>` is not an open question | the reply lists the open ones |
| several questions open and no `<n>` | the reply lists the open ones |
| an empty answer | send it again with the answer below the first line |
| the dispatch payload over GitHub's 65,535-character `workflow_dispatch` inputs limit (S5) | shorten the answer, or commit the text to a file on the branch |

A refused answer is refused rather than queued for the reason §1 gives: a newer pending run in the branch's concurrency group could cancel the job it waited behind.

**Why an answer is not a reply to the question.** An answer is the `@sdlc-harness answer <n>` command and nothing else. The other channels considered:

- **A quote reply** is rejected. A partial or ambiguous quote, a quote of a question already archived, and a quote made in ordinary discussion would each send text to the run as an answer. A quoted line opens `>`, so it is never a command anyway (§1, *Never a command*).
- **Any plain comment** is rejected, for the same reason at a larger scale: every remark on the item would become an answer.
- **A threaded pull-request review comment** is not taken now. Issues have no threads; the questions are posted on the issue until a pull request exists; and §2 deliberately does not listen to `pull_request_review_comment`. A proposal to the maintainer, not owed work: once the pull request opens with the run ([`development.md`](development.md) → `## 6.` item 19), the first two reasons no longer hold, and whether a thread reply is then worth listening to that event is the maintainer's to decide.
- **No short alias** is added. A second grammar for one command doubles what can be mistyped and refused.

**The comment is a transport, not a second format.** The question and answer files stay the ones `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)` defines: the question comment carries `question_<n>.md` less only a line naming its own `answer_<n>.md`, and `control` writes the answer to `answer_<n>.md` before it dispatches. A park answered by `/autonomous-sdlc-harness:branch-answer` and one answered in a comment reach the run in the same shape.

On a public repository a question comment and its answer are public, as the `harness-state` artifact already is ([`remote-execution.md`](remote-execution.md) → `## 11. Security`, *What a reader of the repository's Actions runs can see*).

---

## 4. The draft pull request

**When it opens.** `deliver`, a step of `harness-run.yml` after the branch is pushed, opens a draft pull request from the branch to the default branch when the run completed, executes on GitHub, and the default branch's `harness.config.json` sets `forge` to `github`. An open pull request from the branch is reused and no second one is opened. The flow itself opens none and merges none, and `push-branch.sh` still opens none: the flow runs unchanged wherever it executes, and opening a pull request is a forge concern of the GitHub job. It is a draft so that marking it ready for review is a person's step.

**The token.** The pull request is opened with the `HARNESS_GIT_TOKEN` secret when it is set, and otherwise with the job's own token.

- With `HARNESS_GIT_TOKEN`, the repository's CI runs on the pull request without an approval click (S3). To open it, that token needs *Pull requests* write beside *Contents* write and, for workflow files, *Workflows* write as a fine-grained token, or `repo` plus `workflow` as a classic token ([`github-integration-research.md`](github-integration-research.md) → S2, **Consequence**). A token without that access opens no pull request, and the `completed` comment names `gh`'s error.
- **What that costs.** A pull request opened with `HARNESS_GIT_TOKEN` is authored by the token's owner, and GitHub does not let a pull request's author request changes on their own pull request. So when the token is a person's own, that person cannot start a round from GitHub with *Request changes* (§2). This is GitHub's documented behaviour, not retrieved in [`github-integration-research.md`](github-integration-research.md). A solo maintainer sets the token of a machine account instead, or starts the round locally:

  ```
  /autonomous-sdlc-harness:branch-user-review
  ```

  Another reviewer with write access whom the allow-list admits can still request changes on it. So a solo maintainer who keeps their own token there needs a second reviewer, and that reviewer must be on `HARNESS_RUN_ACTORS` too ([§6](#6-who-can-act-and-pull-requests-from-forks)).
- With the job's own token, anyone with write access whom the allow-list admits can request changes and start a round, and CI on the pull request waits for a person to select **Approve workflows to run** (S3). The job's token needs Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to create and approve pull requests*, off by default for a new repository on a personal account and for a new organisation (S4, C3). With it off, the `completed` comment names that setting and `HARNESS_GIT_TOKEN`, and the branch's compare link for opening this one by hand.

**The plain mention.** The body names the issue the run was started from as `Started from #<n>.`, never a closing keyword such as `Closes #<n>` or `Fixes #<n>`, so merging the pull request never closes the issue. A maintainer who wants that adds the keyword. Closing the issue, closing or merging the pull request, or deleting the branch stops an unfinished run (§5, *Closed or deleted*). The body also states that a review requesting changes starts a round and which `@sdlc-harness` commands act on it.

**The issue's link to the pull request is the `completed` comment's URL.** With the job's token, GitHub puts no cross-reference on the issue: in Gate 12 round 6 the issue showed no `cross-referenced` event 45 minutes after the pull request opened ([`development.md`](development.md) → Gate 12 → Round 6, finding 5; [§8](#8-what-is-not-verified-here), *Verified in Gate 12 round 6*). Whether a pull request opened with `HARNESS_GIT_TOKEN` puts one there is unmeasured ([§8](#8-what-is-not-verified-here)). A proposal to the maintainer, not owed work: linking through the issue's Development panel. Once the pull request opens with the run ([`development.md`](development.md) → `## 6.` item 19), the branch could be created already linked to the issue. No roadmap item carries it; whether to do it is the maintainer's to decide.

**The one retry.** A draft that fails to open is retried once as a ready pull request, because drafts depend on the account's plan and the plan cannot be read from the job (C3; the fallback case is unmeasured). A refusal because of the Actions setting is not retried, since a ready pull request is refused the same way. A second failure is named in the `completed` comment with the compare link.

**A locally executed run gets none.** Nothing new is required of an adopter who runs only locally: no secret, no setting, no pull request appearing unasked. A person may open one by hand from the branch; it is then recognised like any other pull request from the run's branch (§2, *Which pull requests count*) and receives the run's comments and labels.

---

## 5. Lifecycle comments and state labels

**The target rule.** A lifecycle comment is posted on the run's recognised open pull request — one from the run's branch whose tip carries the flow-progress ledger (§2, *Which pull requests count*) — else on the issue the run was started from, read from the task prompt's provenance line, else nowhere. One rule means a team watches one place: the issue until there is a pull request, then the pull request. `completed` is the one event placed differently, as its row says, so that whoever watches the issue learns where the pull request is.

| Event | Where it is posted | What it says | The next GitHub action | The label it sets |
|---|---|---|---|---|
| `launched` | the issue, as the trigger's own `started` comment | the branch and the run's URL | none; work the run with the §1 commands | `sdlc-harness: running` |
| `parked` | the target, one comment per open question (§3) | the question whole, then the answer form | `@sdlc-harness answer <n>` | `sdlc-harness: parked` |
| `park_loop` | the target | the run parked again and again without progress and is on hold | `@sdlc-harness clear` | `sdlc-harness: parked` |
| `paused` | the target | the run paused, and why; a usage pause names the reset time | `@sdlc-harness resume`; for a usage pause none, since it resumes by itself after the reset | `sdlc-harness: paused` |
| `resumed` | the target | the run resumed | none | `sdlc-harness: running` |
| `failed` | the target | the run failed, and where its log is; posted once the job's automatic resumes are exhausted | on a pull request, a review that requests changes; on an issue, re-applying the trigger label, which starts a new run on the next indexed branch | `sdlc-harness: failed` |
| `not_started` | the target, posted by the `collect` job of the run's own workflow run | GitHub did not start the job of the run, so nothing ran and the branch is unchanged, and GitHub's reason | `@sdlc-harness resume` when the run's engine is recorded; otherwise the **Run workflow** form | `sdlc-harness: paused`; `sdlc-harness: failed` when no older run carries a bundle and no engine is recorded |
| `stopped` | the target | the run was stopped | `@sdlc-harness resume`, which continues the stopped run from its committed ledger; a review that requests changes is collected, and its round starts once the resumed run finishes | `sdlc-harness: stopped` |
| `stopped` (closed or deleted) | the item acted on: the closed pull request, else the target. For a deleted branch, the issue, read from the task prompt at the newest run's commit. The issue is labelled too | the run was stopped because @<login> closed issue #<n>, closed or merged pull request #<n>, or deleted its branch; its runs and artifacts are kept | `@sdlc-harness resume` while the branch exists: on the issue, or on the pull request once it is reopened; a merged pull request cannot be reopened, so after a merge only on the issue; none once the branch is deleted | `sdlc-harness: stopped` |
| a started round | the pull request | a user-review round started, by a review or by the end of a run, naming every reviewer it took, and a `completed` comment follows | none; wait for `completed` | `sdlc-harness: running` |
| `completed` | the issue, naming the new pull request; the pull request when there is no issue or it existed before this run; the issue alone when none could be opened | the run completed, and the pull request, or why it could not be opened | review the pull request; a review that requests changes starts another round. With `phases.qa` on, it also names the local `/autonomous-sdlc-harness:branch-qa-test` still owed | `sdlc-harness: done` |

A reply `control` posts after a successful dispatch carries ` engine=<engine>` in its hidden marker, `<!-- sdlc-harness event=reply branch=<branch> engine=<engine> -->`, which, beside the trigger's `started` comment (`task`) and a started round's comment (`user_review`), is how a run whose job never started keeps its engine ([`remote-execution.md`](remote-execution.md) → `### When GitHub fails or lags`).

Every comment names its next action as something done on GitHub, never a slash command, except where the step has no GitHub form. Nothing from a stopped job changes a label or posts a lifecycle comment: `parked`, `park_loop`, `paused`, `resumed`, a started round, `failed` and `not_started` each post nothing once the branch's newest `harness stop` run is newer than its newest `harness run` run, so a job a stop overtook never overwrites `stopped`. A `resumed` that a stop overtook is silent, like `failed`. Only when GitHub's run list cannot be read is the event reported anyway; `stopped` itself is never withheld ([`development.md`](development.md) → Gate 12 → Round 7, leg (h) and finding 3). The way on that a `failed` comment on a pull request or a `stopped` comment names assumes the branch still exists; a comment posted before the branch was deleted is not changed afterwards.

**Closed or deleted.** Closing the run's issue, closing or merging a pull request from its branch, or deleting the branch stops an unfinished run (`running`, `parked`, `park_loop` or `paused`) through `remote-run.sh stop`, as `@sdlc-harness stop` does. The actor must pass the §6 check; for a deletion only a bot is checked ([§6](#6-who-can-act-and-pull-requests-from-forks), *Closing and deleting*). A close by anyone who fails it is ignored, and the item stays closed. A completed or failed run is left alone, and so is one already stopped. Reopening the issue or the pull request resumes nothing. A deleted branch's stop marker is dispatched from GitHub's default branch, the only ref left, and the poller and the automatic resume never re-dispatch a branch absent on `origin`. Every case that stops nothing is one line in the job log, with no comment, label or dispatch. Deleting a branch whose pull request is open closes that pull request as well; that close is one line in its job's log, and the deletion's job does the stop. GitHub starts no workflow for activity on a pull request that has a merge conflict, so closing a conflicting pull request stops nothing; stop that run with `@sdlc-harness stop` on its issue, or reopen the pull request and comment it there, or close the issue.

**The budget is silent.** A run that reaches the hosted job's time budget pauses and continues in a chained job, and neither the pause nor the resume is posted: a chained continuation is not an event anyone acts on.

**Push notifications are unchanged.** `autonomous-notify.sh` sends the same notifications as before, beside the comments; they still name the local slash command for each next action.

**The state labels** are `sdlc-harness: running`, `sdlc-harness: parked`, `sdlc-harness: paused`, `sdlc-harness: done`, `sdlc-harness: failed` and `sdlc-harness: stopped`. Exactly one is kept on the issue and one on the pull request, each when known; every transition removes the others. The trigger sets `sdlc-harness: running` when it removes the trigger label. A label is created the first time the harness sets it. Do not apply them by hand: the next transition overwrites a hand-applied one, so it says nothing about the run.

The labels let a team filter runs by state from the issue and pull-request lists without opening a comment. They are a view: the run list on GitHub is the authority on what a run is doing.

---

## 6. Who can act, and pull requests from forks

**One check, shared with the trigger.** A command and a review are both acted on only when the actor passes the trigger's own check ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 3. Who can start a run`):

- a person must have `admin` or `write` permission, read from the collaborator-permission API;
- that person must then be admitted by the allow-list, the repository variable `HARNESS_RUN_ACTORS`: a comma-separated list of logins, matched case-insensitively. Unset, it admits the repository owner alone when a personal account owns the repository, and nobody when an organisation does. `*` admits every writer;
- a bot must be listed in `HARNESS_TRIGGER_ALLOWED_BOTS`;
- `ghost` is never accepted.

Triage is refused because commenting and labelling need only the triage role, so neither proves that the actor may run code with the repository's secrets. The API reports triage as `read` (T3).

The **Run workflow** form and `gh workflow run` reach no comment check, and a re-run replays its event's original sender, so `harness-run.yml`'s `run` and `collect` jobs each open with a step that holds `github.triggering_actor` to the same list, and refuse anyone else before any credential is read; `github-actions[bot]`, which every harness dispatch names, passes. A re-run of a trigger or control job is held to the list by its re-runner too: `remote-run.sh` refuses one whose `GITHUB_TRIGGERING_ACTOR` the list does not admit, before it checks the event's own actor. The list does not close one route: a writer can still edit a workflow to read the credential secret itself ([`remote-execution.md`](remote-execution.md) → `## 9. Credentials and billing`).

**Pull requests from forks.** The fork rule is three sentences:

- `harness-control.yml` never uses `pull_request_target`.
- A review on a fork's pull request runs `harness-control.yml` as the fork's merge commit carries it (C2). The shipped `if:` skips it, but a fork can edit that copy. Such a job gets a read-only token and no secret, so it can reply to nothing and dispatch nothing, but it does run, on any runner label the fork names ([`remote-execution.md`](remote-execution.md) → `## 11. Security`).
- A comment on a fork's pull request is refused with a reply, because an `issue_comment` job carries the repository's secrets (C2).

A fork can still reach a self-hosted runner through a workflow of its own. [`remote-execution.md`](remote-execution.md) → `## 11. Security` gives that warning and what prevents it.

**Closing and deleting.** A close of the run's issue or pull request is authorised as a command is. Triage can close issues and pull requests ([§8](#8-what-is-not-verified-here)) but fails the check, so a triage user cannot stop a run that way, and a close by a writer the allow-list does not admit is ignored too. Deleting a branch already needs write access and a stop spends no credential, so for a deletion only a bot is checked, against `HARNESS_TRIGGER_ALLOWED_BOTS`, and never the allow-list. The job replies to none of them, because the item is closed or the branch gone; an ignored one is a line in the job log ([§5](#5-lifecycle-comments-and-state-labels), *Closed or deleted*). A fork's closed pull request is skipped by the shipped `if:`, but the job runs the fork's merge-commit copy of the workflow, as a review does (C2).

**The scripts are always the default branch's.** The control job checks out the default branch and runs that branch's `remote-run.sh`, never the pull request's. For a review event, though, the workflow file itself is the pull request's merge-commit copy (C2), so a head that edits `harness-control.yml` changes what its own review job runs. A round's fixes run later, in `harness-run.yml`, on the run's own branch, as every round does.

**The harness never triggers itself.** Every comment the harness posts carries the hidden line `<!-- sdlc-harness`, which the workflow's `if:` and `control` both exclude ([§1](#1-commands-in-a-comment)). Each one is posted with the job's own token, and a comment made with that token starts no workflow (S3).

**What a commenter vouches for.** An authorised reviewer or answerer vouches for the text that becomes a round or an answer, in the same way that the labeller vouches for an issue's text ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 4. What the labeller vouches for`). A review round carries each authorised reviewer's review and inline comments, each vouched for by its own author, and nothing from anyone the §6 check refuses ([§2](#2-a-review-that-requests-changes-starts-a-round)). An answer is written as untrusted task data and never run as a command ([§3](#3-answering-a-park-in-a-comment)).

**What comments make visible.** Park questions, answers and review text become comments on the issue or the pull request. On a public repository those comments are public. That adds to what the `harness-state` artifact and the workflow inputs already expose ([`remote-execution.md`](remote-execution.md) → `## 11. Security`, *What a reader of the repository's Actions runs can see*).

---

## 7. Working a run from both sides

**Every local command still works for the same runs.** A run worked from GitHub is the same run the local commands reach. The local commands reach a run started from GitHub through the `<branch>:` prefix, even with no local record ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 5. Working the run`).

**Each side sees the other:**

- **GitHub's changes** show up locally because local commands read the run's state from GitHub before they act. `/autonomous-sdlc-harness:branch-status` reads it too.
- **Local changes** show up on GitHub. A dispatch from `/autonomous-sdlc-harness:branch-answer`, `-resume` or `-pause` starts a job, and that job posts the lifecycle comments and sets the labels ([§5](#5-lifecycle-comments-and-state-labels)). A local `remote-run.sh stop` posts `stopped`, and a local `/autonomous-sdlc-harness:branch-user-review` posts the started round, as their GitHub forms do.

**The Run workflow form stays the fallback.** A person the allow-list admits can still work any remote run with no local setup from `harness-run.yml`'s **Run workflow** form, for example when the control workflow is disabled ([`remote-execution.md`](remote-execution.md) → `### Working a run from GitHub alone`). The run job refuses a `run` dispatched or re-run by anyone else, before it launches anything ([§6](#6-who-can-act-and-pull-requests-from-forks)).

**A locally executed branch reviewed on GitHub.** A person may open a pull request for a branch that ran on their own machine, and a review requesting changes on it starts a round ([§2](#2-a-review-that-requests-changes-starts-a-round)). That round runs through `harness-run.yml`, because a round started from GitHub always does. The local record keeps `execution: local` and is not touched. As a result, the local working copy falls behind `origin/<branch>` by the round's commits. Before another local round, bring it current by running this in that working copy:

```
git pull --ff-only
```

---

## 8. What is not verified here

Every automated case drives a `gh` stub. Gate 12 observation (xiv) in [`development.md`](development.md) → `## 5. Verifying a change` records the cases observed against a real repository; round 6 (2026-10-02, CLI 0.6.0) observed the rows moved to *Verified in Gate 12 round 6* below, round 7 (2026-10-05, CLI 0.6.1) those moved to *Verified in Gate 12 round 7*, and none of the others has been.

| Behaviour | What rests on it | Source | If it is wrong |
|---|---|---|---|
| A pull request's conversation comment has the same size limit as an issue comment | Cutting a question file at 250,000 bytes ([§3](#3-answering-a-park-in-a-comment)) | S6 measured issue comments only | A long question comment on a pull request is refused |
| A draft is refused for an account whose plan has no drafts, and a ready pull request is then accepted | The one ready retry ([§4](#4-the-draft-pull-request)) | C3; the fallback case is unmeasured | The retry fails too, and the `completed` comment names the compare link |
| A pull request's author cannot request changes on their own pull request | The advice that a solo maintainer uses a machine account's token for `HARNESS_GIT_TOKEN` or starts the round locally ([§4](#4-the-draft-pull-request)) | GitHub's documented rule, not retrieved here; C1 measured only a pull request opened by `app/github-actions` | The token's owner can start a round from GitHub after all, and the advice is merely unneeded |
| A newer pending run in `harness-run.yml`'s `concurrency` group cancels an older pending one | Refusing an answer, resume or clear while a job is in flight, rather than queueing it ([§1](#1-commands-in-a-comment)). Reviews are no longer refused: a pending review job replaced in `harness-review-<branch>` loses nothing, because collection is cumulative ([§2](#2-a-review-that-requests-changes-starts-a-round)) | GitHub's documented behaviour, not measured here | Nothing is lost either way, because nothing is queued behind a job in flight |
| A concurrency group spans workflows in one repository | The `collect` job of `harness-run.yml` and the review jobs of `harness-control.yml` sharing `harness-review-<branch>`, so they never place a round at the same moment ([§2](#2-a-review-that-requests-changes-starts-a-round)) | Verified in GitHub's documentation, *Control the concurrency of workflows and jobs* (docs.github.com): "concurrency group names must be unique across workflows to avoid canceling in-progress jobs or runs from other workflows". | A review job and `collect` can place rounds at the same moment, and the loser fails its push loudly; nothing is lost |
| An artifact uploaded by a job is listable before its workflow run completes | The settledness test reading the run's state bundle while that run's `collect` job is still pending ([§2](#2-a-review-that-requests-changes-starts-a-round)) | Verified in GitHub's changelog of 2023-12-14, *GitHub Actions – Artifacts v4 is now generally available*: "This allows the artifact to become immediately available to download from the API after being uploaded, which was not possible before." The Artifacts REST reference is silent on it. | The branch reads in flight until the run completes, and the review is answered "collected" and taken by that run's `collect` |
| The jobs API names a job with no `name:` key by its key, `run` | The settledness test finding the `run` job of the newest run ([§2](#2-a-review-that-requests-changes-starts-a-round)) | GitHub's documentation is silent. Observed on `firu-daniel/harness-gate12`: the jobs API for run 36833810996 of `harness-run.yml` answers `run` and `warm`, and neither job carries a `name:` key. | No run ever reads settled before it completes, and reviews are collected rather than placed until then |
| `concurrency: queue: max` | Nothing ([§2](#2-a-review-that-requests-changes-starts-a-round)). It is deliberately not used: 100 pending jobs is still a hard limit, and the end-of-run `collect` job needs no queue. Keeping the default `single` queue on `harness-review-<branch>` has one consequence. When three or more reviews land while a review job is running, a pending review job can be replaced. That reviewer's review is still collected, but gets no reply. | Verified in GitHub's workflow syntax reference (`concurrency.queue`: `single` is the default, keeping at most one pending run, which a newer one cancels and replaces; `max` keeps up to 100 pending runs, cancelling any beyond that, and cannot be combined with `cancel-in-progress: true`) and in GitHub's changelog of 2026-05-07. | Nothing changes |
| Triage may close issues and pull requests | The statement that a triage user can close a run's item without stopping the run ([§6](#6-who-can-act-and-pull-requests-from-forks)) | GitHub's documented behaviour, not retrieved in [`github-integration-research.md`](github-integration-research.md); T3 covers only how the permission API reports triage | Triage cannot close them, and the statement describes a case that never happens |
| Deleting a pull request's head branch closes the pull request and raises a `pull_request` `closed` event | The quiet close of a pull request whose branch is gone ([§5](#5-lifecycle-comments-and-state-labels), *Closed or deleted*) | GitHub's documented behaviour, not retrieved in [`github-integration-research.md`](github-integration-research.md) | No second job runs, and the deletion's job alone stops the run |
| A pull request with a merge conflict starts no `pull_request` workflow, its `closed` activity included | The statement that closing a conflicting pull request stops nothing ([§5](#5-lifecycle-comments-and-state-labels), *Closed or deleted*) | GitHub's documented behaviour (*Events that trigger workflows* → `pull_request`: "Workflows will not run on `pull_request` activity if the pull request has a merge conflict"), not retrieved in [`github-integration-research.md`](github-integration-research.md) | Closing a conflicting pull request stops the run like any other close, and the advice to stop it another way is merely unneeded |
| A pull request opened with `HARNESS_GIT_TOKEN` puts a cross-reference on the issue its body mentions | Nothing the flow does; only whether the issue links the pull request beyond the `completed` comment ([§4](#4-the-draft-pull-request)) | GitHub's documented behaviour, not retrieved in [`github-integration-research.md`](github-integration-research.md); round 6 measured only the job's token | The issue links the pull request through the `completed` comment alone, as with the job's token |
| A dispatcher's comment lands within `DISPATCH_MARKER_SLACK_SECS` (120 s) of the run it dispatched | Resuming or answering a run whose job GitHub never started without the **Run workflow** form ([§1](#1-commands-in-a-comment), [§5](#5-lifecycle-comments-and-state-labels)) | `remote-run.sh` → the constant's comment: the comment is posted after the dispatch request and GitHub creates the run asynchronously; not measured here | `resume` is refused with the **Run workflow** form named, as before |
| `collect` runs after a `run` job GitHub cancelled before any step, while it gets a runner itself | The `not_started` comment and label ([§5](#5-lifecycle-comments-and-state-labels)) | Gate 12 round 8 observed it once ([`development.md`](development.md) → Gate 12 → Round 8, finding 3; [`remote-execution.md`](remote-execution.md) → `### When GitHub fails or lags`) | Nothing reports such a run, and its labels stay `running` |
| The whole chain on GitHub: commands, a round from a review, a park answered in comments, the draft pull request, lifecycle comments and labels | All of this document | Gate 12 observation (xiv) ([`development.md`](development.md)) | The failing step is visible in the control or run job's log and in the comment it posted, or did not post |

### Verified in Gate 12 round 6

| Behaviour | Observed |
|---|---|
| The prefilter's `contains()` compares case-insensitively | `@SDLC-HARNESS pause` on issue #8 gave a `harness-control.yml` run that got past its `if:` and replied ([`development.md`](development.md) → Gate 12 → Round 6, leg (f)) |
| The job token's `issues: write` can add a missing label to an issue or pull request, and create one | The setup created only `sdlc-harness`. The jobs created `sdlc-harness: running`, `parked`, `paused`, `done` and `stopped` on first use, and set and removed them on issue #8 and pull request #9 at every transition |
| A pull request's conversation comment and its labels go through the issues endpoints | Every lifecycle comment and reply on pull request #9 was posted, among them question 2, `resumed`, `stopped`, the started-round comments and `completed`, and its state label followed each transition |
| A pull request opened, and a comment posted, with the job's token put no `cross-referenced` event on the issue they mention | Issue #8's timeline showed no `cross-referenced` event for pull request #9, 45 minutes after it opened, and none for the `completed` comment naming it ([`development.md`](development.md) → Gate 12 → Round 6, leg (d) and finding 5) |

### Verified in Gate 12 round 7

| Behaviour | Observed |
|---|---|
| A `delete` event's workflow runs from the default branch | Deleting `feat_invoices_4` started `harness-control.yml` run `37297215528`, event `delete`, `headBranch` `main`, `headSha` `db0f6ab` (the default branch's tip). It stopped the run ([`development.md`](development.md) → Gate 12 → Round 7, leg (h)) |
| The contents API serves a file at a commit no branch points at any more | After the deletion, the `stopped` comment reached issue #10. The deletion path reads the issue from the task prompt at the newest run's `headSha`, which no branch pointed at any more |
| A workflow can be dispatched from the default branch while its `branch` input names a deleted branch | The deletion's `harness stop feat_invoices_4` marker run `37297237226` was accepted and listed under `main` |
| A `pull_request` `closed` job runs the merge-commit copy of the workflow | Closing PR #11 ran `harness-control.yml` run `37296486401` (event `pull_request`, `headBranch` `feat_invoices_4`, `headSha` the head's tip). The head branch still carried 0.6.1's unparseable copy (item 1), and only `main` had the fixed one, yet the job parsed and ran. It therefore did not run the head's copy, which matches the merge-commit copy. That the default branch's copy ran instead is not excluded by this observation |
