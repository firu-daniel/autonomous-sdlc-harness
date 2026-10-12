### 1. `Override L` skips the `## Questions` augment return, so a QA.0 `<ask>` park leaves modified tracked UI-test files and the resumed run halts at its own tree-state precondition

**Site.**
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override L — commit the QA.0 UI-test plan augment (autonomous fork only)`, the **Trigger.** paragraph: "It does **not** fire on `no_ui: true` (nothing was written) or on a `## Questions` return (the `<ask>` park comes first; the resumed QA.0 re-dispatches the writer and fires it then)." (line hint ~244)
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`, entry **14**: "it does not fire on `no_ui: true` or a `## Questions` return." (line hint ~298)

**Problem.** `Override L` was added to close defect 7 (the QA.0 augment had no commit point). It deliberately does not fire when the writer's return carries a `## Questions` section. Its stated reason is that the `<ask>` park comes first and the resumed QA.0 will fire it later. That resume never reaches QA.0 when the augment revised files that were already tracked.

1. **A `## Questions` return is a written plan.** `plugin/agents/ui-tests-plan-writer.md` → `## Output contract`: "After writing, augmenting, or revising the plan, return exactly: `ui_test_index: …` / `ui_test_files_dir: …` / `tests_count: …`", and "Plus, **if you have clarification questions for the user**, list them above that summary in a `## Questions` section." So a questions return arrives with the augment already on disk, and with `ui_test_index:` present. `Override L`'s own trigger test ("`ui_test_index:` present in its return") is met, but the next sentence excludes the case explicitly.
2. **The augment edits tracked files.** In the autonomous user-review flow, the UI-test plan was committed by the planning flow (`chore: Add UI-test plan for <branch>`). Earlier E.1 rounds also committed its `[x]` flips. The augment then "**revise[s]** any test case whose expected behaviour the fixes changed" and keeps the index in step with it (`ui-tests-plan-writer.md` → **Augment after user-review fixes**). Both the index and the revised `ui_test_<K>.md` files are tracked, and the augment leaves them modified.
3. **The `<ask>` park commits nothing.** `user_review_fixes_instructions_autonomous.md` → `` ### `<escalate>` / `<ask>` — the park-and-yield clarification reroute ``: the run writes `question_<n>.md`, emits `PARKED:`, tears down the dev server, and "truly stop[s] and yield[s]". No commit happens anywhere on that path.
4. **The resume halts before QA.0.** Same section: "**On resume**, the engine re-enters via the fused command (`<reentry_command>`)". The fused command `plugin/commands/branch-start-user-review-fix-autonomous.md` → step 5 **Tree-state precondition** says: "Halt if any **tracked** file is modified — i.e. any `git status --short` line **not** beginning with `??` … On halt: … write the blocker to the clarification channel and yield (headless)". The clean-tree invariant agrees: "tolerates only untracked `<state_dir>/…` artifacts" (`plan_orchestration_instructions_autonomous.md`, the invariant blockquote).

**Runtime symptom.** An unattended user-review round has a fix that changed a behaviour some existing UI test covers. The augment revises that test, and also raises a question, for example a fix that introduced behaviour with no test-attribute locator (the core's own `### QA.0` example). The run then parks on `<ask>`. When the user answers, the watcher relaunches the fused command. Step 5 finds the modified tracked `<branch>_ui_test_plan.md` / `ui_test_<K>.md` and halts. Headless, it writes a new blocker and yields. That is the "park loop it cannot get out of" which `autonomous-watcher.sh` names in its review-drop comment ("overwriting it would dirty a tracked file and wedge the engine's own clean-tree precondition in a park loop it cannot get out of"). QA.0 is never re-entered, so the deferred `Override L` never fires.

**Why the exclusion fails both legs.**
- **Leg 1.** Deferring the commit until after the questions are answered depends on the resume reaching QA.0. It does not.
- **Leg 2.** The sibling commit point this branch added for the same reason does the opposite. `user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 5 — commit the lessons ledger after the writer's initial write` fires "**before** step 6 routes any `## Questions` through `<ask>`". Its stated reason is exactly this one: "a park … after the write leaves a modified tracked file that halts the fused command's launch check on resume."

**Fix.** Make `Override L` fire on every writer return that carries `ui_test_index:`, including one with a `## Questions` section, before the questions are routed through `<ask>`. Keep the `no_ui: true` exclusion.

- [ ] In `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override L — commit the QA.0 UI-test plan augment (autonomous fork only)`, replace the whole **Trigger.** paragraph with:

  ```markdown
  **Trigger.** Right after `### QA.0` step 2's writer returns with `ui_test_index:` present in its return — a normal write, **or** a write that also carries a `## Questions` section — and before anything else that return leads to: before E.0 starts the dev server, so E.1's per-test `ui_test_pass` commits and any E.3 `review_item` commit start from a tree in which the augment is already tracked, and before a `## Questions` section is routed through `<ask>`, because the park commits nothing and the resumed fused command halts on any modified tracked file before it reaches QA.0. A resumed QA.0 re-dispatches the writer and fires this override again on its return; wrapper exit 3 then covers an unchanged plan. It does **not** fire on `no_ui: true` (nothing was written).
  ```

- [ ] In `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant (single source of truth)`, entry **14**, replace `it does not fire on `no_ui: true` or a `## Questions` return.` with:

  ```markdown
  it does not fire on `no_ui: true`, and on a writer return that also carries `## Questions` it fires before the `<ask>` park.
  ```

Change nothing else in either paragraph. The fenced command, the subject `chore: Add UI-test plan for ${branch}` and the unconditional push stay as they are. No test file is involved, so this fix runs no test.
