### Task 15 — Bind the plan writers to the test-run rule

**Goal:** Make every agent that writes a plan executed before the Run gates phase stop asking for a test run. That covers the task-plan writer, the user-review fix-plan writer, and the two end-of-branch reviewers whose findings files are fix plans. Each carries one pointer line to the canonical rule and restates none of it.

**Depends on:** Task 5, which adds `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`. Point (4), which each file below applies, says: a `**Verification:**` bullet, a finding's fix and a sub-step never name `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits, and naming the unit's own new or edited test file is allowed, conditioned on the single-file command a conventions document states. The architecture and business-parity reviewers' A2 / A1.5 findings are bound by Tasks 8 and 16. The test fix plan's writer is bound by Task 7.

### Targets

- `plugin/agents/task-plan-writer.md`.
- `plugin/agents/user-review-fix-plan-writer.md`.
- `plugin/agents/branch-reviewer.md`.
- `plugin/agents/skeptic-reviewer.md`.

**Work:**

- [ ] **`task-plan-writer.md`.**
  - In `## Process` step 7(b), the per-task-file bullet names *"a **`**Verification:**`** bullet list (what to test and how)"*. Append: never a test run, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`.
  - Add a matching quality check to step 9, stated as a condition the plan satisfies: no `**Verification:**` or `**Work:**` bullet asks for a test run the rule forbids — the configured test command, a gate, or a test file the task does not create or edit. Name the test command in words, never as the `<test_cmd>` token, which this file's `## Resolved values` does not declare.
- [ ] **`user-review-fix-plan-writer.md`.** In `## Process` step 4, the per-finding-file sentence says the file carries *"the concrete fix suggestion"*. Add that the fix names no test run, per that rule. Add the matching check to step 5's quality checks.
- [ ] **`branch-reviewer.md`.** Under the paragraph beginning *"**Every finding must be implementable as written, by an implementer that makes no decision of its own.**"*, add one sentence: a finding's fix suggestion asks for no test run, per that rule. The Run gates phase runs the suite after every review's fixes land.
- [ ] **`skeptic-reviewer.md`.** Add the same sentence under its paragraph of the same opening.
- **Deviations from plan:** In `branch-reviewer.md` and `skeptic-reviewer.md`, the plan's second sentence ("The Run gates phase runs the suite after every review's fixes land.") was not added: it is rationale, and `layer-implementer.md` → `## Minimal prose — every line carries a rule` bars the argument for a rule from an agent definition. Its content is also already stated by the cited rule's point (1). Each reviewer got only the one-sentence pointer.

**Verification:**

- `grep -ln "The test-run rule" plugin/agents/task-plan-writer.md plugin/agents/user-review-fix-plan-writer.md plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md` lists all four files, and the cited heading resolves: `grep -n "^## The test-run rule" plugin/instructions/unit_loop_core.md`.
- `grep -n "test_cmd" plugin/agents/task-plan-writer.md plugin/agents/user-review-fix-plan-writer.md plugin/agents/branch-reviewer.md plugin/agents/skeptic-reviewer.md` prints nothing: no edited file carries a `<test_cmd>` hit, so none uses an undeclared token. The new sentences name the request in words.
- No edited file restates the rule's content beyond the one clause its own site needs. Each new sentence names the rule and the site's own consequence, and nothing else (`.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: a policy is activated by pointer, never restated).
