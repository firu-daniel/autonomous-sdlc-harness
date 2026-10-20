### Task 1 — Extend the BM25 probe with an index-state sequence, per-hit diagnostics and a repeat mode

**Goal:** Give `evals/docs-retrieval/bm25-history.mjs` everything goals 1 to 4 measure, as committed, re-runnable code:

- a second sequence that holds one corpus in each index state the task prompt names;
- per-step diagnostics that test both mechanisms' predictions rather than assume them;
- a forced-index-scan re-score for a step the planner sends to a sequential scan;
- a repeat mode for the stray score;
- the exported pieces Task 5's refresh-level module scores through.

This task changes no shipped behaviour and records no figure. Tasks 2, 3 and 4 run it and record what it prints.

**Where this task stops.** It writes code and the module-table row only. It writes nothing into `docs/retrieval-eval-results.md` or `docs/retrieval-eval.md`. Task 2 creates the record and the procedure subsection. It adds no refresh-level sequence: Task 5 owns `evals/docs-retrieval/bm25-refresh-rule.mjs`, which imports the exports this task defines.

### Targets

- `evals/docs-retrieval/bm25-history.mjs`: the sequences, diagnostics, repeat mode, launcher flags and exports.
- `evals/docs-retrieval/README.md` → `## The modules`: a `bm25-history.mjs` row, which is missing today.

**Source:** `evals/docs-retrieval/bm25-history.mjs` as merged in `c5442962`. Its module header, `STATEMENTS`, `openPglite`, `openPostgres`, `scoreAll`, `differences`, `measureBm25History`, `renderBm25History`, `compareBm25Captures` and `runBm25HistoryLauncher` are extended in place. Write no second copy of any of them.

**The exported contract Task 5 consumes.** Spell these exactly, because Task 5's file restates them:

- `openPgliteEngine({ dataDir } = {})`: the current `openPglite`, generalised. With `dataDir` absent it creates and removes its own temporary directory, as today. With `dataDir` given it opens that directory and **never removes it**. Either way it returns `{ name: 'pglite', run, timed, reopen, close }`, with `run(statements)` resolving to one text answer per statement, as today.
- `openPostgresEngine(repoRoot, { database = 'bm25_history_probe', create = true } = {})`: the current `openPostgres`, generalised. With `create: true` it runs `DROP DATABASE IF EXISTS` and `CREATE DATABASE` before use, and drops the database on `close`, as today. With `create: false` it attaches to an existing database and drops nothing. It returns `{ name: 'postgres', run, timed, close }`.
- `spillAvailable(engine)`: resolves to `true` when `SELECT count(*) FROM pg_proc WHERE proname = 'bm25_spill_index'` reads a non-zero count, else `false`.
- `readIndexState(engine, queries, { limit, keys })`: one step's whole reading, `{ summary, plans: { probe, store }, scores, forced, diagnostics }`. `summary` is `parseSummary`'s object. `plans.probe` and `plans.store` are the scan line and output line of `EXPLAIN (VERBOSE, COSTS OFF)`, over the probe's score statement at `limit` and over the store's own `SELECT id FROM chunks ORDER BY <BM25_ORDER_CLAUSE> LIMIT $2` at `ARM_CANDIDATES` (imported from `cli/dist/retrieval/search.js`, never retyped). `scores` is `qid -> key -> { scan, operator, scanRaw, operatorRaw }`. `forced` is `undefined` when `plans.probe` is the `chunks_bm25` index scan. Otherwise it is `{ plan, scores }`, read under `SET enable_seqscan = off` in the same `run` call and `RESET` after it. `diagnostics` is the object defined in the second Work bullet, for `scores` and, when present, for `forced.scores`.
- `differencesByColumn(reference, scores, keys)` and `SCORE_COLUMNS` (`['scan', 'operator']`), exported unchanged in meaning.
- `renderIndexState(id, label, state)`: the text lines one step prints. Task 5 prints its steps through it, so both modules' output reads the same.

**Work:**

- [ ] **Engines and statements.** Generalise `openPglite` and `openPostgres` into `openPgliteEngine` and `openPostgresEngine` as specified above, and keep `measureBm25History` calling them with today's defaults. Add these to `STATEMENTS`:
  - `spill`: `SELECT bm25_spill_index('chunks_bm25')`, with the index name from `BM25_INDEX`;
  - `spillAvailable`: the `pg_proc` count above;
  - `explainStore`: the store's statement under `EXPLAIN (VERBOSE, COSTS OFF)`;
  - `lengths`: `SELECT key, (SELECT coalesce(sum(array_length(positions, 1)), 0) FROM unnest(to_tsvector('<config>', text))) FROM chunks`. `<config>` is read out of `BM25_INDEX_DEFINITION`'s `text_config='…'` by a regular expression and never retyped. If that read fails, refuse by name.

  The score statement gains a third, diagnostic column, `operator_exact`: `(<BM25_ORDER_CLAUSE>)::float8`, unrounded. The `scan` and `operator` columns stay exactly as defined, and `SCORE_COLUMNS` stays the two of them. Nothing anywhere sets `enable_indexscan`.
