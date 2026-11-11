### Task 12 — Respell the `remote-run` and `remote-trigger` suites

**Goal:** Make the suites for `remote-run.sh`'s dispatch, poller and trigger verbs assert the new workflow file names, trigger label, marker and state labels.

**Depends on:** Task 3. `cli/templates/scripts/remote-run.sh` sets `WORKFLOW_RUN_FILE='devscene-run.yml'`, `WORKFLOW_RESUME_FILE='devscene-resume.yml'`, `DEFAULT_TRIGGER_LABEL='devscene'`, `COMMENT_MARKER='<!-- devscene'` and `STATE_LABEL_PREFIX='devscene: '`. So:
- `trigger` admits the label `devscene` when `HARNESS_TRIGGER_LABEL` is empty, still admits `LEGACY_TRIGGER_LABEL` (`harness`), and removes the label it matched;
- `poll` enables and disables `devscene-resume.yml`;
- notifications name `devscene-run.yml`.

Task 4's run library mirrors `devscene-run.yml`.

**Where this task stops.** It edits only these two suites.

### Targets

- `cli/test/remote-run.test.mjs`
- `cli/test/remote-trigger.test.mjs`

**Work:**

- [ ] `remote-run.test.mjs`: respell every `workflow run|enable|disable|list … harness-*.yml` call line and every regex naming a workflow file to `devscene-*.yml`. Examples: `/Run workflow on devscene-run\.yml .*resume pause/`, `/re-enabled devscene-resume\.yml/` and `/HTTP 404: devscene-run\.yml not found/`.
- [ ] `remote-run.test.mjs`: respell the provenance prompts' label (`` `devscene` ``), every marker line and every state label.
- [ ] `remote-trigger.test.mjs`:
  - respell the labelled-event payload (`label: { name: 'devscene' }`), the `removals` helper's default label, the provenance regex, and every dispatch and `run list --workflow devscene-run.yml` line;
  - respell the comment-body assertions (`/devscene-run\.yml.*Run workflow/s`, the `actions/workflows/devscene-run.yml?query=…` URL) and every marker line.
- [ ] `remote-trigger.test.mjs`, the legacy case: keep the event label `harness`, which is `LEGACY_TRIGGER_LABEL`. Set its configured `HARNESS_TRIGGER_LABEL` to `'devscene'`. The case still asserts exactly what it asserts today about the legacy label.
- [ ] In both, leave `const STATE_DIR = 'sdlc-harness'` and every `sdlc-harness/` path unchanged.

**Verification:**

- `npm test --workspace cli -- test/remote-run.test.mjs` passes.
- `npm test --workspace cli -- test/remote-trigger.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|label .{0,2}sdlc-harness|name: 'sdlc-harness'|label = 'sdlc-harness'|'sdlc-harness' \}|harness-(trigger|run|control|resume)([^-a-z]|$)" cli/test/remote-run.test.mjs cli/test/remote-trigger.test.mjs` prints nothing.
