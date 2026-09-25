### Task 25 — Add the `execution` schema property and its negative fixture

**Goal:** Put `execution.target` into the configuration's declared contract, so the schema, the model, the check and `docs/config.md` are one contract in four places again (`.claude/context/conventions.md` → `### The order files are created…`, the *configuration key* shape).

**Depends on:** Task 1, which already mirrors the clause below in `cli/src/config/model.ts` (`EXECUTION_TARGETS = ['local', 'github-actions']`, `DEFAULTS.execution = { target: 'local' }`) and `cli/src/config/check.ts`. This task writes exactly that clause, so the four places agree; `docs/config.md` is Task 26's.

**The clause** (Task 1 wrote its check from this text; do not change it here without changing both):

```json
"execution": {
  "type": "object",
  "additionalProperties": false,
  "description": "Where an unattended run executes. Read by init (which writes the GitHub Actions workflows), by doctor, and by the run watcher (which dispatches instead of launching).",
  "properties": {
    "target": {
      "type": "string",
      "enum": ["local", "github-actions"],
      "default": "local",
      "description": "Where an unattended run executes: on this machine, or in a GitHub Actions job the watcher dispatches."
    }
  }
}
```

### Targets

- `schemas/harness.config.schema.json` — the property, placed after `design` (the model's key-order comment says the model follows the schema's order; if Task 1 placed the interface field elsewhere, place the property to match it).
- `schemas/negative/execution-target-unknown.json` (new).
- `package.json` → `validate:config:negative` — the chained `ajv test … --invalid` for the new fixture (register row 49).
- `schemas/negative/README.md` — the fixture's row, in that file's form.

**Work:**

- [ ] Add the property exactly as above.
- [ ] Write the negative fixture: a copy of an existing valid negative fixture's body with its own defect removed, plus `"execution": { "target": "gitlab-ci" }` as its only defect.
- [ ] Chain `ajv test -s schemas/harness.config.schema.json -d schemas/negative/execution-target-unknown.json --invalid` into `validate:config:negative`, and add the fixture's row to `schemas/negative/README.md` naming the one clause it proves.

**Verification:**

- `npm run validate:config`, `npm run validate:config:negative` and `npm run validate:config:example` each exit 0, run without a pipe.
- A scratch copy of `examples/harness.config.json` with `"execution": { "target": "github-actions" }` validates; with `"execution": { "runner": "x" }` it does not.
- `bash scripts/test.sh` exits 0 (gate 3).

**Deviations from plan:**

- The scratch-copy check ran through `bash scripts/scratch-run.sh` on a `.cjs` probe calling the workspace's `ajv` library (draft-07, `strict: false`), because direct `node_modules/.bin/ajv` and `npx ajv` invocations were refused by the permission profile. Result: `target: github-actions` valid; `runner: x` rejected on `#/properties/execution/additionalProperties`.
- `bash scripts/test.sh` exited 1, so its bullet is met for gate 3 only (all `3a`–`3f` ok). The two failures are outside this diff: `6a` matched a pre-existing untracked `harness-runs/scratch/t3-test.log` carrying machine paths, and `11` failed because the docs-retrieval runtime is not installed in this environment.
