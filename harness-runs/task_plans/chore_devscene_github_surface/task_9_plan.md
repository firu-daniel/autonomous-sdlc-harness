### Task 9 — Respell the `init`, branch-naming, credential-scan and prompt-injection suites and the fixture helper's comment

**Goal:** Respell the old names in five suites that each carry only a handful of them, and in one comment of the shared fixture helper.

**Depends on:**
- Task 1's constants: `WORKFLOW_RUN_FILE = 'devscene-run.yml'`, `WORKFLOW_RESUME_FILE = 'devscene-resume.yml'`, `COMMAND_HANDLE = '@dev-scene'`, `COMMENT_MARKER = '<!-- devscene'`, `DEFAULT_TRIGGER_LABEL = 'devscene'`.
- Task 2's templates at `cli/templates/github/workflows/devscene-run.yml` and `devscene-resume.yml`.
- Task 3's `remote-run.sh`. Its trigger writes the provenance line *"Started from <url> by @<login>, who applied the label `<label>`."* and its park comment carries `<!-- devscene event=parked branch=<b> question=<n> -->` and `` `@dev-scene answer <n>` ``.
- Task 4's `PIS_RE_ROUND_MARKER`, which matches `<!-- devscene round collected_at=… reviews=… comments=… -->`, and `HR_REMOTE_WORKFLOW_RUN_FILE='devscene-run.yml'`.

**Where this task stops.** `cli/test/helpers/fixture.mjs` changes in one comment only. No exported value changes, so the many suites importing it are unaffected.

### Targets

- `cli/test/init.test.mjs`
- `cli/test/branch-naming.test.mjs`
- `cli/test/push-branch-credential-scan.test.mjs`
- `cli/test/prompt-injection-prescan.test.mjs`
- `cli/test/prompt-injection-remote-route.test.mjs`
- `cli/test/helpers/fixture.mjs`

**Work:**

- [ ] `init.test.mjs`: set `WORKFLOW_RUN_FILE` and `WORKFLOW_RESUME_FILE` to `.github/workflows/devscene-run.yml` and `.github/workflows/devscene-resume.yml`. Read the two templates as `devscene-run.yml` and `devscene-resume.yml`, and respell the four assertion messages (`… survived into devscene-run.yml`, `devscene-resume.yml is not a verbatim copy …`, `devscene-run.yml.bak …`, `devscene-resume.yml.bak …`). Leave `STATE_DIR`, `STATE_DIR_VALUE` and the header's `sdlc-harness/` unchanged.
- [ ] `branch-naming.test.mjs`: expect `['run', 'list', '--workflow', 'devscene-run.yml', …]`. `push-branch-credential-scan.test.mjs`: commit the fixture file as `cli/templates/github/workflows/devscene-run.yml`.
- [ ] `prompt-injection-prescan.test.mjs`: change both review-round lines to `<!-- devscene round collected_at=… -->`. Everything else in them stays byte-identical, so the benign case still matches `PIS_RE_ROUND_MARKER` and the trailing-text case still does not.
- [ ] `prompt-injection-remote-route.test.mjs`: change `PROVENANCE`'s label to `` `devscene` ``, `QUESTION_MARKER` to `<!-- devscene event=parked branch=${branch} question=${n} -->`, and the expected `` `@dev-scene answer 2` ``. `helpers/fixture.mjs`: change the comment's *"a `harness-run` job"* to *"a `devscene-run` job"*.

**Verification:**

- `npm test --workspace cli -- test/init.test.mjs` passes.
- `npm test --workspace cli -- test/branch-naming.test.mjs` passes.
- `npm test --workspace cli -- test/push-branch-credential-scan.test.mjs` passes.
- `npm test --workspace cli -- test/prompt-injection-prescan.test.mjs` passes.
- `npm test --workspace cli -- test/prompt-injection-remote-route.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|label .{0,2}sdlc-harness|harness-(trigger|run|control|resume)([^-a-z]|$)" cli/test/init.test.mjs cli/test/branch-naming.test.mjs cli/test/push-branch-credential-scan.test.mjs cli/test/prompt-injection-prescan.test.mjs cli/test/prompt-injection-remote-route.test.mjs cli/test/helpers/fixture.mjs` prints nothing.
