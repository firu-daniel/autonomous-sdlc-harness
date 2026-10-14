# Story: BM25 scores that depend on the index's history — measured, fixed on both backends, recorded

## Context

`feat_docs_retrieval_backend_comparison` found that the Python docs-retrieval backend's lexical (BM25) scores depend on what its database held before, and recorded the finding without acting on it (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → the paragraph opening **Finding — a defect, recorded and not acted on.**, and `### Divergence sources, in the order checked`, item 3). This branch measures the cause, finds where the index scan's occasional stray score comes from, fixes the history dependence on every backend that carries it, pins the fix with a test on each, explains or records the near-tie ordering, and corrects the comparison's record.

**What the planning sessions established, and what they did not.** These are leads the tasks re-take under a committed probe. None of them is a figure of record.

- **The `pg_textsearch` 1.3.1 source** (tag `v1.3.1` of `github.com/timescale/pg_textsearch`) composes BM25's `N` and average document length from `metap->total_docs` / `metap->total_len` plus the in-flight memtable's own totals (`src/scoring/bm25.c` → the `total_docs64` / `total_len64` composition). Postgres never calls an index access method on a `DELETE` or an `UPDATE`, so every dead heap tuple stays counted until `VACUUM`. `VACUUM` then spills the memtable to a segment and flips the dead documents' bits in that segment's alive-bitset, but `total_docs` tracks `Σ segment.num_docs`, which a bitset flip does not change. Only a segment whose every document is dead is dropped and subtracted (`src/access/vacuum.c` → `tp_bulkdelete`, Phase 3; `src/index/metapage.h` → the `total_docs` invariant comment). A merge excludes dead documents (`src/segment/merge.c`), and a `REINDEX` rebuilds from live rows only.
- **A projected score is one of two computations.** A `SELECT` column whose expression is exactly the `ORDER BY` expression is replaced by the planner with `bm25_get_current_score()`, which returns the score the index scan ranked that row by (`src/planner/hooks.c` → `replace_scores_in_targetlist`; `src/access/scan.c` → `tp_cached_score`, set in `tp_gettuple`). Any other column, `round((text <@> …)::numeric, 6)` included, runs the standalone operator from the row's own text, with a per-query IDF cache in `fn_extra` (`src/types/query.c` → `bm25_text_bm25query_score`, `cache_is_valid`). Every figure taken so far, item 3's and the first attempt's, read the second one; the store ranks by the first and projects no score. So every score statement on this branch reads both, as two named columns: `scan` (the bare `BM25_ORDER_CLAUSE`) and `operator` (the `round(…)` form). Both go through the index scan, which is never disabled (task prompt → `## Constraints`).
- **The first implementation attempt's probe** (`evals/docs-retrieval/bm25-history.mjs`, committed in `78731f0`; captures under `harness-runs/scratch/bm25-history/`, gitignored), `operator` column only, four runs of record, `fixture-catalog` and `self-docs` each as A with the other as B, on PGlite and the compose Postgres: a `DELETE` left `total_docs` and `total_len` unchanged; after deleting B, A's scores still **equal** the A ∪ B ones (0 hits differ from `s1`), so other corpora's statistics outlive their rows; a PGlite reopen spilled the memtable without changing the statistics; `VACUUM` dropped a segment only when every document in it was dead (A = `fixture-catalog`: `total_docs` 429 → 273 against 41 live rows; A = `self-docs`: 429 against 388); after `REINDEX`, `total_docs` equalled the live rows and 0 hits differed from a fresh index; two upserts of one key added 2 to `total_docs`; `autovacuum_count` read 0 at every Postgres step.
- **The stray score** (task prompt → `## A second defect, found while implementing Task 1`). On the compose Postgres the index-scan statement sometimes returned one (query, key) value no other run returned, in the `operator` column, and none with the index scan off. PGlite showed none. Task 2 finds where it comes from.
- **Consequences for the prompt's leads.** "Rows from other corpora" and "deleted rows still counted" are one defect: a refresh deletes the other corpus's keys, and their tuples stay in the statistics. The TypeScript persistent index is expected to carry it too, because PGlite runs the same extension and has no autovacuum, so goal 3 is expected to become a fix rather than a recorded absence. Task 4 measures that rather than assuming it.

