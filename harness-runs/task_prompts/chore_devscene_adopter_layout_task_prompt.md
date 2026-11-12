`chore_devscene_adopter_layout` renames the files and commands that `init` writes into an adopter's repository and that the plugin exposes, from "harness" to DevScene. It is the fourth of five rename branches after `chore_rename_to_devscene`. No adopters need migrating, so backward compatibility is out of scope: `init`, `doctor` and the scripts look only for the new names.

## The new names

| Today | Becomes |
|---|---|
| `harness.config.json` | `devscene.config.json` |
| `schemas/harness.config.schema.json` | `schemas/devscene.config.schema.json` |
| default `stateDir` `sdlc-harness/` | `devscene/` |
| default scripts directory `harness-scripts/` (`INIT_SCRIPTS_DIR`) | `devscene-scripts/` |
| `.claude/harness-task-offer.md` | `.claude/devscene-task-offer.md` |
| opt-out marker `.claude/harness-no-offer` | `.claude/devscene-no-offer` |
| `/devscene:harness-analyze` | `/devscene:analyze` |
| `/devscene:harness-read-mention` | `/devscene:read-mention` |
| systemd unit `harness-watcher@<slug>.service` | `devscene-watcher@<slug>.service` |
| user-facing message prefix `harness: ` | `devscene: ` |
| hidden HTML-comment stub marker whose text is `harness:unfilled` (`UNFILLED_STUB_MARKER`) | the same comment with the text `devscene:unfilled` |
| hidden HTML-comment banner pair whose texts are `harness:setup-pending` and `/harness:setup-pending` (`SETUP_PENDING_OPEN`, `SETUP_PENDING_CLOSE`) | the same pair with the texts `devscene:setup-pending` and `/devscene:setup-pending` |
| workflow `run-name` values `harness <action> <branch>`, `harness control …`, `harness trigger …` | `devscene <action> <branch>`, `devscene control …`, `devscene trigger …` |
| workflow artifact `harness-poll-state` | `devscene-poll-state` |
| workflow step `Run the harness` | `Run DevScene` |

- The analyze command's spelling lives in `cli/src/core/pluginIdentity.ts` → `ANALYZE_COMMAND`. `docs/development.md` → `## 5. Verifying a change` → gate 6 records the spelling rule, and `scripts/check-command-spelling.sh` enforces it, so those three change together.
- The two markers are written into an adopter's `.claude/CLAUDE.md` and `.claude/context/*.md` stubs, and `init`, `doctor` and the analyze command match them; they live in `cli/src/generators/claudeContext.ts`.
- `remote-run.sh` matches the run names (`harness run`, `harness pause`, `harness stop`) by title, so the workflow templates and the script change together.

## The goal

1. Rename each item in the table everywhere it is generated, read, matched, documented or tested. That covers:
   - `cli/` (config loading and model, generators, `doctor`, daemon units, templates, the outer-loop scripts that read the config at run time);
   - `plugin/` (the command files, and every agent and instruction document that cites the config file, the state directory default, the two markers or the two commands);
   - `schemas/`, including the `package.json` validation scripts and `schemas/negative/` fixtures;
   - `docs/`, the root documents and `llms.txt`.
2. Drop the `scriptsDir` absent-key fallback. `DEFAULTS.scriptsDir` (`cli/src/config/model.ts`) and the schema's `scriptsDir` `default` become `devscene-scripts`, the same value `init` writes, so `INIT_SCRIPTS_DIR` no longer differs from the default. Remove the absent-`scriptsDir` warning in `cli/src/config/check.ts` and the prose that explains the split, including the "`scripts` … by default" wording in `docs/development.md` → Gate 12. A default of `scripts` could name an adopter's own unrelated scripts folder.
3. Rename the example configurations and state directory:
   - `examples/harness.config.json` becomes `examples/devscene.config.json`;
   - `examples/notes-app/`'s `harness.config.json` and `sdlc-harness/` directory take the new names. The captured run artifacts inside keep their recorded text. The example `README.md` already says the run was captured under the earlier name.
4. Rename this repository's own adopted files to match:
   - `harness.config.json` becomes `devscene.config.json`;
   - `.claude/harness-task-offer.md` becomes `.claude/devscene-task-offer.md`;
   - the command and file names in `.claude/CLAUDE.md` and `.claude/context/*.md` are updated.

   Its state directory stays `harness-runs/`. That is this repository's own configured value, kept apart from `cli/templates/state-dir/` and the example on purpose.

## Out of scope

- `scripts/lib/harness-run-lib.sh` and other internal file names an adopter does not act on.
- The `harness-docs` retrieval server and package, and the docs-retrieval database default, which `chore_devscene_docs_retrieval` renames.

## Done when

- A fresh `init` in a scratch repository writes only the new names.
- `doctor` passes there.
- `git grep` for each old name outside `harness-runs/`, the captured example artifacts and recorded-release fixtures returns nothing. The report lists any deliberate leftovers.
- The test suite and the gates pass.

