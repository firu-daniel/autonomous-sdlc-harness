### Task 6 — Rename in the `remote-run.sh` template and the four workflow templates, run titles included

**Goal:** Make the workflows title their runs `devscene <action> <branch>`, `devscene control …` and `devscene trigger …`. They name the run step `Run DevScene` and the poll artifact `devscene-poll-state`, and they read `devscene.config.json` with `devscene-scripts` and `devscene` as the jq fallbacks. `remote-run.sh` matches exactly those titles and that artifact, and invokes `/devscene:read-mention`. The task prompt requires the script and the workflows to change together.

**Depends on:** Task 4, whose `cli/src/remote/githubActions.ts` sets `POLL_STATE_ARTIFACT_NAME = 'devscene-poll-state'` and `MENTION_COMMAND = '/devscene:read-mention'`. `remote-run.sh`'s `POLL_STATE_ARTIFACT_NAME='…'` and `MENTION_COMMAND='…'` lines mirror those byte for byte. Task 5 already respelled the watcher's `devscene pause` match.

**Where this task stops.** The suites holding these mirrors (`workflow-templates`, `remote-names`, `remote-run` and the run-control suites) are Tasks 22 and 23. The Gate 12 scripts that look runs up by title are Task 16's. The copy `scripts/remote-run.sh` is the maintainer's cutover (Task 35).

### Targets

- `cli/templates/scripts/remote-run.sh`
- `cli/templates/github/workflows/devscene-run.yml`, `devscene-resume.yml`, `devscene-control.yml`, `devscene-trigger.yml`

**Work:**

- [ ] Workflows, run titles and step: `run-name: devscene ${{ inputs.action }} ${{ inputs.branch }}`, `run-name: devscene control ${{ … }}` and `run-name: devscene trigger ${{ … }}`, with each expression unchanged. The step `- name: Run DevScene`. Respell every comment naming those titles or that step.
- [ ] Workflows, everything else: in `devscene-resume.yml`, `name: devscene-poll-state` and its comments. Every `jq -r '.scriptsDir // "scripts"' harness.config.json` becomes `jq -r '.scriptsDir // "devscene-scripts"' devscene.config.json`. `.stateDir // "sdlc-harness"` becomes `.stateDir // "devscene"`. Apply row 1 of `## Context`'s spelling table to every other config-file mention.
- [ ] `remote-run.sh`, constants: `POLL_STATE_ARTIFACT_NAME='devscene-poll-state'`, `MENTION_COMMAND='/devscene:read-mention'`. Respell the comments naming `plugin/commands/read-mention.md` and the empty `commands/read-mention.md` fixture. Apply rows 1 and 2 to every message, refusal and REPRO line.
- [ ] `remote-run.sh`, titles: apply row 12 to every title, as the table defines one. That covers every `--arg t "devscene run $branch"`, `titled_runs "devscene run $branch" "devscene pause $branch"`, `--arg s "devscene stop $1" --arg r "devscene run $1"`, `startswith("devscene run ")` / `ltrimstr("devscene run ")`, `STOPPED_LINE="a 'devscene stop' run is newer than its newest 'devscene run' run"`, every message quoting a title (`` no `devscene run $branch` run ``, `no run titled 'devscene run $branch'`), the `### devscene run …` / `### devscene trigger` step-summary headings and every comment and REPRO line naming a title. Prose ("Started a harness run on the branch", "The harness run on `…` paused") stays.
- [ ] Leave unchanged (`## Context` → *What keeps its current spelling*): `STATE_ARTIFACT_NAME='harness-state'`, `TRIGGER_DISPATCH_EVENT_TYPE='harness-task'`, the concurrency groups, the `mktemp` stems, every `HARNESS_*` name and every `lib/harness-run-lib.sh` path.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-read-mention|harness-poll-state|Run the harness|harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)|harness <action>|harness [$][{][{]|// "scripts"' -- cli/templates/scripts/remote-run.sh cli/templates/github/workflows` prints nothing.
- `git grep -nE "^run-name: " -- cli/templates/github/workflows` shows three lines, each opening `run-name: devscene `.
- `git grep -nE "harness-state|harness-task'" -- cli/templates/scripts/remote-run.sh` still prints the two kept constants.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git diff -U0 -- cli/templates/github/workflows` shows only respelled substrings: no changed indentation, no added or removed line, and every `run-name:` and `name: Run DevScene` line still a plain scalar.

**Deviations from plan:**

- The first verification grep does not print nothing. It prints two `remote-run.sh` lines: the header (line 2, *"every call from this machine to GitHub for a harness run: the"*) and the comment in `control_close` (line 7418, *"… is what proves a harness run."*). Both use "harness run" as a noun phrase. The story's spelling table, row 12, says prose like that stays (*"No harness run."*), and the table outranks the grep. The regex's `[^ a-z]` alternative matches the `:` and `.` that follow them. Both lines are left unchanged.
- The tool layer refused the standalone `bash -n cli/templates/scripts/remote-run.sh` ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The parse claim rests on `bash scripts/typecheck.sh` instead. Its first step, `scripts/check-shell-parse.sh`, runs `bash -n` over every shell script git lists, which includes this tracked template. It printed `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and ended with `PASS: typecheck`.
