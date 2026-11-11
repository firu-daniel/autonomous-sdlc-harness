### Task 2 — Respell every remaining `cli/src` string and comment

**Goal:** Every `autonomous-sdlc-harness` literal left in `cli/src` after Task 1 becomes `devscene`: user-facing messages, usage text, the `CLI = 'npx …'` constants, and doc comments. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, which owns and has already changed `cli/src/core/pluginIdentity.ts`, `generators/projectSettings.ts`, `machine/paths.ts`, `daemon/units.ts`, `doctor/keepAwake.ts`, `retrieval/runtime.ts` and `generators/repoRoot.ts`. This task edits none of those seven. Where a comment here names one of their constants by value, such as `init.ts`'s list of where the tool's name occurs, it now spells the values Task 1 set: `devscene`, `com.devscene.watcher`, `# >>> devscene (managed block`.

**Where this task stops.** It edits no test file. Tasks 7 and 8 respell the suites that pin these messages, after this task lands. Each `const CLI = 'npx autonomous-sdlc-harness'` stays a module-local constant, and only its value changes. That duplication predates this branch and breaches `.claude/context/conventions.md` → `## Shared code, and where it lives`. Gathering the invocation into one constant owned by `cli/src/core/pluginIdentity.ts` (for example `CLI_INVOCATION = \`npx ${PLUGIN_NAME}\``) and importing it in `commands/`, `doctor/`, `generators/`, `retrieval/` and `config/` is a separate refactor this rename-only branch does not take. **Follow-up:** a `refactor` branch that makes that change, best scheduled after this branch merges and before the later rename branches touch the same literals. The story index's `## Rejected findings` records why.

### Targets

- `cli/src/cli.ts`
- `cli/src/commands/config.ts`, `cli/src/commands/daemon.ts`, `cli/src/commands/docs.ts`, `cli/src/commands/doctor.ts`, `cli/src/commands/init.ts`, `cli/src/commands/registry.ts`
- `cli/src/config/check.ts`, `cli/src/config/io.ts`, `cli/src/config/model.ts`
- `cli/src/core/writer.ts`
- `cli/src/detect/presets.ts`, `cli/src/detect/signals.ts`
- `cli/src/doctor/checks.ts`
- `cli/src/generators/claudeContext.ts`, `cli/src/generators/githubWorkflows.ts`, `cli/src/generators/harnessConfig.ts`, `cli/src/generators/notifications.ts`, `cli/src/generators/permissionProfile.ts`, `cli/src/generators/sandboxProfile.ts`
- `cli/src/retrieval/server.ts`, `cli/src/retrieval/session.ts`, `cli/src/retrieval/setup.ts`

**Work:**

- [ ] `cli.ts`: the module header (`DevScene — CLI entry point.`; the `devscene: <message>` error-prefix sentence), the `--version` banner `devscene ${version}`, the usage lines `npx devscene <command> [options]` and `npx devscene <command> --help`, and the three `console.error` prefixes `devscene: …`. `commands/registry.ts`: the two `npx devscene ${command.name}` lines.
- [ ] `commands/{config,daemon,docs,init}.ts`, `doctor/checks.ts`, `generators/harnessConfig.ts`, `retrieval/server.ts`: `const CLI = 'npx devscene'`; `generators/permissionProfile.ts`: `DOCTOR_COMMAND = 'npx devscene doctor'`; and every remaining inline `npx autonomous-sdlc-harness …` in `commands/doctor.ts`, `config/check.ts`, `config/io.ts`, `generators/claudeContext.ts` (`PLUGIN_ORIGIN_CLAUSE`, the kept-file note), `generators/notifications.ts`, `generators/sandboxProfile.ts`, `generators/githubWorkflows.ts` (`npx devscene@<version> …` in two comments), `retrieval/session.ts` and `retrieval/setup.ts`.
- [ ] Every `/autonomous-sdlc-harness:<command>` in a message or comment becomes `/devscene:<command>`: `commands/init.ts`, `config/model.ts`, `core/writer.ts`'s re-run-contract table rows, `detect/presets.ts`, `detect/signals.ts`, `doctor/checks.ts` (the `branch-resume` and `branch-qa-test` remedies and the `harness-analyze conventions` comment), `generators/claudeContext.ts`, `generators/harnessConfig.ts`. `init.ts`'s doc comment on the tool's name, *"The bare `autonomous-sdlc-harness …` form"* and the list after it, is respelled as a whole so it still says what it said: the bare `devscene …` form is not prefixed, and the occurrences it lists are the ones Task 1 renamed.
- [ ] `commands/init.ts` → the `Headless first-message leg, re-measured:` paragraph is a measured record. Respell `autonomous-sdlc-harness:harness-analyze` in its `system`/`init` listing, its `claude -p "/…:harness-analyze"` command and its `Skill` sentence. Add the story index's measured-record parenthesis *"(Taken under the product's earlier name; only the name is respelled here.)"* to the sentence naming the Claude Code version measured. Leave its other line, `claude -p "/harness-analyze" --permission-mode plan …`, byte-identical: `scripts/check-command-spelling.sh` exempts it by that substring.
- [ ] The `claudeContext.ts` header line naming *"`autonomous-sdlc-harness init`'s analyze offer"*, and any other remaining comment-only hit in the files above, respelled to `devscene`.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- cli/src` prints nothing.
- `git grep -n -F 'claude -p "/harness-analyze" --permission-mode plan' -- cli/src/commands/init.ts` prints exactly one line, so the gate-6d exemption still covers one line.
- `node cli/dist/cli.js --help`, run from the checkout root after the build, prints a usage block whose lines read `npx devscene …` and no other product name.
