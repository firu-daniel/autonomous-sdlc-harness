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

- **Deviations from plan:**
  - The copy over `scripts/run-test-suite.sh` and the `cmp` check were not carried out. That file is outside this dispatch's `cli` path scope, so the `cli` implementer did not edit it. It still holds the two overlong lines, and until a dispatch whose scope includes `scripts/` copies the template over it, it is not byte-identical to `cli/templates/scripts/run-test-suite.sh`.
  - Evidence downgrade: every Bash call was refused in this session ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). As a result `commands.typecheck` did not run, and neither did the line-length or `cmp` checks. Whether the re-wrap stays within 80 columns and keeps the original wording rests only on reading `cli/templates/scripts/run-test-suite.sh` after the edit. The edited file is a shell template outside `cli/tsconfig.json`'s `src/**/*.ts`, and the Run gates phase's whole-tree typecheck run verifies the tree.
  - `general` dispatch, which closes the first sub-bullet: the same two re-wraps were applied to `scripts/run-test-suite.sh` with the Edit tool rather than `cp`, because a compound `cp … && cmp …` command was refused in don't-ask mode. `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh` then printed nothing and exited 0, so the two files are byte-identical. `bash scripts/typecheck.sh` printed `PASS: typecheck`. `awk 'NR<=200 && /^#/ && length($0)>80'` over `scripts/run-test-suite.sh` lists no line in the two re-wrapped passages. It does list other header lines that are 81–85 characters wide (for example lines 50, 127 and 161). The finding did not name them, so they were not touched.
