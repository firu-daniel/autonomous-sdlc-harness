### 2. `## Setup` step 7 maps **extend** to `plan_writer`, so resuming a park raised in the UI-test-plan loop re-enters the task-plan loop and sends the answers to the wrong writer

> **Self-contained per-finding file** for the `feat_orchestrator_flow_graph_planning_pilot` skeptic-review index. The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `plugin/instructions/task_plan_writing_instructions_core.md` → `## Setup (once per session)` step 7, "**proceed fresh** and **extend** give `plan_writer`"

**Problem.** This branch added step 7, and it maps step 5's three outcomes to a walker entry node. It maps **extend** to `plan_writer` unconditionally. The autonomous fork defines extend in a way that sometimes needs a different node:

- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` maps case **(a)** to extend: *"(a) is **extend** (the pending questions + answers are passed to the writer)"*.
- The same case states who receives the answers: *"this is how the answer content is fed back to the agent that parked"*.

A park raised inside the UI-test-plan loop is ordinary. Two routes reach one:
- `ui-tests-plan-writer` returns `## Questions` (`<ask>`).
- The UI loop hits its cap (`<escalate>`).

**Why the two rules conflict.** At that point `P1` is already `[x]`, because the fork flips `P1` when the task-plan loop converges, which is before the UI loop starts. On re-entry both of these hold:
- A story index exists and answered pairs sit at the top level. That is Override 2(a), so step 5's outcome is **extend**, and step 7 maps it to `plan_writer`.
- `P1` is `[x]`. The fork's resume-from-ledger rule (`## Override 5 …` → **Resume-from-ledger (planning).**) says *"Skipping the task-plan loop starts the walker at the core's `## Setup` step 7 with `--entry ui_writer`"*, and adds *"The clarification-answer resume (Override 2(a)) still fires independently."*

Step 7 therefore yields two different `--entry` values for the same re-entry, and it states no precedence. Its explicit extend mapping is the literal one.

**What following it does:**
- The answers to the UI-test writer's questions go to `task-plan-writer`.
- The whole task-plan loop re-runs: writer, then parity, architecture and plan review, which is at least 4 dispatches against `MAX_TOTAL_DISPATCHES`.
- `ui-tests-plan-writer` is then dispatched on its first-iteration prompt without the answers. It is left to re-ask what was already answered, so the run re-parks, and the watcher eventually holds it as `park_loop`.

**Why this is a regression.** Before this branch the core had no extend-to-writer mapping. The ledger skip landed the run on the UI loop, and Override 2(a) fed the answers to the writer that parked. This is a routing change, which the task prompt's `## Out of scope` excludes (*"Any change to what the loop does"*).

**Fix.** In `plugin/instructions/task_plan_writing_instructions_core.md` → `## Setup (once per session)`, replace the step-7 sentence

`Step 5's outcome picks `<entry>`: **proceed fresh** and **extend** give `plan_writer`; **skip** gives `ui_writer`, or `convergence` when the UI-test-plan loop is also done or does not run.`

with

`Step 5's outcome picks `<entry>`: **proceed fresh** gives `plan_writer`; **extend** gives `plan_writer`, except where the answers being resumed were raised inside the UI-test-plan loop — by `ui-tests-plan-writer`'s `## Questions` or at that loop's cap — which gives `ui_writer`, so the answers reach the writer whose loop parked; **skip** gives `ui_writer`, or `convergence` when the UI-test-plan loop is also done or does not run.`

Leave the rest of step 7 unchanged, including "A fork's own resume rule that skips a loop maps the same way." and the sentence after it.

**Verification:** `grep -n 'and \*\*extend\*\* give' plugin/instructions/task_plan_writing_instructions_core.md` prints nothing, and `grep -n 'raised inside the UI-test-plan loop' plugin/instructions/task_plan_writing_instructions_core.md` prints the step-7 line.
