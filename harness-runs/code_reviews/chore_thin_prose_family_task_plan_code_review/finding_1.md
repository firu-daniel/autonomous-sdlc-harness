### 1. Restore the shared unreadable-input blocker wording in both family definitions

**Severity:** Must Fix

**Sites:**
- `plugin/agents/task-plan-writer.md` → `## Read first (everything — the plan spans every layer)`, the paragraph beginning *"If a conventions document, a sample above or any input your dispatch names cannot be read"*.
- `plugin/agents/task-plan-reviewer.md` → `## Read first`, the paragraph beginning *"**A cited path you cannot read is a finding, not a fallback.** If a sample above"*.

**Problem.** The unreadable-input paragraph is a block that other agent definitions carry too. Every copy has the same shape:
- the bold lead `**A cited path you cannot read is a finding, not a fallback.**`;
- an `If …` sentence naming that agent's own inputs;
- the clause `Never substitute another document for a cited one, and never <verb> against a remembered <thing>.`

Counts at HEAD:
- `grep -l -F '**A cited path you cannot read is a finding, not a fallback.**' plugin/agents/*.md` lists 16 definitions outside this family.
- `grep -h -o 'Never substitute another document[^.]*\.' plugin/agents/*.md` shows 13 outside the family using `Never substitute another document for a cited one, and never …`. Only the two family files use a different form.

The thinning forked this block in both files:
- **Writer:** it dropped the bold lead entirely, and shortened the last sentence to *"Never substitute another document or a remembered format."* (it was *"Never substitute another document for a cited one, and never plan against a remembered format."*).
- **Reviewer:** it kept the lead but shortened the last sentence to *"Never substitute another document or review against a remembered format."* (it was *"Never substitute another document for a cited one, and never review against a remembered format."*).

Two rules require the original wording:
- `.claude/context/plugin.md` → `## Writing agent prose`: *"A block several agents carry is one wording, copied byte-for-byte into every copy; where copies differ only in a word, keep the difference and nothing else."*
- The story index's own **Frozen text** rule: a sentence that also appears in an agent definition outside this family stays byte for byte.

The `If …` sentence in each file names that agent's own inputs, so it is the permitted difference and stays as the branch left it.

**Fix.**

- [ ] In `plugin/agents/task-plan-writer.md`, replace the whole paragraph that begins *"If a conventions document, a sample above or any input your dispatch names cannot be read"* with:

  ```markdown
  **A cited path you cannot read is a finding, not a fallback.** If a conventions document, a sample above or any input your dispatch names cannot be read, return only a `blocker:` line naming the path and the refusal, and write no plan file. Never substitute another document for a cited one, and never plan against a remembered format.
  ```

- [ ] In `plugin/agents/task-plan-reviewer.md`, in the paragraph that begins *"**A cited path you cannot read is a finding, not a fallback.**"*, replace the last sentence *"Never substitute another document or review against a remembered format."* with:

  ```markdown
  Never substitute another document for a cited one, and never review against a remembered format.
  ```

**Verification.**
- `grep -c -F '**A cited path you cannot read is a finding, not a fallback.**' plugin/agents/task-plan-writer.md plugin/agents/task-plan-reviewer.md` reports a non-zero count for each file.
- `grep -c -F 'Never substitute another document for a cited one, and never' plugin/agents/task-plan-writer.md plugin/agents/task-plan-reviewer.md` reports a non-zero count for each file.
- `wc -w plugin/agents/task-plan-writer.md plugin/agents/task-plan-reviewer.md` stays below the baseline counts of 6335 and 5776.
