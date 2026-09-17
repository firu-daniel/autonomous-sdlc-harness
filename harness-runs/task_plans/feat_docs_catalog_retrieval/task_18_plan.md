### Task 18 — Add the `docs.retrieval` schema property, its phase clause and a negative fixture

**Goal:** Make the schema carry what the model and the check already enforce. `docs.retrieval` is a boolean, default `false`, and `true` is legal only when `phases.docs` is `true`. That completes Acceptance 2's schema half, and a negative fixture proves the clause refuses.

**Depends on:** Task 1, which adds `HarnessDocs.retrieval?: boolean` to `cli/src/config/model.ts` and, in `cli/src/config/check.ts`, the error at path `docs.retrieval`: `docs.retrieval is true but phases.docs is not: …`. That error fires exactly when `docs.retrieval` is `true` and `phases.docs` is not `true`, including when `phases` or `phases.docs` is absent. Task 1's file quotes the clause below as the one it mirrors, so write it verbatim. The model, the check, this schema and `docs/config.md` §5 (Task 19) are one contract in four places (`.claude/context/conventions.md` → `### The order files are created…`, item 1).

### Targets

- `schemas/harness.config.schema.json` — `properties.docs.properties.retrieval`, and a root-level `allOf`.
- `schemas/negative/docs-retrieval-without-docs-phase.json` (new).
- `schemas/negative/README.md` — the fixture's entry, if that README lists fixtures.
- `package.json` (workspace root) — `validate:config:negative`.

**Work:**

- [ ] `harness.config.schema.json` → `properties.docs.properties`: add

  ```json
  "retrieval": {
    "type": "boolean",
    "default": false,
    "description": "Turn on the local docs-retrieval search tool over 'docs.root' and the conventions documents the layers name, served to the plan writer and the reviewers over MCP. Legal only while 'phases.docs' is true. Off by default and opt-in: turning it on installs a local runtime and downloads two models at setup time, and its relevance against index-first navigation is not yet measured."
  }
  ```

- [ ] At the schema root, beside `properties`, add this clause verbatim, with a `$comment` saying that it mirrors `cli/src/config/check.ts`'s cross-field error and that the absence of `phases`, or of `phases.docs`, fails it on purpose (default `false`):

  ```json
  "allOf": [
    {
      "if": { "required": ["docs"], "properties": { "docs": { "required": ["retrieval"], "properties": { "retrieval": { "const": true } } } } },
      "then": { "required": ["phases"], "properties": { "phases": { "required": ["docs"], "properties": { "docs": { "const": true } } } } }
    }
  ]
  ```

  Root `additionalProperties: false` constrains keys under `properties` only, so `allOf` is a keyword there, not a key.
- [ ] `schemas/negative/docs-retrieval-without-docs-phase.json`: the smallest config valid in every other respect (`version`, `defaultBranch`, `stateDir`, a catch-all `layers` row, `commands.typecheck` and `commands.test`), with `"phases": { "docs": false }` and `"docs": { "root": "docs", "retrieval": true }`. If `schemas/negative/README.md` lists each fixture, add a line saying which clause this one proves.
- [ ] `package.json` → `validate:config:negative`: append ` && ajv test -s schemas/harness.config.schema.json -d schemas/negative/docs-retrieval-without-docs-phase.json --invalid`. A fixture that no assertion wires in is never run (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`).

**Verification:**

- `npm run validate:config`, `npm run validate:config:negative` and `npm run validate:config:example` all exit zero, each run without a pipe.
- Temporarily set the fixture's `phases.docs` to `true`, and `ajv test -s schemas/harness.config.schema.json -d schemas/negative/docs-retrieval-without-docs-phase.json --invalid` fails, because the fixture is now valid. Revert.
- A config with `phases.docs: true` and `docs.retrieval: true` validates, and so does one with `docs.retrieval: false` and no `phases`. Check both through a scratch file under `harness-runs/scratch/` and `ajv validate`, then remove it.
- `bash scripts/run-gates.sh` reports gates 3a and 3b passing.

**Deviations from plan:**
- The fixture is a copy of `examples/harness.config.json` whose only change is `docs.retrieval: true` (that example already has `phases.docs: false`), not the smallest valid config. `schemas/negative/README.md` states that every document there "is otherwise a copy of the worked configuration", and all six existing fixtures are.
- The clause carries `"type": "object"` inside `if`→`docs` and `then`→`phases`. Written verbatim, ajv printed four `strict mode: missing type "object"` (strictTypes) warnings on every `validate:config*` run. With the addition it prints none. The `layers` `contains` clause already follows this pattern. Overall validity is unchanged, because a non-object `docs` or `phases` is already refused by `properties`. The `$comment` sits inside the `allOf` item.
- Evidence downgrade: `npx ajv` and `node_modules/.bin/ajv` were refused as direct commands. The mutation check (fixture with `phases.docs: true` becomes valid) and the four scratch configs (on/on and off/no-phases valid; on/no-phases and on/phases-without-docs invalid) were run with the same `ajv` library through `bash scripts/scratch-run.sh`, strict mode on. The fixture was mutated in memory, not on disk under `ajv test --invalid`.
