### Task 36 — State the renamed `stateDir` and `scriptsDir` defaults in `docs/config.md`

**Goal:** Bring the fourth place of the configuration contract into line with the other three in the commit right after them: `docs/config.md`'s `stateDir` and `scriptsDir` defaults read `devscene/` and `devscene-scripts`, the values the schema (Task 15) and `cli/src/config/model.ts` → `DEFAULTS` (Task 1) now hold.

**Depends on:**
- Task 15, which set the schema's `default` values to `devscene/` for `stateDir` and `devscene-scripts` for `scriptsDir`.
- Task 1, which set `DEFAULTS.stateDir = 'devscene/'` and `DEFAULTS.scriptsDir = 'devscene-scripts'` and removed the absent-`scriptsDir` warning from `cli/src/config/check.ts`.

The schema, the model, the check and `docs/config.md` §5 are one contract in four places (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1). This task is the fourth, and it lands immediately after the other three.

**Where this task stops.** This task changes only the two defaults and the sentences that explain them. Every other spelling in `docs/config.md` (its `harness.config.json` mentions, its `<state_dir>` resolution rows and any other row of `## Context`'s spelling table) belongs to Task 28, which `**Depends on:**` this task. Do not respell anything outside the three places named below, even where a table row matches.

### Targets

- `docs/config.md`: §3 (`stateDir`), the sentence stating its default, and §5's key-table rows for `stateDir` and `scriptsDir`

**Work:**

- [ ] §3: the sentence *"Its default is `sdlc-harness/`."* reads *"Its default is `devscene/`."*.
- [ ] §5, `stateDir` row: the default cell reads `` `devscene/` (required) ``.
- [ ] §5, `scriptsDir` row: the default cell reads `` `devscene-scripts` ``. In its description cell, delete the sentences that separate what an absent key means from what `init` writes: *"**The default in this column is what an absent key means**, not what `init` writes: a fresh `init` writes `harness-scripts`, and its `--scripts-dir` flag writes another value"* becomes a statement that `init` writes this default unless its `--scripts-dir` flag names another value, keeping the refused-values clause (`cli.md` §2). Delete the sentence that opens *"`scripts` is where releases before 0.6.6 wrote"* whole. Keep the rest of the cell as it is: the permission-profile reason, *"Set it to the directory your scripts are in"* and the re-run sentence. No sentence names an old value or says a default changed (`## Context`, first paragraph).

**Verification:**

- `git grep -nE "absent key means|before 0\.6\.6|doctor.s .config. check warns while the key is absent|Its default is .sdlc-harness" -- docs/config.md` prints nothing.
- `git grep -nE '^\| .(stateDir|scriptsDir). \|' -- docs/config.md` prints the two §5 rows, with default cells `` `devscene/` (required) `` and `` `devscene-scripts` ``. `jq -r '.properties.stateDir.default, .properties.scriptsDir.default' schemas/devscene.config.schema.json` prints the same two values, and `git grep -nE "stateDir: |scriptsDir: " -- cli/src/config/model.ts` shows `DEFAULTS` holding them.
- `git diff -- docs/config.md` touches only §3's default sentence and the two §5 rows.
