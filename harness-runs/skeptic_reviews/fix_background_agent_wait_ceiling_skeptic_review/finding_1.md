### 1. Every relaunch after a zero exit over an unfinished ledger is told to read a pause note no pause wrote — the in-job auto-resume, the in-job usage relaunch, the local resume and the cross-job resume

**File:** `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/lib/harness-run-lib.sh`, at these sites:

- `classify_run_exit`, the zero-exit arm's two `paused` writes over an unfinished ledger: the job-mode held-reason write "registry_set \"$branch\" pause_reason \"$held_reason\" status paused" and the `unfinished` write "registry_set \"$branch\" status paused pause_reason unfinished";
- `classify_run_exit`, the local `PAUSE_ACK` arm: "registry_set \"$branch\" status paused pause_reason \"\"";
- `spawn_engine`, the pause-resume clause's gate: "if [ -n \"$pause_resume\" ] && [ \"$JOB_MODE\" = \"1\" ]; then";
- `run_job`, the pause-note block after the bundle seed: "if [ \"$resume\" = \"pause\" ] && { [ \"$prev_status\" != \"paused\" ] || [ \"$prev_engine\" != \"$engine\" ]; }; then", and the move-aside test below it: "if ! { [ \"$resume\" = \"pause\" ] && [ \"$prev_status\" = \"paused\" ] && [ \"$prev_engine\" = \"$engine\" ]; } \\";
- `harness-run-lib.sh` → `hr_remote_status_write`, the `jq -n` call that writes the bundle's `status.json`.

**The problem.** The project has a rule that job mode follows: *the pause note belongs to the run that wrote it*. It is stated in the watcher header's JOB MODE → `THE PAUSE NOTE` bullet, in `plugin/instructions/autonomous_pause_and_ledger.md` → `### 2.3 Resuming`, and in `docs/remote-execution.md` (*"The pause note belongs to the run that wrote it."*). The rule reads: *"A pause resume whose previous job did not pause, or paused for a different engine, is re-launched with a clause saying there is no pause note, whether or not a note was carried."* It was added for Gate 12 round 6, finding 8 (`docs/development.md`): a resume after a stop was launched as a resume from a pause and was handed a stale note.

This branch adds two `paused` writes that no pause produced. Both are in `classify_run_exit`'s zero-exit arm, and both run when a session exits 0 over an unfinished ledger **without** a `PAUSE_ACK`, so that session appended nothing to `PAUSE_PROGRESS.md`:

