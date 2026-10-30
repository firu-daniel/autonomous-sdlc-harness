### 5. The registry field list's `log_path` row lost one space of its alignment

**File:** `cli/templates/scripts/autonomous-watcher.sh`, the registry field list: "#   log_path           the central log this run appends to"

Task 3 edited the `status` row's continuation lines above this row and rewrote the `log_path` row with 11 spaces between the field name and its description instead of 12. As a result, `the central log this run appends to` starts one column left of every other description in the list. The change is accidental and has no effect on behaviour.

**Fix:** restore the original line, `#   log_path            the central log this run appends to`, which has 12 spaces after `log_path`. Then copy the file byte for byte over `scripts/autonomous-watcher.sh` and confirm with `cmp` that the two files are identical. No test asserts this comment, so this fix runs none.

- **Deviations from plan:** Restored the `log_path` row in `cli/templates/scripts/autonomous-watcher.sh` only. The copy over `scripts/autonomous-watcher.sh` and its `cmp` were not done: that path is outside this dispatch's `cli` layer path scope and belongs to a catch-all (`.`) dispatch. `cmp` after the template edit reports the two files differ at line 1708, the `log_path` row, so the root copy is still owed.
- **Deviations from plan:** Catch-all (`.`) dispatch completed the root copy by restoring the same line in `scripts/autonomous-watcher.sh` with an in-place edit instead of a byte-for-byte copy. `diff` showed that line was the only difference, so the result is the same bytes, and the root copy keeps its executable mode. `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` now exits 0.
