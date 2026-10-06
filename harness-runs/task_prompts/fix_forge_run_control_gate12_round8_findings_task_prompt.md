# Gate 12 — Round 8 issues

Round 8: observations (xiv) run control and (xv) run-actor allow-list, against CLI 0.6.2, on `firu-daniel/harness-gate12` (2026-10-05).
Severity: **High** blocks a leg or loses data · **Medium** wrong behaviour with a workaround · **Low** friction, docs, UX.

| # | Severity | Area | Title | Status |
|---|---|---|---|---|
| 1 | **High** | run control | `@sdlc-harness pause` accepted and its marker run created, but the running job never paused | Open — cause not confirmed; a retry on round 1 paused fine |
| 2 | Medium | review rounds | `collect` gives up on a transient push rejection, and names it `origin/<branch> is not HEAD` | Open (worked around by re-running `collect`) |
| 3 | Medium | run lifecycle | A run job GitHub never starts leaves both items `running` with no comment, and `collect` waits for an end that never comes | Open |
| 4 | Low | allow-list | The gate's `::error::` cites `docs/remote-execution.md, section 9`; the allow-list lives in §7 step 4 and §11 | Open |
| 5 | Medium | run control | A stop in a run's first minutes is refused: "not a harness branch: its tip carries no flow-progress ledger" | Open |
| 6 | Medium | remote resilience | GitHub-side failures and delays (no runner, slow queue, transient push errors, lagging listings) are not detected, retried or reported: an umbrella over #1–#3 and #5 | Open |

---

## 1. A pause request the job never saw — High

- **What:** (xiv) leg (c). `@sdlc-harness pause` on #12 at 18:13:46Z; control `37354370026` replied "Pause requested … a paused comment follows" and dispatched `harness pause feat_invoices_5` (`37354393247`, created 18:14:01Z, skipped as designed). Job `37352762524` (running since 18:01:07Z) never logged `dropped PAUSE`, never logged `the control poll … failed`, and ran to completion at 18:36:07Z, opening PR #13. The promised `paused` comment never came; the issue went `running` → `done`.
- **Evidence:** job log has only `job: resuming parked run …` then `run 'feat_invoices_5' completed`. Bundle `status.json` `control_polled_at: 1791225327` (18:35:27Z): polls kept succeeding with rc 0/1 and advancing the bound. Run on this machine afterwards, the same verb with the job's own start bound finds the run: `bash scripts/remote-run.sh pause-requested feat_invoices_5 1791223257` → rc 0. The watcher's poll output goes to `watcher.log`, which the `harness-state` bundle does not carry, so the poll results themselves are lost.
- **Likely causes (not confirmed):**
  1. *Bound advances past a run the listing does not show yet.* `job_control_poll` sets `control_polled_at` to the epoch taken just before each query. `gh run list --workflow … --branch …` is eventually consistent: a poll that runs in the seconds after the run's `createdAt`, before the listing shows it, moves the bound past it, and every later poll filters it out (`createdAt >= since`). Round 7 saw its pause 45s after the marker; this round's poll fell in the window.
  2. *`EXIT_NO_PAUSE` = `EXIT_USAGE` = 1.* The watcher treats exit 1 as "no pause" and advances the bound, so any usage refusal in `remote-run.sh pause-requested` would silently drop a pause the same way.
