### Task 9 — Re-take the refresh-level measurement after the fix and correct the behaviour documents

**Goal:** Show, with the same sequence Task 4 ran before the fix, that a refresh of each backend now scores exactly as a fresh index of the same corpus does. Correct the two behaviour documents whose prose the fix makes stale (story index → `## Scope register`, rows 6 and 7).

**Depends on:** Task 4, which committed the refresh-level sequence in `evals/docs-retrieval/bm25-history.mjs`, with its edit set fixed in the module, and recorded `#### Through the refresh, before the fix`. It also depends on Tasks 5 and 7, which ship the rebuild in `refreshIndex` and `refresh_index` under the rule *a refresh that cleared the table, deleted a key or re-embedded a stored key ends with `REINDEX INDEX chunks_bm25`*.

### Targets

- `docs/retrieval-eval-results.md` → `### The index's history, measured`: a `#### Through the refresh, after the fix` part, beside Task 4's.
- `docs/retrieval.md` → the **Incremental refresh.** paragraph (scope register row 7).
- `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, step 3's paragraph beginning "The Python runs index into the one persistent compose database" (scope register row 6).

**Work:**

- [ ] Re-run Task 4's refresh-level function for `typescript` and `python` on the fixed tree, with the same edit set, capturing under `harness-runs/scratch/bm25-history/`. Record the same columns Task 4 recorded, under `#### Through the refresh, after the fix`: `total_docs` against the live row count, hits differing between the refreshed and the fresh index in each of the two score columns, and the refresh summary line. Zero differing hits in both columns on both backends is goal 2 and goal 3 met. Anything else stops the branch and is reported.
- [ ] `docs/retrieval.md` → **Incremental refresh.**: add the rule in one sentence, saying when the refresh rebuilds the lexical index and why, and cite `docs/retrieval-eval-results.md` → `### The index's history, measured` for the measurement. Say that both backends follow it.
- [ ] `docs/retrieval-eval.md` → step 3's paragraph: replace the statement that a `@python` block's arms B, D and E describe the database's history with what holds after the fix. Keep the instruction to record in `host.txt` whether the database was emptied, because it still documents the sitting.

**Verification:**

- The after-fix part reads zero differing hits in both columns on both backends, from a capture of this run.
- The scope-register derivation command, re-run, still reaches rows 6 and 7. Each row's sentence now describes the fixed behaviour, and no sentence in either file still says the scores depend on the database's history.
- `bash scripts/run-gates.sh` passes.
