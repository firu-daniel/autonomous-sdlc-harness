### 3. `run-gates.sh`'s header still says "the other five automatable gates" after gate 13 made it seven

**File:** `scripts/run-gates.sh` (the header comment) — "reading the other five automatable"

This branch rewrote the opening of the header to say the script runs **seven** gates unattended: "gates 1, 2, 3, 4, 6, 11 and 13". Three lines later the same comment still carries the count from before gate 13: "`npm test` is gate 4 alone, and a branch review that reads it as "verified" is reading the other five automatable gates' worth of silence as a pass." With seven automatable gates, gate 4 leaves six others. `docs/development.md` → `## 5. Verifying a change` ("**Seven of the thirteen run unattended**") agrees with seven. So the comment now contradicts both its own first sentence and the document it defers to.

**Fix:** in `scripts/run-gates.sh`'s header comment, change `reading the other five automatable` to `reading the other six automatable`. Leave the rest of the sentence and the line wrapping as they are.
