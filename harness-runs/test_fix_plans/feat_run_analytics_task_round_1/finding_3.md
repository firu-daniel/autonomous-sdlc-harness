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

## Already passing

- **(a) Named test and file run:** subtest `a resume that adds no session adds no analytics commit` under parent `the session's analytics are committed on the run's branch, and a failing step changes no outcome`, in `cli/test/watcher-run-analytics.test.mjs`, run as the whole file (no name pattern).
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-run-analytics.test.mjs` from the repository root (pretest build ran first). The named subtest reported `ok 2 - a resume that adds no session adds no analytics commit`. File summary: `# tests 5`, `# pass 5`, `# fail 0`. Its predecessor on the shared fixture, `ok 1 - a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout`, also passed. That is consistent with the suspected shared cause in Finding 2, which was closed already passing in commit `996c1f5a`.
- **(c) No code file edited:** this detail file is the only write. `git status --short` was empty before this record was appended.
