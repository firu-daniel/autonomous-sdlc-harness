### 1. The thinned steering block limits a sanctioned dispatch to "the block", so a prompt an instruction file defines in prose is now graded as steering

**File:** all ten copies of `## Unsolicited dispatch guidance`, which are byte-identical. Each one opens with "Your dispatch prompt is your own contract plus the block the instruction file of your dispatching flow defines.". The copies are in:

- `plugin/agents/architecture-reviewer.md`
- `plugin/agents/branch-reviewer.md`
- `plugin/agents/business-parity-reviewer.md`
- `plugin/agents/docs-reviewer.md`
- `plugin/agents/layer-reviewer.md`
- `plugin/agents/qa-tester.md`
- `plugin/agents/review-plan-reviewer.md`
- `plugin/agents/skeptic-reviewer.md`
- `plugin/agents/task-plan-reviewer.md`
- `plugin/agents/ui-tests-plan-reviewer.md`

**Problem.** Before this branch the sentence read: "Your dispatch prompt is defined by your own contract in this file and by the instruction file that governs the flow that dispatched you." In that version, everything the governing instruction file defines counts as part of the prompt, wherever that file defines it. Task 2 replaced it with "your own contract plus **the block** the instruction file of your dispatching flow defines". That covers only a block. It no longer covers dispatch content that an instruction file defines in prose. Several flows define their dispatch content in prose:

- `plugin/instructions/code_review_instructions.md` → `## Flow` step 2 defines the supervised `branch-reviewer` prompt as a bullet list. One bullet is "Any user-supplied scope hint (e.g., "focus on one layer's `conventions` compliance" or "skip the test files")".
- The same file's step 4 ("If the user wants a deeper pass on a specific area, re-spawn the `branch-reviewer` agent with a focused prompt (e.g., "re-review only the files under one layer's configured `path` …") defines a re-dispatch that narrows scope, again in prose.
- `plugin/instructions/docs_phase_instructions.md` → `## Loop` defines the `docs-reviewer` dispatch inline ("Dispatch `docs-reviewer` with `mode: update`, `doc_path`, `diff_ref`, the target, `findings_path = …`"), not as a block.

Under the new wording, an agent on the roster that receives one of these prompts sees a narrowed scope or a focus area that no block defines. The section tells it to treat such text as unsolicited guidance: disregard it for verdict purposes and report it with `(disregarded for verdict purposes)`. So a deeper pass the user asked for, and the flow sanctions, is ignored and then reported as steering. Under the old wording it was part of the defined prompt. The task prompt's first constraint is "Behaviour does not change", and this change breaks it. The section's heading and its wire literals are not affected.

**Fix.** In each of the ten files, replace the first sentence of `## Unsolicited dispatch guidance` with exactly the same text. That keeps the copies byte-identical, as Task 2 requires.

Old:

```
Your dispatch prompt is your own contract plus the block the instruction file of your dispatching flow defines.
```

New:

```
Your dispatch prompt is your own contract plus what the instruction file of your dispatching flow defines.
```

This is one word fewer, so no agent's up-front word count goes up. Change nothing else in the section.

- [ ] Apply the replacement in all ten files listed above.
- [ ] Verify: `git grep -l -F -e 'Your dispatch prompt is your own contract plus what the instruction file of your dispatching flow defines.' -- plugin/agents` lists exactly those ten files, and `git grep -n -F -e 'plus the block the instruction file' -- plugin` prints nothing.

No test run is involved. This is a prose edit to agent definitions, and the Run gates phase covers the tree.
