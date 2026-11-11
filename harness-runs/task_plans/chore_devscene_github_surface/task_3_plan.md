### Task 3 — Respell the label, handle, marker and workflow names in the `remote-run.sh` template

**Goal:** Make the script that dispatches runs, posts lifecycle comments, moves state labels and reads comment commands use the new names. This is the shell mirror of `cli/src/remote/githubActions.ts`.

**Depends on:** Task 1, whose constants this script mirrors byte for byte, as its own `mirrors` table states. The exact values: `WORKFLOW_RUN_FILE='devscene-run.yml'`, `WORKFLOW_RESUME_FILE='devscene-resume.yml'`, `WORKFLOW_CONTROL_FILE='devscene-control.yml'`, `DEFAULT_TRIGGER_LABEL='devscene'`, `COMMAND_HANDLE='@dev-scene'`, `COMMENT_MARKER='<!-- devscene'`, `STATE_LABEL_PREFIX='devscene: '`. The workflow file names also match Task 2's renamed templates.

**Where this task stops.** The round-line regex `PIS_RE_ROUND_MARKER` in `cli/templates/scripts/prompt-injection-screen.sh` mirrors this script's `"$COMMENT_MARKER round collected_at="` line and is Task 4's. The self-adopted copy `scripts/remote-run.sh` is Task 16's. The suites that run this template are Tasks 7 and 9–14.

### Targets

- `cli/templates/scripts/remote-run.sh`

**Work:**

- [ ] Set the seven mirrored assignments to the values listed under **Depends on**. They are `WORKFLOW_RUN_FILE`, `WORKFLOW_RESUME_FILE`, `DEFAULT_TRIGGER_LABEL`, `WORKFLOW_CONTROL_FILE`, `COMMAND_HANDLE`, `COMMENT_MARKER` and `STATE_LABEL_PREFIX`, in the constants block after the `mirrors` table. Leave `LEGACY_TRIGGER_LABEL` and every `HARNESS_*` name unchanged.
- [ ] Respell every old name in the header paragraphs:
  - the `trigger`, `report`, `control`, `open` and `round` paragraphs' examples of the marker line (`<!-- devscene event=started branch=<branch> -->`, `<!-- devscene round collected_at=<utc> reviews=<id,…> comments=<id,…> -->`) and of the state labels (`devscene: running`, `devscene: done`);
  - the handle examples in the `control` paragraph: `foo@dev-scenex`, `Let's @dev-scene pause`, `> @dev-scene pause`, `@dev-scene check the question`, and `@dev-scene resume` in the stop paragraph;
  - every `harness-run.yml` mention, including the `### Upgrading` pointer.
- [ ] Respell every old name in the `REPRO` block:
  - the dispatch lines (`workflow run devscene-run.yml …`), the poller lines (`workflow enable devscene-resume.yml`, `workflow disable devscene-resume.yml`, `run list --workflow devscene-resume.yml`), the label payload (`"label":{"name":"devscene"}`, `--remove-label devscene`, `labels[]=devscene: paused`), the state labels and the comment bodies (`"body":"@dev-scene pause"`).
- [ ] Respell every literal workflow file name in a user-facing message, such as the mention-reply text that says the control job *"fetches the plugin at the version `HARNESS_CLI_VERSION` pins in `devscene-run.yml`"*. Leave every message that already interpolates `$WORKFLOW_*_FILE`, `$COMMAND_HANDLE`, `$COMMENT_MARKER` or `$STATE_LABEL_PREFIX` as it is.
- [ ] Leave the `stateDir` default and every `sdlc-harness/` path unchanged (`## Context` → *What keeps its current spelling*).

**Verification:**

- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" cli/templates/scripts/remote-run.sh` prints nothing.
- `grep -nE "sdlc-harness([^/]|$)" cli/templates/scripts/remote-run.sh` prints nothing, or only lines naming the `stateDir` default.
- `grep -nE "^(WORKFLOW_(RUN|RESUME|CONTROL)_FILE|DEFAULT_TRIGGER_LABEL|COMMAND_HANDLE|COMMENT_MARKER|STATE_LABEL_PREFIX)=" cli/templates/scripts/remote-run.sh` shows the seven values above, byte-identical to Task 1's TypeScript literals.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
  - **Deviations from plan:** The direct `bash -n cli/templates/scripts/remote-run.sh` call was refused by the tool layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The parse claim rests instead on the configured `bash scripts/typecheck.sh`, whose `check-shell-parse` step reported `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and ended `PASS: typecheck`. The Run gates phase's whole-tree typecheck run verifies it again.
