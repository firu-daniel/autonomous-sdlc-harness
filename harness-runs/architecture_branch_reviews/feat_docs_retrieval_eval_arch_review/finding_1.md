### 1. `LIMIT = 50` retypes the exported `ARM_CANDIDATES`

**Site.** `cli/test/docs-retrieval-store.test.mjs`, the module-level constant declared as
`` /** `ARM_CANDIDATES` — the limit the lexical arm actually calls with (`cli/src/retrieval/search.ts`). */ ``
followed by `const LIMIT = 50;`. Both test cases call with it: `store.lexicalSearch(PROBE_TERM, LIMIT)`
in case (a), and the `LIMIT` bound into `'… LIMIT $2'` in case (b)'s `filtersAt`.

**Rule it violates.** `.claude/context/conventions.md` → `## Configuration is the source of truth, and
it is read at run time`: *"The shared constants have owners, and a value is imported from its owner
rather than retyped."* The owner here is `cli/src/retrieval/search.ts`, which declares
`export const ARM_CANDIDATES = 50;` — an **exported** constant, so nothing prevents the import. The
same document's `### Where a new responsibility goes` closes with *"Before adding a copy of anything,
grep for it,"* and `cli/src/core/repoPaths.ts`'s header is the worked cost of not doing so.

**Why it matters architecturally rather than cosmetically.** The suite's own doc comment names the
owner, so the file is asserting a relationship to `ARM_CANDIDATES` that the code does not have. The
whole point of both cases is *the limit the lexical arm actually calls with* — case (a) measures that
the arm returns the matching chunk alone at that limit, and case (b) bisects the planner crossover at
it. If `ARM_CANDIDATES` moves in `search.ts`, both cases keep passing while measuring a limit the arm
no longer uses, and the suite's header claim ("what the lexical arm returns") becomes false with no
compile error and no failing assertion. This is exactly the drift class the retyping rule exists to
prevent, and the rest of this branch already respects it: `evals/docs-retrieval/args.mjs`,
`query-log-pass.mjs` and `results.mjs` all import `DEFAULT_RESULTS`, `ABSTAIN_SCORE_THRESHOLD`,
`SEARCH_MODES` and `RETRIEVAL_STUB_ENV` from `cli/dist/retrieval/search.js` rather than retyping any
of them.

**The fix.** Delete the `LIMIT` declaration and import the owner instead, alongside the existing
`openPgliteStore` import:

```js
import { ARM_CANDIDATES } from '../dist/retrieval/search.js';
```

Then use `ARM_CANDIDATES` at the three call sites in place of `LIMIT`. If a local alias reads better
in the assertion messages, bind it to the import (`const LIMIT = ARM_CANDIDATES;`) rather than to the
literal — what the rule forbids is the second copy of the **value**, not a local name for it. Leave
`DIMENSIONS = 384` as it stands: `EMBEDDING_DIMENSIONS` is module-private in
`cli/src/retrieval/models.ts` by design, there is no owner to import from, and the suite's comment
already discloses where the number comes from and why no model is loaded to get it.
