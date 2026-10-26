### 9. watcher-run-profile: a task drop launches on a per-run copy at hr_run_profile_file

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the launch line `--settings "$settings_file"` and the post-session `record_run_analytics "$branch" "$worktree" "$log_path"`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-run-profile.test.mjs`, `a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries`

**Failure (from the log):**

```
not ok 1143 - a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test drops a task prompt on an adopted fixture and runs one pass. It asserts five things:

- the stub was called;
- the stub's `--settings` argument is the per-run profile under `XDG_STATE_HOME/autonomous-sdlc-harness/run-profiles/`;
- the record is a clone at `<fixture>-feat_x`;
- the profile equals the base plus the clone's exact entries;
- every main-checkout wrapper rule has its run-copy twin.

This branch changed nothing in profile rendering. `cli/src/generators/outerLoopScripts.ts` adds `run-analytics.sh` and its two `lib/*.jq` files as `agentInvocable: false` rows, which gives the base profile no new deny or allow wrapper rule. In the same run, other clone-launch tests in this file are not in the log's failing list (`the opt-out profile init renders from sandbox.optOut launches` and `a clone run's exit syncs its branch into the main checkout`). This test is the first clone launch in its file.

**Suspected shared cause:** likely the same cause as Finding 6. It is an early clone-launch test in its file, and the later ones in the same file passed.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails on a profile entry (an extra or missing wrapper rule for `run-analytics.sh`), reconcile the base profile's wrapper rules with the `OUTER_LOOP_SCRIPTS` row in `cli/src/generators/outerLoopScripts.ts` and with the test's `cloneEntries` expectation. Fix whichever side the branch's change left inconsistent, and never the test's assertion to fit a wrong profile. For any other assertion, fix the code it names.
- [ ] Do not weaken the test.
