### 4. Cover the writer definition in the reviewer's unreadable-input blocker rule

**Severity:** Should Fix

**Sites:**
- `plugin/agents/task-plan-reviewer.md` → `## What to check` → `### Story-index structure (against `sample_story_plan.md` — Must Fix when missing)`, the bullet *"**`## Scope register` when the plan owes one.** Grade its shape against `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md` → `## Process` → the `**Scope closure:**` bullet."*
- `plugin/agents/task-plan-reviewer.md` → `## Read first`, the paragraph beginning *"**A cited path you cannot read is a finding, not a fallback.**"*.

**Problem.** Task 6 replaced the reviewer's own statement of the register shape with a pointer. Grading a `## Scope register` now requires reading the writer's definition. Before this branch, the reviewer named that file only as a citation and never had to open it.

The reviewer's blocker rule lists a closed set of inputs: *"If a sample above, a conventions document or a plan file under review cannot be read"*. The writer definition is not in that set.

The reader who reaches the wrong answer is the reviewer, on a plan that owes a register, when the writer file cannot be read. It has no stated route. It would either grade the register shape from memory or skip the shape check, and `.claude/context/conventions.md` → `## Plugin asset authoring` forbids both: *"An agent that cannot read a cited contract, sample or instruction file reports it … A substitution is a finding, not a fallback."*

**Fix.** Apply this after Finding 1, which changes the last sentence of the same paragraph.

- [ ] In `plugin/agents/task-plan-reviewer.md` → `## Read first`, replace the whole paragraph that begins *"**A cited path you cannot read is a finding, not a fallback.**"* with:

  ```markdown
  **A cited path you cannot read is a finding, not a fallback.** If a sample above, a conventions document, a plan file under review or — when the plan owes a `## Scope register` — `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md` cannot be read, return a `blocker:` line naming the path and the refusal **in place of** the verdict line, and write no findings file. Never substitute another document for a cited one, and never review against a remembered format.
  ```

**Verification.**
- `grep -c -F 'when the plan owes a `## Scope register`' plugin/agents/task-plan-reviewer.md` is non-zero.
- `grep -c -F 'Never substitute another document for a cited one, and never review against a remembered format.' plugin/agents/task-plan-reviewer.md` is non-zero.
- `wc -w plugin/agents/task-plan-reviewer.md` stays below the baseline count of 5776.
