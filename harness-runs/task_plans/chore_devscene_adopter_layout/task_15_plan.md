### Task 15 — Rename the schema, its validation scripts and fixtures, and the example configurations and state directory

**Goal:** Ship the JSON Schema as `schemas/devscene.config.schema.json`, with `default` values `devscene/` for `stateDir` and `devscene-scripts` for `scriptsDir`, and wire the validation scripts to it. Rename the two example configurations to `devscene.config.json` and move the worked example's state directory to `examples/notes-app/devscene/`.

**Ships first, and depends on no task.** The schema, the model, the check and `docs/config.md` §5 are one contract in four places, and the schema is its first home (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1, and `### Where a new responsibility goes`: *"`schemas/harness.config.schema.json` first, then its readers"*). Nothing in this task's Work needs a value another task sets.

**The contract later tasks consume:**
- `schemas/devscene.config.schema.json` exists, and its `default` values are `devscene/` for `stateDir` and `devscene-scripts` for `scriptsDir`.
- Task 1, next in ship order, sets `cli/src/config/model.ts` → `DEFAULTS.stateDir` and `DEFAULTS.scriptsDir` equal to those two values exactly, and respells the `model.ts` and `check.ts` headers to cite this schema path.
- Task 36, right after Task 1, states the same two values in `docs/config.md` §3 and §5. The rest of `docs/config.md` is Task 28's.

**Where this task stops.**
- The captured artifacts inside the moved directory keep their bytes. Only their path changes (`## Context` → *What keeps its current spelling*).
- The example's other live files (`README.md`, `.gitignore`, `githooks/pre-push`, `scripts/*.sh`) are Task 34's. Its `.claude/` renders are the paste record's (Task 35).
- `cli/test/stack-presets.test.mjs`, which opens the schema by file name, is Task 19's.
- `scripts/check-command-spelling.sh`'s exclusion of the example's state directory is Task 17's.

### Targets

- `schemas/harness.config.schema.json` → `schemas/devscene.config.schema.json` (moved)
- `schemas/README.md`, `schemas/negative/README.md`, and the thirteen `schemas/negative/*.json` fixtures the scope register lists (rows 271–283)
- `package.json`
- `examples/harness.config.json` → `examples/devscene.config.json` (moved)
- `examples/notes-app/harness.config.json` → `examples/notes-app/devscene.config.json` (moved), and the directory `examples/notes-app/sdlc-harness/` → `examples/notes-app/devscene/` (moved whole)

Each move is a `git mv`, and the commit stages both the deletions and the additions.

**Work:**

- [ ] Schema: move it. Set `stateDir`'s `"default"` to `"devscene/"` and `scriptsDir`'s `"default"` to `"devscene-scripts"`. Remove from `scriptsDir`'s `description` any sentence about an absent key meaning another directory than `init` writes. Apply rows 1 and 2 of `## Context`'s spelling table to every other string (`$id`, `title`, descriptions).
- [ ] Negative fixtures and the two READMEs: apply rows 1 and 2 (`$schema` paths, `stateDir` values). Each fixture keeps the one defect its README names. `state-dir-leading-dot.json` and `state-dir-nested-dot.json` keep their dot segment, respelled around it. `layers-no-catch-all.json` still has no `"."` layer.
- [ ] `package.json`: in `validate:config`, `validate:config:negative` and `validate:config:example`, every `-s schemas/harness.config.schema.json` becomes `-s schemas/devscene.config.schema.json`. `-d examples/harness.config.json` becomes `-d examples/devscene.config.json` and `-d examples/notes-app/harness.config.json` becomes `-d examples/notes-app/devscene.config.json`. Every chained `--invalid` assertion stays, one per fixture.
- [ ] `examples/devscene.config.json`: move it and apply rows 1 and 2, its `$schema` path included.
- [ ] `examples/notes-app/devscene.config.json`: move it and set `"stateDir"` to `"devscene"`. Then move the example's state directory whole to `examples/notes-app/devscene/`, with no file inside it edited.

**Verification:**

- `git ls-files -- '*harness.config*'` prints only this repository's own root `harness.config.json`, which the maintainer's cutover renames (Task 35).
- `git ls-tree -d --name-only HEAD -- examples/notes-app/sdlc-harness` prints nothing once committed. `git diff --cached -M --stat -- examples/notes-app` before the commit shows every captured file as a pure rename (100% similarity).
- `git grep -nE 'harness\.config|sdlc-harness' -- schemas package.json examples/devscene.config.json examples/notes-app/devscene.config.json` prints nothing.
- `jq -r '.properties.stateDir.default, .properties.scriptsDir.default' schemas/devscene.config.schema.json` prints `devscene/` then `devscene-scripts`, the values Task 1's `DEFAULTS` must then equal.
- `jq empty` on the schema, both example configurations and every negative fixture exits 0.
