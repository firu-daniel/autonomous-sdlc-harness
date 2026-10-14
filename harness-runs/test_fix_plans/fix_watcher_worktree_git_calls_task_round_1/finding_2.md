### 2. Plumbing fast-forward refuses a copy that is ahead of origin (identical re-drop test)

**Site:** `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_fast_forward_var`, at the ancestry test `if ! hr_run_main_git merge-base --is-ancestor "$tip" "$new" 2>/dev/null; then`. It directly follows `[ "$new" != "$tip" ] || return 0` (about line 2824; use it only to navigate). The caller is `cli/templates/scripts/autonomous-watcher.sh` → `process_inbox_file`, in the review path's remote arm: `hr_run_fast_forward_var "refs/remotes/origin/$branch"`.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `an identical re-drop after a refused push skips the commit, lands the push and dispatches once`

**Failure (from the log):**

```
        not ok 865 - an identical re-drop after a refused push skips the commit, lands the push and dispatches once
```

**Diagnosis:** New this round, and a regression from this branch's change. The test file itself is unchanged on this branch.

The test runs these steps:
1. It drops a review while origin refuses updates. The watcher commits `chore: add user review for feat_x` locally, the push fails, and the record goes `failed`.
2. It lifts the refusal and drops the identical review again.
3. It expects the commit to be skipped (`already committed (identical re-drop) — skipping the commit, pushing anyway`), the push to land, and a second `workflow run`.

Before this branch, the remote arm brought the copy level with `git -C "$worktree" merge --ff-only "origin/$branch"`. That command succeeds with nothing written ("Already up to date") when the local branch already contains `origin/<branch>`. This branch replaced it with the plumbing `hr_run_fast_forward_var "refs/remotes/origin/$branch"`. That function only accepts a target that is equal to the current tip or a descendant of it. On the re-drop, the local tip is the unpushed review commit and `origin/feat_x` is its parent, so `merge-base --is-ancestor "$tip" "$new"` fails. The function then returns 1 with `'feat_x' is not an ancestor of 'refs/remotes/origin/feat_x', so it cannot be fast-forwarded`. The watcher reports `fail_before_launch` (`the fast-forward of the working copy to origin/feat_x failed`) before it reaches `remote_commit_and_push`. As a result, the identical-re-drop log line is never written, the push never runs, and no dispatch is sent.

`remote-run.sh review` (`cli/templates/scripts/remote-run.sh`, `hr_run_fast_forward_var "refs/remotes/origin/$branch"`) replaced the same `merge --ff-only` and has the same regression. A mirror holding an unpushed review round that `review` placed before a refused push can no longer be re-placed.

**Fix:** Restore `merge --ff-only`'s "already up to date" outcome inside the library, so both callers get it back:

- [ ] In `hr_run_fast_forward_var`, right after `[ "$new" != "$tip" ] || return 0` and before the `merge-base --is-ancestor "$tip" "$new"` refusal, add: when `$new` is an ancestor of `$tip` (`hr_run_main_git merge-base --is-ancestor "$new" "$tip" 2>/dev/null`), `return 0` with nothing written. In that case `HR_RUN_COPY_TIP` stays `$tip`, and no ref, index or tree is touched. This branch is a no-op, so it needs no clean-tree or surface check. The caller's `hr_run_surface_check_var "refs/heads/$branch" copy` still runs on the branch as it stands. Keep the existing refusal for true divergence, where neither commit is an ancestor of the other.
- [ ] Amend the function's header contract to match. The `0` line becomes something like `moved, or already there or already ahead of <ref> with nothing written; HR_RUN_COPY_TIP is the branch's commit`, so the header still states what the code guarantees (`.claude/context/cli.md` → *A reviewer holds a change to its module's own header*).
- [ ] Leave the callers in `cli/templates/scripts/autonomous-watcher.sh` and `cli/templates/scripts/remote-run.sh` unchanged. They already treat exit 0 as "level with origin, go on".
- [ ] Optional: add a library case in the suite that already covers the commit primitive and placement (the branch's `outer-loop-scripts.test.mjs` library cases) for a copy one commit ahead of `<ref>`. It asserts exit 0, an unchanged `refs/heads/<branch>`, and an unchanged `HR_RUN_COPY_TIP`. If you add it, you may run only that edited test file.
