### Task 13 — Run Phase G by reference from `user_review_fixes_instructions_core.md`

**Goal:** Close the user-review fix phase with the same Run gates phase, so the order becomes A → QA → **G** → D. It is cited by reference from family 1's core, exactly the way `## Phase QA` → `### QA.1+` cites family 1's `## Phase E`. It uses this family's `## Setup` placeholders, so a review round's test fix plans never collide with the task flow's or with another round's.

**Depends on:** Task 5 and Task 9.
- **Task 5** adds substitution row `G.4` to `unit_loop_core.md`, with `Placeholder owner` = the flow's entry core's `## Setup`. For a family-3 flow that is **this** file's.
- **Task 9** adds `plan_orchestration_instructions_core.md` → `## Phase G — Run gates`, with subsections `### G.0 Resolve the round`, `### G.1 Run the gates`, `### G.2 Write and review the test fix plan`, `### G.3 Commit the test fix plan`, `### G.4 Fix loop` and `### G.5 Re-run, and the round cap` (`MAX_GATE_ROUNDS = 5`).
  - Its only bindings are `<escalate>`, `<committer_push>` and `<per_unit_review>`, the last via row `G.4`.
  - Its path placeholders are `<gate_key>`, `<test_fix_plan_path>`, `<test_fix_findings_dir>`, `<test_fix_review_folder>` and `<test_fix_findings_root>`, plus `<gate_round>`, which G.0 binds.
  - It never reads the wrapper's output beyond the `pass` / `fail <log>` line.

### Targets

- `plugin/instructions/user_review_fixes_instructions_core.md`.

**Work:**

- [ ] **Header tables.**
  - `## Resolved values`: the `<test_cmd>` row says only the cited `## Phase G`'s wrapper consumes it.
  - `## Mode contract` `Used at` cells: `<escalate>` adds *"the cited `## Phase G — Run gates`"*; `<per_unit_review>` adds row `G.4`; `<committer_push>` adds G.3's `review_plan_file` commit and row `G.4`.
  - The opening paragraph's flow narrative names the Run gates phase after the QA pass.
- [ ] **`## Setup` step 2.**
  - Add the rows `<gate_key>` = `review_<n>`, where `<n>` is the round `<fix_plan_path>` carries: the unsuffixed `<branch>_fix_plan.md` is 1 and `<branch>_fix_plan_<N>.md` is N.
  - Add `<test_fix_plan_path>` = `<state_dir>/test_fix_plans/<branch>_<gate_key>_round_<gate_round>.md`, `<test_fix_findings_dir>` = `<state_dir>/test_fix_plans/<branch>_<gate_key>_round_<gate_round>/`, `<test_fix_review_folder>` = `<state_dir>/test_fix_plan_reviews/<branch>_<gate_key>_round_<gate_round>/`, and `<test_fix_findings_root>` = `<state_dir>/test_fix_point_reviews/<branch>_<gate_key>_round_<gate_round>/`.
  - Extend step 2's sentence listing *"the sections this file cites by reference"* to add row `G.4` and `## Phase G`.
  - Step 3 drops the clause running `<test_cmd>` per unit, and names only `<typecheck_cmd>`.
- [ ] **`## Phase G — Run gates`**, a new section between `## Phase QA` and `## Phase D`. It runs `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` verbatim, with these substitutions only:
  - its path placeholders resolve from this file's `## Setup`;
  - its heartbeats keep the `G` phase tag;
  - its dispatches go under this file's safety contract and `MAX_TOTAL_DISPATCHES`.

  This section restates no step of it.
- [ ] **Transitions, stop conditions, Done.**
  - `### QA.1+`'s *"tear down the dev server and go to Phase D"* becomes *go to Phase G*, and so does every other QA exit to D. Find them with `grep -n "Phase D" plugin/instructions/user_review_fixes_instructions_core.md`.
  - `## Phase D`'s *"run after Phase QA"* becomes *after Phase G*. The D.1 teardown-ordering sentence still holds, since G runs after the teardown.
  - `## Stop conditions` gains one bullet pointing at the cited phase's escalation points, not restating them.
  - `### D.2 Done summary` adds the **Run gates (Phase G)** bullet in the same shape as the family-1 core's.
  - Keep *"do not run a final test command unless asked"*.

**Verification:**

- `grep -n "^## Phase" plugin/instructions/user_review_fixes_instructions_core.md` lists `## Phase G — Run gates` between `## Phase QA` and `## Phase D`.
- `grep -n "test_cmd" plugin/instructions/user_review_fixes_instructions_core.md` hits only the `## Resolved values` row and the `## Phase G` pointer.
- Walk a round-2 user-review run: `<fix_plan_path>` = `…_fix_plan_2.md` gives `<gate_key>` = `review_2` and the wrapper label `review_2_round_1`, and no path collides with a task-flow `task_round_*` artifact.
