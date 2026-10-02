### Task 7 — Name a stopped run `stopped` in every `control` reply

**Goal:** Fix item 11. After a stop, every `control` reply names the state the way the lifecycle comment and the label do: `stopped`. It never names the state the bundle or the run list still reports (`paused`, `parked`, `park_loop`, `running`) as if the run had not been stopped.

**Why this mechanism.** A stop does not rewrite what `remote_state` reads, and what it reads depends on the state the run was in:
- a run that was **running** is cancelled. Until GitHub finishes the cancel, the newest `harness run` run is not `completed`, so `remote_state` returns `running`. Once it finishes, the bundle (still `running`) is read back as `paused` / `killed` (case 3), or case 4 gives `paused` / `killed`;
- a run that was **parked**, **held in a park loop**, or **paused** has no job to cancel. Its bundle is unchanged, so it still reads `parked`, `park_loop` or `paused`.

`control_stop` accepts every one of these (it refuses only `none`), and Task 11 also stops `running`, `parked` and `park_loop` runs when an issue or pull request is closed. So the word cannot be derived from `CS_STATE` alone. The prompt's alternative was to write `pause_reason: stop` into the cancelled job's post-step bundle, which would cover only the cancelled-job case and make the bundle vocabulary carry a fact the run list already holds: `remote_branch_stopped` reads it there (0 when the newest `harness stop <branch>` run is newer than the newest `harness run <branch>` run). The run list is the authority (`docs/github-run-control.md` §5, *"the run list on GitHub is the authority"*), so `control` derives the word from it, for every unfinished state. The bundle, `fetch`'s output wire and `sync`'s record stay unchanged.

**Depends on:** Task 2, which edits `cli/templates/scripts/remote-run.sh` before this task. This task edits only the `control` functions named below.

**Where this task stops.** It changes the words `control` replies with. It does not change which states each verb accepts: every case test still reads `CS_STATE` / `BS_STATE`. It does not add `status`, which is **Task 8**'s; that task reuses the helper this task adds. The docs, §5's `stopped` row and §2's in-flight reply, are **Task 17**'s.

**The interface Task 8 consumes.** `control_state_word_var`, called with no argument right after a successful `control_state_var`, sets two globals and returns 0:
- `CS_STOPPED` — `1` when `CS_STATE` is one of `running`, `parked`, `park_loop`, `paused` and `remote_branch_stopped "$CONTROL_BRANCH"` answers 0; else `0`;
- `CS_WORD` — `stopped` when `CS_STOPPED` is `1`, else `CS_STATE`.

A stop check that fails (2) leaves `CS_STOPPED=0` and `CS_WORD="$CS_STATE"`, and prints one line to stderr. `completed`, `failed` and `none` are never renamed: a finished run is not unfinished by a stop.

**What each verb does with a stopped run.** The state each verb *accepts* is unchanged, so a stopped run is handled as the state underneath it, and the reply names `stopped` with the underlying state in parentheses where the way on depends on it:

| Underlying state | `pause` | `resume` | `answer <n>` | `clear` | `stop` |
|---|---|---|---|---|---|
| `paused` | refused: *"is `stopped`"*, way on *"Comment `@sdlc-harness resume` to continue it from its committed ledger."* | accepted, dispatches `resume: pause`, reply unchanged | refused: *"is `stopped`"*, way on resume | refused: *"is `stopped`"* | accepted, as today |
| `parked` | refused: *"is `stopped` (it was parked, waiting for an answer)"* | refused: *"is `stopped` (it was parked, waiting for an answer, open: …)"*, way on *"Comment `@sdlc-harness answer <n>` …; the answer resumes it."* | **accepted.** The answer dispatch is the resume. Its replies say *"… so the stopped run on `<b>` resumes"* (last answer) or *"… sent; the stopped run on `<b>` resumes once question(s) … are answered"* (a partial answer) | refused: *"is `stopped` (it was parked)"* | accepted, as today |
| `park_loop` | refused: *"is `stopped` (it was held by the park-loop guard)"* | refused: same words, way on *"Comment `@sdlc-harness clear` to release the hold and resume it."* | refused: same words, way on clear | **accepted.** Dispatches as today; reply *"Park-loop hold on `<b>` cleared …; the stopped run resumes from its committed ledger."* | accepted, as today |
| `running` (the cancel is still finishing) | refused: *"is `stopped`; its cancelled job is still finishing"*, way on *"Comment `@sdlc-harness resume` once it has ended."* | refused: same words and way on, instead of *"already `running`"* | refused: same words and way on | refused: *"is `stopped`"* | accepted, as today |

