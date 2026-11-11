### Task 13 — Respell every command reference under `plugin/instructions/`

**Goal:** Every `/autonomous-sdlc-harness:<command>` and `autonomous-sdlc-harness:<command>` reference in the instruction cores and forks becomes `/devscene:<command>` / `devscene:<command>`. That includes the forks' binding values, such as `<reentry_command>` and `<next_step_note>`. Every `npx autonomous-sdlc-harness …` becomes `npx devscene …`.

**Depends on:** Task 11, which renamed the plugin to `devscene`, and Task 12, which respelled the command files these instructions quote. A fork's binding value and the command text it relays must use the same `/devscene:` spelling.

**Where this task stops.** Only the qualifier and the CLI name change. No heading, binding name, placeholder or section is renamed, so `plugin/instructions/mode_contract.md` → `## Which files use this` and `### Sanctioned cross-fork anchors` keep every anchor they list. Cores stay literal-free as `mode_contract.md` rule (4) requires: a core that carried the old qualifier still carries no slash-command name beyond what it carried before, just respelled.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md`, `code_review_fixes_instructions.md`, `code_review_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `improvement_observations_instructions.md`, `mode_contract.md`
- `plugin/instructions/plan_orchestration_instructions_autonomous.md`, `plan_orchestration_instructions_semi_autonomous.md`, `prompt_injection_screen.md`, `qa_test_instructions.md`
- `plugin/instructions/task_plan_writing_instructions_autonomous.md`, `task_plan_writing_instructions_semi_autonomous.md`, `user_review_fix_plan_writing_instructions.md`, `user_review_fix_plan_writing_instructions_autonomous.md`
- `plugin/instructions/user_review_fixes_instructions.md`, `user_review_fixes_instructions_autonomous.md`, `user_review_fixes_instructions_semi_autonomous.md`

**Work:**

- [ ] `autonomous_pause_and_ledger.md` through `mode_contract.md`: respell every qualified spelling and every `npx` line.
- [ ] The `plan_orchestration_*`, `prompt_injection_screen.md` and `qa_test_instructions.md` files: respell, including every binding value that carries a command.
- [ ] The `task_plan_writing_*`, `user_review_fix_plan_writing_*` and `user_review_fixes_*` files: respell, including every binding value that carries a command.
- [ ] Before saving, grep `plugin/` for each changed binding value's old text. Every other file that quotes the same value byte for byte must already carry the new spelling: Task 12's commands or this task's own files.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- plugin` prints nothing (Tasks 11 and 12 have already cleared their files).
- `git diff -U0 -- plugin/instructions` shows no changed line beginning with `#`: no heading was renamed.
