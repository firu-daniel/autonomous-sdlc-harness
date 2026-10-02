### Task 3 — Multi-job park suite: answer, then a user or budget pause, then a pause resume, completes and delivers

**Goal:** Prove item 7 is fixed across real job boundaries, as the acceptance criteria ask: *"A `gh`-stub suite case in job mode: park → `resume answer` → pause exit → `resume pause` → completed session (rc 0, ledger complete). It ends `completed`, archives the answered pair, and `deliver` opens the PR."* Cover the user pause and the budget pause.

**Depends on:** Task 1, which makes `classify_run_exit` archive the union of `resumed_for_index` and `launch_answered_set` (the top-level answered pairs present when `spawn_engine` launched the session) on every non-pause exit. This suite asserts that outcome and does not change the watcher.

**Where this task stops.** It creates the suite and its sequence helper, and covers the user-pause and budget-pause sequences. The usage-pause and stop-then-resume sequences are **Task 4**'s, in this same file, after this task. No production file is edited here.

### Targets

- `cli/test/watcher-remote-park-sequence.test.mjs` (new) — owned by this task; **Task 4** extends it.

**Work:**

- [ ] Open the file with the rule it enforces, in its header: *a park answered, then paused, then resumed in job mode ends `completed`, archives the answered pair, and is delivered — whatever pause came between, because classification reads what was on disk at launch rather than a registry the job boundary discarded.* Say what is not covered here and where it is (Task 4's sequences, and the local resume suites).
- [ ] Write the sequence helper. One fixture checkout, wired by `init` as `createJobFixture` in `cli/test/watcher-remote-job.test.mjs` does, plays every job. **Between jobs only the bundle crosses:** run `remote-run.sh save <branch> <dir>`, then remove what a fresh runner would not have — `autonomous_logs/registry.json`, `clarifications/<branch>/`, `PAUSE_PROGRESS.md` and `autonomous_logs/remote_status.json` — and restore the bundle in `job` mode (the library's `hr_remote_bundle_restore <bundle> <root> <branch> job`, sourced from the fixture's own `<scriptsDir>/lib/harness-run-lib.sh` copy). Write `answer_1.md` into the restored directory for the `answer` job, as `restore --resume answer` would. Reuse the agent-stub, `GH_STUB` and `pauseRunList` / `HONOUR_PAUSE` patterns of `watcher-remote-job.test.mjs` by copying what this file needs. Do not import from that test file.
- [ ] Case *"user pause"*: job 1, `none`, with a stub that writes `question_1.md` and exits 0, ends `parked`. Job 2, `answer`, with a `harness pause <branch>` run listed after its start and a stub that honours PAUSE, ends `paused` / `user`. Job 3, `pause`, with a stub exiting 0, ends `completed`. Assert job 3's `remote_status.json` `status` is `completed`, `question_1.md` and `answer_1.md` are under `answered/`, and no top-level `question_*.md` remains.
- [ ] Case *"budget pause"*: the same, with job 2 under `REMOTE_SELF_PAUSE_AFTER_SECS=1` and no pause run listed, so it ends `paused` / `budget` / `continue`. Same assertions on job 3.
- [ ] In both cases, after job 3, run `remote-run.sh deliver <branch> <bundle_dir>` against the saved bundle with `forge` `github`, and with a `gh` stub that answers `pr list` with `[]` and `pr create` with a pull-request URL. Assert one `pr create … --draft` call and a `completed` comment.

**Verification:**

- `npm test -- test/watcher-remote-park-sequence.test.mjs` from `cli/` passes.
- Read each case against Task 1's change: before it, job 3 ended `parked`, which is round 6's finding 1. The case's first assertion after job 3 is on `status` `completed`, so it would fail on exactly that outcome rather than on a later, incidental one.
- Every `runBash` call carries a timeout below the per-test timeout, as `watcher-remote-job.test.mjs`'s header requires, and every fixture is torn down in process.