- **Expected:** a pause accepted by the control job is honoured at the next clean checkpoint.
- **Suggested fix:** overlap the bound (advance it to `before - N` with N ≥ a few minutes, or keep it at the last *seen* marker's `createdAt`; "seeing one twice is harmless" already holds); give `pause-requested`'s no-match a distinct exit code from usage errors; log each poll's one-line result to the job log (or bundle `watcher.log`) so a missed pause can be diagnosed.

## 2. `collect` gives up on a transient push rejection — Medium

- **What:** (xiv) leg (f). Round 1 (run `37359313663`) finished 19:04:52Z; its `collect` job committed the second review as `93a632b chore: add user review for feat_invoices_5` (`feat_invoices_5_review_2.md`), but the push was refused server-side: `remote: fatal error in commit_refs` / `! [remote rejected] feat_invoices_5 -> feat_invoices_5 (failure)`. `push-branch.sh: push failed`, then `remote-run.sh: review of 'feat_invoices_5' failed at pushing feat_invoices_5 (origin/feat_invoices_5 is not HEAD); nothing was dispatched`, `collect: review exited 4; the pull request was told, and nothing is retried`. PR comment 19:05:29Z: "…could not start the next round: … (origin/feat_invoices_5 is not HEAD); nothing was dispatched. They stay on the pull request; submit a review requesting changes to retry."
- **Evidence:** job log of `37359313663` → `collect`; githubstatus.com showed no Git Operations incident (transient). The branch tip was `44fcc26`, unchanged, and nothing else pushed in the window.
- **Expected:** a transient push failure is retried (a few attempts with backoff) before the round is given up; the reason names the rejection, not a moved remote.
- **Suggested fix:** retry `push-branch.sh` in `review`/`collect` on a non-fast-forward-free rejection (`remote rejected … (failure)`, HTTP 5xx), re-fetching first; distinguish "remote moved" from "push refused" in the message; consider having the PR comment offer "re-run the `collect` job" as the retry, which needs no new review.
- **Workaround used:** `gh run rerun 37359313663 --job <collect>` as the owner, 19:06:25Z.

## 3. A run job that never starts is invisible on the issue and the PR — Medium

- **What:** during GitHub's 2026-10-05 runner-assignment incident (from 19:11:58Z), round 4's run `37363550384` (dispatched 19:27:51Z by the control job that placed the round) had its `run` job cancelled at 19:42:57Z with "The job was not acquired by Runner of type hosted even after multiple attempts". No step ran, so neither the job's `failed` report nor `Notify a cancelled job` ran. Its `collect` then read the state as `paused (killed)` and logged "that run's own end collects", which cannot happen. #12 and #13 stayed `sdlc-harness: running`, with no comment.
- **Expected:** a run that ended without its job ever running is reported, as `failed` or as `stopped`, with a `resume` hint; the labels leave `running`; `collect` does not wait for a job that is gone.
- **Suggested fix:** in `collect` (which does run, after `run`), when the `run` job's conclusion is `cancelled`/`failure` and no bundle was uploaded and no stop marker exists, post `failed` ("the job never started: <annotation>") and relabel; add the same check to the `harness-resume.yml` poller sweep. Since the infra event is outside the harness, this is about surfacing it, not preventing it.

**Follow-on effects (2026-10-06).** A job that never started writes no bundle, and that breaks both recovery paths:
- The scheduled poller (`37391037312`) could not download the bundle of `37363550384`. It skipped `feat_invoices_5` and disabled `harness-resume.yml`, because "no branch is waiting".
- `@sdlc-harness resume` was refused: "the run … records no engine, and the harness does not guess one".

Only the Run workflow form recovers the run. Two possible fixes: record the engine at dispatch time (for example in the run name, or in the comment that started the run), or have the run's end, or `collect`, notice a `run` job that was cancelled without starting and mark the items `failed` with a comment.

## 4. The allow-list refusal points at the wrong section — Low

The `run`/`collect` gate's `::error::` ends "(docs/remote-execution.md, section 9)". At v0.6.2, §9 is *Credentials and billing* and only mentions the variable. The variable is set up in §7 step 4 (*Every secret and variable*) and described in §11 *Security* → *Who can spend the credential*. Seen in (xv)(b), (c) and (c′), e.g. run `37414830050`. Fix: point at §7 (step 4), or at §11.

## 5. A stop in a run's first minutes is refused as "not a harness branch" — Medium

(xv)(h): the trigger said "Started a harness run on the branch `feat_invoice_currency_symbol`" at 04:46:41Z, and run `37415300051` was in progress. At 04:46:59Z the owner's `@sdlc-harness stop` was refused: "`feat_invoice_currency_symbol` is not a harness branch: its tip carries no flow-progress ledger. Only a branch a harness run works on can be commanded." The run went on to park at 04:48:44Z. The control job decides "harness branch" from the ledger on the branch tip, and the run job has not pushed it yet. So for the first minute or two a run the harness itself started, and announced on the issue, cannot be stopped or paused from GitHub, and the refusal wrongly tells the owner it is not a harness run. Fix: treat a branch as a harness branch when a `harness run <branch>` run is queued or in progress (or when the issue carries the `started` marker for it). Alternatively, push the ledger before the trigger reports "Started".

## Incident attribution

GitHub's "Incident with Actions" (https://stspg.io/c11dc9nb1zdq) ran from 2026-10-05T19:11:58Z, when it was declared, to 22:49:42Z, when it was resolved. It delayed the assignment of GitHub-hosted runners. "Declared" is when the status page posted, so degradation may have started a little earlier.

| # | When | Incident's part | Verdict |
|---|---|---|---|
| 1 | 18:13Z | None visible: 58 min before the declaration, and the job was running, so runner assignment was not involved. The retry at 18:43Z worked. | **Genuine, cause unconfirmed.** The suspects (the poll bound racing an eventually-consistent run listing; exit 1 meaning both usage and no-pause) are harness logic. |
| 2 | 19:05Z | Possible: a server-side `fatal error in commit_refs` 7 min before the declaration. GitHub showed no Git Operations incident. | **The trigger may be GitHub's; the handling is genuine.** A transient rejection gets no retry and is misnamed "`origin/<branch>` is not HEAD". |
| 3 | 19:27–19:42Z | **Caused it**: the job was "not acquired by Runner of type hosted even after multiple attempts". | **The trigger is GitHub's; the handling is genuine.** There was no comment, the labels stayed `running`, the poller skipped the branch (no bundle) and disabled itself, and `resume` was refused (no engine on record). |
| 4 | — | None: a static string in `harness-run.yml`. | **Genuine.** |
| 5 | 04:47Z (2026-10-06) | None: 6 h after resolution, and the run started within seconds. | **Genuine.** A race between the trigger's "Started" and the job's first ledger push. |

None of the five is an artifact of the incident alone. #2 and #3 would not have shown up on a healthy day, but the gaps they exposed are real, which is what #6 is about.

## 6. GitHub-side failures and timing are neither detected nor survived — Medium

- **What:** The run-control chain assumes GitHub delivers promptly and consistently: a dispatched job gets a runner, a push lands, and a just-created run is listed. This round broke each assumption at least once:
  - Runner waits of 6 min (run `37359313663`), 10 min (`collect` of round 3) and never (run `37363550384`, cancelled after ~15 min).
  - A transient push rejection (#2).
  - A `pause` marker run the running job's poll apparently never saw (#1).
  - A ledger not yet on the branch when a `stop` arrived (#5).
  
  Each time, the harness either went quiet (labels stuck at `running`, no comment) or gave a misleading reason ("not HEAD", "not a harness branch", "records no engine").
- **Expected:** A remote job's failure to start, or to finish its bookkeeping, is noticed by something that does run, and reported on the issue or PR in plain terms. A transient GitHub error is retried before a round is given up. Every recovery path (`resume`, the poller, the form) works even when the failed job left no bundle.
- **Suggested fixes:**
  1. **Watchdog for runs that never start.** In `collect` (which already waits on the run), in the poller, or in a cheap scheduled check: find a `harness run <branch>` run whose `run` job ended `cancelled` or `failure` with no steps run (or `steps[0]` never started), post "GitHub did not start the job (<reason>); comment `@sdlc-harness resume` to retry", and set the labels to `failed`.
  2. **Record what a resume needs outside the bundle.** Write the engine and resume mode into the dispatch itself (run name, or the `started`/`resumed` comment marker) so that `resume` and the poller can recover a run whose job never ran.
  3. **Retry transient GitHub errors** in `push-branch.sh`, `gh` API calls and dispatches: a few attempts with backoff on 5xx, `remote rejected … (failure)` and rate limits. Keep "remote moved" and "push refused" apart in messages.
  4. **Tolerate eventual consistency.** Overlap the control poll's `since` bound (re-query a window before the last poll), and treat "a `harness run` for this branch is queued or in progress" as proof of a harness branch (#5).
  5. **Queue-time awareness.** Log how long the job waited for a runner (from `run_started_at` and `created_at`). Subtract it from the time budget, which already happens through `HARNESS_JOB_STARTED_EPOCH`. Mention a long wait in the `resumed`/`started` comment so users know why nothing moved.
  6. **Keep the poller from disabling itself on an unreadable run.** "Bundle cannot be downloaded" should count as *waiting* (or *failed*, reported), not as "no branch is waiting".
- **Evidence:** runs `37359313663`, `37362249665`, `37363550384` and `37391037312` (poll), `37411953464` (refused `resume`), `37415300051` (#5). Timeline in `steps-round8.md` → *infra* rows.

---

## Dated paragraph for `docs/development.md` (evidence, not an issue)

> The text below is round 8's record for `docs/development.md`. It goes after round 7's paragraphs, in the same form. It is **evidence of what was observed, not a finding to fix**: copy it in as written. Its findings list points back at the numbered issues above, which are the work.

**Round 8 — 2026-10-05 to 2026-10-06, CLI 0.6.2.** Scoped to observations (xiv), run control from GitHub, on the unpatched `harness-control.yml`, and (xv), the run-actor allow-list. Run by hand against `firu-daniel/harness-gate12` from its seed commit `2fb082a` (a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off). It was adopted with `npx autonomous-sdlc-harness@0.6.2 init --non-interactive`, then `config set execution.target github-actions`, `config set forge github` and a second `init`, which reported creating all four workflows. `actionlint 1.7.12` reported nothing on them, and the adoption push started no `harness-control.yml` run, so round 7's finding 1 was re-observed fixed. `gh workflow list --all` listed all four by name. `sdlc-harness` was created. The operator set `HARNESS_RUN_ACTORS` to `firu-daniel,expause-admin` and switched `can_approve_pull_request_reviews` on (it read `false`, then `true`). The job installed Claude Code `2.1.291`. No run daemon was registered (`daemon stop` found no unit), so nothing local took part. `firu-daniel` (admin) commented, `expause-admin` (write) submitted every review, and with no `HARNESS_GIT_TOKEN` set the pull request was authored by `app/github-actions`. The setup **passed** on its `doctor` lines:
- `PASS  forge` named both forge workflows and the six commands.
- `remote-github` warned only that `HARNESS_PUSH_URL` is not set. It said `GitHub knows harness-trigger.yml and harness-control.yml, and the label `sdlc-harness` exists`, and `HARNESS_RUN_ACTORS admits firu-daniel, expause-admin`.
- Before the variable was set, a new 0.6.2 line warned that `expause-admin can write to the repository without being on HARNESS_RUN_ACTORS`.

The task was the invoices task, with a closing section reserving two security limits to the product owner. GitHub's "Incident with Actions" (runner assignment delayed) was declared at 2026-10-05T19:11:58Z and resolved at 22:49:42Z. It interrupted leg (f), and the round resumed at 04:04Z on 2026-10-06.

Leg (a) **passed**. Issue #12 was labelled at 17:57:39Z and got the trigger's comment naming `feat_invoices_5` and run `37352378621`; the label moved to `sdlc-harness: running`. The task-plan writer parked at 17:59:57Z. The issue got one comment with question 1 whole, the `@sdlc-harness answer 1` instruction and its copy block, and `sdlc-harness: parked`.

Leg (b) **passed on the shipped file**. `@sdlc-harness answer 1` got `Answer to question 1 received from @firu-daniel; every open question is answered, so `feat_invoices_5` resumes.`, then `resumed` (run `37352762524`) and `running`.

Leg (c) **passed on its second attempt only**:
- First attempt: on the task run, `@sdlc-harness pause` at 18:13:46Z got `Pause requested by @firu-daniel; …`, and its `harness pause` marker run was created. But the running job never yielded, and it ran on to completion at 18:36:07Z (finding 1).
- Second attempt, on user-review round 1's job `37357894012`: the job logged `dropped PAUSE (reason user)` and `paused (PAUSE honored, reason user)`. `paused` and the label followed. `@sdlc-harness resume` got the reply, then `resumed` and `running`.

Leg (d) **passed**. The run logged `completed — branch ready for review` and `deliver: opened pull request #13`. `isDraft` was `true`, the body carried `Started from #12.` and the six commands, the issue's `completed` comment named the pull request, and both items carried `sdlc-harness: done`. No `cross-referenced` event appeared, as expected with the job's token.

Leg (e) **passed**. A review requesting changes, with inline comments on `src/invoice.ts` line 11 and `src/render.ts` line 31, was placed by its own control job as `6c8db24 chore: add user review for feat_invoices_5`. The round file carried the body under `## Review by @expause-admin` with its provenance line, both inline comments in full, and the marker `reviews=5419061474 comments=4187494607,4187494614`.

Leg (f) **passed**, with one workaround on the way:
- `@sdlc-harness approve` got the reply listing the six commands.
- `@sdlc-harness status` on the issue and on the pull request both said `A user-review round has started on `feat_invoices_5`, and its flow-progress ledger is not written yet.` and changed no label, so round 7's finding 2 was re-observed fixed.
- A bare `pause` and an *Approve* review each gave a `skipped` control run.
- A second review, submitted while round 1 ran, was answered `your review was collected.`, and no second round commit appeared. Round 1's `collect` committed it, but its push was refused with `remote: fatal error in commit_refs` and reported as `origin/feat_invoices_5 is not HEAD` (finding 2). Re-running the `collect` job placed it as `feat_invoices_5_review_2.md` and started round 2.
- Three reviews submitted back to back while round 3 ran were none refused. The second review's job answered "collected". The third review's job got no runner until 19:27:37Z, during the incident. It then placed round 4 (`cec46a7`), whose round file carries all three reviews' bodies, each under its own `## Review by @expause-admin`. The fourth review's pending job was `cancelled` and posted nothing. So the three-reviews-in-one-round condition was **observed** this round, by the late review job rather than by round 3's `collect`, which was cancelled in the queue.
- Round 4's own `run` job was "not acquired by Runner of type hosted even after multiple attempts" and cancelled. The issue and the pull request were left reading `sdlc-harness: running`, with no comment. The scheduled poller could not download a bundle for that run, skipped the branch and disabled `harness-resume.yml`. After the incident, `@sdlc-harness resume` was refused with `the run on `feat_invoices_5` (`paused`, `killed`) records no engine`, and round 4 was restarted through the Run workflow form (finding 3).
- `@SDLC-HARNESS pause` on the issue passed the `if:`, got `Pause requested by @firu-daniel; …`, and the job paused (reason `user`) four minutes later.
- The commenter without write access was not run, the repository being owned by a personal account.

Leg (g) **passed**:
- `@sdlc-harness stop` got `Stop requested by @firu-daniel; …` and a `stopped` comment reading `Stopped by @firu-daniel.`. Both items moved to `sdlc-harness: stopped`.
- `@sdlc-harness pause` on the stopped run was refused: `the run on `feat_invoices_5` is `stopped``.
- `@sdlc-harness resume` got the reply, then `resumed` and `running`.
- The stop had landed on a run already paused by leg (f), whose bundle read `status: paused`. That resume therefore correctly kept the pause note, and it logged no stop/kill line. The stop/kill line was observed on the next resume, after leg (h)'s issue close cancelled a running job: `resumes after a job that did not pause for engine user_review (prev_status 'running', …) — no pause note`, with the carried `PAUSE_PROGRESS.md` moved aside and no line naming it as a note to read.

Leg (h) **passed**, and round 7's finding 3 was not reproduced:
- **Issue close.** Closing the issue while the run ran put `Stopped because @firu-daniel closed issue #12.` on the pull request. Both items read `sdlc-harness: stopped`, and the run was `cancelled` with its `harness-state` artifact listed.
- **Pull request close.** After a resume, closing the pull request put `Stopped because @firu-daniel closed pull request #13.` on it. Both items read `stopped`, and the run was `cancelled`. The close's control run read `event: pull_request`, `headBranch: feat_invoices_5`, and `headSha` the branch head, which does not show which copy of the workflow ran.
- **Branch deletion.** After a further resume, whose `resumed` went to the issue with the pull request closed, the branch was deleted through the API. The issue got `its branch was deleted, so the run cannot be resumed`, and its label read `sdlc-harness: stopped`. A `harness stop feat_invoices_5` run was listed under `main`, the running job was `cancelled`, and no run followed. Because `harness-resume.yml` was still disabled, the poller's not re-dispatching was not exercised.
- The triage close was not run.

Leg (i) **passed**. A dispatch from `main` naming the deleted `feat_invoices_5` failed in `wrong-ref` with `this run was dispatched from 'main', but its branch input is 'feat_invoices_5': …`, and its `run` job was skipped.

Observation (xv) ran on the same repository. The setup **passed**: `HARNESS_RUN_ACTORS` was deleted (the variable list no longer named it), `HARNESS_SELF_PAUSE_AFTER_MINUTES` was set to `5`, and `expause-admin` held `write`. The owner labelled issue #14 (the invoices task without its open-decision section), which started `feat_invoices_6`. With the variable unset, every route of the second account was refused:
- **(a)** Its label on issue #15 got `No run started: @expause-admin is not the repository owner, and the repository variable HARNESS_RUN_ACTORS is unset, which admits the owner, @firu-daniel, alone.`. The label was removed and no run followed.
- **(b)** Its dispatch failed at `Refuse an actor not on HARNESS_RUN_ACTORS` with `@expause-admin dispatched or re-ran this run, and the repository variable HARNESS_RUN_ACTORS does not admit them: …`, and no later step ran.
- **(c)** Its **Re-run all jobs** of the owner's first run and its **Re-run failed jobs** of the run the owner's stop ended were both refused at the gate, with `triggering_actor` `expause-admin`.
- **(c′)** Its re-runs of the owner's trigger run and the owner's `stop` control run read `actor` `firu-daniel` and `triggering_actor` `expause-admin`. Each posted a refusal naming `@expause-admin` as the re-runner and `HARNESS_RUN_ACTORS`, and no run followed.
- **(d)** Its `@sdlc-harness status` reply named `HARNESS_RUN_ACTORS`.

The admissions held:
- **(e)** The first job self-paused at 300 s (`reason budget`), and its `continue` step logged `dispatched action=run engine=task resume=pause`. The chained run `37414238278` named `github-actions[bot]` as both actors, and its gate logged `@github-actions[bot] passes: every harness dispatch is made with GITHUB_TOKEN and names it.`.
- **(g)** The owner's own dispatch logged `@firu-daniel passes: HARNESS_RUN_ACTORS is unset, which admits the owner of this user-owned repository alone.`, so `github.event.repository.owner.type` read `User`.
- **(h)** With the variable set to `*`, the second account's label on issue #16 started `feat_invoice_currency_symbol` (run `37415300051`, both actors `github-actions[bot]`). The owner's `stop` 18 s after "Started" was refused as `not a harness branch: its tip carries no flow-progress ledger` (finding 5). A second `stop`, after the run had parked, stopped it.
- **(f)** The poller's dispatch was **not observed**, since no usage pause occurred.

The rows of `docs/remote-execution.md` → `## 6.` on the `continue` chain naming `github-actions[bot]` and on `owner.type` reading `User` are settled by legs (e) and (g); the poller-dispatch half stays open.

The findings:

1. `@sdlc-harness pause`, accepted, with its marker run created, was never honoured by the running task job. The retry on a later job worked. The cause is unconfirmed: the job's control poll advances its bound past a run the eventually consistent listing may not show yet, `pause-requested` exits 1 both for "no pause" and for a usage error, and the poll's output goes only to `watcher.log`, which the bundle does not carry.
2. `collect` gives up on a transient push rejection and reports it as `origin/<branch> is not HEAD`. No push is retried.
3. A `run` job GitHub never starts is invisible: both items stay `running` with no comment. `collect` waits for an end that never comes. The poller treats the run's missing bundle as nothing waiting and disables itself, and `resume` is refused because the engine is recorded only in that bundle.
4. The gate's refusal cites `docs/remote-execution.md, section 9`. The allow-list is set up in §7 step 4 and described in §11.
5. A comment command in a run's first minutes is refused as `not a harness branch`, because the control job recognises a branch by the ledger at its tip, and the job has not pushed it yet.
6. GitHub-side failures and delays are neither detected nor survived. This finding covers 1–3 and 5: runner waits of 6 and 10 minutes and one job never started, a transient push error, a run listing that lags, and a ledger not yet on the branch.

Findings 2 and 3 were triggered by GitHub's incident or a transient GitHub error, but the gaps in handling them are the harness's. 1, 4 and 5 occurred outside the incident. All six are carried to `fix_forge_run_control_gate12_round8_findings`.

The round's teardown kept its GitHub evidence (issues #12 to #16, pull request #13, branches `feat_invoices_6` and `feat_invoice_currency_symbol`, and every run with its artifact until retention expires). It deleted the two variables and reset `main` to the seed. With its file gone, `harness-resume.yml`'s record reads `deleted` and refuses `enable` (HTTP 403). The next round checks it after its adoption push and enables it if it comes back `disabled_manually`.

What still owes a first recording:
- (v)'s enable and its in-progress artifact listing.
- (vii), (ix) and (x).
- (xii)'s last leg on a real release after the one under test.
- (xiii)'s machine-off condition and its leg (b) refusal.
- From (xiv): leg (f)'s back-to-back reviews placed in one round by the running round's own `collect` (this round placed them through a late review job); leg (h)'s merge-commit copy of the workflow and the poller not re-dispatching a deleted branch; the triage refusal and triage close, not runnable on a repository owned by a personal account.
- From (xv): leg (f)'s poller dispatch.
- The rest of `docs/github-run-control.md` → `## 8.`.
