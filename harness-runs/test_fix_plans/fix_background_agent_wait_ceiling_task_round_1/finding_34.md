### 34. run analytics: the parent test

**Site:** `cli/test/watcher-run-analytics.test.mjs` → `test('the session\'s analytics are committed and pushed on the run\'s branch, and a failing step changes no outcome', …)` (near line 159), the parent of the five subtests in Findings 29–33; its own body is the fixture setup `adoptedFixture(t)`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs` — `the session's analytics are committed and pushed on the run's branch, and a failing step changes no outcome`

**Failure (log):**

```
        not ok 1320 - the session's analytics are committed and pushed on the run's branch, and a failing step changes no outcome
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

A `node:test` parent is reported `not ok` when any of its subtests fails; all five of its subtests are failing (Findings 29–33), so this line follows from them. Its own body only builds the fixture through `adoptedFixture(t)`; a failure there would have prevented any subtest from running at all, while the log shows all five reported. The branch changes nothing in this file.

**Suspected shared cause:** likely the same cause as Finding 29 — a parent that fails through its subtests, the first of which is Finding 29's.

**Fix**

- [ ] Take this test's own failure and place it in one of the arms below.
- [ ] **The parent fails only through its subtests**: nothing here beyond Findings 29–33; no separate code change.
- [ ] **A failure in the parent's own setup** (`adoptedFixture`), caused by a value the branch changed in the watcher's `init`-written scripts: fix `cli/templates/scripts/autonomous-watcher.sh` and/or `cli/templates/scripts/lib/harness-run-lib.sh` so the setup succeeds again, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged — no bound raised, no assertion loosened, no case skipped.
