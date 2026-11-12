### Task 4 — Respell `doctor`, the remaining generators, the remote names and retrieval in `cli/src`

**Goal:** Finish `cli/src`. Rename the poll-state artifact and the mention command in their owning constants, write the unresolved-wrapper placeholder with the `devscene: ` prefix, and respell every remaining comment and message.

**Depends on:** Tasks 1 and 2, which set `CONFIG_FILENAME`, `DEFAULTS`, `ANALYZE_COMMAND` and the two marker constants that `doctor/checks.ts` imports.

**The contract later tasks consume.** `cli/src/remote/githubActions.ts` has:
- `POLL_STATE_ARTIFACT_NAME = 'devscene-poll-state'`
- `MENTION_COMMAND_NAME = 'read-mention'`, so `MENTION_COMMAND` = `/devscene:read-mention`

`remote-run.sh` and `devscene-resume.yml` mirror these (Task 6). The plugin command file becomes `plugin/commands/read-mention.md` (Task 11).

`cli/src/generators/scripts.ts` writes the placeholder `harness_fail "devscene: <fix>"`. The function name `harness_fail` and `UNRESOLVED_HEAD = 'harness_fail'` stay.

**Where this task stops.** The suites pinning these values (`remote-names`, `workflow-templates`, `init`, `wrapper-carry-forward`, `doctor`) are Tasks 19, 20 and 22's.

### Targets

- `cli/src/doctor/checks.ts`
- `cli/src/generators/githooks.ts`, `githubWorkflows.ts`, `outerLoopScripts.ts`, `permissionProfile.ts`, `repoRoot.ts`, `scripts.ts`, `stateDir.ts` (all under `cli/src/generators/`)
- `cli/src/remote/githubActions.ts`
- `cli/src/retrieval/queryLog.ts`, `cli/src/retrieval/session.ts`

**Work:**

- [ ] `remote/githubActions.ts`: set the two constants above and respell their doc comments, including *"The basename of the plugin slash command `plugin/commands/read-mention.md`"*.
- [ ] `generators/scripts.ts`: change the placeholder template to `` `harness_fail "devscene: ${unresolvedFix(key, file)}"` ``, and apply row 1 of `## Context`'s spelling table to its comments and messages.
- [ ] `doctor/checks.ts`: apply rows 1, 2 and 6 to every comment and literal message, including the `` `/devscene:analyze conventions` `` comment and the configured-`devscene/` comment. Interpolations of `CONFIG_FILENAME` and `ANALYZE_COMMAND` stay.
- [ ] The other six generators and `retrieval/queryLog.ts`, `retrieval/session.ts`: apply rows 1, 2 and 6 to every comment and literal message. An example is `session.ts`'s *"docs retrieval is off in devscene.config.json: …"*.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-analyze|harness-read-mention|harness-poll-state|harness:unfilled|harness:setup-pending|harness-task-offer|harness-no-offer|harness_fail "harness: ' -- cli/src` prints nothing. With this task all of `cli/src` is respelled.
- `git grep -nE "POLL_STATE_ARTIFACT_NAME = |MENTION_COMMAND_NAME = " -- cli/src/remote/githubActions.ts` shows `'devscene-poll-state'` and `'read-mention'`.
- `commands.typecheck` passes.
