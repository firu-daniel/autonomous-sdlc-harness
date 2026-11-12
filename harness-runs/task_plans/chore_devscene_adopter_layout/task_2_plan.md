### Task 2 — Rename the change-request offer file and the two hidden markers in the generator and its `claude/` templates

**Goal:** Make `init` write `.claude/devscene-task-offer.md` from a template of that name, name the opt-out marker `.claude/devscene-no-offer`, and write the stub marker `<!-- devscene:unfilled -->` and the banner pair `<!-- devscene:setup-pending -->` / `<!-- /devscene:setup-pending -->`. `init`, `doctor` and the analyze command all match these.

**Depends on:** Task 1, which sets `ANALYZE_COMMAND` to `/devscene:analyze`. `claudeContext.ts` imports it for the banner and the stub footers, so this task respells only the literal spellings of that command.

**Where this task stops.** The template rename and the `render(...)` call that names it change in this one task, so `init` never asks for a template that is not there. `cli/templates/scripts/task-offer-check.sh`, which tests for the opt-out marker, is Task 8's. The other `claude/` templates (`push-notify.env.example`, `qa-accounts.env.example`, the three `settings.autonomous*.json`) are Task 9's. `doctor`'s checks import the marker constants from this module and need no edit here. Their prose is Task 4's. The suites that pin the markers and the file name (`cli/test/init.test.mjs`, `cli/test/doctor.test.mjs`, `cli/test/task-offer-*.test.mjs`) are Tasks 19 and 20.

### Targets

- `cli/src/generators/claudeContext.ts`
- `cli/src/core/writer.ts`
- `cli/templates/claude/harness-task-offer.md` → `cli/templates/claude/devscene-task-offer.md` (moved: delete the old path, add the new one. `git mv` does both, and the commit stages both.)
- `cli/templates/claude/CLAUDE.md`, `cli/templates/claude/README.md`
- `cli/templates/claude/context/{api,conventions,data-layer,data-storage,docs-catalog,domain,layer,module,package,presentation,state-slices,tests}.md`

**Work:**

- [ ] `claudeContext.ts`: `TASK_OFFER_PATH` = `` `${CLAUDE_DIR}/devscene-task-offer.md` ``; the offer write calls `render('devscene-task-offer.md', { pluginName: PLUGIN_NAME })`; `UNFILLED_STUB_MARKER = '<!-- devscene:unfilled -->'`; `SETUP_PENDING_OPEN = '<!-- devscene:setup-pending -->'`; `SETUP_PENDING_CLOSE = '<!-- /devscene:setup-pending -->'`. Apply rows 1, 2, 4, 5, 6 and 9 of `## Context`'s spelling table to every comment, including `../devscene/lessons.md`.
- [ ] `writer.ts`: in the re-run-contract table, respell the `.claude/devscene-task-offer.md` row, the two marker spellings and `/devscene:analyze`, and apply row 1 to the `devscene.config.json` rows and comments.
- [ ] Move the offer template to `devscene-task-offer.md`. In it, apply rows 5 and 6 and any other row it carries; keep `{{pluginName}}` and every other token byte for byte.
- [ ] `CLAUDE.md` template: apply rows 1, 4, 5 and 6 (the offer pointer `.claude/devscene-task-offer.md`, the opt-out marker `.claude/devscene-no-offer`, `devscene.config.json`, `/devscene:analyze`). Keep every `{{…}}` token and the fence's four-test structure unchanged. `README.md` under `claude/`: apply every row it carries.
- [ ] The twelve `context/*.md` stubs: change `<!-- harness:unfilled -->` to `<!-- devscene:unfilled -->` and apply rows 1 and 6 to the rest. Leave the `**What belongs here**` block and every `{{…}}` token unchanged, because `doctor` and `init` grade "unfilled" as marker **and** block together.

**Verification:**

- `git ls-files -- cli/templates/claude` lists `cli/templates/claude/devscene-task-offer.md` and no `harness-task-offer.md`.
- `git grep -nE 'harness\.config|sdlc-harness|harness-task-offer|harness-no-offer|harness-analyze|harness:unfilled|harness:setup-pending' -- cli/src/generators/claudeContext.ts cli/src/core/writer.ts cli/templates/claude/CLAUDE.md cli/templates/claude/README.md cli/templates/claude/devscene-task-offer.md cli/templates/claude/context` prints nothing.
- `git grep -c '<!-- devscene:unfilled -->' -- cli/templates/claude/context` lists every one of the twelve stubs.
- `commands.typecheck` passes. The templates are outside the compiler, so this checks only `claudeContext.ts` and `writer.ts`.
- **Deviations from plan:** The template move was made as a write of `cli/templates/claude/devscene-task-offer.md` plus `rm` of the old path, not `git mv`; the committer stages both halves. So the first `git ls-files` bullet holds only after that commit; before it, the evidence is the directory listing (new file present, old absent). The byte comparison of the moved template against `HEAD` was refused by the session's Bash permissions; the new file was written from a full read of the old one, changing only its `harness-no-offer` occurrences.
