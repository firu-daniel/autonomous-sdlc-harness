### 15. watcher-remote-dispatch: the usage hold and the cap do not gate a remote drop

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `launch_remote_run()`, and the inbox pass's kill-switch and usage-hold checks ahead of it. The mirror is `scripts/autonomous-watcher.sh`. The branch did not change either.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs`, `the usage hold and the cap do not gate a remote drop; the kill switch still defers it`

**Failure (from the log):**

```
not ok 1077 - the usage hold and the cap do not gate a remote drop; the kill switch still defers it
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test runs two passes:

1. With `AUTONOMOUS_STOP` present, it asserts the drop stays in the inbox, no `gh` call was made, and no clone exists.
2. With the stop removed, `.usage_hold` written and `MAX_PARALLEL_RUNS=0`, it asserts the drop left the inbox, exactly one task `workflow run` call was made, and the record is `running`.

Neither pass reaches `spawn_engine` or `record_run_analytics`. This is the second of the four consecutive failures at the top of this file. Finding 14's diagnosis covers why that pattern points away from a code defect.

**Suspected shared cause:** likely the same cause as Finding 14. Same file, same remote arm, adjacent position.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, fix the code the failing assertion names: the kill-switch deferral or the remote arm's exemption from the hold and the cap. Make the identical edit in `cli/templates/scripts/autonomous-watcher.sh` and `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken the test.
