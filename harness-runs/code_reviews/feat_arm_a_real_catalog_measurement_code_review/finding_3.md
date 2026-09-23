### 3. `ABSTAIN_SCORE_THRESHOLD` is still described as "calibrated against the measured distribution" after the re-calibration on the observed distribution returned `cannot-separate`

**File:** `cli/src/retrieval/search.ts`, the doc comment of `ABSTAIN_SCORE_THRESHOLD` ("calibrated at `0.32` against the real\n * reranker's measured score distribution"), and the module header's rule sentence ("calibrated against the measured reranker distribution**").
**Also:** `docs/retrieval.md` → the `**Abstention.**` paragraph ("That constant is **calibrated** against the real reranker's measured score distribution"). And `docs/cli.md` → `## 11. \`docs\``, the opening paragraph ("Its abstention threshold is calibrated against the real reranker's measured score distribution").

**Problem.** `docs/retrieval-eval-results.md` → `## Threshold calibration` now records the following. The value dates from a **censored** run, in which no negative score was ever observed. The fixed re-calibration over the **observed** distributions returned `cannot-separate`. On `gate10-catalog`, at `0.32`, arm E abstains on 6 of 44 positives and answers 6 of 15 `near` negatives, and "no single value separates the two sides". The four sites above still describe the constant as calibrated against *the* measured distribution. Read today, that says the value separates the distribution that was measured, which the record this branch wrote contradicts.

The constant's doc comment also restates the number, "at `0.32`". The section itself states that the doc comment in `cli/src/retrieval/search.ts`, `docs/retrieval.md` and `docs/cli.md` §11 "cite this section rather than restating its figures". The task prompt's item 5 repeats that requirement for exactly these three sites.

**Fix.** Make each site cite the section without characterising the value. Change no code and do not touch the constant's value.

- [ ] `cli/src/retrieval/search.ts`, the `ABSTAIN_SCORE_THRESHOLD` doc comment. Replace its first sentence (from "The best reranker score below which" to "and is the only record of it.") with:

  ```ts
   * The best reranker score below which `fused-rerank` abstains. `docs/retrieval-eval-results.md` →
   * `## Threshold calibration` holds how the value was chosen, the observed distributions it was
   * re-tested on and what it costs, and is the only record of it.
  ```

  Keep the two paragraphs that follow it unchanged.
- [ ] Same file, the module header. In `**The rule this module exists to enforce: only \`fused-rerank\` abstains, and only below\n * {@link ABSTAIN_SCORE_THRESHOLD}, calibrated against the measured reranker distribution**`, delete `, calibrated against the measured reranker distribution`, so the bold rule ends at `{@link ABSTAIN_SCORE_THRESHOLD}**`. Leave the rest of the header as it is. Its next sentence ("The reranker's score is the one this module treats as calibrated") is about the score's `[0, 1]` scale, not the threshold, and stays.
- [ ] `docs/retrieval.md`, the `**Abstention.**` paragraph. Replace `That constant is **calibrated** against the real reranker's measured score distribution; `docs/retrieval-eval-results.md` → `## Threshold calibration` is the record of how the value was chosen and on what, and this document restates none of it.` with `` `docs/retrieval-eval-results.md` → `## Threshold calibration` is the record of how that constant's value was chosen, what it was re-tested on and what it costs, and this document restates none of it. ``
- [ ] `docs/cli.md` §11, the opening paragraph. Replace `Its abstention threshold is calibrated against the real reranker's measured score distribution — `docs/retrieval-eval-results.md` → `## Threshold calibration` is the record of how that value was chosen and on what, and this section restates neither the value nor its derivation.` with `` The record of its abstention threshold — how the value was chosen, what it was re-tested on and what it costs — is `docs/retrieval-eval-results.md` → `## Threshold calibration`, and this section restates neither the value nor its derivation. ``

Verify with `bash scripts/typecheck.sh` and `bash scripts/test.sh`, each run without a pipe. Only comments change in `search.ts`, so both must pass unchanged.
