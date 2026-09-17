### Task 5 — Qualify the command spellings in the comment-only `cli/src` modules and the `cli/templates/claude/` templates

**Goal:** The remaining `cli`-layer sites use the qualified spelling. These are comments in three modules and prose in two files under `cli/templates/claude/`, one of which `init` renders into an adopter's `.claude/CLAUDE.md`. In the rendered `CLAUDE.md` template the plugin name comes from the `{{pluginName}}` token, never from a typed literal, so `PLUGIN_NAME` in `cli/src/generators/projectSettings.ts` stays its single owner.

**Depends on:** Task 2. Task 2 adds `pluginName: PLUGIN_NAME` to the `render('CLAUDE.md', …)` call in `cli/src/generators/claudeContext.ts`, so that call reads `render('CLAUDE.md', { projectName, setupBanner, routingRows, stateDir, pluginName: PLUGIN_NAME })`. Without that value, the `{{pluginName}}` tokens this task writes make `renderTemplate` throw (*"uses the token {{pluginName}}, which this generator supplies no value for"*). Task 2 also owns every existing assertion in `cli/test/init.test.mjs`.

**Where this task stops.** This task does not edit `claudeContext.ts`: Task 2 owns it and has already supplied the value. In `init.test.mjs` it appends one new test case and changes no existing assertion. `cli/templates/claude/README.md` is not passed through any `render(…)` call (no generator under `cli/src` renders it), so it has no token to use and its opening sentence is qualified as text. `cli/templates/claude/harness-task-offer.md` already names the skill `{{pluginName}}:branch-prompt`, which is the `Skill`-tool form without a slash, and it is left alone. This checkout's own `.claude/CLAUDE.md` is `init`'s output for this repository and cannot be edited by a run. It stays as it is and is raised as corpus staleness.

### Targets

- `cli/src/config/model.ts`
- `cli/src/core/writer.ts`
- `cli/src/generators/harnessConfig.ts`
- `cli/templates/claude/CLAUDE.md`
- `cli/templates/claude/README.md`
- `cli/test/init.test.mjs` (one appended case only; the file is Task 2's)

**Work:**

- [ ] `model.ts`, `writer.ts`, `harnessConfig.ts`: qualify every `/harness-analyze` in their comments. These include the `detection.review` field comment, the two re-run-contract table rows for `.claude/CLAUDE.md` and the `.claude/context/*.md` stubs, and the "No `review` key is written here" paragraph. Comments may carry the literal plugin name.
- [ ] `cli/templates/claude/CLAUDE.md`: spell every slash spelling through the token.
  - The `/harness-analyze` placeholder lines in the project and naming sections become `/{{pluginName}}:harness-analyze`.
  - The family names `/branch-*` and `/harness-*` in the change-request fence become `/{{pluginName}}:branch-*` and `/{{pluginName}}:harness-*`.
  - Add only the `{{pluginName}}` token; change no existing token and no section heading. `doctor`'s `task-offer-rules` check keys on the `## Where a change request runs` section name.
- [ ] `cli/templates/claude/README.md`: qualify the `/harness-analyze` in its opening sentence.
- [ ] `cli/test/init.test.mjs`: append one case beside the setup-pending banner tests. It uses the existing `fixtureFor(t, { files: nodeProjectFiles() })`, `initOk(dir)` and `text(dir, CLAUDE_MD)` helpers. It asserts that the generated `.claude/CLAUDE.md` contains `/autonomous-sdlc-harness:harness-analyze`, `/autonomous-sdlc-harness:branch-*` and `/autonomous-sdlc-harness:harness-*`, and that it contains no `{{pluginName}}`. Its header comment says the name reaches the file through the `pluginName` render value, taken from `PLUGIN_NAME`.

**Verification:**

- `bash scripts/test.sh` exits 0. The render-time every-token-has-a-value check and the `init` fixture cases still pass over the edited template. The appended case shows that a generated `.claude/CLAUDE.md` in a fixture reads `/autonomous-sdlc-harness:…`.
- `grep -nE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' cli/src/config/model.ts cli/src/core/writer.ts cli/src/generators/harnessConfig.ts cli/templates/claude/CLAUDE.md cli/templates/claude/README.md` returns no output.
- `grep -n "autonomous-sdlc-harness:" cli/templates/claude/CLAUDE.md` returns no output. A hit means the plugin name was typed into the rendered template instead of taken from `{{pluginName}}`.
