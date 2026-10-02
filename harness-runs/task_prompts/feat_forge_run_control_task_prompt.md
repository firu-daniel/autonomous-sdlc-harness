`feat_forge_run_control` lets a maintainer work a GitHub-side run from GitHub itself, through issue and
pull-request comments and reviews, the way they work a run from the local commands today. It completes the
**forge coupling** that `forge` was declared for: *"an issue-label trigger, draft-pull-request output and
comment-based park-and-ask"* (`docs/config.md` → `## 5. Key reference`, the `forge` row).

**This is the last of three steps.** It comes after `feat_remote_execution_github_actions` and
`feat_forge_run_triggers`:
- the first made a run execute and supervise itself in a GitHub Actions job;
- the second lets labelling an issue start a run, and deferred everything in this prompt to it;
- this one lets a maintainer who started a run from GitHub finish it there, instead of answering a park by
  downloading an artifact and filling in the **Run workflow** form by hand.

A fourth step, `feat_github_native_adoption` (removing the local setup steps), was dropped on 2026-09-30:
`docs/github-integration-research.md` → `## 5. Adoption routes compared` records why. What was dropped is only
the **one-time setup** done without a local install. The first setup stays local. After that, this branch
makes GitHub a second entry point beside the local one: a team member can work runs from GitHub with nothing
installed, from their local setup, or both (goals 7 and 9). Nothing in this branch has to remove a local setup
step. No doc should read the drop as "every team member needs a local install", and no doc should say the
team moves to GitHub after the setup either.

Read what both earlier branches shipped before planning, in particular `docs/remote-execution.md` → `## 1. The
lifecycle of a remote run` and `## 5. The seam, and what stays open`, and the trigger's own docs.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** It was written on 2026-09-30, partly from memory.
> The planner and the reviewers must re-verify each lead against the live source, and must agree on the design
> themselves.


> **Read `docs/github-integration-research.md` first.** `chore_github_integration_research` answered this
> prompt's open questions there, with sources and retrieval dates. Where it marks a lead `verified` or
> `refuted`, take its answer and cite it rather than re-verifying; only what it leaves `unverified` stays open.
> An unattended run cannot fetch web pages, so do not claim a lead was re-verified unless that document did it.

---

## The goal

Every local command that acts on a remote run gets a GitHub-side equivalent, and a run reports back where it was
started:

| Today, locally | This branch, on GitHub |
|---|---|
| `/autonomous-sdlc-harness:branch-answer` | answering a park in a comment |
| `/autonomous-sdlc-harness:branch-user-review` | a pull-request review on the harness's PR starting a user-review round |
| `/autonomous-sdlc-harness:branch-pause`, `-resume`, `remote-run.sh stop` | a comment command |
| `/autonomous-sdlc-harness:branch-status`, push notifications | lifecycle comments on the issue or PR |
| "done" is a pushed branch | a draft pull request |

1. **Draft-PR output.** A run that reaches "branch ready for review" gets a draft pull request from its branch to
   the default branch, linked to the issue that started it when there is one. This is the surface the review
   trigger below acts on, so it comes first.
   - The flow still never merges, and `push-branch.sh` keeps opening no pull request. The PR is opened by a
     workflow step or a script the flow does not own.
   - Decide whether a *local* run with `forge: "github"` also gets one, and if so through the same
     implementation.
   - The PR names the issue it started from in its body (`#<n>`), so the two are linked visually on both sides:
     the PR shows the issue, and the issue's timeline shows the PR. Decide whether that reference uses a closing
     keyword (`Closes #<n>`), which closes the issue when the PR merges, or a plain mention. The task prompt's
     provenance line (`Started from <issue URL> by @<login> …`, written by the trigger) already records the
     issue on the branch, so the PR step can read it from there.
