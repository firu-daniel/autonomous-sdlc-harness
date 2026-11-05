### 1. A ledger-less resumed exit's local `paused` notification tells the user to "continue from the ledger" that does not exist

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`classify_run_exit`) — "to continue from the ledger"; and its self-adopted copy `scripts/autonomous-watcher.sh`, at the same anchor.

**The problem.** Task 3 now sends a ledger-less zero exit after a resume, a stall restart or an earlier park into the `unfinished` arm. In local mode that arm then sends:

```
notify paused "$branch" "$log_path" "the session ended before its ledger finished ($ledger_detail) — run /autonomous-sdlc-harness:branch-resume $branch to continue from the ledger"
```

For the new case, `$ledger_detail` is `absent: no ledger at …, after an answer resume`. The notification therefore says there is no ledger, and then tells the user to continue from it.

Task 9 changed `/autonomous-sdlc-harness:branch-status` for exactly this case: it now names the resume "without saying where it continues", because there is no `[ ]` entry. The push notification, which is what a person actually receives, still makes the old claim. A reader of the notification goes looking for a ledger that does not exist.

**Fix.** The fix keeps the ledger-less reason available at the notification and words that one case on its own. Make the same edit in both files, so that they stay byte-identical.

1. Declare `why` with the other ledger locals, so that it is set under `set -u` whichever branch runs. Change

   ```bash
       local ledger="" ledger_state="" ledger_detail=""
   ```

   to

   ```bash
       local ledger="" ledger_state="" ledger_detail="" why=""
   ```

   and inside the `absent` / `unreadable` block change `local why="" restarts` to `local restarts`.

2. Replace the local-mode `notify paused` in the `unfinished` arm (inside `if [ "$JOB_MODE" != "1" ]; then`) with:

   ```bash
        if [ -n "$why" ]; then
          notify paused "$branch" "$log_path" "the session exited 0 with no readable ledger ($ledger_detail) — run /autonomous-sdlc-harness:branch-resume $branch to continue"
        else
          notify paused "$branch" "$log_path" "the session ended before its ledger finished ($ledger_detail) — run /autonomous-sdlc-harness:branch-resume $branch to continue from the ledger"
        fi
   ```

3. In `cli/test/watcher-ledger-classification.test.mjs` → `assertResumedAbsent`, after `assert.ok(paused[0].detail.includes(RESUME_COMMAND), paused[0].detail);`, add:

   ```js
   assert.doesNotMatch(paused[0].detail, /continue from the ledger/, paused[0].detail);
   ```

Run only that file: `npm test --workspace cli -- test/watcher-ledger-classification.test.mjs`. The `task, unfinished` case still expects the existing wording, which this fix keeps for a ledger that exists.

**Deviations from plan:**
- Fix steps 1–2 were applied to `cli/templates/scripts/autonomous-watcher.sh` only. The self-adopted copy `scripts/autonomous-watcher.sh` lies outside this dispatch's `cli` path scope and was not edited; the two files now differ by exactly the step 1–2 edits until a dispatch on the layer owning `scripts/` (the catch-all `general` layer) makes the same edit there.
- The `general`-layer dispatch then applied steps 1–2 to `scripts/autonomous-watcher.sh`; `cmp` of the two copies now exits 0 with no output (byte-identical). Step 3's single-file run is not repeated by this dispatch: that test file was edited by the `cli` dispatch, not this one, and it grades the template, not `scripts/`.
