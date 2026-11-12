### Task 14 — Respell the second half of the plugin instructions, the samples and the plugin flow documents

**Goal:** Finish `plugin/`. The remaining fifteen instruction documents, the sample fixtures and the two flow documents name `devscene.config.json`, the `devscene/` default and `/devscene:analyze`.

**Depends on:** Tasks 1 and 11, which fix the names and the command file's path. Task 13 respelled the first half of `plugin/instructions/` under the same rules.

**Where this task stops.** The sample fixtures describe one coherent worked branch and cite each other by task number, title and points (`.claude/context/plugin.md` → `## Sample fixtures`). This task changes only the table's substrings in them, so no title, finding number or `_(points: …)_` tag moves. No `## ` heading, binding, `<placeholder>`, fixed commit subject or wire literal changes either.

### Targets

- `plugin/instructions/`: `qa_test_instructions.md`, `run_mode_instructions.md`, `task_plan_implementation_instructions.md`, `task_plan_writing_instructions_autonomous.md`, `task_plan_writing_instructions_core.md`, `task_plan_writing_instructions_semi_autonomous.md`, `unit_loop_core.md`, `untrusted_input.md`, `user_review_fix_plan_writing_instructions.md`, `user_review_fix_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_core.md`, `user_review_fixes_instructions.md`, `user_review_fixes_instructions_autonomous.md`, `user_review_fixes_instructions_core.md`, `user_review_fixes_instructions_semi_autonomous.md`
- `plugin/samples/`: `sample_code_review.md`, `sample_code_review/finding_1.md`, `sample_statistics.md`, `sample_story/task_2_plan.md`, `sample_story_plan.md`, `sample_task_plan.md`, `sample_user_review_fix_plan.md`, `sample_user_review_fix_plan/finding_{1,2,3}.md`
- `plugin/docs/AUTONOMOUS_FLOW.md`, `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`

**Work:**

- [ ] The fifteen instruction documents: the `<state_dir>` row's *"Default `sdlc-harness/`"* becomes *"Default `devscene/`"*. Apply row 1 of `## Context`'s spelling table to every config-file mention. `unit_loop_core.md`'s test-run rule point 8 then reads *"added to `devscene.config.json`"*.
- [ ] The ten sample fixtures: apply rows 1 and 2 to their placeholder notes (*"`<state_dir>` is `devscene.config.json` → `stateDir` (default `devscene/`)"*) and nothing else.
- [ ] `AUTONOMOUS_FLOW.md`, `AUTONOMOUS_FLOW_WHITEBOARD.md`: apply rows 1, 2 and 6. A count of command files that the whiteboard states stays as it is, because the rename moves no file in or out of `plugin/commands/`.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-analyze|harness-read-mention|harness:unfilled|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)|`scripts/` when the key is absent' -- plugin` prints nothing. With Tasks 10–13 this covers the whole plugin.
- `git diff -U0 -- plugin/samples` shows no changed `_(points:` tag, task heading or finding title.
