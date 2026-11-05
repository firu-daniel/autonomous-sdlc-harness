### Task 4 — Job-mode cases for the ledger-less resume, and the job-mode cases that resumed without a ledger re-cast

**Goal:** Prove in job mode that a resumed job whose session exits 0 without ever writing its ledger ends `job: paused stop`, never `job: completed stop`. Keep every other job-mode case asserting what it asserted, by giving each resumed stub whose case is about something else a finished ledger.

**Depends on:** Task 3. That task makes `classify_run_exit` record a zero exit with an absent or unreadable ledger as `paused` with `pause_reason` `unfinished` whenever the session was resumed (`resume_kind` `answer` or `pause`), stall-restarted (`stall_restarts` > 0) or follows an earlier park (an archived `answered/question_<n>.md`). It logs `classify: '<branch>' has no readable ledger (<state>: <detail>) after <why> — not classifying it completed`, where `<why>` is `a <kind> resume`, `a stall restart` or `an earlier park`. In job mode that record goes through `run_job`'s `unfinished)` arm: `job_auto_resume` up to `REMOTE_AUTO_RESUME_MAX`, then one `paused` notification naming `/autonomous-sdlc-harness:branch-resume`, then `job: paused stop`. A first launch (`resume none`, no stall restart, no archived question) keeps `completed`. This task edits no script.

### Targets

- `cli/test/watcher-remote-job.test.mjs`.

**Work:**

- [ ] **The measured case,** `resumed, no ledger: an answer resume that exits 0 before any ledger is never completed`.
  - **Setup:** `writeQuestion(1)` and `writeAnswer(1)`, stub `:`, then `j.job([j.branch, 'task', 'answer'], { REMOTE_AUTO_RESUME_DELAY_SECS: '0', REMOTE_AUTO_RESUME_MAX: '1' })`.
  - **Assert:**
    - `lastLine(result.stdout)` is `job: paused stop` and `j.prompts().length` is 2;
    - `j.status()` has `status` `paused`, `pause_reason` `unfinished` and `decision` `stop`;
    - no `completed` notification, and exactly one `paused` notification whose detail matches `/\/autonomous-sdlc-harness:branch-resume feat_x/`;
    - `j.watcherLog()` matches `/has no readable ledger \(absent: .*\) after an answer resume — not classifying it completed/`, and does not match `/completed — branch ready for review/`.
- [ ] **Its `pause` twin,** `resumed, no ledger: a pause resume …`. Restore a `paused` status with `j.restoreStatus({ status: 'paused' })`, stub `:`, `resume pause`, and `REMOTE_AUTO_RESUME_MAX: '0'`. Assert `job: paused stop`, one prompt, `pause_reason` `unfinished`, and no `completed` notification.
- [ ] **The first launch keeps `completed`.** The existing `none: the launch line, the start and stop records, and the parked detail` case already asserts `job: completed stop` for a `resume none` job whose stub writes no ledger. Keep it unchanged, and add one line to the file's header stating it is the first-launch control for the rule above.
- [ ] **Re-cast every case that resumes and asserts completion without a ledger.** The procedure, applied to the whole file:
  - **Find the cases.** Find every case whose job runs with `resume` `answer` or `pause`, or whose stub is launched a second time (an auto-resume after a `PAUSE_ACK`, an `unfinished` pause or a failed exit, the in-job usage wait's relaunch, or the budget pause's relaunch). Among those, take each that asserts `job: completed stop`, `status` `completed` or a `completed` notification.
  - **Stage a finished ledger.** In the launch whose completion the case asserts, stage `taskLedger(j.branch, TASK_LEDGER_IDS)` through `stageLedger`, both defined in this file beside the `unfinished:` cases. Use a `COUNT_LAUNCH` branch where only a later launch should finish.
  - **Change nothing else.** Change no other assertion.
  - **Run the edited file** and repeat until no case fails on the new rule.

  The cases this plan's reading found are a starting set, not a bound:
  - `answer: the prompt names the restored answer`;
  - `a pause resume launched with an answered pair at the top level ends completed and archives the pair`;
  - the first sub-case of `auto-resume: bounded, and reset by a user action`;
  - the waited-out arm of `usage: a short reset is waited out in the job, a reset past the deadline goes to the poller`;
  - `pause note: kept only for a pause resume of a paused job of the same engine`, wherever it asserts completion.
- [ ] **The file's header.** Extend the paragraph **A job ends `completed` only over a finished ledger.** with one sentence covering the two new cases: a resumed job whose session never wrote its ledger is `unfinished` too. Add to the RED ONCE list: `classify_run_exit`'s resume signal ignored, which makes both `resumed, no ledger:` cases end `job: completed stop`. Run it against the fixture's installed copy of the watcher, never the tracked template.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs`, from the repository root, as one plain foreground command: every case passes.
- `grep -n "resumed, no ledger" cli/test/watcher-remote-job.test.mjs` lists the two new cases. `grep -n "'job: completed stop'" cli/test/watcher-remote-job.test.mjs` lists no case that launches with `resume` `answer` or `pause` without staging a finished ledger. Read each hit's case to confirm.
