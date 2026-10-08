### Task 1 — Commit the statement-level BM25 history probe and record what it measures on PGlite and on the compose Postgres

**Goal:** Meet goal 1 of the task prompt, "the cause is measured, not inferred": commit a probe that runs one fixed sequence of SQL statements against a `chunks` table carrying the store's own BM25 index, on both engines, and prints the BM25 scores and the index's own corpus statistics after every step. Record the sequence, its setup and its figures in the document of record, so a reader can re-run it. This task changes no shipped behaviour.

**What the probe must settle, each as a measured line rather than an inference:**

1. **Deleted rows stay counted.** After a `DELETE`, `bm25_summarize_index('chunks_bm25')` still reports the deleted rows in `total_docs` and `total_len`, and the surviving rows' scores differ from a fresh index of the survivors.
2. **Rows from another corpus are the same defect.** The table holds corpus A ∪ corpus B, and B's rows are then deleted, as a refresh to corpus A deletes them. After that, A's scores equal neither a fresh index of A nor the A ∪ B ones. A `SELECT count(*)` shows that B's rows are gone from the heap, so it is their statistics that remain, not the rows themselves. That answers the prompt's "two different defects" lead.
3. **An update is a delete too.** An `INSERT … ON CONFLICT (key) DO UPDATE` of a stored key skews the scores, in the same way.
4. **What `VACUUM` does and does not do.** After `VACUUM chunks`, the summary shows the memtable spilled to a segment, and the scores are still not the fresh ones. The planning session found exactly this on PGlite. The compose Postgres must be measured, not assumed, because autovacuum runs there.
5. **What `REINDEX` does.** After `REINDEX INDEX chunks_bm25`, **every** hit of **every** query scores as in a fresh index of the live rows, to six decimals, at real chunk lengths. This is the story index's first `Top risks:` entry. If any hit differs, stop: report the corpus, query, key and both scores to the maintainer, and record nothing as a fix basis.

**Sources the implementer reads first:**

