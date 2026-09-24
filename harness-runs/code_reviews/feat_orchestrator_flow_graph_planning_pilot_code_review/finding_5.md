### 5. The `<escalate>` sites still list `## Loop` steps 2 and 3, which now only pass their verdict to step 5

**Files:**
- `plugin/instructions/task_plan_writing_instructions_core.md` (`## Mode contract — bindings this file uses`, the `<escalate>` row's `Used at` cell) — "the walker's `binding: <escalate>` line, acted on in `## Loop` steps 2, 3 and 5 and in `## UI-test-plan write loop` step 3"
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` (`## Mode contract — bindings`, the `<escalate>` row) — "the `iteration >= 5` non-convergence stops in `## Loop` steps 2, 3 and 5 and `## UI-test-plan write loop` step 3"

**Problem.** Before this branch, `### 2.` and `### 3.` each carried their own `verdict: FAIL` → `iteration >= 5` → `<escalate>` bullet, so listing them as sites was accurate. The rewrite removed those bullets. Each step now ends with "Pass its verdict back as step 5 states.", and `### 5. Parse the reviewer's return` is the only `## Loop` step that acts on the walker's `binding: <escalate>`. Both rows still name steps 2 and 3 as sites. No routing decision turns on this, because the binding is used and bound either way.

**Fix.**
- In the core's `<escalate>` `Used at` cell, replace `acted on in \`## Loop\` steps 2, 3 and 5 and in \`## UI-test-plan write loop\` step 3` with `acted on in \`## Loop\` step 5 and in \`## UI-test-plan write loop\` step 3`.
- In the autonomous fork's `<escalate>` row, replace `the \`iteration >= 5\` non-convergence stops in \`## Loop\` steps 2, 3 and 5 and \`## UI-test-plan write loop\` step 3` with `the \`iteration >= 5\` non-convergence stops the walker prints as \`binding: <escalate>\`, acted on in \`## Loop\` step 5 and \`## UI-test-plan write loop\` step 3`.

**Verification:** `grep -n 'steps 2, 3 and 5' plugin/instructions/task_plan_writing_instructions_core.md plugin/instructions/task_plan_writing_instructions_autonomous.md` prints nothing.
