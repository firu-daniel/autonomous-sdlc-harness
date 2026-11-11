### Task 4 — Respell the run library, prompt-injection screen, watcher and run-analytics templates and `cli/templates/README.md`

**Goal:** Bring the remaining shipped templates that name a workflow file or the comment marker to the new names.

**Depends on:**
- Task 1's `WORKFLOW_RUN_FILE = 'devscene-run.yml'`, which `HR_REMOTE_WORKFLOW_RUN_FILE` mirrors byte for byte. `cli/test/remote-names.test.mjs` → *"harness-run-lib.sh mirrors WORKFLOW_RUN_FILE and STATE_ARTIFACT_NAME byte for byte"* asserts the pair.
- Task 3's `COMMENT_MARKER='<!-- devscene'`. `remote-run.sh` writes the review-round line as `"$COMMENT_MARKER round collected_at=<utc> reviews=<ids> comments=<ids> -->"`, which `PIS_RE_ROUND_MARKER` must keep matching.

**Where this task stops.** The self-adopted copies under `scripts/` are Task 16's. The suites that read these templates are Tasks 7, 9 and 14.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/prompt-injection-screen.sh`
- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/templates/scripts/lib/run-analytics.jq`
- `cli/templates/README.md`

**Work:**

- [ ] `lib/harness-run-lib.sh`: set `HR_REMOTE_WORKFLOW_RUN_FILE='devscene-run.yml'`. Respell the two comments that name `harness-run.yml`: the `Install the sandbox prerequisites` note near the header, and the route comment beside `hr_github_*_route`. Leave `hr_config_dir "${1-}" stateDir "sdlc-harness"` unchanged; it is the `stateDir` default.
- [ ] `prompt-injection-screen.sh`: set `PIS_RE_ROUND_MARKER='<!-- devscene round collected_at=[0-9T:Z-]+ reviews=[0-9,]* comments=[0-9,]* -->'`. Only the marker word changes; the rest of the regex stays byte-identical.
- [ ] `autonomous-watcher.sh`: respell the three comments that name `harness-run.yml` (the `HARNESS_DEFAULT_BRANCH_COMMIT` note, the `workflow run devscene-run.yml --ref feat_x …` REPRO line, and the default-branch-commit note). Leave the `"$d/sdlc-harness"` REPRO line unchanged; it is a `stateDir`.
- [ ] `lib/run-analytics.jq`: respell the one `harness-run.yml` comment. `cli/templates/README.md`: respell the `github/` row's four workflow names.

**Verification:**

- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" cli/templates/scripts/lib/harness-run-lib.sh cli/templates/scripts/prompt-injection-screen.sh cli/templates/scripts/autonomous-watcher.sh cli/templates/scripts/lib/run-analytics.jq cli/templates/README.md` prints nothing.
- `grep -n "HR_REMOTE_WORKFLOW_RUN_FILE=" cli/templates/scripts/lib/harness-run-lib.sh` shows `'devscene-run.yml'`, equal to Task 1's `WORKFLOW_RUN_FILE`.
- `bash -n` exits 0 on each of the three `.sh` targets.
