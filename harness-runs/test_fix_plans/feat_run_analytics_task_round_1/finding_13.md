### 13. watcher-stall-reset-payloads: an honest hung run resumes, the branch unmoved

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, its first guard `if [ "$(registry_get "$branch" stall_killing)" = "1" ]; then return 0`, and its call inside `spawn_engine()`'s subshell. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-stall-reset-payloads.test.mjs`, `an honest hung run resumes: the edit discarded, the branch unmoved, the note written`

**Failure (from the log):**

```
not ok 1160 - an honest hung run resumes: the edit discarded, the branch unmoved, the note written
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test drives a local stall on a clone (`localStall`, which runs its own tick script) and makes an uncommitted edit. It then asserts four things:

- the run resumed;
- the edit was discarded by the reset;
- the branch tip is unmoved;
- `PAUSE_PROGRESS.md` says `discarded by a reset to the last commit`.

On a stall-killed session the hook returns at once on `stall_killing`, so it neither commits nor moves the tip. A resumed session runs the hook after its stub exits. The stub prints no session, so nothing is committed then either. This is the first test in its file, and the file's later resume tests (S3, the S4 legacy case, J3) are not in the log's failing list. That matches Finding 6's early-in-file pattern.

**Suspected shared cause:** likely the same cause as Finding 6. It is a clone session, and it failed early in its file while later ones passed.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails on `${f.ref} moved`, there are two likely causes: the hook committed after a stall-killed or resumed session, or the stall teardown's ordering lets `stall_killing` clear before the hook reads it. Make the hook skip, and commit nothing, whenever the watchdog owns the teardown. Edit `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh` and make the identical edit in `scripts/autonomous-watcher.sh`. For any other assertion, fix the code it names.
- [ ] Do not weaken the test.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`fix_headless_run_host_sleep`). Findings 2–8 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `d17b3335`.
