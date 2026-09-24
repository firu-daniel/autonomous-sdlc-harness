### 1. `## Setup` step 2 sends a reader to `## Loop` step 2 and `## UI-test-plan write loop` for their phase gates, and neither section states one any more

**File:** `plugin/instructions/task_plan_writing_instructions_core.md` (`## Setup (once per session)` → step 2, the `Artifact | Path` table), two rows:
- `Business-parity-review findings folder`, with the text "(reached only when `phases.parity` is `true` — see `## Loop` step 2)"
- `UI-test plan index output`, with the text "(reached only when `phases.qa` is `true` — see `## UI-test-plan write loop`)"

**Problem.** Before this branch, both pointers landed on the prose that stated each gate:
- `### 2. Business-parity review (plan-review mode)` opened with *"Skip this gate unless `phases.parity` is `true`"*.
- `## UI-test-plan write loop` opened with *"Skip this loop unless `phases.qa` is `true`"*.

The rewrite moved both gates into the planning graph as `skipped` entries: `nodes.business_parity_review.skip[1]` and `nodes.ui_writer.skip[0]` in `cli/templates/scripts/flows/task_plan_writing.graph.json`. Neither target section says anything about `phases.*` now:
- `### 2.` now opens with "Business parity comes **before** architecture".
- The UI loop preamble opens with "The QA-side analog of the task-plan loop".

So each pointer resolves to a heading that no longer supports the claim beside it. A maintainer who follows the pointer to learn when the parity folder is reached finds nothing. The claim itself is still true.

Only the parentheticals change. The backticked paths stay put, so `scripts/check-flow-graph.sh` → `findings-folder-in-core` still finds every `findingsFolder` in the table. The citers of `## Setup` step 2 cite the table, not these parentheticals: `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **(a) Plan-convergence gates**, and the `evals/plan-shape/scaffold.sh` comment.

**Fix.** In that table, change the two parentheticals and nothing else:

- In the `Business-parity-review findings folder` row, replace
  `(reached only when \`phases.parity\` is \`true\` — see \`## Loop\` step 2)`
  with
  `(reached only when \`phases.parity\` is \`true\` — the planning graph's \`skipped\` gate on \`business_parity_review\`, which \`## The walker\` applies)`
- In the `UI-test plan index output` row, replace
  `(reached only when \`phases.qa\` is \`true\` — see \`## UI-test-plan write loop\`)`
  with
  `(reached only when \`phases.qa\` is \`true\` — the planning graph's \`skipped\` gate on \`ui_writer\`, which \`## The walker\` applies)`

**Verification:**
- `bash scripts/check-flow-graph.sh` exits 0.
- `grep -n 'see `## Loop` step 2\|see `## UI-test-plan write loop`' plugin/instructions/task_plan_writing_instructions_core.md` prints nothing.
