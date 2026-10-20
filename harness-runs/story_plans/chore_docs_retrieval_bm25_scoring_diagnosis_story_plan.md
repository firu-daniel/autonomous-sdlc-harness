# Story: Why the docs-retrieval BM25 scores depend on the index's state — measured on both engines, with a recommended fix route

## Context

This branch measures why the docs-retrieval BM25 scores depend on the state of the `chunks_bm25` index, on PGlite (the TypeScript backend's engine) and on the compose Postgres (the Python backend's engine). It ends with a recommended fix route for the maintainer to decide. It changes no shipped behaviour: `cli/src/retrieval/` and `docs-retrieval-service/src/` are read and never edited. The fix, the Python port and the correction of the backend comparison's record are later branches. The work is probes, captures, eval runs and documents. It replaces `fix_docs_retrieval_bm25_index_history`, which stopped at its Task 1: after `REINDEX`, the `operator` column matched a fresh index and the `scan` column did not (commit `234162d2`, `harness-runs/task_plans/fix_docs_retrieval_bm25_index_history/task_1_plan.md` → `**Deviations from plan:**`, readable with `git show 234162d2:<path>`).

**What carries over.** The probe is `evals/docs-retrieval/bm25-history.mjs`, merged in `c5442962`. Every score statement reads two columns. `scan` is `bm25_get_current_score()`, the score the index scan ranked the row by, which is what the store ranks by. `operator` is `round((text <@> …)::numeric, 6)`, the standalone operator. Every figure taken before that probe read the operator only. The two mechanisms the task prompt names are leads, not figures of record: (1) deleted rows stay in `total_docs` / `total_len` until a `REINDEX`, or a `VACUUM` that empties a whole segment; (2) the index scan scores memtable rows with their exact length, while segments and the operator use a quantized fieldnorm length. **No agent on this branch can read the `pg_textsearch` source or the upstream issues**, because unattended runs have no web access. Every source path and issue number below is therefore cited as the task prompt's lead, never as re-verified. A lead becomes a figure of record only when this branch's committed probe measures it.

**How the work is cut.** Every task is in the `general` layer, because `evals/` and `docs/` belong to the catch-all.

- **Two code tasks** add the measuring surface:
  - Task 1 extends the probe with an index-state sequence, per-hit diagnostics and a repeat mode.
  - Task 5 adds a refresh-level module that drives each backend's own refresh.
- **Five measurement tasks** each run one goal's measurements and record them, beside their statements and setup, in their own subsection of a new `## The BM25 index's state, measured` section at the end of `docs/retrieval-eval-results.md`:
  - Task 2: goals 1 and 4;
  - Task 3: goal 2;
  - Task 4: goal 3;
  - Task 6: goal 5;
  - Task 7: goal 6.
- **Task 8** writes the recommendation (goal 7).

The tasks that edit a shared file run strictly in order, and each owns only its named subsection. The new results section and the procedure subsection in `docs/retrieval-eval.md` are created by Task 2, and every later task that adds to them `**Depends on:**` it.

**Decisions this plan makes, stated once for every task:**

- **The index scan is never disabled.** A step whose default plan is not the `chunks_bm25` index scan is reported with the plan it got. It is then scored a second time in the same session under `SET enable_seqscan = off`, which forces the index scan rather than disabling it, and both readings are recorded with labels. `docs/retrieval.md` → `## Measured, and how`, item (b), used the same setting. The reason: an index whose statistics describe its rows, which is what `CREATE INDEX` over a loaded table and `REINDEX` leave, can fall below the planner's crossover at fixture size (`docs/retrieval.md` → `## Still open`, the lexical-arm bullet: 63 rows) and stop producing a `scan` score at all.
- **Nothing is retried, re-scored, averaged or put under a tolerance.** A repeated scoring run is a measurement and every repetition is reported. A difference is reported with its size, never absorbed into a threshold. Classifying a difference is reporting, not a tolerance. One example is whether `scan` equals the operator rounded to `real`, an exact test. Every hit stays counted.
- **`self-docs` is a moving corpus, and this branch edits two of its members** (`docs/retrieval-eval-results.md`, `docs/retrieval-eval.md`). So every `self-docs` figure carries the `{ files, chunks }` stamp of the run that took it. **No comparison crosses tasks.** Every comparison a task records is between runs that task took, at one stamp. `fixture-catalog` does not move.
- **No wall-clock figure is taken or recorded** (`harness-runs/lessons.md` → `## Evidence and measurement`). The probe's existing `--reindex-cost` seam is left as it is and not run.
- **Captures are evidence for the implementer, never for the record.** They go under `harness-runs/scratch/bm25-history/`, which is gitignored. The document of record carries the figures, the statements, the setup and the re-run commands, and never a pointer to a capture file (`harness-runs/scratch/README.md`, last paragraph).
- **The recommendation is a proposal and goes in one place.** Task 8 writes it into the results section only. No other document gains it as pending work (`harness-runs/lessons.md` → `## Evidence and measurement`, the decision-rule lesson).
- **The backend comparison's existing paragraphs are not touched.** That covers `### Which case this is`, item 3, item 4 and the **Finding — a defect, recorded and not acted on.** paragraph. Correcting them is out of scope.

