### Task 12 — Flow-graph schema, its negative fixtures and the static-check fixtures

**Goal:** Give the flow-graph format a machine-checkable definition, `schemas/flow-graph.schema.json` (draft-07, validated by `ajv` from the workspace root like `schemas/harness.config.schema.json`). Add its negative fixtures under `schemas/negative/`: one per schema constraint worth proving, wired into its own `ajv test … --invalid` chain. Add, in a **separate sibling directory `schemas/flow-graph-check/`**, the schema-**valid** fixtures that **Task 13**'s seven static checks each have to reject. They never go in `schemas/negative/`: every document there exists to be rejected by a schema (`schemas/negative/README.md`, opening sentence), and these documents are owned by `scripts/check-flow-graph.sh`, not by the schema.

**Depends on:** Task 1. That task writes `cli/templates/scripts/flows/task_plan_writing.graph.json` in this format:

- top level: `formatVersion` `1`, `flow`, `description`, `start`, `entries`, `counters` (`{ "<name>": { "cap": <int ≥ 1> } }`), `paths`, `reports`, `nodes`;
- a dispatch node: `kind: "dispatch"`, `agent`, a `heartbeat` carrying `{iteration}`, optional `prompts`, optional `findingsFolder`, optional ordered `skip`, and `outcomes`;
- a terminal node: `kind: "terminal"` and `binding`;
- the skip constructs: `{construct: "skipped", phase: "parity"|"qa"|"docs", to, report?}` and `{construct: "passedByExclusion", runModeId, to, report?}`;
- the outcome keys: `returned`, `PASS`, `FAIL`, `questions`, `no_ui`, `error`, `blocker`;
- an ordinary edge `{to, increment?, reset?, prompt?, ledger?, report?, onCap?}`, where `onCap` is required with `increment`;
- a binding edge `{binding: "<ask>", resume}` or `{binding: "<escalate>", reason: "cap"|"error"|"blocker", summary?, roundCounts?, evidence?}`.

The schema formalises that format and must accept that file unchanged. If it cannot, the format as Task 1 wrote it wins, and the schema is what gets corrected.

**Where this task stops.** The schema checks shape only. Reachability, capped FAIL cycles, known run-mode ids, known ledger ids, findings-folder agreement with the core and cap agreement with the core are **Task 13**'s checker, because JSON Schema cannot express them. This task only writes the fixtures that checker is proved against. Wiring either into `scripts/run-gates.sh` is **Task 14**'s.

### Targets

- `schemas/flow-graph.schema.json` (new)
- `schemas/negative/flow-graph-schema-*.json` (new, four files)
- `schemas/flow-graph-check/flow-graph-check-*.json` (new, seven files)
- `schemas/flow-graph-check/README.md` (new)
- `package.json`: two new `scripts` entries
- `schemas/README.md`, `schemas/negative/README.md`

**Work:**

- [ ] **Write the schema.** `"$schema": "http://json-schema.org/draft-07/schema#"`, with `additionalProperties: false` at every object level, the outcome keys as a closed `propertyNames` enum, and `binding` enumerated as `<ask>` / `<escalate>` / `<terminal_handoff>`, each named, never resolved.
  - The two skip constructs are two `oneOf` branches keyed on `construct`. A `skipped` entry may carry `phase` and never `runModeId`; a `passedByExclusion` entry may carry `runModeId` and never `phase`. That is how *"both skip semantics as separate constructs"* becomes a refusal rather than a convention.
  - An `<ask>` edge requires `resume`, and an edge carrying `increment` requires `onCap`.
  - `runModeId` and `ledger` are **not** enumerated here: they get a plain string pattern only. Their vocabularies have owners elsewhere: `plugin/instructions/run_mode_instructions.md` → `## The closed directive set` and `plugin/instructions/autonomous_pause_and_ledger.md` §1.3. Task 13 checks a graph against those owners. A second copy of either set in this schema would drift, and it would also make the two `*-known` check fixtures fail the schema instead of the checker. For the same reason `counters.<name>.cap` is constrained only to an integer `≥ 1`, never pinned to `5`: agreement with the core is Task 13's `cap-matches-core`.
  - The orphan node in the reachability fixture below still carries an `error` → `<escalate>` edge, so it reaches a terminal and only its own check fires.
  - Every `description` states the routing meaning, since this file is also the format's documentation.
- [ ] **Four schema negatives** in `schemas/negative/`, each a copy of Task 1's graph with **one** change, so only its constraint can fail it (the rule `schemas/negative/README.md` states for the configuration fixtures):
  - `flow-graph-schema-unknown-binding.json`: a `binding: "<proceed>"`;
  - `flow-graph-schema-unknown-outcome.json`: an outcome key `MAYBE`;
  - `flow-graph-schema-skip-construct-mixed.json`: a `skipped` entry carrying `runModeId`;
  - `flow-graph-schema-ask-without-resume.json`: an `<ask>` edge with no `resume`.
