### 2. watcher-run-analytics: a resume that adds no session adds no analytics commit (persisting)

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, called in `spawn_engine()`'s subshell before `classify_run_exit`, on the resume that `resume_parked_runs` launches. `cli/templates/scripts/run-analytics.sh` → the `unchanged: no new session for` branch near its end. Both have byte-identical mirrors under `scripts/`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a resume that adds no session adds no analytics commit`

**Failure (from the log):**

```
not ok 2 - a resume that adds no session adds no analytics commit
```

The log has no assertion message for it.

**Diagnosis (persisting: failed in round 1 under parent `not ok 1142`):** The four subtests share one fixture and run in order. This subtest sets the stub to `:` and parks the clone with one answered pair. It then asserts that the parked run resumed (`prompts().length === 2`), that the clone's analytics commits are unchanged, and that the status is not `failed`. It also sets `resumeBaseline`, which subtests 3 and 4 depend on.

If subtest 1's pass left the fixture in an unexpected state, this subtest fails without a defect of its own. For example: the record is not `completed`, or the analytics commits are partial because a commit was refused under load. A partial commit is the likely case. The tree on disk then differs from the committed tip. On the resume, `run-analytics.sh` reports `unchanged`, but `record_run_analytics` still calls `watcher_commit` for each file that exists. That commits the previously uncommitted blob, and the analytics commits are no longer equal to `before`.

**Suspected shared cause:** likely the same cause as Finding 1 — same shared fixture, and it runs immediately after Finding 1's subtest.

**Fix:**

- [ ] Address Finding 1 first. Then run the named test's file on its own and read this subtest's assertion message.
- [ ] If this subtest still fails, fix the cause its message names. A likely one: the resume's hook commits something on a session that adds nothing. In that case, make `record_run_analytics()` commit only what this session's `run-analytics.sh` run changed. Edit `cli/templates/scripts/autonomous-watcher.sh` and make the identical edit in `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken, skip or delete any assertion in the test.
