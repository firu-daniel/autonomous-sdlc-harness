### 2. The §1 table puts the UI-test-plan loop under one shared counter and one writer FAIL edge, but its source gives it its own

**File:** `docs/second-runtime-port-decision.md` (`## 1. The planning loop is already a graph`, the paragraph directly under the table): "LangGraph could express all of it, and nothing is missing."

**Problem.** The table's first row lists the "UI-test-plan loop" as one of the nodes, between `task-plan-reviewer` and convergence. The next two rows then say that "Any gate's `verdict: FAIL` sends the plan back to the writer, and every gate runs again", and that "One `iteration` counter [is] shared across all gates …, capped at 5". The source the record cites says otherwise for the UI-test-plan loop. `plugin/instructions/task_plan_writing_instructions_core.md` holds that loop in its own section, `## UI-test-plan write loop`, not in the `## Loop` the record cites. That section:

- runs only "Once the task-plan loop above converges (the `task-plan-reviewer` returned `verdict: PASS`)";
- states "`iteration` is reset to 0 at the start of this loop";
- on the reviewer's FAIL, "loop back to step 1", which is `### 1. Spawn \`ui-tests-plan-writer\`` and not `task-plan-writer`. It does not re-run the parity, architecture or task-plan gates.

So the UI-test-plan loop is a second subgraph with its own counter and its own FAIL edge. A reader who reopens the port and builds the graph from this table would wire the UI-test reviewer's FAIL back to the task-plan writer, under the task-plan loop's counter. That is not the harness's behaviour. The table came verbatim from the task prompt, which asks for it to be used "as given", so the fix leaves the table alone and adds the correction beside it, as code-review Finding 2 did for the park-and-resume row.

**Fix.** Directly above the sentence "LangGraph could express all of it, and nothing is missing.", insert the paragraph below as its own paragraph. Leave the table unchanged.

```markdown
The UI-test-plan loop in the first row is the exception to the next two rows. It is its own section, `## UI-test-plan write loop`, which runs only after `task-plan-reviewer` returns `verdict: PASS`, resets `iteration` to 0, and sends its reviewer's `verdict: FAIL` back to `ui-tests-plan-writer` rather than to the task-plan writer. In graph terms it is a second subgraph with its own counter and its own FAIL edge.
```
