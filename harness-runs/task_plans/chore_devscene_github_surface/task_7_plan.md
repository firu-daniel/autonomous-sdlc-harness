### Task 7 — Respell the remote-names, workflow-template and trigger-workflow `init` suites

**Goal:** Make the suites that pin the constants, their shell mirrors, the four templates and `init`'s forge-workflow report assert the new names.

**Depends on:**
- Task 1: `WORKFLOW_RUN_FILE = 'devscene-run.yml'`, `WORKFLOW_RESUME_FILE = 'devscene-resume.yml'`, `WORKFLOW_TRIGGER_FILE = 'devscene-trigger.yml'`, `WORKFLOW_CONTROL_FILE = 'devscene-control.yml'`, `COMMAND_HANDLE = '@dev-scene'`, `COMMENT_MARKER = '<!-- devscene'`, `STATE_LABEL_PREFIX = 'devscene: '`, `DEFAULT_TRIGGER_LABEL = 'devscene'`.
- Task 2: the templates at `cli/templates/github/workflows/devscene-*.yml`.
- Task 3: `remote-run.sh`'s mirrors of those values.
- Task 4: `HR_REMOTE_WORKFLOW_RUN_FILE='devscene-run.yml'`.
- Task 5: the fixture's respelled `if:` line and its new `'0.6.1'` digest.
- Task 6: the `--upgrade-workflows` summary.

**Where this task stops.** It edits only these five suites. `init`'s report text comes from the Task 1 constants and is not edited here.

### Targets

- `cli/test/remote-names.test.mjs`
- `cli/test/workflow-templates.test.mjs`
- `cli/test/workflow-plugin-pin.test.mjs`
- `cli/test/workflow-sandbox-install.test.mjs`
- `cli/test/trigger-workflow-init.test.mjs`

**Work:**

- [ ] `remote-names.test.mjs`: change the literal assertions in *"the run-control names keep their literal values"* and *"the issue-trigger names keep their literal values"* to the eight Task 1 values. Leave `LEGACY_TRIGGER_LABEL`'s `'harness'` and the `stateDir: 'sdlc-harness/'` config in the `forgeTriggerApplies` case unchanged.
- [ ] `workflow-templates.test.mjs`: respell every workflow file name in its header, its case titles, its assertion messages and its `RED ONCE` notes. Respell any handle, marker or label literal it asserts against the control or trigger template. Leave the `/(^|[^A-Za-z0-9_-])sdlc-harness\//m` `stateDir` assertion unchanged.
- [ ] `workflow-plugin-pin.test.mjs` and `workflow-sandbox-install.test.mjs`: respell the header's `harness-run.yml` to `devscene-run.yml`, along with any template path either reads by literal.
- [ ] `trigger-workflow-init.test.mjs`:
  - set `TRIGGER_FILE`, `RUN_FILE`, `RESUME_FILE` and `CONTROL_FILE` to `.github/workflows/devscene-*.yml`, and read `TRIGGER_TEMPLATE` and `CONTROL_TEMPLATE` from `devscene-trigger.yml` and `devscene-control.yml`;
  - set `LABEL_COMMAND = 'gh label create devscene --description "Start a harness run from this issue"'`; the description is unchanged;
  - change the report assertions to `` `devscene: <state>` ``, `@dev-scene followed by answer, pause, resume, stop, clear, status steers` and `a mention of @dev-scene anywhere else in a comment is read by an agent, …`;
  - respell the remaining case titles and messages. Keep reading the fixture from `test/fixtures/harness-control-0.6.1.yml`, whose name does not change.

**Verification:**

- `npm test --workspace cli -- test/remote-names.test.mjs` passes.
- `npm test --workspace cli -- test/workflow-templates.test.mjs` passes.
- `npm test --workspace cli -- test/workflow-plugin-pin.test.mjs` passes.
- `npm test --workspace cli -- test/workflow-sandbox-install.test.mjs` passes.
- `npm test --workspace cli -- test/trigger-workflow-init.test.mjs` passes. Its digest case recomputes the SHA-256 of the fixture Task 5 edited and finds `UNPARSEABLE_CONTROL_RELEASES['0.6.1']`. Its repair cases find the byte-identical copy replaced and the edited copy kept, at `.github/workflows/devscene-control.yml`.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml|'sdlc-harness'\)" cli/test/remote-names.test.mjs cli/test/workflow-templates.test.mjs cli/test/workflow-plugin-pin.test.mjs cli/test/workflow-sandbox-install.test.mjs cli/test/trigger-workflow-init.test.mjs` prints nothing.
