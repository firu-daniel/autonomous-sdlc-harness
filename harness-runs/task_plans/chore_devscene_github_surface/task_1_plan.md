### Task 1 — Respell the GitHub-surface constants in `cli/src/remote/githubActions.ts`

**Goal:** Change the one owner of every GitHub-surface name to the new spellings, so that `doctor`, `init` and the workflow generator, which all import these constants, print and write the new names.

**Where this task stops.** It changes only the constants' values and this module's own comments. The shell and YAML mirrors are other tasks' work: `cli/templates/scripts/remote-run.sh` (Task 3), `cli/templates/scripts/lib/harness-run-lib.sh` (Task 4) and the four workflow templates (Task 2). Until Task 2 lands, `readTemplate` asks for `github/workflows/devscene-*.yml` files that do not exist yet. That is expected: no gate runs between tasks, and nothing in this task runs `init`.

### Targets

- `cli/src/remote/githubActions.ts`

**Work:**

- [ ] Set the four workflow file names: `WORKFLOW_RUN_FILE = 'devscene-run.yml'`, `WORKFLOW_RESUME_FILE = 'devscene-resume.yml'`, `WORKFLOW_TRIGGER_FILE = 'devscene-trigger.yml'`, `WORKFLOW_CONTROL_FILE = 'devscene-control.yml'`. The `*_PATH` constants derive from them and need no edit.
- [ ] Set the four GitHub-surface literals: `COMMAND_HANDLE = '@dev-scene'`, `COMMENT_MARKER = '<!-- devscene'`, `STATE_LABEL_PREFIX = 'devscene: '` (with its trailing space), `DEFAULT_TRIGGER_LABEL = 'devscene'`. `STATE_LABELS` derives from the prefix.
- [ ] Respell every old name in this module's comments. That covers the module header's list of shell and YAML mirrors (`cli/templates/github/workflows/devscene-run.yml`, `…/devscene-resume.yml`, `…/devscene-trigger.yml`, `…/devscene-control.yml`), the `COMMENT_MARKER` doc comment's line shape (`<!-- devscene event=<event> branch=<branch>[ question=<n>][ engine=<engine>] -->`), and the doc comments on `LEGACY_TRIGGER_LABEL`, `triggerFallbackLabel`, `carriesMentionCredential` and `CLI_VERSION_VARIABLE`.
- [ ] Leave these unchanged, as `## Context` → *What keeps its current spelling* requires: `LEGACY_TRIGGER_LABEL` (`'harness'`), `TRIGGER_DISPATCH_EVENT_TYPE` (`'harness-task'`), `STATE_ARTIFACT_NAME`, `POLL_STATE_ARTIFACT_NAME`, every `HARNESS_*` variable and secret name, and `MENTION_COMMAND_NAME`.

**Verification:**

- `grep -nE "sdlc-harness|harness-(trigger|run|control|resume)\.yml" cli/src/remote/githubActions.ts` prints nothing.
- `grep -nE "^export const (WORKFLOW_(RUN|RESUME|TRIGGER|CONTROL)_FILE|COMMAND_HANDLE|COMMENT_MARKER|STATE_LABEL_PREFIX|DEFAULT_TRIGGER_LABEL) =" cli/src/remote/githubActions.ts` shows exactly the eight literals above, and `LEGACY_TRIGGER_LABEL` still reads `'harness'`.
- Mirror check for later tasks. Tasks 2–4 restate these eight literals and must match them byte for byte. `cli/test/remote-names.test.mjs` (Task 7) asserts them.

**Deviations from plan:**

- The `LEGACY_TRIGGER_LABEL` and `triggerFallbackLabel` doc comments describe a trigger workflow committed by an **earlier release**, which an adopter's repository carries under its old file name. Writing `devscene-trigger.yml` there would be false, so both now say "trigger workflow" without naming a file. The verification grep still comes back empty. `carriesMentionCredential`, `CLI_VERSION_VARIABLE` and the header's mirror list now carry the new `devscene-*.yml` names.
