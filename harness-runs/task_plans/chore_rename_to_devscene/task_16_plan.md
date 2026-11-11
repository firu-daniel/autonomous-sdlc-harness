### Task 16 — Respell the sandbox-probe and gate-12 scripts, the command-spelling gate and `run-gates.sh`

**Goal:** This repository's own verification scripts name the product `devscene`: what they install, plant, probe and print. Apply the spelling table in the story index's `## Context`.

**Depends on:** Tasks 1, 4, 11 and 14. The values these scripts must agree with, and their owners:

- The package and `bin` `devscene` (Task 1). The JS4 plant shadows that package under `node_modules/`, so it must carry the name the job runs with `npx --yes "devscene@…"`.
- `PLUGIN_KEY` `devscene@devscene`, the marketplace key `devscene` and the cache path `…/devscene/retrieval` (Tasks 1 and 4, mirrored by `sandbox-probe-runner.yml`).
- The plugin name `devscene` (Task 11), which `legs-protection.sh` → `SP__WP_PLUGIN_NAME` looks up in `installed_plugins.json` and in a session's `init` event.

**Where this task stops.** `cli/test/gate12-sandbox-round-plant.test.mjs` pins the JS4 plant's three paths. It is Task 18's, which ships right after Task 17, so its run turns green once this task's `plants.sh` lands. No test file is edited here. `sandbox-probe-runner.yml` reads `.extraKnownMarketplaces["devscene"]` from this repository's `.claude/settings.json`, which keeps the old key until the maintainer applies Task 28's paste. That workflow executes on a GitHub runner, never inside this run, so the mismatch has no reader before the paste lands. The story index's **Manual setup required** orders the paste at merge.

### Targets

- `scripts/sandbox-probe-runner.yml`
- `scripts/lib/sandbox-probe/legs-protection.sh`, `scripts/lib/sandbox-probe/preflight.sh`
- `scripts/lib/gate12-sandbox-round/core.sh`, `scripts/lib/gate12-sandbox-round/plants.sh`
- `scripts/check-command-spelling.sh`
- `scripts/run-gates.sh`

**Work:**

- [ ] `sandbox-probe-runner.yml`: the input description, both `HARNESS_RETRIEVAL_CACHE=…/devscene/retrieval` lines, both `.extraKnownMarketplaces["devscene"]` lookups and their `::error::` texts, `tag="devscene--v$HARNESS_CLI_VERSION"`, `claude plugin install devscene@devscene`, the `select(.id == "devscene@devscene" …)` filter, every `npx --yes "devscene@$HARNESS_CLI_VERSION" …` step and the upgrade-route text.
- [ ] `legs-protection.sh`: `SP__WP_PLUGIN_NAME="devscene"`. `preflight.sh`: the header comment and the `npx --yes "devscene@$HARNESS_CLI_VERSION" doctor …` call.
- [ ] `gate12-sandbox-round/plants.sh`: the JS4 arm's header comment, the heredoc `package.json` (`"name": "devscene"`, `"bin": { "devscene": "bin.js" }`), the link body `../devscene/bin.js`, and the three `g12_plant_add` paths `node_modules/devscene/package.json`, `node_modules/devscene/bin.js` and `node_modules/.bin/devscene`. `gate12-sandbox-round/core.sh`: the row description *"… separately of node_modules/devscene, …"*.
- [ ] `check-command-spelling.sh`: the header's spelling rule `/devscene:<name>`, the three REPRO output lines, and the finding text `bare command spelling; write /devscene:<name>`. The regular expression and every exemption entry are unchanged: neither carries the product name. `run-gates.sh`: the gate-8 line `8  /devscene:harness-analyze, which is judgement and runs inside a model session`.
- [ ] Parse each edited `.sh` file with `bash -n <file>`, and the workflow with `node -e "require('js-yaml').load(require('fs').readFileSync('scripts/sandbox-probe-runner.yml','utf8')); console.log('ok')"`, each as one plain command from the checkout root.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- scripts/sandbox-probe-runner.yml scripts/lib/sandbox-probe scripts/lib/gate12-sandbox-round scripts/check-command-spelling.sh scripts/run-gates.sh` prints nothing.
- `bash -n` exits 0 on each edited script, and the YAML load prints `ok`.
- `git diff -U0 -- scripts/check-command-spelling.sh` shows no changed line inside the exemption table and no change to the matching regular expression.
