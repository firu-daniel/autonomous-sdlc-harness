### 3. The profile and the project settings files are protected only by a tool-layer refusal that is unmeasured under `dontAsk`

**File:** `cli/src/generators/writeProtection.ts` (`protectedPaths`): "{ path: join(repoRoot, MCP_PATH), kind: 'file', reason: 'the agent runner starts the MCP servers it declares outside the sandbox' }"

**The problem.** The write protection covers `.mcp.json` because the agent runner launches what it declares outside the sandbox. Three other files hold the same kind of launch surface, or decide the next run's containment outright:

- `<main>/.claude/settings.autonomous.json`, the profile itself. The watcher passes it to every unattended run with `--settings` (`SETTINGS_PROFILE="$MAIN_REPO/.claude/settings.autonomous.json"`). A rewrite to `"enabled": false`, or a wider `allow`, takes effect at the next launch.
- `.claude/settings.json` and `.claude/settings.local.json`, in the main checkout and in each worktree. Hooks run outside the sandbox (the task prompt's verified fact: "Outside the sandbox: … hooks"), and these files declare them. A resumed run relaunches in the same worktree and reads that worktree's copies.

The profile's file-tool allows, `Edit(//<repoRoot>/**)`, `Write(//<repoRoot>/**)` and the worktree-glob twins, reach all of them. The sandbox's built-in protected paths cover `.claude` settings for sandboxed commands only; the verified facts say so of the same list ("not for Claude's file tools"). What stands between a run's `Write` and these files is the `.claude/**` tool-layer refusal. The story index records that refusal as measured only under `acceptEdits` and **unresolved** under `dontAsk` (`## Context` → "**Unresolved, and planned around rather than decided:**"). The task prompt requires an unresolved point to be planned around, never decided by default. Here the write protection decides it by assuming the refusal holds. If it does not hold, the run can turn the next run's sandbox off. Graded Should Fix rather than Must Fix only because that outcome turns on the unresolved behaviour.

**Fix.** Add the three files to `protectedPaths`, so each is denied on both sides whatever the tool layer does. An explicit deny holds in every permission mode.

- [ ] In `cli/src/generators/projectSettings.ts`, beside `SETTINGS_PATH`, export `export const SETTINGS_LOCAL_PATH = \`${CLAUDE_DIR}/settings.local.json\`;` with a one-line doc comment saying `writeProtection.ts` protects it.
- [ ] In `writeProtection.ts`, import `PROFILE_PATH` from `./profileEntries.js` and `SETTINGS_PATH`, `SETTINGS_LOCAL_PATH` from `./projectSettings.js`. `projectSettings.ts` imports only `profileEntries.ts` among the generators, so no cycle forms. Directly after the two `MCP_PATH` entries, push:

  ```ts
  { path: join(repoRoot, PROFILE_PATH), kind: 'file', reason: 'the run watcher passes it to every unattended run with --settings' },
  { path: join(repoRoot, SETTINGS_PATH), kind: 'file', reason: 'Claude Code runs the hooks it declares outside the sandbox' },
  { path: join(glob, SETTINGS_PATH), kind: 'file', reason: "a worktree's session runs the hooks it declares outside the sandbox" },
  { path: join(repoRoot, SETTINGS_LOCAL_PATH), kind: 'file', reason: 'Claude Code runs the hooks it declares outside the sandbox' },
  { path: join(glob, SETTINGS_LOCAL_PATH), kind: 'file', reason: "a worktree's session runs the hooks it declares outside the sandbox" },
  ```

  The worktree has no profile of its own (`plugin/agents/qa-tester.md`: "a run's worktree carries none"), so the profile has no glob twin.
- [ ] Extend the `_README` sentence `applyWriteProtection` writes. After "such as a change to its hooks directory or to ${MCP_PATH}," add "or to ${SETTINGS_PATH},".
- [ ] In `cli/test/profile.test.mjs`, case "every path that runs outside the sandbox is write-protected on both sides", add `assertProtected` for `join(dir, '.claude', 'settings.autonomous.json')`, `join(dir, '.claude', 'settings.json')`, `join(glob, '.claude', 'settings.json')`, `join(dir, '.claude', 'settings.local.json')` and `join(glob, '.claude', 'settings.local.json')`, each `'file'`. That is the test file this fix edits, so it is the one the fix runs.
- [ ] In `docs/cli.md` → `### The sandbox block and the permission mode`, in the paragraph starting "**Everything that runs outside the sandbox is write-protected on both sides**", add "the profile itself in the main checkout, and `.claude/settings.json` and `.claude/settings.local.json`, whose hooks run outside the sandbox, each in the main checkout and under the worktree glob;" after the `.mcp.json` clause.
- [ ] Add the same five entries to `examples/notes-app/.claude/settings.autonomous.json`, in its `/workspace/notes-app` and `/workspace/notes-app-*` spelling: `sandbox.filesystem.denyWrite` after `/workspace/notes-app-*/.mcp.json`, the `Edit(//…)`/`Write(//…)` pairs in `permissions.deny` after the `.mcp.json` pairs, and the matching items in its "WHAT RUNS OUTSIDE THE SANDBOX…" `_README` line. Then update the counts in `examples/notes-app/README.md`'s sentence beginning "The file now carries" to match the file.
