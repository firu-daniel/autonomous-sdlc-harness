### 4. `projectSettings.ts` re-exports `PLUGIN_NAME` only so a test can keep loading it from a module that no longer owns it

**File:** `cli/src/generators/projectSettings.ts` — "/** Re-exported for `cli/test/doctor.test.mjs`, which loads it from this compiled module. */"
**Test site:** `cli/test/doctor.test.mjs` — "const { MARKETPLACE_NAME, PLUGIN_KEY, PLUGIN_NAME } = await loadCompiled('generators/projectSettings.js');"

This branch moved `PLUGIN_NAME` to `cli/src/core/pluginIdentity.ts`. That module's header now claims it as the single owner of the plugin's name. Every source consumer imports it from there: `generators/claudeContext.ts`, `generators/projectSettings.ts` and `machine/plugins.ts`. To avoid touching one test line, `projectSettings.ts` also re-exports it with `export { PLUGIN_NAME };`.

That leaves a second public export site for a value the cross-layer conventions require to be "imported from its owner rather than retyped" (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`, the shared-constants paragraph). Nothing breaks today, because the re-export is the same binding. But the next module that needs the name can import it from either place, and a production export whose only caller is a test is the kind of path that later drifts. This is cleanup, not a defect.

**Fix:**

- [ ] In `cli/test/doctor.test.mjs`, replace
  ```js
  const { MARKETPLACE_NAME, PLUGIN_KEY, PLUGIN_NAME } = await loadCompiled('generators/projectSettings.js');
  ```
  with
  ```js
  const { MARKETPLACE_NAME, PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');
  const { PLUGIN_NAME } = await loadCompiled('core/pluginIdentity.js');
  ```
- [ ] In `cli/src/generators/projectSettings.ts`, delete the doc comment `/** Re-exported for \`cli/test/doctor.test.mjs\`, which loads it from this compiled module. */` and the line `export { PLUGIN_NAME };` under it. Keep `import { PLUGIN_NAME } from '../core/pluginIdentity.js';`, because `PLUGIN_KEY` in the same file still uses it.
- [ ] Run `bash scripts/typecheck.sh` and `bash scripts/test.sh`. Both must exit 0. The `doctor` suite's plugin-root cases seed `installed_plugins.json` with `PLUGIN_NAME` and must still pass.
