`fix_docs_retrieval_bm25_index_state_typescript` makes the TypeScript backend's BM25 ranking independent of the index's history. Every refresh that changed something ends in the state `REINDEX INDEX chunks_bm25` leaves, and a test pins it.

**This is route 2 of the diagnosis's recommendation.** Read `docs/retrieval-eval-results.md` → `## The BM25 index's state, measured` before planning, in particular `### The recommendation for the fix branch`. Read also `### The deciding figures on pg_textsearch 1.5.1`, which `chore_docs_retrieval_pg_textsearch_upgrade` added beside it. Where the two disagree, the 1.5.1 figures decide. The paragraph **Its standing on pg_textsearch 1.5.1.**, at the end of `### The recommendation for the fix branch`, says whether route 2 still holds. If it says route 2 no longer holds, stop and say so rather than implementing it.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** The planner and the reviewers re-verify each lead against the live code and the recorded figures.

---

## Leads

- **Why route 2 and not the candidate rule.**
  - The candidate rule was: `REINDEX` after a refresh that left a dead row, `bm25_spill_index` after any other refresh that changed something, nothing otherwise. Its verdict held on one backend × corpus pair of four, TypeScript on `fixture-catalog`.
  - On 1.5.1 the spill leaves 3 segments on `self-docs`, which still differ from a fresh single-segment index on 1 hit (PGlite) and 4 (Postgres). On 1.3.1 it left 4 to 6.
  - `REINDEX`, and `CREATE INDEX` over loaded rows, leave one segment. On 1.5.1, every reading after `REINDEX` differs from the reference on 0 hits, on both backends and both corpora. The 9.5e-7 exception the diagnosis saw on 1.3.1 is gone.
- **What the diagnosis did not measure, and this branch measures first.**
  - **Measurement.** Goal 5's six scenarios, on both backends and both corpora, with `REINDEX` issued wherever the candidate rule issued the spill and in the `unchanged` scenario. Grade each against `reference-reindex`, and read the store's `LIMIT 50` plan as goal 5 did.
  - **How.** `evals/docs-retrieval/bm25-refresh-rule.mjs` carries the scenarios and `endStateRule`. Add the variant there rather than a new module.
  - **Real-shape figure.** `harness-runs/lessons.md` → `## Evidence and measurement`, the first rule, asks for the real-shape figure before the design. The diagnosis's corpora were 41 and about 820 chunks. `docs/retrieval-eval-results.md` → `### The real-catalog build — 1,960 chunks, 2026-09-22` records the real catalog.
- **An index the shipped code already built.**
  - An `unchanged` refresh issues nothing, so a database the old code left with memtable rows or several segments never reaches the end state. The diagnosis measured 136 and 109–156 hits differing in that case.
  - The fix decides how it detects such an index and brings it to the end state. The diagnosis measured no detection. One candidate is to read the index's summary before deciding. Another is to always end a refresh in the `REINDEX` state when the index is not already a single segment with no memtable.
- **The Seq Scan plan below the crossover. This is the risk route 2 carries.**
  - After `REINDEX`, the index's statistics describe its rows.
  - On `fixture-catalog` (41 chunks), the diagnosis saw the store's `LIMIT 50` plan turn to `Seq Scan on public.chunks` after the rule's `REINDEX` (`### The candidate end-state rule, at refresh level`, **Observation 1**).
  - `docs/retrieval.md` → `## Still open`, the bullet opening **Whether the lexical arm filters to matching chunks on every index.**, records why that matters. Below a crossover of 63 rows, re-measured on 1.5.1 and unchanged (`#### The lexical-plan crossover, on 1.5.1`), that plan returns non-matching rows at score `0`.
  - The fix must make `lexicalSearch` return only matching chunks on that plan too, and pin it. A row at score `0` carries no lexical evidence, so filtering it out is the defect's fix, not a retune.
  - The diagnosis ran no relevance figure on that plan, so measure it.
