### 4. `HR_REMOTE_STATE_WHY` is assigned on every resolution and read by nothing

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_state_dir_var`) — "HR_REMOTE_STATE_WHY="

`hr_remote_state_dir_var` declares four output globals in its contract. One of them, `HR_REMOTE_STATE_WHY` ("one sentence naming the source and why it applies"), is cleared at entry and assigned in both the trusted branch and the checkout branch. Nothing reads it, in the library or in any template script: `grep -rn HR_REMOTE_STATE_WHY cli/templates/scripts` finds only the header's NAMING list, the function's contract and the three assignments. `remote-run.sh` → `remote_state_difference` reads `HR_REMOTE_STATE_FROM`, `HR_REMOTE_STATE_DIR` and `HR_REMOTE_STATE_CHECKOUT`, never `HR_REMOTE_STATE_WHY`. The library has its own rule for this kind of output: *"a reader nothing calls is dead surface"* (the typed-readers block, on `clientEnvPrefix`). Here the dead surface is an output nobody reads. Task 1's plan carried out the prompt's "say which source applies and why" in the function's header comment (`IN A JOB …` / `OUTSIDE A JOB …`) and in `docs/cli.md` §6 residual 1 item 4. Both already say it, so the variable adds nothing.

**Fix:** remove the variable. In `cli/templates/scripts/lib/harness-run-lib.sh`:

1. In the header's NAMING paragraph, change
   ```
   # (`hr_remote_move_aside`), `HR_REMOTE_STATE_DIR`, `HR_REMOTE_STATE_FROM`,
   # `HR_REMOTE_STATE_WHY` and `HR_REMOTE_STATE_CHECKOUT`
   ```
   to
   ```
   # (`hr_remote_move_aside`), `HR_REMOTE_STATE_DIR`, `HR_REMOTE_STATE_FROM`
   # and `HR_REMOTE_STATE_CHECKOUT`
   ```
2. In `hr_remote_state_dir_var`'s comment, delete the line
   ```
   #   HR_REMOTE_STATE_WHY       one sentence naming the source and why it applies
   ```
3. In its body, delete the three lines `HR_REMOTE_STATE_WHY=''`, `HR_REMOTE_STATE_WHY="stateDir is read from harness.config.json at the recorded default-branch commit …"` and `HR_REMOTE_STATE_WHY="stateDir is read from the checkout's own harness.config.json, …"`.

Change nothing else. The `IN A JOB` / `OUTSIDE A JOB` header paragraphs stay as they are, because they are what states the source and the reason. This fix edits no test file and runs none; Phase G's full suite covers `cli/test/remote-save-links.test.mjs`, the suite that drives this function.
