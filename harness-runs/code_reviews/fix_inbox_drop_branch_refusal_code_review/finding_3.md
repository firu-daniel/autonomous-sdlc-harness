### 3. "A property of the name, which no waiting changes" is false for the unresolvable-configuration refusal

**Files:**
- `cli/templates/scripts/autonomous-watcher.sh` — the comment block above `process_inbox_file`, "because it is a property of the name, which no waiting changes"
- `docs/watcher.md` → `## 1. The loop in one page`, step 2 — "it is a property of the name, which no amount of waiting changes"

Both passages justify putting the intake refusal ahead of the kill switch and the other step-3 guards (which *defer*) by saying the refusal is a property of the name. That holds for two of the three reasons — a protected name and a name `git check-ref-format --branch` refuses — but not for the third: "the protected set cannot be resolved" is a property of `harness.config.json` at that pass, refuses every branch, and changes the moment the configuration is repaired (the watcher re-reads it each tick through `hr_config_reset`). A maintainer reading either passage to decide whether an unresolvable configuration should archive or defer a drop is told the wrong reason. The behaviour itself — archive, as the task prompt's goal 1 requires — is not in question; only the stated reason is.

**Fix:** state the reason for all three.

In the watcher comment, replace

```
# record. It sits ahead of the shared guards and of the `execution.target` read
# because it is a property of the name, which no waiting changes; that is why a
# GitHub-bound drop on such a branch never reaches remote-run.sh.
```

with

```
# record. It sits ahead of the shared guards and of the `execution.target` read
# because waiting does not change it: the name has to change, or, for an
# unresolvable protected set, the configuration has to be repaired before the
# file is dropped again. That is why a GitHub-bound drop on such a branch never
# reaches remote-run.sh.
```

In `docs/watcher.md` step 2, replace the closing clause "it is a property of the name, which no amount of waiting changes." with "waiting does not change the answer: the name has to change or, for an unresolvable protected set, `harness.config.json` has to be repaired before the file is dropped again."

No test reads either passage; no test run is owed.

**Deviations from plan:** The `docs/watcher.md` step-2 replacement lies outside the dispatched `cli` layer path and was not made by the `cli` dispatch; it belongs to the `general` (catch-all) layer. Only the `cli/templates/scripts/autonomous-watcher.sh` comment was replaced.
- The `general` dispatch then made the `docs/watcher.md` step-2 replacement verbatim as the Fix specifies; both halves of the finding are now applied.
