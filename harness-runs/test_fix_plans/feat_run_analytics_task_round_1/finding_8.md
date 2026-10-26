### 8. watcher-review-drop-payloads: (L3) core.fsmonitor in the clone's submodule config, the drop launches

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the subshell call `record_run_analytics "$branch" "$worktree" "$log_path"` before `classify_run_exit`. The mirror is `scripts/autonomous-watcher.sh`. The script it runs is `cli/templates/scripts/run-analytics.sh` (`top=$(hr_repo_root "$repo_arg")`).

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs`, `(L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches`

**Failure (from the log):**

```
not ok 1121 - (L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test adds a submodule to the clone, plants a `core.fsmonitor` payload in the submodule's own git directory, sets `submodule.recurse true` on the main checkout, drops a review and asserts `assertLaunched`. As in Finding 7, a git call in the new hook that recursed into submodules could reach the payload. With a session-less stub, though, the hook does nothing beyond the `run-analytics.sh` resolution calls. The test is the third of the three adjacent clone-launch failures at the top of its file (Finding 6's pattern).

**Suspected shared cause:** likely the same cause as Finding 6. Same file, same launch path, adjacent position.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails because the payload ran, harden the git call that reached it, in the same way and in the same files as Finding 7's fix, keeping the `scripts/` mirror byte-identical. For any other assertion, fix the code it names.
- [ ] Do not weaken the test.

## Already passing

- **(a) Named test and file run:** `(L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches`, in `cli/test/watcher-review-drop-payloads.test.mjs`.
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-review-drop-payloads.test.mjs`, from the repository root, foreground. Output: `ok 3 - (L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches`; file summary `# tests 23`, `# pass 23`, `# fail 0`.
- **(c) No code file was edited:** this file is the only write.
