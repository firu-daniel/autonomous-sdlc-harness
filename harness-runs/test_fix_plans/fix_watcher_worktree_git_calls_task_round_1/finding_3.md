### 3. Plumbing fast-forward refuses a copy that is ahead of origin (refused re-push subtest)

**Site:** `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_fast_forward_var`, at the ancestry test `if ! hr_run_main_git merge-base --is-ancestor "$tip" "$new" 2>/dev/null; then`. It directly follows `[ "$new" != "$tip" ] || return 0` (about line 2824; use it only to navigate). The caller is `cli/templates/scripts/autonomous-watcher.sh` → `process_inbox_file`, in the review path's remote arm: `hr_run_fast_forward_var "refs/remotes/origin/$branch"`.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks`, through its subtest `a review whose push is refused, then re-dropped identically, never dispatches`

**Failure (from the log):**

```
            not ok 2 - a review whose push is refused, then re-dropped identically, never dispatches
        not ok 866 - a remote review drop fast-forwards, commits, pushes and dispatches; a refused re-push blocks
```

**Diagnosis:** New this round, and a regression from this branch's change. The test file itself is unchanged on this branch.

The subtest runs these steps:
1. It drops `feat_x_review_2.md` while origin refuses updates. The commit lands locally, the push fails, and the record goes `failed`.
2. It re-drops the same file, still refused.
3. It expects the watcher to skip the commit (`already committed (identical re-drop) — skipping the commit, pushing anyway`), fail again on the push (the newest `failed` notification's detail matches `push-branch.sh`), and send no new `workflow run`.

On the re-drop, the local `feat_x` tip is the unpushed review commit, and `refs/remotes/origin/feat_x` is its parent. `hr_run_fast_forward_var` accepts only a target equal to the tip or descending from it. Its `merge-base --is-ancestor "$tip" "$new"` test therefore fails, and it returns 1 (`'feat_x' is not an ancestor of 'refs/remotes/origin/feat_x', so it cannot be fast-forwarded`). The watcher then calls `fail_before_launch` with the reason `the fast-forward of the working copy to origin/feat_x failed`, before `remote_commit_and_push`. The re-drop log line never appears, and the failure detail names the fast-forward instead of `push-branch.sh`. Before this branch, the step was `git -C "$worktree" merge --ff-only "origin/$branch"`, which exits 0 when the local branch already contains `origin/<branch>`. The parent test 866 fails because this subtest failed. Its first subtest passed.

**Suspected shared cause:** likely the same cause as Finding 2 — both tests re-drop a review over an unpushed local commit, which the new plumbing fast-forward refuses as "not an ancestor".

**Fix:** Restore `merge --ff-only`'s "already up to date" outcome in the library:

- [ ] In `hr_run_fast_forward_var`, right after `[ "$new" != "$tip" ] || return 0`, add: when `hr_run_main_git merge-base --is-ancestor "$new" "$tip" 2>/dev/null` succeeds (the branch already contains `<ref>`), `return 0` with nothing written and `HR_RUN_COPY_TIP` unchanged. Keep the existing refusal for true divergence. If this branch is already present because another fix added it, there is nothing further to change here.
- [ ] Make sure the function's header `0` line says that "already ahead of <ref>" is a no-op success.
- [ ] Leave `cli/test/watcher-remote-dispatch.test.mjs` unchanged. Its expectations (a skipped commit, a `push-branch.sh` failure and no dispatch) are the contract this fix restores.
