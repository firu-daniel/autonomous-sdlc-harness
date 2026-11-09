### 1. The `branch-protection` remedy recommends a pull-request ruleset on the default branch, and never says it refuses the direct default-branch pushes `doctor` and the setup docs print

**File:** `cli/src/doctor/branchProtection.ts` (`REMEDY`) — "Require a pull request before merging'"; and `docs/cli.md` → `## 7.`, the bullet `- **\`branch-protection\` never fails**` — "The remedy is a ruleset under *Settings → Rules → Rulesets* targeting the branch"

**Problem.** Every `warn` line this check prints ends with `REMEDY`: *"add a ruleset under Settings → Rules → Rulesets targeting the branch, with Restrict deletions, Block force pushes and Require a pull request before merging"*. The protected set always contains `defaultBranch` (`resolveProtectedBranches` adds it whatever `protectedBranches` says), so this remedy is given for the default branch on every repository whose default branch accepts direct pushes.

The harness itself tells the adopter to push **directly** to the default branch, in `doctor`'s own output and in the setup docs:

- `cli/src/core/defaultBranchPush.ts` → `defaultBranchPushCommand` — "git push --no-verify origin ${branch}" — printed with `defaultBranch` by `REMOTE_EXECUTION_CHECK` (the `origin/${branch} does not carry` warning and the version-move warning) in `cli/src/doctor/checks.ts`;
- `docs/cli.md` → `## 7.`, the `profile-tracked` bullet's untrack route — "git push --no-verify origin <default branch>";
- `docs/remote-execution.md` → `## 7.` (the workflow push and the untrack push) and `docs/github-issue-trigger.md` (the trigger-workflow push) — "git push --no-verify origin <default branch>".

A ruleset's *Require a pull request before merging* rule refuses a direct push from everyone not on the ruleset's bypass list, repository administrators included (unlike classic branch protection, a ruleset has no implicit admin exemption); `--no-verify` skips only the local `pre-push` hook. So the adopter who follows this branch's remedy and later follows any of those routes gets GitHub's rule-violation refusal on the push, and nothing the harness printed or documented told them the two collide. Reachable on any `forge: github` repository whose default branch is not yet protected — exactly the repositories this check warns on.

Reader and wrong answer: an adopter who added the ruleset `branch-protection` asked for, then ran `profile-tracked`'s printed untrack route (or `remote-execution`'s workflow push), reads both as harness instructions that each work, and the second fails with no harness text naming why or what to do instead.

Net-new: the code review's finding 3 covers bypass actors as a gap in what a **pass** proves; it does not touch the remedy's collision with the harness's own direct-push routes.

**Fix.**

- [ ] In `cli/src/doctor/branchProtection.ts`, replace the `REMEDY` constant's value with:

  ```ts
  const REMEDY =
    'add a ruleset under Settings → Rules → Rulesets targeting the branch, with Restrict deletions, Block force pushes and Require a pull request before merging; a ruleset binds administrators too, so a direct push to that branch that another doctor line prints (git push --no-verify origin <branch>) then needs you on the ruleset\'s bypass list, or goes through a pull request instead';
  ```

  The existing assertions in `cli/test/branch-protection.test.mjs` (`split('Settings → Rules → Rulesets').length` equal to `2`, and the `/Restrict deletions, Block force pushes and Require a pull request before merging/` match) still hold, so no test file changes.

- [ ] In `docs/cli.md` → `## 7.`, the `branch-protection` bullet, directly after the sentence "The remedy is a ruleset under *Settings → Rules → Rulesets* targeting the branch, with *Restrict deletions*, *Block force pushes* and *Require a pull request before merging*.", add:

  > A ruleset binds administrators too, so once the default branch carries one, the direct pushes this document and [`remote-execution.md`](remote-execution.md) §7 give as `git push --no-verify origin <default branch>` — the `profile-tracked` untrack route and the workflow setup push — are refused by GitHub unless you are on the ruleset's bypass list; otherwise land those commits through a pull request.

Change nothing else in either file.
