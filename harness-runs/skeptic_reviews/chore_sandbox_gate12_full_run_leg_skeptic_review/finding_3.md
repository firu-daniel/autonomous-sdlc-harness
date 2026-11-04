### 3. FR1's "Read from" covers its `--settings` clause, but not "cuts no copy", "renders no per-run copy" or "writes nothing under the machine state directory"

**File:** `docs/sandbox-verification.md` (`## 10. The full-run leg and the Gate 12 sandbox round`, row FR1, the **Read from** cell), which ends "is read from `spawn_engine`'s job-mode arm in `cli/templates/scripts/autonomous-watcher.sh`, not from the log." Also `docs/development.md` (**Gate 12** → **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** → the **FR1** bullet), whose `Read from:` clause carries the same sentence.

**The problem.** FR1's **Expected** cell makes four claims:

1. the job cuts no copy;
2. it renders no per-run copy;
3. it writes nothing under the machine state directory;
4. `run_profile_check` passes on the base profile, which is passed unchanged as `--settings`.

After the code review's Finding 1, the **Read from** cell covers claim 4. The check passing is read from the `job: launching run for '<branch>'` line with no `not launching` line after it, and the `--settings` half is explicitly read from the source. Nothing names a surface for claims 1–3, and §10's own **Reading a result.** rule says "A row is graded on what the named log line, artifact or ref shows".

Here is what the source shows for each:

- **Claim 1 is visible in the log.** `run_job` logs `job: launching run for '$branch' (engine=$engine) in $worktree (log: $log_path)`, and in job mode `worktree="$MAIN_REPO"`, the job's own checkout. So the line's `in <worktree>` shows no copy was cut.
- **Claims 2 and 3 are not logged anywhere.** They follow from `spawn_engine`'s `if [ "$JOB_MODE" = "1" ]` arm, which sets `settings_file="$SETTINGS_PROFILE"` and, per its own comment, "never reaches hr_run_profile_file or run_profile_render". The runner is discarded after the job, so the maintainer cannot inspect the machine state directory after the fact.

A maintainer grading FR1 from the named surface therefore grades three claims the surface does not show. One way, they pass them on the launch line alone. The other way, they mark the row `not run`. Neither is what the source supports.

**Fix.** Append the sentence below to FR1's **Read from** text, byte-identical in both places: the FR1 row's **Read from** cell in `docs/sandbox-verification.md` §10, and the end of the `Read from:` clause of the **FR1** bullet in `docs/development.md` (xvi), straight after "…in `cli/templates/scripts/autonomous-watcher.sh`, not from the log."

```
That the job cuts no copy is read from the same line's `in <worktree>`, which names the job's own checkout. That it renders no per-run copy and writes nothing under the machine state directory is not logged either: both are read from the same job-mode arm, which reaches neither `hr_run_profile_file` nor `run_profile_render`, and are recorded as read from the source, not observed.
```

These are documentation edits only, so no test runs for this fix.
