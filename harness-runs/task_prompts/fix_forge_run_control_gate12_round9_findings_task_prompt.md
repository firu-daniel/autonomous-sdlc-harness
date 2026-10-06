# Gate 12 — Round 9 issues

Round 9: observations (xiv) run control and (xv) run-actor allow-list, against CLI 0.6.3, on `firu-daniel/harness-gate12` (2026-10-06).
Severity: **High** blocks a leg or loses data · **Medium** wrong behaviour with a workaround · **Low** friction, docs, UX.

| # | Severity | Area | Title | Status |
|---|---|---|---|---|
| 1 | Medium | run lifecycle | A branch deleted while its job runs is pushed back by the cancelled job's `Push the branch` post-step | Open (found on round 8 evidence; reproduced on 0.6.3) |
| 2 | Low | run control | An accepted `pause` that a park overtakes gets no `paused` comment, though the reply promised one | Open |
| 3 | Medium | run lifecycle | A branch deletion leaves the run's open pull request (closed by GitHub) reading `running`, with no `stopped` comment | Open |
| 4 | Low | poller | `harness-resume.yml` (`active`, `*/30` cron) never ticked on its schedule after the adoption push | Open — observation, cause unknown |

Dropped after review: the GitHub notifications every checkpoint push sends the PR's subscribers once the PR opens at the start. The operator accepts them, and batching commits or pushes would risk losing work when a job dies unexpectedly. The repeated `chore: Add flow-progress ledger` / `chore: Flow progress R<n>` messages on `feat_invoices_7` are not duplicates: one ledger per engine start (the task run and rounds 1–5, six), and one set of R ticks per review round.

---

## 1. A deleted branch is re-created by the cancelled job — Medium

