### 3. The walker's `<outcome>` table gives two rows for a writer return that carries both its summary block and a `## Questions` section

> **Self-contained per-finding file** for the `feat_orchestrator_flow_graph_planning_pilot` skeptic-review index. The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker — routing is its, judgement is yours` → the **`<outcome>`, from the agent's return:** table, first row "| a writer's `story_file` / `ui_test_index` | `returned` |"

**Problem.** The table maps a return to an outcome by what the return carries. A writer's questions do not replace its summary block; they are added to it:
- `plugin/agents/task-plan-writer.md` → `## Output contract` always returns the `story_file:` block, and *"Plus, **if you have clarification questions for the user**, list them above that summary in a `## Questions` section"*.
- `plugin/agents/ui-tests-plan-writer.md` → `## Output contract` does the same for `ui_test_index:`, and for its `no_ui: true` variant.

So a questioning writer's return matches row 1 (`returned`, or `no_ui`) and row 2 (`questions`) at once. The table states no precedence.

**What the wrong pick does.** Passing `returned` sends the walker on to `business_parity_review`, or on to `ui_review` for the UI writer. The questions are never routed through `<ask>`. The pre-change prose had no such branch point, because its `## Questions` check was worded as an interrupt at the writer step.

`## Loop` step 1 and `## UI-test-plan write loop` step 1 each say *"If the writer returns a `## Questions` section in its output, pass `questions`"*. That is why this is graded Should Fix rather than Must Fix: a reader of the whole node gets it right. But the table is the mapping `## The walker` presents as the way to derive `--outcome`, and it disagrees with those steps on this return.

**Fix.** In that table:

- [ ] Move the row `| a `## Questions` section | `questions` |` above the row `| a writer's `story_file` / `ui_test_index` | `returned` |`, so it becomes the first data row.
- [ ] Directly under the table (before the `**Acting on what it prints:**` line), add one sentence: `Take the first row whose left cell the return matches: a writer that returns `## Questions` beside its summary block — or beside `no_ui: true` — passes `questions`.`

Change nothing else in the table.

**Verification:** in `## The walker`, the `questions` row is the first data row of the `<outcome>` table, and the sentence beginning `Take the first row whose left cell` sits between the table and `**Acting on what it prints:**`.
