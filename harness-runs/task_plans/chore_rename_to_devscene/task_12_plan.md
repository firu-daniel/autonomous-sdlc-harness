### Task 12 — Respell every command reference under `plugin/commands/`

**Goal:** Every `/autonomous-sdlc-harness:<command>` and `autonomous-sdlc-harness:<command>` reference in the command files and their README becomes `/devscene:<command>` / `devscene:<command>`. That covers `**Usage:**` lines, `## Context:` lines, STOP messages, report remedies and relayed text.

**Depends on:** Task 11, which renamed the plugin to `devscene`. The prefix is the manifest's `name`, so it now resolves as `/devscene:<command>`. Command file names and their frontmatter do not change.

**Where this task stops.** It changes only the qualifier. A bare spelling that `scripts/check-command-spelling.sh` exempts lives in `docs/`, the watcher or `init.ts`, never here, so no exemption entry is affected. Any `npx autonomous-sdlc-harness …` line in these files becomes `npx devscene …`. `/devscene:harness-analyze` keeps its command name, which is out of scope.

### Targets

- `plugin/commands/README.txt`
- `plugin/commands/branch-answer.md`, `branch-implement-plan-semi-autonomous.md`, `branch-implement-plan.md`, `branch-implement-user-review-semi-autonomous.md`, `branch-implement-user-review.md`, `branch-pause.md`, `branch-prompt.md`, `branch-qa-test.md`, `branch-resume.md`
- `plugin/commands/branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-plan-semi-autonomous.md`, `branch-start-plan.md`, `branch-start-user-review-fix-autonomous.md`, `branch-status.md`, `branch-user-review.md`, `harness-analyze.md`

(all under `plugin/commands/`)

**Work:**

- [ ] `README.txt` and the `branch-answer` … `branch-resume` files: respell every qualified spelling. That includes the two `## Context:` lines in `branch-implement-user-review.md` and `branch-qa-test.md`. They are headings, so grep `plugin/` for each one's text and confirm that no file cites them by `→ ## Context:` before you edit.
- [ ] The `branch-start-*`, `branch-status`, `branch-user-review` and `harness-analyze` files: respell every qualified spelling. In `harness-analyze.md` that includes its `**Usage:**` lines, report remedies and `npx devscene config set layers`.
- [ ] Wherever a file names the plugin in prose ("the `autonomous-sdlc-harness` plugin"), write `the DevScene plugin` or the backticked `devscene`, per the spelling table. "harness" stays wherever it is the category noun.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- plugin/commands` prints nothing.
- `git diff -U0 -- plugin/commands` shows no changed frontmatter key: every `description:` / `argument-hint:` line that changed differs only in the product name.
