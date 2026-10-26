### 7. watcher-review-drop-payloads: (L2) nested repository core.fsmonitor behind a gitlink, the drop launches

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the subshell call `record_run_analytics "$branch" "$worktree" "$log_path"` before `classify_run_exit`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs`, `(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches`

**Failure (from the log):**

```
not ok 1120 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test commits a gitlink to a nested repository into the clone, plants a `core.fsmonitor` payload in that nested repository, drops a review and asserts `assertLaunched`. The branch's new post-session hook does run git in the clone: `run-analytics.sh` calls `hr_repo_root` and `hr_state_path`, and `hr_commit_placed` would run if files were written. If one of those git calls recursed into the gitlink, it could run the planted fsmonitor. But this fixture's stub prints no session, so `run-analytics.sh` exits at `no session in …` before anything is committed. The test is the second of the three clone-launch tests at the top of its file, all of which failed while the file's later tests passed. Finding 6 lays out that pattern.

**Suspected shared cause:** likely the same cause as Finding 6. Same file, same launch path, adjacent position.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails because the payload ran, the most likely cause is a git call the hook or `run-analytics.sh` makes in the clone without the harness's hardening. Route that call through the library's hardened git invocation, the same one `hr_commit_placed` uses, in `cli/templates/scripts/run-analytics.sh` or `cli/templates/scripts/autonomous-watcher.sh`, and make the identical edit in the `scripts/` mirror. For any other assertion, fix the code it names.
- [ ] Do not weaken the test.

## Already passing

- **(a)** Named test: `(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches`, in `cli/test/watcher-review-drop-payloads.test.mjs` (the only file run).
- **(b)** Ran `npm test --workspace cli -- test/watcher-review-drop-payloads.test.mjs` from the repository root: `ok 2 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches`; file totals `# tests 23`, `# pass 23`, `# fail 0`.
- **(c)** No code file was edited.