- [ ] **Per-step diagnostics** (`diagnostics`), computed on the client from one step's scores and its `lengths` answer:
  - (a) hits, and hits whose six-decimal `scan` differs from `operator`.
  - (b) Of those, how many have `Math.fround(scanRaw) === Math.fround(operatorRaw)`. That is an exact test of "the scan score is the operator's value stored as a `real`", and the rest are reported as **differing beyond `real` storage**.
  - (c) The largest `|scan − operator|`, with its query and key.
  - (d) The (b) remainder split by document length, at most 39 against more than 39. The boundary is the task prompt's fieldnorm lead and is labelled as such.
  - (e) `Σ length` over the rows, beside `summary.totalLen`, printed as equal or not. The verdict that governs (d) is taken once per run, at the sequence's first step (`t0` or `s0`), where the index holds no dead row. When that verdict is unequal, every step's (d) is withheld and the line says the length definition is not the index's. A later step with dead rows prints its own pair but does not re-decide.
  - (f) Order inversions: adjacent rows of one query, in returned order, whose `operatorRaw` values are strictly out of the statement's ascending order. Count them and list every one for `fixture-catalog`, and the first 20 for `self-docs`, with both keys and all three values.
  - (g) The same count against `scanRaw`, where any non-zero count is itself a finding.
- [ ] **The index-state sequence**, `measureBm25States({ repoRoot, engine, corpus, repeat = 1 })`, over corpus A's rows alone, with corpus A's query set and `limit` = A's chunk count:
  - `t0`: drop the table, create the table and the empty index, insert A. This is the fresh-insert index.
  - `t1`: `STATEMENTS.spill`, issued only when `spillAvailable(engine)` is true. Otherwise the step is reported as `bm25_spill_index not available on <engine>` and skipped.
  - `t2`: PGlite only, close and reopen the data directory.
  - `t3`: `REINDEX INDEX chunks_bm25`.
  - `t4`: drop the table, create the table, insert A, then `CREATE INDEX chunks_bm25 …` over the loaded table.

  Each step is one `readIndexState`. The sequence prints, per column and for every pair of steps, the number of A hits whose score differs. It returns the same envelope `measureBm25History` returns: engine, `ranAt`, server, `extversion`, corpus stamp, query count, and steps. The history sequence (`s0`–`s7`) also switches to `readIndexState`, so it gains the plans, the forced re-score and the diagnostics without changing its steps.
- [ ] **Repeat mode.** With `repeat > 1`, every step of either sequence scores its queries `repeat` times. On Postgres each repetition is its own `run` call, so it runs in its own `psql` process and backend. The first repetition is the step's recorded scoring. Every (query, key, column) value of a later repetition that differs from the first is listed as `disagrees <step> r<i> <qid> <key> <column>: <first> <this>`, and nothing is replaced, dropped or averaged. Each step with `repeat > 1` also prints three things: `bm25_summarize_index` before the first repetition and after the last; `autovacuum_count` before and after, on Postgres; and the number of values compared.
- [ ] **Launcher, captures, header and README.**
  - `runBm25HistoryLauncher` gains `--sequence <history|states>`, defaulting to `history` so every earlier command still runs, and `--repeat <n>`, a positive integer defaulting to 1. `--other` is refused with `--sequence states`. `--compare` and `--reindex-cost` are unchanged.
  - Capture `score` lines become `score <step> <qid> <key> <scan> <operator> <scanRaw> <operatorRaw>`, with repetitions after the first written as step `<step>.r<i>`. `compareBm25Captures` parses the four value fields from the right and compares `scan` and `operator`. A capture in the old two-value form is refused by name.
  - Amend the module header with the states sequence, the forced re-score and why it is not a disabled index scan, the third column and the `real` test, and the repeat mode. Cite the task prompt's `pg_textsearch` source and issue leads as leads.
  - Add the `evals/docs-retrieval/README.md` row: `bm25-history.mjs`, what it owns, and that `docs/retrieval-eval.md` gives its launcher.

**Verification:**

- `grep -n 'enable_indexscan' evals/docs-retrieval/bm25-history.mjs` finds nothing. `grep -n 'enable_seqscan' evals/docs-retrieval/bm25-history.mjs` finds only the forced re-score's `SET` and its `RESET`.
- One smoke run of each sequence, through the scratch runner, completes and prints every step's plan lines, its diagnostics and its pairwise counts. The launcher is a file `harness-runs/scratch/bm25-history.mjs` that imports `runBm25HistoryLauncher` and calls it with `process.argv.slice(2)`. Its output is not recorded anywhere (`cli/dist` must be built first, with `npm run build`):
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --sequence states --engine pglite --corpus fixture-catalog
  ```
  ```
  bash scripts/scratch-run.sh harness-runs/scratch/bm25-history.mjs --engine pglite --corpus fixture-catalog --other self-docs --repeat 2
  ```
- Two captures from the second smoke command, given to `--compare`, print the `captures: 2, values compared: …` line. A hand-made capture line in the old two-value form is refused by name.
- `performance.now` still appears only inside the `timed` methods, so no step but `--reindex-cost`'s measures time.
