### 11. watcher-sandbox-refusal: (b) a taken sandbox.optOut exempts the drop

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the subshell call `record_run_analytics "$branch" "$worktree" "$log_path"` before `classify_run_exit`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-sandbox-refusal.test.mjs`, `(b) a taken sandbox.optOut exempts the drop: the stub is launched`

**Failure (from the log):**

```
not ok 1156 - (b) a taken sandbox.optOut exempts the drop: the stub is launched
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test sets `sandbox.optOut.reason` to `r` and re-runs `init --force --no-analyze`, so the base profile matches the taken opt-out. It then commits the adopted tree, pushes it to `origin`, drops a task prompt, runs one pass with the "missing piece" probe, and asserts two things: one prompt was sent, and no `not launching` line was logged. The re-run of `init --force` now also writes `scripts/run-analytics.sh` and its `lib/` programs. That change cannot refuse a launch: the preflight decides before any working copy is made, and the hook runs only after the session.

In this file, the two failures are exactly the two cases that launch a local clone, (b) and (d). Cases (a) and (c) refuse before any copy is cut, and (e) cuts a clone but dispatches remotely. All three passed. Elsewhere in this run, local clone launches passed too (Finding 6's examples).

**Suspected shared cause:** likely the same cause as Finding 6. It is a local clone launch, and other local clone launches in the same run passed.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, the assertion message shows whether the stub was never called (the inbox pass, before the hook) or a `not launching` line appeared (the preflight). Fix the code that message names. If the cause is the hook, make the identical edit in `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken the test.
