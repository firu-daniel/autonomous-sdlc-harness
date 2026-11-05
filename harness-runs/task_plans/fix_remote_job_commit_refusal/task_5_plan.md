### Task 5 — Give the local watcher suites' resumed sessions a finished ledger where completion is the case's point

**Goal:** The watcher suites outside the classification and job-mode files drive resumed sessions whose stubs exit 0 and write no ledger, then assert `completed`. After Task 3 those exits are `paused` / `unfinished`. Make each such stub write a finished ledger, through one shared helper, so every case keeps asserting what it is about. The stand-in session then writes the field the classification now reads (`harness-runs/lessons.md` → *"When a check moves to reading a field one producer writes…"*).

**Depends on:** Task 3. That task makes `classify_run_exit` record a zero exit with an absent or unreadable ledger as `paused` with `pause_reason` `unfinished` whenever `resume_kind` is `answer` or `pause`, `stall_restarts` is above 0, or `clarifications/<branch>/answered/` holds a question. It keeps `completed` only for a first launch or over a finished ledger. It reads the task ledger at `<state_dir>/flow_progress/<branch>_progress.md` through `hr_run_ledger_state` / `hr_ledger_phases`. Finished means:
- the header line `# Flow progress — <branch>   (engine: task)`;
- every one of `P1 P2 P3 A A1.5g A1.5f A2g A2f Bg Bm C C2g C2m C2f E G D` on a `- [x] <ID>.` or `- [-] <ID>.` line.

This task edits no script, `watcher-ledger-classification.test.mjs` (Task 3's) or `watcher-remote-job.test.mjs` (Task 4's).

### Targets

- `cli/test/helpers/watcher.mjs` — one new export.
- `cli/test/watcher-park-resume.test.mjs`
- `cli/test/watcher-running-count.test.mjs`
- `cli/test/watcher-park-loop.test.mjs`
- `cli/test/watcher-background-wait.test.mjs`
- `cli/test/watcher-remote-park-sequence.test.mjs`
- `cli/test/run-copy-migration.test.mjs` — `legacyFixture` → `stubCommitAndPush`.
- Every further `cli/test/*.test.mjs` the sweep in the last `Work:` bullet finds. Each one the sweep finds becomes a target of this task, except `watcher-ledger-classification.test.mjs` (Task 3's) and `watcher-remote-job.test.mjs` (Task 4's).

**Work:**

- [ ] **The helper, in `helpers/watcher.mjs`.** Export `finishedLedgerBody(branch, stateDir = 'sdlc-harness')`, which returns a shell body (Bash 3.2) that writes the finished task ledger described above, every id `[x]`, at `<stateDir>/flow_progress/<branch>_progress.md`, relative to the session's working directory. The stub runs in the run's working copy, so that is where the ledger lands. Document it in the module's own style, naming `classify_run_exit` as its reader. The ledger's line shape is the one `watcher-ledger-classification.test.mjs` → `ledger` and `watcher-remote-job.test.mjs` → `taskLedger` already build. This helper adds no unfinished variant.
- [ ] **`watcher-park-resume.test.mjs` and `watcher-running-count.test.mjs`.**
  - In `watcher-park-resume.test.mjs`, the case `a run parked under the old layout, partly archived, resumes once for everything left` asserts `status` `completed` after an answer resume. Set its stub with `w.setStub(finishedLedgerBody(w.branch))` before the resuming `tick`.
  - In `watcher-running-count.test.mjs`, the `completed` row of `a parked run resumed on its answer ends ${label} and drops its pid` has stub `'sleep 1; :'`. Make it `'sleep 1; ' + finishedLedgerBody(f.branch)`, and leave the `failed` row's stub as it is.
- [ ] **`watcher-park-loop.test.mjs`.** Two places use stub `:` and then assert `status` `completed`:
  - the sub-case `the clear action: the sentinel is spent and the run resumes in the same pass`;
  - the case whose last answered resume follows `await w.writeAnswer(5, 'a5\n')`.

  Make each of those stubs `finishedLedgerBody(w.branch)`. Assert nothing new about the park loop itself.
