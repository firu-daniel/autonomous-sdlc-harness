### Task 5 — Record `bestRerankScore` on every eval record and every per-query entry

**Goal:** Carry the library's uncensored score into the eval: every arm's per-query record, and every per-query entry the results file's machine half publishes, gains `bestRerankScore` beside the existing `bestScoreOnPositive` / `bestScoreOnNegative`, without changing what `hits`, `abstained` or any relevance column means.

**Depends on:** Task 1, which adds to `cli/src/retrieval/search.ts`:

```ts
readonly bestRerankScore: number | null;   // on SearchResult
```

— the top reranker score `fused-rerank` compared against `ABSTAIN_SCORE_THRESHOLD`, present whether or not the query abstained, `null` in `lexical` / `vector` / `fused` and when there were no candidates. This task reads it as `result.bestRerankScore` from the compiled `cli/dist/retrieval/search.js`; it redefines nothing. **Also depends on Task 4**, whose `negativeKind` marks on the committed sets must land first: this task is the one that makes their negatives' scores observable.

### Targets

- `evals/docs-retrieval/arms.mjs` → `runArm`.
- `evals/docs-retrieval/metrics.mjs` → `scoreArm` and the module header.
- `docs/retrieval-eval.md` → `## What each metric means`, the **Abstention** bullet.

**The per-query contract this task produces, which Tasks 6, 11, 19, 20 and 23 consume:** each entry of `metrics.perQuery` carries `bestRerankScore: number | null` for **every** query, positive and negative — the first repetition's value, the repetition that is scored. Arm A's records (from `score-transcript.mjs`) carry no such field, so their entries read `null`. `bestScoreOnPositive` / `bestScoreOnNegative` keep their existing meaning — the top **returned** hit's score, `null` on an abstention.

**Work:**

- [ ] `arms.mjs` → `runArm`: on repetition 0, set `record.bestRerankScore = result.bestRerankScore ?? null` beside `hits` and `abstained`; initialise it `null` in the record map. Update the doc comment's record shape to name it.
- [ ] `metrics.mjs` → `scoreArm`: add `bestRerankScore: typeof record.bestRerankScore === 'number' ? record.bestRerankScore : null` to every `perQuery` entry, leaving `bestScoreOnPositive` / `bestScoreOnNegative`, `recall`, `mrr`, `strict`, `latency` and `abstainedOnNegative` computed exactly as today. Keep the module's rule — no arm letter, no `SearchMode` — and extend the header's calibration paragraph: the censored pair describes what was **returned**, the uncensored field describes what abstention **tested**.
- [ ] `## What each metric means` → **Abstention**: name `bestRerankScore` beside the censored pair in the machine half, and say which one the threshold is calibrated on and why the censored pair stays (it is what a caller received).

**Verification:**

- A launcher run without `--out` over `fixture-catalog` (`bash scripts/scratch-run.sh harness-runs/scratch/eval.mjs --corpus fixture-catalog`, the launcher body `docs/retrieval-eval.md` → `## How to run it` gives) prints a table whose recall@1/3/5, MRR and strict columns equal the committed `fixture-catalog` rows exactly; latency differs, which is expected.
- A second launcher that calls `runEval` over `fixture-catalog` and prints arm E's `perQuery` shows a non-null `bestRerankScore` on every query, a value below `ABSTAIN_SCORE_THRESHOLD` on every query with `abstained: true`, and `bestRerankScore === bestScoreOnPositive` on every positive that did not abstain; arms B–D show `null` throughout. Report these observations in the implementer's return and commit no figure from them — the committed record of the scores is Task 21's regeneration, after the decision.
- `bash scripts/run-gates.sh`, without a pipe: gate 11 passes (the floor is computed from columns this task does not change).