**The fix route, decided with the maintainer.** At the end of a refresh that left a dead tuple behind, the store runs `REINDEX INDEX chunks_bm25`. A dead tuple is left behind when the refresh cleared the table (an embedder change), deleted any key, or re-embedded a key that was already stored, which is an `ON CONFLICT … DO UPDATE`. A refresh that only inserted new keys, or changed nothing, pays nothing. The alternatives are rejected. `VACUUM` is rejected on both the source and the probe. Indexing each corpus into its own database fixes the eval but not an adopter's refresh, as the task prompt says. `RefreshResult` keeps its shape on both backends, so neither the wire nor the parity surfaces move. The rule is the same on both backends, and each states it once, in its refresh module.

**The stray-score gate, decided with the maintainer: measure both columns, and stop on a wrong value in either.** Task 2 takes exactly one exit. If the stray traces into `pg_textsearch`'s own code, in either column, the branch stops there and the maintainer is asked; nothing is retried, re-scored, averaged, toleranced or routed around by switching columns (task prompt → `## A second defect, found while implementing Task 1` → **What is wanted:**, point 4). If it comes from the column shape our probe or a test asks for, and the store's own ordering is shown unaffected, the column shape is the fix and the branch continues. If it comes from a store's statement, configuration or call, the branch stops before Task 4 and the plan is extended with a fix task and a test task per affected backend. Tasks 3 to 10 run only after Task 2 has cleared the gate.

**Why the measurement tasks come before the fixes.** The ship order is Tasks 1 to 4 (`general`), then Tasks 5 and 6 (`cli`), then Tasks 7 to 10 (`general`), which departs from catch-all-last for the measurement tasks only. Goal 3's before-fix figures are refresh-level: `docs index` into a data directory, then a refresh after deletes. They can only be taken while the code they measure is still unfixed. Tasks 1 to 4 change no shipped behaviour. They commit probes and record figures. Within the fix itself the order is bottom-up: the TypeScript store, which the Python package ports, ships first, then its Python port.

**The re-take, decided with the maintainer.** Task 10 re-runs both `@python` blocks through the existing launchers, so arms B, D and E are re-taken from the blocks themselves. The database is deliberately not emptied first, and that is recorded, because the re-take is then itself evidence that the history no longer matters. Every wall-clock figure in the write-up stays as the 2026-10-08 sitting recorded it, and the write-up says that it predates the fix. The re-run blocks' own latency columns are labelled as a post-fix, non-idle measurement and are cited nowhere (`harness-runs/lessons.md` → `## Evidence and measurement` → the wall-clock rule).

**Top risks:**

