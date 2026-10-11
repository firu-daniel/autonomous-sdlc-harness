### Task 4 — Replace `ajv-cli` with a hand-written `schemas/validate.mjs` that keeps its output contract

**Goal:** Remove `ajv-cli` from the workspace and keep every `validate:*` npm script working with the same output contract. `ajv-cli` 5.0.0 is the latest release, and it pins `fast-json-patch ^2.0.0` (GHSA-8gh8-hqwg-xf34, patched only in 3.1.1), `js-yaml ^3.14.0` → `argparse` 1 → `sprintf-js` (GHSA-hp3w-g68c-fv3c, `<= 1.1.3`, no patched release) and `glob` 7 → `minimatch` 3 → `brace-expansion`. npm's only offered fix is `ajv-cli@0.6.0`, a downgrade. So there is no clean fix inside `ajv-cli` 5, and the plan replaces it with a small script on top of the `ajv` library, which stays.

**Depends on:** Task 3, which leaves `package-lock.json` in sync. This task's own `npm install` rewrites the same lock after it, so Task 3 is the lock's previous writer rather than a co-owner.

**Why `schemas/` and not `scripts/`.** The root `package.json` that calls the validator travels to `main`, but `scripts/` does not: `scripts/publish-main.sh` → `removed_paths` strips it. A validator under `scripts/` would turn `npm run validate:config` on `main` into `Cannot find module`. `schemas/` travels, and it is the directory the validator serves.

**The contract to keep, read off `node_modules/ajv-cli/dist/commands/{validate,test,util}.js` as installed today, and relied on by `docs/development.md` gate 3:**

| Invocation | Outcome | stdout / stderr | Exit |
|---|---|---|---|
| `validate -s <schema> -d <file>` | valid | stdout `<file> valid` | 0 |
| `validate …` | invalid | stderr `<file> invalid`, then the `ajv` errors array | 1 |
| `test -s <schema> -d <file> --invalid` | rejected (the test passes) | stdout `<file> passed test`, then the errors array, which carries each error's `instancePath`, `schemaPath` and `keyword` — "the keyword path that rejected its own fixture" | 0 |
| `test … --invalid` | accepted (the test fails) | stderr `<file> failed test`, with no errors array | 1 |
| either | data or schema file unreadable | stderr `error: Cannot find data file <file>` (or `… schema file …`) | 2 |
| either | bad usage | stderr a usage line | 2 |

The errors array prints the way `ajv-cli`'s default `--errors=js` prints it: `console.log` / `console.error` of the array itself. The `Ajv` instance is constructed as `ajv-cli` constructs it for these schemas: the default export of `ajv` (draft-07, both schemas declare `http://json-schema.org/draft-07/schema#`) with default options, so strict mode stays on. Neither schema uses `format` or an external `$ref` (`grep -c '"format"' schemas/*.schema.json` prints `0` for both), so no `ajv-formats` and no extra schemas are loaded.

**Where this task stops.** The prose in `docs/development.md` gate 3 that names `ajv test` is **Task 11**'s. The conventions document's row *A negative schema fixture*, which spells the assertion `ajv test … --invalid`, is never a task target; the story index's scope register records it as a `stale-rule`. `js-yaml` stays a root `devDependency` at `^3.14.0` here, and **Task 5** moves it.

### Targets

- `schemas/validate.mjs` (new) — the validator.
- `package.json` (workspace root) — `devDependencies` and the five `validate:*` scripts.
- `package-lock.json` (workspace root) — refreshed by the install.

**Work:**

