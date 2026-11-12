### Task 1 — Rename the config file constant, the default directories and the analyze command, and drop the absent-`scriptsDir` warning

**Goal:** Make the CLI read and write `devscene.config.json`, default `stateDir` to `devscene/` and `scriptsDir` to `devscene-scripts`, spell the analyze command `/devscene:analyze`, and remove the special case that reported an absent `scriptsDir`. That special case existed only because the default and the value `init` writes used to differ.

**Depends on:** Task 15, which ships first and moved the schema to `schemas/devscene.config.schema.json` with `default` values `devscene/` for `stateDir` and `devscene-scripts` for `scriptsDir`. This task's `DEFAULTS` must equal those two schema `default` values exactly (`cli/src/config/model.ts`'s header: a default that disagrees with the schema's makes `init` generate a file that contradicts its own documentation). The two module headers this task respells cite that schema path, which exists once Task 15 has landed. The schema, the model, the check and `docs/config.md` §5 are one contract in four places (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1): Task 15 is the first, this task the second and third, and Task 36, right after this one, the fourth.

**Where this task stops.** This task owns the constants and the config modules. It leaves every other `cli/src` module's prose and messages to Tasks 2–4, `docs/config.md`'s default cells to Task 36, and every suite to Tasks 19–26. Suites that pin the old names or the removed warning, such as `cli/test/scripts-dir.test.mjs` and `cli/test/config-command.test.mjs`, are red until Tasks 19 and 20.

**The contract later tasks consume:**
- `cli/src/config/model.ts` → `CONFIG_FILENAME = 'devscene.config.json'`.
- `DEFAULTS.stateDir = 'devscene/'` and `DEFAULTS.scriptsDir = 'devscene-scripts'`.
- `INIT_SCRIPTS_DIR` keeps its identifier and becomes `export const INIT_SCRIPTS_DIR = DEFAULTS.scriptsDir;`. Its value, `devscene-scripts`, reaches every suite through `cli/test/helpers/fixture.mjs`'s re-export.
- `cli/src/core/pluginIdentity.ts` → `ANALYZE_COMMAND = `/${PLUGIN_NAME}:analyze``, which renders as `/devscene:analyze`.

### Targets

- `cli/src/config/model.ts`
- `cli/src/config/check.ts`
- `cli/src/config/io.ts`
- `cli/src/commands/config.ts`
- `cli/src/generators/harnessConfig.ts`
- `cli/src/core/pluginIdentity.ts`

**Work:**

- [ ] `model.ts`: set `CONFIG_FILENAME`, `DEFAULTS.stateDir` and `DEFAULTS.scriptsDir` as above. Replace the `INIT_SCRIPTS_DIR` declaration and its doc comment with the binding above, under a one-line doc comment: *the `scriptsDir` `init` writes into a configuration it generates — the schema default*. Delete the `DEFAULTS` doc paragraph that opens *"`scriptsDir` is the one key whose generated value differs from its default"*. Apply rows 1, 2 and 6 of `## Context`'s spelling table to every remaining comment, the module header included (`schemas/devscene.config.schema.json`, `examples/devscene.config.json`, `/devscene:analyze`).
- [ ] `check.ts`: delete the `if (value['scriptsDir'] === undefined) { problems.warn('scriptsDir', …) }` block. Delete the header paragraph that opens *"**An absent `scriptsDir` is a warning"*. Remove any import this leaves unused, because `noUnusedLocals` is on. Apply row 1 to the header and to every comment and message.
- [ ] `pluginIdentity.ts`: change `ANALYZE_COMMAND` to `` `/${PLUGIN_NAME}:analyze` `` and respell its doc comment.
- [ ] `io.ts`, `commands/config.ts`, `generators/harnessConfig.ts`: apply rows 1, 2 and 6 to every comment and message literal. The `--state-dir` field's doc comment reads *"Defaults to the schema's `devscene/`."*. `harnessConfig.ts`'s `flags.scriptsDir ?? rebuiltScriptsDir ?? INIT_SCRIPTS_DIR` stays as code.
- [ ] Introduce no second constant, no fallback that reads `harness.config.json`, and no sentence naming an old value (`## Context`, first paragraph).

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-analyze' -- cli/src/config cli/src/commands/config.ts cli/src/generators/harnessConfig.ts cli/src/core/pluginIdentity.ts` prints nothing.
- `git grep -nE "INIT_SCRIPTS_DIR = |scriptsDir: |stateDir: |CONFIG_FILENAME = |ANALYZE_COMMAND = " -- cli/src/config/model.ts cli/src/core/pluginIdentity.ts` shows the four values of the contract above, and `INIT_SCRIPTS_DIR` is bound to `DEFAULTS.scriptsDir` rather than to a string literal.
- `jq -r '.properties.stateDir.default, .properties.scriptsDir.default' schemas/devscene.config.schema.json` prints exactly the `stateDir` and `scriptsDir` values the previous check shows in `DEFAULTS`, in that order.
- `git grep -nF 'config.schema.json' -- cli/src/config` names only `schemas/devscene.config.schema.json`, a path `git ls-files -- schemas/devscene.config.schema.json` lists.
- `git grep -nE "is not set, so every reader falls back|before 0\.6\.6|differs from its default" -- cli/src` prints nothing.
- `commands.typecheck` passes.