1. **A `REINDEX`-built index scoring differently from a fresh-insert one at real chunk lengths, in the `scan` column.** A `REINDEX` writes a segment, and segments store document lengths above 39 tokens approximately (`src/segment/fieldnorm.h`: about 6% relative error), while a fresh-insert index scores from its memtable. The 0-differing-hits result so far was read in the `operator` column only, which takes lengths from the row's own text. If any hit of any query on `fixture-catalog` or `self-docs` differs in either column, the rule cannot meet goal 2. Task 1 checks every hit in both columns, and a difference stops the branch and is reported to the maintainer. It is never absorbed into a tolerance.
2. **The stray score lives in the extension.** Then the branch stops at Task 2, by the gate above, and every exact comparison Tasks 4 to 10 make waits on the maintainer.
3. **The rebuild holds a lock.** `REINDEX INDEX` takes an `ACCESS EXCLUSIVE` lock on the index while it runs. On the Python backend, a second server sharing the database waits for that long. Within one Python server, calls are already serialised under `session.lock` (`docs-retrieval-service/src/harness_docs_retrieval/service.py` → `answer`'s `async with session.lock`), so a refresh's rebuild never races a search in the same process. Its cost on `self-docs` is a wall-clock figure, so it enters a document of record only from an operator's hand run (Task 1 ships the seam, and Task 10 transcribes the capture).
4. **A test that passes for the wrong reason.** A refresh test whose fresh index and refreshed index both carry dead rows, or neither does, would pass with or without the fix. Tasks 6 and 8 are each shown failing with the rebuild call removed before they are accepted.

**Manual setup required** (before `/autonomous-sdlc-harness:branch-implement-plan`, from the repository root unless stated otherwise):

- `bash scripts/python-service.sh sync --with-models`: this worktree's Python environment is not synced. The weight cache under `~/.cache/harness-docs-retrieval/models` is present, so no weight is downloaded.
- From `docs-retrieval-service/`: `docker compose up -d --wait postgres`.
- After Task 1 lands, the `self-docs` rebuild-cost capture, taken by hand outside any headless session on an otherwise idle machine, with the command Task 1 documents. Task 10 transcribes it if it exists, and records the cost as not measured by hand if it does not.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that task's commit lands. `[ ]` markers anywhere else are informational only.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_docs_retrieval_bm25_index_history/task_<K>_plan.md`.

1. [ ] **Task 1** — Score both columns in the committed statement-level probe and record what it measures on PGlite and on the compose Postgres _(layer: general)_ _(points: 5)_
2. [ ] **Task 2** — Find where the index scan's stray score comes from, and stop if it is in `pg_textsearch` _(layer: general)_ _(points: 8)_
3. [ ] **Task 3** — Explain the near-tie ordering on an empty database, or record it as still unexplained _(layer: general)_ _(points: 3)_
4. [ ] **Task 4** — Measure the refresh-level history dependence on both backends before the fix _(layer: general)_ _(points: 5)_
5. [ ] **Task 5** — Rebuild the BM25 index after a refresh that leaves a dead row, in the TypeScript store and refresh _(layer: cli)_ _(points: 5)_
6. [ ] **Task 6** — Pin the TypeScript fix with a refresh-against-fresh-index score test _(layer: cli)_ _(points: 5)_
7. [ ] **Task 7** — Port the rebuild to the Python store and refresh, with its statement-parity assertion _(layer: general)_ _(points: 5)_
8. [ ] **Task 8** — Pin the Python fix with a container test beside the package's own _(layer: general)_ _(points: 5)_
9. [ ] **Task 9** — Re-take the refresh-level measurement after the fix and correct the behaviour documents _(layer: general)_ _(points: 3)_
10. [ ] **Task 10** — Re-take the `@python` blocks and correct the comparison's record _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Update the defect paragraph and item 3 in `docs/retrieval-eval-results.md` to what this branch measured and fixed."* It is widened to every documentation site stating that the lexical scores depend on the index's history, or describing the refresh this branch changes, because the fix makes each such site stale.

**Derivation entry — corpus files (command).** Re-run verbatim from the repository root:

```
git grep -nE "index's history|database's history|depend on what its|delete-and-insert|\*\*Incremental refresh\.\*\*|near-tie" -- docs docs-retrieval-service/README.md
```

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** that ledger. **Traversal:** its topic headings in file order, then the rules under each. **Decision rule:** a rule is reached when it names BM25, the retrieval refresh, or this comparison's figures. None is reached: the `## Evidence and measurement` rules govern how this branch measures, and Task 1, Task 10 and risk 3 apply them, but none states a fact this branch makes stale.

**Closure invariant:** every site either entry reaches appears as a row below.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/retrieval-eval-results.md` → `### Which case this is` ("which is the Python index's history in its database") | — | command entry, `index's history` | `change` | Task 10 |
| 2 | `docs/retrieval-eval-results.md` → `### Which case this is`, unexplained bullets ("how arms D and E split between the index's history and model precision"; "two near-tie swaps in arm B that remain on a fresh database") | — | command entry, `index's history`, `near-tie` | `change` | Task 10 |
| 3 | `docs/retrieval-eval-results.md` → `### Divergence sources, in the order checked`, item 3 (**What it shows.** "the Python database's history", "delete-and-insert path, and was not measured"; **What stays unexplained.** "near-tie pair") | — | command entry, `database's history`, `delete-and-insert`, `near-tie` | `change` | Task 10, from Tasks 1–4's measurements |
| 4 | `docs/retrieval-eval-results.md` → item 4, **Arms D and E** ("carry the database's history") | — | command entry, `database's history` | `change` | Task 10 |
| 5 | `docs/retrieval-eval-results.md` → **Finding — a defect, recorded and not acted on.** ("depend on what its database held before") | — | command entry, `depend on what its` | `change` | Task 10 |
| 6 | `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one`, step 3's paragraph ("corpus *and* the database's history") | — | command entry, `database's history` | `change` | Task 9 |
| 7 | `docs/retrieval.md` → **Incremental refresh.** | — | command entry, `**Incremental refresh.**` | `change` | Task 9 — gains the rebuild rule |
