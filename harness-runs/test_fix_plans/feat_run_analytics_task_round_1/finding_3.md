### 3. watcher-run-analytics: a resume that adds no session adds no analytics commit

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, the loop `for file in run-analytics.json run-analytics.md; do` and its `3) ;;` arm, which treats an identical blob as "nothing to commit". The mirror is `scripts/autonomous-watcher.sh`. The script it runs is `cli/templates/scripts/run-analytics.sh`, whose `unchanged: no new session for` exit-0 path writes nothing. That script is mirrored at `scripts/run-analytics.sh`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a resume that adds no session adds no analytics commit`

**Failure (from the log):**

```
not ok 2 - a resume that adds no session adds no analytics commit
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The subtest shares its fixture with Finding 2's subtest and runs after it, in order. It parks the clone with one answered pair, switches the stub to `:` (prints nothing), resumes, and asserts:

- a second prompt was sent;
- the analytics commits are exactly the ones the launch made;
- the status is not `failed`.

It also captures `resumeBaseline`, which Findings 4 and 5 compare against. If the launch subtest failed, this one starts from a fixture with no analytics commits, or with the record in an unexpected status. Its own failure is then a consequence and not a separate defect. On its own terms, its pass condition rests on two behaviours:

- `run-analytics.sh` must write no bytes when it sees no new session.
- `hr_commit_placed` must return 3 (identical blob), which the hook treats as silent.

**Suspected shared cause:** likely the same cause as Finding 2. This subtest runs on the fixture state Finding 2's subtest leaves behind.

**Fix:**

- [ ] If the named subtest passes as the tree stands, edit no code.
- [ ] If it fails after Finding 2 is resolved, check whether the resume committed a byte-changed `run-analytics.json` or `run-analytics.md` even though no session was added. A likely cause is a non-deterministic field in the rollup or the Markdown, which breaks the script's "nothing written carries a wall-clock value" rule. Fix that in `cli/templates/scripts/run-analytics.sh` or in its `lib/` programs (`run-analytics.jq`, `run-analytics-report.jq`), and make the identical edit in the `scripts/` mirrors.
- [ ] Do not weaken the test.
