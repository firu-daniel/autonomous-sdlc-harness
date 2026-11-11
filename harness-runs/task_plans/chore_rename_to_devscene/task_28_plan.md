### Task 28 — Record this repository's `.claude/` paste and the remaining-hit report

**Goal:** Give the maintainer an exact paste for this repository's own `.claude/` files, which the task prompt asks to move to the new name and which no agent may write. Record the done-when search's result on the finished branch, each remaining hit with its reason.

**Depends on:** Tasks 1–27. The paste must match what the renamed generators and templates would write: `PLUGIN_KEY` `devscene@devscene` and `MARKETPLACE_NAME` `devscene` (Task 1), `firu-daniel/devscene` (Task 14), and the renamed `.claude/` templates (Task 3). The remaining-hit report is taken after every other task has landed.

**Why nothing under `.claude/` is written.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and an attempted write there can park the run. `.claude/context/conventions.md` and `.claude/context/cli.md` are conventions documents, which are never a task's target. Their one stale line each is raised as a `stale-rule` entry in the story index's `## Corpus staleness` section (`harness-runs/story_plans/chore_rename_to_devscene_story_plan.md`, at its end). Each entry carries the exact old and new line, so the maintainer's hand edit is a paste. This task's `## Paste record` does not repeat them. Its `## Remaining hits` lists the two files under *pending conventions-document hand edit*, pointing at that section.

### Targets

- `harness-runs/task_plans/chore_rename_to_devscene/task_28_plan.md`: this file, which gains a `## Paste record` and a `## Remaining hits` section at its end

**Work:**

- [ ] Append `## Paste record`. Reader: the maintainer. Put each span in a fenced block. (1) The whole intended `.claude/settings.json`: `enabledPlugins` key `devscene@devscene`, `extraKnownMarketplaces` key `devscene` with `"repo": "firu-daniel/devscene"`, every other byte as at `HEAD`. Mark it **apply at merge, together with the plugin reinstall**: a session that reads `devscene@devscene` before that plugin is installed loads none. (2) For `.claude/CLAUDE.md`, each line carrying the old name with its full replacement line, including the H1 `# DevScene` and the `**DevScene ships …**` opening (backticked `devscene` where the line quotes a command), and the `/devscene:branch-*`, `/devscene:harness-*`, `/devscene:harness-analyze` and `devscene init` occurrences. (3) The same for `.claude/harness-task-offer.md`, where the skill name `devscene:branch-prompt` is the value the template's `{{pluginName}}` now renders, and for `.claude/push-notify.env.example`.
- [ ] Confirm span (1) parses: write it to `harness-runs/scratch/`, run `node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"` as one plain command, then delete the scratch copy.
- [ ] Append `## Remaining hits`. Run `git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'` from the checkout root, as one plain command. List every hit it prints, each with its reason, drawn only from these: *recorded-release fixture* (`cli/test/fixtures/harness-control-0.6.1.yml`); *frozen capture* (`examples/notes-app/.claude/CLAUDE.md`, `examples/notes-app/sdlc-harness/**`); *historical-name line* (the one `examples/notes-app/README.md` line Task 27 added); *pending maintainer paste* (`.claude/CLAUDE.md`, `.claude/harness-task-offer.md`, `.claude/push-notify.env.example`, `.claude/settings.json`, and `examples/notes-app/.claude/` files other than `CLAUDE.md`); *pending conventions-document hand edit* (`.claude/context/conventions.md`, `.claude/context/cli.md`). A hit that fits none of these is a miss by an earlier task. Name it and its owning task in this task's return, and do not fix it here.

**Verification:**

- `git status --short -- .claude` prints nothing: this task wrote nothing under `.claude/`.
- Every line `## Remaining hits` lists carries one of the five reasons above. The section is a complete copy of the command's output, so the closing report can quote it.
