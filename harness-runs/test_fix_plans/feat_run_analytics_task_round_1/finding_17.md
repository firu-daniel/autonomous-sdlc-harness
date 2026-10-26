### 17. watcher-remote-dispatch: a push origin refuses blocks the dispatch

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `remote_commit_and_push()`, the branch `if ! hr_push_landed "$PUSH_BRANCH" "$worktree" "$branch" …` → `fail_before_launch … "(push-branch.sh did not push the $what to origin/$branch — nothing dispatched; …)"`. The mirror is `scripts/autonomous-watcher.sh`. The branch did not change it.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs`, `a push origin refuses blocks the dispatch`

**Failure (from the log):**

```
not ok 1079 - a push origin refuses blocks the dispatch
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test installs a `pre-receive` hook on the bare `origin` that refuses every branch update. It drops a task prompt, runs one pass with `PUSH_RETRY_DELAY_SECS=0`, and asserts five things:

- the prompt commit landed in the clone;
- no `workflow run` call was made;
- the record is `failed`;
- exactly one `failed` notice matches `push-branch.sh`;
- no prompt was sent.

The path is unchanged on this branch and never reaches `record_run_analytics`. This is the last of this file's four consecutive failures at the top (Finding 14).

**Suspected shared cause:** likely the same cause as Finding 14. Same file, same remote arm, adjacent position.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, fix the code the failing assertion names, in `remote_commit_and_push()` or in the push wrapper it drives, and keep the `scripts/` mirror byte-identical.
- [ ] Do not weaken the test, and do not remove the origin hook it installs.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`fix_headless_run_host_sleep`). Findings 2–8 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `d17b3335`.
