### 5. The new gate 6c paragraph splits `docs/development.md` §5's discussion of the `$HOME` and `.claude` checks

**File:** `docs/development.md`, `## 5. Verifying a change` → **Gate 6 — self-containment.**, the paragraph opening "**A third command checks that every link in `llms.txt` resolves on `main`**"

Gate 6's prose discusses its first two commands in order. First comes the `find` command's two exclusions, ending with the paragraph opening "**The root `./.claude` is excluded on the same ground as the fixture's**". Then comes the `$HOME` conflict that self-adoption causes: "**The `$HOME` half is a different matter, and self-adoption breaches it.**", the two-option list, "Whichever is chosen, do not widen the grep to a pattern", and the closing "This gate is the mechanical half and the one that stays".

The new paragraph sits between the `./.claude` paragraph and "The `$HOME` half is a different matter". A reader following the `$HOME` and `.claude` argument meets the `llms.txt` link check in the middle of it. "The `$HOME` half" then comes straight after a paragraph that has nothing to do with `$HOME`.

**Fix.** Move the whole paragraph opening "**A third command checks that every link in `llms.txt` resolves on `main`**", unchanged, to just before the paragraph opening "This gate is the mechanical half and the one that stays". Keep one blank line on each side, and make no other change. If Finding 1 has already added a clause to this paragraph, move the paragraph with that clause in it.
