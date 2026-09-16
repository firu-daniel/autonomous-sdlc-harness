### 4. "The reference-implementation line(s)" is left pointing at a phrase the same edit renamed

**File:** [plugin/instructions/plan_orchestration_instructions.md:47](plugin/instructions/plan_orchestration_instructions.md#L47). Anchor: `plugin/instructions/plan_orchestration_instructions.md` → the **Single-layer:** bullet — "*The reference-implementation line(s) apply only when". The line number is only a hint.

**Problem.** In the **Single-layer:** bullet, Task 2 changed *"the relevant source line(s) of the reference implementation"* to *"the relevant source anchors of the reference implementation"*. The italic qualifier right after it still says *"The reference-implementation line(s) apply only when `phases.parity` is `true` in `harness.config.json`."* It now refers to a phrase that no longer exists in the bullet. It also still tells the orchestrator that source *lines* are part of the dispatch. This is the kind of wording the branch removes everywhere else, and this file's own `Sub-agent prompts` bullet already says *"source anchors"*.

The scope register's D1 grep missed it: `source lines*` does not match `reference-implementation line(s)`.

**Who gets it wrong, and how.** In the supervised flow, the orchestrator builds a single-layer dispatch while `phases.parity` is `true`. It reads the qualifier as asking for reference-implementation line numbers and adds a bare `<reference_impl>` coordinate to the prompt. That is the navigation-only coordinate this branch has stopped anything from depending on.

**Fix.**

- [ ] Replace *"*The reference-implementation line(s) apply only when `phases.parity` is `true` in `harness.config.json`.*"* with *"*The reference-implementation anchors apply only when `phases.parity` is `true` in `harness.config.json`.*"*.
- [ ] Re-run `grep -n 'line(s)' plugin/instructions/plan_orchestration_instructions.md` and confirm there is no hit.
