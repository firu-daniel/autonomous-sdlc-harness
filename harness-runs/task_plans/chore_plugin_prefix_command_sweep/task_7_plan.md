### Task 7 — Qualify every command spelling under `plugin/instructions/`, fork binding values included

**Goal:** Every slash spelling of a plugin command in the instruction documents becomes `/autonomous-sdlc-harness:<name>`. That covers the mode forks' `<reentry_command>`, `<planning_command>` and `<next_step_note>` binding values, the *"the calling command (`/branch-…`)"* referents, and the lines that tell a person which command to run next.

**Where this task stops.** This is the model-read class the task prompt asks a decision for, and the decision is settled in the story index `## Context`. An agent invokes a command only through the `Skill` tool, by `autonomous-sdlc-harness:<name>` without a slash. So a slash spelling here is either a referent or text relayed to a person, and both take the qualified form. A core names no slash command (`plugin/instructions/mode_contract.md` → rule 4, *"Cores are literal-free"*), so no `*_core.md` file is a target and none may gain one. Path citations (`${CLAUDE_PLUGIN_ROOT}/commands/…md`) and the `autonomous-watcher.sh` script name are not spellings. Commands, agents and samples are Tasks 6 and 8.

### Targets

All under `plugin/instructions/`:
- `autonomous_pause_and_ledger.md`, `code_review_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `improvement_observations_instructions.md`, `mode_contract.md`, `qa_test_instructions.md`
- `plan_orchestration_instructions_autonomous.md`, `plan_orchestration_instructions_semi_autonomous.md`
- `task_plan_writing_instructions_autonomous.md`, `task_plan_writing_instructions_semi_autonomous.md`
- `user_review_fix_plan_writing_instructions.md`, `user_review_fix_plan_writing_instructions_autonomous.md`
- `user_review_fixes_instructions_autonomous.md`, `user_review_fixes_instructions_semi_autonomous.md`

**Work:**

- [ ] **Fork binding values.** In the `## Resolved values` / binding tables of `plan_orchestration_instructions_autonomous.md`, `plan_orchestration_instructions_semi_autonomous.md`, `task_plan_writing_instructions_autonomous.md`, `task_plan_writing_instructions_semi_autonomous.md`, `user_review_fixes_instructions_autonomous.md` and `user_review_fixes_instructions_semi_autonomous.md`, qualify the command in every `<reentry_command>`, `<planning_command>` and `<next_step_note>` value. An example is `` `/autonomous-sdlc-harness:branch-user-review <branch>: <observations>` ``. The core's STOP messages print these values to a person. Keep each binding name and the rest of each cell unchanged.
- [ ] **Referents to the calling or entry command.** In `task_plan_writing_instructions_autonomous.md` (the `<app_dir>` row and the resolution-form paragraph), `task_plan_writing_instructions_semi_autonomous.md` and `plan_orchestration_instructions_semi_autonomous.md` (the *"sole reader"* sentences), `user_review_fix_plan_writing_instructions_autonomous.md` (the `<repo_root>` row), `docs_orchestration_instructions_autonomous.md` (*"The canonical loop for …"*), `improvement_observations_instructions.md` (the early read-only pointer paragraph) and `mode_contract.md` (the relocation paragraph), qualify every slash spelling in place.
- [ ] **Lines that tell a person what to run.** In `code_review_instructions.md` (`/branch-implement-review`), `qa_test_instructions.md` (`/branch-qa-test`, `/branch-implement-review`-style), `user_review_fix_plan_writing_instructions.md` (`/branch-implement-user-review`) and `autonomous_pause_and_ledger.md` (the task and user-review engine labels, `/branch-pause`, `/branch-resume` and the source table rows), qualify each spelling.
- [ ] **Keep every heading byte-identical.** No heading in these files carries a slash spelling today, so none changes. If an edit would change one, stop and grep its citers first, because a cited heading is a wire (`.claude/context/plugin.md` → `## Citation`).

**Verification:**

- `grep -rnE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' plugin/instructions` prints nothing.
- `grep -ln 'autonomous-sdlc-harness:' plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/task_plan_writing_instructions_core.md plugin/instructions/user_review_fixes_instructions_core.md plugin/instructions/user_review_fix_plan_writing_instructions_core.md plugin/instructions/unit_loop_core.md` prints nothing. The cores stay literal-free.
- `git diff --name-only -G '^#' -- plugin/instructions` prints nothing, which shows no heading line changed.
- `bash scripts/test.sh` exits 0 (gate 1 validates the plugin under `--strict`).
  - **Deviations from plan:** `bash scripts/test.sh` exited 1 with `6a no machine paths` as its sole failure; gate 1 (`1a plugin manifest`, `1b marketplace manifest`) and the other 11 gates passed. Every 6a hit sits outside this task's diff: the worktree's untracked `./.git` pointer file, `harness-runs/scratch/t3npm.log` (a leftover from Task 3), and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, which records the same `.git` hit from an earlier run. So the claim rests on gate 1 passing plus the three greps above coming back empty, not on a clean exit.
