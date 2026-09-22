### 2. The store suite and `docs/retrieval.md` call 166 rows the `self-docs` corpus's chunk count, and claim the case covers both committed corpora's sizes

**Site.** `cli/test/docs-retrieval-store.test.mjs` → case `(a)`'s opening comment (*"40 is the `fixture-catalog` corpus's order of magnitude and 166 the `self-docs` corpus's measured chunk count"*) and `docs/retrieval.md` → `## Still open` → the lexical-arm entry (*"at 40, 166 and 1024 rows, which covers both committed corpora's sizes"*).

**The problem.** Both sites state a corpus size that this branch's own recorded runs contradict, and the second draws a coverage claim from it that is false as written.

The sizes the branch measured and committed, from `docs/retrieval-eval-results.md`'s generated region — the only home for a `self-docs` figure, and the stamp the story index requires every such figure to carry:

- `fixture-catalog` — `{ files: 9, chunks: 41 }`.
- `self-docs` — `{ files: 13, chunks: 177 }` in the shipped region, and `{ files: 14, chunks: 194 }` on the tree as it now stands (the code review's own verification run reports that second stamp).

`166` is the provisioning pre-step's figure, taken before this branch wrote four documents into `docs/`, and it appears at both sites **unstamped**, presented as the corpus's count rather than as one run's reading of a corpus this branch was in the middle of moving. Since `41 > 40` and `177 > 166`, neither committed corpus's size is among the three row counts the case measures, and both exceed their nearest one — so *"covers both committed corpora's sizes"* is not true of the points measured.

**Why it is not a Must Fix.** The property itself is safe, and I checked that rather than assuming it: case `(a)`'s third point is 1024 rows, far above both corpora, and the case's own header explains why the property is size-independent in that regime — `openPgliteStore` builds the BM25 index on an empty table, so the planner has no statistics for `chunks` and takes the index scan at every size. The conclusion `## Still open` draws therefore stands; only the numbers it rests on are wrong, and no consumer decision turns on the difference between 166 and 177.

**The proof.**

- `cli/test/docs-retrieval-store.test.mjs` → `for (const n of [40, 166, 1024])`, and the comment above it naming 166 as the measured count.
- `docs/retrieval-eval-results.md` → `### Corpus self-docs` → **Provenance**, first bullet: *"snapshot `{ files: 13, chunks: 177 }`, as the index build of this run reported it"*; and `### Corpus fixture-catalog`'s, `{ files: 9, chunks: 41 }`.
- `docs/retrieval-eval-results.md` → `## Cold build and index size`, which states 177 chunks for the same corpus.

**The fix.** Two prose edits, no behaviour change; the tested row counts stay as they are, because 1024 already brackets both corpora from above and moving them would re-open a measurement.

- [ ] In `cli/test/docs-retrieval-store.test.mjs`, replace case `(a)`'s sentence *"40 is the `fixture-catalog` corpus's order of magnitude and 166 the `self-docs` corpus's measured chunk count; 1024 is far above the `(b)` crossover and is here to show the property is not a small-corpus artefact"* with: *"40 and 166 are the order of magnitude of the two committed corpora, which this branch recorded at 41 and 177 chunks (`docs/retrieval-eval-results.md`, the generated region's snapshots); 1024 is far above both, and above the `(b)` crossover, and is here to show the property is not a small-corpus artefact. The three points are orders of magnitude rather than the corpora's exact counts because the property is size-independent in this plan — see the header."*
- [x] In `docs/retrieval.md` → `## Still open` → the lexical-arm entry, replace *"at 40, 166 and 1024 rows, which covers both committed corpora's sizes and one far above them"* with: *"at 40, 166 and 1024 synthetic rows, which bracket both committed corpora's recorded sizes — 41 and 177 chunks — and reach far above them"*.

**Deviations from plan:** the `cli`-layer fix also corrected two further carriers of the same false claim in the same file, which the finding's `Site` does not name: the case's own test name (*"at both committed corpora sizes"* → *"at three synthetic corpus sizes"*) and the module header's first sentence (*"what the lexical arm returns at the two committed corpora's sizes"* → *"at synthetic row counts bracketing the two committed corpora's recorded sizes"*). Leaving either would have left the identical claim asserted in the file the fix was applied to, and `.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header. No behaviour change; the row counts are untouched. `grep -rn "both committed corpora sizes"` over the repository returned that test name as the only citation site, so nothing else needed updating.
