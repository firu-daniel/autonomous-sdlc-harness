# cli review — ### 4. `remote-run.sh start` leaves its working copy, and its local branch, behind on every run — iteration 0

Verified by running `node --test test/remote-start.test.mjs` from `cli/` after `npm run build`. All 10 cases pass, including the three new ones.

## Should Fix
1. **The `had_branch` guard is untested, so a regression would silently delete a maintainer's own local branch** — `cli/test/remote-start.test.mjs` (header) — "while one that existed before the cut is never touched"
   The suite header now claims that a copy or branch that existed before the cut is never touched. The only case that exercises this is "a refused start leaves a directory that already stood at the copy's path untouched", and it covers the directory alone. Nothing creates a local `refs/heads/feat_x` before `start` and checks that it survives. Suppose a later edit drops the `[ "$had_branch" -eq 0 ]` check in `start_remove_copy` (`cli/templates/scripts/remote-run.sh`). `create-worktree.sh` then refuses on the existing branch, the EXIT trap runs `git branch -D feat_x`, and the maintainer's branch is deleted. Every test still passes.
   **Fix:** Add a case that runs `git branch feat_x` in `f.dir` before `start`, without checking it out. Assert exit 4, no gh call, and that `git -C f.dir rev-parse refs/heads/feat_x` still resolves to the same SHA afterwards.

## Nice to Have
1. **The pre-existing-directory case probably passes even without the `had_copy` guard** — `cli/test/remote-start.test.mjs` (test "a refused start leaves a directory that already stood at the copy's path untouched") — "assert.equal(readFileSync(join(f.worktree, 'keep.txt'), 'utf8'), 'not start\'s\n');"
   This was confirmed by reading, not run: a scratch probe of `git worktree remove --force` on a plain directory was denied by the permission layer. Git's documented behaviour is that `worktree remove` refuses a path that is not a registered working tree ("is not a working tree"). If so, deleting the `had_copy` check would leave `keep.txt` intact anyway, and this test cannot catch the regression its title names. It still usefully pins the refusal (exit 4, no gh call, origin unchanged).
   **Fix:** Make the pre-existing copy a real registered working tree, for example `git -C f.dir worktree add --detach <f.worktree>` before `start`. Then a missing guard would actually remove it. Keep the existing assertions.
