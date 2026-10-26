### 6. watcher-review-drop-payloads: a clean reused clone launches, with the review placed and left uncommitted

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the subshell sequence `rc=${PIPESTATUS[0]}` → `record_run_analytics "$branch" "$worktree" "$log_path"` → `classify_run_exit "$branch" "$worktree" "$log_path" "$rc"`. The mirror is `scripts/autonomous-watcher.sh`. On this path the hook is the only code this branch changed.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs`, `a clean reused clone launches, with the review placed and left uncommitted`

**Failure (from the log):**

```
not ok 1119 - a clean reused clone launches, with the review placed and left uncommitted
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test drops a user review onto a reused clone and runs one pass. It asserts three things:

- `assertLaunched` passes;
- the clone's branch tip is unmoved (`the local review drop committed`);
- the review is not in the clone's index (`the review was staged`).

On a local clone launch, the only code this branch added is `record_run_analytics`, which runs after the stub exits. The fixture's stub prints nothing to stdout, so the stream holds no session, and `run-analytics.sh` exits 0 with `no session in …` without writing or committing anything. Read that way, the hook cannot move the tip or stage the review.

In the same run, the same clone-launch path passed in `cli/test/watcher-remote-dispatch.test.mjs` → `with the key absent the same drop launches the agent and sends nothing to gh`, and in `cli/test/watcher-run-profile.test.mjs` → `a clone run's exit syncs its branch into the main checkout`. In this file, the three clone-launch tests at the top (this one, L2 and L3) failed, and none of the file's 20 later tests is in the log's failing list. That pattern points to a transient condition early in the suite's run, not to a deterministic defect in this test's path.

**Suspected shared cause:** likely the same cause as Finding 2. If the hook is defective in a clone launch, every clone launch reaches it after the session, and that would also fail this test.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, take the failing assertion from its message. If the cause is the post-session hook (the tip moved by a `chore: Record run analytics for feat_x` commit, or a stray staged path), fix `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh` so a session-less stream commits and stages nothing, and make the identical edit in `scripts/autonomous-watcher.sh`. If the cause is elsewhere, fix it at the code the assertion names.
- [ ] Do not weaken the test.
