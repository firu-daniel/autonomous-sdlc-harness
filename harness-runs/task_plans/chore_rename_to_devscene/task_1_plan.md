### Task 1 — Rename the identity constants and the package manifest: `PLUGIN_NAME`, `MARKETPLACE_NAME`, `MACHINE_DIR_NAME`, the launchd label, `KEEP_AWAKE_WHO`, `RUNTIME_CLI_RELATIVE`, the `.gitignore` block header, `cli/package.json` and `cli/NOTICE`

**Goal:** Change every name the CLI derives other strings from, in the module that owns it, so that everything built from these constants moves with them. Apply the spelling table in the story index's `## Context`.

**Where this task stops.** It owns the seven `cli/src` files below **entirely**: every literal in them changes here, comments included. Every other `cli/src` file is Task 2's. The shell halves of the mirrored names are Task 6's (`HR_KEEP_AWAKE_WHO`, `hr_cache_dir` / `hr_config_dir` / `hr_state_dir`, the placeholder directory, `docs-search-server.sh`'s runtime entry) and Task 5's (`remote-run.sh` → `MENTION_COMMAND`). The suites that pin these constants are respelled by Tasks 4, 7, 8, 9, 10 and 18, after both halves have landed. So this task edits no test file. Until those tasks land, suites that pin the old strings are red. That is expected.

### Targets

- `cli/src/core/pluginIdentity.ts`
- `cli/src/generators/projectSettings.ts`
- `cli/src/machine/paths.ts`
- `cli/src/daemon/units.ts`
- `cli/src/doctor/keepAwake.ts`
- `cli/src/retrieval/runtime.ts`
- `cli/src/generators/repoRoot.ts`
- `cli/package.json`
- `cli/NOTICE`

**Work:**

- [ ] `pluginIdentity.ts`: `PLUGIN_NAME = 'devscene'`. `ANALYZE_COMMAND`, `USER_REVIEW_COMMAND` and `cli/src/remote/githubActions.ts` → `MENTION_COMMAND` are built from it and need no edit. `projectSettings.ts`: `MARKETPLACE_NAME = 'devscene'`, and the doc comment's `autonomous-sdlc-harness@autonomous-sdlc-harness` becomes `devscene@devscene` (*"the doubling is correct and must not be"* stays). So `PLUGIN_KEY` becomes `devscene@devscene`.
- [ ] `machine/paths.ts`: `MACHINE_DIR_NAME = 'devscene'`, and the four doc comments that spell `${XDG_*}/autonomous-sdlc-harness` respelled. `daemon/units.ts`: `LAUNCHD_LABEL_PREFIX = 'com.devscene.watcher'`, and the three comments spelling `com.autonomous-sdlc-harness.watcher.<slug>` respelled. `doctor/keepAwake.ts`: `KEEP_AWAKE_WHO = 'devscene'`. Each module's header that names its shell mirror keeps naming it. Only the value changes.
- [ ] `retrieval/runtime.ts`: `RUNTIME_CLI_RELATIVE = 'node_modules/devscene/dist/cli.js'`, the two header comments (`node_modules/…/dist/cli.js`, the `actions/cache` path `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval`) and the `npx … init` message respelled. `repoRoot.ts`: the managed-block header becomes `'# >>> devscene (managed block: this line to the next blank line; re-run init to extend it) >>>'`, with the rest byte-identical. `scripts/publish-main.sh`'s strip pattern (Task 15) and this repository's `.gitignore` (Task 14) follow it.
- [ ] `cli/package.json`: `"name": "devscene"`, `"bin": { "devscene": "./dist/cli.js" }`, `homepage` and `repository.url` on `https://github.com/firu-daniel/devscene` (the `.git` suffix kept on `repository.url`), and `description` opening *"The outer loop of DevScene, an autonomous SDLC harness: …"* with the rest of the sentence kept. `version`, `files`, `engines` and the dependency blocks are unchanged. The root `package-lock.json` workspace entries follow in Task 14.
- [ ] `cli/NOTICE`: line 1 becomes `DevScene`. Nothing else in the file changes.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- cli/src/core/pluginIdentity.ts cli/src/generators/projectSettings.ts cli/src/machine/paths.ts cli/src/daemon/units.ts cli/src/doctor/keepAwake.ts cli/src/retrieval/runtime.ts cli/src/generators/repoRoot.ts cli/package.json cli/NOTICE` prints nothing.
- `node -e "const p=require('./cli/package.json'); console.log(p.name, Object.keys(p.bin).join(','), p.repository.url)"`, run from the checkout root, prints `devscene devscene https://github.com/firu-daniel/devscene.git`.
- `git grep -n -E "'(com\.)?devscene(\.watcher)?'|node_modules/devscene/dist/cli\.js|# >>> devscene \(managed block" -- cli/src` lists the constant definitions above and no second definition of any of them.
