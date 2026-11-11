`chore_devscene_github_surface` renames what an adopter sees on GitHub to DevScene: the trigger and state labels, the comment-mention handle, and the workflow files. It is the second of five rename branches after `chore_rename_to_devscene`, which renamed the plugin, the npm package and the repository. No adopters need migrating, so backward compatibility is out of scope: nothing keeps the old names working.

## The new names

| Today | Becomes |
|---|---|
| trigger label `sdlc-harness` (the `HARNESS_TRIGGER_LABEL` default) | `devscene` |
| state labels `sdlc-harness: <state>` (`running`, `paused`, …) | `devscene: <state>` |
| comment handle `@sdlc-harness` | `@dev-scene` |
| hidden comment marker `<!-- sdlc-harness` | `<!-- devscene` |
| `harness-trigger.yml`, `harness-run.yml`, `harness-control.yml`, `harness-resume.yml` | `devscene-trigger.yml`, `devscene-run.yml`, `devscene-control.yml`, `devscene-resume.yml` |
| workflow `name:` values `harness-trigger`, … | `devscene-trigger`, … |

- The handle is `@dev-scene`, with a hyphen, because the GitHub account `devscene` belongs to someone else. The maintainer creates the free organisation `dev-scene` to hold it, the same way `sdlc-harness` holds the current one.
- The label and marker use `devscene` without a hyphen, matching the product's machine name.
- The handle must still be the first word of the comment's first line, as the current one must be.

## The goal

1. Rename the label, handle, marker and workflow file names everywhere they are generated, matched, documented or tested. That includes:
   - `cli/src/generators/githubWorkflows.ts` (including the `if:` expressions that match the handle, the marker and the state-label prefix);
   - `cli/src/remote/`;
   - `cli/templates/github/workflows/` and `cli/templates/scripts/remote-run.sh`;
   - `doctor`'s workflow and label checks with their `gh label create` remedy;
   - `plugin/commands/harness-read-mention.md` and the commands that tell the user which label or handle to use;
   - `docs/`, `ARCHITECTURE.md`, `README.md` and `llms.txt`.
2. Rename the template files themselves. `scripts/check-rendered-workflows.mjs` keeps checking the renamed set.
3. Update the tests. A fixture that records the bytes of an earlier release (such as `cli/test/fixtures/harness-control-0.6.1.yml`) keeps them, unless a test can only pass by changing them.

## Out of scope

- The `HARNESS_*` repository variables and secrets the workflows read. A later branch renames them.
- `harness-read-mention`'s own command name. A later branch renames it.
- This repository's `.github/workflows/` (`publish-main.yml`, `release-npm.yml`, `supply-chain.yml`). They are its own CI, not the adopter templates.

## Done when

- No generated workflow, script, `doctor` message or document names `sdlc-harness` as a label, handle or marker.
- No generated workflow, script, `doctor` message or document names a `harness-{trigger,run,control,resume}.yml` file, except recorded-release fixtures. The report lists those.
- The test suite and the gates pass.
