# Review plan meta-review — iteration 0

## Must Fix
1. **The `plugin` layer is touched and the review shows no check drawn from `.claude/context/plugin.md`.** This is a Structure issue in the index, `harness-runs/code_reviews/fix_forge_run_control_gate12_findings_code_review.md`.
   The diff touches three files under the `plugin` layer's path:
   - `plugin/instructions/task_plan_writing_instructions_autonomous.md`, under `## Clarification channel — file format`. The new "names no answer channel" rule, and the **Consume-then-archive** bullet rewritten from *"exactly the set the prompt named"* to *"every pair answered at the top level when that session launched"*.
   - `plugin/instructions/autonomous_pause_and_ledger.md`. The `PAUSE_PROGRESS.md` row of the file table, and `### 2.3 Resuming`, with its new job-mode keep-or-move-aside rule.
   - `plugin/docs/AUTONOMOUS_FLOW.md`, the archiving sentence.

   The index's Context only lists "The plugin clarification-channel and pause-protocol edits" as reviewed scope. No finding is tagged `plugin`, and no clean-pass rationale comes from that layer's conventions document.

   `.claude/context/plugin.md` treats these exact surfaces as wires. `## The placeholder vocabulary` says the `question_<n>.md` / `answer_<n>.md` shape is *"keyed on by the outer-loop watcher … Changing a shape is a change to every reader of it"*. `## Verifying a change in this layer` adds that *"A change to a wire is verified by the grep that re-derives its readers, not by reading the file you changed"*.

   The consume-then-archive contract has other readers that the review never shows it checked:
   - `plugin/instructions/task_plan_writing_instructions_autonomous.md`, Override 2(a), the bullet starting `**(a) Story index exists AND clarification answers are pending consumption.**`
   - `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`, the `(a)` bullet. It deliberately does **not** consume a pair raised by the fix-implementation phase: *"A pair whose question file was instead raised by the fix-implementation phase … is NOT consumed here"*.
   - `plugin/commands/branch-answer.md`.

   The new contract text justifies archiving every launch-time pair by saying *"the re-launched engine consumes every top-level answered pair on re-entry"*. That claim needs to be checked against that selective reader. The review is silent on it either way.

   **Fix:** In the index, add to the Context paragraph an explicit `plugin`-layer clean-pass rationale drawn from `.claude/context/plugin.md`. It should name:
   - the grep run to re-derive the readers of the consume-then-archive contract and of the `PAUSE_PROGRESS.md` keep rule;
   - the reader files found, including `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` (the `(a)` bullet) and `plugin/commands/branch-answer.md`;
   - why each one still agrees with the rewritten text.

   If any reader disagrees, for example on the selective consumption the `user_review_fix_plan` `(a)` bullet describes, raise it as a new `finding_6.md` in `harness-runs/code_reviews/fix_forge_run_control_gate12_findings_code_review/`. Give it a site anchor and a concrete fix, add its `### 6.` pointer under the right severity section of the index, and add a readiness entry tagged `_(layer: plugin)_`.

## Should Fix

## Nice to Have
