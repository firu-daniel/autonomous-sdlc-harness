### Task 8 — Add the `docs.retrievalBackend` schema property and its negative fixture

**Goal:** Put `docs.retrievalBackend` into `schemas/harness.config.schema.json`, the authoritative place of the key's four-place contract. Prove its enum with a negative fixture wired into `npm run validate:config:negative`.

**Depends on:** Task 1, which declares in `cli/src/config/model.ts` `RETRIEVAL_BACKENDS = ['typescript', 'python']` and `DEFAULT_RETRIEVAL_BACKEND = 'typescript'`, plus the `HarnessDocs.retrievalBackend` field. The check grades an out-of-set value an error and a legal value with retrieval off a **warning**. The schema must agree with that model key for key: the same enum and the same default. It has **no** `allOf` clause for the warning, because the schema cannot warn and the combination is legal.

### Targets

- `schemas/harness.config.schema.json`
- `schemas/negative/docs-retrieval-backend-unknown.json` (new)
- `schemas/negative/README.md`
- `package.json` (the workspace root's)

**Work:**

- [ ] Schema: under `properties.docs.properties`, after `retrieval`, add `retrievalBackend` with `"type": "string"`, `"enum": ["typescript", "python"]` and `"default": "typescript"`. Its `description` says:
  - which docs-retrieval backend the launcher starts and `doctor` grades;
  - read only while `phases.docs` and `docs.retrieval` are both true;
  - absent means `typescript`, the embedded default `init` installs;
  - `python` selects the opt-in Postgres-backed service in `docs-retrieval-service/`, which `init` does not provision;
  - when to choose it and how to turn it on: `docs/retrieval.md`, 'Turning on the Python backend';
  - where the connection string comes from: `docs/config.md` §5.

  It quotes no figure.
- [ ] `docs-retrieval-backend-unknown.json`: a copy of `examples/harness.config.json` with `$schema` re-based to `../harness.config.schema.json` (`schemas/negative/README.md`'s caveat). Its one change is a `docs` object with `"retrieval": true`, `"retrievalBackend": "java"` and `phases.docs: true`, so the enum is the only constraint it can fail on. Read `examples/harness.config.json` first and change only what this needs.
- [ ] `package.json` → `scripts.validate:config:negative`: append ` && ajv test -s schemas/harness.config.schema.json -d schemas/negative/docs-retrieval-backend-unknown.json --invalid`.
- [ ] `schemas/negative/README.md`: in the enumerating paragraph, after `docs-retrieval-without-docs-phase.json`'s sentence, add one sentence: `docs-retrieval-backend-unknown.json` proves the `docs.retrievalBackend` enum, which exists because the launcher routes on that value at run time and refuses one outside the set, so the search server would not start.

**Verification:**

- Run the one fixture this unit creates, from the workspace root (`ajv-cli` is the root `devDependency`): `npx ajv test -s schemas/harness.config.schema.json -d schemas/negative/docs-retrieval-backend-unknown.json --invalid` exits 0, with the document rejected.
- Do **not** run `npm run validate:config:negative`, `npm run validate:config` or `npm run validate:config:example`: they are `scripts/run-gates.sh`'s gates 3a and 3b and run fixtures this unit neither creates nor edits (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 4). The edited `validate:config:negative` chain and the worked configurations are graded by Phase G's gates 3a and 3b, not by the unit.
- The schema's enum and default equal `RETRIEVAL_BACKENDS` and `DEFAULT_RETRIEVAL_BACKEND` in `cli/src/config/model.ts`, read side by side.

**Deviations from plan:**

- Evidence downgrade on the first Verification bullet: `npx ajv test -s schemas/harness.config.schema.json -d schemas/negative/docs-retrieval-backend-unknown.json --invalid` was refused by the permission profile ("This command requires approval"), so the ajv CLI was not run. The claim rests instead on a scratch probe, `bash scripts/scratch-run.sh harness-runs/scratch/task8-backend-enum.cjs`, which compiles `schemas/harness.config.schema.json` with the workspace's own `node_modules/ajv` library and reported: the fixture `invalid`, with exactly one error, `keyword: enum` at `/docs/retrievalBackend` (allowed `["typescript","python"]`); `examples/harness.config.json` `valid`; and the fixture with `retrievalBackend` set to `python` `valid` — so the enum is the only constraint it fails on. The ajv CLI run itself is deferred to the Run gates phase (gate 3a, `validate:config:negative`).
- The fixture's `docs` object adds `"retrieval": true` as well as `"retrievalBackend": "java"`: `examples/harness.config.json` carries no `retrieval` key, and the plan's stated object needs it.
- The cited `docs/retrieval.md` heading 'Turning on the Python backend' and the `docs/config.md` §5 `docs.retrievalBackend` row do not exist yet; the story plan lands them in Tasks 13 and 11.
