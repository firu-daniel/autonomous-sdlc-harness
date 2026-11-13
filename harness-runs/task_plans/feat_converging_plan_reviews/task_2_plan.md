### Task 2 — Restate the planning graph as format 2 with the `plan_round` decision node

**Goal:** Declare the new routing as data in `cli/templates/scripts/flows/task_plan_writing.graph.json`: every plan gate's `PASS` and `FAIL` route forward to the next gate, the last gate routes to a `round` node, and that node alone decides — back to the writer once per round, or on to the UI-test-plan loop.

**Where this task stops.** This file is data the walker reads; it names no rule the walker does not implement. The walker that reads `formatVersion` 2 and the `round` kind is **Task 3**; the schema that validates this shape is **Task 25**; the checks the schema cannot express are **Task 26**; this checkout's self-adopted copy at `scripts/flows/task_plan_writing.graph.json` is **Task 27**. The UI-test-plan loop (`ui_writer`, `ui_review`) and `convergence` are unchanged.

### Targets

- `cli/templates/scripts/flows/task_plan_writing.graph.json`

**Work:**

- [ ] `formatVersion` → `2`. `description`: restate its routing summary to name the round node (the task-plan loop's gates run every round and one decision node closes each round). `paths`: add `"task_files": "{state_dir}/task_plans/{branch}/"` and `"revision_note": "{state_dir}/plan_revisions/{branch}/task_plan_revision_{round}.md"` beside the existing two.
- [ ] Gate edges: `business_parity_review` — `PASS` `{ "to": "architecture_review", "report": { "business_parity_review": "passed" } }`, `FAIL` `{ "to": "architecture_review" }`; `architecture_review` — `PASS` to `plan_review` with its `passed` report, `FAIL` `{ "to": "plan_review" }`; `plan_review` — `PASS` `{ "to": "plan_round", "report": { "plan_review": "passed" } }`, `FAIL` `{ "to": "plan_round" }`. No gate edge carries `increment`, `prompt`, `reset`, `ledger` or `onCap` any more. Skips, heartbeats, agents, `findingsFolder`s, `error` / `blocker` edges are unchanged.
- [ ] New node `plan_round`, exactly:
  ```json
  "plan_round": {
    "kind": "round",
    "gates": ["business_parity_review", "architecture_review", "plan_review"],
    "writer": "plan_writer",
    "counter": "iteration",
    "convergingFrom": 2,
    "plan": ["story_index", "task_files"],
    "revisionNote": "revision_note",
    "outcomes": {
      "PASS": { "to": "ui_writer", "reset": "iteration", "ledger": "P1" },
      "FAIL": {
        "to": "plan_writer", "increment": "iteration", "prompt": "revision",
        "onCap": {
          "binding": "<escalate>", "reason": "cap",
          "summary": "the plan loop reached its {cap}-revision cap; the gates open when it fired: {open_gates}",
          "roundCounts": ["business_parity_review", "architecture_review", "plan_review"],
          "evidence": "story_index"
        }
      }
    }
  }
  ```
  Key order and indentation follow the file's existing two-space style.
- [ ] `entries`, `start`, `counters` (`iteration` cap `5`) and `reports` are unchanged — the cap is a round cap now, and `scripts/check-flow-graph.sh` → `cap-matches-core` still reads `counters.iteration.cap` against the core's three phrases, which Task 11 keeps.

**Verification:**

- `jq empty cli/templates/scripts/flows/task_plan_writing.graph.json` exits 0, and `jq '.formatVersion, (.nodes.plan_round.gates | join(","))'` prints `2` and `business_parity_review,architecture_review,plan_review`.
- `jq -r '.nodes | to_entries[] | select(.value.outcomes.FAIL.increment) | .key'` prints exactly `plan_round` and `ui_review` — the round node is the task-plan loop's only incrementing edge, and the UI loop's own counter edge is untouched.
- Every `to` names a node of the file: `jq -r '[.nodes|keys[]] as $k | .nodes[] | (.outcomes? // {})[] | .to // empty | select(. as $t | $k | index($t) | not)'` prints nothing.
