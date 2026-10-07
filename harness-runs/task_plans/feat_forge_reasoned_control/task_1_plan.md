### Task 1 — Declare the mention names in `githubActions.ts` and mirror them in `remote-run.sh`

**Goal:** Give the mention path its closed vocabulary, with one owner in `cli/src/remote/githubActions.ts` and byte-for-byte shell mirrors in `cli/templates/scripts/remote-run.sh`. The vocabulary is:

- the decision's `action` values;
- which of the six command verbs a mention may carry out or must only ask to confirm;
- the plugin-qualified name of the slash command that reads a mention.

Later tasks then read these names rather than retyping a literal.

**Where this task stops.** It declares names and their mirrors, and changes no behaviour. Task 2 reads `MENTION_ACTIONS` when it builds the decision schema and validates a decision, and reads `MENTION_COMMAND` as the `-p` prompt of the session it starts (the plugin's slash command, invoked as the session's first message). Task 3 reads `MENTION_ACT_VERBS` / `MENTION_CONFIRM_VERBS` when it decides whether a `command` decision is carried out. Task 6 consumes the TypeScript arrays in `doctor`'s and `init`'s text. Task 8 creates the plugin command `plugin/commands/harness-read-mention.md` whose basename `MENTION_COMMAND_NAME` names, and Task 7 the instruction file it loads; this task creates no plugin file. This task touches no function in `remote-run.sh`, only its constant block and its `MIRRORS` header.

### Targets

- `cli/src/remote/githubActions.ts` — the new constants, their types and the module header.
- `cli/templates/scripts/remote-run.sh` — four mirror lines beside `COMMAND_VERBS='…'`, and four rows in the header's `MIRRORS OF cli/src/remote/githubActions.ts` block.
- `cli/test/remote-names.test.mjs` — literal-value and mirror assertions.

**Work:**

- [ ] `githubActions.ts`, directly after `COMMAND_VERBS` / `CommandVerb`. Each export gets a one-line doc comment in the module's style:
  - `export const MENTION_ACTIONS = ['command', 'reply', 'clarify', 'fixes', 'none'] as const;` and `export type MentionAction = (typeof MENTION_ACTIONS)[number];`. Document it as the `action` values a mention's decision may carry: `command` names one of `COMMAND_VERBS`; `reply` and `clarify` carry the agent's text; `fixes` is a request for fixes, answered with the script's own text; `none` means the mention was not addressed to the harness.
  - `export const MENTION_VERB_HANDLING: Readonly<Record<CommandVerb, 'act' | 'confirm'>> = { answer: 'act', pause: 'act', resume: 'act', stop: 'confirm', clear: 'confirm', status: 'act' };`. It is typed as a **total record** over `CommandVerb`, per `.claude/context/conventions.md` → *"Where a total mapping over a union is involved, type it as a total record"*, so a seventh verb fails to compile until it is classified. Document `act` as *carried out through that verb's own arm*. Document `confirm` as *answered with a request to comment the command itself*: `stop` because it is destructive, `clear` because on GitHub typing it is the confirmation `branch-resume` asks for.
  - `export const MENTION_ACT_VERBS` and `export const MENTION_CONFIRM_VERBS`: `readonly CommandVerb[]` derived from `COMMAND_VERBS` filtered on `MENTION_VERB_HANDLING`, in `COMMAND_VERBS` order. They therefore read `['answer', 'pause', 'resume', 'status']` and `['stop', 'clear']`.
  - `export const MENTION_COMMAND_NAME = 'harness-read-mention';` and `export const MENTION_COMMAND = \`/${PLUGIN_NAME}:${MENTION_COMMAND_NAME}\`;`, importing `PLUGIN_NAME` from `../core/pluginIdentity.js`, its one owner (that module's header: *"the plugin's name and every plugin-qualified command spelling the CLI prints are built here, once"*), never retyping `autonomous-sdlc-harness`. `MENTION_COMMAND` is not printed by the CLI; it is a remote-execution name mirrored into `remote-run.sh`, which is why it sits with the other run-control names and is built from `PLUGIN_NAME` rather than spelled. Document `MENTION_COMMAND_NAME` as the basename of the plugin slash command `plugin/commands/harness-read-mention.md` (the slash-command name verbatim, per `.claude/CLAUDE.md` → `## File naming conventions`). Document `MENTION_COMMAND` as the plugin-qualified slash command `remote-run.sh control` passes as the session's `-p` prompt, the way `autonomous-watcher.sh` launches the plugin's commands as a session's first message. The citation is prose in a doc comment, which `.claude/context/conventions.md` → `## The layers` permits (*"`cli/src` names `plugin/` files only inside doc comments"*).
- [ ] `githubActions.ts` module header: add `MENTION_*` to the run-control names listed as *"gated tighter still: they are consulted only where `forgeTriggerApplies(config)` is true"*. The *"Shell and YAML mirrors"* paragraph already names `remote-run.sh`, so it needs no new file.
- [ ] `remote-run.sh`: add four lines immediately after `COMMAND_VERBS='answer pause resume stop clear status'`, spelled exactly as follows. Add four matching rows to the header's `MIRRORS OF` block in its column layout (e.g. `#   MENTION_ACTIONS              mirrors  MENTION_ACTIONS, space-separated, same order`; `#   MENTION_COMMAND              mirrors  MENTION_COMMAND, the plugin-qualified slash command`):
  - `MENTION_ACTIONS='command reply clarify fixes none'`
  - `MENTION_ACT_VERBS='answer pause resume status'`
  - `MENTION_CONFIRM_VERBS='stop clear'`
  - `MENTION_COMMAND='/autonomous-sdlc-harness:harness-read-mention'`
- [ ] `cli/test/remote-names.test.mjs`:
  - Import the six new exports.
  - In `the run-control names keep their literal values`, assert the three arrays' literal values, `MENTION_COMMAND_NAME === 'harness-read-mention'` and `MENTION_COMMAND === '/autonomous-sdlc-harness:harness-read-mention'`.
  - Assert that `MENTION_ACT_VERBS` and `MENTION_CONFIRM_VERBS` together are a partition of `COMMAND_VERBS`: disjoint, with a sorted union equal to `COMMAND_VERBS` sorted.
  - In `remote-run.sh mirrors the run-control names byte for byte`, add the three list mirror lines built from the exports joined with `' '`, and `MENTION_COMMAND='<MENTION_COMMAND>'` built from the export.

**Verification:**

- `commands.typecheck` exits 0, and a scratch edit adding an eighth key to `MENTION_VERB_HANDLING`, or removing one, fails to compile (the record is total). Revert that edit before finishing.
- `npm test --workspace cli -- test/remote-names.test.mjs` passes. This is the one test file this task edits; run it as one plain foreground command from the repository root.
- `grep -n "^MENTION_" cli/templates/scripts/remote-run.sh` prints exactly the four lines above, and `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `grep -n "autonomous-sdlc-harness" cli/src/remote/githubActions.ts` finds no new string literal: the name is built from `PLUGIN_NAME`.

**Deviations from plan:**

- `bash -n cli/templates/scripts/remote-run.sh` was not executed: the command required approval, refused with both an absolute and a repo-relative path. That bullet's claim rests on reading the change instead. The edit adds four single-quoted assignment lines and four `#` comment lines, and `remote-names.test.mjs` → `remote-run.sh mirrors the run-control names byte for byte` passes against the file.
- The totality probe ran as the scratch edit itself (`extra: 'act'` added, then `status` removed). Each one failed `commands.typecheck` with TS2353 / TS2741, and both were reverted before the final `commands.typecheck` passed.
