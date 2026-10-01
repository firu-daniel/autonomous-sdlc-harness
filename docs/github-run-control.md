# Working a run from GitHub

**Who reads this:** a maintainer or team member who works runs from GitHub, and anyone changing `harness-control.yml` or `remote-run.sh`'s `control`, `report` and `deliver`. It owns the design of record for comment commands, review rounds, parks over comments, the draft pull request, lifecycle comments and state labels.

It cites rather than restates. Every GitHub fact below is cited from [`github-integration-research.md`](github-integration-research.md) by its ID (S3–S6, T1–T4, C1–C4), retrieved there on 2026-09-30 and not re-verified here. The run's own lifecycle is [`remote-execution.md`](remote-execution.md)'s, and starting a run is [`github-issue-trigger.md`](github-issue-trigger.md)'s. The code of record is `cli/templates/scripts/remote-run.sh` → the header's `control`, `report` and `deliver` paragraphs, and the header of `cli/templates/github/workflows/harness-control.yml`.

---

## The GitHub entry point

GitHub is a second entry point **beside** the local one, never instead of it. One maintainer does the setup below once, on a machine of their own. After that, anyone with write access can start and work runs from GitHub with nothing installed. Anyone with a local setup keeps every local command too, and can mix the two on the same run ([§7](#7-working-a-run-from-both-sides)).

**1. The one-time setup, by one maintainer, locally**, in order. Each step links to where its command is written:

1. Install the plugin ([`README.md`](../README.md) → `### Adopting it in your own repository`, step A).
2. Run `init` (the same section, step B).
3. Run `/autonomous-sdlc-harness:harness-analyze`. This is recommended, not required (the same section, step C).
4. Set `forge` to `github` and `execution.target` to `github-actions`, then run `init` again. That run writes the four workflows: `harness-run.yml`, `harness-resume.yml`, `harness-trigger.yml` and `harness-control.yml` ([`github-issue-trigger.md`](github-issue-trigger.md) → `## Turning it on, in short`, steps 1–2; [`remote-execution.md`](remote-execution.md) → `## 7. Turning it on`, steps 1–2).
5. Commit them ([`remote-execution.md`](remote-execution.md) → `## 7.`, step 3).
6. Give `gh` the `workflow` scope (the same step).
7. Push to the default branch (the same step).
8. Set a credential secret ([`remote-execution.md`](remote-execution.md) → `## 7.`, step 4).
9. Set `HARNESS_GIT_TOKEN` if tasks will edit `.github/workflows/*` ([`remote-execution.md`](remote-execution.md) → `### Every secret and variable`). This token also opens the draft pull request, so CI runs on it. Its owner becomes the pull request's author, and an author cannot request changes on their own pull request. So use a token from a machine account, especially if you maintain the repository alone, or plan to start review rounds locally with `/autonomous-sdlc-harness:branch-user-review` ([§4](#4-the-draft-pull-request)).
10. Create the trigger label `sdlc-harness` ([`github-issue-trigger.md`](github-issue-trigger.md) → `## Turning it on, in short`, step 4).
11. Switch on *Allow GitHub Actions to create and approve pull requests* unless `HARNESS_GIT_TOKEN` is set ([§4](#4-the-draft-pull-request)).

**2. What a team member with write access then does from GitHub alone:**

- labels an issue `sdlc-harness` to start a run ([`github-issue-trigger.md`](github-issue-trigger.md));
- answers, pauses, resumes or stops the run with `@sdlc-harness` comments ([§1](#1-commands-in-a-comment));
- requests changes on a pull request from the run's branch, draft or not, to start the next round ([§2](#2-a-review-that-requests-changes-starts-a-round));
- follows the run through its lifecycle comments and state labels ([§5](#5-lifecycle-comments-and-state-labels)).

The triage role is refused ([§6](#6-who-can-act-and-pull-requests-from-forks)).

**3. What still needs a local machine:**

- Running or re-running `/autonomous-sdlc-harness:harness-analyze`. It is supervised and has no remote route ([`github-integration-research.md`](github-integration-research.md) → A12).
- Upgrading, with `init --upgrade-workflows` or `init --force`, because the workflows pin the harness version ([`remote-execution.md`](remote-execution.md) → `### Upgrading`).
- Running `doctor`.
- A configuration change that needs files re-rendered. A plain switch in `harness.config.json` can be edited in a pull request on GitHub, because the job reads that file from the branch.
- The interactive-test phase. A remote run skips it, so while `phases.qa` is on the branch still owes a local `/autonomous-sdlc-harness:branch-qa-test`, until `ROADMAP.md`'s *Cloud QA* row lands ([`remote-execution.md`](remote-execution.md) → `### The interactive-test phase`).

**4. The caveats:**

- Every run uses the repository's one credential secret and is billed to its owner ([`remote-execution.md`](remote-execution.md) → `## 9. Credentials and billing`).
- On a public repository, the comments are public ([§6](#6-who-can-act-and-pull-requests-from-forks)).
- If `HARNESS_GIT_TOKEN` is a person's own token, that person cannot start a round with *Request changes* on the pull request it opened ([§4](#4-the-draft-pull-request), [§8](#8-what-is-not-verified-here)).

---

## 1. Commands in a comment

**A command is a new comment whose first line opens with `@sdlc-harness`, followed by a verb.** The handle must be the first word of the first line; leading spaces and tabs are skipped, and the handle and the verb are matched case-insensitively. Text after `pause`, `resume`, `stop` or `clear` on the same line is ignored. A comment is read once, when it is created: an edited comment is never re-read, so a correction is a new comment.

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

`answer` takes the question's index on the first line and the answer on the lines below it:

```
@sdlc-harness answer 2
Use the existing date helper rather than adding a new one.
```

The index may be left out only when exactly one question is open, because issue comments have no threads to say which one a reply belongs to. When nothing follows the first line, the text after the index is the answer.

| Command | What it does | Accepted when | The same as |
|---|---|---|---|
| `answer [<n>]` | Writes the answer to question `<n>` and sends it as its own `resume: answer` dispatch | The run is parked and `<n>` is an open question | `/autonomous-sdlc-harness:branch-answer` |
| `pause` | Sends `remote-run.sh pause`; the run yields at its next clean checkpoint | The run is running | `/autonomous-sdlc-harness:branch-pause` |
| `resume` | Sends the `resume: pause` dispatch for the run's engine | The run is paused, whatever its pause reason, `expired` and `killed` included | `/autonomous-sdlc-harness:branch-resume` |
| `stop` | Sends `remote-run.sh stop`: the stop marker, then cancelling every queued or running job of the branch | Any run of the branch is known | `remote-run.sh stop <branch>` |
| `clear` | Sends the `resume: pause` dispatch with `park_loop_clear` set, releasing the park-loop hold | The run is held in a park loop | `/autonomous-sdlc-harness:branch-resume` on a park loop |

A command whose state does not match is refused with a reply naming the state and the command that does apply: `resume` on a park loop points at `clear`, and on a parked run at `answer` with the open indexes. `answer`, `resume` and `clear` on a run that is still running are refused rather than queued, so nothing waits behind a job and is lost when a newer pending run cancels it.

**Never a command:**

- `pause` — no handle;
- `pause this` — no handle;
- `Let's @sdlc-harness pause` — the handle is not the first word;
- `> @sdlc-harness pause` — a quote is not the first word either;
- an edited comment, whatever it now says;
- any comment carrying the harness's hidden line, which opens `<!-- sdlc-harness`. Every comment the harness posts carries it, so a harness reply that quotes a command never acts on it, and the harness's own comments are ignored without a reply.

**Who and where.** A command is obeyed only from a collaborator whose permission on the repository is `admin` or `write`, or from a bot listed in `HARNESS_TRIGGER_ALLOWED_BOTS`. The permission API reports the maintain role as `write`, so it passes, and triage as `read`, so it is refused (T3). This is the trigger's own check ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 3. Who can start a run`). A command on a pull request acts on its head branch. A command on an issue acts on the branch the trigger started from that issue, read from the trigger's own `started` comment, posted by `github-actions[bot]`. Either branch must be unprotected and carry the run's flow-progress ledger at its tip.

**Replies.** Every accepted command gets a reply naming the actor, the command and what was done, for example:

```
Pause requested by @<login>; the run on `<branch>` yields at its next clean checkpoint, and a paused comment follows.
```

Every refused command gets a reply in one form, `` @<login>: `<verb>` was not run: <reason>. <way on> ``. The checks run in this order, and the first that fails is the one replied:

1. the repository variable `HARNESS_REMOTE_STOP` is set;
2. the default branch's `harness.config.json` does not set `forge` to `github` and `execution.target` to `github-actions`. This is checked before the actor, so a disabled coupling asks GitHub nothing about the commenter;
3. the commenter is not authorised;
4. the verb is not one of the five.

An unknown verb's reply lists all five:

```
The commands are `@sdlc-harness answer [<n>]`, `@sdlc-harness pause`, `@sdlc-harness resume`, `@sdlc-harness stop`, `@sdlc-harness clear`; `docs/github-run-control.md` in the harness documentation states each.
```

**The handle.** Type `@sdlc-harness` in full: GitHub does not autocomplete it. It renders as a link to [github.com/sdlc-harness](https://github.com/sdlc-harness), a placeholder organisation created only so that nobody else can take the name. It is not a user, not an app and not a member of any repository, so nothing is notified. The command is matched as **text** in the comment by `control`, never delivered through the mention. A comment that contains `@claude` as a word also triggers `anthropics/claude-code-action` where that action is installed (C4), and a harness command needs no such word. The shorter `@harness` was not used because it belongs to another organisation (`gh api users/harness`, observed by the maintainer on 2026-10-01).

---

## 2. A review that requests changes starts a round

**Only a submitted review whose state is `changes_requested` starts a round.** *Approve* and *Comment* start nothing, whatever their text. The event payload carries the state in lowercase and the REST API in uppercase (`CHANGES_REQUESTED`), so it is compared case-insensitively (C1). The round is built from the review event alone. `pull_request_review_comment` is not listened to, because one review raises one such event per inline comment, and the round would start once per comment (C1).

**What the round carries.** One submitted review is one round file, `<stateDir>/user_reviews/<branch>_review[_<n>].md`, holding:

- the review's body verbatim, or `(The review carries no summary.)` when it has none;
- a provenance line naming the reviewer, the pull request, the review's URL and when it was submitted;
- under `## Inline comments`, every inline comment of this review, plus the reviewer's own inline comments created since the previous round's file was committed (all of them when there is no previous round), oldest first.

Other people's comments are not collected. Only the reviewer who submitted the review has vouched for them.

**Why each comment carries its commit and hunk.** Each inline comment is written as a `` ### `<file>`, line <n> `` heading, then `` Made on commit `<sha>`. ``, its body verbatim, and its `diff_hunk` in a `diff` fence. Once a later push moves the code, GitHub reports the comment's `line` as `null` (C1), so an outdated comment's heading gives its original line instead and says `(outdated)`. The comments come from the pull request's comment listing, filtered as above, and not from the per-review endpoint, which carries no `line` at all (C1). The line is never the fix plan's coordinate. `user-review-fix-plan-writer` reads the file as the reviewer saw it at the recorded commit and re-locates the comment in the current tree by the hunk's context and added lines, because this round's fixes or an earlier round's may have moved it.

**How the round is numbered.** From the branch tip on `origin`, by the anchored rule of `/autonomous-sdlc-harness:branch-user-review` step 3: each file under `<stateDir>/user_reviews/` matching `^(.+)_review(_[0-9]+)?\.md$` whose captured branch **equals** the branch, the unsuffixed file being round 1. The next round is `<branch>_review.md` when none matched, otherwise `<branch>_review_<max+1>.md`.

**How it is sent.** `control` runs `remote-run.sh review`, which commits the round as `chore: add user review for <branch>`, pushes it and dispatches `engine: user_review`, exactly as the local command's GitHub route does (`plugin/commands/branch-user-review.md`, step 7). No working copy is bootstrapped and no code from the pull request is run.

**Which pull requests count.** A review counts on **a pull request from the run's branch**: a head branch in this repository, unprotected, whose tip carries `<stateDir>/flow_progress/<branch>_progress.md`. Who opened the pull request does not matter, and neither does whether it is a draft. Marking it ready for review does not close it to rounds. The reviewer passes the same checks as a commenter (§1, *Who and where*). A refusal is a reply on the pull request.

**The story index.** A round also needs `<stateDir>/story_plans/<branch>_story_plan.md` at the branch tip, because the round's statistics step reads it. A review on a branch without one is refused with a reply.

**A run in flight.** A review arriving while the branch's newest run is queued, running, parked, held in a park loop or paused is refused with a reply that names the state. Nothing is queued. Submit the review again once the run finishes. The local `/autonomous-sdlc-harness:branch-user-review` refuses the same way, because its GitHub route runs the same `remote-run.sh review`.

**Comments left while a round runs are not lost.** The reviewer's inline comments made after the previous round's file was committed are collected by the next round, so comments left during a round, or on a refused review, are carried into the next review that requests changes.

---

## 3. Answering a park in a comment

**Each open question is posted whole, as one comment.** When a run parks, `report` posts one comment per open `question_<n>.md`, in ascending order, on the run's target (§5, *The target rule*). The comment opens with which run is waiting and on which question, then carries the file unchanged, then states the answer form. One question per comment keeps the answer to it unambiguous, since issue comments have no threads.

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

**The comment is a transport, not a second format.** The question and answer files stay the ones `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)` defines: the question comment carries `question_<n>.md` unchanged, and `control` writes the answer to `answer_<n>.md` before it dispatches. A park answered by `/autonomous-sdlc-harness:branch-answer` and one answered in a comment reach the run in the same shape.

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

  Another reviewer with write access can still request changes on it.
- With the job's own token, anyone with write access can request changes, and CI on the pull request waits for a person to select **Approve workflows to run** (S3). The job's token needs Settings → Actions → General → Workflow permissions → *Allow GitHub Actions to create and approve pull requests*, off by default for a new repository on a personal account and for a new organisation (S4, C3). With it off, the `completed` comment names that setting and `HARNESS_GIT_TOKEN`, and the branch's compare link for opening this one by hand.

**The plain mention.** The body names the issue the run was started from as `Started from #<n>.`, never a closing keyword such as `Closes #<n>` or `Fixes #<n>`, because the flow does not own the issue's lifecycle: merging the pull request never closes the issue. A maintainer who wants that adds the keyword. The body also states that a review requesting changes starts a round and which `@sdlc-harness` commands act on it.

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
| `failed` | the target | the run failed, and where its log is | on a pull request, a review that requests changes; on an issue, re-applying the trigger label, which starts a new run on the next indexed branch | `sdlc-harness: failed` |
| `stopped` | the target | the run was stopped | `@sdlc-harness resume`, which continues the stopped run from its committed ledger; a review that requests changes is accepted only once a run of the branch has completed or failed | `sdlc-harness: stopped` |
| a started round | the pull request | a user-review round started, and a `completed` comment follows | none; wait for `completed` | `sdlc-harness: running` |
| `completed` | the issue, naming the new pull request; the pull request when there is no issue or it existed before this run; the issue alone when none could be opened | the run completed, and the pull request, or why it could not be opened | review the pull request; a review that requests changes starts another round. With `phases.qa` on, it also names the local `/autonomous-sdlc-harness:branch-qa-test` still owed | `sdlc-harness: done` |

Every comment names its next action as something done on GitHub, never a slash command, except where the step has no GitHub form. A `failed` caused by stopping the run posts nothing, so it never overwrites `stopped`.

**The budget is silent.** A run that reaches the hosted job's time budget pauses and continues in a chained job, and neither the pause nor the resume is posted: a chained continuation is not an event anyone acts on.

**Push notifications are unchanged.** `autonomous-notify.sh` sends the same notifications as before, beside the comments; they still name the local slash command for each next action.

**The state labels** are `sdlc-harness: running`, `sdlc-harness: parked`, `sdlc-harness: paused`, `sdlc-harness: done`, `sdlc-harness: failed` and `sdlc-harness: stopped`. Exactly one is kept on the issue and one on the pull request, each when known; every transition removes the others. The trigger sets `sdlc-harness: running` when it removes the trigger label. A label is created the first time the harness sets it. Do not apply them by hand: the next transition overwrites a hand-applied one, so it says nothing about the run.

The labels let a team filter runs by state from the issue and pull-request lists without opening a comment. They are a view: the run list on GitHub is the authority on what a run is doing.

---

## 6. Who can act, and pull requests from forks

**One check, shared with the trigger.** A command and a review are both acted on only when the actor passes the trigger's own check ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 3. Who can start a run`):

- a person must have `admin` or `write` permission, read from the collaborator-permission API;
- a bot must be listed in `HARNESS_TRIGGER_ALLOWED_BOTS`;
- `ghost` is never accepted.

Triage is refused because commenting and labelling need only the triage role, so neither proves that the actor may run code with the repository's secrets. The API reports triage as `read` (T3).

**Pull requests from forks.** The fork rule is three sentences:

- `harness-control.yml` never uses `pull_request_target`.
- A review on a fork's pull request runs `harness-control.yml` as the fork's merge commit carries it (C2). The shipped `if:` skips it, but a fork can edit that copy. Such a job gets a read-only token and no secret, so it can reply to nothing and dispatch nothing, but it does run, on any runner label the fork names ([`remote-execution.md`](remote-execution.md) → `## 11. Security`).
- A comment on a fork's pull request is refused with a reply, because an `issue_comment` job carries the repository's secrets (C2).

A fork can still reach a self-hosted runner through a workflow of its own. [`remote-execution.md`](remote-execution.md) → `## 11. Security` gives that warning and what prevents it.

**The scripts are always the default branch's.** The control job checks out the default branch and runs that branch's `remote-run.sh`, never the pull request's. For a review event, though, the workflow file itself is the pull request's merge-commit copy (C2), so a head that edits `harness-control.yml` changes what its own review job runs. A round's fixes run later, in `harness-run.yml`, on the run's own branch, as every round does.

**The harness never triggers itself.** Every comment the harness posts carries the hidden line `<!-- sdlc-harness`, which the workflow's `if:` and `control` both exclude ([§1](#1-commands-in-a-comment)). Each one is posted with the job's own token, and a comment made with that token starts no workflow (S3).

**What a commenter vouches for.** An authorised reviewer or answerer vouches for the text that becomes a round or an answer, in the same way that the labeller vouches for an issue's text ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 4. What the labeller vouches for`). A review round carries the review's body and the reviewer's own inline comments, and nobody else's ([§2](#2-a-review-that-requests-changes-starts-a-round)). An answer is written as untrusted task data and never run as a command ([§3](#3-answering-a-park-in-a-comment)).

**What comments make visible.** Park questions, answers and review text become comments on the issue or the pull request. On a public repository those comments are public. That adds to what the `harness-state` artifact and the workflow inputs already expose ([`remote-execution.md`](remote-execution.md) → `## 11. Security`, *What a reader of the repository's Actions runs can see*).

---

## 7. Working a run from both sides

**Every local command still works for the same runs.** A run worked from GitHub is the same run the local commands reach. The local commands reach a run started from GitHub through the `<branch>:` prefix, even with no local record ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 5. Working the run`).

**Each side sees the other:**

- **GitHub's changes** show up locally because local commands read the run's state from GitHub before they act. `/autonomous-sdlc-harness:branch-status` reads it too.
- **Local changes** show up on GitHub. A dispatch from `/autonomous-sdlc-harness:branch-answer`, `-resume` or `-pause` starts a job, and that job posts the lifecycle comments and sets the labels ([§5](#5-lifecycle-comments-and-state-labels)). A local `remote-run.sh stop` posts `stopped`, and a local `/autonomous-sdlc-harness:branch-user-review` posts the started round, as their GitHub forms do.

**The Run workflow form stays the fallback.** A maintainer with no local setup can still work any remote run from `harness-run.yml`'s **Run workflow** form, for example when the control workflow is disabled ([`remote-execution.md`](remote-execution.md) → `### Working a run from GitHub alone`).

**A locally executed branch reviewed on GitHub.** A person may open a pull request for a branch that ran on their own machine, and a review requesting changes on it starts a round ([§2](#2-a-review-that-requests-changes-starts-a-round)). That round runs through `harness-run.yml`, because a round started from GitHub always does. The local record keeps `execution: local` and is not touched. As a result, the local working copy falls behind `origin/<branch>` by the round's commits. Before another local round, bring it current by running this in that working copy:

```
git pull --ff-only
```

---

## 8. What is not verified here

Every automated case drives a `gh` stub. Gate 12 observation (xiv) in [`development.md`](development.md) → `## 5. Verifying a change` records the cases observed against a real repository.

| Behaviour | What rests on it | Source | If it is wrong |
|---|---|---|---|
| The prefilter's `contains()` compares case-insensitively | Running the control job for a handle typed in mixed case ([§1](#1-commands-in-a-comment)) | GitHub's documented behaviour, not retrieved here | A mixed-case handle goes unanswered, and it is never obeyed |
| The job token's `issues: write` can add a missing label to an issue or pull request, and create one | The state labels ([§5](#5-lifecycle-comments-and-state-labels)) | Not retrieved here | One warning line in the job log, and no label; the comment is still posted |
| A pull request's conversation comment and its labels go through the issues endpoints | Every comment and label on a pull request ([§5](#5-lifecycle-comments-and-state-labels)) | Not retrieved here | Comments and labels on a pull request fail; the issue's are unaffected |
| A pull request's conversation comment has the same size limit as an issue comment | Cutting a question file at 250,000 bytes ([§3](#3-answering-a-park-in-a-comment)) | S6 measured issue comments only | A long question comment on a pull request is refused |
| A draft is refused for an account whose plan has no drafts, and a ready pull request is then accepted | The one ready retry ([§4](#4-the-draft-pull-request)) | C3; the fallback case is unmeasured | The retry fails too, and the `completed` comment names the compare link |
| A pull request's author cannot request changes on their own pull request | The advice that a solo maintainer uses a machine account's token for `HARNESS_GIT_TOKEN` or starts the round locally ([§4](#4-the-draft-pull-request)) | GitHub's documented rule, not retrieved here; C1 measured only a pull request opened by `app/github-actions` | The token's owner can start a round from GitHub after all, and the advice is merely unneeded |
| A newer pending run in `harness-run.yml`'s `concurrency` group cancels an older pending one | Refusing an answer, resume, clear or review while a job is in flight, rather than queueing it ([§1](#1-commands-in-a-comment), [§2](#2-a-review-that-requests-changes-starts-a-round)) | GitHub's documented behaviour, not measured here | Nothing is lost either way, because nothing is queued behind a job in flight |
| The whole chain on GitHub: commands, a round from a review, a park answered in comments, the draft pull request, lifecycle comments and labels | All of this document | Gate 12 observation (xiv) ([`development.md`](development.md)) | The failing step is visible in the control or run job's log and in the comment it posted, or did not post |
