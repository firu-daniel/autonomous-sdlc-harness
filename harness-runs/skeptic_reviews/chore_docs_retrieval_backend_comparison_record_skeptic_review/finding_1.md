### 1. Divergence source 4's **Arms D and E** claims arm B adds no difference to the fresh reading's fusion, but only arm B's top five was compared

**File:** `docs/retrieval-eval-results.md` (`### Divergence sources, in the order checked` → item 4 → **Arms D and E**). The quoted text: "On the fresh reading arm B contributes no difference to the fusion, so arms D and E differ there only where the vector arm or the reranker does". It is around line 27864, a hint only.

**Problem.** The sentence says the fresh reading's arm D and arm E differences have only two possible sources: the vector arm and the reranker. Its premise is that "arm B contributes no difference to the fusion". The fresh reading did not measure that.

- **What was measured.** `### A fresh fixture-catalog reading, both backends as shipped` compares arm B's **top five ordered refs** per query (`k` 5), and these agree on all 12 queries.
- **What the fusion actually reads.** Both backends fuse each arm's top `ARM_CANDIDATES` hits, which is 50, not 5:
  - `cli/src/retrieval/search.ts` → `ARM_CANDIDATES = 50`, used as `addRrf(scores, await store.lexicalSearch(query, ARM_CANDIDATES))`;
  - `docs-retrieval-service/src/harness_docs_retrieval/search.py` → `ARM_CANDIDATES = 50`, used as `_add_rrf(scores, await store.lexical_search(query, ARM_CANDIDATES))`.

  Arm B's ranks 6 to 50 feed arm D's fusion and arm E's top-20 rerank pool, and the comparison never compares them.

- **The fresh reading's own data shows inputs past rank five differ.** I re-ran the scratch comparison deterministically from the recorded blocks (`node harness-runs/scratch/backend-parity/compare-scratch.mjs fixture-catalog`). It gives the same figures the subsection records. On `q-fc-route-choice`:
  - arm B has no ordered-ref change;
  - arm C has no ordered-ref change;
  - arm D differs anyway, at rank 5: `docs/labels.md` on TypeScript against `docs/routing.md#rerouting-a-parcel-in-flight` on Python.

  Both arms' compared top fives agree, so this arm D difference comes from a fused input beyond rank five. That input is either arm B's ranks 6 to 50 or arm C's, and the reading cannot say which. The vector arm cannot be named as the cause there, so the sentence's "only where the vector arm … does" does not hold on that query.

**Why it matters.** The task prompt's goal 2 says "Any difference that remains unexplained stays named as unexplained". The story plan names, as its second top risk, a correction that overclaims what separates the backends. This sentence attributes the fresh arm D and E differences to the models alone. A maintainer reading it would conclude that the lexical store is in full parity at the depth the fusion consumes. Only top-five parity was shown.

**Fix.** In `docs/retrieval-eval-results.md`, item 4's **Arms D and E** bullet, replace

```
On the fresh reading arm B contributes no difference
     to the fusion, so arms D and E differ there only where the vector arm or the reranker does
     (`### A fresh fixture-catalog reading, both backends as shipped`).
```

(match the existing line breaks and indentation) with

```
On the fresh reading arm B's top five ordered refs agree
     on every query, but each backend fuses every arm's top `ARM_CANDIDATES` hits, 50
     (`cli/src/retrieval/search.ts` and `docs-retrieval-service/src/harness_docs_retrieval/search.py`), and
     arm B's ranks past five were not compared. On `q-fc-route-choice` arm D differs at rank 5 while arms B
     and C return the same five refs on both sides, so arms D and E's differences there are not attributed
     to either arm and stay unexplained (`### A fresh fixture-catalog reading, both backends as shipped`).
```

Reflow the bullet to the document's line width. Change no figure, and touch no other passage. This is a prose-only fix to a document under `docs/`, so it runs no test.
