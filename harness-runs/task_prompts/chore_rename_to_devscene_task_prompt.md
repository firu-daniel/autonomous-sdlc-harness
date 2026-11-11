`chore_rename_to_devscene` renames the product from `autonomous-sdlc-harness` to **DevScene**: the plugin, the marketplace, the npm package and its command, the repository URLs and every prose title. It is the first of five rename branches. The other four rename the remaining names that still say "harness" (labels, workflow files, variables, adopter files, docs retrieval), and each starts only after this one merges.

The reason is product identity. The current name is too long to type as a command prefix (`/autonomous-sdlc-harness:branch-review`) and is not memorable. Sibling products under a `*Scene` family will follow later. There are no adopters to migrate, so backward compatibility is out of scope: no aliases, no `renames` map in `marketplace.json`, no fallback to the old name.

## The spelling

- **Machine names are lowercase `devscene`.** That covers the plugin `name`, the marketplace `name`, the npm package `name`, the `bin` entry and every path or identifier derived from them. **Prose and titles use `DevScene`.**
- The plugin and marketplace share the name, so the install line is `claude plugin install devscene@devscene`. The marketplace is added from `firu-daniel/devscene`; the maintainer renames the GitHub repository by hand.
- `plugin/.claude-plugin/plugin.json` gains `"displayName": "DevScene"`.
- The category noun stays in descriptions: "DevScene, an autonomous SDLC harness for Claude Code". Do not remove the word "harness" from prose; the later branches handle identifiers that contain it.

Facts checked against the current Claude Code plugin docs (code.claude.com/docs/en/plugins/manifest-reference, marketplace-reference, components) on 2026-10-22:
- `claude plugin validate --strict` fails a plugin `name` that is not kebab-case. That is why the machine name is lowercase.
- `devscene` is not a reserved plugin or marketplace name.
- Commands are namespaced `/<plugin>:<command>` and agents `<plugin>:<agent>`, with no alias mechanism.
- `enabledPlugins` keys are `<plugin>@<marketplace>`.

## The goal

1. **Replace every `autonomous-sdlc-harness` literal** in what ships or documents the product: `plugin/`, `cli/` (sources, templates, scripts, README), `schemas/`, `docs/`, `examples/`, the root documents, `llms.txt`, `funding.json`, `package.json` and the `.claude-plugin/` manifests. This includes:
   - the derived names: the XDG state and cache directories, the launchd label prefix `com.autonomous-sdlc-harness.watcher`, the plugin data directory, and the private workspace root `autonomous-sdlc-harness-workspace`;
   - every `autonomous-sdlc-harness:` plugin-qualified command and agent reference;
   - every `firu-daniel/autonomous-sdlc-harness` URL, which becomes `firu-daniel/devscene`.

   `cli/src/core/pluginIdentity.ts` → `PLUGIN_NAME` is the single source for the generated files. Prose quotes the name literally, so it changes by hand.
2. **Update the tests to the new strings.** A fixture that records the bytes of an earlier release keeps them, unless a test can only pass by changing them.
3. **Update the release tooling** (`.github/workflows/release-npm.yml`, `scripts/release.sh`, `scripts/publish-main.sh`, `scripts/tag-release.sh`) and anything else that publishes or checks the package by name.
4. **Update this repository's own adopted files to the new name**: the `.claude/settings.json` enable and marketplace keys, and the command names in `.claude/CLAUDE.md`, `.claude/context/*.md` and `.claude/harness-task-offer.md`. This repository's own run artifacts under `harness-runs/` are history and stay as recorded.
5. **Mark the captured run as historical.** `examples/notes-app/` holds the artifacts of a real recorded run, so its captured artifacts keep their recorded text. The example's `README.md` gains one line saying the run was captured under the product's earlier name.

## Out of scope

- The names that still say "harness" without the full product name: the `sdlc-harness` label and `@sdlc-harness` handle, the `harness-*.yml` workflow files, `HARNESS_*` variables, `harness.config.json`, `harness-scripts/`, the `sdlc-harness/` default state directory, `harness-analyze`, and the `harness-docs` retrieval server. Later branches rename these.
- Publishing to npm, renaming the GitHub repository, and deprecating the old npm package. The maintainer does these by hand.

## Done when

- `git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'` returns only:
  - the captured example artifacts;
  - recorded-release fixtures;
  - the one historical-name line in the example README.

  The report lists every remaining hit and its reason.
- `claude plugin validate plugin --strict` and `claude plugin validate .` pass.
- The test suite and the gates pass.
