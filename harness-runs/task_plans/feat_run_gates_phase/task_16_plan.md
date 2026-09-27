### Task 16 — Make the plan reviewers raise a test-run request as a Must Fix

**Goal:** Make every reviewer that grades a plan before a unit loop walks it raise a test-run request as a **Must Fix**. `architecture-reviewer`, Task 8, already does this. This task covers `task-plan-reviewer` for the task plan, `review-plan-reviewer` for the code-review and skeptic findings, and `business-parity-reviewer` in both its modes: as plan reviewer when `phases.parity` is on, and as writer of the A1.5 findings.

**Depends on:** Task 5 and Task 15.
- **From Task 5:** `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point (4). Every reviewer of a plan raises a `**Verification:**` bullet, a finding's fix or a sub-step that names `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits as a **Must Fix**. The unit's own new or edited test file is allowed.
- **From Task 15:** the writers these reviewers grade now carry that rule, so a finding here is a writer's breach, not a new requirement.

### Targets

- `plugin/agents/task-plan-reviewer.md`.
- `plugin/agents/review-plan-reviewer.md`.
- `plugin/agents/business-parity-reviewer.md`.

**Work:**

- [ ] **Token discipline, all three files.** None of them declares `<test_cmd>` in its `## Resolved values`, so every new sentence below names the request in words — *"a test run the rule forbids"*, *"the configured test command"* — never as the `<test_cmd>` token.
- [ ] **`task-plan-reviewer.md`.** In `### Completeness (Must Fix)`, add a bullet: a per-task file whose `**Verification:**` or `**Work:**` bullet asks for a test run the rule forbids — the configured test command, a gate, or a test file the task neither creates nor edits is a **Must Fix** naming the task file and the bullet (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`). A bullet running the task's own new or edited test file is not a finding.
- [ ] **`review-plan-reviewer.md`.** In `## What to check` → **Per-finding files**, add a bullet: a finding whose fix asks for a test run is a **Must Fix** against the review, naming `finding_<N>.md`, with the same pointer and the same own-file carve-out.
- [ ] **`business-parity-reviewer.md`.** In `## What to check (the parity checks)`, add one bullet that applies in both modes, with the same pointer.
  - **Plan-review mode:** a plan bullet or a fix asking for a test run is a **Must Fix**.
  - **Implemented-solution mode:** the findings you write for A1.5 carry no such request.
  - **`## Read first`:** add `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` as a rule source, read in both modes, under the existing *"A cited path you cannot read is a finding, not a fallback"* paragraph. `## Process` step 1 reads the rule sources from that list, so without this entry the new check breaks the section's own *"Never flag something no rule source says."*
  - **`## Scope boundary`:** amend the closing sentence *"**Only parity violations are Must Fix.**"* so that a test-run request is named as a Must Fix beside parity violations. Suggested wording: *"**Only parity violations and a plan's test-run request (`## The test-run rule`) are Must Fix.**"* The sentence before it stays as it is: architecture and styling issues remain Should Fix at most.

**Verification:**

- `grep -ln "The test-run rule" plugin/agents/task-plan-reviewer.md plugin/agents/review-plan-reviewer.md plugin/agents/business-parity-reviewer.md` lists all three files, and the heading resolves in `plugin/instructions/unit_loop_core.md`.
- Each new check states the own-file carve-out, so the check does not contradict point (3) of the rule. Grep each file for the new bullet and read it against that point.
- `grep -n "Only parity violations are Must Fix" plugin/agents/business-parity-reviewer.md` prints nothing, or prints only the amended sentence that also names the test-run request. `grep -n "unit_loop_core.md" plugin/agents/business-parity-reviewer.md` shows a hit inside `## Read first`, which runs from that heading to `## Process`.
- `grep -n "test_cmd" plugin/agents/task-plan-reviewer.md plugin/agents/review-plan-reviewer.md plugin/agents/business-parity-reviewer.md` prints nothing: no edited file carries a `<test_cmd>` hit, so none uses an undeclared token.
- No edited file changes its verdict literals, `verdict: PASS` / `verdict: FAIL`, or its return keys: `grep -n "^verdict: " plugin/agents/task-plan-reviewer.md plugin/agents/review-plan-reviewer.md plugin/agents/business-parity-reviewer.md` shows them unchanged.

**Deviations from plan:**

- `business-parity-reviewer.md` → `## Read first`: the rule-source entry is a bullet at the end of the list, *above* the "A cited path you cannot read is a finding, not a fallback" paragraph rather than below it. That list is what `## Process` step 1 reads as "the rule-source files above", and it matches the placement Task 8 used in `architecture-reviewer.md`. The paragraph still governs the entry.
- `business-parity-reviewer.md`: the new check is placed after check (j)'s sub-bullet so that (j) keeps its nesting.
- The configured test command was not run. It is deferred to the Run gates phase per `unit_loop_core.md` → `## The test-run rule` point (1). No test file was created or edited.
