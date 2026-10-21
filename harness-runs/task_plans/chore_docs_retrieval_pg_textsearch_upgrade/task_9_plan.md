### Task 9 — Re-take the stray index-scan score on 1.5.1, and reduce it to a standalone reproduction if it survives

**Goal:** Re-take goal 3 of the diagnosis on the compose Postgres with `self-docs`, on `pg_textsearch` 1.5.1: the states sequence with `--repeat 30` and the history sequence with `--repeat 15`. Then answer goal 4.

- **If the stray is gone**, say so with the counts.
- **If it survives**, reduce it to a standalone SQL reproduction that needs nothing from this repository, and record whether the memtable is still emptied during a workload that only reads.

The leads are in the story index's `## Context`. `timescale/pg_textsearch#516` was closed before `v1.5.0`. The 1.3.1 conclusion found the stray consistent with `#516`'s description. `#557` is open on 1.5.1.

**Depends on:** Task 8. Task 8 created `### The deciding figures on pg_textsearch 1.5.1` with its lead paragraph, its comparison rule and its setup part, `#### How these were taken, on 1.5.1`, which holds both engines' version readings. This task adds its own part after Task 8's `#### The near-tie ordering, on 1.5.1`.

**Where this task stops.** It owns `#### The stray index-scan score, on 1.5.1` and nothing else. It does not edit the 1.3.1 `### The stray index-scan score`, and it **files and comments on nothing upstream**: reporting a surviving stray is the maintainer's, from this task's reproduction. It retries nothing, averages nothing and sets nothing aside: every disagreeing value is counted.

### Targets

- `docs/retrieval-eval-results.md`: `#### The stray index-scan score, on 1.5.1`.

**Work:**

- [ ] **Read the compose engine's version before any run**: `SHOW pg_textsearch.library_version`, which must read `1.5.1`, as in Task 8. Stop and report if it does not.
- [ ] **The runs**, with the commands of `docs/retrieval-eval.md` → `### The BM25 index-state probe`, through `harness-runs/scratch/bm25-history.mjs`. Take every run before editing the document, and note each run's `self-docs` stamp.
  - The states sequence with `--engine postgres --corpus self-docs --repeat 30`, twice, the shape the 1.3.1 Postgres `self-docs` runs had, each with `--capture`.
  - The history sequence with `--engine postgres --corpus self-docs --other fixture-catalog --repeat 15`, once, with `--capture`.

  From each capture, read the per-step memtable documents before and after, the values compared, the disagreeing `scan` and `operator` counts, and `bm25_summarize_index` and `autovacuum_count` across the repetitions. These are the same columns as the 1.3.1 **Per engine, corpus and state.** table.
- [ ] **If no value disagrees in any block: the stray is gone.** Write the part as that table with its counts. Say whether any block's memtable was still emptied during the read-only repetitions, which the summaries before and after show. Compare structurally with the 1.3.1 table: the 1.3.1 runs found `operator` strays of 1 in 548216 values compared in each states-sequence run, and 0 in 264656 and 1 in 269920 in the history run.
- [ ] **If any value disagrees: the stray survives.** Do all of the following:
  - Record the table and the locating detail, in the 1.3.1 part's shape.
  - Record whether the memtable is still emptied during a workload that only reads.
  - Write a standalone SQL script that creates its own table and rows (for example with `generate_series`), creates the `bm25` index, leaves memtable documents beside segments, and repeats a score statement in separate sessions. It needs nothing from this repository. Shape it like the `#573` reproduction quoted in that issue: read `#573` with `gh issue view 573 --repo timescale/pg_textsearch` where that command works, and if it does not, say in the part that the issue was not read and that the shape is the generic one.
  - Run the script on the compose server, in a scratch database dropped afterwards (`docker compose -f docs-retrieval-service/compose.yaml cp` the file in, then `psql -f` it), until it shows the stray, or until it has run as many repetitions as the probe run that showed it. Record it in a fenced block beside the figures, with its run count and what it printed.
  - If it never shows the stray, record that, with its repetition count, rather than tuning it to a value.
- [ ] **Changed or unchanged.** Close the part with one line per 1.3.1 figure of `### The stray index-scan score` → **The trace, from the tables above.**: whether 1.5.1 changed it. Cover: memtable against segment (item 1), the column (item 2), the changing index (item 3), and the `scan` moves when the memtable is emptied, 278 values at the 1.3.1 stamp. Each line names both stamps where they differ.

**Verification:**

- Every run's summary reads `pg_textsearch: 1.5.1`. Every block of every run appears in the part's table with its values-compared count.
- Exactly one of "gone, with the counts" and "survives, with the standalone script" is written. If the script is there, it creates every object it uses and names no path, table or corpus of this repository.
- No upstream issue or comment was created: `gh` was used, if at all, for `gh issue view` alone.
- `git diff docs/retrieval-eval-results.md` adds lines only directly after Task 8's `#### The near-tie ordering, on 1.5.1` part.
