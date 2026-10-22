# Code Review: chore_docs_retrieval_backend_comparison_record

## Context

**Branch:** `chore_docs_retrieval_backend_comparison_record`
**Date:** 2026-10-22
**Reviewed:** the whole branch diff against `origin/dev`. `defaultBranch` is `dev`, which has no local ref in this checkout, so the remote-tracking ref was the diff base. The diff covers two files in the catch-all `general` layer:
- `docs/retrieval-eval-results.md`: Tasks 1, 2, 3 and 5. These add the new `### A fresh fixture-catalog reading, both backends as shipped`; correct `### Which case this is`, divergence sources 3 and 4, the **Finding** paragraph, the comparison lead and `### The trade-off, stated`; add the 1.3.1 notes beside every wall-clock figure; and tidy the diagnosis section's lead, the stray-score **The runs.** paragraph and the `#573` citations.
- `docs/retrieval-eval.md`: Task 4, step 3's paragraph on the persistent compose database.

9 run-artifact files excluded from the reviewed diff.

**What was checked:**
- **Generated region.** Every hunk sits outside the generated region (`<!-- eval:generated:start -->` … `<!-- eval:generated:end -->`). `evals/`, `cli/` and `docs-retrieval-service/` carry no change, so neither `evals/docs-retrieval/floor.json` nor any shipped code moved.
- **Cited anchors.** Every heading, bold anchor and code symbol the new prose cites resolves:
  - `### The deciding figures on pg_textsearch 1.5.1` → `#### How these were taken, on 1.5.1`;
  - `### Route 2 on the fix branch` → `#### The shipped end state at refresh level`, whose TypeScript and Python parts both state 11 of 12;
  - `### The recommendation for the fix branch` → **What shipped.** and **Goal 4's conclusion**;
  - **Observation 2**;
  - the 116 / 276 memtable figures after the Python `self-docs` table;
  - the `not captured` cells and "Run 1 wrote no capture";
  - `evals/docs-retrieval/bm25-history.mjs` → `openPgliteEngine`, and `evals/docs-retrieval/python-backend.mjs` → `assertPythonBackendAvailable`;
  - `docs/retrieval-eval.md` → `## How to run it` and `### Writing the comparison up`, whose launcher the scratch comparison launcher mirrors;
  - the compose project name `harness-docs-retrieval` with its `harness` / `docs_retrieval` credentials;
  - `harness-docs-retrieval` 0.1.0;
  - the floor cells, arm B MRR 0.55 and arm D MRR 0.65 recorded 2026-10-21.
- **The fresh reading's own figures.** Its per-query counts (B 12, C 6, D 7, E 11 of 12) agree with its "6, 5 and 1 of the 12" summary.
- **`#573` provenance.** It is stated once in the comparison section (item 3) and once in the diagnosis lead, and the recommendation's lead-provenance bullet now excepts it.
- **Wall-clock figures.** None was taken, and every recorded one carries its 1.3.1 note.

**Pass 0:** the grep sweep list is an unfilled stub, so that half is a configuration gap and ran nothing. The diff adds no exported symbol, so the caller check had nothing to check.

**Tests and parity:** the diff is prose only, so no accompanying test is owed. `phases.parity` is `false`.

**Pass 2:** the supplied `per_task_findings_root` does not exist, so it carried nothing over.

Two findings remain. Both are wording corrections in `docs/retrieval-eval-results.md`.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands, and only the committing role flips a marker: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else are informational, and the committer never touches them.

Each entry resolves to `harness-runs/code_reviews/chore_docs_retrieval_backend_comparison_record_code_review/finding_<K>.md` through its `**Finding K**` reference.

1. [x] **Finding 2** — Call mechanism 1's `before` readings "the before-fix end state", not "the shipped end state" _(layer: general)_
2. [x] **Finding 1** — Name the fresh reading's arm C to E differences as unexplained beside their measured candidate _(layer: general)_

---

## Must Fix

None.

---

## Should Fix

### 1. The fresh reading's arm C to E differences are given a "measured candidate" but not named as unexplained
→ [finding_1.md](chore_docs_retrieval_backend_comparison_record_code_review/finding_1.md)

### 2. Divergence source (3)'s mechanism 1 bullet calls the before-fix state "the shipped end state", two bullets above the post-fix "shipped end states"
→ [finding_2.md](chore_docs_retrieval_backend_comparison_record_code_review/finding_2.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
