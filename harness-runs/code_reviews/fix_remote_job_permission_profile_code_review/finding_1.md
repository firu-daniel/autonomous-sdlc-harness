### 1. `qa-tester` checks `browser_route` against a profile that a run's worktree no longer has

**File:** `plugin/agents/qa-tester.md` (`## How it tests`, the **Mocking requests when a test needs it** bullet) — "if it is absent from the profile's `permissions.allow`, report the test `blocked` without calling it"

This branch adds the profile to `init`'s managed `.gitignore` block (`cli/templates/repo/gitignore` → `{{permissionProfilePath}}`), so `init`'s first commit (`cli/src/core/git.ts` → `commitAll`, `git add -A`) no longer contains `.claude/settings.autonomous.json`. As a result, no `git worktree add` checkout has one. The story index states this consequence (`## Context`, *"The second consequence is for worktrees"*). It fixes the watcher and `doctor` for it (Task 12 → `cli/src/core/git.ts` → `mainWorktreeRoot`). It does not fix the one plugin asset that reads the profile at run time.

`qa-tester` runs in the run's worktree. Its `<repo_root>` row says `<repo_root>` is *"the run's **own worktree**, not the main checkout"*. The bullet above tells it to confirm that the run grants `mcp__playwright__browser_route` by reading "the profile's `permissions.allow`", but it does not say where that profile is. The only reading the file supports is `<repo_root>/.claude/settings.autonomous.json`. For any repository adopted from this release on, that file does not exist in the worktree. An agent that follows the contract finds no grant. It then reports every test that needs request mocking as `blocked`, as a documented assumption with no fix loop, even when the adopter has added the entry to the profile the watcher actually loads (`autonomous-watcher.sh` → `SETTINGS_PROFILE="$MAIN_REPO/.claude/settings.autonomous.json"`). Before this branch the profile was committed, so the worktree copy existed and the check worked. The branch's scope-register derivation entry B missed this site because its pattern `settings\.autonomous\.json` does not match the `settings.autonomous.qa.json` citation on this line.

**Fix:** state where the profile is. In that bullet, replace

> if it is absent from the profile's `permissions.allow`, report the test `blocked` without calling it.

with

> Read the profile the run was launched with: `.claude/settings.autonomous.json` under the **main** checkout. That is the first `worktree ` line of a bare `git worktree list --porcelain`, the same resolution the watcher uses for its `--settings` flag. Do not read `<repo_root>/.claude/settings.autonomous.json`: the profile is machine-local and gitignored, so a run's worktree carries none, and a missing file there says nothing about the grant. If `mcp__playwright__browser_route` is absent from that file's `permissions.allow`, or the file cannot be read, report the test `blocked` without calling it.

The generated profile's `Read(/<repo_root>/**)` entry (`cli/templates/claude/settings.autonomous.json`) already covers a read of the main checkout. `git worktree list --porcelain` is a bare single-statement command, and the plugin already uses the "first entry of `git worktree list`" resolution for the main checkout (`plugin/instructions/plan_orchestration_instructions_autonomous.md` → the `AUTONOMOUS_STOP` **Path:** bullet). No new placeholder token is introduced, so the file's `## Resolved values` table does not change.