**Top risks:** The likeliest failure is a scan-column reading that is not an index-scan score at all, because the planner chose a sequential scan, recorded as if it were one. Task 1 prints each step's plan line for both the probe's statement and the store's own `LIMIT 50` statement, and re-scores under the forced index scan. Tasks 2, 3 and 6 record which reading each figure is. The second risk is a cross-stamp `self-docs` comparison, or an explanation that rests on an unverified `pg_textsearch` source lead. Every task compares only within its own runs, and states a mechanism as explained only where the probe's own prediction test holds: the length-band cross-tab and the exact `real` test of Task 1, and the in-state repeat runs of Task 4. Otherwise the mechanism is recorded as unexplained, with counts and largest values. The third risk is a recommendation that rests on fixture-sized corpora, or that misses the planner flip a `REINDEX` causes below the crossover. Task 6 records the store statement's plan before and after the rule on both corpora. Task 8 states the corpus-size limit and the plan effect as part of the recommendation.

**Manual setup required** (before `/autonomous-sdlc-harness:branch-implement-plan`):

- Docker running, with the compose `postgres` service up. From `docs-retrieval-service/`, run `docker compose up -d --wait postgres`. It was up and healthy at planning time. Tasks 2, 3, 4 and 6 need it, and each stops and says so if the probe's `is the compose postgres service up?` refusal appears. None of them starts it.
- The Python weight cache under `~/.cache/harness-docs-retrieval/models` must be present for Task 6. It was present at planning time. If it is missing, Task 6 stops and says so, and never fetches weights.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets in the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_docs_retrieval_bm25_scoring_diagnosis/task_<K>_plan.md`. The entries are in ship order, and every task is in the catch-all `general` layer.

1. [x] **Task 1** — Extend the BM25 probe with an index-state sequence, per-hit diagnostics and a repeat mode _(layer: general)_ _(points: 20)_
2. [x] **Task 2** — Measure the four index states on both engines and record the score each state ranks by and the near-tie ordering _(layer: general)_ _(points: 15)_
3. [x] **Task 3** — Re-take the history sequence and explain, or record as unexplained, what still differs after `REINDEX` _(layer: general)_ _(points: 10)_
4. [x] **Task 4** — Trace the index scan's stray score with repeated scoring in each index state _(layer: general)_ _(points: 10)_
5. [ ] **Task 5** — Add the refresh-level module that measures the candidate end-state rule on both backends _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Measure the candidate end-state rule at refresh level on both engines and record the before-fix figures _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — Measure whether either mechanism moves the relevance eval's deterministic figures _(layer: general)_ _(points: 10)_
8. [ ] **Task 8** — Write the recommendation for the fix branch _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Add the measurements to `docs/retrieval-eval-results.md`, each beside the statement and setup that produced it."* It is read together with the prompt's constraint *"Every statement and probe that produces a figure in a document of record is recorded beside the figure, with its setup, so it can be re-run"*. That reaches the documents that state how an eval module is run, and the eval directory's module table. The prompt's out-of-scope line, *"Correcting the backend comparison's existing paragraphs"*, sets every existing statement of the defect to `no-change`.

**Derivation entry — sites that state the BM25 history defect or describe the probe (command).** Re-run verbatim from the repository root:

```
git grep -nE "index's history|database's history|depend on what its|delete-and-insert|near-tie|bm25_get_current_score|bm25_spill_index|bm25-history|\*\*Incremental refresh\.\*\*" -- docs docs-retrieval-service/README.md evals/docs-retrieval/README.md evals/README.md
```

**Derivation entry — documents that state how an eval module is launched (command).** Re-run verbatim from the repository root:

```
git grep -lE "cold-build\.mjs|query-log-pass\.mjs" -- '*.md' ':!harness-runs'
```

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** that ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it states a fact that this branch's measurements make stale. None is reached. The `## Evidence and measurement` rules govern how this branch measures and recommends, and the `## Context` decisions above apply them, but none states a fact about BM25 or the index's state.