- **The relevance figures this will move, and the floor.**
  - On `fixture-catalog`, the index state route 2 leaves scored, in the diagnosis's after-spill run, arm B MRR 0.602 and arm D MRR 0.704. Fresh-insert scored 0.657 and 0.759.
  - Recall@1 fell by one query in each arm, the `q-fc-token-lifetime` near-tie pair (`### Whether either mechanism moves relevance`, **The answer.**).
  - Gate 11's floors in `evals/docs-retrieval/floor.json` are B `mrr` 0.6 and D `mrr` 0.7, so the expected margin is a few thousandths.
  - The recorded `self-docs` block is not a usable baseline. It was taken on a 213-chunk corpus, the corpus is now about 826 chunks, and 23 of its 36 figures already differ before any fix (`#### The relevance eval's deterministic figures, on 1.5.1`). The upgrade branch's 1.5.1 run lives only in a gitignored scratch file. So take the deterministic figures on both corpora at this branch's base commit, before the fix, and grade the fix's movement against that run.
  - The fix changes the store's ranking, which is a change to what the search modes return. If the measured figures move, re-record the floors in the same commit as the change, with the reason, per `docs/retrieval-eval.md` → `## The regression floor` → **The same-commit re-record rule.**. Never lower a floor in a commit of its own.
- **The vector arm with dead rows.**
  - In the diagnosis's held-another state on `fixture-catalog`, arm C (vector, `chunks_hnsw`) returned 3 refs instead of 5 for `q-fc-verify-callback`, and 0 instead of 5 for `q-fc-negative-lattice`. This is recorded as unexplained in `### Whether either mechanism moves relevance`.
  - Hypothesis, unverified: the HNSW scan filters out dead tuples after its candidate limit, so a refresh that deleted rows can return fewer than `k`.
  - Measure arm C after a refresh with deletes, before and after the fix's end state. If ending the refresh with `REINDEX INDEX chunks_hnsw`, or another statement, restores full lists, decide with the figures whether it belongs in the same end state.
- **The rebuild's cost** is not measured. An operator's hand run through the probe's `--reindex-cost` seam supplies it (`docs/retrieval-eval.md` → `### The BM25 index-state probe`). `REINDEX INDEX` takes an `ACCESS EXCLUSIVE` lock on the index for its duration.

## The goal

1. **Take the measurement above first**, and record it beside the diagnosis's figures.
2. **Implement route 2 in `cli/src/retrieval/`.** Every refresh that changed something, and the first `docs index` build, ends in the state `REINDEX INDEX chunks_bm25` leaves. A database the shipped code left is brought to that state as the measurement decides. `lexicalSearch` returns only matching chunks on every plan.
3. **A test that fails before the fix and passes after it,** where the CLI's tests already run.
   - It builds an index, changes and removes documents, refreshes, and compares the ranking scores with those of a freshly built index of the final corpus. The ranking score is `bm25_get_current_score()`, not the operator.
   - Show it failing with the fix removed.
   - Add a second case for the Seq Scan plan below the crossover.
4. **Re-run the relevance eval's deterministic figures** on both corpora. Report every figure that moved against the before-fix run at this branch's base commit, and re-record the floor as above if it moved.
5. **Update the behaviour documents:**
   - `docs/retrieval.md` → **Incremental refresh.**;
   - the lexical-arm bullet under `## Still open`, which this branch closes or narrows;
   - the diagnosis section's recommendation, with a line saying what shipped.

## Environment preconditions

Check both before the first task that measures. Two dispatches on the upgrade branch stalled on them.

- The Python backend's measurements need the `models` extra in this checkout's own environment: `bash scripts/python-service.sh sync --with-models`. The environment is per checkout, so a new worktree needs its own sync.
- The compose Postgres must run the rebuilt `docs-retrieval-service/postgres` image on `pgvector/pgvector:0.8.7-pg18`, PostgreSQL 18.6, with `pg_textsearch` 1.5.1 and `vector` 0.8.7 available.
- A bare `bash scripts/python-service.sh run self-check` reports `FAIL index` when `HARNESS_DOCS_RETRIEVAL_DATABASE_URL` is unset. That is expected. The `--backend python` path's own availability check is the one that counts.

## Constraints

- The TypeScript backend stays the default, and its search behaviour changes only to fix this defect.
- **Never score with the index scan disabled.** Forcing the index scan for a measurement, as the probe's `SET enable_seqscan = off` does, is allowed.
- Do not work around an extension defect with a retry, re-score, average or tolerance.
- The `operator` stray score is gone on 1.5.1 (`#### The stray index-scan score, on 1.5.1`), so do not design around it. What empties the memtable under a read-only workload, moving each memtable row's `scan` value once, is still unexplained.
- **Do not retune** the abstention threshold, `k` or any fusion weight. A floor re-recorded under **The same-commit re-record rule.** is not a retune.
- `scripts/run-gates.sh` must pass with no Docker and no Python weights.
- Wall-clock figures come only from an operator's hand run.

## Out of scope

- The Python service's port (`fix_docs_retrieval_bm25_index_state_python`).
- The backend comparison's record (`chore_docs_retrieval_backend_comparison_record`).