2. **A PR review starts a user-review round.** A review submitted on a harness-created PR becomes the next
   `<branch>_review[_<n>].md` round and dispatches `engine: user_review`. This is what the local relay does
   today (`docs/remote-execution.md` → *What each local command does for a remote run*, the
   `branch-user-review` row): the working copy fast-forwards to `origin/<branch>`, the round is committed as
   `chore: add user review for <branch>` and pushed, and `engine: user_review` is dispatched.
   - **One submitted review is one round**, with its inline comments carried with their file and line, and its
     body verbatim. This avoids one round per comment.
   - Round numbering follows `/autonomous-sdlc-harness:branch-user-review` step 3: the anchored pattern
     `^(.+)_review(_[0-9]+)?\.md$` over `<state_dir>/user_reviews/`, with exact branch equality. Reuse it rather
     than restate it.
   - Decide which review states trigger. For example, *changes requested* triggers, and *approve* and a plain
     comment do not.
   - **Draft status plays no part.** A round starts from any PR whose head is a harness branch, whether it is a
     draft or ready for review, and whether the harness or a person opened it (the *No opt-in step* decision
     below; C1 measured *changes requested* being accepted on a draft PR). The adopter docs say "a pull request
     from the run's branch", never "the draft PR", so that nobody reads marking a PR ready as closing it to
     reviews.
3. **Park-and-ask over comments.** A park posts its question file on the issue or PR: the whole
   `question_<n>.md`, with every `## Q<k>` section in it. An authorised reply answers it and dispatches
   `resume: answer` with the answers JSON, as the local relay does.
   - The channel format stays canonical in `plugin/instructions/task_plan_writing_instructions_autonomous.md`
     → `## Clarification channel — file format`. The comment is a transport, not a second format.
   - An answer stays **untrusted task data**, written verbatim, as `/autonomous-sdlc-harness:branch-answer`
     treats it.
   - A reply is an `@sdlc-harness` command (goal 4's syntax), not any comment after the park. Issue comments
     have no threads, so when more than one question file is open, the command names the question it answers.
     Settle the form of that reference and what happens to a
     payload over `workflow_dispatch`'s 65,535-character limit (`remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`).
4. **Pause, resume and stop from a comment.** A comment command sends the same dispatches the local relays send
   (`docs/remote-execution.md` → `## 5.`): `action: pause`, `resume: pause`, and the stop sequence of `###
   The kill switch and stopping`: the marker first, then cancelling the branch's runs. Also cover clearing a
   `park_loop` (`park_loop_clear`).
   - **Command syntax — decided (maintainer, 2026-10-01).** A command is the handle `@sdlc-harness` as the
     **first word of the comment's first line**, followed by a verb: `@sdlc-harness <verb> [args]`. This applies
     the first-line, first-word convention and the `@claude` constraint of `docs/github-integration-research.md`
     → C4, and avoids a leading `/`.
     - The handle is matched case-insensitively. Text after the verb is ignored for control verbs and may be
       echoed in the confirmation.
     - Without the handle as the first word, a comment is never a command: `pause`, `pause this`,
       `Let's @sdlc-harness pause` and a quoted line (`> @sdlc-harness pause`) all trigger nothing.
     - The handle followed by an unknown verb triggers nothing, and the harness replies listing the valid verbs.
     - The verbs cover goal 3's answer, which names the question it answers when more than one is open, and this
       goal's pause, resume, stop and `park_loop` clear. Choose the verb names.
     - Why not `@harness`: on 2026-10-01, `gh api users/harness` returned the organisation `Harness Inc.`
       (`github.com/harness`), so the mention would link to a stranger's account. `sdlc-harness` returned 404.
     - The maintainer then created the free organisation `sdlc-harness` (`github.com/sdlc-harness`, created
       2026-10-01T06:33:39Z) so that nobody else can take the name. It is not a user, an app, or a member of any
       adopter's repository. Observed on `firu-daniel/harness-gate12` issue #5 on 2026-10-01 (the repository is
       reset to its seed afterwards, so the issue may not exist):
       - the handle **does not autocomplete**: typing `@` suggested only the maintainer's account;
       - it **renders as a link** to the organisation: the `body_html` holds `<a class="user-mention notranslate"
         data-hovercard-type="organization" … href="https://github.com/sdlc-harness">@sdlc-harness</a>`;
       - the raw `body` keeps the plain text `@sdlc-harness`, which is what the command match reads.

       State in the adopter docs that the command is typed in full, that the link goes to the harness's
       placeholder organisation, and that the command is matched as text, not delivered through the mention.
   - **Every accepted command gets a reply comment**, naming the actor, the command and what was done (for
     example *"Pause requested by @<login>; the run yields at its next checkpoint."*), and every rejected one
     gets a reply giving the reason, unless it was rejected because it came from the harness itself. Use a reply,
     not a reaction: any reader can add a reaction, so a reaction does not show who acted.
   - **The harness never triggers itself.** Every comment it posts carries a hidden marker, and a comment that
     carries the marker is never a command. Do not rely on the author's login for this. A comment posted with
     `HARNESS_GIT_TOKEN` appears under the maintainer's login and passes the permission check. A comment posted
     with `GITHUB_TOKEN` starts no workflow (`docs/github-integration-research.md` → S3). A park post can quote
     task text that begins with the handle.
