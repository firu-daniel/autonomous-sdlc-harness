### Task 2 — Measure the four index states on both engines and record the score each state ranks by and the near-tie ordering

**Goal:** Meet goals 1 and 4 of the task prompt.

- **Goal 1.** On PGlite and on the compose Postgres, show for each index state whether `scan` equals `operator`, or record how it does not. The states are a fresh-insert index, the same index after `bm25_spill_index()`, the same index after `REINDEX`, and a `CREATE INDEX` over an already-loaded table. Check whether PGlite exposes `bm25_spill_index()` at all.
- **Goal 4.** Explain the near-tie ordering on an empty database, or record it as still unexplained.

This task also creates the results section every later measurement task adds to, and the procedure subsection that says how to re-run the probe.

**Depends on:** Task 1. It uses the launcher surface `--sequence <history|states>`, `--repeat <n>`, `--engine`, `--corpus`, `--other`, `--capture` and `--compare` of `evals/docs-retrieval/bm25-history.mjs` → `runBm25HistoryLauncher`. It reads these from each step's output:

- the two plan lines (`plans.probe` and `plans.store`);
- the forced re-score, labelled, present only when `plans.probe` was not the `chunks_bm25` index scan;
- the diagnostics (a)–(g): hits; hits whose `scan` and `operator` differ; how many of those are the operator stored as a `real`; the largest difference; the length-band split, with its `Σ length` / `total_len` verdict; and the order inversions against `operator` and against `scan`;
- the pairwise differing-hit counts between states.

The states are `t0` fresh insert, `t1` `bm25_spill_index`, `t2` PGlite reopen, `t3` `REINDEX`, and `t4` `CREATE INDEX` over loaded rows. This task changes no code.

**Where this task stops.** It records goals 1 and 4 only. Goal 2's residuals after `REINDEX` in the history sequence are **Task 3's**, the stray score is **Task 4's**, and the refresh-level rule is **Task 6's**. Each of them adds its own subsection under the section this task creates, and this task leaves room for them by ending the section after its own subsections. This task records the goal 4 figures and its conclusion from the probe alone. Task 6's refresh-level runs also observe the Python store's own fresh build, and Task 8 states the combined conclusion.

### Targets

- `docs/retrieval-eval-results.md`: a new `## The BM25 index's state, measured` section at the end of the file, after `### The trade-off, stated`. It holds a **Who reads this, and what it decides.** lead paragraph and three subsections: `### How the probe reads a score, and the setup`, `### The score each index state ranks by` and `### The near-tie ordering on an empty database`.
- `docs/retrieval-eval.md`: a new `### The BM25 index-state probe` subsection after `### Writing the comparison up` and before `## The query-set format`. It gives the launcher file's contents and every run command in a fenced block, one command per line.

**Work:**

- [ ] **Runs.** Preconditions: `npm run build` has run, and the compose `postgres` service is up (`## Context` → **Manual setup required**). If the probe refuses with `is the compose postgres service up?`, stop and report it, and start nothing. Create the launcher `harness-runs/scratch/bm25-history.mjs`, which imports `runBm25HistoryLauncher` from `../../evals/docs-retrieval/bm25-history.mjs` and awaits it with `process.argv.slice(2)`. Take four runs of the states sequence:
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine pglite --corpus fixture-catalog --capture harness-runs/scratch/bm25-history/t2-pglite-fixture-catalog.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine postgres --corpus fixture-catalog --capture harness-runs/scratch/bm25-history/t2-postgres-fixture-catalog.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine pglite --corpus self-docs --capture harness-runs/scratch/bm25-history/t2-pglite-self-docs.txt
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine postgres --corpus self-docs --capture harness-runs/scratch/bm25-history/t2-postgres-self-docs.txt
  ```
  Then run the same four again into `…-2.txt` captures, and `--compare` each pair. A value the comparison lists is recorded as a one-run value with its step, query, key and column, and handed to Task 4's subsection by name. It is never dropped. Record from the captures alone, and take every `self-docs` run before this task edits either document, so all four carry one stamp.
- [ ] **`## The BM25 index's state, measured` and `### How the probe reads a score, and the setup`.**
  - **The lead paragraph** says who reads the section: the maintainer deciding the fix branch's route. It says what the section records: the index states, the scores each one ranks by, the residuals, the stray score, the candidate rule and the relevance effect. It says that every `self-docs` figure carries its stamp and that no comparison crosses two stamps. It says that the `pg_textsearch` source paths and issue numbers it cites are the task prompt's leads and were not re-read on this branch.
  - **The setup subsection** carries each engine's `SELECT version()` and `pg_extension.extversion`, both corpus stamps, the date and the number of runs per engine and corpus. It quotes the score statement verbatim, with its three columns explained. `scan` is the score the index scan ranked by and is what the store ranks by (`cli/src/retrieval/store.ts` → `lexicalSearch`). `operator` is the comparison's own probe column. `operator_exact` is diagnostic. It also quotes the length statement and the two `EXPLAIN` statements, explains the forced re-score and why it is not a disabled index scan, and cites `docs/retrieval-eval.md` → `### The BM25 index-state probe` for the commands.
