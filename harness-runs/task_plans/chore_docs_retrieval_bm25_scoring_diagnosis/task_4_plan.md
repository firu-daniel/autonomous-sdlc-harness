### Task 4 — Trace the index scan's stray score with repeated scoring in each index state

**Goal:** Meet goal 3 of the task prompt. Trace the stray score to a reproducible sequence of statements, recorded beside the figures. Check it against `timescale/pg_textsearch#557` and `#516`, and check whether it disappears once the rows are in a segment.

The stray is the compose Postgres index scan occasionally returning one (query, key) score that no other run returns: about one value per 300 queries in `fix_docs_retrieval_bm25_index_history`'s runs, none on PGlite. That branch's task prompt describes it under `## A second defect, found while implementing Task 1` (read with `git show 234162d2:harness-runs/task_prompts/fix_docs_retrieval_bm25_index_history_task_prompt.md`). It is a lead. The two issues are known here only by the task prompt's descriptions:

- **`#557`**: a wrong top-N before the memtable is spilled, open on 1.3.1 and 1.5.1;
- **`#516`**: the score changes within a statement when the index changes, fixed after 1.4.0.

No agent on this branch can read either issue.

**Depends on:** Task 1 and Task 2.

- **From Task 1** it uses `--repeat <n>`. On Postgres every repetition after the first is its own `psql` process. Every value differing from the first repetition is listed as `disagrees <step> r<i> <qid> <key> <column>: <first> <this>`, and with `repeat > 1` each step also prints `bm25_summarize_index` and `autovacuum_count` before and after its repetitions, plus the number of values compared. This task also uses both sequences: `--sequence states`, with `t0` fresh insert (memtable), `t1` after `bm25_spill_index` (segment), `t3` `REINDEX` and `t4` `CREATE INDEX` over loaded rows; and the history sequence.
- **From Task 2** it uses the section `## The BM25 index's state, measured` and the procedure subsection. Task 2 also records whether PGlite exposes `bm25_spill_index`. Task 2 or Task 3 may already have named one-run values, and this task carries each of them.

**Where this task stops.** It records, and works around nothing. No retry, re-score, average or tolerance, and no filing or commenting upstream (task prompt → `## Constraints`). If the stray traces into `pg_textsearch`'s own behaviour, the record is the reproducible sequence and its figures, and the maintainer files it.

### Targets

- `docs/retrieval-eval-results.md` → a new `### The stray index-scan score`, after `### What still differs after REINDEX`.

**Work:**

- [ ] **Runs.** Use `--repeat 30` on the states sequence, for each corpus on each engine. That is 30 × 20 `self-docs` queries per state, above the ~300-query rate of the lead. The compose precondition applies; stop on the probe's `is the compose postgres service up?` refusal.
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine postgres --corpus self-docs --repeat 30 --capture harness-runs/scratch/bm25-history/t4-postgres-self-docs.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine postgres --corpus fixture-catalog --repeat 30 --capture harness-runs/scratch/bm25-history/t4-postgres-fixture-catalog.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine pglite --corpus self-docs --repeat 30 --capture harness-runs/scratch/bm25-history/t4-pglite-self-docs.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine pglite --corpus fixture-catalog --repeat 30 --capture harness-runs/scratch/bm25-history/t4-pglite-fixture-catalog.txt
  ```
  Then run the lead's own shape: the history sequence, `self-docs` against `fixture-catalog`, on Postgres, `--repeat 15`. Take every run before editing the document.
- [ ] **Tabulate, per engine, corpus and state:**
  - values compared;
  - disagreements, per column;
  - each disagreement's query, key, column, repetition and both values;
  - whether `bm25_summarize_index` and `autovacuum_count` were unchanged across the repetitions.

  Add the one-run values Tasks 2 and 3 named, each placed in its state.
- [ ] **Trace and check.** Answer each of these from the table:
  - (1) **Memtable or segment.** Does the stray appear in `t0`, the memtable, and not in `t1` / `t3` / `t4`, where the rows are in a segment? That would be consistent with `#557`'s description. Or does it appear in any state? "Disappears once the rows are in a segment" is answered only if the segment states compared at least as many values as `t0` and none disagreed.
  - (2) **Column.** Is it in `scan`, in `operator`, or both?
  - (3) **A changing index.** Did the index change under the repetitions? An unchanged summary and `autovacuum_count` rule out `#516`'s described trigger for that block, and that is recorded. It is not presented as a verdict on `#516`.
  - (4) **Engines.** Does PGlite show any stray?

  The **reproducible sequence** is the states sequence's statements up to the state where strays appeared, plus the repeated score statement, with the observed rate: strays per values compared. If the same (query, key) recurs, name it. If none recurs, say the sequence reproduces the rate and not a fixed value.
- [ ] **`### The stray index-scan score`.** Write the lead paragraph with the stray's description and its earlier figures, as leads. Add the table from the second bullet and the trace from the third. Give the reproducible sequence as the statements, verbatim from Task 2's setup subsection or by reference to it, and the commands by reference to `docs/retrieval-eval.md` → `### The BM25 index-state probe`. Close with the conclusion. Where the stray lies in the extension's behaviour, write: "a defect in `pg_textsearch` 1.3.1 as run here, reproduced by the sequence above, not worked around; reporting it upstream is the maintainer's". Where no stray appeared in any of these runs, say exactly that, with the values compared per state, and record the stray as **not reproduced**, not as fixed.

**Verification:**

- Every state on both engines has a values-compared count. Every disagreement is listed with both values, and none is omitted, averaged or re-scored.
- Question (1) is answered only on equal-or-larger value counts in the segment states, as stated.
- The record names no upstream issue as the cause. It says "consistent with" or "not consistent with" the prompt's description of each issue.
- `git diff -- docs/retrieval-eval-results.md` adds bytes only inside the new subsection.
