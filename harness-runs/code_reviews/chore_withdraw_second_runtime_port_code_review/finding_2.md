### 2. The park-and-resume row is sourced to `## Override 2` alone, but its flow-progress ledger lives in `## Override 5`

**File:** `docs/second-runtime-port-decision.md` (`## 1. The planning loop is already a graph`, the paragraph above the table): "The park-and-resume row is sourced from `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`."

**Problem.** The row this sentence sources reads *"Park and resume rebuilt from the story index, the clarification answers and the flow-progress ledger"*. In `plugin/instructions/task_plan_writing_instructions_autonomous.md`, only the first two of those three are in `## Override 2 — resumability`, which decides from "the presence of clarification answers and the state of the story index". The flow-progress ledger, and resuming from it, are in `## Override 5 — pause/resume + flow-progress ledger (planning half)`, under its **Resume-from-ledger (planning).** paragraph. A reader who follows the one heading the record names finds no ledger there, and may conclude the ledger claim is unsupported.

The table cell's own parenthetical, *"(the autonomous fork's `## Override 2 — resumability`)"*, comes verbatim from the task prompt, and this fix leaves it alone. The sourcing sentence above the table is the implementer's own, and it is the one that has to be complete.

**Fix.** Replace that sentence with:

```markdown
The park-and-resume row is sourced from `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, which resumes from the story index and the clarification answers, and `## Override 5 — pause/resume + flow-progress ledger (planning half)`, which resumes from the flow-progress ledger.
```
