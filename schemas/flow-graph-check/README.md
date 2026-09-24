# flow-graph-check/

Every document in this directory is **schema-valid by design** and exists to be **rejected by the static checker**, `scripts/check-flow-graph.sh`, which owns this directory; `schemas/flow-graph.schema.json` does not. Each one is a copy of `cli/templates/scripts/flows/task_plan_writing.graph.json` with a single change isolating exactly one check id, and that id is its file-name suffix: `flow-graph-check-<check-id>.json`.

- `bash scripts/check-flow-graph.sh --negatives` proves them: it requires each document to fail **with its own check id**, and requires every check id to have a document here.
- `npm run validate:flow-graph` keeps each one schema-valid, so a document here never fails the checker for the wrong reason.
- A document here that starts passing its check is a regression in the checker, not in the document: fix the check, do not adjust the document to suit it.
- Like the graph they copy, the documents carry no `$schema` key.

Documents a **schema** must reject belong in `schemas/negative/`, never here.
