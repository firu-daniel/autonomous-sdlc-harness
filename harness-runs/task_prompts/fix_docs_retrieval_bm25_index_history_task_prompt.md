`fix_docs_retrieval_bm25_index_history` finds out why the Python docs-retrieval backend's lexical (BM25) scores depend on what its database held before, fixes it, and measures whether the TypeScript backend's persistent index has the same problem.

**This comes after `feat_docs_retrieval_backend_comparison`**, which found the defect and recorded it without acting on it. Read `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` before planning. The finding is the paragraph that opens **Finding — a defect, recorded and not acted on.**, and the evidence is under `### Divergence sources, in the order checked`, item 3 (**BM25 tokenization — not the cause; the index's state is.**), which records the probe's exact statement and setup.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** It was written on 2026-10-08 from the comparison's write-up, not from verified source or documentation. The planner and the reviewers must re-verify each lead against the live code and the `pg_textsearch` source or documentation, and must agree on the design themselves.

---

## What is already measured

- **Same configuration on both sides.** Both stores issue the same BM25 statements (`cli/src/retrieval/store.ts` and `docs-retrieval-service/src/harness_docs_retrieval/store.py` → `BM25_INDEX_DEFINITION`, `BM25_ORDER_CLAUSE`). `pg_textsearch` is 1.3.1 on both, and both plans use the `chunks_bm25` index scan.
- **The compose database, after it had held other corpora.** Over `fixture-catalog`, the Python scores differ from TypeScript's on every query that returns hits. On `q-fc-route-choice`, the top hit `docs/routing.md` scores −17.528924 on Python against −9.200331 on TypeScript. The table's serial ids started at 705.
- **A database created empty.** Every chunk listed on both sides scores the same to six decimals, and the top five ordered refs agree on 10 of 12 queries.
- **Inferred, not measured.** The BM25 statistics still count rows that a refresh deleted. That was inferred from the refresh's delete-and-insert path.
- **Unexplained.** On the empty database, two queries order a near-tie pair against the score the operator itself returns (`q-fc-token-lifetime`, `q-fc-unreadable-label`), while TypeScript orders both by score.
- **Not measured at all.** Whether the TypeScript backend's persistent per-checkout index, which is refreshed the same way, carries the same dependence.

## The goal

1. **The cause is measured, not inferred.** Show what in the index's state makes the scores differ: deleted rows still counted in the corpus statistics, rows from other corpora, or something else. Show it with a reproducible sequence of statements and the scores before and after each step.
2. **The Python backend is fixed.** A refresh, or a re-index of the same corpus, yields the same BM25 scores as a fresh index of that corpus, whatever the database held before. State which of the routes under **Leads** the fix takes, and why.
3. **The TypeScript backend is measured the same way.** Run the same sequence against the TypeScript persistent index (`docs index` into a per-checkout data directory, then a refresh after deletes). If it carries the dependence too, fix it on this branch with the same rule. If it does not, record the measurement that shows it does not.
4. **A test pins it.** On each backend that had the defect, a test fails before the fix and passes after it. The test builds an index, changes or removes documents, refreshes, and compares the scores with those of a fresh index of the final corpus. It must run where that backend's existing tests run. The Python one sits beside the package's own tests and needs the compose Postgres, like the other container tests.
5. **The near-tie ordering is explained or recorded.** Either find why two queries on an empty database order a near-tie pair against the operator's returned score, or record it as still unexplained with the two queries and their scores.
6. **The comparison's record is corrected.** Update the defect paragraph and item 3 in `docs/retrieval-eval-results.md` to what this branch measured and fixed. Re-take only the deterministic figures the fix changes, meaning the arm B per-query comparison, through the existing launchers. Leave every wall-clock figure as recorded, and say that it predates the fix.

## A second defect, found while implementing Task 1 (2026-10-08)

The first implementation attempt's probe found that the score statement sometimes returns a wrong score on the compose Postgres. The statement runs as a `chunks_bm25` index scan. In five runs of `self-docs` against `fixture-catalog`, three runs each had exactly one (query, key) pair scoring differently from every other run:

- `q-sd-search-abstains` → `docs/analyze.md#8-how-this-is-verified`: −0.221485, against −0.735353
- `q-sd-cross-asset-reference` → `docs/github-run-control.md#5-lifecycle-comments-and-state-labels`: −0.341426, against −1.891997
- `q-sd-analyze-writes` → `docs/development.md#7-releasing`: −1.629181, against −4.567675

On one unchanged table, 20 queries run 15 times each gave one wrong score through the index scan. With `SET enable_indexscan = off` they gave none, and three runs per engine matched exactly. PGlite showed no wrong score in these runs. These figures come from the first attempt's probe (`evals/docs-retrieval/bm25-history.mjs`) and its gitignored captures under `harness-runs/scratch/bm25-history/`. They are leads, not figures of record.

This matters to this branch because goal 4's Postgres test compares refreshed scores with fresh-index ones, and a wrong score fails that comparison at random.

**What is wanted:**

1. **Keep the index scan.** The store scores through it, so the probe and every test score through it too. Turning it off is not a fix and not a measurement setting.
2. **Find where the wrong score comes from**, with a reproducible sequence recorded beside the figures as goal 1 requires. Check whether it is the same mechanism as the near-tie ordering in goal 5.
3. **If the cause is in this repository** (our statements, our configuration, or how our stores call the extension), fix it on this branch and pin it with a test on each affected backend.
4. **If the cause is in `pg_textsearch` itself, stop and ask the maintainer how to proceed.** Do not plan or implement a workaround: no retry, no re-scoring, no averaging, no tolerance. This holds at planning time and again during implementation, if that is when the cause becomes clear.

## Leads (re-verify every one)

- **How `pg_textsearch` keeps its statistics.** Research whether its BM25 index holds corpus-level statistics (document count, average length, term frequencies) that a `DELETE` does not decrement until a `VACUUM`, a `REINDEX`, or never. Check the extension's documentation and source for 1.3.1. The answer decides the fix.
- **Candidate fixes, to be weighed rather than assumed:**
  - `REINDEX` the BM25 index after a refresh that deleted rows, or rebuild it on every refresh. Measure the cost on `self-docs`.
  - `VACUUM` the table after a delete-heavy refresh, if the extension's statistics follow it.
  - Index each corpus into its own table or database, so other corpora's rows never share statistics. This is the eval-only route the defect paragraph names ("the eval should index into an empty database"). It fixes the eval but not an adopter's refresh, so on its own it does not meet goal 2.
- **Rows from other corpora.** The Python route indexes every corpus into one persistent database. Check whether chunks of a corpus the eval indexed earlier are still present when the next corpus is indexed, or only their statistics are. Those are two different defects with two different fixes.
- **PGlite.** The TypeScript side runs `pg_textsearch` inside PGlite. Check whether a persistent PGlite data directory behaves like the server under the same delete-and-refresh sequence. Measure it rather than assuming either way.

## Constraints

- The TypeScript backend stays the default. Do not change its search behaviour except to fix this same defect, if goal 3 finds it there.
- Do not retune the abstention threshold, the floor, `k`, or any fusion weight. A fix that changes a recorded relevance figure is reported as a change to that figure, never absorbed by retuning.
- Never score with the index scan disabled, in a probe, a test or the store.
- Leave `harness.config.json` alone, and change no corpus or query set.
- `scripts/run-gates.sh` must still pass on a machine with no Docker and no Python weights. New container tests are skipped there, as the existing ones are.
- The work needs Docker and the Python weight cache. If either is missing, stop and say so rather than improvising an install.
- Every statement and probe that produces a figure in a document of record is recorded beside the figure, with its setup, so it can be re-run. That rule is why the comparison's item 3 records its probe.