5. **Lifecycle comments.** `launched`, `parked`, `paused`, `resumed`, `completed` and `failed` reach the issue or
   PR as comments. `completed` names the draft PR. `parked` carries the question (goal 3). A usage `paused`
   names the reset time. Each comment names the next action as a *GitHub* action, not a local command.
   - `autonomous-notify.sh` keeps working unchanged beside this.
   - A chained `budget` continuation stays silent, as it is for notifications (`docs/remote-execution.md` →
     `### Notifications`).
   - Decide whether the comment is added in `autonomous-notify.sh` as a new sink or in the workflow steps.
6. **State labels on the issue and the PR.** One harness-owned label set shows where a run stands, for example
   `harness: started`, `harness: running`, `harness: parked` and `harness: done` (choose the names and whether
   `failed` and `paused` get their own). The same set is applied to the issue that started the run and to the
   run's PR once it exists, and each transition replaces the previous state label, so an item carries at most
   one. A maintainer can then see and filter a run's state from the issue or PR list without opening comments.
   - Today the trigger removes the trigger label after its comment and adds nothing
     (`docs/github-issue-trigger.md` → its step 6, *"The comment and the label"*), so the issue shows no state
     beyond that comment. The trigger sets the first state label in the same step that removes the trigger
     label. Keep the removal: re-applying the trigger label is how a maintainer deliberately starts another run
     on the next indexed branch, and GitHub raises no `labeled` event for a label already present.
   - This is the same harness-owned "run in flight" signal the *A run in flight* lead below asks for. Build one
     scheme that serves both, not two.
   - The state labels are created on first use, never asked of the maintainer (the *No opt-in step* decision).
     State that a maintainer must not apply them by hand, and that the harness overwrites a hand-applied one.
   - Name them with the same `sdlc-harness` prefix as the trigger label (goal 8), for example
     `sdlc-harness: running`, so that the trigger label and the state labels sort together in the label list.
7. **Local and remote keep working together.** Everything above has an equivalent that already works from the
   local commands. A maintainer may use either side for any step, and each side sees what the other did. Build
   on the adopt step `feat_forge_run_triggers` delivered (or its documented absence). Nothing new is required
   of a local-only adopter.
8. **The default trigger label becomes `sdlc-harness` — decided (maintainer, 2026-10-01).** `harness` is a
   generic word that a repository may already use as a label for something else. `sdlc-harness` matches the
   `@sdlc-harness` command handle (goal 4), so it is one name to remember.
   - Today the default `harness` appears in `cli/src/remote/githubActions.ts` (`DEFAULT_TRIGGER_LABEL`),
     `cli/templates/scripts/remote-run.sh` (`DEFAULT_TRIGGER_LABEL`), the `if:` fallback and header comments of
     `cli/templates/github/workflows/harness-trigger.yml`, the `gh label create` line `init` prints, `doctor`'s
     `forge` note, their tests, and `docs/github-issue-trigger.md`. Find every mirror by searching for the
     literal rather than trusting this list.
   - `HARNESS_TRIGGER_LABEL` still overrides the default, unchanged.
   - Settle the upgrade path for a repository wired by the previous release. Its committed
     `harness-trigger.yml` carries no version pin, so `init --upgrade-workflows` does not re-render it, and its
     `if:` still falls back to `harness`. It may also already have a `harness` label on open issues. Decide
     whether such a repository keeps `harness` until it re-renders the workflow, and say how `doctor
     --check-github` reports a label that does not match the workflow's default.
