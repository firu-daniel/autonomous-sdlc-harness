### Task 9 — Rename in the non-script templates and the package READMEs

**Goal:** Make every remaining file `init` writes name `devscene.config.json`, the `devscene/` state directory and the `.claude/devscene-no-offer` opt-out marker: the `.gitignore` managed block, the hooks, the profile READMEs, the push and QA examples and the state-directory READMEs. Make the package's own READMEs do the same.

**Depends on:** Tasks 1–4, which set the names the generators substitute. The managed-block lines in `cli/templates/repo/gitignore` render into adopters' `.gitignore`. `cli/src/generators/repoRoot.ts` (Task 4) reads that template, so the rule text below is the one an adopter gets.

**Where this task stops.** This repository's own `.gitignore` and `githooks/pre-push` are Task 35's. The example's renders are Task 34's and the paste record's. The `init` suite asserting the managed block (`cli/test/init.test.mjs`) is Task 19's.

### Targets

- `cli/templates/repo/gitignore`
- `cli/templates/githooks/pre-push`, `cli/templates/githooks/README.md`
- `cli/templates/claude/push-notify.env.example`, `cli/templates/claude/qa-accounts.env.example`, `cli/templates/claude/settings.autonomous.json`, `cli/templates/claude/settings.autonomous.qa.json`, `cli/templates/claude/settings.autonomous.retrieval.json`
- `cli/templates/state-dir/README-root.md` and the eleven `cli/templates/state-dir/*/README.md` the scope register lists (rows 67–77)
- `cli/templates/README.md`, `cli/README.md`

**Work:**

- [ ] `repo/gitignore`: change the opt-out rule to `.claude/devscene-no-offer` and apply row 1 of `## Context`'s spelling table to the managed block's config-file lines (`/devscene.config.json.bak`, if present, and its comments).
- [ ] `githooks/pre-push`, `githooks/README.md`: apply row 1 to the comments. Keep `{{protectedBranchesCase}}` and every other token.
- [ ] The two `.env.example` templates and the three `settings.autonomous*.json` templates: apply row 1 inside the comment lines and `_README` strings. The JSON must still parse; keep every `{{…}}` token.
- [ ] The twelve state-directory READMEs (`README-root.md`, row 66, plus the eleven in rows 67–77): apply rows 1 and 2.
- [ ] `cli/templates/README.md`, `cli/README.md`: apply every row they carry.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-no-offer|harness-task-offer|harness-analyze' -- cli/templates cli/README.md cli/scripts` prints nothing. With Tasks 2, 3 and 5–8 this covers both template trees and the package README.
- `jq empty` on each of the three `settings.autonomous*.json` templates exits 0.
