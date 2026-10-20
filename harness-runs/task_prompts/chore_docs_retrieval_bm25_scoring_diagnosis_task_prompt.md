`chore_docs_retrieval_bm25_scoring_diagnosis` measures why the docs-retrieval BM25 scores depend on the index's state, on both backends, and ends with a recommended fix route for the maintainer to decide. It changes no shipped behaviour: the fix, the Python port and the comparison's record correction are later branches.

**This replaces `fix_docs_retrieval_bm25_index_history`, which stopped at its first task.** That branch planned to fix the history dependence with a `REINDEX` after a refresh that leaves dead rows. Its probe then showed the rule cannot make a refreshed index score like a fresh one in the score the store actually ranks by. Reading the `pg_textsearch` source then showed why. The defect it set out to fix is still real. Read `docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → the paragraph opening **Finding — a defect, recorded and not acted on.**, and `### Divergence sources, in the order checked`, item 3, before planning.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** The planner and the reviewers re-verify each lead against the live code and the `pg_textsearch` 1.3.1 source. A lead becomes a figure of record only when this branch's committed probe measures it.

---

## What carries over

- **The probe.** `evals/docs-retrieval/bm25-history.mjs`, from `fix_docs_retrieval_bm25_index_history` (commits `78731f0` and `234162d2`). It scores two columns per statement:
  - `scan` is `bm25_get_current_score()`, the score the index scan ranked the row by.
  - `operator` is `round((text <@> …)::numeric, 6)`, the standalone operator.

  It also has a `--compare` flag that names one-run strays from captures. Its gitignored captures are under `harness-runs/scratch/bm25-history/`. If the probe is not on this branch, take it from those commits.
- **Its stop record**, `harness-runs/task_plans/fix_docs_retrieval_bm25_index_history/task_1_plan.md` → `**Deviations from plan:**`, on that branch. After `REINDEX`, `operator` matched a fresh index on all four runs of record and `scan` did not. On `fixture-catalog`, 136–137 of 219 hits differed; on `self-docs`, 1942–1943 of 5189. The largest difference was 0.394, the same on PGlite and on Postgres 18.2.
- **What a bare `BM25_ORDER_CLAUSE` column reads.** It is not replaced by `bm25_get_current_score()` in the probe's statement: it projects the operator. Every figure taken before that probe read the operator, never the score the store ranks by.

## The two mechanisms, as far as they are known

1. **Deleted rows stay in the statistics.** A `DELETE` or `UPDATE` never reaches the index, so `total_docs` and `total_len` keep counting dead rows. `VACUUM` subtracts them only when every document in a segment is dead. `REINDEX` rebuilds the statistics from live rows. A refresh deletes the other corpus's keys, so "rows from other corpora" and "deleted rows still counted" are one defect. The earlier probe measured this with the `operator` column only.
2. **Exact and quantized document lengths in one index.** The index scan scores rows still in the memtable with their exact length. Rows in a segment, and the `<@>` operator, use the Lucene-style fieldnorm length, which is exact up to 39 tokens and up to about 6% off above that. So a row's ranking score changes when the memtable is spilled, with no change to the data. A memtable spill happens on the size threshold, on `VACUUM`, on a PGlite reopen and on `bm25_spill_index()`. A fresh `docs index` inserts into an existing index, so it ranks from the memtable. This was reported upstream as `timescale/pg_textsearch#573`, with a reproduction on Postgres 18.2 and 1.3.1. The same lines are unchanged at `v1.5.1`, so upgrading does not remove it.

**Still unexplained:** the index scan's occasional stray score on the compose Postgres, one (query, key) value per ~300 queries that no other run returns. It is described under `## A second defect, found while implementing Task 1` in the earlier branch's task prompt. Also unexplained: the hits that still differ between `scan` and `operator` after `REINDEX` — 15–17 of 219 on `fixture-catalog`, 540–563 of 5189 on `self-docs` — and two `REINDEX`es of the same rows differing by 1e-6 on one hit.

## The goal

