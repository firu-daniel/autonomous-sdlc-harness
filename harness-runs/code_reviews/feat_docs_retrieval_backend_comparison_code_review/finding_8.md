### 8. `renderVectorAgreement` inlines the two tables its own helpers render

**File:** `evals/docs-retrieval/vector-agreement.mjs` (`renderVectorAgreement`) — "'| Pairs | min | p5 | p50 | mean | max |',"

**Problem.** Task 7 added `summaryTable(label, summary)` and `lowestTable(heading, lowest)` for the matched-precision leg. `renderVectorAgreement` still writes the main leg's summary table and lowest-cosine table out inline, line for line the same as those helpers produce. That leaves two copies of each table's shape in one module, and a column added to one would silently not reach the other.

**Fix.** In `renderVectorAgreement`'s returned array, find the inline run that starts at the element `'| Pairs | min | p5 | p50 | mean | max |',`. It continues through the `'| --- | ... |'` rule, the summary row, a `''`, the `` `The ${result.lowest.length} lowest cosines:` `` line, a `''`, the `'| Chunk key | Cosine |'` header, its rule, and ends at the `...result.lowest.map(…)` spread. Replace that whole run with:

```js
    ...summaryTable('Pairs', summary),
    '',
    ...lowestTable('The <n> lowest cosines:', result.lowest),
```

Leave everything before it (the bullet lines and the `''` after `LEG_LINE`) and everything after it (the `''` and the text-mismatch line onward) unchanged. The rendered bytes are the same: `summaryTable('Pairs', …)` emits the same header, rule and row, and `lowestTable` emits `The <count> lowest cosines:`, a blank line and the same two-column table. No test file covers this module, so no test runs.
