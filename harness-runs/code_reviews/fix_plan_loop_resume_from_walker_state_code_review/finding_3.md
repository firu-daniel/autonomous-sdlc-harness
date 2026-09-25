### 3. `## Setup` step 5 still applies `<existing_artifact_decision>` only when a story index exists, so a walk parked before the index is written can never be continued

**File:** `plugin/instructions/task_plan_writing_instructions_core.md` → `## Setup (once per session)` step 5, which opens "**If a story index already exists** at `<state_dir>/story_plans/<branch>_story_plan.md`, read it briefly"

**The problem.** Step 5 is still triggered only by the story index: "**If a story index already exists** … then apply `<existing_artifact_decision>`". On this branch the same step gained the sentence "A fork's decision may select **continue** whether or not a story index exists, because a writer can park before it writes one". The autonomous fork relies on that: its Override 2 continues a walk parked at `<ask>` "**whether or not a story index exists**". The core's binding table was widened to match ("when a story index or a saved walk already exists"). The step's own condition was not.

An orchestrator that reads step 5 literally, with no story index on disk, never applies `<existing_artifact_decision>`. So it never reaches **Continuing a saved walk.**, and step 7 ("Step 5's outcome picks `<entry>`") falls to a fresh `start --entry plan_writer` with the `initial` prompt. Take the case where `task-plan-writer` returned `## Questions` on its first iteration before writing the index. After the park is answered, the resumed session discards the saved walk, dispatches the writer without the answers, and the watcher then archives the pairs after that session exits. The sentence added to handle this case is unreachable from the step it sits in.

**Fix.** Rewrite the opening of step 5 so that its trigger includes a decision that weighs a saved walk, and keep the rest of the step byte-identical from "which decides between **proceed fresh**" onward:

> 5. **If a story index already exists** at `<state_dir>/story_plans/<branch>_story_plan.md`, **or the fork's `<existing_artifact_decision>` weighs a saved walk** (as `## The walker` → **Continuing a saved walk.** describes), apply `<existing_artifact_decision>` — reading the story index briefly first where it exists (heading list + Phase 2 Readiness entries only — don't ingest the per-task files) — which decides between **proceed fresh** …

This keeps the bolded opening **If a story index already exists** that other files cite, and adds no fork name to the core. A fork whose value does not weigh a saved walk, such as the semi-autonomous fork's ask-the-user row, is still triggered only by the story index, as before.
