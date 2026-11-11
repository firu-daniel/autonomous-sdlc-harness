### Task 3 — Respell the non-script templates, the daemon unit templates and `cli/README.md`

**Goal:** Every file `init` writes into an adopting repository from outside `cli/templates/scripts/` and `cli/templates/github/`, both daemon unit templates and the package README name the product `devscene` (`DevScene` in titles). Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, which set `PLUGIN_NAME = 'devscene'`. `cli/templates/claude/harness-task-offer.md` already renders the skill name from `{{pluginName}}`, so that token is left as it is. Only the file's literal prose occurrences change.

**Where this task stops.** Templates change what a future adopter receives and nothing in this checkout. This repository's own renders under `.claude/` are Task 28's paste, the worked example's are Task 27's, and this repository's `.gitattributes` and `githooks/pre-push` are Tasks 14 and 17. Task 7 respells the suites that pin these templates' rendered text.

### Targets

- `cli/templates/claude/CLAUDE.md`, `cli/templates/claude/README.md`, `cli/templates/claude/harness-task-offer.md`, `cli/templates/claude/push-notify.env.example`, `cli/templates/claude/qa-accounts.env.example`, `cli/templates/claude/qa_test_scenarios.md`
- `cli/templates/claude/settings.autonomous.json`, `cli/templates/claude/settings.autonomous.qa.json`, `cli/templates/claude/settings.autonomous.retrieval.json`
- `cli/templates/claude/context/{api,conventions,data-layer,data-storage,docs-catalog,domain,layer,module,package,presentation,state-slices,tests}.md`
- `cli/templates/githooks/pre-push`, `cli/templates/repo/gitattributes`, `cli/templates/repo/mcp.json`, `cli/templates/repo/mcp.retrieval.json`
- `cli/templates/state-dir/README-root.md`, `cli/templates/state-dir/improvement_suggestions.md`, `cli/templates/state-dir/lessons.md`, `cli/templates/state-dir/run_analytics/README.md`, `cli/templates/state-dir/scratch/README.md`
- `cli/scripts/daemon/launchd.plist.template`, `cli/scripts/daemon/systemd.service.template`
- `cli/README.md`

**Work:**

- [ ] `cli/templates/claude/`: every `autonomous-sdlc-harness init` / `npx autonomous-sdlc-harness …` becomes `devscene init` / `npx devscene …`, and every `/autonomous-sdlc-harness:<command>` becomes `/devscene:<command>`. That covers the `_Written by …_` footers, `harness-task-offer.md`'s three literal hits, the two `.env.example` headers, `qa_test_scenarios.md` and the `_README` prose strings inside the three `settings.autonomous*.json` templates. Keep every `{{…}}` token byte-identical. A JSON template must still parse after the edit.
- [ ] `cli/templates/claude/context/*.md`: the one hit in each of the twelve stubs, the footer or the analyze-command pointer, respelled. Keep the `<!-- harness:unfilled -->` marker and the `**What belongs here**` block byte-identical: `init` and `doctor` key on both.
- [ ] `cli/templates/githooks/pre-push`, `cli/templates/repo/gitattributes`, `cli/templates/repo/mcp.json` (`_comment`) and `cli/templates/repo/mcp.retrieval.json` (`_comment_docs_retrieval`): `devscene init`, `npx devscene doctor --check-registry`. `cli/templates/state-dir/*`: the five `_Written by …_` footers and pointers respelled. `lessons.md` and `improvement_suggestions.md` keep every other byte.
- [ ] `cli/scripts/daemon/launchd.plist.template` and `systemd.service.template`: *"Rendered by `devscene daemon install`"* / *"`devscene daemon install`"*. Every `{{…}}` token is unchanged.
- [ ] `cli/README.md`: title `# DevScene (cli)`, `npx devscene …` in every command line and fenced block, `firu-daniel/devscene` in every URL, and the product named `DevScene` in prose, keeping "harness" where it is the category noun. Each command stays in its own fenced block, one per line (lessons ledger → *Adopter-facing documentation*).

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- cli/templates/claude cli/templates/githooks cli/templates/repo cli/templates/state-dir cli/scripts cli/README.md` prints nothing.
- `node -e "for (const f of ['settings.autonomous.json','settings.autonomous.qa.json','settings.autonomous.retrieval.json']) JSON.parse(require('fs').readFileSync('cli/templates/claude/'+f,'utf8')); for (const f of ['mcp.json','mcp.retrieval.json']) JSON.parse(require('fs').readFileSync('cli/templates/repo/'+f,'utf8')); console.log('ok')"`, run from the checkout root, prints `ok`.
- `git diff -U0 -- cli/templates cli/scripts` shows no changed line containing `{{`, other than lines whose only change is the product name.
