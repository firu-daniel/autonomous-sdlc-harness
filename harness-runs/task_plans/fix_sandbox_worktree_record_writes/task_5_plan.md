### Task 5 — Restate the excluded set in the profile template's `_README`, and correct the two code comments that describe the old wrapper

**Goal:** Make the text an adopter reads in their generated profile name all three commands that run outside the sandbox, and say why the commit wrapper is one of them. Correct the two code comments in this layer that still describe the old wrapper's behaviour.

**Depends on:** Task 4. Its `runsUnsandboxed` flag makes the generated `sandbox.excludedCommands` carry exactly `bash {{scriptsDirAbs}}/commit-on-branch.sh:*`, `bash {{scriptsDirAbs}}/push-branch.sh:*` and `bash {{scriptsDirAbs}}/refresh-branch.sh:*`, in that order. It also depends on Task 1, whose commit wrapper runs every git call against `<main>/.git`, borrows only the record's `index`, and runs no commit hook. This task changes prose only, no generated value. **Task 11** mirrors the `_README` lines into the worked example, byte for byte after token substitution, so word them once here.

### Targets

- `cli/templates/claude/settings.autonomous.json` (the `_README` array only)
- `cli/src/generators/permissionProfile.ts` (one doc comment)
- `cli/templates/scripts/autonomous-watcher.sh` (one comment)

**Work:**

- [ ] **The `_README` line beginning `"TWO COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`.** Rewrite it as `THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`, naming the main checkout's `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` under `{{scriptsDirAbs}}`, each with its reason:
  - the commit wrapper, because a sandboxed git cannot write a linked worktree's record (`docs/sandbox-verification.md` rows G1 and G2, measured on Claude Code 2.1.299, macOS);
  - the other two, because an SSH push or fetch fails inside the sandbox on macOS.

  Keep, unchanged in substance:
  - the bare `bash …:*` form and its P1a/P2 citation;
  - why the worktree's copy can never be the excluded one;
  - that the repo-relative and sibling-worktree spellings stay in `allow` and stay sandboxed, as does a compound;
  - the final sentence, with "both wrappers" made "all three wrappers" (they refuse any target but the main checkout or a worktree it lists).

  Add one clause: the commit wrapper runs no commit hook, because a hook would run project content with full access.
- [ ] **The two other `_README` lines that count the wrappers.**
  - In *"git's network traffic leaves through the two excluded wrappers named below"*, the count stays true for network traffic only. Reword it so it names the push and refresh wrappers rather than a count of the excluded set.
  - In *"the two excluded wrappers above keep the environment an HTTPS push needs"*, say "the excluded wrappers above".

  Validate the template as JSON afterwards. It is copied into every adopter's profile.
- [ ] **`permissionProfile.ts`**: the doc comment that says *"the configuration-dependent half — the two excluded commands, the allowed domains, the opt-out"* names a count the table now contradicts. Say "the excluded commands", with no count. The count is `OUTER_LOOP_SCRIPTS`', and a comment that restates it drifts.
- [ ] **`autonomous-watcher.sh`**: the comment explaining why the artifact commit is *"not routed through `commit-on-branch.sh`: that wrapper runs the copy's own hooks and stages in the run's index"* is now half false, because the wrapper runs no commit hook. Keep the decision, and restate its reason as what is still true: the wrapper stages its paths into the run's own index and judges the run's working copy, while `hr_commit_placed` commits one placed path by plumbing in the main checkout. Change no code line in that file.

**Verification:**

- `jq -e . cli/templates/claude/settings.autonomous.json > /dev/null` exits 0. That is the template still parsing; any other redirection would break the command's literal form, which `/dev/null` keeps.
- Build, then `init` a throwaway fixture repository under the temp directory with the compiled CLI. Its `.claude/settings.autonomous.json` `_README` carries the `THREE COMMANDS RUN OUTSIDE THE SANDBOX` line with the fixture's absolute scripts path substituted and no `{{…}}` left. No line in it still says "two excluded wrappers".
- `grep -n 'TWO COMMANDS\|two excluded' cli/templates/claude/settings.autonomous.json` finds nothing.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` passes. `git diff` on that file shows comment lines only.
