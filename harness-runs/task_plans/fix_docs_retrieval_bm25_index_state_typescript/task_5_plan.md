### Task 5 — Measure the vector arm after a refresh with deletes, and record any vector-index statement as a proposal to the maintainer

**Goal:** Take the measurement the task prompt asks for under Leads, **The vector arm with dead rows.** Arm C (vector, `chunks_hnsw`) after a refresh that deleted rows, read as it stands and after each candidate statement. Then record, from the figures, **whether a vector-index statement restores full lists**, as a proposal to the maintainer and never as an end-state entry.

**Why no vector statement joins the end state on this branch.** These held-another states are taken on `fixture-catalog` (41 chunks), and `harness-runs/lessons.md` → `## Evidence and measurement`, first rule, says *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision"*. The real-shape step this branch ships, gate 10's leg (vii) (Tasks 3 and 6), measures only the BM25 route-2 end state and takes no arm C reading after deletes. The probe's `--reindex-cost` seam times one BM25 `REINDEX` only (`docs/retrieval-eval.md` → `### The BM25 index-state probe`), so it would not measure an added `VACUUM` or HNSW rebuild either. So `END_STATE_STATEMENTS` is `REINDEX INDEX chunks_bm25` alone, whatever these figures show (`## Context`, the design decisions). A statement that restores full lists here is recorded as a proposal, with this part's figures, under the ledger's third `## Evidence and measurement` rule: *"A decision rule's outcome is a proposal to the maintainer, not a settled future"*. No other document writes it as pending work. Tasks 7 and 8 do not read this part.

The defect, as the diagnosis recorded it: in the held-another state on `fixture-catalog`, arm C returned 3 refs instead of 5 for `q-fc-verify-callback`, and 0 instead of 5 for `q-fc-negative-lattice` (`docs/retrieval-eval-results.md` → `### Whether either mechanism moves relevance`, the held-another table's arm C rows). It is recorded as unexplained. The task prompt's hypothesis, unverified: the HNSW scan filters out dead tuples after its candidate limit.

**Depends on:**

- **Task 4**, the previous writer of `### Route 2 on the fix branch`. This task's part goes after Task 4's `#### The relevance eval's deterministic figures, before the fix`.
- Task 4's fresh `fixture-catalog` run is this task's reference for *"full lists"*. Its arm C ordered refs, per query, are what a store without dead rows returns.
- Task 4's scratch programs `harness-runs/scratch/fix-bm25/pglite-statement.mjs` and `harness-runs/scratch/eval.mjs` are reused. Re-create either from Task 4's file if it is absent.

**Where this task stops.** It measures and records a proposal at most, and changes no code. The before-fix half is measured here. The after-fix half is Task 9's, run on the shipped end state.

### Targets

- `docs/retrieval-eval-results.md`: `#### The vector arm after a refresh with deletes, before the fix`.

**Work:**

- [ ] **The held-another states**, built as `### Whether either mechanism moves relevance` built them, from the repository root with `--repeat 1`:
  - Run the eval on `self-docs` into `--data-dir harness-runs/scratch/fix-bm25/held-1`.
  - Then run it on `fixture-catalog` into the same directory, with `--out` to a scratch file. That refresh deletes `self-docs`'s keys and inserts `fixture-catalog`'s, so the index carries the deleted rows.
  - Build `held-2` the same way.
  - Record each `self-docs` stamp. `self-docs` here only supplies the dead rows, so the live corpus is fine.
- [ ] **The candidate statements**, each issued through `pglite-statement.mjs`. After each, run the eval on `fixture-catalog` again with the same `--data-dir`: its refresh writes nothing.
  - `held-1`, in this order: as built; then after `REINDEX INDEX chunks_bm25`, which is route 2's BM25 statement alone; then after `REINDEX INDEX chunks_hnsw` as well.
  - `held-2`: after `VACUUM chunks` followed by `REINDEX INDEX chunks_bm25`.
  - Read `SELECT count(*) FROM chunks` and the HNSW and BM25 summaries where available, before and after each statement.
- [ ] **The comparison.** For every arm C query: the number of refs returned, and whether the ordered refs equal Task 4's fresh run. Do the same for arms B, D and E wherever a statement changed them. Record every figure that moved, unrounded where three decimals hide a difference.
- [ ] **The decision**, written as its own paragraph, **The decision.**, opening: *"No vector-index statement joins the end state on this branch; the end state is `REINDEX INDEX chunks_bm25` alone."* Then give the reason from this file's **Why no vector statement joins** paragraph in one sentence, and one of these:
  - If arm C already returns full lists after `REINDEX INDEX chunks_bm25` alone, say so: the shipped end state restores them on this corpus, and nothing is proposed.
  - Otherwise, if a candidate restores full lists on every query, record it as **a proposal to the maintainer**, not as shipped work. Where both restore them, name the one whose arm C ordered refs equal Task 4's fresh run on every query. Where both do that too, name `VACUUM chunks`, which rebuilds nothing and so leaves the graph the inserts built, as a fresh build has it. State what adopting it would still need: an arm C reading after deletes on the real catalog, and a seam that measures its cost, since `--reindex-cost` times the BM25 `REINDEX` only. The short lists stay recorded as open on the shipped end state.
  - If neither restores them, the short lists are recorded as still open, with this part's figures, and nothing works around them (task prompt, `## Constraints`).
  - Whichever way it goes, state whether the hypothesis is supported, contradicted or untested by these figures.
- [ ] **The part**: the setup (date, commit, engine, versions, stamps), one table per state and statement, the comparison and **The decision.** No wall-clock figure.

**Verification:**

- Every reading names its state, the statement before it and its arm C ref counts. The part shows the diagnosis's two short lists either recurring or not, with the figures.
- **The decision.** states that the end state is `REINDEX INDEX chunks_bm25` alone. Any vector statement it names appears only as a proposal to the maintainer, taken from the candidates measured here, with the rule above that chose it and what adopting it would still need.
- No file other than this part names a vector statement as pending work.
- `git diff --stat` lists `docs/retrieval-eval-results.md` only. The new lines sit directly after Task 4's part, and the generated region is untouched.
