### Task 8 — `collect` reports a run whose job never started, and offers a re-run of `collect` when a round fails to place

**Goal:** Two things change in `collect`.
- When GitHub never starts a run's `run` job, the run's issue or pull request gets one plain comment that names the way on, and its label leaves `sdlc-harness: running`. Gate 12 round 8, finding 3: both items stayed `running` with no comment, and `collect` logged "that run's own end collects", an end that never came.
- When `collect`'s round fails to place, its comment offers the retry that needs no new review. Finding 2: re-running the `collect` job was the workaround.

**Depends on:**
- **Task 7**, which gives `remote_state`, for a never-started run:
  - `RS_ENGINE` from its dispatch's marker when one qualifies, else empty;
  - a Case 5 run (no bundle anywhere) with a recovered engine promoted to `paused` / `killed`, so `resume` accepts it. That covers a branch's first run.

  Task 7 also edited the `fetch`, `status`, `sync` and `control` clauses of the header paragraph `WHAT IT NEVER DOES.`. This task edits its `collect` clause.
- **Task 6**, which gives `remote_state`, for the newest `harness run <branch>` run:
  - `RS_NOT_STARTED=1` when its `run` job GitHub never started;
  - `RS_STATE`: `paused` with `RS_PAUSE_REASON` `killed` when an older run carries a bundle, else `failed` (before Task 7's promotion);
  - `RS_DETAIL`: `GitHub did not start the job of run <id> (<reason>): <url>`;
  - `RS_RUN_ID`.

  After both tasks, the state `collect` reads is `paused` / `killed` with a non-empty engine (resumable by comment), `paused` / `killed` with an empty engine (an older bundle, no marker: the form), or `failed` (no bundle, no marker: the form).
- **Task 4**, whose `review` placement failures read `pushing <branch>: the remote refused the push (…)` or `pushing <branch>: origin/<branch> moved to <sha>, …`.
- **Task 3**, which edited `remote-collect.test.mjs`'s refusing cases to pass `PUSH_RETRY_DELAY_SECS: '0'`.

**Why `collect` and nothing else reports it.** `collect` is `needs: run` under `!cancelled()`, and round 8 observed it run after a `run` job GitHub cancelled before any step. The poller handles the same run in **Task 9**, which only logs it, so one event gets one comment.

**The `notify` contract this task keeps.** The comment above `notify` states: *"<forge_note> is the comment's, naming no slash command and no shell command, and states only what happened, since `forge_report` adds the next action."* So the way on is composed by `forge_report`'s `not_started` arm, as every other arm composes its own, and the note carries only GitHub's reason.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - `forge_report`: a new `not_started` event;
  - `control_settled_var`: it also exposes the not-started fields;
  - `verb_collect`;
  - `collect_notify`'s failure text;
  - the header paragraphs `` `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT AND ONE STATE LABEL `` and `` `collect` STARTS THE NEXT ROUND FROM THE REVIEWS COLLECTED DURING A RUN ``;
  - the header paragraph `WHAT IT NEVER DOES.`, its `collect` clause only.
- `cli/test/remote-collect.test.mjs`: the not-started cases and the failure comment's text.

**Work:**

- [ ] **`forge_report not_started <branch> <note>`.**
  - **Where it fits.** It sits with the other job events: under the stop guard, so a stopped branch posts nothing, and with the same target rule (the recognised open pull request, else the issue).
  - **Its inputs.** Two job-globals its caller sets, `REPORT_NOT_STARTED_STATE` (`paused` or `failed`) and `REPORT_NOT_STARTED_ENGINE` (empty or the recovered engine). `<note>` is what happened, GitHub's reason only, and names no command.
  - **Its label.** `paused` when `REPORT_NOT_STARTED_STATE` is `paused`, else `failed`.
  - **Its way on**, composed here:
    - `paused` with `REPORT_NOT_STARTED_ENGINE` set: ``Comment `$COMMAND_HANDLE resume` to start it again from its committed ledger.``;
    - otherwise: `Start it again with the **Run workflow** form: <route>.`, where `<route>` is `hr_github_resume_route "$branch" "<engine>"` less its leading `or from GitHub: `, and `<engine>` is `REPORT_NOT_STARTED_ENGINE` when set, else `<task, user_review or docs: the one the run was started with>`, the text `control_resume_dispatch` already passes, since a job that never started left no `harness-state` artifact to read an engine from.
  - **Its text**, in the order the header's `report` paragraph fixes for every comment (the next GitHub action, then `<note>` byte for byte, then the run URL, then the marker): ``GitHub did not start the job of the harness run on `<br>`, so nothing ran and the branch is unchanged.`` and the way on, then `<note>`, then the run URL, then `<!-- sdlc-harness event=not_started branch=<br> -->`.

  Update the header's `report` paragraph: the event list, the state map (`not_started` → `paused` or `failed`, as its caller says), the way on this arm composes, and the job events the stop guard covers.
- [ ] **`control_settled_var`.** Widen its `printf` line, and `read`, with `RS_NOT_STARTED`, `RS_RUN_ID`, `RS_ENGINE` and `RS_DETAIL` as `BS_NOT_STARTED`, `BS_RUN_ID`, `BS_ENGINE` and `BS_DETAIL`. Put `BS_DETAIL` last, so a `|` inside it cannot shift the other fields. Every existing caller keeps reading `BS_SETTLED`, `BS_STATE` and `BS_REASON` unchanged.
- [ ] **`verb_collect`.** Before it requires an open pull request, read the branch's settledness, so a first run, which has no pull request, is covered. Do this right after the stop check, moving `control_tmp`'s setup and `control_settled_var` up. Then:
  - When `BS_NOT_STARTED` is `1` and `BS_RUN_ID` equals `GITHUB_RUN_ID` (or `GITHUB_RUN_ID` is unset):
    1. set `REPORT_NOT_STARTED_STATE` to `BS_STATE` and `REPORT_NOT_STARTED_ENGINE` to `BS_ENGINE`;
    2. send `notify not_started "$branch" "<push detail>" "<note>"`. The push detail names `$BS_DETAIL` and, as the push texts already do, `$RESUME_HINT $branch` and the GitHub route. The note is GitHub's reason from `$BS_DETAIL` and nothing else: no slash command, no shell command, no way on;
    3. exit 0. No round is collected, because the reviews stay for the resumed run's own end.
  - When `BS_NOT_STARTED` is `1` for another run: one line, `run <id> of <branch> never started; its own collect reports it`, and exit 0.
  - Otherwise, the existing order continues unchanged. With no pull request, the existing `no open pull request; nothing to collect` line and exit 0. With `BS_SETTLED != 1`, the existing in-flight line.

  Update the header's `collect` paragraph to match. In `WHAT IT NEVER DOES.`, the clause "`collect` writes its round file and its settledness directory under `RUNNER_TEMP` (removed), at most one comment on the pull request, plus what its `review` child writes" becomes false. Restate it: at most one comment, on the pull request, or on the issue for a run whose job never started, `report`'s state labels on both items and one push notification for that event, the fetch of `refs/remotes/origin/<branch>` that its settledness read makes for such a run (Task 7's), plus what its `review` child writes.
- [ ] **The failure comment.** When `GITHUB_RUN_ID` is set, `collect_notify`'s text becomes: "… could not start the next round: <last line>. They stay on the pull request. To retry, re-run this run's `collect` job (no new review is needed), or submit a review requesting changes." When it is unset, the text stays as today. Update the header sentence "saying the reviews stay there and that submitting a review requesting changes retries; there is no automatic retry" to match.
- [ ] **`remote-collect.test.mjs`.** The stub already answers `STUB_RUN_LIST`, `STUB_JOBS` and `STUB_BUNDLES`. Make sure it answers the issue and pull-request comment listings Task 7 reads, and the annotations endpoint Task 6 reads. Cases:
  - **The acceptance case: never started, pull request open, engine recorded.** Run 601 is the newest. Its `run` job is `completed` / `cancelled` with `steps: []`, it has no bundle, and an older run has one. A bot `round` marker sits on pull request 12. Assert:
    - exactly one comment, on #12, carrying `GitHub did not start the job`, ``@sdlc-harness resume`` and `event=not_started branch=feat_x`;
    - the label call sets `sdlc-harness: paused` on #12 and on the issue;
    - nothing pushed, nothing dispatched.
  - **A first run, engine recorded.** The branch is pushed **without** its flow-progress ledger, as `verb_start` leaves a first run's branch (it commits only the task prompt); add a `ledger: false` option to the suite's fixture if it has none. No pull request, no bundle anywhere, the issue known from the task prompt's provenance line, and a bot `started` marker on it. One comment on the issue naming ``@sdlc-harness resume``; the label is `sdlc-harness: paused`. `collect` needs no ledger: `forge_report` checks the ledger only for a pull-request target.
  - **A first run, no marker.** The same branch with no ledger, and no marker. One comment on the issue naming the **Run workflow** form and `<task, user_review or docs: the one the run was started with>`, and not `harness-state`; the label is `sdlc-harness: failed`.
  - **Another run never started.** `GITHUB_RUN_ID` is not the newest run's id: no comment, and the `its own collect reports it` line. **A stopped branch:** nothing posted.
  - **The existing cases.** *"review failing placement"*: its body assertion becomes the new retry sentence; add `GITHUB_RUN_ID` if the fixture does not already set it; its last-line text now carries Task 4's `the remote refused the push`. The no-pull-request case still prints `no open pull request; nothing to collect`; if it asserts an exact `gh` call list, update it for the settledness read that now comes first.

**Verification:**

- `npm test --workspace cli -- test/remote-collect.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- End to end, the acceptance case runs the whole chain through the real script: Task 6's detection, Task 7's engine, `control_settled_var`, `notify`, `forge_report`. A `@sdlc-harness resume` after that comment is Task 7's acceptance case. After the first-run comment, on a branch with no ledger, it is **Task 10's** first-run case: `control` accepts that branch only once Task 10 recognises the branch the issue's `started` marker names. So the way on each comment names is exercised by the time the branch ships.
- Every `notify` call this task adds passes a `<forge_note>` that names no slash command and no shell command. Read each against the comment above `notify`.
