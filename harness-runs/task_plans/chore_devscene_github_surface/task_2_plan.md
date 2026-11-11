### Task 2 — Rename the four workflow templates to `devscene-*.yml` and respell their contents

**Goal:** Make the templates `init` copies into an adopter's `.github/workflows/` carry the new file names, `name:` values, trigger label, handle, marker and state-label prefix.

**Depends on:** Task 1, which sets `WORKFLOW_TEMPLATE_DIR`'s four file names to `devscene-run.yml`, `devscene-resume.yml`, `devscene-trigger.yml` and `devscene-control.yml`, and the literals `COMMAND_HANDLE = '@dev-scene'`, `COMMENT_MARKER = '<!-- devscene'`, `STATE_LABEL_PREFIX = 'devscene: '` and `DEFAULT_TRIGGER_LABEL = 'devscene'`. `cli/src/generators/githubWorkflows.ts` reads each template as `` `${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_*_FILE}` ``, so the new file names below must equal Task 1's constants exactly.

**Where this task stops.** The suites that read these templates (`cli/test/workflow-templates.test.mjs`, `cli/test/trigger-workflow-init.test.mjs`, `cli/test/workflow-plugin-pin.test.mjs`, `cli/test/workflow-sandbox-install.test.mjs`) are Task 7's. The script templates the workflows call are Tasks 3 and 4's.

### Targets

Each old path is deleted and its content moves to the new path. A `git mv` is the simplest way. The commit must stage both the deletion and the new file.

- `cli/templates/github/workflows/harness-trigger.yml` → `cli/templates/github/workflows/devscene-trigger.yml`
- `cli/templates/github/workflows/harness-control.yml` → `cli/templates/github/workflows/devscene-control.yml`
- `cli/templates/github/workflows/harness-run.yml` → `cli/templates/github/workflows/devscene-run.yml`
- `cli/templates/github/workflows/harness-resume.yml` → `cli/templates/github/workflows/devscene-resume.yml`

**Work:**

- [ ] Move the four files to their new names, with content otherwise unchanged by the move itself.
- [ ] `devscene-trigger.yml`: change `name: harness-trigger` to `name: devscene-trigger`. Change both trigger-label fallbacks to `'devscene'`: the job `if:` `(vars.HARNESS_TRIGGER_LABEL || 'devscene')` and the step env `${{ vars.HARNESS_TRIGGER_LABEL || 'devscene' }}`. `cli/src/remote/githubActions.ts` → `triggerFallbackLabel` parses the first of these, so keep its `(vars.HARNESS_TRIGGER_LABEL || '<label>')` shape byte for byte apart from the label. Respell the header comments: the first line `# devscene-trigger.yml — …`, the `DEFAULT_TRIGGER_LABEL` mirror line and every `harness-run.yml` mention.
- [ ] `devscene-control.yml`: change `name: harness-control` to `name: devscene-control`. In the job `if:` block scalar, change `'@sdlc-harness'` to `'@dev-scene'`, `'<!-- sdlc-harness'` to `'<!-- devscene'` and `'sdlc-harness: '` to `'devscene: '`; leave everything else in the expression byte-identical. In the `Fetch the pinned plugin` step, change the awk input path to `.github/workflows/devscene-run.yml` and the `::warning::` text likewise. That path mirrors `WORKFLOW_RUN_FILE`. Respell the header comments, including the first line, the `COMMAND_HANDLE` / `COMMENT_MARKER` lines of the `# DECLARED MIRRORS` block, the `'sdlc-harness: '` note about the plain scalar, and every `harness-run.yml` / `harness-trigger.yml` mention.
- [ ] `devscene-run.yml` and `devscene-resume.yml`: change `name: harness-run` to `name: devscene-run` and `name: harness-resume` to `name: devscene-resume`. Respell every `harness-control.yml`, `harness-resume.yml` and `harness-run.yml` mention in their comments, including each file's first line and `gh workflow disable devscene-resume.yml`.
- [ ] Leave these unchanged in all four files (`## Context` → *What keeps its current spelling*): the concurrency groups (`group: harness-resume`, `harness-run-${{ inputs.branch }}`, `harness-review-…`, `format('harness-control-{0}', …)`), every `run-name:` value, `harness-task`, the `harness-state` and `harness-poll-state` artifacts, every `HARNESS_*` name, the `.stateDir // "sdlc-harness"` jq default in the resume workflow, and every `lib/harness-run-lib.sh` path.

**Verification:**

- `ls cli/templates/github/workflows` lists exactly `devscene-control.yml`, `devscene-resume.yml`, `devscene-run.yml` and `devscene-trigger.yml`.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness: |'sdlc-harness'|harness-(trigger|run|control|resume)\.yml|^name: harness-" cli/templates/github/workflows/*.yml` prints nothing.
- `grep -n "sdlc-harness" cli/templates/github/workflows/*.yml` prints only the resume workflow's `.stateDir // "sdlc-harness"` line.
- The control workflow's job `if:` still carries `'devscene: '`, with its colon-space inside the quoted literal, and is still written as the `if: >-` folded block scalar, so it parses.
