### Task 15 — Make `ui-tests-plan-writer` the single source of the augment prompt, and state why the augment is not re-reviewed

**Goal:** Fix defect 10. The augment prompt differs at its three quoting sites:

- `plugin/agents/ui-tests-plan-writer.md` → `## Invocation contract` → **Augment after user-review fixes** carries `Index:` and `Per-test files:` with literal `<state_dir>/…` paths and a `<branch>_fix_plan*.md` glob;
- `plugin/instructions/qa_test_instructions.md` → `### 1.` step 3 carries neither field and splits the prompt across lines;
- `plugin/instructions/user_review_fixes_instructions_core.md` → `### QA.0` step 2 uses the placeholders `<fix_plan_path>`, `<fix_finding_dir>`, `<ui_test_index>` and `<ui_test_files_dir>`.

After this task the agent definition holds the one canonical form, and both callers quote it byte for byte. QA.0 also states the decision recorded in the story Context: **the augmented plan is not re-reviewed by `ui-tests-plan-reviewer`**, with the reason.

**Depends on:** Task 13, which edits other sections of `qa_test_instructions.md` and `user_review_fixes_instructions_core.md`. Task 16 adds the autonomous commit point for the files this prompt produces and depends on this task.

**The canonical prompt — one line, exactly this text:**

```
Augment the UI-test plan. Branch: <branch>. Additional input: user-review fix plan <fix_plan_path> (+ its finding_<K>.md files under <fix_finding_dir>). Index: <ui_test_index>. Per-test files: <ui_test_files_dir>.
```

This is QA.0's current text, unchanged, so QA.0's quote needs no edit except to cite the agent as the source. The four names are **path placeholders the caller resolves**:

- `<fix_plan_path>`: the active round's fix-plan index, `<state_dir>/user_reviews/<branch>_fix_plan[_<n>].md`;
- `<fix_finding_dir>`: its per-finding folder, the same stem with the `.md` dropped and a `/` added;
- `<ui_test_index>`: `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md`;
- `<ui_test_files_dir>`: `<state_dir>/ui_test_plans/<branch>/`.

`<K>` stays literal text: it describes the files and is not resolved.

### Targets

- `plugin/agents/ui-tests-plan-writer.md`
- `plugin/instructions/qa_test_instructions.md` (`### 1.` step 3's augment block; the `## Resolved values` lead sentence naming this file's own path placeholders)
- `plugin/instructions/user_review_fixes_instructions_core.md` (`### QA.0` step 2)

**Work:**

- [ ] `ui-tests-plan-writer.md` → `## Invocation contract` → **Augment after user-review fixes**: four changes.
  - Replace the block with the canonical line.
  - Add one sentence defining the four placeholders as above, resolved by the caller.
  - Name both senders: `### QA.0` in the user-review fixes core, which sends it in every case, and `### 1.` step 3 of the supervised QA flow, which sends it only on an explicit refresh.
  - Add that this block is the single source and callers quote it verbatim, and that an augment is not re-graded by `ui-tests-plan-reviewer`, pointing at QA.0's statement for why. Do not change the add/revise/no-UI/zero-test rules below the block.
- [ ] `qa_test_instructions.md` → `### 1.` step 3, the "If it already exists" augment block: replace its three-line block with the canonical line, byte-identical. Before the block, resolve the four placeholders, with `<fix_plan_path>` taken as the **latest** round's index (highest numeric suffix, unsuffixed = round 1, by the same `ls … | grep -E '<branch>_fix_plan(_[0-9]+)?\.md$'` shape the fix-plan flow uses). Keep the "Pass the augment input only if such a fix plan exists" rule. Add the four names to the `## Resolved values` lead sentence's list of path placeholders this file resolves itself.
- [ ] `user_review_fixes_instructions_core.md` → `### QA.0` step 2: keep the quoted block byte-identical, and say it is quoted from `${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-writer.md` → `## Invocation contract`.
- [ ] Same step, after the writer's-behaviour bullets: add a short paragraph, **"No plan review here — deliberate."**, giving the three reasons from the story Context:
  - the augment's sole new input is a fix plan that already passed the plan gates;
  - `ui-tests-plan-reviewer` grades against the task prompt, story index and per-task files, not a fix plan, so it would grade the augment against the wrong requirement;
  - a review loop would add another findings folder, another commit point and more dispatches.

  Name what still catches a wrong augmented test: QA.1+ runs it against the live application at once, and a test-step error is a finding whose fix target is the UI-test file (`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract`).

**Verification:**

- `git grep -n -F 'Augment the UI-test plan. Branch: <branch>. Additional input: user-review fix plan <fix_plan_path> (+ its finding_<K>.md files under <fix_finding_dir>). Index: <ui_test_index>. Per-test files: <ui_test_files_dir>.' -- plugin` returns exactly the three sites. `git grep -n 'Augment the UI-test plan' -- plugin` returns no fourth, divergent site.
- `git grep -n '_fix_plan\*' -- plugin/agents/ui-tests-plan-writer.md plugin/instructions/qa_test_instructions.md` returns nothing: no glob is left in a prompt.
- `git grep -n 'ui-tests-plan-reviewer' -- plugin/instructions/user_review_fixes_instructions_core.md` shows the new deliberate-no-review paragraph, and no dispatch of it.