- **What:** Round 8, (xiv) leg (h) "delete branch". The owner deleted `feat_invoices_5` at 04:22:43Z (`DeleteEvent` 04:22:44Z) while run `37413360932` ran. The control job posted `stopped` ("…its branch was deleted, so the run cannot be resumed") and cancelled the run. The cancelled job's `Push the branch` step then ran anyway and pushed the branch back to origin: `2026-10-06T04:23:10Z  * [new branch]      feat_invoices_5 -> feat_invoices_5` / `push-branch.sh: pushed feat_invoices_5 to origin`. Found at the start of round 9: `git ls-remote origin` lists `refs/heads/feat_invoices_5` at `4d73134`.
- **Reproduced in round 9 on 0.6.3:** (xiv) leg (h). `feat_invoices_7` was deleted at 16:58:39Z (tip `2654caa`) while round 5's run `37499726150` ran. The deletion's job stopped the run, and the cancelled job's push step logged `16:59:55 push-branch.sh: pushed feat_invoices_7 to origin`, re-creating the branch at `cb85dbb`. A hand-started poller tick (`37500235549`) still skipped it as stopped (`a 'harness stop' run is newer than its newest 'harness run' run`), so no run was re-dispatched.
- **Why round 8 missed it:** (h)'s pass conditions read the `stopped` comment, the label, the `harness stop` run under `main` and "no `harness run <slug>` follows", but not that the branch stays deleted.
- **Cause:** `harness-run.yml` (0.6.3 template, line 566–568): `- name: Push the branch` / `if: always() && env.SCRIPTS_DIR != ''` / `run: bash "$SCRIPTS_DIR/push-branch.sh"`. The step runs on cancellation, and `push-branch.sh` does not check whether the remote branch still exists or whether the run was stopped because the branch was deleted. The job knew: its own stop path set `HARNESS_STOPPED=1` earlier in the job.
- **Effect:** the operator's delete is silently undone; a branch the `stopped` comment says "cannot be resumed" exists again with the run's ledger, so `@sdlc-harness resume` can find it again.
- **Knock-on, observed in round 9 (2026-10-06 14:34Z):** with the round-9 `harness-control.yml` on `main`, the operator deleted the three leftover round-8 branches. For `feat_invoice_currency_symbol` and `feat_invoices_6` the `delete` jobs (`37480106946`, `37480096943`) logged `close ignored: the run on <branch> is already stopped`. For the re-created `feat_invoices_5`, job `37480095509` treated it as a live run: `control: close of feat_invoices_5: @firu-daniel deleted the branch`, `dispatched the action=stop marker` (harness-run `37480129676`, skipped), `stopped feat_invoices_5`, and posted a **second** `stopped` comment on closed issue #12 at 14:34:43Z ("…its branch was deleted, so the run cannot be resumed…"), re-applying `sdlc-harness: stopped` to #12 (14:34:44Z) and so re-creating that label 8 s after the operator had deleted it. So the re-pushed tip's state does not read as stopped, and the branch the first `stopped` comment called unresumable came back as a resumable, stoppable run.
- **Expected:** a run stopped by a branch deletion does not push the branch.
- **Suggested fix:** skip the push when the stop reason is the deletion (or, generally, when `git ls-remote --exit-code origin refs/heads/<branch>` finds no branch that the job's checkout had), or push only with `--force-with-lease=<branch>:<sha the job checked out>`, which fails on a deleted ref. Add "the branch stays deleted" to (h)'s pass condition.

## 2. An accepted pause that a park overtakes gets no `paused` comment — Low

- **What:** (xiv) leg (f). `@SDLC-HARNESS pause` at 15:54:47Z got "Pause requested by @firu-daniel; the run on `feat_invoices_7` yields at its next clean checkpoint, and **a paused comment follows**." The round-4 job dropped `PAUSE` at 15:55:50, but the fix-plan writer parked at 15:56:12 (park 2), and the run ended `parked`. No `paused` comment came, and after the answer the run simply resumed (`resumed` 16:27:36Z) — the pause request was consumed silently.
- **Expected:** either the reply's promise holds (the pause is honoured after the park is answered, or the park comment says the pending pause was folded into it), or the job notes on the PR that the pause was overtaken by a park.
- **Suggested fix:** when a job ends `parked` with a dropped `PAUSE` pending, add one line to the park comment ("The pause @<login> requested is folded into this park: the run waits for the answer.") — or keep the pause and post `paused` once the answer arrives. Low: the run did stop and wait, so nothing ran against the request.

## 3. A branch deletion leaves the run's open pull request `running` — Medium

- **What:** (xiv) leg (h). With round 5 running on PR #19, the owner deleted `feat_invoices_7` (16:58:39Z). GitHub closed #19 (16:58:40Z). The `pull_request` control job `37499935554` logged `control: close ignored: the branch \`feat_invoices_7\` of pull request #19 is gone from origin; the deletion's own job stops the run`. The deletion's job (`37499932629`) stopped the run and posted `stopped` on **issue #17** only, and labelled only #17. PR #19 is closed but still carries `sdlc-harness: running`, has no `stopped` comment, and its round-5 progress comment stays at "Fix plan: in progress".
- **Why round 8 did not see it:** round 8 closed its PR (#13) before deleting the branch, so the PR already read `stopped`. 0.6.3 opens a new draft when a run is resumed from its issue after its PR was closed (#19, `docs/github-run-control.md:280`), so the run's PR is open at the deletion.
- **Design text:** `docs/github-run-control.md` §5 table: `stopped` (closed or deleted) goes to "the item acted on: the closed pull request, else the target. For a deleted branch, the issue … The issue is labelled too" — the open PR the deletion closes is in neither branch of that rule.
- **Expected:** after a deletion, every open pull request of the run reads `sdlc-harness: stopped` (and gets the `stopped` line, or at least the label), and its progress comment is not left reading "in progress".
- **Suggested fix:** in the deletion's stop, also label (and comment on) the run's pull request found by head ref, including one GitHub has just closed; or let the `pull_request` closed job label its own PR `stopped` while deferring the stop itself to the deletion job.

## 4. `harness-resume.yml` never ticked on its schedule — Low (observation, cause unknown)

- **What:** after the adoption push (14:31Z) `gh workflow list --all` showed `harness-resume` `active` (record `370113793`, reused from round 8, whose file was deleted at round 8's teardown). Its `cron: '*/30 * * * *'` produced **no** scheduled run in ~2.5 h (the newest scheduled run is round 8's `37391037312`, 2026-10-05T23:53Z). A hand dispatch at 17:00:58Z ran fine.
- **Possible causes:** GitHub not re-registering the schedule of a workflow record that went `deleted` → `active` on the same path; or GitHub's best-effort schedule delays. Not a harness defect unless the former is confirmed; it does mean a round on the reset repository cannot rely on the poller's schedule.
- **To check next round:** after adoption, watch for the first `schedule` run within ~1 h; if none, record the record id and state, and whether a trivial edit/push of `harness-resume.yml` restores ticks.

---

## 5. Dated paragraph for `docs/development.md` (evidence, not an issue)

> The text below is round 9's record for `docs/development.md`. It goes after round 8's paragraphs, in the same form. It is **evidence of what was observed, not a finding to fix**: copy it in as written. Its findings list points back at the numbered issues 1–4 above, which are the work.

**Round 9 — 2026-10-06, CLI 0.6.3.** Scoped to observations (xiv), run control from GitHub, now with the draft pull request opened at the run's start, the progress comment and the review-thread replies, and (xv), the run-actor allow-list. Run by hand against `firu-daniel/harness-gate12` from its seed commit `2fb082a` (a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off). It was adopted with `npx autonomous-sdlc-harness@0.6.3 init --non-interactive`, then `config set execution.target github-actions`, `config set forge github` and a second `init`, which reported creating all four workflows (`4 created, 63 kept, 35 ensured`). `actionlint 1.7.12` reported nothing on them, and the adoption push started no run. `gh workflow list --all` listed all four by name, all `active`; `harness-resume.yml` came back `active` on its round-8 record, so no enable was needed. The pull-request setting already read `true`, left on by round 8, so this round recorded no switch. Before the setup, the operator deleted round 8's run branches and the trigger and state labels. The `delete` jobs that this fired exposed finding 1 (below). The job installed Claude Code `2.1.291`. No run daemon was registered (`daemon stop` found no unit), so nothing local took part. `firu-daniel` (admin) commented, `expause-admin` (write) submitted every review, and with no `HARNESS_GIT_TOKEN` set the pull request was authored by `app/github-actions`. The setup **passed** on its `doctor` lines:
- `PASS  forge` named both forge workflows and the six commands, and said a run opens a draft pull request when it starts.
- `remote-github` warned only that `HARNESS_PUSH_URL` is not set. It said `GitHub knows harness-trigger.yml and harness-control.yml, and the label `sdlc-harness` exists`, and `HARNESS_RUN_ACTORS admits firu-daniel, expause-admin`. It printed no pull-request-setting warning.

The task was the invoices task, with a closing section reserving two security limits to the product owner.

Leg (a) **passed**. Issue #17 was labelled at 14:37:14Z and got the trigger's comment naming `feat_invoices_7` and run `37480544952`. At 14:38:06Z, before the run parked, the issue got the `opened` comment naming draft pull request #18 and its URL. #18 read `isDraft` `true`, its body carried `Started from #17.` before the commands, and it carried `sdlc-harness: running`. The operator had deleted every state label before the setup, and the job's token created each one it needed: `running`, `parked`, `paused` and `done` in this run, and `stopped` already at 14:34:44Z, through the setup's `delete` job. #18 carried one progress comment, which was edited in place: its *Planning* line moved from `in progress` to `done` at 14:49:51Z. The task-plan writer parked at 14:39:40Z. The **pull request** got one comment with question 1 whole, the `@sdlc-harness answer 1` instruction and its copy block, and no `answer_<n>.md`; both items read `sdlc-harness: parked`.

Leg (b) **passed**. `@sdlc-harness answer 1` on the issue got `Answer to question 1 received from @firu-daniel; every open question is answered, so `feat_invoices_7` resumes.`, then `resumed` on the pull request (run `37480973152`), and `running`.

Leg (c) **passed on the task run**, so round 8's finding 1 was re-observed fixed. `@sdlc-harness pause` at 14:50:04Z got `Pause requested by @firu-daniel; …`. The job logged every control poll with its result (`exit 5` for "no pause") and a bound that overlapped the earlier polls. It found the marker run 29 s after its creation, logged `dropped PAUSE (reason user)` and `paused (PAUSE honored, reason user)`, and posted `paused` on the pull request. Both labels read `paused`, and `isDraft` stayed `true`. `@sdlc-harness resume` got `Resume requested by @firu-daniel: …`, then `resumed` (run `37482666928`) and `running`, and `isDraft` was still `true`.

Leg (d) **passed**. The run (c) resumed completed with no workaround: `completed — branch ready for review`, then `deliver: marked pull request #18 ready for review` and `completed on feat_invoices_7 reported on #18 and #17`. #18 read `isDraft` `false`, `headRefName` `feat_invoices_7` and `Started from #17.`. `completed` was posted on the pull request and on the issue, the issue's naming #18 and its URL. The progress comment read `done` on all four lines, and both items carried `sdlc-harness: done`. No `cross-referenced` event appeared, as expected with the job's token.

Leg (e) **passed**:
- A review requesting changes, with inline comments on `src/invoiceLimits.ts` line 48 and `src/invoiceText.ts` line 10, was placed by its own control job as `66fbd84 chore: add user review for feat_invoices_7`. The round file carried the body under `## Review by @expause-admin` with its provenance line, both inline comments with file, line, `Made on commit`, author link and hunk, and the marker `reviews=5430676448 comments=4197131039,4197131054`. The started-round comment read `Round 1 from pull request #18 … by @expause-admin`, and #18 was converted back to draft.
- The review body ("Two changes before this can go in") made both comments merge conditions, so the fix plan graded both Must Fix and implemented both. At the round's end #18 read `isDraft` `false`, and both threads read `isResolved: true` with the replies ``Addressed in `2dada49…`.`` and ``Addressed in `8af6a03…`.``, both commits on the branch. The review stayed `CHANGES_REQUESTED`, so none was dismissed. The round progress comment read `done` on *Fix plan*, *Fix implementation*, *Branch review* and *Done*.
- The other kind of thread was observed on round 3. An inline comment on `src/invoice.ts` line 28 asking for no change on this branch was left `isResolved: false`, with the reply `Not changed in this round: …`.

Leg (f) **passed**:
- `@sdlc-harness approve` got the reply listing the six commands, and its control run concluded `success`.
- `@sdlc-harness status` on the issue and on the pull request both said `A user-review round has started on `feat_invoices_7`, and its flow-progress ledger is not written yet.` with `Latest run:`, changed no label, and started no run.
- A bare `pause` and an *Approve* review each gave a `skipped` control run.
- A second review requesting changes, submitted while round 1 ran, was answered `your review was collected. … Nothing needs to be submitted again.`, and no second round commit appeared. Round 1's own `collect` placed it as `feat_invoices_7_review_2.md` on its first push. It logged `started the next round of feat_invoices_7 from @expause-admin`, and the started-round comment named `@expause-admin`.
- After round 2, a review started round 3, and three more, submitted back to back while it ran, were none refused. The second's and fourth's jobs answered "collected". The third's pending job was `cancelled` by the fourth's and posted nothing. **Round 3's own `collect`** placed `feat_invoices_7_review_4.md`, carrying all three bodies, each under its own `## Review by @expause-admin`, with the marker naming the three reviews, and started round 4. This condition, open since round 7, is observed.
- `@SDLC-HARNESS pause` on the issue passed the `if:` and got `Pause requested by @firu-daniel; …`. The job dropped `PAUSE`, but the user-review fix-plan writer parked first: text 2 conflicted with park 1's subtotal limit. No `paused` comment followed (finding 2). `@sdlc-harness answer 2`, typed **on the pull request**, got the received reply and `resumed`.
- The commenter without write access was not run, the repository being owned by a personal account.

Leg (g) **passed**:
- `@sdlc-harness stop` on the running job got `Stop requested by @firu-daniel; …` and a `stopped` comment reading `Stopped by @firu-daniel.` that says the draft pull request stays open. Both items moved to `sdlc-harness: stopped`, and the run was `cancelled`.
- `@sdlc-harness pause` on the stopped run was refused: `the run on `feat_invoices_7` is `stopped`. Comment `@sdlc-harness resume` …`.
- `@sdlc-harness resume` got the reply, then `resumed` and `running`. Since the stop had cancelled a running job, the resumed job logged `resumes after a job that did not pause for engine user_review (prev_status 'running', prev_engine 'user_review') — no pause note`, and no line named `PAUSE_PROGRESS.md`.

Leg (h) **passed** on its conditions, with two findings:
- **Issue close.** Closing the issue while the run ran put `Stopped because @firu-daniel closed issue #17.` on the pull request. Both items read `sdlc-harness: stopped`, and the run was `cancelled` with its `harness-state` artifact listed.
- **Pull request close.** After a resume, with `isDraft` `true`, closing #18 put `Stopped because @firu-daniel closed pull request #18.` on it. Both items read `stopped`, and the run was `cancelled` with its artifact listed. The close's control run read `event: pull_request`, `headBranch: feat_invoices_7`, and `headSha` the pull request's head, so this does not show which copy of the workflow ran.
- **Resume after the close.** Resuming from the issue opened a **new** draft pull request, #19, as `docs/github-run-control.md` §4 states. Round 4 then completed there. A review on #19 started round 5, so that the deletion could hit a running job.
- **Branch deletion.** The branch was deleted through the API during round 5. The issue got `its branch was deleted, so the run cannot be resumed`, and its label read `sdlc-harness: stopped`. A `harness stop feat_invoices_7` run was listed under `main`, and the running job was `cancelled`. Two things went wrong:
  - The cancelled job's push step re-created the branch (finding 1).
  - #19, closed by GitHub with its head deleted, kept `sdlc-harness: running` and got no `stopped` comment (finding 3).
- **The poller.** `harness-resume.yml` never ticked on its schedule this round (finding 4), so it was started by hand. It logged `feat_invoices_7 is stopped (a 'harness stop' run is newer than its newest 'harness run' run); skipped` and `no branch is waiting; disabled harness-resume.yml`. No `harness run feat_invoices_7` followed, even with the branch re-created, so the poller half is observed.
- The triage close was not run.

Leg (i) **passed**. A dispatch from `main` naming `feat_invoices_7` failed in `wrong-ref` with `this run was dispatched from 'main', but its branch input is 'feat_invoices_7': …`, and its `run` job was skipped.

Observation (xv) ran on the same repository. The setup **passed**: `HARNESS_RUN_ACTORS` was deleted (the variable list no longer named it), `HARNESS_SELF_PAUSE_AFTER_MINUTES` was set to `5`, and `expause-admin` held `write`. The owner labelled issue #20 (the invoices task without its open-decision section), which started `feat_invoices_8`. With the variable unset, every route of the second account was refused:
- **(a)** Its label on issue #22 got `No run started: @expause-admin is not the repository owner, and the repository variable HARNESS_RUN_ACTORS is unset, which admits the owner, @firu-daniel, alone.`. The label was removed and no run followed.
- **(b)** Its dispatch failed at `Refuse an actor not on HARNESS_RUN_ACTORS` with `@expause-admin dispatched or re-ran this run, … (docs/remote-execution.md, section 7 step 4, and section 11).`, and no later step ran. So round 8's finding 4 was re-observed fixed.
- **(c)** Its **Re-run all jobs** of the owner's first run and its **Re-run failed jobs** of the run the owner's stop ended were both refused at the gate, with `triggering_actor` `expause-admin`. The first re-run-all attempt was sent together with (b) and the failed-jobs re-run. Its `run` job was cancelled while pending in the branch's concurrency group, so it was repeated alone, and attempt 3 failed at the gate.
- **(c′)** Its re-runs of the owner's trigger run and the owner's `stop` control run read `actor` `firu-daniel` and `triggering_actor` `expause-admin`. Each posted a refusal naming `@expause-admin` as the re-runner and `HARNESS_RUN_ACTORS`, and no run followed.
- **(d)** Its `@sdlc-harness status` reply named `HARNESS_RUN_ACTORS`.

The admissions held:
- **(e)** The first job self-paused at 300 s (`reason budget`), and its `continue` step logged `dispatched action=run engine=task resume=pause`. The chained run `37501358156` named `github-actions[bot]` as both actors, and its gate logged `@github-actions[bot] passes: every harness dispatch is made with GITHUB_TOKEN and names it.`.
- **(g)** The owner's own dispatch logged `@firu-daniel passes: HARNESS_RUN_ACTORS is unset, which admits the owner of this user-owned repository alone.`.
- **(h)** With the variable set to `*`, the second account's label on issue #23 started `feat_invoice_currency_symbol_2` (run `37502346254`, both actors `github-actions[bot]`), which opened draft pull request #24. The owner's `stop` 37 s after "Started", after the `open` step's push, was accepted. Round 8's finding 5 was not met at that point; a stop in the first ~20 s was not re-tested.
- **(f)** The poller's dispatch was **not observed**, since no usage pause occurred.

The findings:

1. A branch deleted while its job runs is pushed back by the cancelled job's `Push the branch` step, which runs `if: always()`. It was found in round 8's evidence (`feat_invoices_5` re-created 27 s after its deletion) and reproduced in leg (h). A later deletion of the re-created branch was then handled as a live run: a second `stopped` comment was posted on round 8's closed issue.
2. An accepted `pause` that a park overtakes gets no `paused` comment, though the reply promised one.
3. Deleting a run's branch while its pull request is open leaves that pull request, which GitHub closes, reading `sdlc-harness: running`, with no `stopped` comment and its progress comment in progress. Its own `pull_request` job defers to the deletion's job, which reports on the issue only.
4. `harness-resume.yml`, `active` on a record reused from round 8, never ticked on its 30-minute schedule. The cause is not known.

All four are carried to `fix_forge_run_control_gate12_round9_findings`.

The round's teardown kept its GitHub evidence: issues #17, #20, #22 and #23, pull requests #18, #19, #21 and #24, branches `feat_invoices_7` (re-created by finding 1), `feat_invoices_8` and `feat_invoice_currency_symbol_2`, and every run with its artifact until retention expires. It deleted the two variables and reset `main` to the seed. `harness-resume.yml` was left `disabled_manually` by the hand tick. The next round enables it after its adoption push if it comes back so, and watches for a first scheduled tick.

What still owes a first recording:
- (v)'s enable and its in-progress artifact listing.
- (vii), (ix) and (x).
- (xii)'s last leg on a real release after the one under test.
- (xiii)'s machine-off condition and its leg (b) refusal.
- From (xiv): leg (h)'s merge-commit copy of the workflow; the triage refusal and triage close, not runnable on a repository owned by a personal account.
- From (xv): leg (f)'s poller dispatch.
- The rest of `docs/github-run-control.md` → `## 8.`.
