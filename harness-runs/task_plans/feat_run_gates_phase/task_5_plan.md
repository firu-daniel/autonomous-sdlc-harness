### Task 5 — State `## The test-run rule` and add substitution row `G.4` in `unit_loop_core.md`

**Goal:** Give the test-run rule its one canonical home, in the file every unit's execution already runs through. Also append the unit-loop row that Phase G's fix loop will run: `G.4`, over the test fix plan index.

**Depends on:** Task 3. That task declares the directories this row's paths sit in: `test_fix_plans`, for the index `<branch>_<gate_key>_round_<gate_round>.md` and its folder `…/finding_<N>.md`, and `test_fix_point_reviews`, for `<branch>_<gate_key>_round_<gate_round>/item_<N>/`.

**What later tasks consume from this file, by these exact names:**
- **The heading `## The test-run rule`.** Tasks 6, 7, 8, 9, 12, 15, 16, 17 and 18 point at it as `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` and restate none of it. The heading is a wire (`.claude/context/plugin.md` → `## Citation`), so this task also fixes, inside the section, the roster of documents that may point at it. Each of those tasks adds exactly one roster member's pointer:

  | Citing document | Task that adds the pointer |
  |---|---|
  | `agents/layer-implementer.md` | Task 6 |
  | `agents/test-fix-plan-writer.md` | Task 7 |
  | `agents/architecture-reviewer.md` | Task 8 |
  | `instructions/plan_orchestration_instructions_core.md` | Task 9 |
  | `instructions/plan_orchestration_instructions_autonomous.md` | Task 12 |
  | `agents/task-plan-writer.md`, `agents/user-review-fix-plan-writer.md`, `agents/branch-reviewer.md`, `agents/skeptic-reviewer.md` | Task 15 |
  | `agents/task-plan-reviewer.md`, `agents/review-plan-reviewer.md`, `agents/business-parity-reviewer.md` | Task 16 |
  | `instructions/code_review_instructions.md`, `instructions/code_review_fixes_instructions.md`, `instructions/user_review_fixes_instructions.md` | Task 17 |
  | `docs/AUTONOMOUS_FLOW.md` | Task 18 |
- **Row `G.4`.** Task 9's `### G.4 Fix loop` runs it.
- **The row's three path placeholders:** `<test_fix_plan_path>`, `<test_fix_findings_dir>` and `<test_fix_findings_root>`. This task does **not** define them. Like every row's path placeholders they resolve from the flow's entry core's `## Setup`: Task 9 adds them to `plan_orchestration_instructions_core.md` → `## Setup`, and Task 13 adds them to `user_review_fixes_instructions_core.md` → `## Setup`, with exactly these names. The row ships independently, because nothing dispatches it until Task 9's Phase G exists.

### Targets

- `plugin/instructions/unit_loop_core.md`.

**Work:**

- [ ] **`## Resolved values`:** add a `<test_cmd>` / `<typecheck_cmd>` row, `config value`, for `commands.test` / `commands.typecheck`, and a `<test_file_cmd>` row, `conventions document`. Its text: the single-file test command a conventions document states, read from the dispatched layer's `layers[].conventions` document or from the catch-all layer's, the entry whose `path` is `"."`. Update the table's lead sentence from *"The three tokens below"*.
- [ ] **`## The test-run rule`**, a new section placed after `## The unit loop`'s `### The dispositioned outcome` and before `## Substitution table`. Its text:
  - **(1)** No unit runs `<test_cmd>`, a gate script it runs, or a test file the unit did not create or edit. The full suite runs once per Run gates phase, at `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates`, and nowhere else in the flow. A targeted test the unit did not write is excluded too, because choosing one means searching for and understanding what each test covers.
  - **(2)** A unit runs `<typecheck_cmd>`. Where `commands.typecheck` is `<none>` it runs nothing for that gate and reports it not run.
  - **(3)** The one exception: a unit that creates or edits a test file runs only those files, through `<test_file_cmd>`. Where no document states one, or the stated command is refused, the unit skips the run, records the skip in its return, and raises no blocker. Phase G runs that test anyway.
  - **(4)** No plan asks for a test run. A `**Verification:**` bullet, a finding's fix and a sub-step never name `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits. Naming the unit's own new or edited test file is allowed, conditioned on (3). This binds every writer of a plan a unit loop walks — the task plan; the business-parity, architecture, code-review and skeptic findings; the user-review fix plan; the test fix plan — and every reviewer of one raises a breach as a **Must Fix**.
  - **(5)** `<typecheck_cmd>` is not a test run.
  - **Who may cite this — the section's closing paragraph**, in the form of `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## Activation`. It enumerates, one per line, by `${CLAUDE_PLUGIN_ROOT}/…` path, the documents that point at this heading: `agents/layer-implementer.md`, `agents/test-fix-plan-writer.md`, `agents/architecture-reviewer.md`, `agents/business-parity-reviewer.md`, `agents/task-plan-writer.md`, `agents/task-plan-reviewer.md`, `agents/user-review-fix-plan-writer.md`, `agents/review-plan-reviewer.md`, `agents/branch-reviewer.md`, `agents/skeptic-reviewer.md`, `instructions/plan_orchestration_instructions_core.md`, `instructions/plan_orchestration_instructions_autonomous.md`, `instructions/code_review_instructions.md`, `instructions/code_review_fixes_instructions.md`, `instructions/user_review_fixes_instructions.md` and `docs/AUTONOMOUS_FLOW.md`. It then states that a citer **points and never restates**, that no document beyond this roster may point at the heading, and that a later edit rewording or moving the heading updates every roster member in the same change. Pointers from this file's own sections are not roster entries.
  - **The file's opening ownership paragraph.** Amend *"This file is the **single owner** of the implement → \[review\] → commit loop …"* so it also says the file owns `## The test-run rule`: the rule every plan a unit loop walks is written and graded against. It is homed here because the unit loop is where every such plan is executed, and its citers, listed in that section's roster, reach beyond the loop's own callers to the plan writers and plan reviewers.
