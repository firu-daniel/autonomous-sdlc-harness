### Task 10 — Re-take the `@python` blocks and correct the comparison's record

**Goal:** Meet goal 6. Re-take the deterministic figures the fix changes by re-running both `@python` blocks through the existing launchers, so arms B, D and E are re-taken from the blocks themselves. Then correct every site in `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` that described the defect, to what this branch measured and fixed. Every wall-clock figure in the write-up stays as recorded, stating that it predates the fix (story index → `## Context`, **The re-take, decided with the maintainer.**; `## Scope register`, rows 1–5).

**Depends on:** Tasks 1, 2, 3, 4 and 9, whose parts of `### The index's history, measured` are what the corrected sites cite: the statement-level cause (Task 1), the stray score's source (Task 2), the before-fix and after-fix refresh figures on both backends (Tasks 4 and 9), and the near-tie outcome (Task 3). It also depends on Tasks 5 and 7, which ship the fix on both backends.

### Targets

- `docs/retrieval-eval-results.md`: the `eval:corpus:fixture-catalog@python` and `eval:corpus:self-docs@python` generated blocks, re-taken, and the hand-written sites listed below.

**Work:**

- [ ] Re-take: follow `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, steps 2 and 3, for `--backend python` only, over both corpora, into a scratch results copy. Move the two blocks in with `results.mjs` → `transplantCorpusBlock`, as step 2 describes. Do **not** empty the compose database first, and record that in `harness-runs/scratch/backend-comparison/host.txt`: after the fix, the database's history must not change the result. The `@typescript` blocks are not re-taken, because the TypeScript runner builds a fresh in-memory index on every run, so the fix changes none of its figures.
- [ ] Re-render the comparison from the four blocks through `renderBackendComparison`, following `docs/retrieval-eval.md` → `### Writing the comparison up`, and replace the Python rows of both `### Relevance, side by side` tables and the whole per-query agreement table. In those tables, the p50 and p95 columns of the Python rows keep the 2026-10-08 values, because the re-run blocks were not taken on an idle machine, and a sentence above the tables says so. The re-run blocks' own latency columns are cited nowhere.
- [ ] Rewrite the history sites:
  - item 3's **What it shows.** and **What stays unexplained.** (the latter from Task 3's outcome);
  - item 4's **Arms D and E** bullet, which now separates the index's history (removed) from model precision (what remains);
  - `### Which case this is`, including its identified and unexplained bullets, re-graded against the new per-query table;
  - the **Finding — a defect, recorded and not acted on.** paragraph, which becomes the finding and the fix, citing `### The index's history, measured`, the rule, and both tests (`cli/test/docs-retrieval-bm25-history.test.mjs` and `docs-retrieval-service/tests/test_refresh_bm25_history.py`).

  Keep every statement and setup item 3 records, because they are the comparison's own probe.
- [ ] The wall-clock note: one sentence in `### What was compared, and through what` → **The host and the date.** saying that every latency, cold-start, footprint and agent-session figure in this section comes from the 2026-10-08 sitting and predates the fix. Transcribe the rebuild cost into `### The index's history, measured` **only** from `harness-runs/scratch/bm25-history/reindex-cost.txt`, the operator's hand capture (story index → `Manual setup required:`). If that file does not exist, write that the rebuild's cost was not measured by hand, rather than taking a figure in this session.

**Verification:**

- The scope-register derivation command, re-run, reaches rows 1–5. Each row's sentence now states what was measured and fixed, and none of them says the history is unmeasured, inferred or unfixed.
- The Python rows' recall and MRR figures and the per-query agreement table match the re-rendered comparison exactly. Arm B's same-order counts are expected to rise towards the empty-database probe's 10 of 12 on `fixture-catalog`. The figure recorded is whatever the re-render says, with no retuning of the threshold, the floor, `k` or any fusion weight (task prompt → `## Constraints`, second bullet).
- `node evals/docs-retrieval/check-floor.mjs` is reached through `bash scripts/run-gates.sh` gate 11, which still passes, because the unlabelled blocks it grades are untouched.
- `bash scripts/run-gates.sh` passes.