9. **Two entry points: local and GitHub.** Write the GitHub route as its own section in the adopter docs, and
   present both entry points in the root `README.md`. The aim is that nobody reads the dropped
   `feat_github_native_adoption` as "every team member needs a local install". The two routes are not
   alternatives. Every team member can keep a local setup and also work runs from GitHub, at the same time.
   Nothing says the team moves to GitHub after the setup.
   - **The README's opening paragraph.** Introduce the harness through its two entry points:
     - a local one, the plugin install;
     - a remote one, through GitHub.

     Keep *"You ask for a change, and you get back a branch that has been planned, implemented and
     independently reviewed, pushed and ready for your review."* State that a one-time local setup is needed
     before the GitHub route works.
   - **The README's local steps** under `## Quick start` → `### Adopting it in your own repository` (A to F) stay
     as they are.
   - **After those steps, a very short section on starting work from GitHub.** Labelling an issue
     `sdlc-harness` starts a run, and a review that requests changes on the run's pull request starts a
     user-review round. Link to the adopter-docs section for everything else. With `forge: "github"` and
     `execution.target: "github-actions"`, a team member who uses only this route needs nothing local: no
     clone, no plugin and no `init`.
   - The plan phase may propose a simpler or more logical arrangement for the README than the one above. Keep
     the substance: two entry points, the local setup comes first, and the two can be mixed.
   - **The one-time setup, by one maintainer, locally.** List every action in order: install the plugin; run
     `init`; run `/autonomous-sdlc-harness:harness-analyze`, recommended; run `config set forge github` and
     `config set execution.target github-actions`; commit; run `gh auth refresh -s workflow`; push to the default
     branch; set a credential secret; set `HARNESS_GIT_TOKEN` when tasks will edit `.github/workflows/*`; create
     the trigger label; switch on the PR-creation setting if goal 1 needs it. Reuse
     `docs/github-issue-trigger.md` → `## Turning it on, in short` and `docs/remote-execution.md` → `## 7.
     Turning it on` by reference rather than restating their commands.
   - **What a team member with write access then does from GitHub alone:**
     - start a run by labelling an issue;
     - answer a park, and pause, resume or stop a run, with `@sdlc-harness` comments;
     - start a user-review round with a review that requests changes on a pull request from the run's branch,
       draft or not;
     - follow the run through its lifecycle comments and state labels.

     Triage is refused, as it is for the trigger (`docs/github-issue-trigger.md` → `## 3.`).
   - **What still needs a local machine, stated as a list:**
     - running or re-running `/autonomous-sdlc-harness:harness-analyze`, which is supervised and has no remote
       route (`docs/github-integration-research.md` → A12);
     - upgrading (`init --upgrade-workflows`, `init --force`), since the workflows pin the harness version;
     - `doctor`;
     - a configuration change that needs files re-rendered. A plain switch in `harness.config.json` can be
       edited in a pull request on GitHub, because the job reads the file from the branch;
     - the interactive-test phase. A remote run skips it, and the branch still owes a local
       `/autonomous-sdlc-harness:branch-qa-test` while `phases.qa` is on, until `ROADMAP.md`'s *Cloud QA* row
       lands.
   - **The caveats a team should know:**
     - Every team member's run uses the one credential secret in the repository and is billed to its owner.
       Point to `docs/remote-execution.md` → `## 9.` for which credential to use, rather than restating it.
     - On a public repository, park questions, answers and review text become public comments (the
       *Visibility of what the comments carry* lead).

## Leads (re-verify every one)

- **Linking a run to its issue and PR.** Lifecycle comments and park posts need to know where to post, and today
  nothing records it. The candidates are:
  - a new `workflow_dispatch` input, such as a forge reference;
  - a small committed file under `<state_dir>`;
  - a lookup from the branch to its PR at post time.

  The `harness-run.yml` inputs are a wire: `remote-run.sh` is their one producer on the shell side, and the
  template header lists its declared mirrors. So a new input is an edit to every mirror.
