# User-Review Fix Plan: feat_arm_a_real_catalog_measurement

## Context

**Branch:** `feat_arm_a_real_catalog_measurement`
**Source user review:** `harness-runs/user_reviews/feat_arm_a_real_catalog_measurement_review.md`
**Summary:** The maintainer has decided that docs retrieval is **kept, opt-in**. The withdrawal the real-catalog verdict names is not executed, and the measured verdict (**withdrawn**) stays exactly as recorded. The review asks for five things: record the decision as an override beside the untouched verdict (observation 1), with its reasons (observation 2); give adopters an honest recommendation on when to turn retrieval on (observation 3); turn roadmap item 18 into the record of the non-execution (observation 4); and correct every site that says retrieval is withdrawn or about to be removed (observation 5).

All five observations were verified against the working tree, and all are valid. Observation 2 is the content the other fixes carry rather than a fix of its own: its four reasons are written in full into Finding 1, in one or two sentences into Finding 2, and as the scope of the recommendation in Finding 3. The sweep in observation 5 is split by file: `docs/retrieval.md`'s opening goes to Finding 3 with the rest of that file, the results file's threshold and default-mode passages go to Finding 4, and the remaining twelve sites go to Finding 5. Three of those twelve were found by the search the user asked for and were not on the user's list: `docs/cli.md` §11, `cli/README.md`, and the second `ROADMAP.md` site.

---

## Phase 2 Readiness — Ordered Fix List

**This list is the single source of truth for the implementation loop.** `[ ]` markers anywhere else in this plan, sub-step bullets inside the per-finding files included, are informational only. The committer never touches them. Each entry resolves to `harness-runs/user_reviews/feat_arm_a_real_catalog_measurement_fix_plan/finding_<K>.md` via its `**Finding K**` reference. The order runs from lowest blast radius to widest. Finding 1 comes first because every other finding points at the subsection it creates.

1. [x] **Finding 1** — Add `### The maintainer's decision` after `### The verdict` in `docs/retrieval-eval-results.md`, with the four reasons, leaving the verdict, figures and rule untouched. _(layer: general)_
2. [ ] **Finding 2** — Rewrite roadmap item 18 in `docs/development.md` §6 as the record that the withdrawal was not executed, and name item 18 as neither shipped nor owed in the paragraph below the table. _(layer: general)_
3. [ ] **Finding 3** — Rewrite `docs/retrieval.md`'s opening paragraph and add `## When to turn it on`: the unmeasured situations, the `lexical`-above-`fused-rerank` disclosure, and a warning that it is not for product search. _(layer: general)_
4. [ ] **Finding 4** — Correct the `## Threshold calibration` and `## The shipped default against fusion alone` passages that say the withdrawal removes the constant or every mode. _(layer: general)_
5. [ ] **Finding 5** — Sweep the remaining twelve withdrawn/removal statements (README, llms.txt, schema description, config.md, evals/README, ROADMAP ×2, cli.md §11, cli/README, queryLog.ts header) to "measured, verdict withdrawn, kept opt-in by maintainer decision". _(layer: cli, general)_

---

## Must Fix

### 1. Record the maintainer's override beside the untouched verdict
→ [finding_1.md](feat_arm_a_real_catalog_measurement_fix_plan/finding_1.md)

### 2. Roadmap item 18 still reads as owed work: "Withdrawing docs retrieval"
→ [finding_2.md](feat_arm_a_real_catalog_measurement_fix_plan/finding_2.md)

### 3. `docs/retrieval.md` announces a pending withdrawal and never says when turning retrieval on pays
→ [finding_3.md](feat_arm_a_real_catalog_measurement_fix_plan/finding_3.md)

### 4. The results file says the withdrawal removes `ABSTAIN_SCORE_THRESHOLD` and every mode
→ [finding_4.md](feat_arm_a_real_catalog_measurement_fix_plan/finding_4.md)

### 5. Adopter-facing and contributor surfaces still say retrieval is withdrawn or about to be removed
→ [finding_5.md](feat_arm_a_real_catalog_measurement_fix_plan/finding_5.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

No observation was invalid. Some sites match the search but are deliberately left unedited, each for a stated reason, so that no reviewer re-raises them. Findings 4 and 5 list them under **Deliberately not edited**: the pre-registered re-calibration method's *On a withdrawn verdict* clause; `docs/retrieval-eval.md` → `## The decision rule` and its subsections; the verdict paragraphs of `## The decision, applied to the real catalog`; every generated region; the measured catalog's own `withdrawal` vocabulary in query ids and transcripts; `withdraw` hits unrelated to retrieval; and the frozen `examples/notes-app/` capture.

---

## Source observations

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
