### 5. `hr_lane_mtime`'s doc comment says it exists for one lock-directory case, and this branch adds a second, different caller

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (the doc comment above `hr_lane_mtime`): "it exists for one case — a lock directory whose". The same bytes are in `scripts/lib/harness-run-lib.sh`, which is byte-identical to the template and must stay so.

**The problem.** `run-test-suite.sh` now reads the heartbeat through `hr_lane_mtime` (`heartbeat_age`). It depends on three properties of this function: it prints `0` for a missing path, it prints `0` for an unreadable mtime, and it picks the `stat` spelling on the value. `run-test-suite.sh`'s header and the test file's header both say so.

The function's own comment still says it "exists for one case — a lock directory whose `owner` file is missing or unreadable". Every caller inside the library fits that description. The heartbeat, a regular file read from another script, does not.

A maintainer who trusts the comment could change the function's contract for the lock-directory case, for example by returning non-zero for a missing path. That would not look like it could reach the Run gates wrapper. Yet `run_alive` turns any change to that `0` behaviour into a misjudged liveness or a refusal.

**Fix.** The comment currently ends with these three lines:

```bash
# `stat` in this file, and it exists for one case — a lock directory whose
# `owner` file is missing or unreadable, where the directory's own mtime is the
# only acquisition time there is.
```

Replace them with these lines. Keep the comment's first three lines, which end "…something that is not a timestamp. The only", so that "The only" runs straight on into the replacement:

```bash
# `stat` in this file. Two kinds of caller depend on the 0-for-missing-or-
# unreadable answer: a lock directory whose `owner` file is missing or
# unreadable, where the directory's own mtime is the only acquisition time
# there is; and `run-test-suite.sh`'s `heartbeat_age`, which reads a run's
# `<label>.running` heartbeat and treats 0 as "cannot be read", never as a time.
```

Make the same edit in both copies, then check `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh`. This is a comment-only change, so no test runs for it. `cli/test/outer-loop-scripts.test.mjs` compares the library as `init` copies it, and it runs in the Run gates phase.
