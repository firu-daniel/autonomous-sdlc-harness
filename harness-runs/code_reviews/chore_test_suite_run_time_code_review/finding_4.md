### 4. The reason `doctor.test.mjs` imports `PLUGIN_KEY` from the compiled CLI was left about 4,300 lines below the import it explains

**File:** `cli/test/doctor.test.mjs`. The moved import: "// Read by the plugin-permissions cases below; a top-level `await` cannot sit inside the suite callback." (line hint 267). The paragraph left behind: "`PLUGIN_KEY` is imported from the compiled CLI for {@link repoSlug}'s reason" (line hint 4574), inside the doc comment above `const CLAUDE_PLUGINS_DIR = 'plugins';`.

**Problem.** Task 3 moved `const { MARKETPLACE_NAME, PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');` and its `PLUGIN_NAME` sibling above `concurrentSuite('doctor', …)`, because a top-level `await` cannot run inside the suite callback. The doc comment that justified the import stayed where it was. The sentence "a record seeded under any other key is a record the check correctly reports nothing about, so it has to be the CLI's own string rather than this file's guess at it" now sits on `CLAUDE_PLUGINS_DIR`, which is not imported. The import itself carries only a note about placement. Someone editing the import sees no reason not to replace it with a literal. `init.test.mjs` moved its equivalent `PLUGIN_KEY` comment along with its import in Task 4.

**Fix.**

- [ ] In the doc comment above `const CLAUDE_PLUGINS_DIR = 'plugins';`, delete the paragraph that begins "`PLUGIN_KEY` is imported from the compiled CLI for {@link repoSlug}'s reason" and ends "rather than this file's guess at it." Keep the comment's first paragraph ("The plugin's install root, as the agent runner records it…").
- [ ] Replace the one-line comment above the moved imports with:

```js
/**
 * Read by the plugin-permissions cases below, and loaded here because a top-level `await` cannot
 * sit inside the suite callback. `PLUGIN_KEY` is imported from the compiled CLI for
 * {@link repoSlug}'s reason: a record seeded under any other key is a record the check correctly
 * reports nothing about, so it has to be the CLI's own string rather than this file's guess at it.
 */
```

**Verification:** `grep -n "is imported from the compiled CLI for" cli/test/doctor.test.mjs` prints one line, directly above the `loadCompiled('generators/projectSettings.js')` import. `npm test` passes.
