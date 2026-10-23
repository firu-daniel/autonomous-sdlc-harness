### 3. The compressed per-finding-file rule in `test-fix-plan-writer` reads "implementable from alone"

**File:** `plugin/agents/test-fix-plan-writer.md` (`## Process` step 6, the **Per-finding files** paragraph) — "one per `### K. <title>`, implementable from alone:"

The compression pass on this definition shortened *"self-contained … A consumer implements the fix from this one file alone"* to *"implementable from alone"*. The phrase has lost its object ("from" what?). It no longer states the rule it replaced: every per-finding file must stand on its own, because the G.4 implementer opens only that file. A test-fix-plan writer reading the garbled phrase can still guess the intent, so no decision turns on it. But this is a durable agent definition, and a rule that no longer reads as a rule is unclear wording in it.

**Fix:** in that sentence, replace `implementable from alone:` with `self-contained:`. That gives:

```
**Per-finding files** at `<per-finding folder>finding_<K>.md`, one per `### K. <title>`, self-contained: the `### K. <title>` heading; …
```

This removes two words, so the definition's up-front word count does not rise. Change nothing else.
