# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 3's fix tells the unit to run a test file it neither creates nor edits** — refers to review finding #3. Offending file: `harness-runs/code_reviews/fix_remote_job_commit_refusal_code_review/finding_3.md`.
   The fix changes only `cli/templates/github/workflows/harness-run.yml` (`Push the branch`). Its closing paragraph then says: "`cli/test/workflow-templates.test.mjs` → `Push the branch annotates a refusal or a given-up push, and never fails the job` already asserts … Run only that file: `npm test --workspace cli -- test/workflow-templates.test.mjs`." The fix does not create or edit that file, and `harness.config.json` → `treeGuards` does not list it. `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 4, forbids any finding fix from naming such a run.
   **Fix:** in `finding_3.md`, do one of two things:
   - drop the "Run only that file: …" sentence, and say the fix owes no test run of its own because the full suite runs in Run gates; or
   - make the fix edit `cli/test/workflow-templates.test.mjs`. Give the exact assertion to add to the named case, for example one checking that the step body pipes `push-branch.sh` through `tee "$log"` rather than redirecting it with `> "$log"`. The file then becomes the unit's own edited test file, and the run is allowed.

2. **The diff touches the `plugin` layer, and the review shows no check drawn from `.claude/context/plugin.md`** — Structure. Offending file: `harness-runs/code_reviews/fix_remote_job_commit_refusal_code_review.md` (the index).
   The diff changes `plugin/commands/branch-status.md` (Task 9). The index's Context only lists it among the reviewed files ("the `plugin/commands/branch-status.md` `unfinished` bullet (Task 9)"). No plugin finding exists, and no clean-pass rationale drawn from that layer's conventions document appears. Two examples of what such a check covers:
   - the new bullet quotes the watcher's log literal `not classifying it completed` as a wire, and it must match `cli/templates/scripts/autonomous-watcher.sh` → `classify_run_exit` byte for byte (*"Never paraphrase a wire literal"*);
   - the bullet must keep `<state_dir>` and `<MAIN_REPO>` as placeholders and introduce no adopter literal (*"No adopter's value is ever a literal here"*).

   Both hold on the current diff, so a clean pass is the expected outcome, but the review has to show it.
   **Fix:** in the index, add a `**Plugin layer.**` clean-pass paragraph to the Context's headline conclusions, or to `## Out of scope / verified-OK (intentional divergences / call-outs)`. It must state that the Task 9 bullet's quoted log literal `not classifying it completed` matches the watcher's `classify:` log line (template and self-adopted copy) and that the bullet introduces no adopter literal and keeps its placeholders. Add no readiness entry, because this is a clean pass rather than a finding.
