Maintainer decision on the real-catalog verdict: docs retrieval is **kept, opt-in**. It is not withdrawn. The measured verdict stays exactly as recorded; what changes is what this tree says follows from it.

1. **Record the decision as a maintainer override of the rule's outcome, not as a re-reading of the rule.** `docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog` keeps its figures, its bar-by-bar grading and its verdict (**withdrawn**) unchanged. Add, after `### The verdict`, a short subsection recording that the maintainer does not execute the withdrawal and keeps retrieval opt-in, with the reasons in item 2. `docs/retrieval-eval.md` → `## The decision rule` is not amended.

2. **The reasons, to be stated wherever the decision is recorded:**
   - It is a real, working system that was built and measured; the measurement is a record of how it performed on one kind of corpus, not a finding that it cannot be useful.
   - It has not been optimised. The one real measurement graded the shipped stack as built: the smallest local models (a general-English embedder and a reranker trained on web-search questions). Improving it — a code-aware reranker, a different embedder, BM25 weighting, handling sections longer than the models' window — is open work, not a closed question.
   - It may have uses beyond the one measured. The measurement covered one situation: an agent searching a small, well-structured, technical docs catalog with identifier-dense queries, the case where grep is strongest. It did not measure the situations where retrieval is generally expected to pay: a docs catalog far larger than one grep can usefully cover, and a catalog whose vocabulary does not match the queries agents send (docs written for non-developers, product or business documentation, another language).
   - Whether to enable it is the adopter's decision, depending on their use case. It costs an adopter nothing while off: its runtime packages are optional peer dependencies npm does not install, and the runtime install and model download run only when `init` is run with `docs.retrieval` on (which requires `phases.docs`).

3. **State the recommendation honestly.** Where the docs describe when to turn retrieval on, scope it to the situations in item 2 — a large docs catalog, or one whose vocabulary does not match the code — and say plainly that **none of those situations has been measured**; the one real measurement is the withdrawn verdict. Also disclose, beside the recommendation, that on the real catalog the model-free `lexical` mode scored above the shipped `fused-rerank` default on recall@5 — citing the `gate10-catalog` generated block, without changing the default. Do not recommend it for the adopter's own product search (search boxes, support bots, latency-bound products): it is a tool served to the harness's agents and the `docs search` command, not a component for an application.

4. **Replace the roadmap item "Withdrawing docs retrieval"** in `docs/development.md` → `## 6. The roadmap this tree defers to`: the row becomes the record that the withdrawal the rule named was not executed, by maintainer decision, with the reasons in item 2 in one or two sentences and a pointer to where the decision is recorded. The row keeps its number, as the paragraph below that table requires.

5. **Correct every statement that says or implies retrieval is withdrawn, or is to be removed, so that each says instead: measured, verdict withdrawn, kept opt-in by maintainer decision.** At least these sites state it today — find the rest by searching for the verdict and the removal:
   - `README.md` — the `docs/retrieval.md` bullet in the documentation list.
   - `llms.txt` — the `docs/retrieval.md` entry.
   - `docs/retrieval.md` — the opening paragraph.
   - `schemas/harness.config.schema.json` — the `docs.retrieval` description, which says *"the withdrawal is not yet carried out"*; description text only, no key, type or default moves.
   - `docs/config.md` — the `docs.retrieval` row.
   - `evals/README.md` — the docs-retrieval verdict line.
   - `ROADMAP.md` — the *Docs-catalog retrieval* row.
   - `cli/src/retrieval/queryLog.ts` — its header comment citing the withdrawn outcome.
   - `docs/retrieval-eval-results.md` — the passages under `## Threshold calibration` that say the withdrawn outcome removes `ABSTAIN_SCORE_THRESHOLD` or that the constant *"goes with the tool"*; the constant stays, and what would move it next is a re-calibration, not a removal.
   The generated regions and the measured figures are not edited.
