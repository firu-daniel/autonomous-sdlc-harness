### 1. The plugin-qualified analyze command is a cross-area value built in five places, and `detect/` now imports it from `generators/`

**Severity:** Must Fix
**Layer:** cli

**Where**

- `cli/src/detect/signals.ts` — the new line `import { PLUGIN_NAME } from '../generators/projectSettings.js';` (near line 33), and the `flat` fallback warning `` `unrecognised layout — using the \`flat\` preset; run \`/${PLUGIN_NAME}:harness-analyze\` to refine the layer profile` `` (near line 56).
- `cli/src/detect/presets.ts` — the new line `import { PLUGIN_NAME } from '../generators/projectSettings.js';` (near line 31), and the two inline spellings `` `/${PLUGIN_NAME}:harness-analyze` `` in the strings containing `is what refines it — the command half did resolve` and `per-package or per-module layers are`.
- `cli/src/doctor/checks.ts` — `const ANALYZE_COMMAND = \`/${PLUGIN_NAME}:harness-analyze\`;` (near line 2714), plus the `PLUGIN_NAME,` added to its `'../generators/projectSettings.js'` import list.
- `cli/src/generators/claudeContext.ts` — `const ANALYZE_COMMAND = \`/${PLUGIN_NAME}:harness-analyze\`;` (near line 200).
- `cli/src/commands/init.ts` — `const ANALYZE_COMMAND = \`/${PLUGIN_NAME}:${ANALYZE_COMMAND_NAME}\`;` (near line 208).

**Problem**

The branch turns the analyze command's spelling into a new value, `/<plugin name>:harness-analyze`. Four `cli/src` areas now need it: `commands/`, `doctor/`, `generators/` and `detect/`. Each one builds the value itself. Three modules declare their own `ANALYZE_COMMAND`, and `detect/presets.ts` and `detect/signals.ts` write the template string inline three more times. To get the prefix, both `detect/` modules gained a new runtime import from `generators/projectSettings.ts`.

Two rules are broken:

1. `.claude/context/conventions.md` → `## Shared code, and where it lives`: *"The CLI's shared modules are `cli/src/core/` … A value or behaviour two `cli/src` areas need lives there, never duplicated into both."* Here, a value needed by four areas lives in none of the shared modules and is built separately in each. `### Where a new responsibility goes` → *"Before adding a copy of anything, grep for it"* explains why this matters: `cli/src/core/repoPaths.ts` exists because private copies of one value drifted apart with no compile error and no test. The same risk applies here. If one of the five sites is respelled and the others are not, `doctor`'s remedy, the stub footers, the `flat` warning and `init`'s closing pointer tell an adopter different things.
2. The area dependency direction. `generators/` already depends on `detect/` (`generators/harnessConfig.ts` imports `buildPreset` and `DetectionResult`, `generators/scripts.ts` imports `devServerPrestart`, and `generators/claudeContext.ts` imports `SHARED_CONVENTIONS_PATH`). The new `detect/ → generators/` import makes the two areas depend on each other. `.claude/context/cli.md` → `## Naming and file layout` says *"an area names one responsibility, and a module lives in the area whose responsibility it serves"*. The detection table (header: *"pure file-existence and top-level manifest-key inspection"*) now depends on the module that generates `.claude/settings.json` only to borrow one string. `generators/projectSettings.ts` owns the plugin identity for its own job, which is writing the `enabledPlugins` key. It is not the shared floor that other areas are supposed to import values from.

This was not a pre-existing edge the branch merely touched. On `dev`, neither `cli/src/detect/presets.ts` nor `cli/src/detect/signals.ts` imported anything from `generators/`, and `doctor/checks.ts` did not import `PLUGIN_NAME`.

**Fix**

Give the qualified command one owner on the shared floor, and make every area import it from there:

- [ ] Add a module under `cli/src/core/` (for example `cli/src/core/pluginIdentity.ts`) with a module header stating what it owns and *"The rule this module exists to enforce"*: the plugin's name and every plugin-qualified command spelling the CLI prints are built here, once. Move `PLUGIN_NAME` into it, keeping the doc comment that says it mirrors `plugin/.claude-plugin/plugin.json`'s `name`. Export `ANALYZE_COMMAND = \`/${PLUGIN_NAME}:harness-analyze\`` from the same module.
- [ ] In `cli/src/generators/projectSettings.ts`, import `PLUGIN_NAME` from the new core module. This `generators/ → core/` edge points the allowed way. Keep `PLUGIN_KEY` and `MARKETPLACE_NAME` where they are. Either re-export `PLUGIN_NAME` for its existing importers (`machine/plugins.ts`, `commands/init.ts`, `doctor/checks.ts`, `generators/claudeContext.ts`) or point those importers at the core module. In the same edit, amend the header's choice 1 (*"The identity is resolved here, in one place"*) so it says the name now comes from the core module. `.claude/context/cli.md` → `## What "done" means here` requires a header that states a rule to be amended in the same edit.
- [ ] In `cli/src/detect/signals.ts` and `cli/src/detect/presets.ts`, remove the `'../generators/projectSettings.js'` import. Import `ANALYZE_COMMAND` from the core module and use it in place of the three inline `` `/${PLUGIN_NAME}:harness-analyze` `` template strings.
- [ ] In `cli/src/doctor/checks.ts` and `cli/src/generators/claudeContext.ts`, delete the local `const ANALYZE_COMMAND` and import it from the core module. Remove `PLUGIN_NAME` from `doctor/checks.ts`'s `projectSettings` import if nothing else there uses it. `claudeContext.ts` still needs `PLUGIN_NAME` for its `pluginName` render values.
- [ ] In `cli/src/commands/init.ts`, delete the local `ANALYZE_COMMAND` and import it. Keep `ANALYZE_INVOCATION` built from the imported value. **Keep the `Headless first-message leg, re-measured:` paragraph in `init.ts`**, for example on `ANALYZE_INVOCATION`. `scripts/check-command-spelling.sh`'s exemption table and `docs/development.md` → `## 5. Verifying a change` → gate 6 both cite it as being in `cli/src/commands/init.ts`. If it has to move, update the exemption entry and that gate-6 citation in the same change. `ANALYZE_COMMAND_NAME` can go if nothing else reads it.
- [ ] Verify: the printed strings do not change, so `cli/test/init.test.mjs`, `cli/test/doctor.test.mjs` and `cli/test/stack-presets.test.mjs` must still pass unchanged under `bash scripts/test.sh`. `bash scripts/typecheck.sh` must exit zero (`noUnusedLocals` catches a leftover import). `bash scripts/check-command-spelling.sh` must still exit 0. Finally, run `grep -rn "harness-analyze\`" cli/src` and confirm the only remaining `/${PLUGIN_NAME}:harness-analyze` construction is the one in the core module.
