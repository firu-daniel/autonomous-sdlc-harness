# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 8's fix runs a test file it neither creates nor edits** — refers to review finding #8. Offending file: `harness-runs/code_reviews/fix_forge_run_control_gate12_round8_findings_code_review/finding_8.md`.
   The fix changes only the two `placement_fail` / `review_fail` strings in `cli/templates/scripts/remote-run.sh`. The finding itself says no test asserts on the parenthetical, and no sub-step edits a test. It then directs: "Run `npm test --workspace cli -- test/remote-start.test.mjs` from the repository root to confirm. That is the only test this fix runs." That is a test file the unit neither creates nor edits. `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 4 bars any finding's fix from naming such a file, and point 1 bars the unit from running it. The full suite runs in Phase G, which is where a message-only change like this one is checked.
   **Fix:** in `finding_8.md`, pick one of these two:
   - (a) Delete the sentence "Run `npm test --workspace cli -- test/remote-start.test.mjs` from the repository root to confirm. That is the only test this fix runs." and replace it with "This fix edits no test file and runs no test; the full suite runs in the Run gates phase."
   - (b) Add a sub-step that edits `cli/test/remote-start.test.mjs`, for example by extending the existing refused-push case to assert the new parenthetical "push-branch.sh's lines in this job's log name why". Keep the run sentence only in that case, since it then names a file the fix edits.

## Should Fix
1. **No `plugin`-layer clean-pass rationale** — Structure. Offending file: the index, `harness-runs/code_reviews/fix_forge_run_control_gate12_round8_findings_code_review.md`.
   The diff touches `plugin/commands/branch-resume.md` (Task 16). The Context paragraph only says the review "covers" it, and no finding draws on `.claude/context/plugin.md`. The change is a small, clean prose correction: it adds no literal, no line coordinate and no renamed wire. Even so, the review should say that it checked it.
   **Fix:** in the index's Context, add one sentence giving the clean-pass rationale for the `plugin` edit against `.claude/context/plugin.md`. For example: the corrected `paused` bullet keeps `<engine>` / `<scripts_dir>` as placeholders, introduces no adopter literal, and its "starts as the branch's first, from its committed task prompt" agrees with `remote-run.sh`'s `` THE `killed` AND `expired` MAPPINGS `` header.
