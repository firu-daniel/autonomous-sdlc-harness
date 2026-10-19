### 7. `docs/cli.md` says the wrappers' stdout lines are unchanged, but `push-branch.sh` gains a stdout line on the clone arm

**File:** `docs/cli.md` §6, the paragraph beginning "**The excluded rule's `:*` accepts any argument, so all three wrappers check their target before any git call**", the sentence "The exit contracts and stdout lines are unchanged, except that `refresh-branch.sh`'s exit `5` also covers a failed sync-out after the working tree took the merge, and `commit-on-branch.sh` reports a failed sync-out as exit `1` with the commit standing."

**Problem.** `push-branch.sh` writes its result lines on stdout. On the clone arm, after `push-branch.sh: pushed <branch> to origin`, a failed mirror of `refs/remotes/origin/<branch>` prints a second stdout line, `push-branch.sh: pushed <branch> to origin, but the clone's origin/<branch> could not follow: …`, and still exits `0` (`cli/templates/scripts/push-branch.sh`, the `hr_copy_sync_out_var "$main_top" "$HR_TARGET_GITDIR" "refs/remotes/$remote/$branch"` call). The script's own header documents this line. The `docs/cli.md` sentence lists the exceptions to "stdout lines are unchanged" and omits it. A reader matching on `push-branch.sh`'s stdout would take the success line to be the last line printed on success, which no longer holds on the clone arm.

**Fix.** Replace the sentence with:

```text
The exit contracts and stdout lines are unchanged, except that `refresh-branch.sh`'s exit `5` also covers a failed sync-out after the working tree took the merge, `commit-on-branch.sh` reports a failed sync-out as exit `1` with the commit standing, and `push-branch.sh` prints one more stdout line after its `pushed <branch> to origin` line when the clone's `origin/<branch>` cannot follow, still exiting `0`.
```

Document edit only; no test runs.
