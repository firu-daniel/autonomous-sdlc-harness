### 3. `docs/retrieval.md` announces a pending withdrawal and never says when turning retrieval on pays

**File:** `docs/retrieval.md` — the opening bold-led paragraph "**Retrieval is off by default and opt-in, and it has been measured against agent navigation — with the outcome withdrawn.**"; the "**Who reads this:**" paragraph above it; and a new section `## When to turn it on`, inserted between `## Still open` and `## What this buys you`.

**The problem.** Two things.

1. The opening paragraph says the outcome is withdrawn and that "The withdrawal is roadmap item 18 … and has not been carried out, so everything below still describes shipped code" — it reads as if the code below is about to be removed. The maintainer has decided it is kept opt-in (Finding 1).
2. No document in the tree says when an adopter should turn retrieval on. `grep` for guidance on enabling it finds only the mechanics (`docs/cli.md` §2: set the key, then re-run `init --force`). The maintainer wants an honest recommendation: scoped to the situations where retrieval is expected to pay, stating that none of them has been measured, disclosing that the model-free `lexical` mode beat the shipped default on the one real catalog, and ruling out the adopter's own product search.

**Fix.**

1. **Rewrite the opening paragraph's first sentences.** Replace the bold lead and the sentence "The withdrawal is roadmap item 18 in [`development.md`](development.md) → `## 6. The roadmap this tree defers to` and has not been carried out, so everything below still describes shipped code." Keep the rest of the paragraph — the arm A description, the "retrieval side of the comparison was measured on the real models…" sentence, the two eval-document pointers and the "Markdown stays the source of truth" close — unchanged. Suggested replacement for the changed part:

   > **Retrieval is off by default and opt-in. It has been measured against agent navigation, the verdict was withdrawn, and it is kept opt-in by maintainer decision.** That comparison is the eval's arm A, run by hand on a real documentation catalog in two variants, one told to read the catalog's index first and one told only where the catalog is; the decision rule applied to it names **withdrawn**, and `docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog` is the verdict of record, with every figure it rests on. The maintainer did not execute the withdrawal: that section's `### The maintainer's decision` records why, and roadmap item 18 in [`development.md`](development.md) → `## 6. The roadmap this tree defers to` records that it was not executed. Everything below describes shipped code, and it stays. When turning it on is worth it is `## When to turn it on` below.

2. **Update the "Who reads this" list of what the document owns** — "what was measured and how, what stays open, what the design buys, where it goes next and what it costs" — to add "when to turn it on" after "what stays open", matching the new section's position.

3. **Add `## When to turn it on`** between `## Still open` and `## What this buys you`, separated by the file's `---` rules like its neighbours. It must carry, in this order:

   - **The situations it is for, and that none is measured.** Turn it on for a docs catalog far larger than one grep can usefully cover, or for one whose vocabulary does not match the queries agents send — docs written for non-developers, product or business documentation, another language. Say plainly that **none of those situations has been measured**: the one real measurement is a small, well-structured, technical catalog searched with identifier-dense queries, the case where grep is strongest, and its verdict was **withdrawn** (`docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog`). Turning it on in those situations is the adopter's call on their own use case, not a result this project has shown.
   - **What off costs.** Nothing: the runtime packages are optional peer dependencies npm does not install, and the runtime install and model download run only when `init` runs with `docs.retrieval` on, which requires `phases.docs`. How to turn it on after adoption stays in `cli.md` §2 and is not restated.
   - **The disclosure, beside the recommendation.** On the real catalog the model-free `lexical` mode scored above the shipped `fused-rerank` default on recall@5 — **0.909** against **0.795** — cite the `gate10-catalog` generated block in `docs/retrieval-eval-results.md` (`### Corpus \`gate10-catalog\``, arms B and E). Those are single-repetition figures on one catalog. State that the default is not changed: `DEFAULT_MODE` stays `fused-rerank` (`cli/src/commands/docs.ts`), and the decision on the default mode stays open in `docs/retrieval-eval-results.md` → `## The shipped default against fusion alone`.
   - **What it is not for.** Do not use it for the adopter's own product search — search boxes, support bots, latency-bound products. It is a tool served to the harness's own agents over MCP and to the `docs search` command, not a component for an application.

   Do not restate any other figure; cite, per this file's rule that the eval's results file is each figure's one home.

**Facts verified.** `docs/retrieval-eval-results.md` → `### Corpus \`gate10-catalog\`` table: `| B | \`lexical\` | 0.636 | 0.864 | 0.909 | 0.753 |` and `| E | \`fused-rerank\` | 0.591 | 0.750 | 0.795 | 0.677 |` (columns recall@1, recall@3, recall@5, MRR); `### Findings about the rule` notes these are single-repetition figures. `cli/src/commands/docs.ts` → `const DEFAULT_MODE: SearchMode = 'fused-rerank';`. `cli/package.json` → `peerDependenciesMeta` marks every retrieval package optional.

**Depends on:** Finding 1 (the `### The maintainer's decision` subsection the opening paragraph points at).

**Verification.** `bash scripts/test.sh`; confirm every heading this file now cites exists by name.
