### 3. `ARCHITECTURE.md` still points at README's *Forge-agnostic* bullet, which this branch renamed

**Severity:** Must Fix

**Site:** `ARCHITECTURE.md` → `## 8.`, the paragraph opening "**`forge` — the same pattern, declared missing one part and since completed.**", the sentence "[`README.md`](README.md) `### The shape of the system` states the same for an adopter in its *Forge-agnostic* bullet."

**Problem.** Task 30 renamed the README bullet that this sentence points at. It was "**Forge-agnostic, which means the last step is yours.**" and is now "**GitHub-coupled on request, and merging is always yours.**" (`README.md` → `### The shape of the system`). No file in the tree carries the string `Forge-agnostic` any more, so the pointer's quoted target does not resolve.

The README bullet's content changed too. It no longer says the key costs nothing until something reads it. It now says what the key turns on, so "states the same" is no longer accurate either.

**Fix.**
- [ ] In that sentence, replace `states the same for an adopter in its *Forge-agnostic* bullet.` with `states what the key turns on for an adopter in its *GitHub-coupled on request, and merging is always yours* bullet.` Leave the rest of the paragraph unchanged.
- [ ] Confirm the pointer now resolves: `git grep -n 'GitHub-coupled on request, and merging is always yours' -- README.md` prints one line. No test covers this file.
