### Task 11 — Add `evals/docs-retrieval/arm-a/spread.mjs`: per-repetition, per-half and far/near figures across a variant's transcripts

**Goal:** Give the run one committed, re-runnable module that turns a variant's five transcripts into every figure the task prompt's `## The arm A runs` and `## What to deliver` item 3 require — per-repetition recall@5 and MRR pooled and per half, the median and p95 across repetitions of latency and token cost, the share of negatives answered `none` split `far` / `near`, per-query token use, tool-call counts, and the queries whose answers moved between repetitions — and that computes the same breakdown for arm E's records, so both sides of every bar come from the same code.

**Depends on:** Task 4 (`loadQueries` records carry `negativeKind` on negatives, `labels[].grade` and `ref`; `evals/docs-retrieval/queries.mjs` exports `NEGATIVE_KINDS = Object.freeze({ far: 'far', near: 'near' })`, the one declaration of that closed set, which this module imports as `import { NEGATIVE_KINDS } from '../queries.mjs'` and never retypes), Task 5 (per-query entries carry `bestRerankScore`), and Task 9, whose transcript records are `{ id, query, refs, durationMs, usage, variant, toolCalls }` — `durationMs` whole-second, `usage` the result event's block verbatim, `toolCalls` counts by tool name. It reuses `evals/docs-retrieval/arm-a/score-transcript.mjs` → `scoreTranscript({ transcript, queries })` (returns `{ records, cost }`) and `evals/docs-retrieval/metrics.mjs` → `scoreArm(records, queries)` and `percentile(values, p)`, never a second copy of either — and `metrics.mjs` → `STRICT_GRADE`, which **Task 6** exports (`export const STRICT_GRADE = 3`, *"the grade a label must carry exactly to count for the strict columns"*), for any test of the answering grade this module makes outside `scoreArm`; `spread.mjs` declares no grade literal. **It also depends on Task 3**, whose `docs/retrieval-eval.md` → `### Two arm A variants, and how they combine` fixes the per-repetition statistics this module computes; read it and compute exactly those.

### Targets

- `evals/docs-retrieval/arm-a/spread.mjs` (new).
- `evals/docs-retrieval/README.md` — one row for it.

**The interface this task produces, which Tasks 19 and 20 call:**

```js
export function partitionOf(query)
//   the first two path segments of the query's label refs: 'docs/expause-web' for docs/expause-web/…,
//   'docs/vite' for docs/vite/…, and 'docs' for a file sitting directly under docs/ (docs/webhooks.md#…);
//   refuses by name a positive whose labels span two partitions; null for a negative.

export function breakdown({ records, queries })
//   records: scoreTranscript's records, runArm's records, or a generated block's perQuery entries (each has id, hits, abstained)
//   -> { pooled: { positives, recallAt5, mrr, strictRecallAt5, strictMrr },
//        byPartition: { [partition]: { positives, recallAt5, mrr, strictRecallAt5, strictMrr } },
//        negatives: { total, answeredNone, [NEGATIVE_KINDS.far]: { total, answeredNone }, [NEGATIVE_KINDS.near]: { total, answeredNone }, unclassed: { total, answeredNone } } }
//        (the far / near keys are built from Object.values(NEGATIVE_KINDS), so they read far and near today; unclassed is this module's own bucket)

export function summarizeVariant({ transcripts, queries, chunkKeys })
//   transcripts: paths in repetition order; chunkKeys: optional Set of the corpus's chunk keys
//   -> { repetitions: [{ path, breakdown, latency: { p50, p95 },            // per-query durationMs, nearest-rank
//                        tokens: { perField: {…}, billedTotal, billedPerQuery }, // billed = input+output+cache_creation_input+cache_read_input
//                        perQueryTokens: [{ id, billed, usage }],
//                        toolCalls: { [name]: count }, queriesUsingTool: { [name]: count },
//                        unresolvedRefs: number | null }],               // refs that name no chunk; null without chunkKeys
//        across: { recallAt5, mrr, byPartition, answeredNoneShare, latencyP50, latencyP95, billedPerQuery }  // each { values, median, p95 }
//        disagreements: [{ id, refsByRepetition }],   // queries whose ordered refs differ between any two repetitions
//        partial: boolean }                            // fewer than five repetitions
```

`median` and `p95` across repetitions use `metrics.mjs` → `percentile` (nearest-rank), so with five values the p95 is the maximum — say so in the header.

**Work:**

- [ ] `spread.mjs`: header with *"The rule this module exists to enforce"* — every arm A figure the hand-written section publishes, and every arm E breakdown beside it, is computed here from the committed transcripts and the generated block, never by hand and never by a second scoring path — then `partitionOf`, `breakdown` and `summarizeVariant` as above. `breakdown` obtains recall and MRR by calling `scoreArm` on the relevant subset of `queries` and `records`, so pooled and per-partition figures are the same code as the table's; the strict columns come from `scoreArm` itself, and wherever the module needs the answering grade directly it imports `STRICT_GRADE` from `../metrics.mjs` rather than writing `3`.
- [ ] Negatives: `answeredNone` counts records with `abstained: true` — for arm A that is the `none` answer `scoreTranscript` already maps to `abstained`; the `far` / `near` / `unclassed` split reads `negativeKind`, keying `negatives` from `Object.values(NEGATIVE_KINDS)` imported from `../queries.mjs` (a negative whose `negativeKind` is absent lands in `unclassed`); no `'far'` / `'near'` literal is written in this module.
- [ ] `evals/docs-retrieval/README.md`: one row for `arm-a/spread.mjs`; no other row.
- **Deviations from plan:** `evals/docs-retrieval/arm-a/score-transcript.mjs` → `readTranscript` is now exported, a file outside Targets. `scoreTranscript`'s records carry neither `usage` nor `toolCalls`, so `summarizeVariant` needs the raw records. Exporting the parser was the way to avoid a second parse of the three transcript shapes. `STRICT_GRADE` is not imported: no grade is tested outside `scoreArm`, so the module has no use for it.

**Verification:**

- A scratch launcher (`bash scripts/scratch-run.sh`) runs `summarizeVariant` over **two copies** of the sample transcript (one with a ref reordered) against `fixture-catalog.jsonl` cut to the sample's three ids: two repetitions, `partial: true`, one `disagreements` entry naming the reordered query, `answeredNone` 1 of 1 negative (`unclassed` or its Task 4 class), token totals equal to the sample's summed usage, and `partitionOf` returning `docs` for each positive.
- `breakdown` over a `runEval` result's arm E records for `fixture-catalog` returns a pooled recall@5 equal to that arm's `metrics.recall[5]`.
- A scratch query set with a positive labelled in two partitions is refused by `partitionOf` naming the id.
- `git grep -nE "grade *[=!<>]==? *[0-9]|'(far|near)'" -- evals/docs-retrieval/arm-a/spread.mjs` returns nothing — no grade literal beside `STRICT_GRADE`, and no `negativeKind` class beside `NEGATIVE_KINDS` — and `git grep -n 'NEGATIVE_KINDS' -- evals/docs-retrieval/arm-a/spread.mjs` shows its import.