- `docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`, item 3: the comparison's own probe statement, its setup and the `round(…, 6)` form. This probe reuses that statement shape so its figures are comparable.
- `cli/test/docs-retrieval-store.test.mjs`: how a caller composes `CHUNKS_TABLE`, `BM25_INDEX`, `BM25_INDEX_DEFINITION`, `BM25_ORDER_CLAUSE`, `CHUNK_TEXT_COLUMN` and `chunkEmbeddingColumn` from `cli/dist/retrieval/store.js` rather than retyping them (`cli/src/retrieval/store.ts` → the module header's second paragraph).
- `evals/docs-retrieval/cold-build.mjs` and `docs/retrieval-eval.md` → `### The cold-build and query-log launchers`: the module-header and launcher pattern a measurement module follows (an exported function, driven by a launcher under `harness-runs/scratch/` through `bash scripts/scratch-run.sh`).
- `evals/docs-retrieval/python-backend.mjs`: how the eval reaches the compose database and the default URL (`cli/src/retrieval/pythonBackend.ts` → `pythonDatabaseUrl`).
- `pg_textsearch` 1.3.1 source, tag `v1.3.1` of `github.com/timescale/pg_textsearch`: `src/scoring/bm25.c`, `src/access/vacuum.c` → `tp_bulkdelete`, and `src/index/metapage.h` → the `total_docs` invariant comment. Cite these by path and tag beside the figures. The probe is the evidence, and the source explains it.

### Targets

- `evals/docs-retrieval/bm25-history.mjs` (new): the probe module, with a header carrying *"The rule this module exists to enforce"*.
- `docs/retrieval-eval.md`: a new subsection under `## How to run it` (after `### The cold-build and query-log launchers`) giving the launcher's contents and the run commands in fenced blocks, one command per line.
- `docs/retrieval-eval-results.md`: a new subsection `### The index's history, measured` inside `## The Python backend against the TypeScript one`, placed after `### Divergence sources, in the order checked`. It carries the statements, the setup and the figures. Task 9 later rewires item 3 and the Finding paragraph to cite it, and this task edits neither.

**Work:**

- [ ] `bm25-history.mjs`: export a function that takes an engine (`pglite`, with a fresh persistent data directory under the system temp directory, opened as `PGlite.create({ dataDir, extensions: { vector, pg_textsearch } })` through `cli/dist/retrieval/runtime.js` → `loadRetrievalModule`; or `postgres`, a database created with `CREATE DATABASE <name>` after `DROP DATABASE IF EXISTS <name>` on the compose server and dropped afterwards) and a pair of corpora. Every value is bound, and every statement is composed from the `cli/dist` store constants. Rows are the real chunks of the named corpora, chunked through `cli/dist/retrieval/chunk.js`. The embedding column carries a constant vector, because no score here reads it. On the `postgres` engine, statements go through `docker compose exec -T postgres psql -At -F ' ' -c <statement>` from `docs-retrieval-service/`, exactly as item 3's probe did, and are spawned with a fixed argument vector.
- [ ] The sequence, with the scores of every query of the corpus's query set (all hits, not the top five) and the `bm25_summarize_index` corpus-statistics lines captured after each step: (s0) fresh index of A, the reference; (s1) a new table and index, insert A ∪ B; (s2) `DELETE` B's keys and confirm the heap count; (s3) PGlite only: close and reopen the data directory; (s4) `VACUUM chunks`; (s5) `REINDEX INDEX chunks_bm25`; (s6) `ON CONFLICT … DO UPDATE` one A key to other text and back; (s7) `REINDEX INDEX chunks_bm25`. Report per step: the number of hits whose score differs from s0's at six decimals, and the first three such keys with both scores.
- [ ] Run it for `fixture-catalog` (A) with `self-docs` as B, and for `self-docs` (A) with `fixture-catalog` as B, on both engines. Those four runs are the figures of record. Capture their output under `harness-runs/scratch/bm25-history/`, which is gitignored, and record from those captures alone.
- [ ] The rebuild-cost seam: an opt-in flag on the launcher that times step s5 alone on `self-docs`, on each engine, and prints the milliseconds. Its figure is a wall-clock one, so this task does **not** record it. Document the hand-run command and its capture path, `harness-runs/scratch/bm25-history/reindex-cost.txt`, for the operator (`harness-runs/lessons.md` → `## Evidence and measurement` → the wall-clock rule). Task 9 transcribes it.
- [ ] `docs/retrieval-eval-results.md` → `### The index's history, measured`: who reads it; the four runs' setup (engine, server version from `SELECT version()`, `pg_extension.extversion`, corpus stamps, date); the statements verbatim; one table per run, giving step × (`total_docs`, `total_len`, hits differing from s0); and the conclusion each of the five points above reaches, each citing its row and the source file that explains it. `docs/retrieval-eval.md` gets the launcher and the commands.

**Verification:**

- Each of the five points above is answered by a row of the recorded tables, not by prose. Point 5 reads "0 differing hits" on all four runs. If it does not, the task stops and reports, as stated above.
- Re-running the documented commands reproduces every recorded score, because the probe measures no time except under the opt-in flag.
- `bash scripts/run-gates.sh` passes on this machine. `bash scripts/check-eval-artifacts.sh` passes, so the new module names no machine-local path and the recorded setup names none either (`.claude/context/conventions.md` → `## The testing bar`, the self-containment gate).
- Grep the recorded subsection for a millisecond figure and find none.

**Deviations from plan:**

- **Stopped before recording, under this plan's own point-5 stop rule.** `evals/docs-retrieval/bm25-history.mjs` is written and was run, but neither document was edited. On the compose Postgres, the index-scan score statement does not return the same score every time. Over five runs of `self-docs` (A) against `fixture-catalog` (B), three runs each returned exactly one (query, key) score that no other run returned:
  - `s0 q-sd-search-abstains docs/analyze.md#8-how-this-is-verified`: −0.221485 in one run, −0.735353 in the others. In that run, `s5` and `s7` each read **1 differing hit** against `s0`: that key, s0 −0.221485, s5 −0.735353.
  - `s1 q-sd-cross-asset-reference docs/github-run-control.md#5-lifecycle-comments-and-state-labels`: −0.341426 against −1.891997.
  - `s2 q-sd-analyze-writes docs/development.md#7-releasing`: −1.629181 against −4.567675.
  - **The four runs of record.** These are the first run of each corpus × engine pair. All four read 0 differing hits at `s5` and at `s7`, but the Postgres `self-docs` run is one of the runs above that carries a stray value, at `s2`. So *"re-running reproduces every recorded score"* does not hold on Postgres.
- **What the scratch checks showed, and how.**
  - **The scan is the source.** The same probe was run with `SET enable_indexscan = off` before the score statements, through a scratch copy of the module. Three runs per engine on `self-docs` gave byte-identical score sets within each engine. The Postgres score set equals the modal index-scan one, and the PGlite score set equals the PGlite index-scan run's. Separately, 15 repeats of all 20 `self-docs` queries against one fixed Postgres table returned one stray line under the index scan and none with `enable_indexscan = off`.
  - **Point 5 under that scoring.** With the index scan disabled, `s5` and `s7` read 0 differing hits on every run.
  - **Who decides.** Whether the probe should score through the index scan, as item 3's statement and the store do, or with it disabled, is the maintainer's call. That stray score may also be Task 3's near-tie lead.
- **Postgres statements go to psql on stdin, not through `-c`.** The largest `self-docs` chunk is 410221 bytes, larger than Linux's 131072-byte limit on one argument. `-c` also cannot carry a `\bind` beside its SQL. Values are bound through `\bind`, and the flags stay `-At -F ' '`.
- **Point 2's expectation is not what was measured.** After `DELETE` of B, A's scores **equal** the A ∪ B ones: 0 hits differ from `s1` on all four runs, apart from the stray Postgres value above. They do not "equal neither".
- **What the four runs of record show, for the eventual record.** Captures are under `harness-runs/scratch/bm25-history/`.
  - **`s2`.** `total_docs` and `total_len` are unchanged by the `DELETE`.
  - **`s3`, PGlite only.** The reopen spills the memtable to a second segment, and the statistics are unchanged.
  - **`s4`, `VACUUM`.** It drops a segment only when every document in it is dead. With A = `fixture-catalog`, `total_docs` falls from 429 to 273 against 41 live rows. With A = `self-docs`, it stays 429 against 388.
  - **`s5` and `s7`, `REINDEX`.** `total_docs` equals the live rows.
  - **`s6`.** The two upserts add 2 to `total_docs`.
  - **`autovacuum_count`.** It read 0 at every Postgres step.