1. **Measure mechanism 2 on both engines.** With the committed probe, show on PGlite and on the compose Postgres that `scan` equals `operator`, or record how it does not, in each of these index states:
   - a fresh-insert index, where the rows are in the memtable;
   - the same index after `bm25_spill_index()`;
   - the same index after `REINDEX`;
   - a `CREATE INDEX` over an already-loaded table.

   Check whether PGlite exposes `bm25_spill_index()` at all.
2. **Explain the residual differences after `REINDEX`,** or record them as unexplained with their counts and largest values. That covers the 15–17 and 540–563 hits, and the 1e-6 difference between two `REINDEX`es.
3. **Trace the stray score** to a reproducible sequence of statements recorded beside the figures. Check it against `timescale/pg_textsearch#557` (a wrong top-N before the memtable is spilled, open on 1.3.1 and 1.5.1) and `#516` (the score changes within a statement when the index changes; fixed after 1.4.0, so 1.3.1 lacks the fix). Check whether it disappears once the rows are in a segment.
4. **Explain the near-tie ordering on an empty database,** or record it as still unexplained. On that database, `q-fc-token-lifetime` and `q-fc-unreadable-label` order a near-tie pair against the score the operator returns. The lead is mechanism 2: the store ranks by `scan`, and the recorded scores are `operator`.
5. **Measure a candidate end-state rule on both engines.** The rule:
   - after a refresh that left a dead row, `REINDEX INDEX chunks_bm25`;
   - after any other refresh that changed something, `bm25_spill_index('chunks_bm25')`;
   - the first `docs index` build ends in the same state.

   Show whether a refreshed index then scores, in the `scan` column, the same as a freshly built index of the final corpus, whatever the database held before. The fresh index is built one of the ways goal 1 shows equal to the others. Take this with the refresh-level sequence: `docs index` into a data directory, then a refresh after deletes. The same sequence also gives the before-fix figures, while the code is still unfixed.
6. **Measure whether either mechanism moves relevance.** Run the existing relevance eval's deterministic figures through the existing launchers on the TypeScript backend in three states:
   - a database that held another corpus first;
   - a fresh-insert index of the same corpus;
   - that index after a spill.

   Report which recorded relevance figures change and by how much. Report also when nothing changes: that answers whether the exact-against-quantized split matters for ranking quality, or only for score parity.
7. **Write it up and recommend a route.** Add the measurements to `docs/retrieval-eval-results.md`, each beside the statement and setup that produced it. Then write a recommendation for the fix branch. Either the candidate rule of goal 5 holds, or another route is named, or the findings show `pg_textsearch` cannot give stable ranking scores on this workload — in which case evaluating another lexical engine becomes its own research step. Name which goals' figures decided it.

## Constraints

- **Change no shipped behaviour.** `cli/src/retrieval/` and `docs-retrieval-service/src/` are read, not edited. Probes, captures, eval runs and documents only.
- **Never score with the index scan disabled,** in a probe or a measurement.
- **Do not work around an extension defect.** If the stray score or the residual differences trace into `pg_textsearch`'s own code, record the reproducible sequence and the figures. Do not retry, re-score, average or apply a tolerance. Do not file or comment on upstream issues: the maintainer does that.
- **Do not retune** the abstention threshold, the floor, `k` or any fusion weight. Leave `harness.config.json` alone, and change no corpus or query set.
- `scripts/run-gates.sh` must still pass on a machine with no Docker and no Python weights.
- **The work needs Docker** (`docker compose up -d --wait postgres` from `docs-retrieval-service/`) **and the Python weight cache.** If either is missing, stop and say so rather than improvising an install.
- **Every statement and probe that produces a figure in a document of record is recorded beside the figure,** with its setup, so it can be re-run. **Wall-clock figures** enter a document of record only from an operator's hand run on an idle machine (`harness-runs/lessons.md` → `## Evidence and measurement`).

## Out of scope

- The fix itself, on either backend, and its tests. Those are the next branch, from this branch's recommendation.
- Correcting the backend comparison's existing paragraphs, and re-taking its `@python` arms.
- Evaluating a replacement for `pg_textsearch`. If goal 7 recommends it, that is a separate, supervised research step, because unattended runs have no web access.
