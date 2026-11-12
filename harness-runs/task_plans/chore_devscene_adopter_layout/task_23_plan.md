### Task 23 — Respell the run-control, collect, report, progress and trigger suites

**Goal:** Bring the GitHub run-control suites in line with the new run titles, the mention command `/devscene:read-mention` and its file `commands/read-mention.md`, and `devscene.config.json`.

**Depends on:** Task 4 (`MENTION_COMMAND`), Task 6 (`remote-run.sh`'s title matching, `MENTION_COMMAND='/devscene:read-mention'`, and the `commands/<basename>.md` existence check), and Task 11, which names the shipped file `plugin/commands/read-mention.md`.

**Where this task stops.** `remote-control-mention.test.mjs` builds its own fixture plugin directory. That fixture's empty command file is named `read-mention.md`, which is the basename `remote-run.sh` checks for. Every `gh` stub `displayTitle` is in row 12's new form. A case that asserts a control refusal quoting a title, such as *"no `devscene run feat_x` run is queued or in progress"*, quotes the new title.

### Targets

- `cli/test/remote-control.test.mjs`, `cli/test/remote-control-close.test.mjs`, `cli/test/remote-control-mention.test.mjs`, `cli/test/remote-control-needs-agent.test.mjs`, `cli/test/remote-control-review.test.mjs`
- `cli/test/remote-collect.test.mjs`, `cli/test/remote-report.test.mjs`, `cli/test/remote-progress.test.mjs`, `cli/test/remote-trigger.test.mjs`, `cli/test/remote-review-payloads.test.mjs`

**Work:**

- [ ] `remote-control-mention.test.mjs`: `MENTION_COMMAND = '/devscene:read-mention'`, the fixture write `join(pluginDir, 'commands', 'read-mention.md')`, and rows 1–3 and 12 of `## Context`'s spelling table.
- [ ] `remote-control.test.mjs`, `remote-control-close.test.mjs`, `remote-control-review.test.mjs`, `remote-control-needs-agent.test.mjs`: every `displayTitle`, expected title and quoted title in row 12's new form, and rows 1–3 in fixtures. In `remote-control-review.test.mjs`, the `/`devscene\/story_plans\/feat_z_story_plan\.md`/` expectation is included.
- [ ] `remote-collect.test.mjs`, `remote-report.test.mjs`, `remote-progress.test.mjs`: the same as the bullet above.
- [ ] `remote-trigger.test.mjs`, `remote-review-payloads.test.mjs`: the same, with the `### devscene trigger` step-summary heading where asserted. Prose such as *"Started a harness run on the branch"* is not a title and stays.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-read-mention|harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)|harness <action>|harness [$][{][{]' --` followed by this task's ten target paths prints nothing.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file.
