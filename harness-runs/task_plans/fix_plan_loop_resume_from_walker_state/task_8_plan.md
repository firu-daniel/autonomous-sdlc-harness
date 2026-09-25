### Task 8 — Mirror the walker and graph into this checkout, sync the graph fixtures, and restate the schema's `entries`

**Goal:**

- Bring this repository's own `init` output under `scripts/` back to byte-identity with the templates Task 1 changed.
- Keep every graph fixture under `schemas/` a copy of the planning graph with exactly one change, as each fixture directory's README states.
- Restate the schema's `entries` description so it stops calling an entry the only legal re-entry point, since a continued walk resumes at its pending node without naming one.

**Depends on:** Task 1. It changed `cli/templates/scripts/flows/task_plan_writing.graph.json`'s `entries` to exactly `["plan_writer", "business_parity_review", "ui_writer", "ui_review", "convergence"]`, and changed only the header comment of `cli/templates/scripts/flow-walker.sh`. This task copies both and rewrites no line of either.

**Where this task stops.** The templates are the source. This task copies them, never edits them, and never touches `scripts/lib/`, which Task 1 did not change. `scripts/` at this root is `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`), so the copy is exactly what `init --force` would write for these two files. It is made by hand, because `--force` regenerates every generated file. The schema change is to a description string only: `required`, `type`, `minItems` and `uniqueItems` of `entries` are unchanged, and `formatVersion` stays `1`.

### Targets

- `scripts/flow-walker.sh` — byte copy of `cli/templates/scripts/flow-walker.sh`.
- `scripts/flows/task_plan_writing.graph.json` — byte copy of `cli/templates/scripts/flows/task_plan_writing.graph.json`.
- `schemas/flow-graph-check/flow-graph-check-*.json` (the seven fixtures) and `schemas/negative/flow-graph-schema-*.json` (the four fixtures) — the `entries` line only.
- `schemas/flow-graph.schema.json` — `properties.entries.description` only.

**Work:**

- [ ] Copy `cli/templates/scripts/flow-walker.sh` over `scripts/flow-walker.sh`, and `cli/templates/scripts/flows/task_plan_writing.graph.json` over `scripts/flows/task_plan_writing.graph.json`, byte for byte. Use the `Read` / `Write` tools or `cp`, and keep `scripts/flow-walker.sh`'s executable bit.
- [ ] In each fixture that `git grep -l '"entries": \["plan_writer", "ui_writer", "convergence"\]' -- schemas` lists, replace that line with `"entries": ["plan_writer", "business_parity_review", "ui_writer", "ui_review", "convergence"],`. Keep the indentation and the trailing comma exactly as the fixture had them. No fixture's isolating change may involve `entries`, so each one stays *"a copy … with a single change isolating exactly one check id"* (`schemas/flow-graph-check/README.md`) and *"a copy of the planning graph … with one"* change (`schemas/negative/README.md`).
- [ ] In `schemas/flow-graph.schema.json`, replace the `entries` description with this, verbatim: `"Every node a start may name as its entry, the graph's own start included. A walk continued from its saved state resumes at its pending node and names none of these; any node not listed here is refused as a start entry."`

**Verification:**

- `diff cli/templates/scripts/flow-walker.sh scripts/flow-walker.sh` and `diff cli/templates/scripts/flows/task_plan_writing.graph.json scripts/flows/task_plan_writing.graph.json` each print nothing and exit 0. `test -x scripts/flow-walker.sh` exits 0.
- `git grep -n '"entries": \["plan_writer", "ui_writer", "convergence"\]' -- schemas scripts cli/templates` prints nothing. Every fixture that carried the old line carries the new one.
- `npm run validate:flow-graph` exits 0: the graph and every `flow-graph-check-*` fixture are schema-valid. `npm run validate:flow-graph:negative` exits 0: every `flow-graph-schema-*` negative is still refused.
- `bash scripts/check-flow-graph.sh` exits 0, and `bash scripts/check-flow-graph.sh --negatives` exits 0, with each check fixture still failing on its own check id.
- `bash scripts/run-gates.sh` shows no new failure. Gates `1a plugin manifest` and `6a no machine paths` already fail on this branch for reasons outside it; name each one that still fails, with the message it printed.
