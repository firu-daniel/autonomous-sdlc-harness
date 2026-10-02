`fix_forge_run_control_gate12_findings` fixes what Gate 12 round 6 (2026-10-02, CLI 0.6.0, `firu-daniel/harness-gate12`) found running observation (xiv), **run control from GitHub**, end to end. It also lands the design changes the operator decided during that round. The round worked a whole run from GitHub alone (issue #8 → branch `feat_invoices_3` → draft PR #9). It used comment commands (`answer`, `pause`, `resume`, `stop`), two parks (one on the issue, one on the PR), three review rounds and reviews submitted while a round ran. Most of it passed. One defect is **High**: a park that is answered, then paused, then resumed ends `parked`, opens no pull request, and cannot be worked from GitHub at all.

The round's record is `docs/development.md` → Gate 12 → **Round 6** (findings 1–9). The items below carry the operator's working numbers (1–13) from the round's issues log. This map ties them to the record's findings:

| Item | `development.md` Round 6 | Kind |
|---|---|---|
| 7 | finding 1 | defect, **High** |
| 5 | finding 2 | defect, Medium |
| 2 | finding 3 | defect, Low |
| 3 | finding 4 | defect, Low |
| 8 | finding 5 | defect, Low |
| 9 | finding 6 | defect, Low |
| 11 | finding 7 | defect, Low |
| 12 | finding 8 | defect, Low |
| 13 | finding 9 | decided change, Medium |
| 4 | design change | decided change, Medium |
| 6 | design change | decided change (granularity decided), Low |
| 1 | open question | for this plan to decide |
| 10 | open question | for this plan to decide, with the operator's stated preference |

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number** (line numbers below are approximate, from 0.6.0's rendered copies in the scratch repository). The fixes listed under each item are **candidates, not instructions**: verify each against the real code and GitHub's documentation before planning it, and say so in the plan if a better one exists or one of them is wrong. Where an item says *decided*, the behaviour is fixed by the operator and only the mechanism is open.

---

## Priority and shape

1. **Item 7 first.** It is the only High, and it blocks Gate 12 (xiv) leg (d) without a workaround. Fix it so that classification is correct after **any** sequence of answer, pause (user, budget, usage), stop and resume in job mode, not only the one observed.
2. Then the other defects (items 5, 2, 3, 8, 9, 11, 12).
3. Then the decided design changes (items 4, 13, 6). Items 4 and 6 change where comments go and when the PR opens, so plan them together with the §5 target rule.
4. Decide the two open questions (items 1, 10) in the plan, implement what is decided, and record the reasoning in `docs/github-run-control.md`.

If the plan judges the whole set too large for one branch, it says so and proposes a split. Item 7 and the other defects stay in this branch, and the design changes become a follow-up whose task prompt the plan writes out.

---

## A. Defects

### Item 7 — Answered park → pause → resume: the completed run is misclassified `parked`, no PR, and the run is stuck — High

- **What happened (run `feat_invoices_3`, issue #8):**
  - Job 1 `36996832017` parked on `question_1.md`.
  - `@sdlc-harness answer 1` started job 2 `36997181591` (`resume=answer`). It logged `wrote answer_1.md`, `resuming parked run 'feat_invoices_3' (answers 1)`, consumed the answer, planned, implemented Task 1, then honoured `@sdlc-harness pause` (`job: paused stop`).
  - `@sdlc-harness resume` started job 3 `36998575175` (`resume=pause`). It logged `resuming paused run`, ran the flow to the end (ledger D `[x]`, session text `## Done: feat_invoices_3 is ready for review`, rc=0), then logged `[watcher] run 'feat_invoices_3' parked (clarification waiting) — rc=0` and `job: parked stop`.
  - `deliver: the bundle's status is 'parked', not completed; nothing posted`, so **no draft PR**, no `completed` comment and no `done` label.
  - Instead the issue got a parked comment with no question, 11:26:57Z: "The harness run on `feat_invoices_3` is waiting for an answer. Its questions are in the run's `harness-state` artifact.". The label went to `sdlc-harness: parked`.
- **Root cause:**
  - `classify_run_exit` (`scripts/autonomous-watcher.sh` ~2242–2280) archives the answered pair only from the registry field `resumed_for_index`. Any top-level `question_<n>.md` left after that archival is classified `parked`, answered or not.
  - Job 2 set `resumed_for_index="1"` but exited on a pause. That is deliberately not archived (lines ~2198–2209, ~2585), so the field must survive to the next non-pause exit.
  - Locally the registry persists. Remotely the job's registry is discarded and only the `harness-state` bundle crosses jobs. Its `status.json` (schema `1`) carries `resume_max_question_index` but **not `resumed_for_index`**, so job 3 restored no consumed set, archived nothing, and found the answered pair (`clarifications/feat_invoices_3/question_1.md` + `answer_1.md`, both in the bundle) at the top level.
- **Why it is stuck from GitHub:**
  - `@sdlc-harness answer` is refused with no open question (`open_questions_in` counts only a question without an answer).
  - `@sdlc-harness resume` is refused, because the state is `parked`.
  - `stop` then `resume` re-enters as a pause resume, which ends the same way.
  - A review requesting changes is "collected", but no round starts while the newest run is parked.
  - The only route out is the *Run workflow* form with `resume=answer`.
- **Impact:** every remote run whose park is answered and that is then paused (by the user, a budget chain or a usage pause) before its next non-pause exit never delivers. Budget chains make this likely on long runs even without a user pause.
- **Fix:**
  - Carry `resumed_for_index` in the bundle (`status.json`, bump the schema, or add it as optional), and restore it into the job's registry.
  - Or, more robustly, make classification not depend on registry memory: treat a top-level pair whose `answer_<n>.md` existed **before** the session started (bundle-restored, or older than the session's start) as consumed and archive it. Count only a pair whose question was written during this session as a park.
  - Also, a parked classification with no unanswered question should never post a question-less "waiting for an answer" comment. Fail loudly instead.
  - Add a stub-suite case for answer, then pause, then resume, then complete in job mode, and a Gate 12 (xiv) note.

### Item 5 — Closing the issue/PR or deleting the run's branch does not stop the run — Medium

- **What:** no workflow reacts to the run's issue or PR being closed, or to its branch being deleted. `harness-control.yml` listens only to `issue_comment: [created]` and `pull_request_review: [submitted]`, `harness-trigger.yml` only to `issues: [labeled]`, and `harness-run.yml`/`harness-resume.yml` to `workflow_dispatch`/`schedule`. The docs never say what happens. `github-run-control.md` §4 only says the flow "does not own the issue's lifecycle".
- **Consequences:**
  - A closed issue or PR (closed as unwanted, or the PR merged) leaves the run, initial or user-review round, burning billed minutes and the credential.
  - It keeps posting lifecycle comments on a closed item.
  - On a deleted branch the job fails at its next fetch or push. The automatic resumes, and the `harness-resume.yml` poller, may re-dispatch it.
  - It ends `failed` rather than `stopped`, with a misleading `failed` comment.
- **Evidence:** the `on:` blocks of the four workflows rendered by 0.6.0 in `firu-daniel/harness-gate12` (`7c533bb`).
- **Expected (operator, 2026-10-02):** in any phase (initial run, park, pause, user-review round), closing the run's issue or PR, or deleting its branch, **stops** the run, the same as `@sdlc-harness stop`. Workflow runs and their `harness-state` artifacts are **kept**, not deleted, so the history stays readable and a stopped run can still be resumed while its branch exists.
- **Fix:**
  - **Issue closed:** add `issues: [closed]` to `harness-control.yml`. Resolve the branch from the trigger's `started` comment, as comment commands do. If a run of it is known and not finished, run `remote-run.sh stop`, and post a `stopped` comment naming the actor and "the issue was closed". Do nothing for a run that already completed.
  - **PR closed or merged:** add `pull_request: [closed]`, for a PR from the run's branch (§2 *Which pull requests count*); same stop, with the reason "the pull request was closed" or "merged". Never use `pull_request_target`; the fork rule still applies.
  - **Branch deleted:** add `delete` (`ref_type == branch`). It runs from the default branch, so the scripts are trusted. Stop the branch's queued and running jobs, and do not dispatch a resume. Skip the comment on the branch, which is gone, but post `stopped` on the issue if one is known. Make `harness-resume.yml` and the automatic resume skip a branch absent on `origin`.
  - **Reopening** the issue or PR does not resume by itself; `@sdlc-harness resume` does, while the branch exists.
  - **Actor check (decided, operator 2026-10-02):** a close stops the run only when the actor passes the §6 check (`admin`/`write`, or a bot in `HARNESS_TRIGGER_ALLOWED_BOTS`). A close by anyone else, for example a triage user (GitHub lets triage close issues and PRs), is **ignored**: no stop, no dispatch, no label change, and the job log names the login and why. The run carries on, and the item stays closed until someone with write access acts on it. Deleting a branch already needs write access, so the `delete` path needs no extra check beyond the bot rule.
  - **Docs and tests:** a §5 row "closed/deleted → stopped", a §8 row to verify on GitHub, a Gate 12 (xiv) leg, and stub cases.

### Item 2 — A refused comment command fails the `harness control` run — Low

- **What:** `@sdlc-harness status` on issue #8 (10:43:54Z) was refused correctly, with a reply listing the five commands, but its run `harness control 8` (`36997091644`) ended as **failure**: `remote-run.sh: control: `status` refused: it is not a command this harness carries out` then `##[error]Process completed with exit code 2.`
- **Why it matters:** a refusal is a normal, answered outcome (unknown verb, wrong state, unauthorised commenter, `answer` while a job is in flight). Every one shows as a red run in the Actions list, and GitHub e-mails a workflow-failure notice. A real control failure, such as `gh` erroring, looks the same as an ordinary refusal.
- **Evidence:** `scripts/remote-run.sh` `EXIT_REFUSED=2`; the header says "on 2 a refusal and exit 2"; the control step in `harness-control.yml` runs under `bash -e -o pipefail`.
- **Expected:** a refusal that was replied to ends the job `success` (or a neutral state). Only a failure to act or to reply fails it.
- **Fix:** in `harness-control.yml`, map `control`'s exit 2 to step success (`|| [ $? -eq 2 ]`), or have `control` exit 0 once the refusal reply is posted, keeping 2 for script callers that need it.

### Item 3 — Park comment tells a GitHub reader to answer in a local `answer_1.md` file — Low

- **What:** the parked comment on issue #8 (10:43:09Z) carries `question_1.md` unchanged, which includes the file-channel line "Please answer in one `answer_1.md` beside this file, addressing each question by its `Q<k>` label." A person on GitHub has no such file. The comment's own footer then gives the correct form (`@sdlc-harness answer 1`), so the comment carries two contradictory instructions.
- **Evidence:** comment `5950624356` on issue #8. `docs/github-run-control.md` §3 states that the comment carries the question file unchanged.
- **Expected:** a GitHub reader sees one answer instruction.
- **Fix:** have `report` replace or strike the file-channel answer line when posting (a known line in the canonical question format), or reword the canonical line neutrally ("Answer addressing each question by its `Q<k>` label") so it works in both channels.

### Item 8 — The draft PR's `Started from #<n>.` does not link the PR on the issue's timeline — Low

- **What:** PR #9, opened by `deliver` with the job token (author `app/github-actions`), has the body line `Started from #8.`. Issue #8's timeline has no `cross-referenced` event for it: 16 commented, 9 labeled, 8 unlabeled, 8 mentioned, 4 subscribed. The `completed` comment's PR URL, also posted with the job token, creates none either. So nothing on the issue's page links to the PR except the text of the `completed` comment, and Gate 12 (xiv) leg (d)'s condition "the issue's timeline shows the pull request" fails.
- **Likely cause (to verify):** GitHub does not create cross-reference events for content authored with the Actions `GITHUB_TOKEN`, in the same family as "events from `GITHUB_TOKEN` start no workflow" (S3). Not retrieved in `github-integration-research.md`.
- **Fix options:**
  - Open the PR with `HARNESS_GIT_TOKEN` when set; verify whether that links.
  - Link the PR through the issue's **Development** panel: GraphQL `linkedBranches`/`createLinkedBranch` before the branch is pushed, or adding the PR to the issue via the API.
  - Or accept it, and change leg (d) plus §4 to say the link is the `completed` comment's text, adding a §8 row recording the measured behaviour.

### Item 9 — A `harness-run.yml` dispatch from a ref other than its `branch` input is accepted and becomes invisible — Low

- **What:** recovering item 7 through the *Run workflow* fallback, the operator dispatched with `--ref main` (the form's default *Use workflow from*) and `branch=feat_invoices_3`. Run `37001319740` worked: it completed and opened PR #9. But GitHub lists it as `headBranch main`, `headSha 7c533bb`, so every `--branch feat_invoices_3` lookup skips it (control's state read, `restore`'s lineage bound, `collect`'s settledness). A review submitted next was answered "`feat_invoices_3` is `parked`" from the older job 3, and the newest real state was lost.
- **Docs:** `remote-execution.md` §1 does say to pick the run's branch under *Use workflow from*. But the form defaults to the default branch, so this mistake is the natural one.
- **Fix:** in `harness-run.yml`'s first step, refuse (fail fast, with a message naming the right ref) when `github.ref_name != inputs.branch` for `action: run`/`pause`/`stop`. Or make `remote-run.sh`'s lookups filter by the `branch` input encoded in the run name (`harness run <branch>`) rather than by `headBranch`.

### Item 11 — A stopped run is called `paused` in command replies — Low

- **What:** after `@sdlc-harness stop` on PR #9 (the `stopped` comment at 11:54:50Z, labels `sdlc-harness: stopped` on the PR and the issue), a `@SDLC-HARNESS pause` on issue #8 at 11:55:21Z was refused with "only a running run can be paused, and the run on `feat_invoices_3` is `paused`. Nothing needs pausing." The state the user sees on GitHub is *stopped*, but the reply says *paused*.
- **Likely cause:** the stop cancels the job, and its bundle is read back as `paused` with `pause_reason: killed` (`remote-execution.md` §4: a job that ended without uploading, or one that was cancelled, syncs as `paused` / `killed`). `control`'s state wording comes from the bundle status, not from the stop marker or the lifecycle event.
- **Expected:** replies name the state the same way the lifecycle comment and label do: `stopped`, with the way on `@sdlc-harness resume`.
- **Fix:** have `control`'s state read map `paused` + `killed` to `stopped` when a `harness stop <branch>` run is the newest control event (or when the label is `sdlc-harness: stopped`). Or record `pause_reason: stop` in the cancelled job's post-step bundle when the stop marker is found.

### Item 12 — A resume after `stop` launches with a stale `PAUSE_PROGRESS.md` from another engine/round — Low

- **What:** `@sdlc-harness resume` after `@sdlc-harness stop` (PR #9, 11:55:46Z) relaunched round 2 (run `37003752361`, engine `user_review`) with the prompt "This is a RESUME from a PAUSE: read sdlc-harness/PAUSE_PROGRESS.md". That file held only the **task** run's note `2026-10-02T10:58:44Z — PAUSED: feat_invoices_3 — Phase A (implementation)` ("resume Phase A at Task 2"). The round's own ledger was freshly seeded for `user_review, round 2`, and the stopped job had written no pause note of its own, because it was cancelled, not paused.
- **Source:** the run's improvement observations, `sdlc-harness/improvement_observations/feat_invoices_3.md` → *User-review fix round 2*. The session ignored the note because the ledger is authoritative (§1.7), so there was no visible cost this time.
- **Why it matters:** `PAUSE_PROGRESS.md` is carried in the `harness-state` bundle across jobs, engines and rounds. A resume after a stop (state `paused`/`killed`, item 11) is framed as a pause resume and handed a note about a different engine's position, which an agent could follow.
- **Fix:**
  - Scope the note to the run it belongs to: key it by engine and round, or clear it when a new round or engine seeds its ledger.
  - Have the resume prompt after a stop or kill say so ("resume after a stop; no pause note; continue from the ledger") rather than point at the pause note.

---

## B. Decided design changes

### Item 4 — Open the draft PR when the run starts; flip it to ready on completion — Medium (design, decided)

- **What:** by design (`docs/github-run-control.md` §4–§5), `deliver` opens the draft PR only once the run **completes**. Lifecycle comments use the target rule "PR if one exists, else the issue", so the whole first run (park, answer, pause, resume, stop) is worked on the issue, and the conversation moves to the PR only after completion. The team watches two places over the branch's life, and the work cannot be followed as a PR while it runs.
- **Evidence:** issue #8. The run `feat_invoices_3` parked at 10:43:09Z and was answered at 10:44:41Z on the issue, with no PR for the branch while it ran.
- **Decision (operator, 2026-10-02):** open the draft PR when the run starts. It is consistent with the existing design: a user can already open a PR from the run's branch by hand, and that PR is recognised as the run's PR, receives its comments and labels, and starts review rounds (§2 *Which pull requests count*, §4 *A locally executed run gets none*). Opening it at start just makes the job do what a user can already do.
- **Fix:**
  - Open the draft PR (body `Started from #<n>.` plus the commands text) right after the task-prompt commit is pushed: in `start`/the trigger, or at the top of the first `harness run` job. Use the same token rules and the same one ready-PR retry as `deliver`.
  - `deliver` then only reuses the open PR.
  - **`completed` goes on the PR always, and also on the source issue when one exists** (decided, operator 2026-10-02). Today §5 posts it on the issue alone when the issue opened a new PR. With the PR opened at start, the PR is the one constant place a run is worked from, whatever started it: a labelled issue, an external tracker such as Jira, or a request made on a fresh PR whose title and description are the task. Both items get `sdlc-harness: done`. Generalise the target rule the same way: every lifecycle comment goes to the PR, and the source item (issue, or a link back to the external ticket) gets `launched` and `completed`.
  - A comment command on the issue keeps working (it resolves the branch from the `started` comment).
  - **Draft state follows the run (decided, operator 2026-10-02).** Today the PR stays a draft until a person marks it ready (§4: "It is a draft so that marking it ready for review is a person's step"). With the PR opened at start, the draft state shows whether the harness is working:
    - At start the PR is a draft.
    - On `completed`, the job marks it **ready for review** (`gh pr ready <pr>`).
    - When a user-review round starts, the job turns it back to **draft** (`gh pr ready <pr> --undo`). On that round's `completed` it marks it ready again.
    - A park, a pause or a stop leaves it a draft, because the run is not finished.
    - This needs `pull-requests: write` on the token that flips it. On a plan without drafts (the one-retry fallback), skip the flip and say so in the `completed` comment.
    - A PR a person marked ready while a run is working is left alone until the next transition, and the job never fails on a refused flip: one warning line, as for labels.
    - Update §4 (*When it opens*, the "person's step" sentence), the §5 table (a "draft state" column), and Gate 12 (xiv) legs (d)/(e) to check `isDraft` at each transition.
  - Update §4 *When it opens*, the §5 table and the `completed` row, Gate 12 (xiv) leg (d), and the stub suites.
  - A run that fails or is stopped for good leaves an open draft PR. Say so in the `failed`/`stopped` comments (close it or resume).

### Item 13 — Inline review threads a round addressed are left unresolved when the round completes — Medium (decided)

- **What:** review round 1 on PR #9 took `expause-admin`'s two inline comments, threads on `src/invoiceInput.ts:18` and `src/invoiceLines.ts:20`, and fixed both (`01d5f00`, `372a9fb`). Both threads stayed **unresolved** after the round's `completed` comment (11:52:10Z), so the reviewer has to work out by hand which ones the round dealt with.
- **What can be resolved:** only inline review **threads** (*Files changed*). A review's summary body (for example texts 1–4, submitted with `gh pr review --request-changes --body`) has no thread on GitHub and cannot be resolved, so nothing applies there.
- **Expected (operator, 2026-10-02):** when a round completes, every inline thread whose comment the round collected (the round file's marker `comments=<id,…>`) and whose finding the fix plan **implemented** is replied to and resolved.
- **Fix:**
  - At `completed` for a user-review round, for each collected comment id, find its thread: GraphQL `pullRequest.reviewThreads`, matched by a comment's `databaseId`.
  - Read the fix plan's verdict for the finding that comment became.
  - **Fixed:** post a thread reply naming the commit ("Addressed in `<sha>`."), then `resolveReviewThread`.
  - **Classified invalid or out of scope:** reply with the reason and leave the thread **unresolved**, so the reviewer decides.
  - Use the job token (`pull-requests: write`; verify that `resolveReviewThread` accepts it, and add a §8 row). A refused resolve is one warning line, never a failure, as with labels.
  - A thread the reviewer already resolved, or replied to after the round was collected, is left alone.
  - Do **not** dismiss the reviewer's *Changes requested* review state. That stays the reviewer's call, and it matters where branch protection requires approval.
  - Update §2/§5, Gate 12 (xiv) leg (e) (check the threads are resolved after the round completes), and the stub suites.

### Item 6 — Short phase-progress comments on the PR while a run works — Low (suggestion, for the planning session to decide)

- **What:** between `launched`/`resumed` and `completed`, a run working for tens of minutes posts nothing. On run `feat_invoices_3`, planning converged at 10:55Z and the reviews ran after 11:10Z, all silent on GitHub. The only progress signal is the flow-progress ledger commits on the branch, which a reviewer has to dig for. §5 has no phase events, and its "budget is silent" rule keeps chained continuations quiet on purpose.
- **Suggestion (operator, 2026-10-02):** post a thin, few-word comment on the PR (see item 4, which has the PR exist from the start) when the run crosses a main phase boundary. For example:
  - `Planning phase started.`
  - `Plan converged. Implementation phase follows.`
  - `Implementation done. Branch review started.`
  - `Branch review completed (findings fixed). Doing the remaining phases; will finish with the branch ready for review.`
  - `Done. Branch ready to be reviewed.`: the existing `completed` comment.

  A user-review round would get the equivalent: fix plan, fix implementation, branch review, Done.
- **Open points for the planning session to decide:**
  - **Source of truth:** derive the events from the ledger's top-level phase ticks (P1, A, B/C, the rest) the job already commits, so no new state is needed. Post from the job when it pushes a tick (`report` already posts lifecycle comments).
  - **Volume:** one comment per boundary, or **one status comment edited in place** (a checklist that ticks over). Editing keeps the PR conversation short and sends one notification instead of five. Which one also decides whether the phase lines need the hidden marker and a distinct `event=`.
  - **Granularity (decided, operator 2026-10-02):** only the four big phases: **planning**, **implementation**, **branch review**, and **Done**. Branch review covers every end-of-branch review together with the implementation of their fixes; its comment is posted once all of that is through. Nothing is posted for sub-steps (A2g, Bm, C2g/C2m/C2f, the Run gates on their own, and so on), or for chained budget continuations.
  - **Labels:** unchanged (`sdlc-harness: running` throughout). Progress is comment-only.
  - **Opt-out:** a config switch (for example `forge.progressComments`), default on or off.
  - **Docs and tests:** a §5 table row, and a Gate 12 (xiv) leg that checks them.

---

## C. Open questions for this plan to decide

### Item 1 — No read-only `@sdlc-harness status` comment command — Low

- **What:** The comment commands are `answer`, `pause`, `resume`, `stop`, `clear`. Someone working a run from GitHub alone cannot ask for its state in a comment; `@sdlc-harness status` is refused as an unknown verb. The only status route is the local `/autonomous-sdlc-harness:branch-status`, which contradicts "work a run from GitHub with nothing installed".
- **Evidence:** `docs/github-run-control.md` §1 table and the unknown-verb reply; `cli/src/remote/githubActions.ts` `COMMAND_HANDLE`. Round 6 legs (a) and (e) record the actual reply, on the issue and on the pull request.
- **Expected:** A `status` verb that replies with the run's state, the current phase from the flow-progress ledger, open questions and the latest run URL, and changes nothing (no label change, no dispatch).
- **Fix:** Add `status` to `control` in `remote-run.sh` and to the verb list, docs and refusal text.

### Item 10 — Answering a park needs the exact `@sdlc-harness answer <n>` form — Low (open question, for the planning session to decide)

- **What:** to answer a park, the user has to remember and type `@sdlc-harness answer <n>` exactly, with the handle, the verb and the question's index, and put the answer on the following lines. The index can be left out only when exactly one question is open. A reader naturally just *replies* to the question comment instead. Observed on issue #8 (park 1) and PR #9 (park 2): each question comment ends with the required form, which the user has to copy.
- **The constraint:** issue and PR conversation comments have **no threads** (§1, §3). GitHub's *Quote reply* only prepends a `> …` block of the quoted text to a new comment, and today a comment starting with `>` is deliberately never a command (§1 *Never a command*).
- **Options:**
  - **(a) Quote-reply maps to the question.** A new comment from an authorised user that opens with a `>` quote of text from one open question's comment is that question's answer, and the text after the quote is the answer. Match the quoted lines against each open question comment's body, or against a short unique token the comment carries, such as `Question 2 — feat_invoices_3`. Risks: partial or ambiguous quotes, a quote of an old or archived question, quoting in ordinary discussion being taken as an answer, and the hidden-marker rule.
  - **(b) Any plain comment while exactly one question is open.** An authorised user's next comment without the handle, while the run is `parked` with one open question, is the answer. Risk: high. Any discussion comment on the PR or issue would be sent to the run as an answer.
  - **(c) Real threads on the PR.** Post each question as a PR **review comment** (on the diff, or on a file such as the round file), whose replies are threaded. Listen to `pull_request_review_comment: created` with `in_reply_to_id` equal to the question comment, which is an exact mapping. Issues still have no threads, so on an issue the current form stays. This adds a new event, and §2 deliberately does not listen to `pull_request_review_comment`, which a round's per-comment events would also fire.
  - **(d) Keep the current form, lower the cost.** Accept `@sdlc-harness answer` without `<n>` whenever one question is open (already the case), and make the question comment's last line a ready-to-copy block for the reply. Optionally accept a short alias such as `@sdlc-harness <n>: <answer>`.
- **Operator's position (2026-10-02):** prefer a reply mapping to the question if it can be made safe. If (a) or (c) is tricky or risky, keep the current behaviour, (d).

---

## Acceptance criteria

- **Item 7:**
  - A `gh`-stub suite case in job mode: park → `resume answer` → pause exit → `resume pause` → completed session (rc 0, ledger complete). It ends `completed`, archives the answered pair, and `deliver` opens the PR.
  - The same with a budget pause and a usage pause in place of the user pause.
  - A stop and resume in place of the pause.
  - A `parked` exit with no unanswered question is never reported as a question-less "waiting for an answer" comment.
- **Item 5:** suite cases for issue closed, PR closed, PR merged and branch deleted. Each stops a running run, posts `stopped` with the reason, sets the label, and keeps the workflow runs and artifacts. A close by an actor failing the §6 check is ignored with a log line. A completed run is left alone. `harness-resume.yml` and the automatic resume skip a branch absent on `origin`.
- **Item 2:** a refused command's control job concludes `success` (or neutral), and a real failure still fails. Covered by a suite case.
- **Item 3:** a posted question comment carries one answer instruction, the GitHub one.
- **Item 8:** the issue links the PR on GitHub (timeline or Development panel). If no mechanism works with the job token, the docs and Gate 12 (xiv) leg (d) say what is linked instead, and a §8 row records the measured behaviour.
- **Item 9:** a `harness-run.yml` dispatch whose ref is not its `branch` input fails fast and names the right ref, or is found by the lookups anyway. Covered by a suite case.
- **Item 11:** after `stop`, every command reply names the state `stopped`.
- **Item 12:** a resume after a stop, and a new round or engine, never hand the session another engine's or round's pause note.
- **Item 4:** the draft PR opens with the run, and the draft state follows the run (draft while working, ready on `completed`, back to draft for a round). `completed` is posted on the PR and on the source issue. The §5 target rule and table are rewritten to match.
- **Item 13:** at a round's `completed`, every collected inline thread whose finding was implemented gets a reply naming the commit and is resolved. Threads for invalid or out-of-scope findings get the reason and stay open. The review state is never dismissed.
- **Item 6:** one short comment per main phase (planning, implementation, branch review, done) on the PR, in the volume the plan decides, with sub-steps and budget continuations silent.
- **Items 1 and 10:** the plan's decision is implemented and documented. If the decision is "not now", the reason is in `docs/github-run-control.md`.
- **Docs and tests:**
  - `docs/github-run-control.md` (§1–§5, §8) and `docs/remote-execution.md` state the new behaviour.
  - The `remote-run.sh` and `harness-control.yml` header paragraphs match it.
  - Gate 12 → (xiv) in `docs/development.md` gains or changes the legs these items need: leg (d) without a workaround, close/delete stops, `isDraft` at each transition, resolved threads, phase comments.
  - Every new behaviour that rests on an unverified GitHub fact gets a §8 row.
  - The full test suite passes.