- [ ] **Seven check fixtures** in `schemas/flow-graph-check/`, each schema-valid and each a one-change copy failing exactly one of Task 13's check ids. The check id is the file-name suffix, `schemas/flow-graph-check/flow-graph-check-<check-id>.json`:
  - `flow-graph-check-reachable-from-start.json`: an orphan dispatch node nothing routes to;
  - `flow-graph-check-reaches-terminal.json`: `ui_writer`'s `no_ui` edge retargeted to a new node `stuck`, whose only outcome `returned` routes back to itself. Every original node stays reachable and `convergence` is still reached through `ui_review`, and a `returned` self-loop is not a `FAIL` cycle, so only this check fires;
  - `flow-graph-check-fail-cycle-capped.json`: architecture's `FAIL` edge back to `plan_writer` without `increment` / `onCap`;
  - `flow-graph-check-run-mode-id-known.json`: a `passedByExclusion` with `runModeId: "lint"`;
  - `flow-graph-check-ledger-id-known.json`: `ledger: "P9"`;
  - `flow-graph-check-findings-folder-in-core.json`: a `findingsFolder` of `{state_dir}/nowhere_reviews/{branch}/`;
  - `flow-graph-check-cap-matches-core.json`: `counters.iteration.cap` set to `6`. Every FAIL edge still increments a capped counter, so `fail-cycle-capped` stays green and only the cap disagreement with the core's `## Setup` step 4 fires.
- [ ] **`package.json` scripts**, in the existing chained-`&&` style:
  - `validate:flow-graph`: `ajv validate -s schemas/flow-graph.schema.json` over the template graph **and** each of the seven `schemas/flow-graph-check/flow-graph-check-*.json` fixtures, since a check fixture that stopped validating would be failing the checker for the wrong reason;
  - `validate:flow-graph:negative`: one `ajv test -s schemas/flow-graph.schema.json -d schemas/negative/flow-graph-schema-<name>.json --invalid` per schema negative.
- [ ] **READMEs.**
  - `schemas/flow-graph-check/README.md` (new): every document in this directory is **schema-valid by design**; each is a one-change copy of `cli/templates/scripts/flows/task_plan_writing.graph.json` isolating exactly one check id, named by its file-name suffix; each is proved by `bash scripts/check-flow-graph.sh --negatives`, which requires it to fail **with that id** and requires every check id to have a fixture; `npm run validate:flow-graph` keeps each one schema-valid; and a fixture here that starts passing its check is a regression in the checker, not in the fixture. State that the directory is owned by `scripts/check-flow-graph.sh`, not by the schema, and that the documents carry no `$schema` key (as Task 1's graph does not).
  - `schemas/README.md`: a paragraph naming the second schema, what it describes, where the validated graph lives, that it is not a configuration schema, and that its check fixtures live in `schemas/flow-graph-check/`.
  - `schemas/negative/README.md`: a paragraph noting the second schema's negatives, the four `flow-graph-schema-*` documents, each a one-change copy of the planning graph rather than of `examples/harness.config.json`, and that they are wired into `validate:flow-graph:negative` rather than `validate:config:negative`. **No** exception paragraph: every document in this directory stays one a schema rejects.

**Verification:**

- `npm run validate:flow-graph` exits 0.
- `npm run validate:flow-graph:negative` exits 0, and each assertion prints the keyword path that rejected its own document.
- Mutation check: delete the schema's `resume` requirement and `validate:flow-graph:negative` goes red on exactly `flow-graph-schema-ask-without-resume.json`. Revert.
- `npm run validate:config` and `npm run validate:config:negative` still exit 0, because the configuration schema is untouched.
  - **Deviations from plan:** (1) The `increment` / `onCap` dependency is two-way: an `onCap` without an `increment` can never fire, so it is rejected as well. The plan's graph has no such edge, so every fixture is unaffected. (2) `onCap` is an `<escalate>` edge pinned to `reason: "cap"`. (3) The two skip constructs *require* `phase` / `runModeId` respectively, matching Task 1's format line, where both are non-optional. (4) `flow-graph-schema-unknown-binding.json` puts `<proceed>` on the terminal node `convergence`, since an edge's `binding` is enumerated as `<ask>` / `<escalate>` only. (5) `flow-graph-schema-unknown-outcome.json` *adds* `MAYBE` beside `ui_writer`'s `returned` rather than renaming it, so the only change is the added key. (6) Nodes and edges are discriminated with `if` / `then` / `else` rather than `oneOf`, which makes each negative report the keyword path of its own constraint. Skip entries keep the plan's `oneOf`.
- The negative directory's invariant holds: `ls schemas/negative/ | grep 'flow-graph-check'` finds nothing, and every `flow-graph-schema-*` file under `schemas/negative/` is named in `package.json` → `validate:flow-graph:negative` (`grep -o 'schemas/negative/flow-graph-schema-[a-z-]*\.json' package.json`, whose output must equal the directory's `flow-graph-schema-*` listing).
