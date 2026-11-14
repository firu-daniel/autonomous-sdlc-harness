### Task 25 — Restate the flow-graph schema as format 2, move every fixture onto it, and add the round negatives

**Goal:** Make `schemas/flow-graph.schema.json` describe the format-2 graph — `formatVersion` 2 and a third node kind, `round` — move every schema-valid check fixture and every schema negative onto format 2, add one negative per new constraint, and wire every new file into `package.json`.

**Depends on:** Task 2, whose `cli/templates/scripts/flows/task_plan_writing.graph.json` is the shape to describe: `formatVersion: 2`; `paths` carrying `task_files` and `revision_note` (the latter with the `{round}` token); gate `PASS` / `FAIL` edges that route forward with no `increment`; and the node `plan_round` — `kind: "round"`, `gates` (ordered dispatch-node ids), `writer` (a dispatch-node id), `counter` (a counter name), `convergingFrom` (integer ≥ 0), `plan` (`paths` entry names), `revisionNote` (a `paths` entry name), `outcomes` with exactly `PASS` and `FAIL` (ordinary or binding edges; the `FAIL` edge carries `increment` + `onCap` whose `summary` may carry `{open_gates}`).

**Where this task stops.** Shape only. Whether every failing gate belongs to a round, and the restated FAIL-cycle check, are `scripts/check-flow-graph.sh`'s — **Task 26**, which also adds `gate-in-round` to `THE CONTRACT` that the new check fixture below exists for. This task owns `package.json`, so Task 26 does not edit it.

### Targets

- `schemas/flow-graph.schema.json`
- `schemas/flow-graph-check/flow-graph-check-{reachable-from-start,reaches-terminal,fail-cycle-capped,run-mode-id-known,ledger-id-known,findings-folder-in-core,cap-matches-core}.json`
- `schemas/flow-graph-check/flow-graph-check-gate-in-round.json` (new)
- `schemas/negative/flow-graph-schema-{ask-without-resume,skip-construct-mixed,unknown-binding,unknown-outcome}.json`, and `schemas/negative/flow-graph-schema-round-without-gates.json` (new)
- `package.json` — `validate:flow-graph` and `validate:flow-graph:negative`

**Work:**

- [ ] Schema: `formatVersion` `const` 2 (its description keeps *"A change to the key set raises it"*); `node.kind` enum gains `round`, routed by `if`/`then`/`else` to a new `roundNode` definition — `additionalProperties: false`, required `kind`, `gates` (array of `nodeId`, `minItems` 1, `uniqueItems`), `writer`, `counter`, `convergingFrom` (integer, minimum 0), `outcomes` (object, `additionalProperties: false`, required `PASS` and `FAIL`, each an `edge`); optional `plan` (array of identifiers) and `revisionNote` (identifier). Restate the top-level `description`, `nodes`' description (a round node dispatches nothing and routes on its gates' recorded verdicts), `paths`' (`{round}`), the `summary` description (`{cap}` and `{open_gates}`), and `roundCounts`' (*"counts its `FAIL` round files"*).
- [ ] The seven check fixtures: rebuild each as a one-defect copy of Task 2's format-2 graph that still isolates its own check — `fail-cycle-capped`: `plan_round`'s `FAIL` edge without `increment` and `onCap`; `cap-matches-core`: `counters.iteration.cap` other than 5; and the other five with the defect they carry today, re-applied to the format-2 graph. Each stays schema-valid.
- [ ] New check fixture `flow-graph-check-gate-in-round.json`: Task 2's graph with `plan_round` removed and `plan_review`'s `PASS` and `FAIL` both routing to `ui_writer` with the `P1` ledger — schema-valid, and a graph in which three gates' `FAIL` edges route forward with no round to close them.
- [ ] Schema negatives: the four existing ones rebuilt on the format-2 graph with the defect each carries today; new `flow-graph-schema-round-without-gates.json`: Task 2's graph with `plan_round.gates` removed.
- [ ] `package.json`: add `schemas/flow-graph-check/flow-graph-check-gate-in-round.json` to the `validate:flow-graph` chain and one `node schemas/validate.mjs test -s schemas/flow-graph.schema.json -d schemas/negative/flow-graph-schema-round-without-gates.json --invalid` to `validate:flow-graph:negative` — the cross-layer rule that *"a fixture no assertion wires in is never run"*.

**Verification:**

- `jq empty schemas/flow-graph.schema.json` and `jq empty` on each of the eight check fixtures and five schema negatives exit 0 (well-formed JSON; no gate run).
- `grep -n "validate:flow-graph" package.json` shows the `validate:flow-graph` chain naming `flow-graph-check-gate-in-round.json` and `validate:flow-graph:negative` naming `flow-graph-schema-round-without-gates.json --invalid`.
- `jq '.nodes.plan_round | has("gates")' schemas/negative/flow-graph-schema-round-without-gates.json` prints `false`, and the same query on `schemas/flow-graph-check/flow-graph-check-gate-in-round.json` prints `null` for `.nodes.plan_round` (the node removed).
- `grep -L '"formatVersion": 2' schemas/flow-graph-check/*.json schemas/negative/flow-graph-schema-*.json` prints nothing.
- Schema validation of the template graph, the check fixtures and the negatives is not run here: `npm run validate:flow-graph` and `npm run validate:flow-graph:negative` are Run-gates gates 3c and 3d, run once per Run gates round in Phase G (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 4).
