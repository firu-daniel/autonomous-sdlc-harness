### Task 3 — Re-take the history sequence and explain, or record as unexplained, what still differs after `REINDEX`

**Goal:** Meet goal 2 of the task prompt: explain the residual differences after `REINDEX`, or record them as unexplained with their counts and largest values. Three residuals are leads from `fix_docs_retrieval_bm25_index_history`'s stop record (commit `234162d2`, `harness-runs/task_plans/fix_docs_retrieval_bm25_index_history/task_1_plan.md` → `**Deviations from plan:**`):

- after `REINDEX`, 15–17 of 219 `fixture-catalog` hits still differ between `scan` and `operator`;
- after `REINDEX`, 540–563 of 5189 `self-docs` hits still differ;
- two `REINDEX`es of the same rows (`s5` and `s7`) differ by 1e-6 on one hit: `q-sd-second-init` → `.claude/context/cli.md#what-this-layer-owns-and-what-it-is-not`, −7.241028 against −7.241029.

This task re-takes the history sequence with Task 1's diagnostics, so each residual is measured on this branch rather than carried over.

**Depends on:** Task 1 and Task 2.

- **From Task 1** it uses the history sequence: `--sequence history` (the default), `--other`, `--capture`, `--compare`, and each step's diagnostics (a)–(g) from `readIndexState`. Steps `s5` and `s7` are the two `REINDEX INDEX chunks_bm25` steps. Diagnostic (b) is the exact test `Math.fround(scanRaw) === Math.fround(operatorRaw)`, "the operator's value stored as a `real`". Diagnostic (d) is the length-band split, governed by the `Σ length` / `total_len` verdict at `s0`. Capture `score` lines carry `<scan> <operator> <scanRaw> <operatorRaw>`.
- **From Task 2** it uses `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured`, which Task 2 created. This task adds one subsection after Task 2's last one. The launcher file `harness-runs/scratch/bm25-history.mjs` and its commands are `docs/retrieval-eval.md` → `### The BM25 index-state probe` (Task 2's).

**Where this task stops.** It writes only `### What still differs after REINDEX`. The stray score that a repeated run exposes is **Task 4's**. This task names any one-run value it sees and passes it on by name, and does not trace it.

### Targets

- `docs/retrieval-eval-results.md` → a new `### What still differs after REINDEX`, after `### The near-tie ordering on an empty database`.

**Work:**

- [ ] **Runs.** Take the history sequence for both corpus pairs on both engines, twice each, under the compose precondition (`## Context` → **Manual setup required**). If the probe refuses with `is the compose postgres service up?`, stop and report it.
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --engine pglite --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/bm25-history/t3-pglite-fixture-catalog-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --engine postgres --corpus fixture-catalog --other self-docs --capture harness-runs/scratch/bm25-history/t3-postgres-fixture-catalog-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --engine pglite --corpus self-docs --other fixture-catalog --capture harness-runs/scratch/bm25-history/t3-pglite-self-docs-1.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --engine postgres --corpus self-docs --other fixture-catalog --capture harness-runs/scratch/bm25-history/t3-postgres-self-docs-1.txt
  ```
  Take the same four again into `…-2.txt`, and `--compare` each pair. Take every run before editing the document, so the `self-docs` runs share one stamp.
- [ ] **Classify the residuals at `s5` and `s7`**, per run, from the diagnostics:
  - hits with `scan` ≠ `operator`;
  - of those, the operator stored as a `real`;
  - the number differing beyond `real` storage, with the largest value and its key;
  - the length-band split of that remainder, or "withheld" with its `Σ length` / `total_len` pair.

  Then compare `s5` against `s7` hit by hit **on the raw `scan` values** in the captures. That gives the number of hits whose raw values differ, and every such hit with both raw values, the 1e-6 lead's hit included or reported absent. A raw difference between two `REINDEX`es is reported as one. A six-decimal rounding of an identical `real` is reported as identical. If a step's probe plan was not the index scan, use its `forced index scan` reading and say so.
- [ ] **`### What still differs after REINDEX`.** Give one table per run of record: step `s5` and step `s7` × hits; `scan` ≠ `operator`; operator stored as a `real`; differing beyond `real` storage; largest; the length-band split. Add the `s5`/`s7` raw comparison. Name any one-run value from `--compare` with its step, query, key and column, for Task 4. Cite the history sequence's statements from Task 2's setup subsection rather than restating them, and give the four commands by reference to `docs/retrieval-eval.md` → `### The BM25 index-state probe`. State the earlier branch's counts as the leads they were, without comparing them as a before/after pair: they were taken on another `self-docs` stamp and read `scan` before the diagnostics existed.
- [ ] **The conclusion, one per residual**, from this branch's rows only:
  - **"explained by `real` storage"** where diagnostic (b) covers every differing hit;
  - **"consistent with mechanism 2"** where the remainder lies wholly in the `> 39` band, the length verdict held, and the matching `t3` state of Task 2's `fixture-catalog` rows agrees. `fixture-catalog` does not move, so that comparison is not across a stamp. Never cite Task 2's `self-docs` rows here;
  - otherwise **"unexplained"**, with the counts and largest values.

  Do not name a `pg_textsearch` code path as the cause. The source leads stay leads.

**Verification:**

- Each of the three leads has a conclusion sentence, and each sentence cites the row it rests on.
- No `self-docs` figure from this task is set against Task 2's `self-docs` figures, and the earlier branch's counts are labelled as leads.
- Every recorded figure but a named one-run value is reproduced by the second run of its pair.
- `git diff -- docs/retrieval-eval-results.md` adds bytes only inside the new subsection.