**Closure invariant:** every site any entry above reaches appears as a row below. After implementation, the first command also reaches lines this branch adds under the rows marked `change`, and each of those falls inside the row of the subsection that adds it.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/retrieval-eval-results.md` → `### Which case this is` ("the Python index's history in its database"; "how arms D and E split between the index's history"; "two near-tie swaps in arm B") | — | first command, `index's history`, `near-tie` | `no-change` | The backend comparison's existing paragraphs are out of scope. They are corrected by a later branch from this branch's record. |
| 2 | `docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`, item 3, **What it shows.** and **What stays unexplained.** ("database's history", "delete-and-insert path", "near-tie pair") | — | first command, `database's history`, `delete-and-insert`, `near-tie` | `no-change` | Same reason as row 1. Task 2 cites the near-tie figures from here rather than restating or amending them. |
| 3 | `docs/retrieval-eval-results.md` → item 4, **Arms D and E** ("carry the database's history") | — | first command, `database's history` | `no-change` | Same reason as row 1. |
| 4 | `docs/retrieval-eval-results.md` → **Finding — a defect, recorded and not acted on.** ("depend on what its database held before") | — | first command, `depend on what its` | `no-change` | Same reason as row 1. |
| 5 | `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, step 3's paragraph ("the database's history") | — | first command, `database's history` | `no-change` | That paragraph describes how the comparison's `@python` arms were taken, and re-taking them is out of scope. |
| 6 | `docs/retrieval.md` → **Incremental refresh.** | — | first command, `**Incremental refresh.**` | `no-change` | It describes the shipped refresh, which this branch does not change. The fix branch owns any rule it gains, and the decision-rule lesson keeps this branch's recommendation out of it. |
| 7 | `docs/retrieval-eval-results.md` → new `## The BM25 index's state, measured`, its lead paragraph, `### How the probe reads a score, and the setup`, `### The score each index state ranks by` and `### The near-tie ordering on an empty database` | — | second command (the file documents launched modules) | `change` | Task 2 |
| 8 | `docs/retrieval-eval-results.md` → new `### What still differs after REINDEX` | — | second command | `change` | Task 3 |
| 9 | `docs/retrieval-eval-results.md` → new `### The stray index-scan score` | — | second command | `change` | Task 4 |
| 10 | `docs/retrieval-eval-results.md` → new `### The candidate end-state rule, at refresh level` | — | second command | `change` | Task 6 |
| 11 | `docs/retrieval-eval-results.md` → new `### Whether either mechanism moves relevance` | — | second command | `change` | Task 7 |
| 12 | `docs/retrieval-eval-results.md` → new `### The recommendation for the fix branch` | — | second command | `change` | Task 8 |
| 13 | `docs/retrieval-eval.md` → new `### The BM25 index-state probe` (the probe launcher, its sequences and flags) | — | second command, `cold-build.mjs` (the file's launcher subsections) | `change` | Task 2 |
| 14 | `docs/retrieval-eval.md` → `### The BM25 index-state probe`, the refresh-level launcher paragraph | — | second command | `change` | Task 6 |
| 15 | `evals/docs-retrieval/README.md` → `## The modules`, the `bm25-history.mjs` row | — | second command, `cold-build.mjs` (the module table) | `change` | Task 1 |
| 16 | `evals/docs-retrieval/README.md` → `## The modules`, the `bm25-refresh-rule.mjs` row | — | second command | `change` | Task 5 |
