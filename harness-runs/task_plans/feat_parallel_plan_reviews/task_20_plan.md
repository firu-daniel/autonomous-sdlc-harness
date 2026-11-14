### Task 20 — Add `round-fan-out` to `check-flow-graph.sh` and walk fan-out edges in reachability

**Goal:** Hold the format-3 graph to the property its schema cannot express — a round's gates route only into their own round node, and the round's writer hands its draft to that node — and keep the reachability checks true now that the gates are reached through the round's fan-out rather than through one another's edges.

**Depends on:** Task 19, whose fixtures are format 3, including `schemas/flow-graph-check/flow-graph-check-round-fan-out.json` (the format-3 graph with `business_parity_review.outcomes.PASS.to` set to `architecture_review`) and a `flow-graph-check-gate-in-round.json` whose `plan_round.gates` omits `architecture_review`. Task 2, whose graph routes every gate's `PASS`, `FAIL` and `skip[].to`, and `plan_writer`'s `returned`, to `plan_round`.

**Where this task stops.** This task edits no fixture: each fixture's single change is Task 19's. It edits the checker and the two READMEs that describe it and the schema.

### Targets

- `scripts/check-flow-graph.sh` → `THE CONTRACT` and the `graph_jq` program.
- `schemas/flow-graph-check/README.md`
- `schemas/README.md`

**Work:**

- [ ] `THE CONTRACT`: items 1 (`reachable-from-start`) and 2 (`reaches-terminal`) also traverse a **fan-out edge** from every `round` node to each node in its `gates`, since the walker reaches a gate only through its round; item 3 (`fail-cycle-capped`) states that it does **not** — a round re-dispatches its gates only after its writer, so that edge closes no uncapped cycle. Add item `9. round-fan-out — for every round node, each of its gates routes PASS, FAIL and every skip[].to to that round node and nowhere else, its writer's returned edge routes to it, and no other edge targets it.`, in the `# <n>. <id> — <definition>` form the `--negatives` reader parses.
- [ ] `graph_jq`: build the fan-out edge set and add it to the edge list items 1 and 2 walk, leaving item 3's edge list as it is; implement `round-fan-out`, emitting one `round-fan-out\t<detail>` line per offending edge, naming the round, the node and the outcome. Keep bash 3.2 and `jq` 1.5 (no `$__loc__`, every `if` with an `else`).
- [ ] `schemas/flow-graph-check/README.md`: the format line becomes **format 3** (`"formatVersion": 3`); the document list gains `round-fan-out` — the graph with the parity gate's `PASS` routed to the architecture gate — and restates `gate-in-round`'s change (the round's `gates` without `architecture_review`, whose `FAIL` still routes into the round). `schemas/README.md`: the flow-graph paragraph says a round node's gates are dispatched together and joined, and that the graph is format 3.

**Verification:**

- `bash -n scripts/check-flow-graph.sh` exits 0 (syntax only; the script is not run).
- `grep -nE "^# +9\. round-fan-out — " scripts/check-flow-graph.sh` finds the contract line, and `grep -n "round-fan-out" scripts/check-flow-graph.sh` also finds its emitting branch in `graph_jq`.
- `grep -n "format 3\|round-fan-out" schemas/flow-graph-check/README.md` shows both.
- Whether the template graph passes and every fixture fails its own id are Run-gates gates 3e and 3f, run once per Run gates round in Phase G (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 1).
  - **Deviations from plan:** The bullet `bash -n scripts/check-flow-graph.sh exits 0` was not run as written: the permission layer refused the direct call ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The syntax claim rests instead on `bash scripts/typecheck.sh` (the configured `commands.typecheck`), whose `scripts/check-shell-parse.sh` leg runs `bash -n` over every shell script git lists, `scripts/check-flow-graph.sh` included: `check-shell-parse: 125 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, then `PASS: typecheck`. The `graph_jq` program itself was not evaluated in this unit: the plan sends that to Run-gates gates 3e and 3f.