- the `unfinished` write, `status paused pause_reason unfinished`;
- in job mode, the held-reason write `pause_reason "$held_reason" status paused` (commit `efbe3e4e`, the code review's Finding 1), which keeps a pending `user`, `usage` or `budget` pause over `unfinished`. The `PAUSE` that pause dropped was never honoured: the session exited without writing `PAUSE_ACK`.

Neither write touches `pause_note_stale`. Four relaunch paths then reach `spawn_engine … "" 1`, and each one hands the fork *"This is a RESUME from a PAUSE: read <state_dir>/PAUSE_PROGRESS.md for the pause note"*. The file it names is either missing or an earlier pause's note, whose phase and "next step" are out of date.

1. **The in-job auto-resume — the default job path.** `run_job`'s new `unfinished)` arm calls `job_auto_resume`, which runs `begin_pause_resume` and then `spawn_engine "$branch" "$worktree" "$log_path" "" 1`. `run_job` cleared `pause_note_stale` with its fresh-launch defaults, and nothing in between sets it. So every auto-resume of an `unfinished` session in a `resume none` job, or in a `resume pause` job that followed a real pause, names the note. `cli/test/watcher-remote-job.test.mjs` → `'an unfinished ledger every session -> one auto-resume, then paused / unfinished / stop'` currently *asserts* this behaviour: `assert.match(j.prompts()[1], /RESUME from a PAUSE/)`.
2. **The in-job usage relaunch after a held `usage` pause.** `run_job`'s `usage)` arm waits inside the job. `usage_gate` drops `RESUME` when the window resets, and `resume_paused_runs` → `resume_paused_run` runs `spawn_engine "$branch" "$worktree" "$log_path" "" 1`. `pause_note_stale` is still at `run_job`'s cleared default, so the fork is told to read the note.
3. **The local resume.** The local `unfinished` write logs, and notifies, *"run /autonomous-sdlc-harness:branch-resume $branch to continue from the ledger"*. `resume_paused_run` then runs `begin_pause_resume` and `spawn_engine "$branch" "$worktree" "$log_path" "" 1`. `spawn_engine` reads `pause_note_stale` only `if [ -n "$pause_resume" ] && [ "$JOB_MODE" = "1" ]`, so a local resume of an `unfinished` run always names `PAUSE_PROGRESS.md`. Before this branch, no local path reached the pause-resume clause without a real pause.
4. **The cross-job resume.** The job ends with the bundle saying `status: paused` and a `pause_reason` of `unfinished` (once the auto-resumes run out), `budget` (decision `continue`), `user` (decision `stop`) or `usage` (decision `wait-poller`, when the in-job wait is ruled out). Each is continued by a `resume pause` job: the chained continuation, the user's `hr_github_resume_route`, or the poller. That job reads `prev_status=paused` and `prev_engine=<same>`, so it does not set `pause_note_stale`. It also keeps any carried `PAUSE_PROGRESS.md` instead of moving it aside. Because the note is append-only and travels in the bundle, a run that paused for real earlier gives the resumed fork that earlier pause's note. This is exactly the stale-note case finding 8 fixed. The reason alone cannot tell these cases apart: a `budget`, `user` or `usage` bundle is also what a real, acknowledged pause writes (the job-mode `PAUSE_ACK` arm). So the bundle has to carry the stale flag itself.

`harness-runs/lessons.md` → `## Unattended control loops` makes all four paths one fix: *"A recovery for an unattended run's failure covers every execution mode the failure reaches, the local watcher and the remote job alike."*

**Why one registry flag, carried in the bundle, covers all four paths.**

- If both zero-exit writes set `pause_note_stale 1`, and `spawn_engine` reads the field in both modes, then `job_auto_resume` (path 1) and `resume_paused_run` (paths 2 and 3) both get the no-note clause. Neither function needs a change.
- `run_job` clears the field at job start, so path 4 needs the field to cross the job boundary. `hr_remote_status_write` writes it into `status.json`, and `run_job` reads it as `prev_note_stale` beside `prev_status` and `prev_engine`. Every bundle written after one of the two writes carries `1`. A real pause's `PAUSE_ACK` arm clears the field, so its bundle carries an empty value and its note is still kept and named. A bundle written before this field existed has no key: `hr_remote_status_get` exits 1, the value reads empty, and nothing changes for it.

The field then has to be cleared wherever a later relaunch *does* have a note of this run's:
- `classify_run_exit`'s job-mode `PAUSE_ACK` arm already clears it;
- the local `PAUSE_ACK` arm must clear it too;
- the stall watchdog's restart overwrites `PAUSE_PROGRESS.md` with its own teardown note and then calls `spawn_engine "$b" "$worktree" "$log_path" "" 1`, so it must clear the field before that spawn. Otherwise a stall during the resumed session would hide the note the watchdog just wrote;
- `launch_run` must clear it with its other reused-key resets, so a new run on a reused branch key does not inherit it.

**Fix:**

1. In `cli/templates/scripts/autonomous-watcher.sh` → `classify_run_exit`, in the zero-exit arm's unfinished-ledger branch, make both `paused` writes set the field.
   - The job-mode held-reason write. Change:

     ```bash
     registry_set "$branch" pause_reason "$held_reason" status paused
     ```

     to:

     ```bash
     # The pending pause was never acknowledged, so this session wrote no
     # note either: the relaunch must not name one (`pause_note_stale`).
     registry_set "$branch" pause_reason "$held_reason" status paused pause_note_stale 1
     ```

   - The `unfinished` write. Change:

     ```bash
     registry_set "$branch" status paused pause_reason unfinished
     ```

     to:

     ```bash
     # The session wrote no pause note, so the relaunch must not name one —
     # job_auto_resume and resume_paused_run alike (`pause_note_stale`).
     registry_set "$branch" status paused pause_reason unfinished pause_note_stale 1
     ```

2. In the same function, in the local `PAUSE_ACK` arm, change:

   ```bash
   registry_set "$branch" status paused pause_reason ""
   ```

   to:

   ```bash
   registry_set "$branch" status paused pause_reason "" pause_note_stale ""
   ```

3. In `spawn_engine`, change the gate and its comment from:

   ```bash
   # JOB MODE ONLY: `pause_note_stale` (see the registry) swaps the note-naming
   # opening for the stop/kill one; a local record never carries the field.
   local pause_note_stale=""
   if [ -n "$pause_resume" ] && [ "$JOB_MODE" = "1" ]; then
   ```

   to:

   ```bash
   # `pause_note_stale` (see the registry) swaps the note-naming opening for the
   # stop/kill one, in job mode and locally alike.
   local pause_note_stale=""
   if [ -n "$pause_resume" ]; then
   ```

4. In the stall watchdog's restart (the block that writes `Auto-recovered by the stall-watchdog at %s.` to `"$worktree/$note_rel"`), change:

   ```bash
   registry_set "$b" stall_warned ""
   registry_set "$b" status running
   if ! spawn_engine "$b" "$worktree" "$log_path" "" 1; then
   ```

   to:

   ```bash
   registry_set "$b" stall_warned ""
   # The note just written is this run's, so the relaunch names it.
   registry_set "$b" pause_note_stale ""
   registry_set "$b" status running
   if ! spawn_engine "$b" "$worktree" "$log_path" "" 1; then
   ```

5. In `launch_run`, change:

   ```bash
   registry_set "$branch" paused_by "" usage_resume_at "" pause_reason ""
   ```

   to:

   ```bash
   registry_set "$branch" paused_by "" usage_resume_at "" pause_reason "" pause_note_stale ""
   ```

6. In `cli/templates/scripts/lib/harness-run-lib.sh`, carry the field in the bundle.
   - In `hr_remote_status_write`'s `jq -n` call, add this line after the `--arg pause_reason "$reason" \` line:

     ```bash
     --arg pause_note_stale "$(hr_registry_get "$registry" "$branch" pause_note_stale)" \
     ```

     In the filter, change `pause_reason: $pause_reason, usage_resume_at: $usage_resume_at,` to `pause_reason: $pause_reason, pause_note_stale: $pause_note_stale,` and put `usage_resume_at: $usage_resume_at,` at the start of the next line, before `park_loop_cycles: $park_loop_cycles,`.
   - In the `status.json` field list of the format comment above `hr_remote_names_var`, insert this entry after the `pause_reason` entry (the one ending `not from a bundle`) and before `usage_resume_at`:

     ```
     #   pause_note_stale        `1` when the run's next pause resume must not name
     #                           PAUSE_PROGRESS.md, because the session that left
     #                           the record `paused` wrote no note; empty otherwise.
     #                           An absent key reads as empty
     ```

7. In `autonomous-watcher.sh` → `run_job`:
   - Change the declaration `local prev_status="" prev_engine="" aside_rc` to `local prev_status="" prev_engine="" prev_note_stale="" aside_rc`.
   - Inside `if [ -f "$remote_status" ]; then`, after the `prev_engine=…` line, add:

     ```bash
     prev_note_stale="$(hr_remote_status_get "$remote_status" pause_note_stale)" || prev_note_stale=""
     ```

   - Change the stale-clause test and its log line from:

     ```bash
     if [ "$resume" = "pause" ] && { [ "$prev_status" != "paused" ] || [ "$prev_engine" != "$engine" ]; }; then
       registry_set "$branch" pause_note_stale 1
       log "job: '$branch' resumes after a job that did not pause for engine $engine (prev_status '${prev_status}', prev_engine '${prev_engine}') — no pause note"
     fi
     ```

     to:

     ```bash
     if [ "$resume" = "pause" ] && { [ "$prev_status" != "paused" ] || [ "$prev_note_stale" = "1" ] || [ "$prev_engine" != "$engine" ]; }; then
       registry_set "$branch" pause_note_stale 1
       log "job: '$branch' resumes after a job that did not pause for engine $engine (prev_status '${prev_status}', prev_note_stale '${prev_note_stale}', prev_engine '${prev_engine}') — no pause note"
     fi
     ```

   - In the same block, change the move-aside test from:

     ```bash
     if ! { [ "$resume" = "pause" ] && [ "$prev_status" = "paused" ] && [ "$prev_engine" = "$engine" ]; } \
     ```

     to:

     ```bash
     if ! { [ "$resume" = "pause" ] && [ "$prev_status" = "paused" ] && [ "$prev_note_stale" != "1" ] && [ "$prev_engine" = "$engine" ]; } \
     ```

   - In the `0)` arm's `log` line on the next lines, add `prev_note_stale '${prev_note_stale}', ` after `prev_status '${prev_status}', `.
   - In the comment above that block, change `the clause reads the restored status alone` to `the clause reads the restored status and pause_note_stale alone`.

8. In `autonomous-watcher.sh`, update the two comments that state the rule. Re-wrap the comment lines after each edit.
   - **The header's JOB MODE → `THE PAUSE NOTE` bullet.**
     - Change `the job reads the restored \`remote_status.json\`'s \`status\` and \`engine\`` to `the job reads the restored \`remote_status.json\`'s \`status\`, \`pause_note_stale\` and \`engine\``.
     - Change `the restored \`remote_status.json\` says \`status: paused\`, and its \`engine\` equals the job's engine` to `the restored \`remote_status.json\` says \`status: paused\` without \`pause_note_stale: 1\`, and its \`engine\` equals the job's engine`.
     - Change `a pause resume whose previous job did not pause (a stop or a kill)` to `a pause resume whose previous job did not pause (a stop, a kill, or a zero exit over an unfinished ledger)`.
     - Change the later sentence `a pause resume whose previous job did not pause, or paused for a different engine,` to `a pause resume whose previous job did not pause — a stop, a kill, or a zero exit over an unfinished ledger — or paused for a different engine,`.
     - After that sentence's closing `(\`pause_note_stale\` in the registry).`, append: `The same clause goes to every relaunch after a zero exit over an unfinished ledger, recorded as \`unfinished\` or as the \`user\`, \`usage\` or \`budget\` pause that session left unacknowledged: within a job, in a later job, and outside job mode on a local resume. classify_run_exit sets \`pause_note_stale\` there, because that session wrote no note, and hr_remote_status_write carries it to the next job.`
   - **The registry field list → `pause_note_stale`.** Replace the whole entry (from `pause_note_stale    job mode only:` through `just wrote its own note for a later relaunch to read`) with:

     ```
     #   pause_note_stale    `1` when spawn_engine's pause-resume prompt must say
     #                       there is no pause note instead of naming
     #                       PAUSE_PROGRESS.md. Set by run_job when a `pause` job's
     #                       restored `status.json` was not `paused`, carried
     #                       `pause_note_stale: 1`, or named another engine; and by
     #                       classify_run_exit's two writes for a zero exit over an
     #                       unfinished ledger (`unfinished`, and job mode's held
     #                       `user` / `usage` / `budget`), since that session wrote
     #                       no note. Written into the bundle by
     #                       lib/harness-run-lib.sh's hr_remote_status_write.
     #                       Cleared by launch_run, with run_job's fresh-launch
     #                       defaults, by classify_run_exit's pause arm in both
     #                       modes, whose session just wrote its own note for a
     #                       later relaunch to read, and by the stall watchdog's
     #                       restart, which writes one
     ```

9. In `plugin/instructions/autonomous_pause_and_ledger.md` → `### 2.3 Resuming`, make three replacements and one addition:
   - Change `the restored \`remote_status.json\` says \`status: paused\`, and its \`engine\` equals the job's engine` to `the restored \`remote_status.json\` says \`status: paused\` without \`pause_note_stale: 1\`, and its \`engine\` equals the job's engine`.
   - Change `a pause resume whose previous job did not pause (a stop or a kill)` to `a pause resume whose previous job did not pause (a stop, a kill, or a zero exit over an unfinished ledger)`.
   - Change `A pause resume whose previous job did not pause, or paused for a different engine, is re-launched` to `A pause resume whose previous job did not pause — a stop, a kill, or a zero exit over an unfinished ledger — or paused for a different engine, is re-launched`.
   - Immediately before `That fork resumes from §1.7 alone.`, insert: `In both modes, any relaunch after a zero exit over an unfinished ledger gets the same clause, whether the run was recorded \`unfinished\` or kept the \`user\`, \`usage\` or \`budget\` pause that session never acknowledged: job mode's automatic resume and in-job usage resume, a later job's pause resume, and a local resume alike.`
10. In `docs/remote-execution.md`, in the paragraph opening **The pause note belongs to the run that wrote it.**, make the same three replacements as in step 9; the paragraph matches §2.3 word for word at all three sites. Then insert the step 9 sentence immediately before ` **Reason:** Gate 12 round 6, finding 8`.
11. Copy `cli/templates/scripts/autonomous-watcher.sh` byte for byte over `scripts/autonomous-watcher.sh`, and `cli/templates/scripts/lib/harness-run-lib.sh` byte for byte over `scripts/lib/harness-run-lib.sh`. Confirm with `cmp` that each pair is identical.
12. Make these test changes in `cli/test/watcher-remote-job.test.mjs`:
    - **The cross-job path.** In `test('pause note: kept only for a pause resume of a paused job of the same engine', …)`, add these two subtests after `'restored paused, same engine + a note, resume pause: the note is named and kept byte-identical'`:

      ```js
      for (const reason of ['unfinished', 'budget']) {
        await t.test(`restored paused / ${reason} with pause_note_stale, same engine + a note, resume pause: stop/kill clause, note moved aside`, async (t) => {
          const f = await fixture(t, { restored: { status: 'paused', engine: 'task', pause_reason: reason, pause_note_stale: '1' }, note: true });
          if (f === null) return;
          const result = await f.j.job([f.j.branch, 'task', 'pause']);
          assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
          const prompt = f.j.prompts().at(-1);
          assert.match(prompt, STOP_KILL);
          assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
          f.assertMovedAside(`${reason} stale`);
        });
      }
      ```

    - **The in-job auto-resume.** In `test('unfinished: a zero exit over an unfinished ledger is resumed, bounded, then reported', …)` → `'an unfinished ledger every session -> one auto-resume, then paused / unfinished / stop'`, replace:

      ```js
      assert.match(j.prompts()[1], /RESUME from a PAUSE/);
      ```

      with:

      ```js
      assert.match(j.prompts()[1], /RESUME after the previous job was stopped or ended without pausing: there is no pause note/);
      assert.doesNotMatch(j.prompts()[1], /PAUSE_PROGRESS\.md/);
      ```

      and after `assert.equal(j.status().pause_reason, 'unfinished');` add `assert.equal(j.status().pause_note_stale, '1');`.
    - **The held writes reach the bundle.** In the same `test(…)`, in each of `"a user's pause survives an unfinished exit -> paused / user / stop, no auto-resume"`, `'a usage pause pending at an unfinished exit -> paused / usage / wait-poller, no auto-resume'` and `'a budget pause pending at an unfinished exit -> paused / budget / continue, no auto-resume'`, add `assert.equal(j.status().pause_note_stale, '1');` after its `pause_reason` assertion.
    - **The in-job usage relaunch.** In the same `test(…)`, add this subtest after the budget one:

      ```js
      await t.test('a usage pause pending at an unfinished exit, reset in the job -> the relaunch names no pause note', async (t) => {
        const j = await createJobFixture(t);
        if (j === null) return;
        const copy = await stageLedger(j, taskLedger(j.branch, []));
        await j.setStub(
          `${COUNT_LAUNCH}\nif [ "$n" = 1 ]; then ${rateLimitRejected(REPEAT_RESET_AHEAD_SECS)}; for i in $(seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}); do if [ -f "$STATE/PAUSE" ]; then break; fi; sleep 0.1; done; ${copy}; fi\nexit 0`,
        );
        const result = await j.job([j.branch, 'task', 'none'], {
          USAGE_CHECK_INTERVAL_SECS: '1',
          USAGE_RESUME_MARGIN_SECS: '0',
          REMOTE_AUTO_RESUME_DELAY_SECS: '0',
          REMOTE_AUTO_RESUME_MAX: '0',
        });
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        assert.equal(lastLine(result.stdout), 'job: paused stop');
        assert.equal(j.prompts().length, 2);
        assert.match(j.prompts()[1], /RESUME after the previous job was stopped or ended without pausing: there is no pause note/);
        assert.doesNotMatch(j.prompts()[1], /PAUSE_PROGRESS\.md/);
      });
      ```

      The first session exits 0 over an unfinished ledger with the usage gate's `PAUSE` unacknowledged, so the held `usage` write fires; the in-job wait relaunches it once; the second session exits 0 over the same ledger, and `REMOTE_AUTO_RESUME_MAX: '0'` ends the job `paused stop`.
    - **The file header.** In the `unfinished:` RED ONCE sentence, append three mutations: *`pause_note_stale 1` dropped from `classify_run_exit`'s `unfinished` write → the auto-resume prompt names `PAUSE_PROGRESS.md`*; *`pause_note_stale 1` dropped from its held-reason write → the in-job usage relaunch case names `PAUSE_PROGRESS.md`*; and *`pause_note_stale` dropped from `hr_remote_status_write` → both restored `pause_note_stale` pause-note cases show the note named and kept*.
