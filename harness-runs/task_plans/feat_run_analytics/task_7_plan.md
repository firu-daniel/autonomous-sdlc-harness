### Task 7 — Pin the watcher hook in `cli/test/watcher-run-analytics.test.mjs`: committed after a session, never changing the outcome

**Goal:** A watcher suite that drives one real pass of the `autonomous-watcher.sh` that `init` writes, with a stub agent that prints a stream. It pins two things: the session's run analytics land on the run's branch as commits with the fixed subject, and a failing analytics script or commit changes neither the run's status nor its notification.

**Depends on:** Task 5, whose hook is restated here so the suite asserts the contract rather than the code. In `spawn_engine`'s subshell, between `rc=${PIPESTATUS[0]}` and `classify_run_exit`, `record_run_analytics <branch> <worktree> <log_path>` does the following:
- It runs `<scripts_dir>/run-analytics.sh <log>.stream.jsonl <branch> --repo <worktree> --main-repo <MAIN_REPO>`, with the script's own output appended to the run's log.
- It then commits `<state_dir>/run_analytics/<branch>/run-analytics.json` and `run-analytics.md`, each through `watcher_commit`, with the subject `chore: Record run analytics for <branch>`. `watcher_commit` → `hr_commit_placed` commits on the copy's checked-out branch and refuses a protected branch or a branch with no commit yet. An identical blob commits nothing.
- Any failure is one line written through the watcher's `log`, so it lands in the **watcher log**, `<state_dir>/autonomous_logs/watcher.log` (`log()` tees to `$WATCHER_LOG`), not in the run's log. The failure lines are `run analytics: '<branch>' not recorded (exit <n>) — see <log_path>` and, when the script is missing, one line naming `run-analytics.sh` and the `init --force` route.
- The function always returns 0.

This task also depends on Task 4, which makes `init` write `run-analytics.sh` and its `lib/` programs into the fixture.

**Where this task stops.** The analytics' own numbers are **Task 6's** suite. This one asserts only that the hook runs, commits and stays out of the outcome. Job mode reaches the same `spawn_engine` line, so it is not driven separately, and the header says so.

### Targets

- `cli/test/watcher-run-analytics.test.mjs` (new) — the suite.

**Work:**

- [ ] **Header and scaffolding.** The header states the rule the suite enforces: *the session's analytics are committed on the run's branch after every session, and the analytics step never changes the run's status, exit handling or notifications*. It also states what is not covered: job mode (the same `spawn_engine` line, driven elsewhere by `cli/test/watcher-remote-job.test.mjs`) and the metrics themselves (`cli/test/run-analytics.test.mjs`). Build the fixture the way `cli/test/watcher-run-profile.test.mjs` → `adoptedFixture` does, as a local helper in this file:
  - Start from `createWatcherFixture` (`cli/test/helpers/watcher.mjs`).
  - Append `/watcher-test/` to `.git/info/exclude`, commit the adoption (`git add -A`, then a `--no-verify` commit with a fixed identity), and push `HEAD` to `origin`'s `refs/heads/<defaultBranch>`.
  - Register `t.after` removal of the clone at `` `${dir}-feat_x` ``.

  The main checkout's `HEAD` would otherwise be unborn and sit on the protected default branch, where `hr_commit_placed` refuses every commit. Drive passes with the helper's `tick`, so every assertion reads state after the pass's `wait` (that helper's rule). Read failure lines with the helper's `watcherLog()`.
- [ ] **Commit case.** `setStub` a body that prints a minimal one-session stream to stdout: a `system`/`init` with a `session_id`, one timestamped assistant event, and a `result` with `duration_ms`. Drop a task prompt into `<stateDir>/autonomous_inbox/feat_x_task_prompt.md`. Then one `tick` does the following: `create-worktree.sh` cuts a clone at `` `${dir}-feat_x` `` on `feat_x`, which branches from the pushed adoption commit and so has a commit; the record's `copy_kind` is `clone`; and the pass launches exactly one session there. After that pass:
  - `git log --format=%s refs/heads/feat_x` in the clone shows `chore: Record run analytics for feat_x`.
  - `git show --stat` of those commits names exactly `<stateDir>/run_analytics/feat_x/run-analytics.json` and `run-analytics.md` respectively.
  - The same `git log` in the main checkout shows the same commits, after `classify_run_exit`'s sync.
  - The record's `status` is not `failed`, and the notification recorder holds exactly one line. The suite keeps both as this case's baseline rather than hard-coding them.
  - `git status --porcelain -- <stateDir>/run_analytics/` in the clone prints nothing. It is scoped to that directory because the stub's recorder files are untracked in the clone.
- [ ] **Re-run case.** Re-seed the same clone through `seedRecord({ status: 'parked', worktree: <the clone>, copy_kind: 'clone' })` with one answered question pair (`writeQuestion`, `writeAnswer` — the helper's own resume route). A second pass, whose stub prints the same session again, adds no new `chore: Record run analytics for feat_x` commit on `refs/heads/feat_x` in the clone (the identical-blob skip).
- [ ] **Failure case.** Re-seed the same clone the same way, and replace the main checkout's `scripts/run-analytics.sh` with a stub that exits 1. The watcher resolves `RUN_ANALYTICS` beside itself (`$SCRIPT_DIR`), and the watcher that runs is the main checkout's. After one pass, three things hold. The record's `status` and the notification recorder's new lines equal the commit case's baseline. No analytics commit was added. `watcherLog()` holds one `run analytics: 'feat_x' not recorded (exit 1)` line. A second failure case removes the script instead. It shows the same status and notification, and `watcherLog()` holds one line naming `run-analytics.sh`.

**Verification:**

- `npm test --workspace cli -- test/watcher-run-analytics.test.mjs`, as one plain foreground command from the repository root, passes, and its captured counts show `# fail 0` with a non-zero `# pass`.
