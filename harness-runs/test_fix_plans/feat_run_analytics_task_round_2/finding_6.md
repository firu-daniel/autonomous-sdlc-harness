### 6. watcher-review-drop-payloads: (L2) nested repository core.fsmonitor behind a gitlink, the drop launches (persisting)

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, called in `spawn_engine()`'s subshell before `classify_run_exit`. It runs `"$RUN_ANALYTICS" … --repo "$worktree" --main-repo "$MAIN_REPO"`. `cli/templates/scripts/run-analytics.sh` resolves `hr_repo_root` / `hr_state_path` against the clone. Both have byte-identical mirrors under `scripts/`.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs`, `(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches`

**Failure (from the log):**

```
not ok 1123 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches
```

The log has no assertion message for it.

**Diagnosis (persisting: failed in round 1 as `not ok 1120`):** The test commits a gitlink to a nested repository into the clone and sets that nested repository's `core.fsmonitor` to a marker-writing payload. It then drops a review and runs `assertLaunched`, which asserts five things: no marker, one more prompt, status `completed`, engine `user_review`, and the review placed. Round 1 closed it on a one-file pass (23/23). In round 2's full run it failed again, while its neighbours on the same path passed: `a clean reused clone launches…` and `(L3)`, which both failed in round 1.

There are two ways this branch's code could matter:

- **`a planted payload ran`** (the marker check). That would mean a git call the hook makes, directly or through `run-analytics.sh`, recursed into the gitlink and ran the nested repository's fsmonitor. A one-file pass would not show this unless the call is timing-dependent. With a session-less stub, the hook only resolves paths, so this is the less likely arm. If it is the arm, it is a real security defect, not a flake.
- **`status` not `completed`**. That is the same overlap Finding 5 describes: the post-session hook delays `classify_run_exit` while the foreground pass is still running under load.

**Suspected shared cause:** likely the same cause as Finding 5 — the same post-session hook between session exit and classification, and the same `completed` assertion.

**Fix:**

**Maintainer ruling (Park 2, 2026-10-26).** This case does not test analytics, but it paid the hook's ~3.2 s on its launch pass under full-suite load. Finding 1's item 1 (analytics off by default in the shared watcher fixture) is this finding's fix. Do not lengthen this case's bounds.

- [ ] Covered by Findings 1 and 5's fixture change. Confirm this case's fixture does not opt in to the hook, run its file on its own once to show it still passes, and close this finding with that change; the round-3 gate run verifies it. The steps below apply only if the file fails on its own after that change.

- [ ] Address Findings 1 and 5 first. Then run the named test's file on its own and read the assertion message. **Do not close on a lone pass alone**: this test has failed in two full-suite runs.
- [ ] If the message is `a planted payload ran`, holding `L2-fsmonitor`: find the git call in `record_run_analytics()` or `run-analytics.sh` that ran unhardened in the clone. Route it through the library's pinned invocation (`hr_run_copy_git` / `hr_run_main_git`, which `hr_commit_paths_var` already uses), in `cli/templates/scripts/autonomous-watcher.sh` or `cli/templates/scripts/run-analytics.sh`, with the identical edit in the `scripts/` mirror.
- [ ] If the status is not `completed`, apply Finding 5's fix. If that fix is already in, find what else overwrites the record.
- [ ] Do not weaken, skip or delete any assertion in the test.

## Already passing

- **(a)** Named test: `(L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches`. File run: `cli/test/watcher-review-drop-payloads.test.mjs`, after Finding 1's commit `ea4a69a1`. That commit turned analytics off by default in `cli/test/helpers/watcher.mjs` → `createWatcherFixture` (`runAnalytics = false`, which installs an `exit 0` stub as `run-analytics.sh`). This file's `createReviewFixture` calls `createWatcherFixture(t)` with no options, and the file never mentions `runAnalytics`, so this case does not opt in to the hook. This is the maintainer ruling's closing route: Finding 1's fixture change is this finding's fix.
- **(b)** Command: `npm test --workspace cli -- test/watcher-review-drop-payloads.test.mjs`, from the repository root. Result for the named test: `ok 2 - (L2) a nested repository's own core.fsmonitor behind a gitlink is never run: the drop launches` (duration_ms 40675.308041). `assertLaunched` passed all five checks, so the `a planted payload ran` arm did not fire. Its two neighbours also passed: `ok 1 - a clean reused clone launches…` and `ok 3 - (L3) …`. The file's summary was `# tests 23`, `# pass 23`, `# fail 0`. The ruling says the round-3 gate run verifies it under full-suite load, and its bounds were not lengthened.
- **(c)** No code file was edited. `cli/templates/scripts/autonomous-watcher.sh`, `scripts/autonomous-watcher.sh`, `cli/templates/scripts/run-analytics.sh`, `scripts/run-analytics.sh` and the test file are unchanged.
