### 1. A job-mode failure that will be auto-resumed still posts `failed` and tells the maintainer to re-apply the trigger label, which starts a duplicate run

**Severity:** Must Fix

**Sites:**
- `cli/templates/scripts/autonomous-watcher.sh` (`notify`) — "[ \"$JOB_MODE\" = 1 ] || return 0", the block that forwards every job-mode event to `bash "$REMOTE_RUN" report "$1" "$2" …`.
- `cli/templates/scripts/autonomous-watcher.sh` (`classify_run_exit`) — "notify failed \"$branch\" \"$log_path\" \"(exit $rc)\"". This is the caller that fires the report before the job has decided.
- `cli/templates/scripts/autonomous-watcher.sh` (`run_job`) — the supervision loop's `failed)` arm, "job_auto_resume \"$branch\" \"$worktree\" \"$log_path\" \"$state_abs\" \"a failed exit\" && continue", and the closing block "final=\"$(registry_get \"$branch\" status)\"".
- `cli/templates/scripts/remote-run.sh` (`forge_report`) — the `failed)` text arm, "To start again, re-apply the label \`$trigger_label\` to this issue; that starts a new run, on the next indexed branch."
- `docs/watcher.md` → `## 1.`, step "8. **One notification per lifecycle event**" — "In a job with `forge` `github`, each event is also passed to `remote-run.sh report`". After the fix this sentence would state the behaviour the fix removes for `failed`.

**Problem.** In job mode a session that exits non-zero goes through `classify_run_exit`, which calls `notify failed`. The new `notify()` passes that event straight to `remote-run.sh report failed`. `forge_report` then posts the `failed` comment and moves the state label to `sdlc-harness: failed`. On an issue target, the comment tells the maintainer to *"re-apply the label … that starts a new run, on the next indexed branch"*.

The job has not decided anything yet at that point. Control then returns to `run_job`'s loop. Its `failed)` arm calls `job_auto_resume`, which by default (`REMOTE_AUTO_RESUME_MAX=2`, `REMOTE_AUTO_RESUME_DELAY_SECS=300`) sleeps 300 s and relaunches the same run from its committed ledger. It then posts `notify resumed`, which `report` turns into a `resumed` comment and the `sdlc-harness: running` label. `docs/remote-execution.md` → `### API errors` states the design: *"Past the cap the run stays `failed` or `paused` and notifies."* The comment fires on every failure, though, not only past the cap.

**The runtime symptom, and why it is reachable.** One transient non-zero exit, the case the auto-resume exists for, posts this on the issue that started the run: *"The harness run on `feat_x` failed. … To start again, re-apply the label `sdlc-harness` to this issue; that starts a new run, on the next indexed branch."* The issue also shows `sdlc-harness: failed`.

A maintainer who does what the comment says during the 300-second delay starts a second run of the same task on `feat_x_2`, billed to the same credential. Meanwhile the first run resumes by itself and also delivers a pull request. Nothing refuses the second start, because `trigger` derives a fresh branch name every time. With the default cap this can happen twice per job before the real final `failed`.

On a pull-request target the comment says to submit a review requesting changes. While the auto-resume is pending that review is refused, because the newest run is `in_progress` and `review` reports *"is running on GitHub"*.

The existing suite already drives this path without asserting on the comments: `cli/test/watcher-remote-job.test.mjs`, the case *"a stub that always exits 2 -> exactly REMOTE_AUTO_RESUME_MAX relaunches, then failed / stop"*, launches three sessions. Each of the first two exits through `classify_run_exit`'s `notify failed`.

The same rule already holds for pauses. The watcher header (`NOTIFICATIONS`) says *"classify_run_exit's `paused` arm notifies only a `user` pause; job mode sends the others once it has decided"*. `failed` was not given the same treatment when it gained a GitHub comment.

**Fix.** Report `failed` to GitHub once, after the job has decided. Leave `autonomous-notify.sh`'s push notification unchanged, as the task prompt requires.

1. In `cli/templates/scripts/autonomous-watcher.sh`, move the report-forwarding half of `notify()` (everything after `[ "$JOB_MODE" = 1 ] || return 0`) into a new function `job_report <event> <branch> [<log>]` with the same body:
   - the `-r "$REMOTE_RUN"` check and its log line;
   - the `bash "$REMOTE_RUN" report "$1" "$2" --repo "$MAIN_REPO" >>"$3" 2>&1 || true`, or the `>/dev/null 2>&1` form when `$3` is empty.

   `notify()` keeps the `$NOTIFY` call. Then, in job mode, it calls `job_report "$1" "$2" "${3:-}"` for every event **except** `failed`, so `failed` returns before reporting. Add one header-comment line above `notify()`: in job mode `failed` is not reported here, because `run_job` reports it once its automatic resumes are ruled out.
2. In `run_job`, in the closing block, after `final="$(registry_get "$branch" status)"` and before `job_write_status`, add:
   ```bash
   [ "$final" != "failed" ] || job_report failed "$branch" "$log_path"
   ```
   Every job-mode failure, whether a session exit, a vanished process or a stall-watchdog give-up, reaches this point after the loop's `failed)` arm has either auto-resumed (and so `continue`d) or `break`ed. So this posts exactly one `failed` comment, and only when no auto-resume follows.
3. In the watcher's header, in the `NOTIFICATIONS` bullet, change *"Each job-mode event is also passed to `remote-run.sh report`"* to say that each job-mode event except `failed` is passed to `report` as it happens, and that `failed` is passed once, when the job ends `failed`.
4. In `docs/watcher.md` → `## 1.`, step "8. **One notification per lifecycle event**", change *"In a job with `forge` `github`, each event is also passed to `remote-run.sh report`, which comments on the run's issue or pull request"* to say that, in a job with `forge` `github`, each event except `failed` is also passed to `remote-run.sh report` as it happens, and that `failed` is passed once, when the job ends `failed` (its automatic resumes ruled out). Keep the rest of the sentence — the comment target, the `github-run-control.md` → `## 5.` link and *"the notification itself is unchanged"* — as it is.
5. In `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, in the table row whose first cell is `` `failed` ``, change the *What it says* cell to "the run failed, and where its log is; posted once the job's automatic resumes are exhausted".
6. In `cli/test/watcher-remote-job.test.mjs`, add a case beside *"report: a parked job comments on its issue with forge github, and calls no issues/ endpoint without it"*:
   - Call `await wireForge(j, 'github')`.
   - Set the stub with `await j.setStub('exit 2')`.
   - Run `j.job([j.branch, 'task', 'none'], { REMOTE_AUTO_RESUME_MAX: '2', REMOTE_AUTO_RESUME_DELAY_SECS: '0', GITHUB_REPOSITORY: FORGE_REPOSITORY })`.
   - Assert that `lastLine(result.stdout)` is `job: failed stop` and `j.prompts().length` is 3.
   - Assert that exactly **one** entry of `j.ghCalls()` contains `labels[]=sdlc-harness: failed`. The fixture has no pull request, so each `failed` report adds that label to the issue once. Today this count is 3, one per failed session.

   That suite is the one test file this fix edits, so it is the only one the fix runs. The full suite runs in the Run gates phase.
