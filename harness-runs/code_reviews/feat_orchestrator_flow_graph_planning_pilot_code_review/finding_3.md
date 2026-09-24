### 3. The flow-graph schema says `roundCounts` names report slots, but the walker reads each entry as a node id

**File:** `schemas/flow-graph.schema.json`. Two `description` strings:
- `properties.reports.description`: "An edge's report and an escalation's roundCounts name slots from this list."
- `definitions.escalateEdge.properties.roundCounts.description`: "The report slots whose round counts the escalation reports."

**Problem.** The schema describes each `roundCounts` entry as a **report slot**, a member of the top-level `reports` list. The walker instead reads each entry as a **node id**. In `cli/templates/scripts/flow-walker.sh` → `take_binding`, the `<escalate>` / `cap` branch does two things with each entry `r`:
- `fw_id_in_list "$r" "$skipped"` checks it against `skipped_nodes`, a list of node ids;
- `g_need "nodes.$r.findingsFolder"` reads it as a node id.

`g_need` exits 2 with "graph … has no 'nodes.<r>.findingsFolder'" when `r` is not a dispatch node that carries a folder.

This does not fail today only by coincidence. Every `roundCounts` entry in `task_plan_writing.graph.json` (`business_parity_review`, `architecture_review`, `plan_review`) is both a node id and a report slot. A second graph written to the schema's own description could list a slot that is not a node, such as `ui_test`. It would pass `npm run validate:flow-graph` and `scripts/check-flow-graph.sh`, then fault at the cap, which is the one moment the escalation payload is needed. `docs/flow-graph-walker.md` → `## 4. What a second flow would need before it adopts the walker` sends a second flow's author to exactly this schema.

**Fix.** Change the two description strings to match what the walker does. Change no constraint.

- `properties.reports.description`:
  ```json
  "description": "The report slots a run fills in. An edge's report names slots from this list; the walker prints one report: line per slot recorded, in this order, at the terminal node."
  ```
- `definitions.escalateEdge.properties.roundCounts.description`:
  ```json
  "description": "The dispatch nodes, by node id, whose findings-folder round counts a cap escalation reports. The walker reads each one's findingsFolder, so each must name a dispatch node that carries one; a node the walk recorded as skipped is omitted."
  ```

**Verification:** `npm run validate:flow-graph` and `npm run validate:flow-graph:negative` both exit 0. Only description text changed, so neither result should move.
