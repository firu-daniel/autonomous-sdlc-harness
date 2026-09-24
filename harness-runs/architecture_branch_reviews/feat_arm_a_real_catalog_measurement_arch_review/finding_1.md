### 1. The `unclassed` negative bucket is declared twice, as a retyped literal in two eval modules

**Site.**
- `evals/docs-retrieval/calibrate.mjs` → `const UNCLASSED = 'unclassed';` (under the comment *"This module's own point kinds; the negative classes beside them are {@link NEGATIVE_KINDS}'."*), read by `kindOf`.
- `evals/docs-retrieval/arm-a/spread.mjs` → `const UNCLASSED = 'unclassed';` (under the comment *"This module's bucket for a negative that carries no `negativeKind`."*), read by `breakdown`.
- The owner of the vocabulary: `evals/docs-retrieval/queries.mjs` → `NEGATIVE_KINDS` (*"The one declaration of `negativeKind`'s closed value set; a consumer imports it, never retypes it."*).

**Problem.** `negativeKind`'s closed value set is declared once, in `queries.mjs` → `NEGATIVE_KINDS`, and both new consumers correctly import it from there. But each consumer then extends that set with the same third member, the bucket for a negative that carries no `negativeKind`, and each declares it on its own as the retyped string `'unclassed'`. Both modules write the bucket name into published output: `spread.mjs` → `breakdown` makes it a key of `negatives`, and `calibrate.mjs` → `kindOf` makes it a point's `kind`. The prose in `docs/retrieval-eval-results.md` (*"none censored, none `unclassed`"*) cites the same name. Neither declaration mentions the other, so renaming the bucket in one module leaves the two published breakdowns using different spellings, with no compile error and no test to catch it. `calibrate.mjs`'s own header says each class is *"imported from its owner"*, which this literal contradicts.

Rules this breaks:
- `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*, and *"Before adding a copy of anything, grep for it."* `spread.mjs` (Task 11) added the second copy after `calibrate.mjs` (Task 6) had already declared the first.
- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"The shared constants have owners, and a value is imported from its owner rather than retyped."*
- The closed-value-set check: the classification of a negative is one closed set (`far`, `near`, and the unclassified bucket). It should be declared once, next to `NEGATIVE_KINDS` in the layer that owns the query-set format. It should not be an open primitive retyped at each point of use.

**Fix.**
- [ ] In `evals/docs-retrieval/queries.mjs`, beside `NEGATIVE_KINDS`, export one declaration of the bucket, e.g. `export const UNCLASSED_NEGATIVE = 'unclassed';`, with a doc comment saying it is the class a consumer reports for a negative that carries no `negativeKind`, that it is deliberately not a member of `NEGATIVE_KINDS` (a query set may not carry it: `loadQueries` still refuses it through `refuseOutsideSet`), and that consumers import it and never retype it.
- [ ] In `evals/docs-retrieval/calibrate.mjs`, delete `const UNCLASSED = 'unclassed';`, import `UNCLASSED_NEGATIVE` from `./queries.mjs` next to `NEGATIVE_KINDS`, and use it in `kindOf`. Change the comment above `POSITIVE` so that it says only `POSITIVE` is this module's own.
- [ ] In `evals/docs-retrieval/arm-a/spread.mjs`, delete `const UNCLASSED = 'unclassed';`, import `UNCLASSED_NEGATIVE` from `../queries.mjs` next to `NEGATIVE_KINDS`, and use it in both places `breakdown` reads it.
- [ ] Nothing published changes: the string stays `'unclassed'`, so no generated block and no hand-written figure needs regenerating. Run `bash scripts/test.sh` unpiped to confirm.
