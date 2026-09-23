### 1. Record the maintainer's override beside the untouched verdict

**File:** `docs/retrieval-eval-results.md` (`## The decision, applied to the real catalog` → `### The verdict`) — insert after the paragraph opening "**The change it names: roadmap item 18**" and before the heading `### Findings about the rule, recorded and not acted on`.

**The problem.** The maintainer has decided that docs retrieval is **kept, opt-in**: the withdrawal the verdict names is not executed. The verdict section records the rule's outcome (**withdrawn**) and ends by saying this branch "records the decision and deliberately does not execute it", but nothing in the tree records that the maintainer then decided not to execute it at all, or why. Every other site in this plan (Findings 2–5) points at the record this finding creates, so it lands first.

**What must not change.** Leave the figures, the `### Relevance` / `### Cost` / `### Failure` grading, the `### The verdict` subsection and its **withdrawn** outcome exactly as they are — including the opening "**The outcome: withdrawn.**" paragraph, the "**The change it names: roadmap item 18**" paragraph, and the `### Findings about the rule` bullet "its withdrawn outcome removes every mode", which describes what the rule's outcome would do, not what the tree does. Do not amend `docs/retrieval-eval.md` → `## The decision rule` (its `### Two arm A variants, and how they combine` subsection included). This is a maintainer override of the rule's outcome, not a re-reading of the rule. Do not touch any generated region (`<!-- eval:generated:start -->` … `<!-- eval:generated:end -->`).

**Fix.** Add one new subsection, headed exactly `### The maintainer's decision` (the other findings cite it by that name), between `### The verdict` and `### Findings about the rule, recorded and not acted on`. Suggested text — keep the substance and all four reasons; wording may be tightened to the file's style (short paragraphs, wrapped near 105 columns like its neighbours):

```markdown
### The maintainer's decision

**Recorded 2026-09-24: the withdrawal this verdict names is not executed. Docs retrieval is kept,
opt-in.** This is a maintainer decision overriding the rule's outcome, not a re-reading of the rule: the
figures above, the bar-by-bar grading and the verdict — **withdrawn** — stand exactly as recorded, and
`docs/retrieval-eval.md` → `## The decision rule` is not amended. Roadmap item 18 in
`docs/development.md` → `## 6. The roadmap this tree defers to` records that the withdrawal was not
executed and points here. The reasons:

- **It is a real, working system, built and measured.** This measurement is a record of how it performed
  on one kind of corpus, not a finding that it cannot be useful.
- **It has not been optimised.** The one real measurement graded the shipped stack as built: the
  smallest local models — a general-English embedder and a reranker trained on web-search questions.
  Improving it — a code-aware reranker, a different embedder, BM25 weighting, handling sections longer
  than the models' window — is open work, not a closed question.
- **It may have uses beyond the one measured.** This measurement covered one situation: an agent
  searching a small, well-structured, technical docs catalog with identifier-dense queries — the case
  where grep is strongest. It did not measure the situations where retrieval is generally expected to
  pay: a docs catalog far larger than one grep can usefully cover, and a catalog whose vocabulary does
  not match the queries agents send (docs written for non-developers, product or business
  documentation, another language).
- **Whether to enable it is the adopter's decision**, depending on their use case, and it costs an
  adopter nothing while off: its runtime packages are optional peer dependencies npm does not install,
  and the runtime install and model download run only when `init` is run with `docs.retrieval` on,
  which requires `phases.docs`.

**What follows from it.** The `docs` verb and its subcommands, the optional peer dependencies,
`ABSTAIN_SCORE_THRESHOLD`, the plugin's `search_docs` grants and the `docs.retrieval` key stay as they
ship, and `DEFAULT_MODE` stays `fused-rerank`. When turning retrieval on is worth it — and that none of
those situations has been measured — is `docs/retrieval.md` → `## When to turn it on`.
```

The `## When to turn it on` section this text cites is created by Finding 3; if Finding 3 lands under a different heading, update this pointer to match.

**Facts verified for the text above.** `cli/package.json` → `peerDependenciesMeta` marks all five retrieval packages `"optional": true`; `.claude/context/conventions.md` → `## The stack, in the words the rules below use` → "One carve-out: docs retrieval" states they are installed only for an adopter who turns retrieval on; `schemas/harness.config.schema.json` → `docs.retrieval` states "Legal only while 'phases.docs' is true"; `cli/src/retrieval/search.ts` → `export const ABSTAIN_SCORE_THRESHOLD = 0.32;`.

**Verification.** `bash scripts/test.sh` (the results-file readers in `evals/docs-retrieval/results.mjs` parse the generated region only, which this edit does not touch).
