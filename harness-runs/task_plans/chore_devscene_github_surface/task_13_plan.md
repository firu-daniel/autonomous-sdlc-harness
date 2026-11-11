### Task 13 — Respell the report, collect and deliver suites

**Goal:** Make the suites for `remote-run.sh`'s `report`, `collect` and `deliver` verbs assert the new state labels, trigger label, marker and workflow file names.

**Depends on:** Task 3. `cli/templates/scripts/remote-run.sh` sets `STATE_LABEL_PREFIX='devscene: '`, `DEFAULT_TRIGGER_LABEL='devscene'`, `COMMENT_MARKER='<!-- devscene'` and `WORKFLOW_RUN_FILE='devscene-run.yml'`. So:
- `report` moves `devscene: <state>` labels, deleting the old one through `repos/<repo>/issues/<n>/labels/devscene%3A%20<state>`;
- its stop text says *"re-apply the label `devscene`"*;
- `collect` dispatches `workflow run devscene-run.yml …`;
- every lifecycle comment carries `<!-- devscene event=… -->`.

**Where this task stops.** It edits only these four suites.

### Targets

- `cli/test/remote-report.test.mjs`
- `cli/test/remote-collect.test.mjs`
- `cli/test/remote-deliver.test.mjs`
- `cli/test/remote-deliver-threads.test.mjs`

**Work:**

- [ ] `remote-report.test.mjs`:
  - respell the `pushBranch` helper's default `label = 'devscene'`, the URL-encoded label deletion (`labels/devscene%3A%20running`) and every state label;
  - respell the re-apply assertions (``/re-apply the label `devscene`/``, the draft-pull-request sentence, and the negative ``!posted.body.includes('`devscene`')``);
  - respell every marker line.
- [ ] `remote-collect.test.mjs`: respell its dispatch constant to `devscene-run.yml`, the provenance prompt's label, every marker line (the `<!-- devscene round collected_at=… -->` line included) and every state label.
- [ ] `remote-deliver.test.mjs` and `remote-deliver-threads.test.mjs`: respell the provenance label, every marker line and every state label.
- [ ] In all four, leave `const STATE_DIR = 'sdlc-harness'` and every `sdlc-harness/` path unchanged.

**Verification:**

- `npm test --workspace cli -- test/remote-report.test.mjs` passes.
- `npm test --workspace cli -- test/remote-collect.test.mjs` passes.
- `npm test --workspace cli -- test/remote-deliver.test.mjs` passes.
- `npm test --workspace cli -- test/remote-deliver-threads.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|label .{0,2}sdlc-harness|label = 'sdlc-harness'|harness-(trigger|run|control|resume)([^-a-z]|$)" cli/test/remote-report.test.mjs cli/test/remote-collect.test.mjs cli/test/remote-deliver.test.mjs cli/test/remote-deliver-threads.test.mjs` prints nothing.

- **Deviations from plan:** The Work list names no respelling for the mention handle, but the Verification grep's `@sdlc-harness` alternative requires one: every `@sdlc-harness <verb>` in `remote-report.test.mjs`, `remote-collect.test.mjs` (header comment included) and `remote-deliver.test.mjs` was respelled to `@dev-scene <verb>`, the handle `cli/test/remote-control-mention.test.mjs` already asserts.
