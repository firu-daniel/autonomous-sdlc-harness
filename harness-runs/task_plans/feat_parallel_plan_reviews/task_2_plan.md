### Task 2 — Restate the planning graph as format 3: the round's gates fan out, the round node joins

**Goal:** Make the planning graph declare that a round's gates are independent and may run at the same time, so any driver — today's orchestrator or the #159 script — reads the fan-out off the data, and no gate's edge encodes a sequence any more.

**Where this layer stops.** This task edits the graph only. What a format-3 graph **means** at run time — opening a round on arrival from its writer, the set, the join — is the walker's (**Task 3**), which refuses any other `formatVersion`; the schema that holds the shape is **Task 19**'s and the static checks are **Task 20**'s. Shipping the graph ahead of its schema is a deliberate departure from contract-before-consumer, whose reason the story index `## Context` states (**Schema after graph.**); no gate reads the graph against the schema before Phase G, by which time Task 19 has landed.

### Targets

- `cli/templates/scripts/flows/task_plan_writing.graph.json`

**Work:**

- [ ] Set `"formatVersion": 3`, and give `plan_round` the key `"parallel": true`, placed after `"kind"`. Restate the top-level `description` sentence *"whose gates run every round and whose one decision node closes each round"* to say the round's gates are dispatched together as one set and the round node joins them. Nothing else in the description changes.
- [ ] Route every edge of the three gates — `business_parity_review`, `architecture_review`, `plan_review` — to `plan_round`: each `PASS` (keeping its `report`), each `FAIL`, and each `skip[].to` (the parity gate's two constructs and the architecture gate's one). The `error` and `blocker` edges keep their `<escalate>` bindings unchanged.
- [ ] Route `plan_writer.outcomes.returned.to` to `plan_round`, and replace `business_parity_review` in `entries` with `plan_round`, giving exactly `["plan_writer", "plan_round", "ui_writer", "ui_review", "convergence"]`. `plan_round`'s `gates`, `writer`, `counter`, `convergingFrom`, `plan`, `revisionNote` and `outcomes` stay byte-identical, as do `counters`, `paths`, `reports` and the two UI nodes.

**Verification:**

- `jq -e '.formatVersion == 3 and .nodes.plan_round.parallel == true and .nodes.plan_writer.outcomes.returned.to == "plan_round"' cli/templates/scripts/flows/task_plan_writing.graph.json` prints `true`.
- `jq -r '[.nodes.business_parity_review, .nodes.architecture_review, .nodes.plan_review] | map((.outcomes.PASS.to, .outcomes.FAIL.to), ((.skip // [])[] | .to)) | unique | join(",")' cli/templates/scripts/flows/task_plan_writing.graph.json` prints exactly `plan_round`.
- `jq -c .entries` on the graph prints `["plan_writer","plan_round","ui_writer","ui_review","convergence"]`.
- `git diff --stat` touches this one file. Schema validation and the static checks are Run-gates gates 3c and 3e, run once per Run gates round (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 1), not here.
