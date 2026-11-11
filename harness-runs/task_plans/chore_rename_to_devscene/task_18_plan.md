### Task 18 — Respell the three cli suites that read this repository's own root-level files: `init`, the gate-12 plant and the sandbox-probe job launch

**Goal:** The three `cli/test` suites whose input includes files at this repository's root, not only templates and `cli/src`, expect the renamed names and pass.

**Depends on:** Tasks 1, 2, 3, 6, 7, 11, 14, 16 and 17. The values these suites pin, and their owners:

- For `init.test.mjs`:
  - `ANALYZE_COMMAND` = `/devscene:harness-analyze` and `PLUGIN_KEY` `devscene@devscene` (Task 1), the `.gitignore` marker `>>> devscene (managed block` (Task 1, `generators/repoRoot.ts`), the machine directory `devscene` and the retrieval runtime `…/devscene/retrieval/runtime` (Task 1).
  - `cli/package.json` → `repository.url` `https://github.com/firu-daniel/devscene.git` (Task 1), from which the suite derives `<owner>/<repo>` and `UNRESOLVED_REPOSITORY_URL` `https://github.com/<owner>/devscene.git`.
  - Every `npx devscene …` step line and `devscene@<version>` install note (Task 2); the `.claude/` and state-dir templates' rendered text, the task-offer's `devscene:branch-prompt` included (Task 3); the scripts README (Task 6); the fixture helper (Task 7).
  - `plugin/.claude-plugin/plugin.json` → `name` `devscene`, `homepage` and `repository` on `firu-daniel/devscene` (Task 11), and `.claude-plugin/marketplace.json` → `name` `devscene` and `plugins[0].homepage` on `firu-daniel/devscene` (Task 14). The suite reads both from this workspace, in its rendered-offer case (`settings.enabledPlugins` equals `` `${plugin.name}@${marketplace.name}` ``, the offer names `` `${plugin.name}:branch-prompt` ``), in `pluginKey()`, and in *"the shipped manifests name a resolved owner, agree on it, and resolve an unflagged run"*.
- For `gate12-sandbox-round-plant.test.mjs`: Task 16, which renamed the JS4 plant in `scripts/lib/gate12-sandbox-round/plants.sh` to the three paths `node_modules/.bin/devscene` (a `120000` link), `node_modules/devscene/bin.js` (`100755`) and `node_modules/devscene/package.json` (`100644`).
- For `sandbox-probe-job-launch.test.mjs`: Task 17, which copied the renamed library to `scripts/lib/harness-run-lib.sh`, whose placeholder manifest is now `$RUNNER_TEMP/devscene-placeholders/<branch>.absent`.

**Why this cli task ships among the general ones.** Its producers include root-level files owned by the `plugin` and catch-all layers (Tasks 11, 14, 16 and 17), and its consumers sit under `cli/test/`, so it can only run green after the last of them. The story index's `## Context` states the shared rule once.

### Targets

- `cli/test/init.test.mjs`
- `cli/test/gate12-sandbox-round-plant.test.mjs`
- `cli/test/sandbox-probe-job-launch.test.mjs`

**Work:**

- [ ] `init.test.mjs`: `GITIGNORE_MARKER = '>>> devscene (managed block'`, `ANALYZE_COMMAND = '/devscene:harness-analyze'`, `ANALYZE_FIRST_REMEDY`, the `/devscene:branch-*` and `/devscene:harness-*` expectations, `DAEMON_INSTALL_STEP`, `CHECK_REGISTRY_STEP`, `CONFIG_SET_RUN_SETTING`, `UNRESOLVED_REPOSITORY_URL = 'https://github.com/<owner>/devscene.git'`, `MACHINE_DIR = 'devscene'`, the retrieval `runtimeDir`, the `devscene@${version}` install-note assertion, the closing-notes `npx devscene init` assertion, and every comment naming the product. The cases that build the plugin key from the two manifests are not edited to hardcode it: they read the renamed manifests as they stand.
- [ ] `gate12-sandbox-round-plant.test.mjs`: the JS4 `node-modules` arm's three expected lines become `'120000 node_modules/.bin/devscene'`, `'100755 node_modules/devscene/bin.js'` and `'100644 node_modules/devscene/package.json'`, in that path-sorted order. The header's note that it reads one fixed script, and so owes no `treeGuards` entry, stays as it is.
- [ ] `sandbox-probe-job-launch.test.mjs`: `manifestAt` joins `'devscene-placeholders'`.
- [ ] Run each of the three suites through `npm test --workspace cli -- test/<name>.test.mjs` from the checkout root, one plain foreground command each.

**Verification:**

- All three suites pass.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/test` prints only `cli/test/fixtures/harness-control-0.6.1.yml`'s recorded lines.
