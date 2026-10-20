### 1. `remote-run.sh start` leaves the `branch.<branch>` upstream section its cut wrote in the main checkout's `.git/config`

**File:** `cli/templates/scripts/remote-run.sh` (`start_remove_copy`) — "update-ref -d \"refs/heads/$branch\" \"$seen_tip\"", with `copy_baseline_var` in the same file — "had_branch=0"

`start` cuts its branch with `create-worktree.sh --no-bootstrap <branch>`. In default mode that script pushes from the main checkout with `git -C "$main_repo" push --set-upstream origin "refs/heads/$branch:refs/heads/$branch"` (`cli/templates/scripts/create-worktree.sh`, the push step after the bootstrap block). That writes `branch.<branch>.remote` and `branch.<branch>.merge` into the **main checkout's** `.git/config`.

On every exit after the cut, success included, `start_remove_copy` deletes the local branch. Since `copy_saw_tip` always sets `seen_tip` after a successful cut, it now does this with `hr_copy_sync_main_git "$run_main" update-ref -d "refs/heads/$branch" "$seen_tip"`. `update-ref -d` is plumbing and does not touch the configuration. The `git branch -D` it replaced also removed the branch's configuration section. So every `start` now leaves that section in the main checkout's `.git/config`, even though the branch it describes is gone.

Reproduced by hand with git on this machine. After `git push --set-upstream origin refs/heads/feat_x:refs/heads/feat_x` and `git update-ref -d refs/heads/feat_x <tip>`, `git config --get-regexp '^branch\.feat_x\.'` still prints `branch.feat_x.remote origin` and `branch.feat_x.merge refs/heads/feat_x`.

What goes wrong as a result:

- The cleanup sweep never sees the branch, because no local branch is left. So nothing ever removes the section.
- A later `create-worktree.sh` cut of the same name reads the leftover section as `had_upstream=1`. Its own rollback then does not remove the section either.
- `push-branch.sh` reads a `branch.<branch>.merge` naming the branch's own ref as "tracking". So a future same-named branch is judged against the deleted-on-its-remote rule as if it had been published before.

This breaks `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."* The branch's tracking configuration is part of the branch the cut created. `create-worktree.sh`'s own rollback already removes that section (its `upstream_written` flag and `config --remove-section "branch.$branch"`), and `start_remove_copy` has to do the same.

**Fix:** record whether the section existed before the cut, and remove it after the branch is deleted only when it did not.

1. In `copy_baseline_var`, after the two `had_branch` lines, add:

```bash
  had_upstream=0
  if git -C "$root" config --get "branch.$branch.remote" >/dev/null 2>&1 \
    || git -C "$root" config --get "branch.$branch.merge" >/dev/null 2>&1; then
    had_upstream=1
  fi
```

   In the comment above `copy_baseline_var`, add "whether the branch's `branch.<branch>` configuration section existed (`had_upstream`)" to its list of what it records.

2. In `start_remove_copy`, directly after the `if [ "$had_branch" -eq 0 ] && git -C "$root" show-ref …; then … fi` block that deletes the local branch, add:

```bash
  if [ "$had_branch" -eq 0 ] && [ "$had_upstream" -eq 0 ] \
    && ! git -C "$root" show-ref --verify --quiet "refs/heads/$branch" \
    && { git -C "$root" config --get "branch.$branch.remote" >/dev/null 2>&1 \
      || git -C "$root" config --get "branch.$branch.merge" >/dev/null 2>&1; }; then
    git -C "$root" config --remove-section "branch.$branch" >/dev/null 2>&1 \
      || echo "remote-run.sh: could not remove the branch.$branch section from '$root/.git/config'" >&2
  fi
```

   The `show-ref` guard keeps the section when the branch could not be deleted. The two `config --get` guards skip the call when `git branch -D` already removed the section. In the comment above `start_remove_copy`, add "the `branch.<branch>` configuration section the cut's push wrote, when it was absent before" to its list of what it removes.

3. In `cli/test/remote-start.test.mjs`, extend the fixture's `assertNothingLeft` helper so that it also asserts that `git config --get-regexp '^branch\.feat_x\.'` in `dir` exits non-zero, with the message `'the branch.feat_x configuration section was left behind'`. Do this beside its existing local-branch assertion, using the same `runBash(dir, ['-c', …])` form. Also add one case: set `branch.feat_x.remote origin` and `branch.feat_x.merge refs/heads/feat_x` in `dir`'s configuration before a successful `start`, then assert that both keys are still there afterwards. That case is the never-remove-what-it-did-not-create half of the lesson.

   This is the one test file the fix edits, so the fix runs only that file: `npm test --workspace cli -- test/remote-start.test.mjs` from the repository root.
