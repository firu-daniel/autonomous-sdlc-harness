### Task 8 — Compare two backends' blocks side by side, per query and against the floor, in `backend-comparison.mjs`

**Goal:** Turn a corpus's `@typescript` and `@python` blocks into the comparison the write-up reports. It produces per-arm recall@1/3/5, MRR, strict recall@5, strict MRR and p50/p95 for each backend side by side; the recorded floor, for `fixture-catalog`; every query whose result differs between the backends, per arm; arm B's agreement on its own, since arm B has no model and any difference there is the store's; and the abstention sets at the calibrated threshold with every mismatch enumerated. It **refuses** a pair that was not taken over the same corpus. Every figure is read off the blocks' machine halves. Nothing is recomputed from a different source and nothing is averaged away.

**Depends on:** Task 2 and Task 4. Task 2's `results.mjs` → `readCorpusMachineHalf(text, blockId)` reads a block by its id, and its `backends.mjs` → `corpusBlockId(corpusId, backend)` gives `<id>@typescript` / `<id>@python`. The machine half is `{ corpus, backend, snapshot: { files, chunks }, abstainScoreThreshold, embedder, reranker, k, repeat, queries, generatedAt, host, node, arms: [{ arm, mode, ran, embedCalls, rerankCalls, metrics: { recall, mrr, strict, latency, perQuery: [{ id, negative, abstained, bestRerankScore, hits: [{ ref, score }], rank?, strictRank?, durationMs, warnings }] } }] }`. Task 4's `--backend` is what writes those blocks. For `evals/docs-retrieval/README.md` only, it also depends on Task 7, the last task to edit that file before this one.

**Where this task stops.** It names no case and states no cause. The three-case verdict and every cause are **Task 10's** to write, from this module's output and Task 6's. It reads the floor and changes nothing about it. `check-floor.mjs` keeps grading the unlabelled TypeScript run.

### Targets

- `evals/docs-retrieval/backend-comparison.mjs` (new).
- `evals/docs-retrieval/check-floor.mjs` — `export` added to `METRICS` and `loadFloor`, with no other change.
- `evals/docs-retrieval/README.md` → `## The modules` — a new `backend-comparison.mjs` row (scope register row 30; the `check-floor.mjs` row is register row 23, `no-change`).

**The interface this task produces — Tasks 9 and 10 restate it:**

```
compareBackends({ resultsText, corpusId, floorPath })
  -> { corpusId, snapshot, sides: { typescript: { embedder, reranker, host, node, generatedAt, repeat },
                                    python: { … } },
       arms: [{ arm, mode, typescript: <metrics row>, python: <metrics row>, floor: [{ metric, value, typescript: 'met'|'short', python: 'met'|'short' }] | null,
                rankChanges: [{ id, typescriptRank, pythonRank }], refOrderChanges: [{ id, typescript: string[], python: string[] }] }],
       armB: { agreeing: number, total: number, differing: [{ id, typescript: string[], python: string[] }] },
       abstention: { threshold, typescript: string[], python: string[], onlyTypescript: [{ id, negative, typescriptScore, pythonScore }],
                     onlyPython: [ … ], inconsistent: [{ backend, id, abstained, bestRerankScore }] },
       rerankDelta: { p50, max, largest: [{ id, typescriptScore, pythonScore }] } }
renderBackendComparison(comparison) -> string
```

**Work:**

- [ ] **Header and inputs.** *"The rule this module exists to enforce"*: a comparison is between two blocks taken over **the same corpus snapshot**, and every difference is enumerated by query id, not summarised away. `compareBackends` reads both machine halves with `readCorpusMachineHalf(resultsText, corpusBlockId(corpusId, backend))` for `typescript` and `python`. It refuses by name when either block is absent, when the two `snapshot`s differ (*"not a pair: the corpus moved between the two runs"*, quoting both stamps), when `k` or `repeat` differ, or when the two `abstainScoreThreshold`s differ. The arm set is walked from `arms.mjs` → `ARMS` for the entries with a `mode`, so no arm letter is typed here.
- [ ] **The floor.** In `check-floor.mjs`, add `export` to `const METRICS` and to `function loadFloor`, and change nothing else. Its exit statuses and its graded run are unchanged, so gate 11 behaves identically. `compareBackends` loads `floorPath` (default `check-floor.mjs` → `FLOOR_PATH`) through `loadFloor`. For the floor's own corpus (`FLOOR_CORPUS`) it grades each backend's metric with `METRICS[metric].read` against `value`: `met` when `>=`, matching check-floor's rule, and `short` otherwise. For any other corpus `floor` is `null`. Nothing is retyped from `floor.json`.
- [ ] **Per-arm and per-query differences.** For each arm, the side-by-side metric rows are `recall[1]`, `recall[3]`, `recall[5]`, `mrr`, `strict.recall[5]`, `strict.mrr`, `latency.p50` and `latency.p95`. `rankChanges` lists positives whose `rank` differs. `refOrderChanges` lists every query whose ordered hit refs differ, negatives included. `armB` is the lexical arm (`mode === 'lexical'`, found by mode, not by letter): its agreeing count over the set, and every differing query with both ref lists. `rerankDelta` comes from the `fused-rerank` arm's `bestRerankScore` per query, as `|ts − py|`, with p50 from `metrics.mjs` → `percentile`, the maximum, and the ten largest.
- [ ] **Abstention.** For the `fused-rerank` arm, take each backend's abstained set by query id. Then take `onlyTypescript` and `onlyPython`, each entry with whether the query is a negative and **both** sides' `bestRerankScore`, so a mismatch states the score on each side of the threshold. `inconsistent` lists any entry, on either side, where `abstained !== (bestRerankScore !== null && bestRerankScore < threshold)`. It is reported, not refused: it would mean a backend applies a different threshold or rule from the one its block records, and that is a finding for the write-up.
- [ ] **Render, and the README row.** `renderBackendComparison` prints Markdown: a header naming the corpus, snapshot and both sides' ids and hosts; one side-by-side table per arm (metric, TypeScript, Python, floor where graded); the arm B paragraph; the abstention sets and the two mismatch lists as tables; the rerank-delta summary; and the per-arm rank and ref-order change lists in full. Add the README row: *two backends' blocks for one corpus compared side by side — metrics, floor, every per-query difference, arm B on its own, and the abstention sets at the recorded threshold.*

**Verification:**

- A scratch launcher writes two fabricated machine-half blocks into a scratch copy of the results file through `results.mjs` → `rewriteGeneratedRegion`. They are built by running `runEval` with `--backend typescript` twice over `fixture-catalog`, or by copying one block under both ids. The launcher calls `renderBackendComparison(compareBackends({ resultsText, corpusId: 'fixture-catalog' }))` and is run with `bash scripts/scratch-run.sh harness-runs/scratch/comparison-probe.mjs`. With identical sides, every change list is empty, `armB.agreeing === armB.total`, both abstention-only lists are empty, `inconsistent` is empty, and every floor cell reads the same on both sides.
- In the same launcher, edit one perQuery entry's hits on the Python side of the scratch copy. The change appears in `refOrderChanges` (and in `armB.differing` when it is the lexical arm). Changing one side's `snapshot.chunks` makes `compareBackends` refuse with the *"not a pair"* message quoting both stamps.
- `git diff -- evals/docs-retrieval/check-floor.mjs` shows two added `export` keywords and nothing else.
