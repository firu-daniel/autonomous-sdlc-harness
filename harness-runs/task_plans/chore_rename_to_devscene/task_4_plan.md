### Task 4 — Respell the four workflow templates and the two suites that pin them

**Goal:** The GitHub Actions templates install, pin and run the product under its new names: `npx devscene@<version>`, the plugin `devscene@devscene` from the marketplace `devscene`, the release tag `devscene--v<version>`, and the retrieval cache `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval`. The two suites that pin those strings move with them. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, which set `PLUGIN_NAME` / `MARKETPLACE_NAME` to `devscene` (so `PLUGIN_KEY` is `devscene@devscene`) and `MACHINE_DIR_NAME` to `devscene`. Task 2 respelled `doctor`'s and `init`'s messages. The templates must agree with those values. The workflows read `.extraKnownMarketplaces["devscene"]` from the adopter's `.claude/settings.json`, which `generators/projectSettings.ts` writes under `MARKETPLACE_NAME`. They install `devscene@devscene`, which is `PLUGIN_KEY`. They name the cache directory, which is `MACHINE_DIR_NAME`.

**Cross-file contract stated once here.** The release tag is `devscene--v<version>`. `scripts/tag-release.sh` creates it and `.github/workflows/release-npm.yml` strips it, both in Task 15. This task's templates fetch it. `cli/test/fixtures/harness-control-0.6.1.yml` is a recorded release and keeps its bytes. `cli/test/trigger-workflow-init.test.mjs` reads it as the 0.6.1 shape, so neither file is touched.

### Targets

- `cli/templates/github/workflows/harness-control.yml`
- `cli/templates/github/workflows/harness-resume.yml`
- `cli/templates/github/workflows/harness-run.yml`
- `cli/templates/github/workflows/harness-trigger.yml`
- `cli/test/workflow-plugin-pin.test.mjs`
- `cli/test/workflow-templates.test.mjs`

**Work:**

- [ ] `harness-run.yml`: the header comments (*"runs one devscene run …"*, *"WHO WRITES IT. `devscene init`"*, the `devscene@devscene` and `devscene--v<version>` shape lines, the upgrade-route comments); every `npx --yes "devscene@$HARNESS_CLI_VERSION" …` step; both `HARNESS_RETRIEVAL_CACHE=${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval` lines; the marketplace step's `jq` lookup `.extraKnownMarketplaces["devscene"]` and its `::error::` text; `tag="devscene--v$HARNESS_CLI_VERSION"`; `claude plugin install devscene@devscene`; and the `select(.id == "devscene@devscene" …)` filter.
- [ ] `harness-control.yml`: the header comments, `.extraKnownMarketplaces["devscene"]`, `tag="devscene--v$pin"`, `select(.name == "devscene")` and every `::warning::` text naming the product. `harness-resume.yml` and `harness-trigger.yml`: their header comments, `/devscene:branch-resume` and `npx devscene@<version> init --upgrade-workflows`. `HARNESS_*` variable names and the `harness-*.yml` file names are out of scope and unchanged.
- [ ] `workflow-plugin-pin.test.mjs`: `PLUGIN_KEY = 'devscene@devscene'`; the planted `plugin.json` / `marketplace.json` names; the tag `devscene--v9.0.0`; the `extraKnownMarketplaces` key; and the expected `devscene--v9.2.0` in output. Keep its header's statement of the rule it enforces, respelled where it names the product.
- [ ] `workflow-templates.test.mjs`: the two expected `npx --yes "devscene@$HARNESS_CLI_VERSION" doctor …` bodies, the `devscene--v` tag assertion and the comment about the machine cache path's `devscene/` segment.
- [ ] Run the two suites this task edited, `npm test --workspace cli -- test/workflow-plugin-pin.test.mjs` and `npm test --workspace cli -- test/workflow-templates.test.mjs`, from the checkout root, each as one plain foreground command.

**Verification:**

- Both edited suites pass.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/templates/github cli/test/workflow-plugin-pin.test.mjs cli/test/workflow-templates.test.mjs` prints nothing.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/test/fixtures/harness-control-0.6.1.yml` still prints its two recorded lines: the recorded release is untouched.