- [ ] **`watcher-background-wait.test.mjs`.** The case `stopped line: one watcher.log line names the branch, and the record is completed` resumes through its `resumeOnce` with the stub body `printStopped`. Append `finishedLedgerBody(f.branch)` to that body, so the stopped line is still printed and the record completes.
- [ ] **`watcher-remote-park-sequence.test.mjs`, `run-copy-migration.test.mjs`, and the sweep.**
  - **`watcher-remote-park-sequence.test.mjs`.** Job 3 of the sequence asserts `s.status().status` `completed`. Give job 3's stub a finished ledger, through `finishedLedgerBody` or the file's own staging, whichever its stub shape takes.
  - **`run-copy-migration.test.mjs`.** Two cases resume a `LEGACY` session and assert `completed`, and the stub `legacyFixture` → `stubCommitAndPush` builds for them commits and pushes `legacy.txt` but writes no ledger:
    - `a parked legacy worktree run resumes in its worktree, commits and pushes through the wrappers` is an answer resume (the fixture seeds `question_1.md` / `answer_1.md`). It asserts `f.record().status` `completed` and the notifications `['resumed', 'completed']`.
    - `a paused legacy worktree run resumes through the pause-resume path, commits and pushes` is a pause resume through `RESUME`. It asserts `completed` and `[['resumed', 'after pause'], ['completed', '']]`.

    Append `finishedLedgerBody(LEGACY)` inside the stub's `if [ "$PWD" = '<wt>' ]; then … fi` arm, after the push line, so only the legacy session writes it. The third case's `NEW` clone session is a first launch, writes no `LEGACY` ledger, and keeps today's behaviour. The helper's default `stateDir` `'sdlc-harness'` is the file's own `STATE_DIR`. Import `finishedLedgerBody` beside `createWatcherFixture`. Change no assertion.
  - **The sweep.** List the candidate suites with `grep -lE "createWatcherFixture|helpers/watcher.mjs" cli/test/*.test.mjs`, run from the repository root. In every hit except `watcher-ledger-classification.test.mjs` and `watcher-remote-job.test.mjs`, read each `completed` assertion (`grep -nE "completed" <file>`). Wherever the case drives a resumed (answer, pause, usage gate, auto-resume), stall-restarted or previously parked session (an answered question under `clarifications/<branch>/answered/` or a seeded `question_<N>.md` / `answer_<N>.md` pair) to an asserted `completed`, give that stub a finished ledger the same way. A file the sweep changes becomes a target of this task (see `### Targets`). A `completed` that is seeded with `patchRecord` / `seedRecord` / `hr_registry_set`, or that sits in a mutation-witness comment, is not a resumed session's outcome and needs no change.
  - **Run each edited file** and repeat until no case fails on the new rule.

  The cases named above are this plan's reading, not a bound. The sweep's grep is the bound.

**Verification:**

Run each command from the repository root, one per command, as plain foreground commands. Every case in each file passes:
- `npm test --workspace cli -- test/watcher-park-resume.test.mjs`
- `npm test --workspace cli -- test/watcher-running-count.test.mjs`
- `npm test --workspace cli -- test/watcher-park-loop.test.mjs`
- `npm test --workspace cli -- test/watcher-background-wait.test.mjs`
- `npm test --workspace cli -- test/watcher-remote-park-sequence.test.mjs`
- `npm test --workspace cli -- test/run-copy-migration.test.mjs`
- `npm test --workspace cli -- test/<file>` for every further file the sweep edited.

Further checks:
- `npm test --workspace cli -- test/helpers/watcher.mjs` loads the edited helper as a test file of its own and exits 0. The module header states that `node --test` loads it that way.
- No assertion in any edited suite was removed or weakened: `git diff -- cli/test` shows only stub bodies, the import of `finishedLedgerBody`, and the helper's addition.
- Every file `git diff --name-only -- cli/test` lists is a target this file names: one of the six listed suites, the helper, or a file the sweep found.
