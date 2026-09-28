### 2. `npm test` fails 2 of 1007 tests, unnamed in the gate log (gate 4)

**File:** `scripts/run-gates.sh` (`gate`) — "sed 's/^/        /' \"$log\" | tail -25" (inside `gate()`, near line 50 as a navigation hint).

**Failing test:** not named in the log. The log reports only the `cli/` suite's closing counts (`node --test`, `# fail 2`), so this finding names no test file, and this round's fix edits and runs no test file.

**Failure, quoted from the log** (repository-root paths rewritten repo-relative):

```
FAIL  4 npm test (exit 1)
      ok 307 - the poller carries no template token, and every expression is spaced and outside run blocks
      1..307
      # tests 1007
      # suites 3
      # pass 1005
      # fail 2
      # cancelled 0
      # skipped 0
      # todo 0
      # duration_ms 1052497.043875
      npm error Lifecycle script `test` failed with error:
      npm error code 1
      npm error path cli
      npm error workspace autonomous-sdlc-harness@0.4.0
      npm error location cli
      npm error command failed
      npm error command sh -c node --test
```

**Class:** new this round (no earlier round's log exists).

**Diagnosis.**

1. **Why the log names no failing test.** `scripts/run-gates.sh` → `gate()` prints only the last 25 lines of a failing command's output (`| tail -25`). `node --test` emits TAP. In TAP a failure is reported inline, as a `not ok <n> - <name>` line written when the test finishes, and the closing summary carries only counts. The suite runs for about 17 minutes across 307 top-level tests, so the `not ok` lines scroll out of the tail on every run. As things stand, gate 4's log can never say which test failed, and every round's fix plan starts without that information. Node counts a failing subtest and its failing parent separately, so `# fail 2` is most likely one leaf subtest plus its parent, or two leaf top-level tests.
2. **Why this round does not fix the two failures themselves.** The failing cases cannot be identified from the log, and a static read of the suite against the source this branch changed turned up no mismatch. The branch's code-review fixes changed `doctor`'s `plugin-permissions` and `profile-tracked` report wording. Cases that pin exact report wording are therefore the likeliest suspects, but none of them could be confirmed. Any change made to the source or tests now would be a guess. So this round's fix is limited to the gate-log change. Once it is in place, Phase G's next run of gate 4 will print the `not ok` lines, and the next round's test fix plan will name the two failing tests and fix them from that log.

**Fix.**

This round's fix is the gate-log change below and nothing else. It touches no source file and no test file.

- [x] **Make the gate log name failing tests.** In `scripts/run-gates.sh` → `gate()`, in the failure branch, print every TAP failure line from `"$log"` before the existing tail. These are the lines matching `not ok ` (leading whitespace allowed). Indent them by the same eight spaces, and follow them with the unchanged `sed 's/^/        /' "$log" | tail -25`. Keep grading by exit status exactly as now.
  - Do not pipe the gated command itself. The new `grep` reads the file that has already been written, just as the existing `sed | tail` does, so the script's no-pipe rule still holds.
  - A `grep` that matches nothing exits non-zero. Make sure that exit neither changes the gate's result nor aborts the script under its shell options, for example by ending the pipeline with `|| true`.
  - Leave `gate_silent()` and the other `tail -25` sites unchanged.
  - On the new line, add a comment saying why it is there: a TAP runner reports failures inline rather than in its closing summary, so a tail alone never names them.
- [x] Under a `**Resolved:**` line in this file, record the `scripts/run-gates.sh` change, and note that the two `npm test` failures carry over to the next round, where they will be named from that round's log.

**Resolved:**

- `scripts/run-gates.sh` → `gate()`, failure branch: added `grep -E '^[[:space:]]*not ok ' "$log" | sed 's/^/        /' || true` ahead of the unchanged `sed 's/^/        /' "$log" | tail -25`, with a comment stating why. It reads the already-written log, so no gated command is piped. `|| true` keeps a no-match exit from changing the result (the script sets no `-e`; the gate is still graded by the gated command's exit status). `gate_silent()` and the gate-11 `tail -25` sites are unchanged.
- Verified by a scratch probe (`harness-runs/scratch/gate_tap_probe.py`, run via `bash scripts/scratch-run.sh`) that extracts `gate()` from the edited script and runs it three times: a failing command whose `not ok` lines sit outside the last 25 lines (both nested and top-level `not ok` lines printed, then the tail), a failing command with no TAP lines (only the tail printed, graded FAIL), and a passing command (graded ok). `bash -n` on the script exited 0.
- The two `npm test` failures carry over to the next round, which will name them from that round's gate-4 log.
