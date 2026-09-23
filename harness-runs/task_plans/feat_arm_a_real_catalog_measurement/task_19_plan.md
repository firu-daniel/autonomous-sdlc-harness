### Task 19 — Write arm A's real-catalog figures: every repetition, the spread, the halves and what the arm cost

**Goal:** Fill `## Arm A — the real-catalog hand run`, below its run record, with every figure the task prompt's `## The arm A runs` and `## What to deliver` item 9 require, per variant — computed by `evals/docs-retrieval/arm-a/spread.mjs` from the committed transcripts, never typed from memory — and with what the figures say about the alternative itself: how arm A behaves on a catalog of 156 files, whether A-index grepped, and whether five repetitions are enough.

**Depends on:** Task 11, whose module this task calls:

```js
summarizeVariant({ transcripts /* paths, repetition order */, queries, chunkKeys })
//   -> { repetitions: [{ path, breakdown, latency: { p50, p95 }, tokens: { perField, billedTotal, billedPerQuery },
//                        perQueryTokens, toolCalls, queriesUsingTool, unresolvedRefs }],
//        across: { recallAt5, mrr, byPartition, answeredNoneShare, latencyP50, latencyP95, billedPerQuery },  // each { values, median, p95 }
//        disagreements: [{ id, refsByRepetition }], partial }
breakdown({ records, queries })
//   -> { pooled, byPartition, negatives: { total, answeredNone, far, near, unclassed } }
```

**Also depends on** Task 17 (the committed transcripts at `evals/docs-retrieval/transcripts/gate10-catalog/<variant>-rep<N>.jsonl`, and the redaction / out-of-fence paragraph it appended), Task 18 (the `gate10-catalog` generated block, whose `A-index` / `A-search` rows are repetition 1), and Task 16 (the run record at the top of this section: host, CLI version, model, per-pass window readings and operator time, any checkpoint stop).

### Targets

- `docs/retrieval-eval-results.md` → `## Arm A — the real-catalog hand run` — sub-sections appended after Task 16's run record and Task 17's paragraph. Nothing inside the generated region.

**Work:**

- [ ] **Compute.** A launcher under `harness-runs/scratch/`, via `bash scripts/scratch-run.sh`, loads the approved set with `loadQueries`, builds the `gate10-catalog` index in memory once for its `chunkKeys` (the composition of Task 18's launcher, root from `process.env`), and calls `summarizeVariant` for each variant over its committed transcripts in repetition order. It prints the result as JSON; this task reads that output and writes prose and tables from it.
- [ ] **`### The figures, per variant`** — for each of A-index and A-search: a table with one row per repetition (recall@5 and MRR pooled, per half `docs/expause-web` / `docs/vite`, strict recall@5 and MRR, share of negatives answered `none` split `far` / `near`, per-query latency p50 / p95, billed tokens per query) and a closing row each for the **median** and the **p95** across repetitions (with five values the p95 is the maximum — say so); a variant stopped at the checkpoint is marked **partial** wherever its figures appear. State that the generated rows above are repetition 1 and the median is what `### Two arm A variants, and how they combine` grades.
- [ ] **`### Spread, repetitions and what moved`** — every repetition kept, including an odd one; the `disagreements` list (count, and the ids); whether five repetitions are enough spread for an arm this non-deterministic — if the per-repetition values disagree widely, say so and say what a defensible repetition count would be, from the observed range, rather than averaging it away.
- [ ] **`### How arm A navigated a 156-file catalog`** — per variant: tool calls per query by tool, **whether A-index used `Grep` and on how many queries** (A-index could grep; the task prompt asks whether it did), any out-of-fence tool Task 17 flagged; how often it gave up (`none` on a positive), guessed (refs naming no chunk, `unresolvedRefs`), or answered; and the per-half result read against A-index's index not linking `docs/vite/` — the variant's real behaviour on a mixed catalog, reported, not corrected.
- [ ] **`### What arm A cost to run`** — per variant: billed tokens per field and in total, per query (median, p95), the **five costliest queries** by billed tokens with their ids (the per-query `usage` blocks themselves are the committed transcripts — cite the directory, do not paste them), the 5-hour and 7-day window rise per pass from Task 16's record, and the operator time — beside what the run settled, so the next person deciding whether to re-run it on another catalog has the price. No money figure (the transcript keeps tokens, not a charge).

**Verification:**

- Every number in the new sub-sections appears in the launcher's printed JSON; the repetition-1 figures equal the generated `A-index` / `A-search` rows of the `gate10-catalog` block.
- The section still opens with Task 16's run record and names no path outside this tree; `bash scripts/check-eval-artifacts.sh` prints nothing.
- `git diff` touches nothing between the generated markers.
