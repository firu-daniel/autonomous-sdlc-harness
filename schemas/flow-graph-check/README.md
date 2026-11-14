# flow-graph-check/

Every document in this directory is **schema-valid by design** and exists to be **rejected by the static checker**, `scripts/check-flow-graph.sh`, which owns this directory; `schemas/flow-graph.schema.json` does not. Each one is a copy of `cli/templates/scripts/flows/task_plan_writing.graph.json` with a single change isolating exactly one check id, and that id is its file-name suffix: `flow-graph-check-<check-id>.json`.

- `bash scripts/check-flow-graph.sh --negatives` proves them: it requires each document to fail **with its own check id**, and requires every check id to have a document here.
- `npm run validate:flow-graph` keeps each one schema-valid, so a document here never fails the checker for the wrong reason.
- A document here that starts passing its check is a regression in the checker, not in the document: fix the check, do not adjust the document to suit it.
- Like the graph they copy, the documents carry no `$schema` key, and they are **format 3** (`"formatVersion": 3`), as it is: a copy left on an older format fails the schema rather than its check.

The documents, one per check id: `reachable-from-start`, `reaches-terminal`, `fail-cycle-capped`, `run-mode-id-known`, `ledger-id-known`, `findings-folder-in-core`, `cap-matches-core`, `gate-in-round` — the graph with `architecture_review` dropped from round node `plan_round`'s `gates`, while its `FAIL` still routes into that round — and `round-fan-out` — the graph with the parity gate's `PASS` (`business_parity_review.outcomes.PASS.to`) routed to the architecture gate rather than to `plan_round`.

Documents a **schema** must reject belong in `schemas/negative/`, never here.
