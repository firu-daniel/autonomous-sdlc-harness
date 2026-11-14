### 2. Two header lines this branch edited in the run form overrun the header's wrap width

**File:** `cli/templates/scripts/run-test-suite.sh` (header) — "surface. Not reusing, the run form removes `.verdict`, `.commit` and `.start` before it" and "form's one marker line naming the worker's PID and the window. The poll bounds a process that"; and the byte-identical `scripts/run-test-suite.sh`.

The rest of the header is wrapped at 80 columns. Two lines this branch edited were not re-wrapped:

- The `ONE RUN PER LABEL.` paragraph's line `# surface. Not reusing, the run form removes \`.verdict\`, \`.commit\` and \`.start\` before it` is 88 characters.
- The `HOW THE RUN FORM WAS STARTED DOES NOT MATTER.` paragraph's line `# form's one marker line naming the worker's PID and the window. The poll bounds a process that` is 96 characters.

This is a style issue only, and no reader reaches a wrong answer because of it.

**Fix:** in `cli/templates/scripts/run-test-suite.sh`, re-wrap the two passages at 80 columns without changing a word:

```
# surface. Not reusing, the run form removes `.verdict`, `.commit` and `.start`
# before it starts a run, so a stale `.commit` never outlives its verdict. A run
```

(the line that follows, which today begins `# starts a run, so a stale`, is absorbed into these two lines), and

```
# the worker wrote to stderr before it died or stalled, followed by the run
# form's one marker line naming the worker's PID and the window. The poll
# bounds a process that has not begun, never a gate. The worker refreshes
# `.running` while it waits on its own gate, so the heartbeat stops when the
# worker stops.
```

(this replaces the lines from `# the worker wrote to stderr` through `# its own gate, so the heartbeat stops when the worker stops.`). Re-wrap any line after them that now ends short, up to the paragraph's end. Then copy the template over `scripts/run-test-suite.sh` and check with `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`. This fix edits no test file, so it runs no test.
