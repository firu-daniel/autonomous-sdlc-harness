### Task 14 — Respell the open, progress, review-payload and start suites and the three watcher remote suites

**Goal:** Respell the remaining remote suites that drive `remote-run.sh` or the watcher's job mode, so they assert the new workflow file names, marker, state labels and trigger label.

**Depends on:**
- Task 3: `cli/templates/scripts/remote-run.sh` with `WORKFLOW_RUN_FILE='devscene-run.yml'`, `COMMENT_MARKER='<!-- devscene'`, `STATE_LABEL_PREFIX='devscene: '` and `DEFAULT_TRIGGER_LABEL='devscene'`.
- Task 4: `cli/templates/scripts/lib/harness-run-lib.sh` with `HR_REMOTE_WORKFLOW_RUN_FILE='devscene-run.yml'`. Its GitHub routes tell a parked or paused run to *"Run workflow on devscene-run.yml …"*. Also the watcher template's comments.

**Where this task stops.** It edits only these seven suites.

### Targets

- `cli/test/remote-open.test.mjs`
- `cli/test/remote-progress.test.mjs`
- `cli/test/remote-review-payloads.test.mjs`
- `cli/test/remote-start.test.mjs`
- `cli/test/watcher-remote-dispatch.test.mjs`
- `cli/test/watcher-remote-job.test.mjs`
- `cli/test/watcher-remote-park-sequence.test.mjs`

**Work:**

- [ ] `remote-open.test.mjs` and `remote-progress.test.mjs`: respell the provenance label, every marker line (`<!-- devscene event=… -->`) and every state label.
- [ ] `remote-review-payloads.test.mjs` and `remote-start.test.mjs`: respell each dispatch constant to `workflow run devscene-run.yml …`.
- [ ] `watcher-remote-dispatch.test.mjs`: respell its dispatch builder to `devscene-run.yml`.
- [ ] `watcher-remote-job.test.mjs` and `watcher-remote-park-sequence.test.mjs`: respell the provenance prompts' label (`` `devscene` ``) and the route regex (`/Run workflow on devscene-run\.yml .*resume answer/`). Leave the `RESUME from a PAUSE: read sdlc-harness\/PAUSE_PROGRESS\.md` `stateDir` regex unchanged.
- [ ] In all seven, leave `const STATE_DIR = 'sdlc-harness'` and every `sdlc-harness/` path unchanged.

**Verification:**

- `npm test --workspace cli -- test/remote-open.test.mjs` passes.
- `npm test --workspace cli -- test/remote-progress.test.mjs` passes.
- `npm test --workspace cli -- test/remote-review-payloads.test.mjs` passes.
- `npm test --workspace cli -- test/remote-start.test.mjs` passes.
- `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs` passes.
- `npm test --workspace cli -- test/watcher-remote-job.test.mjs` passes.
- `npm test --workspace cli -- test/watcher-remote-park-sequence.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|label .{0,2}sdlc-harness|harness-(trigger|run|control|resume)([^-a-z]|$)" cli/test/remote-open.test.mjs cli/test/remote-progress.test.mjs cli/test/remote-review-payloads.test.mjs cli/test/remote-start.test.mjs cli/test/watcher-remote-dispatch.test.mjs cli/test/watcher-remote-job.test.mjs cli/test/watcher-remote-park-sequence.test.mjs` prints nothing.
