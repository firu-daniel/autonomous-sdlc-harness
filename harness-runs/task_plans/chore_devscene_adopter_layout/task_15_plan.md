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

**Deviations from plan:**
- **Moves are not `git mv`.** The implementer contract forbids `git mv` / `git add` / `git rm` and the run refused a shell `mv`. Each moved file was written at its new path with the file tools and its old path removed with a plain `rm`; the committer stages both halves. The 28 captured files under `examples/notes-app/sdlc-harness/` were rewritten one by one at `examples/notes-app/devscene/`, and `git diff --no-index --stat examples/notes-app/sdlc-harness examples/notes-app/devscene` printed nothing before the old files were removed, so every captured file is byte-identical, including the trailing space in `task_plans/feat_note_updated_at/task_3_plan.md`. The emptied old directories stay on disk because `rmdir` was refused. Git tracks no directories, so they leave no trace in the commit.
- **Row 6 applied as well as rows 1 and 2.** `schemas/devscene.config.schema.json` (three `detection.review` descriptions) and `schemas/negative/README.md` (one sentence) named `/devscene:harness-analyze`. The story's spelling table binds every task, and scope-register rows 268–270 give these files to this task alone, so they now read `/devscene:analyze`.
- **Evidence downgrade, verification bullets 1 and 2.** `git ls-files -- '*harness.config*'`, `git ls-tree … examples/notes-app/sdlc-harness` and `git diff --cached -M --stat` read the index or a commit, and this unit stages nothing. They rest instead on `find <repo_root> -name '*harness.config*'` (excluding `node_modules` and `.git`), which printed only the root `harness.config.json`, and on the empty `git diff --no-index` above. Bullet 3 was run as `grep -rnE 'harness\.config|sdlc-harness|harness-analyze|harness-scripts'` over the same paths, because `git grep` cannot see the new untracked files; it found no match. Bullets 4 and 5 ran as written: the `jq -r` read printed `devscene/` then `devscene-scripts`, and the `jq empty` run over all 18 files exited 0.
- **Not run: `npm run validate:config`, `validate:config:negative`, `validate:config:example`.** `scripts/run-gates.sh` runs the first two as gates 3a and 3b, so they are deferred to the Run gates phase. The third is not invoked by `commands.test` or `commands.typecheck`, so it is not run, and no phase of this flow runs it.
