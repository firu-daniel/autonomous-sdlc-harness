# Code review — `feat_docs_retrieval_eval`

**Branch** `feat_docs_retrieval_eval` against `dev`, reviewed 2026-09-21. The whole branch diff: 41 files, +8,482 / −36, over four segments — the `cli` store and threshold change with its new suite (`cli/src/retrieval/{search,store}.ts`, `cli/test/docs-retrieval-store.test.mjs`), the eval runner and its corpora under `evals/docs-retrieval/` (13 modules, one committed fixture catalog, two query sets, the arm A harness), the documentation of record (`docs/retrieval-eval.md`, `docs/retrieval-eval-results.md`, and the edits to `docs/retrieval.md`, `docs/cli.md`, `docs/development.md`, `evals/README.md`, `README.md`, `llms.txt`), and gate 11 in `scripts/run-gates.sh`. **34 run-artifact files excluded from the reviewed diff.**

**Verification run first-hand rather than taken from the branch's word.** `node --test cli/test/docs-retrieval-store.test.mjs` passes 2/2 in 8.2 s and measures the index-scan crossover at **63 rows**, the value the suite records. `node evals/docs-retrieval/check-floor.mjs` exits **0** — *"met every recorded floor — 8 over 4 arms, snapshot { files: 9, chunks: 41 }"* — and reproduces every published `fixture-catalog` recall and MRR figure to three decimals, so gate 11 grades what the results file records. A `self-docs` pass (`--arms B`) refuses no label, so every `ref` in both query sets still resolves on the current tree; that run stamps `{ files: 14, chunks: 194 }` against the region's recorded `{ files: 13, chunks: 177 }`, exactly as the branch's own stamp rule predicts. Acceptance 4 holds: no `provisional` marker and no stale `0.3` survives anywhere for the threshold.

**The headline.** The engineering is in good order — the single-source discipline across the arm table, the label-hygiene refusal, the corpus stamp rule, the three-status gate and the in-process removal and size walk are all done the way this tree's conventions ask, and the documentation is unusually careful about what it does and does not settle. One thing is missing and it is the substantive one: the measurement says the **shipped default mode is the worst-scoring arm on both corpora**, and no document of record says so (Finding 1). The rest is a hostname published into three documents (Finding 2), two measurement passes with no runnable reproduction route (Finding 3), and small parser, pointer and prose repairs. `phases.parity` is `false`, so no parity review ran and no finding cites a reference implementation.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Record the arm D versus arm E result in the file of record _(layer: general)_
2. [x] **Finding 8** — Drop the stray article in the `grade` bullet _(layer: general)_
3. [x] **Finding 6** — Read arm A's letter off the arm table instead of retyping it _(layer: general)_
4. [x] **Finding 4** — Make `--transcript` an explicit case and refuse in `default:` _(layer: general)_
5. [x] **Finding 5** — Say which entry point reads `--floor` _(layer: general)_
6. [x] **Finding 7** — State the 60-second crossover over the cold-build total _(layer: general)_
7. [x] **Finding 11** — ASCII punctuation in the two renderers _(layer: general)_
8. [ ] **Finding 10** — Finish `CHUNKS_TABLE` across the store's statements _(layer: cli)_
9. [ ] **Finding 9** — Cite the measured index size in `## What it costs` _(layer: general)_
10. [ ] **Finding 2** — Replace the recorded hostname with the platform, in code and in the eight committed sites _(layer: general)_
11. [ ] **Finding 3** — Ship the two missing launcher bodies _(layer: general)_

## Must Fix

### 1. The eval's strongest result — the shipped default mode is the worst-scoring arm on both corpora — is in the data and in no document of record
→ [finding_1.md](feat_docs_retrieval_eval_code_review/finding_1.md)

## Should Fix

### 2. The author's machine name is written into three committed documents, and three modules keep putting it back
→ [finding_2.md](feat_docs_retrieval_eval_code_review/finding_2.md)

### 3. Two of the three measurement passes ship with no runnable way to re-run them
→ [finding_3.md](feat_docs_retrieval_eval_code_review/finding_3.md)

### 4. `args.mjs`'s `default:` branch makes the next flag added to `FLAGS` parse as `--transcript`
→ [finding_4.md](feat_docs_retrieval_eval_code_review/finding_4.md)

### 5. `--floor` is documented on the entry point that ignores it
→ [finding_5.md](feat_docs_retrieval_eval_code_review/finding_5.md)

### 6. `score-transcript.mjs` retypes arm A's letter, against the single-source rule three files state
→ [finding_6.md](feat_docs_retrieval_eval_code_review/finding_6.md)

### 7. The 60-second crossover is computed over the refresh phase, while the rule it is applied to is stated over the whole cold build
→ [finding_7.md](feat_docs_retrieval_eval_code_review/finding_7.md)

## Nice to Have

### 8. `docs/retrieval-eval.md`'s grade bullet reads "is a the middle grade"
→ [finding_8.md](feat_docs_retrieval_eval_code_review/finding_8.md)

### 9. `docs/retrieval.md` → `## What it costs` still describes the index without the size this branch measured
→ [finding_9.md](feat_docs_retrieval_eval_code_review/finding_9.md)

### 10. `store.ts` gains `CHUNKS_TABLE` and leaves six statements spelling `chunks` inline
→ [finding_10.md](feat_docs_retrieval_eval_code_review/finding_10.md)

### 11. The two renderers emit typographic punctuation no other prose in the tree uses
→ [finding_11.md](feat_docs_retrieval_eval_code_review/finding_11.md)

## Intentional divergences to confirm

**Empty, and empty by configuration.** `phases.parity` is `false` in `harness.config.json`, and `.claude/context/conventions.md` → `## Reference implementation` states that this project is kept in parity with nothing, so there is no reference behaviour for the diff to diverge from and no finding in this review cites one.

Two things that *look* like divergences from the task prompt were checked and are not, so they are recorded here rather than filed:

- **The `## Still open` lexical entry was reworded rather than removed.** Deliverable 9 says to remove it once the property holds, and `cli/test/docs-retrieval-store.test.mjs` case (a) shows it holding at 40, 166 and 1,024 rows. The entry stays because case (b) measures a second plan in which it does not hold below 63 rows — an index whose statistics describe its rows, after a `REINDEX` or a dump restore. Acceptance 8 asks for the passing case *or* the row count, and the branch ships both; the reworded entry states the residual honestly rather than claiming a closure the data does not support.
- **The shipped `self-docs` figures were taken at a corpus the tree has since outgrown** — `{ files: 13, chunks: 177 }` recorded against `{ files: 14, chunks: 194 }` today, because `docs/retrieval-eval.md` landed after the regeneration. That is the documented consequence of the stamp rule (*"a document added under it joins the corpus that measures it"*), not a stale number: the region carries the stamp of the run that produced it, and Finding 2's fix is deliberately scoped to the `host` field so it does not trigger a regeneration that would replace the published figures with figures over a different corpus.
