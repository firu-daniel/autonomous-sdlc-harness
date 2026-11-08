### 2. A push-refusal record written while the branch has no running session fails that branch's next launch at its first tick

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`spawn_engine`, `check_push_refusals`, `classify_run_exit`) — "branch with no `running` run is left in place."

`push-branch.sh` writes a record under `<main>/.git/harness-push-refusals/` on every refusal, whoever called it (`cli/templates/scripts/push-branch.sh` → "if ! hr_push_refusal_record"). Two callers do so while no autonomous session of that branch is running. One is a supervised `/autonomous-sdlc-harness:branch-*` flow, whose commit points call the same `push-branch.sh`, with the operator's own `GH_TOKEN` and `~/.git-credentials` in the scan. The other is an operator who runs `push-branch.sh` by hand, which the refusal's own way-on line suggests ("rewrite those commits without it, then push by hand"). Only `push_refusal_fail` moves a record to `handled/`, and it runs only for a `running` run (`check_push_refusals`) or at a session's exit (`classify_run_exit` → "if hr_push_refusals_for_var \"$MAIN_REPO\" \"$branch\""). The header's **PUSH REFUSALS (check_push_refusals)** paragraph states the gap as intended, ending "branch with no `running` run is left in place."

Nothing removes such a record when the branch's next session launches: `launch_run`, `run_job` and the resume passes reset only the registry's `push_refusing` / `push_refused` fields. So the next `check_push_refusals` tick after a launch, or that session's own `classify_run_exit`, finds the old record. It kills the new session, marks the run `failed` with `push refused: <old reason>` and sends a `failed` notification. That happens even when the operator has already rewritten the commits and the new session has not pushed at all. The run cannot be resumed past this until someone finds and moves the file by hand, and no document says where it is.

**Fix:** file every record that is older than a launch as handled, in the launching shell, just before the session starts. The record is still kept under `handled/`. A credential still in the commits is refused again by the new session's first push, because `push-branch.sh` re-scans the same commits.

1. In `spawn_engine`, after the `log "session environment for '$branch': removing …"` line and before the `registry_set "$branch" run_profile …` line, add:

   ```bash
     # A record already here predates this session (PUSH REFUSALS, in the
     # header): file it, so it cannot fail the run this launch starts. The
     # session's own first push re-scans the same commits.
     if hr_push_refusals_for_var "$MAIN_REPO" "$branch"; then
       log "push refusal: filing ${#HR_PUSH_REFUSAL_FILES[@]} record(s) older than this launch of '$branch' as handled (the first: $HR_PUSH_REFUSAL_REASON)"
       local stale_refusal
       for stale_refusal in "${HR_PUSH_REFUSAL_FILES[@]}"; do
         hr_push_refusal_handled "$stale_refusal" || log "push refusal: could not move $stale_refusal to handled/ for '$branch'"
       done
     fi
   ```

   Put the `local stale_refusal` beside the function's other `local` declarations if the file's style keeps them together.
2. Update the two comments that state the gap. Each sentence wraps across two comment lines, so replace the whole lines shown.
   - In the header's **PUSH REFUSALS (check_push_refusals)** paragraph, replace these two lines:

     ```bash
     # row comes from `remote-run.sh save`, never from this file. A record for a
     # branch with no `running` run is left in place.
     ```

     with:

     ```bash
     # row comes from `remote-run.sh save`, never from this file. A record for a
     # branch with no `running` run is left in place until that branch's next
     # launch, which files it as handled with one log line (spawn_engine), so a
     # refusal from a supervised or by-hand push never fails a later session.
     ```
   - In `check_push_refusals`'s doc comment, replace these two lines:

     ```bash
     # subshell already classified is skipped. A record whose branch has no
     # `running` run is left in place.
     ```

     with:

     ```bash
     # subshell already classified is skipped. A record whose branch has no
     # `running` run is left in place until that branch's next launch, which
     # files it as handled (spawn_engine).
     ```
3. In `cli/test/watcher-push-refusal.test.mjs`, add a case. Write a record for the branch through `hr_push_refusal_record` before the launch. Launch a session whose stub writes no record and exits 0 over a finished ledger. Assert that the run ends `completed`, that no `failed` notification was sent, and that the record is now under `.git/harness-push-refusals/handled/`. Extend the file's header rule with one sentence: a record that predates a launch is filed as handled, and it does not fail that launch. That test file is the one this fix edits, so it is the only test the fix runs.
