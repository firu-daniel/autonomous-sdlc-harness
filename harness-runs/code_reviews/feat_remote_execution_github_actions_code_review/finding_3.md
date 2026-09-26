### 3. A `restore --resume answer` refusal re-uploads the previous job's status, so the relayed answer is dropped with no notification

**File:** `cli/templates/scripts/remote-run.sh` (`verb_restore`) — "# Every entry is checked before any is written."

**Problem.** Under `--resume answer`, `verb_restore` does things in this order:

1. It downloads the previous bundle.
2. It calls `hr_remote_bundle_restore … job`, which places that bundle's `status.json` as `<state_dir>/autonomous_logs/remote_status.json`.
3. Only then does it check that each answer index has a top-level `question_<n>.md`. If one is missing it runs `restore_refuse` (exit 2).

When that check fails, the run workflow's `Restore the previous job's state` step fails and `Run the harness` is skipped. The `always()` / `!cancelled()` steps still run:

- `remote-run.sh save` finds `remote_status.json`, which is the restored copy from the previous job, and bundles it unchanged. It still carries that job's `status` (`parked`), its `decision` (`stop`), its `chain` and its `run_id`.
- `continue` reads `decision: stop` and does nothing: "job mode has already notified". This job's job mode never ran, so the user gets no notification at all.
- The next local `sync` takes this run's stale bundle as the newest. It sets the record back to `parked` and moves the mirror's clarification directory aside into `remote_superseded/`, answers included.

So a relayed answer the job refuses vanishes without a word, and the run looks parked again. The design already handles one refusal correctly: "no previous bundle under `--resume answer`" is refused before anything is restored. That leaves `save` with no status file, and `continue` sends `failed` ("The job stopped before the harness run started").

**Fix.** Check the answer indexes against the **downloaded** bundle before restoring it. A refusal then restores nothing, and the existing no-status path sends the `failed` notification.

- [ ] In `verb_restore`'s `else` arm, after the `gh_call run download …` block and before `hr_remote_bundle_restore "$download" "$root" "$branch" job`, insert:
  ```bash
    if [ "$resume" = answer ]; then
      # Checked against the downloaded bundle, before anything is restored: a refusal
      # must leave no restored status for `save` to re-upload as this job's own.
      for n in $(jq -n -r 'env.HARNESS_INPUT_ANSWERS | fromjson | keys_unsorted[]'); do
        [ -f "$download/$HR_REMOTE_CLARIFY_DIR/$branch/question_$n.md" ] \
          || restore_refuse "answer $n has no question_$n.md in the bundle of run $id; nothing restored, no answer written"
      done
    fi
  ```
- [ ] In the later `if [ "$resume" = answer ]` block, delete the first loop, the one whose comment is "# Every entry is checked before any is written." Keep the write loop.
- [ ] Update the header's exit map. In the `2` entry, replace "or an answer whose `question_<n>.md` is not at the top level — the bundle may already be restored, and no answer is written" with "or an answer whose `question_<n>.md` is not at the top level of the previous bundle — nothing is restored and no answer is written".
- [ ] In `cli/test/remote-run.test.mjs`, test `'restore --resume answer refuses an answer whose question is not at the top level, writing no answer'`:
  - Replace `assert.ok(existsSync(mirror(fx, 'question_1.md')), 'the bundle was not restored first');` with `assert.equal(existsSync(mirror(fx, 'question_1.md')), false, 'the bundle was restored before the refusal');`.
  - Add an assertion that `<state_dir>/autonomous_logs/remote_status.json` does not exist in the fixture.
