### Task 22 — Respell the `remote-run`, remote-names, workflow-template and delivery suites

**Goal:** Bring the suites that hold the remote mirrors in line with the new names: the run titles `devscene <action> <branch>`, `devscene control …` and `devscene trigger …`, the step `Run DevScene`, the artifact `devscene-poll-state`, the command `/devscene:read-mention`, and `devscene.config.json` with its `devscene-scripts` / `devscene` jq fallbacks.

**Depends on:**
- Task 4: `POLL_STATE_ARTIFACT_NAME = 'devscene-poll-state'`, `MENTION_COMMAND_NAME = 'read-mention'`, `MENTION_COMMAND = '/devscene:read-mention'`.
- Task 6: the workflow templates and `remote-run.sh` carrying the same values, and every run-title literal under row 12 of `## Context`'s spelling table.

**Where this task stops.** These suites are the ones that keep the mirror pairs aligned (`## Context` → *Top risks*, first bullet). Each pins the new value through the owning constant where it already imports one, and as a literal only where it already spelled one. `gh` stub fixtures that list runs carry `displayTitle` values in the new title form. A stub keyed on an old title would make a lookup silently find nothing.

### Targets

- `cli/test/remote-run.test.mjs`, `cli/test/remote-save-links.test.mjs`, `cli/test/remote-names.test.mjs`, `cli/test/remote-start.test.mjs`, `cli/test/remote-open.test.mjs`
- `cli/test/remote-deliver.test.mjs`, `cli/test/remote-deliver-threads.test.mjs`, `cli/test/prompt-injection-remote-route.test.mjs`
- `cli/test/workflow-templates.test.mjs`, `cli/test/workflow-sandbox-install.test.mjs`

**Work:**

- [ ] `workflow-templates.test.mjs`: the run-name assertion `LINES.includes('run-name: devscene ${{ inputs.action }} ${{ inputs.branch }}')`. The control case *"the run-name never matches a devscene <action> <branch> title"* with its expected `run-name: devscene control …` line. Every `'Run DevScene'` step reference. The `.scriptsDir // "devscene-scripts"` / `devscene.config.json` expectations and every comment.
- [ ] `workflow-sandbox-install.test.mjs`: `const HARNESS = 'Run DevScene';` (the identifier stays) and rows 1 and 14.
- [ ] `remote-names.test.mjs`: `assert.equal(MENTION_COMMAND_NAME, 'read-mention')`, `assert.equal(MENTION_COMMAND, '/devscene:read-mention')`, and rows 1 and 2 in fixtures.
- [ ] `remote-run.test.mjs`, `remote-save-links.test.mjs`: every `gh` stub `displayTitle` and every expected title in row 12's new form. The `artifacts: { …: ['devscene-poll-state'] }` entries, with `'harness-state'` kept. Rows 1–3 in fixtures and comments.
- [ ] `remote-start.test.mjs`, `remote-open.test.mjs`, `remote-deliver.test.mjs`, `remote-deliver-threads.test.mjs`, `prompt-injection-remote-route.test.mjs`: rows 1–3 and 12 (for example `` displayTitle: `devscene run ${branch}` ``).

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-read-mention|harness-poll-state|Run the harness|harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)|harness <action>|harness [$][{][{]|// "scripts"' --` followed by this task's ten target paths prints nothing.
- `git grep -n "'harness-state'" -- cli/test/remote-run.test.mjs` still prints its kept artifact entries.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file.

**Deviations from plan:**
- `workflow-templates.test.mjs` → *"no configured directory is frozen into the file"*: row 2 alone turns its guard into `/(^|[^A-Za-z0-9_-])devscene\//m`, which matches the retrieval cache path `${XDG_CACHE_HOME:-$HOME/.cache}/devscene/retrieval` that `cli/templates/github/workflows/devscene-run.yml` carries twice (measured: the case failed with that regex). The default state dir and the cache segment now share a spelling, so the guard excludes exactly the `.cache}/` prefix with a lookbehind, `/(?<!\.cache\}\/)(?<![A-Za-z0-9_-])devscene\//m`, and its comment says so. A state-dir path such as `$GITHUB_WORKSPACE/devscene/` still fails it.
- Row 12 left as prose, by the table's judgement rule: the `remote-run.test.mjs` test titles *"fetch with no harness run listed …"*, *"… with no harness run on GitHub …"* (two), and the progress-comment fixture body *"Progress of the harness run on `feat_x`"*, which mirrors the noun phrase `remote-run.sh` documents for that comment. The two `poll … devscene stop run …` test titles name runs by title and were respelled.