- [ ] **`### The score each index state ranks by` (goal 1).** Give one table per run, step × the following columns:
  - `total_docs`, `total_len` and memtable documents;
  - the probe plan and the store plan;
  - hits, and hits with `scan` ≠ `operator`;
  - of those, the operator stored as a `real`, and the number differing beyond `real` storage;
  - the largest difference;
  - the length-band split (the `≤ 39` / `> 39` split of the differing-beyond-`real` hits), or "withheld" with the `Σ length` / `total_len` pair.

  Where a step was forced, it gets a second row labelled `forced index scan`. Add the pairwise state-against-state counts in `scan`, and whether PGlite exposes `bm25_spill_index`. If PGlite does not expose it, `t1` reads "not available" for PGlite and `t2` (reopen) is that engine's spilled state. Then one sentence per state answers goal 1 from its rows:
  - "`scan` equals `operator`";
  - "differs only by `real` storage";
  - or the counts and largest value.

  End with a statement of **which build forms score alike in `scan`**: fresh insert and spill, `REINDEX`, or `CREATE INDEX` over loaded rows. Task 6 builds its reference index the way this statement names. If no two forms agree, say so plainly; Task 6 then reports against each.
- [ ] **`### The near-tie ordering on an empty database` (goal 4).** Cite the two pairs as `### Divergence sources, in the order checked`, item 3, **What stays unexplained.** records them, without restating or amending that item:
  - `q-fc-token-lifetime`: `docs/api-auth.md#rotating-a-key` / `#token-exchange`;
  - `q-fc-unreadable-label`: `docs/depot-operations.md#inbound-scanning` / `docs/labels.md#when-a-label-is-rejected`.

  From diagnostic (f) of each `fixture-catalog` run, give per engine and state whether each pair is returned against the operator's order, with all three values. The lead is mechanism 2: the store ranks by `scan`, and the recorded scores are `operator`. Conclude "explained by mechanism 2" only if both hold:
  - in `t0` the pair's returned order follows `scan` and inverts `operator`;
  - in the spilled state it no longer inverts.

  Otherwise record it as still unexplained, with what the rows show. The empty database in item 3 was the Python store's own fresh build, and Task 6 observes that route.
- [ ] **`docs/retrieval-eval.md` → `### The BM25 index-state probe`.** State who runs it and that its figures are not wall-clock figures. Give the launcher's two lines, and fenced commands for the states sequence, the history sequence (`--other`), `--repeat`, `--capture` and `--compare`, one command per line. State the compose precondition and that captures go under `harness-runs/scratch/bm25-history/`, which is gitignored. State that `--reindex-cost` is an operator's hand run on an idle machine and is not run by this branch. Leave a closing paragraph slot for Task 6's refresh-level launcher by ending the subsection after these commands. Do not restate the results.

**Verification:**

- Every state on both engines has a row, and every goal-1 sentence cites its row. No `self-docs` figure is compared across two stamps.
- Each recorded figure is reproduced by the second run of its pair, except a value the record names as a one-run value.
- The new section names no capture file and no machine-local path, and carries no millisecond figure. `grep -nE '[0-9] ?ms\b' docs/retrieval-eval-results.md` has no hit inside the new section.
- `git diff -- docs/retrieval-eval-results.md` shows bytes added only after `### The trade-off, stated`. The generated region, `### Which case this is`, item 3, item 4 and the **Finding** paragraph are byte-identical.
- Every command in the new procedure subsection sits in a fenced block, one per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`).
- **Deviations from plan:**
  - The launcher `harness-runs/scratch/bm25-history.mjs` already existed from Task 1's smoke runs with the two lines this plan specifies; it was reused unchanged rather than re-created.
  - The Postgres `self-docs` pair is not reproduced: `--compare` listed 50 values at `t0` (49 `scan` on `docs/work-report-research/user-review-fix-plan-writer.md` chunks, 1 `operator` on `q-sd-run-gates` / `docs/work-report-research/reviews/task-plan-reviewer.md#must-fix`, whose run-2 `operator` −6.070929 disagrees with its own `operator_exact` −6.122591853141785). They move that table's `t0` differing / beyond-`real` counts (1156 / 1112, 897 / 853), its inversion count (27 / 9) and the `t0` pairwise cells (62 / 13, 73 / 24 in `scan`; 0 / 1 in `operator`). All are recorded as one-run values, both runs shown, with the 50 values tabled and handed to Task 4's `### The stray index-scan score` by name. No third run was taken (`## Context`: nothing is retried).
  - No step on any run was forced: the probe plan was the `chunks_bm25` index scan at every step. On `fixture-catalog`, `t3` and `t4`, the store's `LIMIT 50` plan is a Seq Scan on both engines; the record states that the store ranks by the operator there.
  - `docs/retrieval-eval.md` commands: the states, `--capture` and `--compare` commands were each run on this task (with this task's capture names); the history-sequence command was run once on PGlite as printed to check it is accepted (its figures belong to Task 3 and were not recorded). The `--repeat 5` command was not run; Task 4 runs the repeat mode.
