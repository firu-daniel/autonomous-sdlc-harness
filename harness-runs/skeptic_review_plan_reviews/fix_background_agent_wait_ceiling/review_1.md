# Review plan meta-review — iteration 1

## Must Fix
1. **Finding 1 says three paths reach the stale-note clause, but a fourth one exists, and the finding tells the implementer to leave it alone** — refers to review finding #1. Offending file: `harness-runs/skeptic_reviews/fix_background_agent_wait_ceiling_skeptic_review/finding_1.md`. The index's Context needs a change too: its **Headline** says "Three paths reach that clause".
   Finding 1's defect class is a `paused` record that no pause produced, which the relaunch then treats as a pause that left a note. This branch adds a second write of that kind. In `cli/templates/scripts/autonomous-watcher.sh` → `classify_run_exit`, the zero-exit arm's job-mode held-reason branch was added on this branch (commit `efbe3e4e`, the code review's Finding 1):
   - it writes `registry_set "$branch" pause_reason "$held_reason" status paused`, with `held_reason` set to `user`, `usage` or `budget`;
   - it runs when the session exited 0 over an unfinished ledger **without** a `PAUSE_ACK`. That is the same session shape as the `unfinished` write: no note was appended to `PAUSE_PROGRESS.md`.

   Each held reason then reaches the note-naming clause:
   - **`usage`.** `run_job`'s `usage)` arm waits inside the job, and then `usage_gate` / `resume_paused_runs` relaunch the run through `resume_paused_run` → `spawn_engine … "" 1`. `pause_note_stale` is still at `run_job`'s cleared default, so the fork is told *"read <state_dir>/PAUSE_PROGRESS.md for the pause note"*.
   - **`budget` and `user`.** The bundle is written with `status: paused` and `pause_reason: budget` or `user`. The next `resume pause` job reads `prev_status=paused` with a `prev_reason` other than `unfinished`. Under step 6 of the fix it therefore keeps the carried note and names it. Any older pause note still in the append-only bundled file is then handed over as current — the finding-8 case the finding itself cites.

   Step 1 of the fix says *"Leave the job-mode held-reason write above it (`registry_set "$branch" pause_reason "$held_reason" status paused`) unchanged."* It gives no reason. The finding's own **The problem** section cites `harness-runs/lessons.md` → `## Unattended control loops`, which says a recovery covers every path the failure reaches and that leaving one out is never a documented residual. As written, the fix loop would ship a partial fix that the finding presents as complete.
   **Fix:** In `finding_1.md`, do one of the following.
   - **(a) Cover the held-reason write.**
     - For the in-job `usage` resume: add `pause_note_stale 1` to the held-reason `registry_set` in step 1, so the gate's relaunch gets the no-note clause.
     - For the cross-job `budget` / `user` resume: give a mechanism that tells a held pause apart from an acknowledged one across the bundle. One option is to carry the stale flag in `remote_status.json` and have `run_job` read it beside `prev_reason` in step 6. Another is a separate restored field.
     - Add one test per path in `cli/test/watcher-remote-job.test.mjs`.
     - Update the `THE PAUSE NOTE` header bullet, the registry `pause_note_stale` entry, `plugin/instructions/autonomous_pause_and_ledger.md` → `### 2.3 Resuming` and `docs/remote-execution.md` to match.
   - **(b) Keep it out of scope, with an explicit argument.** Replace the "Leave … unchanged" sentence with a rationale that names the held-reason write and says why a relaunch after it does not reach a stale note. For example, if a held pause always also leaves a note of this run's, cite the code site that writes that note. Then add the same rationale to the index's Context and correct the Headline's "Three paths" count.

   Whichever option is taken, the index's Headline count and the finding's title ("the in-job auto-resume, the local resume and the cross-job resume") must match the paths the finding actually covers.
