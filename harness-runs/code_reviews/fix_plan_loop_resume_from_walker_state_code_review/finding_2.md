### 2. Override 5 still sends every "skip the task-plan loop" to `--entry ui_writer`, which rewrites a UI-test draft that Override 2(b) says to review

**File:** `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 5 — pause/resume + flow-progress ledger (planning half)` → **Resume-from-ledger (planning).**, the sentence "Skipping the task-plan loop starts the walker at the core's `## Setup` step 7 with `--entry ui_writer`, and falling straight through with `--entry convergence`."

**The problem.** The rewritten Override 2 case (b) splits the P1-`[x]` case three ways:

- `P2` `[x]` or `[-]` → **skip** → `convergence`;
- `P2` `[ ]` and the UI-test index exists → **review**, which is `start --entry ui_review` under the core's `## Setup` step 7;
- `P2` `[ ]` and no UI-test index → **skip** → `ui_writer`.

Override 5's **Resume-from-ledger (planning).** paragraph was edited on this branch but still says, with no qualification, that skipping the task-plan loop "starts the walker … with `--entry ui_writer`". Take a re-entry with `P1` `[x]`, `P2` `[ ]`, a UI-test draft on disk and no usable saved walk, which is the lost-state-file case the task prompt's item 2 targets. On that re-entry the two paragraphs of the same fork give different entries. An orchestrator that follows Override 5 issues `start --entry ui_writer`, and `start` renders `ui_writer` with the `initial` prompt (`flow-walker.sh` → `arrive "$entry" initial`). That rewrites the UI-test plan from scratch, which is the milder hole the task prompt's `## The hole` names ("The finished UI plan is rewritten from scratch"). The paragraph also says it only restates Override 2 ("Override 2 reads the `## Planning` entries directly"), so it should not state a mapping that Override 2 no longer makes.

**Fix.** Replace that sentence with:

> Skipping the task-plan loop starts the walker at the core's `## Setup` step 7 with `--entry ui_writer` — or with `--entry ui_review` where Override 2(b) finds `P2` `[ ]` and a UI-test index on disk, which is **review**, never a rewrite — and falling straight through with `--entry convergence`.

Leave the rest of the paragraph unchanged.
