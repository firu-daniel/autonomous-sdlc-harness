### 16. watcher-remote-dispatch: a failed dispatch leaves the record failed with one failed notification

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `launch_remote_run()`, the failure arm after `rc=$?`: `registry_set "$branch" status failed` → `notify failed "$branch" "$log_path" "(remote-run.sh dispatch failed, exit $rc: …)"`. The mirror is `scripts/autonomous-watcher.sh`. The branch did not change it.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs`, `a failed dispatch leaves the record failed with one failed notification`

**Failure (from the log):**

```
not ok 1078 - a failed dispatch leaves the record failed with one failed notification
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test makes the `gh` stub exit 4 on `workflow run` and asserts five things:

- the record is `failed`;
- `remote_dispatched_at` is empty;
- exactly one `failed` notice matches `remote-run.sh dispatch failed`;
- there is no `launched` notice;
- no prompt was sent.

The arm the test exercises is unchanged on this branch, and it never reaches `record_run_analytics`. This is the third of this file's four consecutive failures at the top (Finding 14).

**Suspected shared cause:** likely the same cause as Finding 14. Same file, same remote arm, adjacent position.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, fix the code the failing assertion names in `launch_remote_run()`'s failure arm, and make the identical edit in both watcher copies.
- [ ] Do not weaken the test.
