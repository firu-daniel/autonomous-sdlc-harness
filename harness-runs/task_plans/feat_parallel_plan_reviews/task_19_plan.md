### Task 19 — Restate the flow-graph schema as format 3 and move every fixture onto it, with the new negatives

**Goal:** Make the schema accept exactly the format-3 graph — `formatVersion` 3 and a round node that declares `"parallel": true` — and keep both fixture families meaningful on it: every schema negative still rejected for its own reason, every check fixture still schema-valid and still failing its own check, plus one new negative of each kind for the new construct.

**Depends on:** Task 2, whose graph is the format-3 shape every fixture copies: `formatVersion` 3; `plan_round` carrying `"parallel": true` after `"kind"`; every gate's `PASS` (with its `report`), `FAIL` and `skip[].to` naming `plan_round`; `plan_writer.outcomes.returned.to` naming `plan_round`; `entries` exactly `["plan_writer", "plan_round", "ui_writer", "ui_review", "convergence"]`.

**Where this task stops.** Shape only. Whether each check fixture fails its own check id is the static checker's (**Task 20**), which adds the check `round-fan-out`; this task writes that check's fixture to the exact single change stated below, so Task 20 edits no fixture. Running the schema gates is Phase G's (gates 3c and 3d), not this task's.

### Targets

- `schemas/flow-graph.schema.json`
- `schemas/negative/flow-graph-schema-ask-without-resume.json`, `…-round-without-gates.json`, `…-skip-construct-mixed.json`, `…-unknown-binding.json`, `…-unknown-outcome.json`, and `schemas/negative/flow-graph-schema-round-without-parallel.json` (new)
- `schemas/flow-graph-check/flow-graph-check-<id>.json` for the eight existing ids, and `schemas/flow-graph-check/flow-graph-check-round-fan-out.json` (new)
- `package.json` → `validate:flow-graph`, `validate:flow-graph:negative`
- `schemas/negative/README.md`

**Work:**

- [ ] `schemas/flow-graph.schema.json`: `formatVersion` `"const": 3`. `roundNode`: add `"parallel"` to `required` and a property `"parallel": { "const": true, "description": … }` — the graph's declaration that the round's gates are independent, none reading another's file of the same round, so a driver **may** dispatch them at the same time; whether it does is the driver's choice. Restate `gates`' description (the dispatch nodes this round dispatches together as one set and joins, listed in gate order — the order the walker prints their blocks and lists their files), the `nodes` and `kind` descriptions (arriving at a round node from outside its gates opens the round; it routes on its gates' recorded verdicts once all are in), and the top-level description's *"which round node closes a set of gates"* the same way.
- [ ] Schema negatives: re-derive each of the five as a copy of the format-3 graph with its existing single change re-applied; add `flow-graph-schema-round-without-parallel.json`, the format-3 graph with `plan_round`'s `"parallel"` key removed. `schemas/negative/README.md`: *"the five `flow-graph-schema-*` documents"* becomes six, naming the new one and its change, and the format they copy.
- [ ] Check fixtures: re-derive each of the eight as a copy of the format-3 graph with its existing single change re-applied — the orphan node (`reachable-from-start`), the `stuck` UI node (`reaches-terminal`), the round's `FAIL` stripped of `increment` and `onCap` (`fail-cycle-capped`), and the four others' value changes — except `flow-graph-check-gate-in-round.json`, whose format-3 change is `plan_round`'s `gates` with `architecture_review` removed (its `FAIL` still routes to `plan_round` with no increment, so it belongs to no round). Add `flow-graph-check-round-fan-out.json`: the format-3 graph with `business_parity_review.outcomes.PASS.to` set to `architecture_review` — a gate routing to another gate. Each stays schema-valid and carries no `$schema` key.
- [ ] `package.json`: append `&& node schemas/validate.mjs validate -s schemas/flow-graph.schema.json -d schemas/flow-graph-check/flow-graph-check-round-fan-out.json` to `validate:flow-graph`, and `&& node schemas/validate.mjs test -s schemas/flow-graph.schema.json -d schemas/negative/flow-graph-schema-round-without-parallel.json --invalid` to `validate:flow-graph:negative` — a fixture no assertion wires in is never run (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`).

**Verification:**

- `jq empty` exits 0 on the schema and on each of the fifteen fixtures (well-formed JSON; no gate run).
- `grep -L '"formatVersion": 3' schemas/flow-graph-check/*.json schemas/negative/flow-graph-schema-*.json` prints nothing.
- `jq '.nodes.plan_round | has("parallel")' schemas/negative/flow-graph-schema-round-without-parallel.json` prints `false`; `jq -r '.nodes.business_parity_review.outcomes.PASS.to' schemas/flow-graph-check/flow-graph-check-round-fan-out.json` prints `architecture_review`; `jq -c '.nodes.plan_round.gates' schemas/flow-graph-check/flow-graph-check-gate-in-round.json` prints `["business_parity_review","plan_review"]`.
- `grep -o "flow-graph-check-round-fan-out.json\|flow-graph-schema-round-without-parallel.json --invalid" package.json` prints both.