13. In `cli/test/watcher-ledger-classification.test.mjs`, which covers the local path:
    - Add these two tests after `test('hygiene: resuming an unfinished pause to a finished ledger leaves no pause_reason', …)`:

      ```js
      const NO_NOTE = /RESUME after the previous job was stopped or ended without pausing: there is no pause note/;

      test('note, unfinished: a local resume after an unfinished exit names no pause note', async (t) => {
        const f = await createWatcherFixture(t);
        if (f === null) return;

        await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({})));
        assertUnfinished(f);
        assert.equal(f.record().pause_note_stale, '1', f.watcherLog());

        await resumeOnce(f, ':', 'task', false);

        const prompt = f.prompts().at(-1);
        assert.match(prompt, NO_NOTE);
        assert.doesNotMatch(prompt, /PAUSE_PROGRESS\.md/);
      });

      test('note, real pause: a PAUSE_ACK after an unfinished exit restores the note-naming resume', async (t) => {
        const f = await createWatcherFixture(t);
        if (f === null) return;

        await resumeOnce(f, await writesFile(f, TASK_LEDGER, taskLedger({})));
        assertUnfinished(f);

        await resumeOnce(f, `: > ${STATE_DIR}/PAUSE_ACK`, 'task', false);
        assert.equal(f.record().status, 'paused', f.watcherLog());
        assert.equal(f.record().pause_note_stale ?? '', '', f.watcherLog());

        await resumeOnce(f, ':', 'task', false);

        assert.match(f.prompts().at(-1), /RESUME from a PAUSE: read sdlc-harness\/PAUSE_PROGRESS\.md/);
      });
      ```

    - Append to the file header's mutation list: *`spawn_engine`'s `pause_note_stale` read kept job-mode only → `note, unfinished` fails; the `pause_note_stale` clear dropped from the local `PAUSE_ACK` arm → `note, real pause` fails.*
14. Run each mutation from steps 12 and 13 once against the fixture's installed copy of the watcher or its library, never the tracked template, and confirm the case it names goes red. No suite drives a stall-watchdog restart's prompt, and step 4's clear has no case of its own. Then run the two edited files once each:
    - `npm test --workspace cli -- test/watcher-remote-job.test.mjs`
    - `npm test --workspace cli -- test/watcher-ledger-classification.test.mjs`

    Those are the only tests this fix runs.
