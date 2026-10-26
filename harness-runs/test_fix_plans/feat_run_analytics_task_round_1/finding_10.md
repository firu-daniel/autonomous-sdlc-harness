### 10. watcher-run-profile: another live linked worktree's .git pointer is in the clone run's per-run copy

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the launch line `--settings "$settings_file"` and the post-session `record_run_analytics "$branch" "$worktree" "$log_path"`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-run-profile.test.mjs`, `another live linked worktree's .git pointer is in the clone run's per-run copy`

**Failure (from the log):**

```
not ok 1145 - another live linked worktree's .git pointer is in the clone run's per-run copy
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test adds a linked worktree `feat_other` next to the main checkout, drops a task prompt and asserts two things: the stub was called, and the per-run profile is the base plus the clone's entries, including that other worktree's `.git` pointer. The branch did not change the profile renderer or the worktree listing. Its only change on this path is the post-session hook, which runs after the profile is rendered and the stub launched. A launch that never happened would fail `the stub was never called`. That message would point at an inbox-pass problem, not at the hook. This test runs right after Finding 9's test in the same file.

**Suspected shared cause:** likely the same cause as Finding 9. Same file, same profile assertion, adjacent position.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, fix the code the failing assertion names, as in Finding 9's fix. Never edit the test's expected entries to fit a wrong profile.
- [ ] Do not weaken the test.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`fix_headless_run_host_sleep`). Findings 2–8 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `d17b3335`.
