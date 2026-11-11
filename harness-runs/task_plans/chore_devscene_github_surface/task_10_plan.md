### Task 10 — Respell the `remote-control` suite

**Goal:** Make `cli/test/remote-control.test.mjs` drive `remote-run.sh control` with the new handle and assert the new marker, state labels, trigger label and workflow file names.

**Depends on:** Task 3. `cli/templates/scripts/remote-run.sh` sets `COMMAND_HANDLE='@dev-scene'`, `COMMENT_MARKER='<!-- devscene'`, `STATE_LABEL_PREFIX='devscene: '`, `DEFAULT_TRIGGER_LABEL='devscene'`, `WORKFLOW_RUN_FILE='devscene-run.yml'` and `WORKFLOW_CONTROL_FILE='devscene-control.yml'`. So the script now:
- dispatches `workflow run devscene-run.yml --ref <b> …`;
- writes marker lines `<!-- devscene event=<event> branch=<b> … -->`;
- labels `devscene: <state>`;
- reads a command only when its first word is `@dev-scene`;
- replies to a credential-less control workflow with ``@<login>: `@dev-scene` was not run: `devscene-control.yml` passes the agent that reads a mention no credential, …``.

Task 4's run library mirrors `devscene-run.yml`.

**Where this task stops.** It edits only this suite. The other run-control suites are Task 11's.

### Targets

- `cli/test/remote-control.test.mjs`

**Work:**

- [ ] Respell the dispatch-line constants and expected calls (`PAUSE_DISPATCH`, `RESUME_DISPATCH`, `CLEAR_DISPATCH`, the answer and engine dispatch builders, and every inline `'workflow run harness-run.yml …'`) to `devscene-run.yml`.
- [ ] Respell every comment body the suite posts as a command, such as `@sdlc-harness pause` to `@dev-scene pause`. Respell every negative case built on the handle's boundary, such as a word glued to the handle, to the same shape around `@dev-scene`, so each still tests the boundary it tested before.
- [ ] Respell every expected or seeded marker line (`<!-- devscene event=… -->`, including HTML-escaped `&lt;!-- devscene` forms) and every state label (`devscene: running`, `devscene: paused`, …, including URL-encoded `devscene%3A%20…` paths).
- [ ] Respell the provenance prompt's label (``who applied the label `devscene` ``) and the credential-less reply regex to ``/^@alice: `@dev-scene` was not run: `devscene-control\.yml` passes the agent …/``. Leave `const STATE_DIR = 'sdlc-harness'` and every `sdlc-harness/` path unchanged.

**Verification:**

- `npm test --workspace cli -- test/remote-control.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|label .{0,2}sdlc-harness|harness-(trigger|run|control|resume)([^-a-z]|$)" cli/test/remote-control.test.mjs` prints nothing.
- `grep -n "sdlc-harness" cli/test/remote-control.test.mjs` prints only `STATE_DIR` and `stateDir` paths.