- **Events.** `pull_request_review` (`submitted`), `pull_request_review_comment` and `issue_comment` (which also
  fires for a PR's conversation). Source:
  https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
- **Authorisation, again, and harder.** Anyone who can read a public repository can comment, and comment
  workflows run with the repository's secrets. Every trigger in this branch checks the commenter's or reviewer's
  permission through the API, with at least write required, rejects unlisted bots, and ignores the harness's own
  comments so that it never triggers itself. Reuse the check `feat_forge_run_triggers` built.
- **Fork pull requests.** A harness-created PR's head is a branch in the same repository, so its events carry
  secrets. A PR from a fork must never trigger anything:
  - refuse on the head repository;
  - never use `pull_request_target` to run code from a PR's head.

  State the rule where an adopter will read it, next to `docs/remote-execution.md` → `## 11. Security`'s
  self-hosted-runner warning.
- **Only harness PRs.** A PR is recognised as the harness's automatically, from its head branch (see *No
  opt-in step* below): for example the branch carrying its task prompt or its flow-progress ledger under
  `<state_dir>`. The test must use committed state a job can read from the branch, not the local registry.
  Establish which state is the reliable test. A review or command on any other PR does nothing.
  - The reason is not only scope: a user-review round needs the branch's harness state. Today the round is
    placed into the run's working copy, which `/autonomous-sdlc-harness:branch-user-review` resolves from the
    registry record, and it offers only branches with a `completed` or `failed` record. The fix flow itself
    tolerates a missing task prompt (`branch-start-user-review-fix-autonomous.md`: *"may or may not exist for a
    user-review round"*), but the statistics step returns an error without the story index. Establish what a
    GitHub-started round needs on the head branch, and recognise a PR by that, not by who opened it: a PR a
    person opened from a harness branch qualifies, and a harness-opened PR whose branch lacks the state does
    not. The same recognition gates every PR-side action in this prompt (pause, resume, stop, park answers),
    not only reviews.
- **No opt-in step — decided (maintainer, 2026-09-30).** A PR is the harness's when its head branch carries the
  harness state above, whether the harness opened it (draft or not) or a person opened it by hand for that
  branch. Detect that automatically: no label or other step is asked of the maintainer. Only authorisation (the
  permission check) gates the action. An event is handled when it translates into a harness action — a review
  with changes requested, a comment command, a reply to a park — and every other event on the PR is left
  alone. That is how a maintainer keeps an ordinary conversation on a harness PR: a review left as *Comment* or
  *Approve* (states `commented` and `approved`, `docs/github-integration-research.md` → C1) starts nothing. A
  label the harness sets and reads for its own state (below) is not an opt-in step and is allowed.
- **A run in flight, and what "ready for review" is on the PR.** Draft status cannot be that signal: the
  maintainer can change it, and a review with changes requested was accepted on a draft PR (C1's measurement).
  The trigger needs a harness-owned "run in flight" signal for the branch, such as a state label the harness
  sets on dispatch and clears on `completed` or `failed`, or a check for an active `harness-run.yml` run on the
  branch. If it is a label, it is goal 6's state label set, not a second scheme. A review arriving while a run is in flight must not be lost silently:
  - `harness-run.yml`'s per-branch `concurrency` group (`cancel-in-progress: false`) queues a second dispatch,
    and GitHub documents that a newer pending run in a group cancels an older pending one. Not measured here.
  - The local side discards a user review dropped for a running branch, with only a log line
    (`autonomous-watcher.sh`: *"already has a running GitHub Actions run — archiving the duplicate inbox
    file"*).

  Decide whether the trigger refuses with a comment (for example "a round is in progress; resubmit after it
  completes"), or queues the review for the next round. Whichever it is, say whether the local side adopts
  the same notice.
- **Which inline comments a round collects.** Inline comments left with *Comment* arrive as a review with state
  `commented`, and each also raises its own `pull_request_review_comment` event (C1). So a maintainer can leave
  several inline comments over time, then submit *Request changes* with a short summary. Built from the
  submitted review alone (goal 2's *"One submitted review is one round"*), the round would miss the earlier
  comments. Decide:
  - whether a round collects only the submitted review's comments, every inline comment since the previous
    round, or every unresolved conversation on the PR (not researched: GraphQL review threads carry a resolved
    flag, which could mark a comment as handled);
  - what happens to comments left while a round is running.
- **Stale line numbers.** A comment made before a round's fixes moved the code points at old lines. Each review
  comment carries `commit_id`, `original_line` and `diff_hunk`, and GitHub sets `line` to `null` once a comment
  is outdated (C1). Record the commit and the `diff_hunk` with each comment in the round file, not the line
  alone, so that `user-review-fix-plan-writer`, which re-checks every observation against the current code,
  can re-locate it.
- **Opening PRs from a job.**
  - It needs `pull-requests: write`.
  - GitHub's setting *"Allow GitHub Actions to create and approve pull requests"* is believed to be off by
    default. Verify this, and say what the adopter switches on.
  - A PR opened, or a push made, with `GITHUB_TOKEN` starts no other workflow, so the adopter's CI does not
    run on the draft PR. `HARNESS_GIT_TOKEN` already exists for pushes (`docs/remote-execution.md` → `###
    Every secret and variable`); decide whether it also opens the PR.
- **A local branch reviewed on GitHub.** A branch whose task run executed locally can get a draft PR and then a
  GitHub review. The trigger's rule is that a GitHub-triggered run executes through `harness-run.yml`, and the
  registry's rule is that a run keeps the execution it started with (`docs/remote-execution.md` → `## 1.`,
  step 3). Settle how those meet for a new user-review round, and what becomes of the local working copy.
- **Visibility of what the comments carry.** Park questions, answers and review text already appear in the
  artifact and the workflow inputs (`docs/remote-execution.md` → `## 11.`). As comments they are more visible,
  and on a public repository they are public. Say so.
- **`anthropics/claude-code-action`'s mention mode** (https://code.claude.com/docs/en/github-actions) is prior art
  for comment-driven control and its permission checks. It is a reference point, not the runtime, for the reason
  `docs/remote-execution.md` → `## 2. Why the job runs the watcher` records.

## Establish, do not assume

- What `feat_forge_run_triggers` shipped: its authorisation check, its placement entry point, its issue comment,
  its adopt step, and its `forge` reader and reporter. Build on them, and do not duplicate them.
- Whether the Actions-tab **Run workflow** route that branch documented stays documented as a fallback. It should.
- What `doctor` checks for this coupling: the PR-creation setting, the permissions, the workflow files.

## Out of scope

- Adapters beyond GitHub. Keep the shape open for them, as the trigger branch did.
- Removing the one-time local setup. That was `feat_github_native_adoption`, which is dropped. Goal 9 documents
  the team path that follows that setup; it removes nothing.
- Running the interactive-test phase remotely, which is `ROADMAP.md`'s *Cloud QA* row.
- Merging anything. The flow never merges.

## Acceptance

1. A run that reaches "branch ready for review" has a draft PR, linked to its issue when one started it: the PR
   body names the issue, and the issue's timeline shows the PR.
2. A review with changes requested on that PR, by an authorised actor, starts the next user-review round on the
   branch, and the round file carries the review's body and every inline comment with its file and line.
3. A park posts its whole question file on the issue or PR, and an authorised reply resumes the run with that
   answer.
4. Pause, resume, stop and clearing a park loop work from a comment by an authorised actor, with the same effect
   as the local relays.
5. Lifecycle events appear as comments, and each one names the next GitHub-side action. The issue and the PR
   each carry exactly one harness state label matching the run's current state, the first one set by the
   trigger when it removes the trigger label.
6. A comment or review from an actor without write access, an unlisted bot, the harness itself, or on a fork's
   PR, triggers nothing. The rule is stated where an adopter will read it.
7. The local commands still work for the same runs, and a maintainer can mix both sides.
8. `forge`'s row states that the whole coupling is delivered, or names what is still missing.
9. With no `HARNESS_TRIGGER_LABEL` set, labelling an issue `sdlc-harness` starts a run. The docs state the
   upgrade path for a repository already using `harness`.
10. The adopter docs have a section for the GitHub entry point. It lists the one-time local setup actions, what a
    team member with write access does from GitHub alone, what still needs a local machine, and the caveats. The
    root `README.md` opens with both entry points and says the local setup comes first. Its local steps are
    unchanged, and they are followed by a short section on starting a run and a user-review round from GitHub,
    linking to that adopter-docs section. Nothing in the docs says the team moves off the local route.
11. `bash scripts/run-gates.sh` prints no new failure.
