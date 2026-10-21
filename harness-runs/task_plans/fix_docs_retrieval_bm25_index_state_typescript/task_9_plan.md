### Task 9 — Re-run the relevance figures after the fix and report every figure that moved

**Goal:** Re-run the relevance eval's deterministic figures on both corpora on the fixed code, and report every figure that moved against Task 4's before-fix run (task prompt, goal 4). Record three more things:

- the lexical arm's relevance on the `Seq Scan` plan the fix now puts `fixture-catalog` on;
- the vector arm after a refresh with deletes, on the shipped end state;
- the floor's standing after the fix: either unchanged, or the rows the maintainer's routing of Task 8's floor `blocker:` re-recorded, with their reason.

**Depends on:**

- **Task 8**, which made `refreshIndex` end every refresh that wrote anything, and every index not marked rebuilt, by calling `DocStore.rebuildIndexes()`. That issues `END_STATE_STATEMENTS` in order (`cli/src/retrieval/store.ts`, Task 7). Task 8 never writes `evals/docs-retrieval/floor.json`, which is outside its `cli` scope. It reads every row against a fresh `fixture-catalog` run. If a floored figure moved, it returns `blocker:` with each moved row's arithmetic, and the maintainer routes the same-commit re-record. So this task finds one of two states. Either `floor.json` is unchanged on this branch because no floored figure moved, or it holds the rows the maintainer's routing re-recorded with Task 8's change. Read which from `git log -- evals/docs-retrieval/floor.json` over this branch's commits since `d15e5cc3`, and from the file itself.
- **Task 7**, which exports `LEXICAL_SEARCH_STATEMENT`, the store's lexical SQL, so this task's `EXPLAIN` reads the statement the store actually issues.
- **Task 6**, the previous writer of `### Route 2 on the fix branch`. This task's part goes after Task 6's `#### Route 2 on the real catalog`.
- **Task 4's** before-fix part and its scratch programs: `harness-runs/scratch/fix-bm25/base-corpus.mjs` writes the `d15e5cc3` snapshot, and `pglite-statement.mjs` runs statements on a data directory. Re-create either program from Task 4's file if it is absent.
- **Task 4's before-fix `--out` files, the files this task's diff reads:** `harness-runs/scratch/fix-bm25/before-fixture-catalog.md` (the fresh `fixture-catalog` run) and `harness-runs/scratch/fix-bm25/before-self-docs.md` (the snapshot's `self-docs` run, written outside the snapshot so its removal left it). If either is absent, re-take nothing: stop and report which file is missing, after the snapshot removal below if the snapshot was written. **Task 5's** held-another procedure and its **The decision.** are read too.

**Where this task stops.** It measures and records. It never edits `floor.json`. If its reading finds a floored figure that moved while the row was not re-recorded with Task 8's change, or a row re-recorded with the wrong arithmetic, return `blocker:` naming the row. The re-record belongs with the change that moved the figure, routed by the maintainer, never in a commit of its own. It changes no code.

### Targets

- `docs/retrieval-eval-results.md`: `#### The relevance eval's deterministic figures, after the fix`.

**Work:**

- [ ] **Preconditions.**
  - Run `npm run build`.
  - Confirm the TypeScript model cache is present.
  - Confirm both of Task 4's before-fix `--out` files exist (**Depends on:**); if either is absent, stop and report before writing the snapshot.
  - `SHOW pg_textsearch.library_version` reads `1.5.1`.
  - Re-run `base-corpus.mjs`. Its `self-docs` stamp must equal Task 4's recorded stamp; if it does not, run `base-corpus.mjs --remove`, then stop and report.
  - **Every exit after the snapshot is first written runs `base-corpus.mjs --remove` before returning**, as Task 4's file states: success once this task's readings are taken, the stamp-mismatch stop, the floor `blocker:` under **Where this task stops**, a run or reading that fails mid-task, and every other stop. A partial write is removed by the program itself, which removes the directory and rethrows on any failed write. If the removal itself fails, the return says so and names the directory left behind (`harness-runs/lessons.md` → `## Remote and branch-scoped operations`, the temporary-copy rule).
- [ ] **The runs**, as Task 4 ran them, each into a scratch `--out` file created beforehand holding only the two markers, with `--repeat 1`:
  - `fixture-catalog` fresh, into the new directory `harness-runs/scratch/fix-bm25/after-fixture-catalog`, with `--out harness-runs/scratch/fix-bm25/after-fixture-catalog.md`;
  - `self-docs` fresh, from the snapshot (`--repo harness-runs/scratch/fix-bm25/base-corpus --corpus self-docs --out ../after-self-docs.md`). The `--out` path resolves against `--repo`, so the file is `harness-runs/scratch/fix-bm25/after-self-docs.md`, outside the snapshot, and survives its removal.

  Through `pglite-statement.mjs`, on `after-fixture-catalog`, read the `EXPLAIN (VERBOSE, COSTS OFF)` of `LEXICAL_SEARCH_STATEMENT` bound to the first query, and the index summary. The plan is expected to read `Seq Scan on public.chunks`; record what it reads.
- [ ] **The vector arm on the shipped end state.** Build the held-another state as Task 5 built it: `self-docs`, then `fixture-catalog`, into the new directory `harness-runs/scratch/fix-bm25/after-held`. The fixed refresh now ends it in the end state, so no statement is issued by hand. Record arm C's ref count and ordered refs per query against Task 4's fresh `fixture-catalog` run, and against Task 5's `REINDEX INDEX chunks_bm25` row, which is the shipped end state (**The decision.** adopts no vector statement). Where Task 5 recorded short lists as open, say whether they recur on the shipped code.
- [ ] **The comparison**, against Task 4's part:
  - every figure of arms B to E that moved: recall@1, @3 and @5, MRR, strict recall@1, @3 and @5, strict MRR, and abstentions. Give one table per corpus, with the before value, the after value and the per-query refs behind each move, as `### Whether either mechanism moves relevance` lists them;
  - the after-fix `fixture-catalog` figures against Task 4's **Seq Scan, unfiltered** table, which is the filter's own effect on that plan;
  - say whether the moves are the ones the task prompt's lead expected: arm B MRR toward 0.602, arm D toward 0.704, and recall@1 by the `q-fc-token-lifetime` near-tie pair.
- [ ] **The floor.**
  - Read each `floor.json` row against this run's `fixture-catalog` figure. State the row, its value, its `recordedAt` and the figure. A breach is a figure of this run **below** its row's `value`, which gate 11 fails on. In a healthy run every row's `value` sits below this run's figure, because the margin rule records each floor 0.05 below the measured value (`docs/retrieval-eval.md` → `## The regression floor` → **The margin, and why there is one.**).
  - Where a row was re-recorded with Task 8's change (through the maintainer's routing of Task 8's floor `blocker:`), quote that commit's reason line and show the arithmetic. Where no row was re-recorded, say that Task 8's reading found no floored figure moved.
  - State that `check-floor.mjs` was not run and that gate 11 grades it at the Run gates phase.

**Verification:**

- Both stamps equal Task 4's: `fixture-catalog` `{ files: 9, chunks: 41 }`, and the snapshot's `self-docs` at its recorded stamp. Every comparison is therefore a before/after pair.
- Every figure the part calls moved differs from Task 4's value, and every figure it calls unchanged does not. Check this by diffing the metric tables of `before-fixture-catalog.md` against `after-fixture-catalog.md`, and of `before-self-docs.md` against `after-self-docs.md`, all under `harness-runs/scratch/fix-bm25/`. The per-query refs behind each reported move are read from the same pairs.
- No figure of this run is below its `floor.json` row's `value` (that would be a breach, red at gate 11). A breach found here is a `blocker:`, per **Where this task stops**.
- `harness-runs/scratch/fix-bm25/base-corpus/` is absent when the task returns, whatever the outcome: success, `blocker:` or stop (`test ! -e harness-runs/scratch/fix-bm25/base-corpus` exits `0`).
- `git diff --stat` lists `docs/retrieval-eval-results.md` only. The new lines sit directly after Task 6's part, and the generated region is untouched.

**Deviations from plan:**

- **A plan-only `self-docs` run was added, arm C only.** The after-fix `self-docs` run moved no figure but reordered arm C's refs on two negatives, and the run of record is in memory. `--repo harness-runs/scratch/fix-bm25/base-corpus --corpus self-docs --data-dir ../after-self-docs-plan --arms C --repeat 1` persisted the same snapshot (stamp `{ files: 71, chunks: 829 }`, arm C figures equal the in-memory run's). Its vector plan read `Seq Scan on chunks` under a `Sort` (`chunks` reltuples 829); Task 4's `before-self-docs-plan` directory, read by the same program, read `Index Scan using chunks_hnsw` (reltuples -1). The part records the arm C reorderings as consistent with that plan move, not attributed. Both data directories stay in scratch.
- **The readings program is new**: `harness-runs/scratch/fix-bm25/after-readings.mjs` reads `EXPLAIN (VERBOSE, COSTS OFF)` of `LEXICAL_SEARCH_STATEMENT` imported from `cli/dist/retrieval/store.js`, rather than `pglite-statement.mjs` with `BM25_HISTORY_STATEMENTS.explainStore`, so the plan read is the statement the store issues. It also reads the vector plan, `pg_class`, the `index_state` meta row and `summarize`.
- **The snapshot was removed before the held-another build**, which reads the live `self-docs`, not the snapshot; `test ! -e harness-runs/scratch/fix-bm25/base-corpus` exited `0` then and at the end.
