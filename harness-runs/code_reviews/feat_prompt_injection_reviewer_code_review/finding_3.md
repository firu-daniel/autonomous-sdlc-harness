### 3. The self-adopted `scripts/prompt-injection-screen.sh` no longer matches its template

**File:** `scripts/prompt-injection-screen.sh` — the header block that should open "#   READERS OF THESE STRINGS — a rename here is an edit there, byte for byte:"

**The problem.** Task 16 brought this repository's self-adopted outer-loop copies to the template bytes, and the architecture review then recorded them as "byte-identical to their templates". After that, commit `e4efd096` (*"fix: Finding 5 — Declare plugin readers of park wire strings in header"*) added an 11-line `READERS OF THESE STRINGS` paragraph to `cli/templates/scripts/prompt-injection-screen.sh` and left the self-adopted copy alone. `git diff --no-index cli/templates/scripts/prompt-injection-screen.sh scripts/prompt-injection-screen.sh` now shows exactly those 11 lines missing from `scripts/`.

The copy's executable lines are unchanged, so no run behaves differently. Two things go wrong all the same. A reader of `scripts/` does not see which plugin files key on `PIS_RAISED` and the re-ask heading, which is the purpose of that header. And the next forced self-adopt `init` reports the file as changed for a reason nothing on this branch records.

**Fix.** Copy `cli/templates/scripts/prompt-injection-screen.sh` over `scripts/prompt-injection-screen.sh` byte for byte. `git diff --no-index cli/templates/scripts/prompt-injection-screen.sh scripts/prompt-injection-screen.sh` must then print nothing. Findings 1 and 2 each end with the same copy, so whichever of them lands after this one keeps the two files equal.
