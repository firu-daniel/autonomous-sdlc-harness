### Task 11 — Respell the mention, needs-agent, close and review run-control suites

**Goal:** Make the four remaining `remote-run.sh control` suites use the new handle, marker, state labels, trigger label and workflow file names.

**Depends on:** Task 3. `cli/templates/scripts/remote-run.sh` sets `COMMAND_HANDLE='@dev-scene'`, `COMMENT_MARKER='<!-- devscene'`, `STATE_LABEL_PREFIX='devscene: '`, `DEFAULT_TRIGGER_LABEL='devscene'`, `WORKFLOW_RUN_FILE='devscene-run.yml'` and `WORKFLOW_RESUME_FILE='devscene-resume.yml'`. A mention session's `comment.md` therefore opens `handle: @dev-scene`, and an HTML-escaped marker in a reply reads `&lt;!-- devscene event=… -->`. Task 4's run library mirrors `devscene-run.yml`.

**Where this task stops.** It edits only these four suites. `cli/test/remote-control.test.mjs` is Task 10's.

### Targets

- `cli/test/remote-control-mention.test.mjs`
- `cli/test/remote-control-needs-agent.test.mjs`
- `cli/test/remote-control-close.test.mjs`
- `cli/test/remote-control-review.test.mjs`

**Work:**

- [ ] `remote-control-mention.test.mjs`:
  - respell every mention body (`Let's @dev-scene pause`, `> @dev-scene pause`, …) and the expected `handle: @dev-scene` line;
  - respell the dispatch constants (`PAUSE_DISPATCH`, `RESUME_DISPATCH`, the answer builder) to `devscene-run.yml`;
  - respell the escaped-marker assertions (`&lt;!-- devscene event=started branch=evil -->`), every marker line and state label, and the provenance label;
  - keep each boundary case testing the same boundary around `@dev-scene`.
- [ ] `remote-control-needs-agent.test.mjs`: respell the comment bodies (`@dev-scene pause`) and any marker or label literal.
- [ ] `remote-control-close.test.mjs`: respell `STOP_DISPATCH` to `devscene-run.yml`, the header's `devscene-resume.yml`, the `PROMPT` provenance label, and every state label and marker line.
- [ ] `remote-control-review.test.mjs`: respell its dispatch constant to `devscene-run.yml`, the provenance label, and every marker line, including the `<!-- devscene round collected_at=… -->` line, and every state label. Leave its `sdlc-harness\/story_plans\/…` `stateDir` regex unchanged.
- [ ] In all four, leave `const STATE_DIR = 'sdlc-harness'` and every `sdlc-harness/` path unchanged.

**Verification:**

- `npm test --workspace cli -- test/remote-control-mention.test.mjs` passes.
- `npm test --workspace cli -- test/remote-control-needs-agent.test.mjs` passes.
- `npm test --workspace cli -- test/remote-control-close.test.mjs` passes.
- `npm test --workspace cli -- test/remote-control-review.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|label .{0,2}sdlc-harness|harness-(trigger|run|control|resume)([^-a-z]|$)" cli/test/remote-control-mention.test.mjs cli/test/remote-control-needs-agent.test.mjs cli/test/remote-control-close.test.mjs cli/test/remote-control-review.test.mjs` prints nothing.