- [ ] `schemas/validate.mjs`: open with `#!/usr/bin/env node` and a header that states **the rule it exists to enforce** (each subcommand's outcome, message and exit code are the table above, byte for byte, so `npm run validate:*` and the gate text that reads it keep their meaning), why it replaced `ajv-cli` (the advisories above, and no fix inside 5.x), why it lives under `schemas/` (the publish-route reason above), and its usage and exit codes. Use the `node:` builtins plus `ajv`, resolved from the workspace root the way `scripts/check-rendered-workflows.mjs` resolves `js-yaml` (`createRequire(join(repoRoot, 'package.json'))`). Parse argv by hand: exactly one subcommand (`validate` or `test`), exactly one `-s`, one or more `-d`, and `--invalid` allowed only with `test`. Read data and schema with `JSON.parse(readFileSync(...))`. Any read or parse failure prints the `Cannot find data file` / `Cannot find schema file` line and exits 2. Exit 0 only when every `-d` file met its expectation.
- [ ] `package.json` → `scripts`: in all five `validate:*` scripts, replace each `ajv validate` with `node schemas/validate.mjs validate` and each `ajv test` with `node schemas/validate.mjs test`. Change nothing else: keep every `-s`, `-d`, `--invalid` and the `&&` chaining, one assertion per fixture, so a fixture no assertion wires in is still never run.
- [ ] `package.json` → `devDependencies`: remove `"ajv-cli"`, and add `"ajv": "^8.20.0"` (8.20.0 is the version `ajv-cli` resolves today). Keep `"js-yaml": "^3.14.0"` for Task 5. Then run `npm install` from the repository root and confirm `git diff --stat` lists only `package.json`, `package-lock.json` and the new `schemas/validate.mjs`.

**Verification:** run each command from the repository root, without a pipe, and read its exit status. Once this task's `package.json` edit lands, `schemas/validate.mjs` is the driver of gate 3 (`scripts/run-gates.sh` runs every `validate:*` script as gates 3a–3d), so it is a gate script and this task **never runs it** — not against a gate fixture, not in a mode the gate does not use (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 4; point 3's exception covers test files only, and this is not one). Its behaviour is graded by source reads here and by gate 3 at Phase G.

- `node --check schemas/validate.mjs` exits 0. This parses the file without executing it.
- Read `schemas/validate.mjs` against every row of the contract table above, and confirm in the source:
  - the literal strings ` valid`, ` invalid`, ` passed test`, ` failed test`, `error: Cannot find data file ` and `error: Cannot find schema file ` each appear, each written to the stream its row names (stdout for `valid` / `passed test`, stderr for the rest);
  - each row's exit code (`0`, `1`, `2`) is the one the code path for that row returns, and exit `0` is reached only when every `-d` file met its expectation;
  - the errors array is printed with `console.log` / `console.error` of the array itself, on the `invalid` and `passed test` paths only, and not on the `failed test` path;
  - `--invalid` is accepted only with `test`, and `validate … --invalid` takes the bad-usage path (exit 2);
  - argv parsing requires exactly one subcommand, exactly one `-s` and at least one `-d`, and any other shape takes the bad-usage path;
  - the `Ajv` instance is the default export of `ajv` constructed with no options argument, so strict mode stays on, and no `ajv-formats` or extra schema is loaded.
- Read `package.json` → `scripts`: every former `ajv validate` is now `node schemas/validate.mjs validate` and every former `ajv test` is now `node schemas/validate.mjs test`, with the same `-s`, `-d`, `--invalid` arguments and `&&` chaining as before. `git diff package.json` shows no other change to a `validate:*` line.
- `npm ls ajv-cli fast-json-patch brace-expansion` reports none of the three. `npm audit` lists nothing on a path through `ajv-cli`, and anything it still lists sits on a path through root `js-yaml` 3, which Task 5 removes.
- The `valid` and `passed test` routes, over both schemas under strict mode, are graded by gate 3 (`npm run validate:*`) at Phase G. The `failed test`, `Cannot find data file` and bad-usage routes are reached by no gate fixture, so for those routes the source read above is the evidence. No test file is added for them: the suite's only runner is `cli/test/*.test.mjs`, which is the `cli` layer's, and this task is single-layer `general`.
