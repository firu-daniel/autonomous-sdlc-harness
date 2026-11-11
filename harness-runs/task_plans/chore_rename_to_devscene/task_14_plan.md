### Task 14 — Rename the marketplace manifest, the workspace root and the root identity files

**Goal:** The repository-root files that name the product move to the new names: the marketplace manifest, the private workspace root and its lockfile, both licence notices' title line, the funding manifest, this repository's rendered `.gitattributes` / `.gitignore` headers and `harness.config.json` → `projectName`. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, which renamed the npm package to `devscene` (`cli/package.json` → `name`, `bin`) and the managed-block header in `cli/src/generators/repoRoot.ts` to `# >>> devscene (managed block: this line to the next blank line; re-run init to extend it) >>>`. Also Task 11, which renamed the plugin to `devscene`. The lockfile's workspace entries must name the package `cli/package.json` names. This repository's `.gitignore` header must be the line `repoRoot.ts` writes, so that a later `init` here recognises the block rather than adding a second one. Task 15 then moves `scripts/publish-main.sh`'s strip pattern to the same line.

**Where this task stops.** `.claude/settings.json` carries the marketplace key and the `enabledPlugins` key this manifest pairs with, but it sits under `.claude/**`, so it is Task 28's paste, applied by the maintainer at merge together with the plugin reinstall. Changing `projectName` does not affect this run. The watcher reads it from the main checkout. The guard library also reads it at run time: `plugin/hooks/lib/harness-config-lib.sh` → `hc_project_name` reads `.projectName` from the resolved repository root, which in this run is the run copy, so from this task on it returns `devscene`. That value only builds the sibling-worktree arms, `<work_root>/<project_name>-*` (`hc_in_workspace`, and the stem `wt="$work/$project-"` in `hc_path_anchored_patterns`). Those arms now match `<work_root>/devscene-*` instead of `<work_root>/autonomous-sdlc-harness-*`. That is harmless for Tasks 15–28: every command they run targets paths inside the run copy's own root, which the root arms (`"$root"|"$root"/*`) match whatever `projectName` says, and none of them touches a sibling worktree. The run-copy check in `hc_main_root` (`want="$(hc_work_root "$cand")/$(hc_project_name "$cand")-…"`) reads `projectName` from the main checkout `$cand`, which keeps the old value until merge. After merge the maintainer regenerates the machine-local profile, as the story index's **Manual setup required** says.

### Targets

- `.claude-plugin/marketplace.json`
- `package.json`, `package-lock.json`
- `NOTICE`, `funding.json`
- `.gitattributes`, `.gitignore`
- `harness.config.json`

**Work:**

- [x] `.claude-plugin/marketplace.json`: the top-level `"name": "devscene"`; `plugins[0].name` `"devscene"`; `plugins[0].homepage` `https://github.com/firu-daniel/devscene`; `plugins[0].description` *"DevScene, an autonomous SDLC harness for Claude Code: plan, implement, review, QA and ship a branch end to end."*; and `metadata.description` *"The DevScene marketplace: an autonomous SDLC harness for Claude Code."* No `version` is added to the plugin entry (`plugin/.claude-plugin/plugin.json` is the sole version of record), and no `renames` key is added.
- [x] `package.json`: `"name": "devscene-workspace"` and `description` *"Private workspace root for the DevScene plugin and CLI. Not published."* `package-lock.json`: the root `name` (twice) becomes `devscene-workspace`; the `cli` package entry's `name` becomes `devscene` and its `bin` key `devscene`; and the link entry `node_modules/autonomous-sdlc-harness` becomes `node_modules/devscene`, with its body unchanged.
- [x] `NOTICE` line 1: `DevScene`. `funding.json`: the maintainer description *"Independent maintainer of DevScene, an autonomous software-delivery harness for Claude Code."*, the project `guid` and `name` `devscene`, and both URLs on `https://github.com/firu-daniel/devscene`.
- [x] `.gitattributes` line 1: `# Written by \`devscene init\`, and yours from there on: …`, with the rest of the line kept. `.gitignore`: the managed-block header line exactly as `cli/src/generators/repoRoot.ts` now writes it. `harness.config.json`: `"projectName": "devscene"`, and nothing else in the file.
- [x] Confirm the lockfile agrees with both manifests. Run `node -e "const l=require('./package-lock.json'); console.log(l.name, l.packages[''].name, l.packages.cli.name, Object.keys(l.packages.cli.bin).join(','), l.packages['node_modules/devscene'].link)"` from the checkout root. It must print `devscene-workspace devscene-workspace devscene devscene true`.
  - **Deviations from plan:** The lockfile's `node_modules/devscene` link entry was moved, with its body unchanged, from where `node_modules/autonomous-sdlc-harness` sat to its sorted position between `node_modules/detect-libc` and `node_modules/dunder-proto`. npm keeps `packages` keys sorted, so the next `npm install` would make the same move.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- .claude-plugin package.json package-lock.json NOTICE funding.json .gitattributes .gitignore harness.config.json` prints nothing.
- `node -e "for (const f of ['.claude-plugin/marketplace.json','package.json','package-lock.json','funding.json','harness.config.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('ok')"` prints `ok`.
- `git grep -n -F '# >>> devscene (managed block' -- .gitignore cli/src/generators/repoRoot.ts` shows both lines, carrying identical text.
