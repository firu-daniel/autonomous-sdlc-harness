### 1. The fresh reading's arm C to E differences are given a "measured candidate" but not named as unexplained

**File:** `docs/retrieval-eval-results.md` (`### Which case this is` → **On the fresh reading.**) — "for which the models, sources (1) and (2), are the measured candidate"; and `docs/retrieval-eval-results.md` (`### A fresh fixture-catalog reading, both backends as shipped` → **The answer: arm B agrees on every query.**) — "the only measured candidate for them"

The task prompt's goal 2 requires that `### Which case this is` and the divergence sources say what the fresh reading shows, and that "any difference that remains unexplained stays named as unexplained". The story plan restates this as a decision: "What is unexplained stays named as unexplained."

The fresh reading leaves differences in arms C to E: ordered-ref changes on 6, 5 and 1 of the 12 queries. Both passages that report this say only that the models, divergence sources (1) and (2), are "the measured candidate" for them. Neither says that the differences remain unexplained. The 2026-10-08 text this branch keeps does say it. `### Divergence sources, in the order checked` → item 4 → **Arm C** reads: "Source (1) together with (2) is the measured candidate for those changes, but only for document vectors. The query vectors and the state of the Python side's HNSW graph, built in the same persistent database, were not measured, so these changes are listed as unexplained." The fresh reading measured neither the query vectors nor the HNSW graph, so the same reason still holds.

The new passages leave out that qualifier. A maintainer who reads "On that reading the backends differ only in arms C to E, for which the models … are the measured candidate" would take the remaining backend difference as explained by quantization. The measurement does not support that. This is the overclaim the story plan's `Top risks:` names second.

**Fix:** keep both sentences, and add the unexplained status beside each one.

1. In `### Which case this is` → **On the fresh reading.**, replace

   ```
   On that reading the backends differ only in arms C to
   E, for which the models, sources (1) and (2), are the measured candidate. `self-docs` was not re-read.
   ```

   with

   ```
   On that reading the backends differ only in arms C to
   E, for which the models, sources (1) and (2), are the measured candidate. Those differences stay
   unexplained, for the reason item 4 of `### Divergence sources, in the order checked` gives for arm C:
   the query vectors and the Python side's HNSW graph were not measured. `self-docs` was not re-read.
   ```

2. In `### A fresh fixture-catalog reading, both backends as shipped` → **The answer: arm B agrees on every query.**, replace

   ```
   The models, divergence sources (1) and (2) of `### Divergence sources, in the order checked`, are
   the only measured candidate for them.
   ```

   with

   ```
   The models, divergence sources (1) and (2) of `### Divergence sources, in the order checked`, are
   the only measured candidate for them, and they stay unexplained for the reason that subsection's
   item 4 gives for arm C: the query vectors and the Python side's HNSW graph were not measured.
   ```

Change no figure. This is a prose-only fix to a document under `docs/`, so it runs no test.