Every dispatch creates a newer `harness run <b>` run, so after an accepted `answer`, `clear` or `resume` the branch is no longer stopped and the next reply names the state again.

### Targets

- `cli/templates/scripts/remote-run.sh` — a new `control_state_word_var` beside `control_state_var`; `control_pause`, `control_resume`, `control_answer`, `control_clear`, `control_review_in_flight` (and the `control_settled_var` call in `control_review` that feeds it); and the header's `control` paragraph (THE ARMS, THE REVIEW).
- `cli/test/remote-control.test.mjs` and `cli/test/remote-control-review.test.mjs` — new cases (this task edits `remote-control.test.mjs` first; **Task 8** after).

**Work:**

- [ ] Add `control_state_word_var` with the interface above, and call it right after each `control_state_var` read in `control_pause`, `control_resume`, `control_answer` and `control_clear`. Leave `control_stop` unchanged.
- [ ] Rewrite the replies of `control_pause`, `control_resume`, `control_answer` and `control_clear` per the table above, using `CS_WORD` in every sentence that names the state and keeping every `case` / `[ … ]` test on `CS_STATE`. A run with `CS_STOPPED=0` gets exactly today's text.
- [ ] Review path: after `control_settled_var`, when `BS_STATE` is `running`, `parked`, `park_loop` or `paused` and `remote_branch_stopped "$CONTROL_BRANCH"` answers 0, `control_review_in_flight` names the state `` `stopped` `` instead of `` `<BS_STATE>` (`<BS_REASON>`) ``. Its way on follows the table's `resume` column for that underlying state (resume; answer; clear; resume once the cancelled job has ended).
- [ ] Amend the header's `control` paragraph (THE ARMS and THE REVIEW): replies name a stopped run `stopped` in every unfinished state, how that is derived (`remote_branch_stopped`, one extra run listing), that the accepted states are unchanged, and that an answer or a clear on a stopped run is its resume.
- [ ] Cases, with a `gh` stub whose run list holds a `harness stop <b>` run newer than the newest `harness run <b>` run:
  - in `cli/test/remote-control.test.mjs`, a bundle reading `running` with a `completed` newest run (so `paused` / `killed`): `pause` replies `` … is `stopped` `` with the resume way on, never `paused`; `answer 1` likewise; `resume` still dispatches `resume: pause`;
  - a bundle reading `parked` with question 1 open: `pause` and `resume` replies name `stopped` and never `parked`; `answer 1` dispatches `resume: answer` and its reply says the stopped run resumes;
  - a newest `harness run <b>` run still `in_progress`, created before the stop run: `pause` and `resume` replies name `stopped` and say the cancelled job is still finishing, never `running`;
  - in `cli/test/remote-control-review.test.mjs`, a review's in-flight reply on a stopped `paused` run names `` `stopped` ``;
  - without the stop run, the pause reply on a `paused` run still names `paused`, and on a `parked` run `resume` still names `parked`.

**Verification:**

- `npm test -- test/remote-control.test.mjs` and `npm test -- test/remote-control-review.test.mjs` from `cli/` pass.
- `grep -n "CS_STATE" cli/templates/scripts/remote-run.sh` lists every remaining use. Each is a state *test* (a `case` or `[ … ]`) or the assignment inside `control_state_word_var` / `control_state_var`, and none is a word inside reply text, where `CS_WORD` applies.
- Re-read each row of the table above against the four `control_*` functions: every refusal that names a state in a run with `CS_STOPPED=1` names `stopped`.
- `fetch`'s printed `state:` line is unchanged for the same bundle. The local commands parse that wire.
