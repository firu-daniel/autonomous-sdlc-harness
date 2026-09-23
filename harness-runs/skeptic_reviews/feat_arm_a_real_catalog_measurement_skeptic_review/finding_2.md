### 2. `docs/retrieval.md` still says the threshold calibration holds on the real catalog, which the branch's own record now contradicts

**File:** `docs/retrieval.md` → `## Measured, and how` → the `**(iv) Search.**` paragraph ("The calibration recorded in `docs/retrieval-eval-results.md` → `## Threshold calibration` therefore holds on a real catalog at both ends.").
**Also:** `docs/retrieval.md`, the opening bold paragraph ("per-arm recall, MRR, latency and cost, the calibrated abstention threshold, the cold build and the index size on disk").

**Problem.** `docs/retrieval-eval-results.md` → `## Threshold calibration` → `### What the move cost` now records what `0.32` does on the real catalog's **observed** scores. On `gate10-catalog` it abstains on 6 of 44 positives and answers 6 of 15 `near` negatives, and *"On `gate10-catalog` no single value separates the two sides"*. The fixed method returned `cannot-separate`. That section's own `### The limit on this calibration` bullet treats gate 10's leg (iv) as *"Two queries confirm the value at both ends and observe no distribution."*

`docs/retrieval.md` → (iv) still concludes from those two queries that *"The calibration … therefore holds on a real catalog at both ends"*. This branch rewrote the sentence right after it (Task 23, "That leg confirmed the value then in force and was not a re-calibration; …") and left this one in place. The opening paragraph, which this branch also rewrote to add "that real catalog", lists *"the calibrated abstention threshold"* among what was measured on all three corpora.

The code review's Finding 3 corrected four other "calibrated" statements (`search.ts` twice, the `**Abstention.**` paragraph of this file, and `docs/cli.md` §11). It did not reach these two.

**Who reaches the wrong answer.** A maintainer weighing whether to reverse the *withdrawn* outcome, or whether `fused-rerank`'s abstention is worth keeping, reads `docs/retrieval.md`'s measured facts, which the file says it owns. They conclude that `0.32` separates positives from negatives on a real catalog. The record this branch wrote says it does not.

**Fix.** Two text replacements in `docs/retrieval.md`. Change nothing else.

- [ ] In the `**(iv) Search.**` paragraph, replace
  `The calibration recorded in \`docs/retrieval-eval-results.md\` → \`## Threshold calibration\` therefore holds on a real catalog at both ends. That leg confirmed the value then in force and was not a re-calibration; the value now in force, and the evidence it rests on, are \`docs/retrieval-eval-results.md\` → \`## Threshold calibration\`.`
  with
  `Those two queries confirmed the value then in force at both ends and observed no distribution; they were not a re-calibration. The real catalog's observed score distribution, on which no single value separates its positives from its negatives, and the value now in force are \`docs/retrieval-eval-results.md\` → \`## Threshold calibration\`.`
- [ ] In the opening bold-led paragraph, replace `the calibrated abstention threshold,` with `the abstention threshold's observed score distributions,`.

Afterwards, `git grep -n 'holds on a real catalog' -- docs` must print nothing.
