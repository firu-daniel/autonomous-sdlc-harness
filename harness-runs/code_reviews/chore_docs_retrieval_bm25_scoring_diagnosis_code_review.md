# Code Review: chore_docs_retrieval_bm25_scoring_diagnosis

## Context

**Branch:** `chore_docs_retrieval_bm25_scoring_diagnosis`
**Date:** 2026-10-20
**Reviewed:** the whole branch diff against `dev`, five files in all, every one in the `general` layer:

- the BM25 index-state probe extended with the states sequence, per-hit diagnostics, the forced re-score and the repeat mode (`evals/docs-retrieval/bm25-history.mjs`, Task 1);
- the new refresh-level module for the candidate end-state rule (`evals/docs-retrieval/bm25-refresh-rule.mjs`, Task 5);
- their two module-table rows (`evals/docs-retrieval/README.md`);
- the launcher subsection `### The BM25 index-state probe` (`docs/retrieval-eval.md`);
- the new `## The BM25 index's state, measured` section, with its seven subsections and the recommendation (`docs/retrieval-eval-results.md`, Tasks 2–4 and 6–8).

12 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**

- **Shipped behaviour.** `cli/src/retrieval/` and `docs-retrieval-service/src/` are untouched, as the task prompt requires.
- **Measurement constraints.** No wall-clock figure was recorded. The index scan is never disabled: the only planner setting is `SET enable_seqscan = off`, which forces it. The backend comparison's existing paragraphs are unchanged.
- **Self-consistency of the record.** The counts were cross-checked against their own tables: the one-run-value tables (50, and 28 / 161 / 47), the 280-row repetition table and its 51 / 52 "none" counts, the recommendation's quoted largest differences, and the before-fix ranges. All agree.
- **Cleanup.** The refresh-level module removes its mirrors, PGlite data directories and `bm25_refresh_rule_*` databases on every exit path, through `withCleanups`.
- **Tests.** No accompanying test is owed. No module under `evals/docs-retrieval/` has a suite, and no rule in `.claude/context/conventions.md` asks for one there. This review ran no suite.
- **Parity.** `phases.parity` is `false`, so no parity review ran.

**Pass 0:**

- **Grep sweep.** This agent's sweep list is still the unfilled stub, so half (a) ran no regex. That is a configuration gap, not a clean sweep.
- **New-export caller check.** It covered every `layers[].path`.
  - Ten of the thirteen new exports have a caller outside their defining file: `bm25-refresh-rule.mjs`, or the `docs/retrieval-eval.md` launcher for `runRefreshRuleLauncher`.
  - `SEQUENCES`, `measureBm25States` and `renderBm25States` are used only by the probe's own launcher. That matches the precedent of `measureBm25History` / `renderBm25History`. No layer above `general` consumes them, so they are not graded dead.

**Pass 2:** `per_task_findings_root` does not exist on disk, so per-unit review was off and Pass 2 was a no-op.

**Findings.** None is a Must Fix:

- an unmeasured isolation claim in the relevance write-up, which the recommendation repeats;
- a second producer of the capture wire format;
- a cross-file heading pointer with no file name;
- one plan-vocabulary leak.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 4** — Drop "Task 2's" from the first **Conclusions, one per lead.** bullet of `### What still differs after REINDEX`. _(layer: general)_
2. [ ] **Finding 3** — Prefix the refresh-level launcher paragraph's heading pointer with `docs/retrieval-eval-results.md` →. _(layer: general)_
3. [ ] **Finding 1** — Qualify the held-another "isolates the dead rows" sentence and the recommendation's Goal 6 attribution as unmeasured. _(layer: general)_
4. [ ] **Finding 2** — Export `scoreLines` and `stamp` from `bm25-history.mjs` and delete their copies in `bm25-refresh-rule.mjs`. _(layer: general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The relevance subsection asserts that the held-another / fresh-insert pair isolates the dead rows, which no reading measured
→ [finding_1.md](chore_docs_retrieval_bm25_scoring_diagnosis_code_review/finding_1.md)

### 2. `bm25-refresh-rule.mjs` carries its own copy of the probe's capture-line producer, `scoreLines`, despite its header's "imported and never copied"
→ [finding_2.md](chore_docs_retrieval_bm25_scoring_diagnosis_code_review/finding_2.md)

### 3. `docs/retrieval-eval.md` points at a results-file heading with no file name, so a search of the file it sits in finds nothing
→ [finding_3.md](chore_docs_retrieval_bm25_scoring_diagnosis_code_review/finding_3.md)

---

## Nice to Have

### 4. The document of record names a plan unit, "Task 2", that its reader has no key for
→ [finding_4.md](chore_docs_retrieval_bm25_scoring_diagnosis_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section is empty.