- [ ] **Row `G.4`**, appended to `## Substitution table`. Every column is filled:
  - Readiness index: `<test_fix_plan_path>`, the test fix plan index's `## Phase 2 Readiness — Ordered Fix List`.
  - Entry token: `**Finding K**`.
  - Detail file: `<finding_file>` = `<test_fix_findings_dir>finding_<K>.md`.
  - Heading source: `<finding_heading>` = the matching `### K. <title>` heading **in the test fix plan index**.
  - Per-item findings folder: `<test_fix_findings_root>item_<N>/`.
  - Placeholder owner: **the flow's entry core's `## Setup`**. Both families reach this row: family 1 through its own `## Phase G`, and family 3 through its `## Phase G`, which cites family 1's.
  - Implementer prompt extras: none.
  - Review prompt first line: `Review the in-progress review item.`
  - Committer mode: `review_item`.
  - Committer extra args: `task_heading: <finding_heading>`.
  - `commit_prefix` rule: the designation for a fix to existing work.
  - Heartbeat unit label: `Item <N>`, as in `[G · Item 2 · cli · iter 0]`.
  - Exceptions: `### Named exceptions` → **Row G.4**, and the shared bottom-up rule.
- [ ] **The row's companions.**
  - Add `#### Row G.4 — test-fix items` under `### Named exceptions`. It states that each round's index is a new file, so the row is resolved through the placeholders and never as a literal, and that the index writer is `test-fix-plan-writer`.
  - In the ⚠️ note, change *"all seven of `A`, `A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3` and `UR-A`"* to eight, including `G.4`, and change *"agree on all seven"* to all eight.
  - Rename `#### The five fix rows — `commit_prefix` by designation` to `#### The fix rows — `commit_prefix` by designation`, and update every cell in this file that cites **The five fix rows** to **The fix rows**. Before renaming, run `grep -rn "five fix rows" plugin`. `plugin/agents/committer.md`'s citer is Task 10's to update; name it in this unit's deviation note if the grep shows any other file.

**Verification:**

- `grep -n "^## The test-run rule" plugin/instructions/unit_loop_core.md` prints one line, and `grep -n "^| \`G.4\`" plugin/instructions/unit_loop_core.md` prints one row whose column count matches the `A` row. Count the `|` separators on both lines.
- `grep -rn "five fix rows" plugin/instructions` prints nothing.
- `grep -rln "The test-run rule" plugin` prints only `plugin/instructions/unit_loop_core.md` and files on the section's roster: its output ⊆ the roster ∪ `unit_loop_core.md`. At this task's landing the later citers do not exist yet, so the check is containment, not equality. Task 23's criterion-5 walk re-runs the comparison over the landed tree, where the two sets must be equal.
- The opening paragraph's ownership statement names `## The test-run rule`: `grep -n "The test-run rule" plugin/instructions/unit_loop_core.md` shows a hit in that paragraph as well as the heading.
- This unit edits no test file and changes no compiled code: `bash scripts/typecheck.sh` passes unchanged.
