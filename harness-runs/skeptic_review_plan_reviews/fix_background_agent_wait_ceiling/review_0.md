# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 1 fixes only the cross-job resume. Two other relaunch paths this branch opens to `unfinished` keep the same defect** — refers to review finding #1. Offending file: `harness-runs/skeptic_reviews/fix_background_agent_wait_ceiling_skeptic_review/finding_1.md`. The index needs a change too if a finding is added.
   Finding 1's defect is that a relaunch after an `unfinished` exit is told *"This is a RESUME from a PAUSE: read <state_dir>/PAUSE_PROGRESS.md for the pause note"*. The session before it wrote no note, so the named file is either missing or an earlier pause's stale note. The fix only changes `run_job`'s restored-bundle tests. But this branch's `unfinished` classification reaches `spawn_engine`'s pause-resume clause on two more paths, and neither goes through those tests:
   - **The in-job auto-resume.** `run_job`'s new `unfinished)` arm calls `job_auto_resume`, which runs `begin_pause_resume` and then `spawn_engine "$branch" "$worktree" "$log_path" "" 1`. `classify_run_exit`'s `unfinished` write (`registry_set "$branch" status paused pause_reason unfinished`) leaves `pause_note_stale` as it was, and `run_job` cleared it at job start. So every auto-resume of an `unfinished` session in a `resume none` job, or in a `resume pause` job that followed a real pause, gets the clause that names the note. This is the default job path, and it runs before the cross-job resume the finding covers.
   - **The local watcher.** `classify_run_exit` writes the same `paused` / `unfinished` record locally. Its log line tells the user to resume with `/autonomous-sdlc-harness:branch-resume`. `resume_paused_run` then relaunches with `spawn_engine … "" 1`, and `spawn_engine` reads `pause_note_stale` only `if [ -n "$pause_resume" ] && [ "$JOB_MODE" = "1" ]`. So a local resume of an `unfinished` run always names `PAUSE_PROGRESS.md`. Before this branch, no local path reached the pause-resume clause without a real pause.
   This is the class covered by the `harness-runs/lessons.md` → `## Unattended control loops` entry: *"A recovery for an unattended run's failure covers every execution mode the failure reaches, the local watcher and the remote job alike. Leaving a mode out is a question to the user before the plan ships, never a documented residual."* No finding covers either path, and no clean-pass rationale in the index's Context or in `finding_1.md` addresses them.
   **Fix:** In `finding_1.md`, widen the fix so a relaunch after an `unfinished` exit gets the no-note clause on all three paths:
   - in `run_job`, the cross-job resume, as the fix already does;
   - on the in-job auto-resume, for example by having `classify_run_exit`'s `unfinished` write, or the `unfinished)` arm before `job_auto_resume`, set `pause_note_stale 1`;
   - on the local `resume_paused_run`, for example by keying `spawn_engine`'s stale clause on `pause_reason` `unfinished` in local mode as well, instead of only on `JOB_MODE` = `1`.

   The same finding must also:
   - update the comments and prose that state the rule: the `spawn_engine` comment *"JOB MODE ONLY: `pause_note_stale` … a local record never carries the field"*, the registry `pause_note_stale` entry, and `plugin/instructions/autonomous_pause_and_ledger.md` → `### 2.3 Resuming`;
   - add one test per path to the test file(s) it edits.

   Alternatively, add a separate `finding_2.md` for the two missed paths, with its own `### 2. …` pointer and `N. [ ] **Finding 2**` readiness entry in the index. If the author judges either path harmless, the index's Context must instead give an explicit clean-pass rationale for that path, naming `job_auto_resume` and `resume_paused_run`.

## Nice to Have
1. **Step 3's third-sentence edit has no counterpart in steps 4 and 5** — refers to review finding #1. Offending file: `finding_1.md`.
   Step 3 rewrites the watcher header's later sentence (*"a pause resume whose previous job did not pause, or paused for a different engine,"*) to list the `unfinished` exit. Steps 4 and 5 make only two replacements each, so the matching sentence in `autonomous_pause_and_ledger.md` → `### 2.3 Resuming` (*"A pause resume whose previous job did not pause, or paused for a different engine, is re-launched with a clause…"*) and in `docs/remote-execution.md` stays as it is. After the fix, the three statements of the rule will differ.
   **Fix:** In `finding_1.md`, add that third replacement to steps 4 and 5, or drop it from step 3.
