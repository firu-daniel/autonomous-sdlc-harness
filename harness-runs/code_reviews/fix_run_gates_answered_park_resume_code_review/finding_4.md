### 4. The **Answer mode.** paragraph runs straight into the `## Read on demand` heading with no blank line

**File:** `plugin/agents/test-fix-plan-writer.md` (`## Invocation contract`, the **Answer mode.** paragraph) — "revise it in place, never as a fresh write."

The branch deleted the old **How the caller consumes your return.** paragraph and the blank line after it, and added the **Answer mode.** paragraph in their place. The new paragraph's last line now sits directly above `## Read on demand (no auto-loaded context)`, with no blank line between them. CommonMark still renders the heading, because an ATX heading may interrupt a paragraph. Every other heading in the file has a blank line above it, though, and the missing one makes the boundary easy to miss when someone edits the file later.

**Fix:** insert one empty line between the line ending `revise it in place, never as a fresh write.` and the line `## Read on demand (no auto-loaded context)`. Change nothing else.
