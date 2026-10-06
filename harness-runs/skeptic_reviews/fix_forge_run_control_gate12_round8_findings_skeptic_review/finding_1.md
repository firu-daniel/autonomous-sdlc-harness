### 1. The runner-wait note rides on every later automatic-resume comment of the job, blaming GitHub's queue for a restart it did not delay

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`run_job`) — the line `esac || registry_set "$branch" status failed` that closes the `case "$resume" in` launch block; and (`job_report`) — `if [ "$1" = "resumed" ] && [ -n "$JOB_RUNNER_WAIT_NOTE" ]; then`

**The problem.** `job_runner_wait` sets `JOB_RUNNER_WAIT_NOTE` once, at the top of `run_job`, when the job waited at least `RUNNER_WAIT_NOTE_SECS` (300 s) for a runner. Nothing ever clears it. `job_report` adds it to **every** `resumed` report the job sends, as `--note`. The job sends `resumed` in two kinds of place:

- at its own start, in `run_job`'s `case "$resume" in` block (`answer` and `pause`, except a `budget` continuation). This is the comment the note was designed for.
- in `job_auto_resume`, through `notify resumed "$branch" "$log_path" "automatic resume $count/$REMOTE_AUTO_RESUME_MAX after $why ($(job_label))"`. That runs after a failed exit or an overload self-pause, any time later in the same job, after `REMOTE_AUTO_RESUME_DELAY_SECS` (300 s by default).

So a job that waited, for example, 7 minutes for a runner and then auto-resumes two hours in posts a second comment on the issue or pull request:

> The harness run on `feat_x` resumed.
>
> GitHub took 7 minutes to start this job, so nothing moved until then.

A maintainer reading that comment concludes that GitHub held up this restart as well, when the restart was caused by the session's own failed exit and the wait happened hours earlier. Round 8, the round this branch fixes, saw 6- and 10-minute waits.

A job that starts with `resume none` (a first run) posts no `resumed` comment at its start. If it auto-resumes, its only `resumed` comment is the automatic resume's, and that comment carries the note even though the run had been working for hours before it.

**Why it is reachable.** `job_auto_resume` is called from the supervision loop in the main shell, `job_auto_resume … "an overload self-pause" && continue` and `job_auto_resume … "a failed exit" && continue`. Its `notify resumed` reaches `job_report` through the watcher's `notify`, which calls `job_report "$1" "$2" "${3:-}"` for every event but `failed` in job mode. `JOB_RUNNER_WAIT_NOTE` is a plain global in that shell, still set. The existing case `cli/test/watcher-remote-job.test.mjs` → `auto-resume: bounded, and reset by a user action` → "an unrequested PAUSE_ACK, then exit 0 on relaunch -> one auto-resume, completed" drives exactly this path. It just sets no runner wait.

The documents state the note as one comment per job:
- the header's `THE RUNNER WAIT` bullet says "A wait of at least RUNNER_WAIT_NOTE_SECS is noted on the job's `resumed` comment";
- `docs/remote-execution.md` → `### Runs longer than a job` → **The runner wait is logged.** says "is noted on the job's `resumed` comment";
- the story index says "its `resumed` report carries a note".

The code does more than that.

**Fix.** The note belongs only to the `resumed` comment the job posts as it starts. Clear it once that launch block has run.

- [ ] In `cli/templates/scripts/autonomous-watcher.sh` → `run_job`, directly after the line `esac || registry_set "$branch" status failed` that closes the `case "$resume" in` launch block, and before the `# The supervision loop:` comment, insert:

```bash
  # The runner-wait note belongs to the job's own start: a later automatic
  # resume's `resumed` comment never carries it (THE RUNNER WAIT in the header).
  JOB_RUNNER_WAIT_NOTE=""
```

- [ ] In the same file's header → `JOB MODE` → the `THE RUNNER WAIT` bullet, replace "A wait of at least RUNNER_WAIT_NOTE_SECS is noted on the job's `resumed` comment." with "A wait of at least RUNNER_WAIT_NOTE_SECS is noted on the `resumed` comment the job posts as it starts, never on a later automatic resume's."
- [ ] In `docs/remote-execution.md` → `### Runs longer than a job` → **The runner wait is logged.**, replace "a wait of at least `RUNNER_WAIT_NOTE_SECS` (300) is noted on the job's `resumed` comment." with "a wait of at least `RUNNER_WAIT_NOTE_SECS` (300) is noted on the `resumed` comment the job posts as it starts, never on a later automatic resume's."
- [ ] In `cli/test/watcher-remote-job.test.mjs` → `test('runner wait: logged from the run createdAt, and noted on a resumed comment only when long', …)`, add this subtest after the "a re-run attempt" one:

```js
  await t.test('a long wait, then an automatic resume: its resumed comment carries no note', async (t) => {
    const j = await createJobFixture(t);
    if (j === null) return;
    await wireForge(j, 'github');
    await j.setStub(`${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then : > "$STATE/PAUSE_ACK"; exit 0; fi`);
    const start = nowSecs();
    const result = await j.job([j.branch, 'task', 'none'], {
      HARNESS_JOB_STARTED_EPOCH: String(start),
      REMOTE_AUTO_RESUME_DELAY_SECS: '0',
      GITHUB_RUN_ID: '77',
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_REPOSITORY: FORGE_REPOSITORY,
      STUB_RUN_VIEW: JSON.stringify({ createdAt: iso(start - 600) }),
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /job: waited 600s for a runner/);
    const resumed = j.ghBodies().filter((b) => b.includes('resumed.'));
    assert.equal(resumed.length, 1, j.ghBodies().join('\n---\n'));
    assert.equal(resumed[0].includes('GitHub took'), false, resumed[0]);
  });
```

The two existing cases with `'pause'` and `pause_reason: 'user'` keep asserting the note on the job's start-of-job `resumed` comment, and still pass: their note is attached before the clear. Run only `npm test --workspace cli -- test/watcher-remote-job.test.mjs` as this unit's own verification.

**Deviations from plan:**
- The `docs/remote-execution.md` → `### Runs longer than a job` → **The runner wait is logged.** replacement is outside the `cli` layer's path scope (`docs/` belongs to `general`); not made in this `cli` dispatch. It needs a `general`-layer dispatch. Landed by the `general`-layer dispatch, as worded in the finding.
- The new subtest was not run against the unfixed watcher (no mutation run); its failing-before claim rests on the finding's reachability reading of `job_auto_resume` → `notify resumed` → `job_report`.
