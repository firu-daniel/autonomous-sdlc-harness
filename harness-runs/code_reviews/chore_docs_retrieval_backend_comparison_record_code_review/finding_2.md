### 2. Divergence source (3)'s mechanism 1 bullet calls the before-fix state "the shipped end state", two bullets above the post-fix "shipped end states"

**File:** `docs/retrieval-eval-results.md` (`### Divergence sources, in the order checked` → item 3 → **What it shows.** → **Mechanism 1, dead rows that stay in the index's statistics.**) — "the shipped end state differs from a fresh build followed by"

The **Mechanism 1** bullet reads: "In every `other-corpus` scenario, whose last refresh deleted the other corpus's rows, the shipped end state differs from a fresh build followed by `REINDEX` on every hit in both columns, on both backends and both corpora". The figures it cites are the `before` readings of `### The candidate end-state rule, at refresh level`. That subsection defines a `before` reading as the end state of the code shipped *at that time*, before the fix ("each scenario's `before` reading is the shipped code's end state, the before-fix figure").

Two bullets further down the same list, **What shipped.** says: "Their shipped end states match a fresh build followed by `REINDEX` in 11 of 12 scenarios each". So the list uses "shipped end state" for two opposite states. On this branch, "shipped" means after the fix, as `### A fresh fixture-catalog reading, both backends as shipped` and **What shipped.** both use it. A reader of the **Mechanism 1** bullet is therefore told that the current shipped code still differs from the reference on every hit. That contradicts the bullet below it.

**Fix:** in that bullet, replace

```
the shipped end state differs from a fresh build followed by
```

with

```
the before-fix end state, each scenario's `before` reading, differs from a fresh build followed by
```

Reflow the paragraph to the document's line width. Change nothing else in the bullet. This is a prose-only fix to a document under `docs/`, so it runs no test.
